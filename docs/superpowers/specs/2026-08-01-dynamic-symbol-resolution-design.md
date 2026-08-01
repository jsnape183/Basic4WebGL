# Dynamic Symbol Resolution Design

## Goal

Extend autocomplete, hover documentation, and parameter hints beyond the static library catalogue (`src/monacoHelpers/catalogue.ts`) to also resolve **user-defined** functions, classes, and in-scope variables — closing out the last remaining Milestone 2 deliverable (`docs/roadmap.md`). Reuses the debounced silent-compile plumbing (`useLiveDiagnostics`, shipped with error underlining) rather than adding a second compile path.

---

## Scope decisions (agreed 2026-08-01)

- **Last-known-good symbol snapshot, not parser error recovery.** The compiler still throws on the first error (`Basic4WebGL.transpile()`, `src/lib/Basic4WebGL/index.ts`). Rather than teach the parser to recover from errors and continue (a much larger, riskier compiler rewrite — flagged as "Blocker B1" in the original `2026-05-24-monaco-improvements-research.md` spec and never built), the debounced hook simply **only updates its cached symbol snapshot on a clean compile** (zero diagnostics) and leaves the previous snapshot in place while the buffer has an error. Same staleness tolerance the error-underlining work already accepted for diagnostics — intellisense reflects the file as of the last time it fully compiled, not the literal current buffer.
- **Function/constructor/class scope granularity only — block scoping is explicitly out of scope.** `if`/`for`/`while`/`do` blocks don't push their own scope in `Symbols` today (only `RootRule`, `FunctionRule`, `ConstructorRule` call `setScope`) — confirmed intentional, not a bug, and not yet decided (`docs/roadmap.md` → Perpetual parking lot → "Block-level lexical scoping"). This design matches that: a `dim` inside an `if` is treated as visible to the whole enclosing function for completion purposes, same as the compiler currently treats it for real. If block scoping is ever added, the compiler will need per-block loc ranges for its own error-checking anyway — the editor should read those ranges then, not reimplement block-counting itself now.
- **Static library catalogue wins over dynamic symbols on conflict.** If a project ever defines something that collides with a built-in module/class name (the symbol table's dedup check is keyed on `(name, type, scope, fullScope)`, so e.g. a `dim math` variable technically doesn't collide with the pre-registered `math` Module symbol, since the type differs) — the static catalogue is checked first in every provider, dynamic resolution is the fallback. This is an existing ambiguity in the compiler itself, not solved here, just given a safe default.

---

## What the symbol table already gives us

Traced through `src/lib/CompilerLib/symbols/index.ts` and the parser rules that populate it (`RootRule`, `FunctionRule`, `ConstructorRule`, `ClassRule`, `DimRule`, `VariableListRule`):

- **File scope is the module scope.** `RootRule` registers a `Module` symbol named after the file itself and pushes that as the base scope for everything in the file (`src/lib/Basic4WebGL/parserRules/rules/RootRule.ts`). A file starting with `Class [extends X]` on line 1 upgrades that same scope to `Class` (`ClassRule.ts`) — the class's scope is the *entire file*, no separate open/close needed.
- **Only `Function` and `Constructor` nest further.** `function foo(...)...endfunction` pushes/pops a scope named after the function; `constructor(...)...endconstructor` pushes/pops a scope literally named `"constructor"`, and only inside a `Class`-scoped file (`ConstructorRule.ts` throws otherwise).
- **Typed locals/params get their own cloned scope.** `dim e as Enemy` / `dim e = new Enemy()` (`DimRule.ts`) and typed scalar params (`VariableListRule.ts`) call `symbolTable.clone(name, classSymbol, ...)`, which creates a **new scope named after the variable itself** containing copies of the class's members. So `e.hit()` resolves via a scope literally called `"e"` — not `"Enemy"`.
- **Typed arrays/dicts don't clone — they reference the class directly.** `dim arr(10) as Enemy` produces an `ArraySymbol` with `classSymbol` pointing at the `Enemy` class symbol (no per-element cloning, since array contents are dynamic). Member access (`arr(i).hit()`) goes through `arraySym.classSymbol`, so completions for `arr(i).` should query the scope named after **the class itself** (`"enemy"`), not the array variable.
- **Constructor parameters are a trap.** `FunctionRule` populates `FunctionSymbol.parameters` correctly from `VariableListNode.data.params` (all param kinds, in declaration order) — reliable. `ConstructorRule` does **not**: it registers its guard `FunctionSymbol` with a hardcoded `parameters: []` (`ConstructorRule.ts`, the "at most one constructor" marker). The real constructor param symbols exist in the table (added by `VariableListRule` under scope `"constructor"`, `fullScope = "${className}.constructor"`) — they just aren't attached to that guard symbol. Constructor signature help must derive params by filtering the flat table on `fullScope` instead of trusting `.parameters`.
- **Param names aren't lowercased.** `DimRule`/`FunctionRule` lowercase identifiers before storing them; `VariableListRule`'s param-name capture does not (`const name = tokenStream.prev().text;`, no `.toLowerCase()`). The compiler's own lookups are case-insensitive regardless (`Symbols.retrieveSymbol` lowercases at lookup time), but our snapshot-matching code must do the same on both sides — don't assume consistent stored casing.
- **No primitive type system.** `dataType` is always `Variant` except it's unused for typing decisions — the only "type" information that exists is *kind* (`Variable`/`Function`/`Array`/`Parameter`/`Object`/`Class`/`Dictionary`/`Module`) plus, for `Object`/typed `Array`/typed `Dictionary`, a `classSymbol` reference. "Variable typing" in this codebase means "is this an instance of a user class," not "is this a number vs a string."

---

## Architecture

### 1. Compiler: expose a serializable symbol snapshot

`Symbols` (`src/lib/CompilerLib/symbols/index.ts`) gains one new public method — nothing else about the class changes:

```ts
export type SymbolSnapshotEntry = {
  name: string;
  kind: string;              // symbolTypes.* value
  scopeName: string;
  scopeType: string;
  fullScope: string;
  className?: string;        // from classSymbol?.name — Object / typed Array / typed Dictionary
  parentClassName?: string;  // Class symbols only
  isParam?: boolean;
  dimensions?: number;       // Array symbols only
  parameters?: { name: string; className?: string }[]; // Function symbols — see constructor caveat above
};

getSnapshot(): SymbolSnapshotEntry[] {
  return this.table.map(s => ({
    name: s.name,
    kind: s.type,
    scopeName: s.scope.name,
    scopeType: s.scope.type,
    fullScope: s.fullScope,
    className: (s as any).classSymbol?.name,
    parentClassName: s.parentClassName,
    isParam: (s as any).isParam,
    dimensions: (s as any).dimensions,
    parameters: (s as any).parameters?.map((p: Symbol) => ({
      name: p.name,
      className: (p as any).classSymbol?.name,
    })),
  }));
}
```

`CompileResult` (`src/lib/CompilerLib/compiler/types.ts`) gains `symbols?: SymbolSnapshotEntry[]`.

`Basic4WebGL.transpile()` (`src/lib/Basic4WebGL/index.ts`) adds `symbols: parseResult.symbolTable.getSnapshot()` to the **success** return only — the `catch` block is untouched. This is deliberately minimal: because of the last-known-good caching decision above, nothing ever needs to read symbols off a *failed* compile, so there's no need to restructure error handling to keep a `Symbols` reference alive across a throw.

### 2. Hook: broaden `useLiveDiagnostics` → `useLiveAnalysis`

Single call site (`EditPage.tsx`), so renaming is cheap and the new name says what it now returns:

```ts
// src/hooks/useLiveAnalysis.ts
export function useLiveAnalysis(projectId: string): {
  diagnostics: Diagnostic[];
  symbols: SymbolSnapshotEntry[];
} {
  const buildProject = useProjectForBuild(projectId);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [symbols, setSymbols] = useState<SymbolSnapshotEntry[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (buildProject.dependencyError) { setDiagnostics([]); return; } // symbols: leave as last-known-good
      const result = Basic4WebGL.transpile(buildProject);
      setDiagnostics(result.diagnostics);
      if (result.diagnostics.length === 0 && result.symbols) {
        setSymbols(result.symbols); // only advance the snapshot on a clean compile
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [buildProject]);

  return { diagnostics, symbols };
}
```

### 3. Editor-side scope detection: `scopeScanner.ts`

The symbol snapshot only records scope *names*, not source ranges — there's no way to ask "what's visible at line 12" from the table alone. Since only `Function`/`Constructor` nest (see above), a plain textual stack walk over the live buffer (not the stale compiled snapshot) is sufficient and stays in sync with what the user is typing right now, independent of whether it currently compiles:

```ts
// src/monacoHelpers/scopeScanner.ts
export function scanEnclosingScope(text: string, cursorLine: number, cursorCol: number): string[] {
  const stack: string[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < cursorLine; i++) {
    const line = i === cursorLine - 1 ? lines[i].slice(0, cursorCol - 1) : lines[i];

    const fn = /^\s*function\s+(\w+)\s*\(/i.exec(line);
    if (fn) { stack.push(fn[1].toLowerCase()); continue; }
    if (/^\s*endfunction\b/i.test(line)) { if (stack.at(-1) !== 'constructor') stack.pop(); continue; }
    if (/^\s*constructor\s*\(/i.test(line)) { stack.push('constructor'); continue; }
    if (/^\s*endconstructor\b/i.test(line)) { if (stack.at(-1) === 'constructor') stack.pop(); continue; }
  }
  return stack; // innermost last; [] at file top level
}
```

Only tracks `function`/`endfunction` and `constructor`/`endconstructor` — deliberately not `if`/`for`/`while`/`do`, per the block-scoping scope decision above. Runs on-demand inside provider callbacks (bounded by cursor line, not full file), never on a timer.

### 4. Dynamic catalogue: `symbolCatalogue.ts`

The dynamic mirror of `catalogue.ts`, operating on a `SymbolSnapshotEntry[]` + active filename + the scope stack from `scopeScanner`:

```ts
// src/monacoHelpers/symbolCatalogue.ts

// Bare-word completion candidates: globals, the file's own module scope, and
// each frame of the live scope stack (innermost first).
export function getVisibleSymbols(
  snapshot: SymbolSnapshotEntry[], activeFilename: string, scopeStack: string[]
): SymbolSnapshotEntry[];

// Dot-completion candidates for a resolved owner scope name (see below for how
// the owner is resolved — the caller, not this function, decides which scope
// name "instance.member" or "arr(i).member" maps to).
export function getMembers(snapshot: SymbolSnapshotEntry[], ownerScopeName: string): SymbolSnapshotEntry[];

// Given bare identifier text before a '.', find its declaration (scope-priority:
// innermost stack frame first, then file module scope, then globals — mirrors
// Symbols.retrieveSymbol's own priority order) and return which scope name
// owns its members:
//   Object            -> the identifier's own name (DimRule/typed-param clone scope)
//   Array | Dictionary with className -> the className itself (uncloned class scope)
//   Module (another file) -> the identifier itself
//   otherwise -> null (no member completions)
export function resolveOwnerScopeName(
  snapshot: SymbolSnapshotEntry[], identifierName: string, scopeStack: string[], activeFilename: string
): string | null;

// Function/constructor signature lookup. For a regular Function, uses `.parameters`
// directly. For a constructor (functionName === 'constructor'), `.parameters` is
// unreliable (see compiler note above) — falls back to filtering the snapshot for
// `fullScope === '${scopeName}.constructor' && isParam` in table order.
export function getCallableSignature(
  snapshot: SymbolSnapshotEntry[], scopeName: string, functionName: string
): { name: string; params: { name: string; className?: string }[] } | undefined;
```

All matching is case-insensitive on both sides (identifier text from the live buffer and snapshot entry names) — per the param-casing note above, stored case isn't consistent enough to rely on.

### 5. Wiring into the existing providers

Providers register once per `monaco` instance mount (`Editor/index.tsx`'s existing `useEffect`), so they can't just close over a `symbols` prop that changes every debounce cycle. `Editor` keeps the latest snapshot in a ref (same pattern already used for the mounted editor instance / `jumpTo`), and passes accessor functions — not raw values — into the register calls, so `completions.ts`/`hover.ts`/`signatures.ts` stay pure and testable:

```ts
type SymbolContext = {
  getSymbols: () => SymbolSnapshotEntry[];
  getActiveFilename: () => string | undefined;
};
```

- **`completions.ts`** — today's provider only ever handles the `identifier.` trigger case (`parseCompletionModule` returns `null` for a bare word and the provider returns no suggestions at all — there is currently no bare-word completion of any kind). This adds: (a) a bare-word branch using `scanEnclosingScope` + `getVisibleSymbols` when there's no dot-context; (b) in the existing dot-context branch, falls through to `resolveOwnerScopeName` + `getMembers` when `isKnownModule` is false.
- **`hover.ts`** — extends the existing bare-word branch (currently only checks `getConstructor`) to also try a dynamic function/variable/class lookup.
- **`signatures.ts`** — extends the existing bare-word branch (already structurally present for constructors) to also try `getCallableSignature` against the dynamic snapshot.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/CompilerLib/symbols/index.ts` | MODIFY | Add `Symbols.getSnapshot()` + export `SymbolSnapshotEntry` type |
| `src/lib/CompilerLib/compiler/types.ts` | MODIFY | Add `symbols?: SymbolSnapshotEntry[]` to `CompileResult` |
| `src/lib/Basic4WebGL/index.ts` | MODIFY | Return `symbols: parseResult.symbolTable.getSnapshot()` on the success path only |
| `src/hooks/useLiveDiagnostics.ts` → `src/hooks/useLiveAnalysis.ts` | RENAME + MODIFY | Broaden return to `{ diagnostics, symbols }`; last-known-good caching for `symbols` |
| `src/monacoHelpers/scopeScanner.ts` | CREATE | `scanEnclosingScope()` — live textual function/constructor nesting detector |
| `src/monacoHelpers/symbolCatalogue.ts` | CREATE | `getVisibleSymbols`, `getMembers`, `resolveOwnerScopeName`, `getCallableSignature` |
| `src/monacoHelpers/completions.ts` | MODIFY | Add bare-word branch; dynamic fallback in dot-context branch |
| `src/monacoHelpers/hover.ts` | MODIFY | Extend bare-word branch with dynamic lookup |
| `src/monacoHelpers/signatures.ts` | MODIFY | Extend bare-word branch with dynamic lookup |
| `src/components/Editor/index.tsx` | MODIFY | Accept `symbols` prop, mirror into a ref, pass `SymbolContext` accessors into the three register calls |
| `src/pages/EditPage.tsx` | MODIFY | Switch to `useLiveAnalysis`, pass `symbols` down to `<Editor>` |
| `tests/lib/CompilerLib/unit/symbols/symbolTable.test.ts` | MODIFY | `getSnapshot()` cases |
| `tests/lib/Basic4WebGL/integration/compiler/symbolSnapshot.test.ts` | CREATE | End-to-end: transpile a function + class + typed array, assert snapshot shape, including the constructor-parameters caveat |
| `tests/ui/hooks/useLiveAnalysis.test.tsx` (renamed from `useLiveDiagnostics.test.tsx`) | MODIFY | Existing debounce cases + new: symbols persist across a subsequent failing compile |
| `tests/monacoHelpers/scopeScanner.test.ts` | CREATE | Nesting cases enumerated in Architecture §3 |
| `tests/monacoHelpers/symbolCatalogue.test.ts` | CREATE | Pure-function cases for each exported function |
| `tests/monacoHelpers/completions.test.ts`, `hover.test.ts`, `signatures.test.ts` | MODIFY | Dynamic-symbol cases; static catalogue still wins on conflict |
| `tests/ui/components/Editor/Editor.test.tsx` | MODIFY | `symbols` prop flows into the provider context ref |

---

## Tests

- `symbolTable.test.ts` — `getSnapshot()` maps kind/scope/className/parameters/isParam correctly, including the array/dictionary `classSymbol` case
- `symbolSnapshot.test.ts` — full-pipeline snapshot shape for a realistic small project (global function, a class with a constructor + method, a typed array param) — this is what catches constructor-parameter drift if `ConstructorRule` ever changes
- `useLiveAnalysis.test.tsx` — symbols only update on a zero-diagnostic compile; a subsequent failing compile leaves the previous snapshot in place
- `scopeScanner.test.ts` — top-level (class file and non-class file), inside a function, inside a constructor, after `endfunction`, cursor mid-signature before the block closes, case-insensitivity, unbalanced/still-being-typed buffer
- `symbolCatalogue.test.ts` — `resolveOwnerScopeName` for each of Object / typed Array / typed Dictionary / another-file Module / non-member kind; `getCallableSignature` for a regular function vs. the constructor fallback path
- `completions.test.ts` / `hover.test.ts` / `signatures.test.ts` — dynamic symbol appears when not shadowed by a static one; static wins when both exist for the same name

---

## Docs

No user-facing docs update — IDE tooling behaviour, not a softBASIC language/library feature (consistent with how autocomplete/hover/signature help and error underlining shipped without a dedicated docs page).

## Roadmap

`docs/roadmap.md` Milestone 2 — mark "Dynamic symbol resolution" done once implemented. This is the second and last tracked M2 item (error underlining shipped 2026-08-01), so completing it closes the milestone — per the versioning model that's a minor bump (`v0.4.0`) whenever this next gets pushed, not something to do preemptively in the implementation commit.
