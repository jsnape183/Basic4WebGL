# Monaco Editor Improvements — Research & Scoping

> Generated: 2026-05-24  
> Purpose: Size and catalogue all Monaco improvement options so the team can decide what goes into Phase 1.  
> Not a spec. Decisions made here feed the next brainstorm → spec → plan cycle.

---

## 1. Current State Audit

### What we have

| Area | Current |
|---|---|
| Package | `@monaco-editor/react` 4.7.0 (wraps Monaco ~0.47) |
| Language ID | `softBasic` |
| Tokeniser | Monarch (`setMonarchTokensProvider`) |
| Highlighting rules | 24 hand-coded regex patterns in `src/monacoHelpers/index.ts` |
| Theme | Custom dark (`softBasicTheme`) — good, no changes needed |
| Intellisense | None |
| Error markers | None — errors only appear as text in the bottom console |
| Language config | None — no bracket matching, comment shortcut, auto-indent |

### The divergence problem

The Monarch rules in `monacoHelpers/index.ts` are **manually maintained** and have already drifted from the real grammar in `TokenResolver.ts`. Current gaps:

- **Missing keywords**: `endif`, `endclass`, `constructor`, `endconstructor`, `do`, `until`, `to`, `as`, `true`, `false`
- **Phantom keyword**: `clone` appears in Monaco but is not a compiler token
- **Lifecycle events** (`onupdate`, `onkeydown`, etc.) are hardcoded as a Monaco concept — they are plain `Variable` tokens to the compiler. This is fine, but means they'll drift if more events are added.
- No `==` or `!=` coloring — these operator forms don't exist in the language (`=` is both assignment and equality; `<>` is not-equals). The Monaco config currently accepts `/==/` which would incorrectly colour `= =`.

### Compilation pipeline (relevant for IDE features)

```
Edit → Redux store → useProjectForBuild (hook) → CompilerProject {lib, files}
  └─ lib:   package .bas files (softCore + softGfx modules)
  └─ files: user .bas files
                ↓
       Basic4WebGL.transpile(project)
  └─ lexer.lex() → Token[] per file
  └─ parser() → ParseResult { symbolTable, AST per file }  ← throws on first error
  └─ transpile() → JS string                                ← catches, returns Diagnostic
                ↓
       Diagnostic[] displayed in bottom panel console
```

Key limitations that affect IDE features:
- **Single-error stops**: the parser throws immediately on the first compilation error; only one error is ever returned per run
- **No end positions**: `SourceLocation` has `{ line, col, filename }` — no `endLine`/`endCol`, which Monaco needs to draw a squiggle range
- **On-demand only**: compilation only runs when ▶ Run is pressed; there is no background/edit-time compile path

---

## 2. Feature Inventory

Each feature is sized with an effort estimate:

| Label | Time |
|---|---|
| XS | < 1 hour |
| S | half a day |
| M | 1–2 days |
| L | 3–5 days |
| XL | 1–2 weeks |

---

### Feature A — Token-Linked Syntax Highlighting

**Effort: S · Risk: Low · Depends on: nothing**

**Problem:** The Monarch rules are hand-maintained regexes detached from the actual grammar. Every new keyword added to the compiler must also be added to the Monaco config manually, and the current config is already missing ten keywords.

**Solution:** Switch from individual regex rules to the Monarch *keyword list* pattern. Monaco's Monarch supports a `keywords` array and a `cases` match that classifies identifiers at tokenise time. The keyword list would be exported from a single const (e.g., `src/lib/Basic4WebGL/keywords.ts`) imported by both `TokenResolver.ts` and `monacoHelpers/index.ts`:

```ts
// src/lib/Basic4WebGL/keywords.ts
export const SOFTBASIC_KEYWORDS = [
  'dim', 'class', 'as', 'function', 'return', 'endfunction',
  'constructor', 'endconstructor', 'endclass',
  'if', 'endif', 'while', 'endwhile', 'for', 'next', 'to', 'in',
  'and', 'or', 'not', 'do', 'until', 'print', 'call',
  'true', 'false',
];

export const SOFTBASIC_LIFECYCLE_EVENTS = [
  'onenter', 'onupdate', 'onkeydown', 'onpointerdown', 'onpointermove',
];
```

```ts
// monacoHelpers/index.ts — Monarch rules
{
  keywords: SOFTBASIC_KEYWORDS,
  lifecycleEvents: SOFTBASIC_LIFECYCLE_EVENTS,
  tokenizer: {
    root: [
      [/'.*/, 'comment'],
      [/".*?"/, 'string'],
      [/[+-]?([0-9]*[.])?[0-9]+/, 'number'],
      [/[A-Za-z_][A-Za-z_$0-9]*/, {
        cases: {
          '@keywords': 'keyword',
          '@lifecycleEvents': 'type.identifier',  // amber — lifecycle event
          '@default': 'identifier',
        },
      }],
      [/[+\-*/]/, 'operator'],
      [/[<>]=?|<>/, 'operator'],
      [/[(),.]/, 'delimiter'],
    ],
  },
}
```

**What this fixes:**
- All 10 missing keywords get coloured correctly
- Removing `clone` phantom
- New keywords added in future only require updating `keywords.ts` — single source of truth
- Operators get their own colour

**Scope note:** This replaces the entire current Monarch definition. It's a clean rewrite, not an extension.

---

### Feature B — Language Configuration Bundle

**Effort: XS · Risk: Very Low · Depends on: nothing**

Monaco's `setLanguageConfiguration` API enables editor behaviours that are currently absent. All of these are zero-dependency, one-time declarations:

| Sub-feature | API | Effect |
|---|---|---|
| **Bracket matching** | `brackets: [['(', ')']]` | Highlights matching parens |
| **Auto-closing pairs** | `autoClosingPairs: [{ open: '"', close: '"' }, { open: '(', close: ')' }]` | Types `"` → inserts `""` |
| **Surrounding pairs** | `surroundingPairs` | Select text, type `"` → wraps it |
| **Comment shortcut** | `comments: { lineComment: "'" }` | Ctrl+/ toggles `'` comment |
| **Auto-indentation** | `indentationRules` + `onEnterRules` | Indent after `function`, `if`, `while`, `for`, `constructor`; outdent at `endfunction`, `endif`, etc. |

**Auto-indent rules example:**

```ts
onEnterRules: [
  {
    beforeText: /^\s*(function|if|while|for|constructor)\b.*/i,
    action: { indentAction: IndentAction.Indent },
  },
  {
    beforeText: /^\s*(endfunction|endif|endwhile|endclass|next|endconstructor)\b/i,
    action: { indentAction: IndentAction.Outdent },
  },
],
```

**Note on `Do`/`Until`:** These tokens exist in `tokens.ts` but are not yet implemented in the parser. Include them in the keyword list and language config now — they won't do anything until the parser supports them.

---

### Feature C — Status Bar Cursor Position

**Effort: XS · Risk: Very Low · Depends on: nothing**

The editor footer currently shows hardcoded `Ln 1, Col 1`. Monaco fires `onDidChangeCursorPosition` with accurate `{ lineNumber, column }`. This needs:

1. A state variable `cursorPosition` in `SBEditor` (or lifted to Redux)
2. An `editor.onDidChangeCursorPosition` listener registered via `onMount`
3. A prop/callback to pass it up to `EditPage`'s footer

The `@monaco-editor/react` `onMount` prop gives access to the raw editor instance.

---

### Feature D — Edit-Time Error Squiggles

**Effort: M (core) + M (blockers) = L total · Risk: Medium · Depends on: Blocker B1, Blocker B2**

This is the most valuable IDE feature but has two blockers that need resolving first.

**The happy path (once blockers are resolved):**

1. A new hook `useEditTimeCompiler(projectId)` watches all file content in Redux via a debounced selector (300 ms)
2. On trigger it calls `Basic4WebGL.parse(buildProject)` (lex + parse only, no transpile — faster)
3. The parse result's `diagnostics` are stored in a `diagnosticsSlice` in Redux
4. `SBEditor` reads diagnostics for its file, maps them to Monaco markers, calls `monaco.editor.setModelMarkers(model, 'softbasic', markers)`

**Diagnostic → marker mapping:**

```ts
const markers: monaco.editor.IMarkerData[] = diagnostics
  .filter(d => d.loc?.filename === file.name.replace('.bas', ''))
  .map(d => ({
    startLineNumber: d.loc!.line,
    startColumn: d.loc!.col,
    endLineNumber: d.loc!.endLine ?? d.loc!.line,
    endColumn: d.loc!.endCol ?? d.loc!.col + 1,  // after blocker B2 fix
    message: d.message,
    severity: monaco.MarkerSeverity.Error,
  }));
monaco.editor.setModelMarkers(model, 'softbasic', markers);
```

**Blocker B1 — Single-Error Compilation**

The current parser throws on the first error and stops. This means squiggles will only ever show one error at a time. To show multiple simultaneous errors, the parser needs *error recovery*: catch the error, record the diagnostic, skip tokens until a safe recovery point (e.g., a `NewLine`), and continue parsing.

Error recovery is a well-understood technique but requires significant refactoring of the parser loop in `parser/index.ts` and the per-file `parseFile` function. Estimate: M on its own.

**Blocker B2 — No End Positions**

`SourceLocation` currently has `{ line, col, filename }`. Monaco needs `{ startLine, startCol, endLine, endCol }` to draw a meaningful squiggle range. Without end positions, squiggles either underline just one character or need an approximation (e.g., underline to end of line).

Fix: extend `SourceLocation` with optional `endLine?: number; endCol?: number`. The lexer has the token text and can compute end col as `col + text.length`. This threads through `Token.loc()`, error constructors, and `Diagnostic`. Estimate: S.

**Web Worker consideration:**

Edit-time compilation runs on every keystroke (debounced). If a project has many files and/or the library, compilation can take tens of milliseconds. Running this on the main thread will block the UI. The compiler is pure TypeScript with no DOM dependencies — wrapping it in a Web Worker (via `comlink` or a manual `postMessage` bridge) is straightforward but requires build config changes (Vite Web Worker import syntax). Estimate for the worker wrapper: S.

---

### Feature E — Static Library Completions

**Effort: S · Risk: Low · Depends on: Feature A (for a cleaner model, not strictly required)**

All first-party library APIs are known statically at build time — the descriptor system already catalogues every module, method, and parameter. We can register a completion provider that fires when the user types `moduleName.`:

```ts
monaco.languages.registerCompletionItemProvider('softBasic', {
  triggerCharacters: ['.'],
  provideCompletionItems(model, position) {
    const wordAtPos = model.getWordUntilPosition(position);
    const line = model.getLineContent(position.lineNumber);
    const dotIndex = line.lastIndexOf('.', position.column - 2);
    const moduleName = line.slice(dotIndex < 0 ? 0 : ..., dotIndex).trim().toLowerCase();

    const methods = STATIC_COMPLETIONS[moduleName] ?? [];
    return { suggestions: methods.map(m => ({
      label: m.name,
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: m.snippet,          // e.g., "setPosition(${1:x}, ${2:y})"
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: m.description,
    })) };
  },
});
```

**Static completions catalogue:** build at startup time from the descriptor files. Each descriptor already has `methodName`, `params[]`, and could carry a `description` string. Currently descriptions are absent — adding one-line doc strings to descriptors is a small pre-requisite.

**Modules covered:** `gfx`, `math`, `string`, `array`, `drawing`, `stage`, `pen`, `assetmanager` + class constructors for `Sprite`, `Text`.

---

### Feature F — Hover Documentation

**Effort: S · Risk: Low · Depends on: Feature E (shares the static completions catalogue)**

When the user hovers over a known symbol (e.g., `math.sin` or `stage.add`), Monaco can show inline documentation via `registerHoverProvider`.

The hover provider logic is symmetric to completions: identify the symbol under the cursor (module + method), look up its documentation string, return a `MarkdownString`.

Example output on hover over `math.sin`:

```
**math.sin(n)**
Returns the sine of `n` (in radians).
```

This requires adding `description` fields to the library descriptors (currently absent). Once descriptions exist they're reused by both completions (Feature E) and hover (Feature F).

---

### Feature G — Symbol-Aware Completions

**Effort: M · Risk: Medium · Depends on: Feature D infrastructure (edit-time parse)**

Beyond the static library catalogue, completions should include user-defined symbols:

- Module-level variables: suggest `bunnysprite`, `score`, etc. from the current file
- Functions defined in other modules: `talk.sayhello()` after typing `talk.`
- Class instances and their methods

This requires access to the live symbol table — which means the edit-time compilation infrastructure from Feature D must exist first (the symbol table comes from `Basic4WebGL.parse()`).

**Symbol table access:** `ParserResults.symbolTable` (a `Symbols` instance) exposes `getAll('Variable')`, `getAll('Function')`, etc. These can be mapped to completion items filtered by the current scope.

**Complication:** the symbol table is built across all project files, not per-file. Scope filtering for the active file requires tracking which symbols belong to which module (currently available via `Symbol.scope.name`).

---

### Feature H — Signature Help

**Effort: M · Risk: Medium · Depends on: Features E + G**

When the user types `setPosition(`, Monaco can show a parameter hints popup:

```
setPosition(x, y)
             ^
```

This requires:

1. `registerSignatureHelpProvider` with trigger character `(`
2. A lookup of the function being called (from static library or symbol table)
3. Tracking which parameter is currently active (count commas before cursor)

Parameter names for library functions come from the descriptor system (already present in descriptors). For user-defined functions they come from `FunctionSymbol.parameters` in the symbol table.

---

### Feature I — Semantic Tokens

**Effort: L · Risk: High · Depends on: Feature G**

Beyond Monarch (which is regex-only and context-free), Monaco's semantic token API (`registerDocumentSemanticTokensProvider`) allows coloring identifiers based on their *resolved meaning* — e.g., colour `bunny` differently when it's a module name vs a local variable.

This is the correct long-term approach for a language with dot-notation module access, but it requires:

- The symbol table to be available at render time (from Feature G)
- A semantic token legend (token types + modifiers)
- A provider that maps each identifier token in the document to its semantic type

Semantic tokens fire per-document on every edit (with debouncing). This is expensive and fragile to get right. Recommended as a long-term item.

---

### Feature J — Language Server Protocol

**Effort: XL · Risk: High · Depends on: all of the above**

The proper long-term architecture for a sophisticated IDE is a Language Server (LSP) running in a Web Worker, exposing the full Monaco LSP client (`monaco-languageclient`). Benefits:

- Multi-error compilation with full error recovery
- Go-to-definition / find all references
- Rename symbol
- Code actions (e.g., "add missing endfunction")
- Formatter / document formatting

This would require rewriting the compiler's error handling to use error recovery rather than throw-on-first-error, and wiring up the LSP protocol. Not suitable for Phase 1.

---

## 3. Blockers and Dependencies

```
Feature A (token-linked highlighting)   — no blockers
Feature B (language config)             — no blockers
Feature C (cursor status bar)           — no blockers
Feature E (static completions)          — no blockers
Feature F (hover docs)                  — no blockers (needs description fields in descriptors)

Feature D (error squiggles)             — blocked by:
  ├── Blocker B1: single-error compilation (parser error recovery)
  └── Blocker B2: no end positions in SourceLocation

Feature G (symbol completions)          — depends on Feature D infrastructure
Feature H (signature help)              — depends on Features E + G
Feature I (semantic tokens)             — depends on Feature G
Feature J (LSP)                         — depends on all
```

**Blocker B1 detail:** `parseFile()` in `src/lib/CompilerLib/parser/index.ts` re-throws on every error. Fixing this requires the parser loop to catch per-file errors into a `Diagnostic[]` array, skip to a recovery point (next `NewLine` token), and continue. The architecture change is in `parser/index.ts` and `Basic4WebGL/index.ts`. Estimated effort: **M**.

**Blocker B2 detail:** `src/lib/CompilerLib/compiler/types.ts` → add `endLine?: number; endCol?: number` to `SourceLocation`. Thread through `Token.loc()` (which has `text` available and can compute `col + text.length`), error constructors, and `Diagnostic`. Estimated effort: **S**.

---

## 4. Effort Summary

| # | Feature | Effort | Phase |
|---|---|---|---|
| B | Language config bundle (brackets, comments, indent) | XS | 1 |
| C | Status bar cursor position | XS | 1 |
| A | Token-linked syntax highlighting | S | 1 |
| E | Static library completions | S | 1 |
| F | Hover documentation | S | 1 |
| Blocker B2 | SourceLocation end positions | S | Pre-req for D |
| Blocker B1 | Parser error recovery | M | Pre-req for D |
| D | Edit-time error squiggles | M | 2 |
| G | Symbol-aware completions | M | 2 |
| H | Signature help | M | 2–3 |
| I | Semantic tokens | L | 3 |
| J | LSP | XL | Future |

---

## 5. Phase 1 Recommendation

**Phase 1: Quick wins + foundation (total ~2 days)**

These five features share no dependencies, have low risk, and will visibly improve the IDE quality immediately:

1. **Feature B** — Language config (brackets, comment shortcut, auto-indent) — XS
2. **Feature C** — Status bar cursor position — XS
3. **Feature A** — Token-linked highlighting (fixes all missing keywords, cleans up Monarch) — S
4. **Feature E** — Static library completions (dot-after-module triggers) — S
5. **Feature F** — Hover documentation for library functions — S

**Pre-requisite work for Phase 2:**

Before error squiggles can be built:

- **Blocker B2** — SourceLocation end positions — S (could go in Phase 1 as it's isolated)
- **Blocker B1** — Parser error recovery — M (this is the gate for squiggles)

**Phase 2: Edit-time diagnostics + symbol awareness (~3–4 days)**

1. **Feature D** — Edit-time error squiggles (requires both blockers resolved)
2. **Feature G** — Symbol-aware completions (user variables and functions in completion list)

**Phase 3: Signature help, semantic tokens (~3 days)**

1. **Feature H** — Signature help
2. **Feature I** — Semantic tokens (optional — high effort, marginal gain over Phase 2)

---

## 6. Items Recommended for Outstanding Issues

The following should be added to `docs/outstanding-issues.md` if they go out of scope:

- **Parser error recovery** (Blocker B1): currently the compiler is stop-on-first-error. Error recovery would enable multi-error reporting and is a prerequisite for squiggles. This is a meaningful parser refactor.
- **SourceLocation end positions** (Blocker B2): a small but pervasive change to thread end column/line through Token → Diagnostic. Low risk but touches many files.
- **Language Server Protocol** (Feature J): the correct long-term architecture. Deferred until the simpler inline approach (Features D–H) proves insufficient.
- **`Do`/`Until` loop support**: these tokens exist in `tokens.ts` but are not implemented in the parser. They should be included in the keyword list (Feature A) to future-proof, but the parser work is a separate item.

---

## 7. Key Files to Touch

| Area | File |
|---|---|
| Monarch rules (current) | `src/monacoHelpers/index.ts` |
| Editor component | `src/components/Editor/index.tsx` |
| New keywords const | `src/lib/Basic4WebGL/keywords.ts` (create) |
| SourceLocation type | `src/lib/CompilerLib/compiler/types.ts` |
| Token loc() method | `src/lib/CompilerLib/lexer/tokens/Token.ts` |
| Parser error collection | `src/lib/CompilerLib/parser/index.ts` |
| Edit-time compile hook | `src/hooks/useEditTimeCompiler.ts` (create) |
| Diagnostics Redux slice | `src/features/diagnostics/diagnosticsSlice.ts` (create) |
| Library descriptor files | `src/lib/Basic4WebGL/library/descriptors/*.ts` (add descriptions) |
| Static completions catalogue | `src/monacoHelpers/completions.ts` (create) |
| Status bar | `src/pages/EditPage.tsx` (footer wiring) |
