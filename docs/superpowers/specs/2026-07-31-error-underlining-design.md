# Inline Error Underlining Design

## Goal

Surface compiler diagnostics as inline squiggly underlines in the Monaco editor, live as the developer types, instead of requiring an explicit Build/Run with errors only visible in the bottom log panel. This also stands up the debounced "compile silently in the background" plumbing that dynamic symbol resolution (the other remaining Milestone 2 piece) will need next.

---

## Scope decisions (agreed 2026-07-31)

- **Single diagnostic only.** `Basic4WebGL.transpile()` already stops at the first error and returns at most one `Diagnostic` (`src/lib/Basic4WebGL/index.ts:24-45`). v1 underlines just that one. Collecting/continuing past multiple errors would require reworking error handling across lex/parse/transpile — deferred to a future piece.
- **Underline to end of line.** `SourceLocation` (`src/lib/CompilerLib/compiler/types.ts`) is a point (`{line, col, filename}`), not a range — there's no token length to draw an exact span. Rather than teach the lexer/parser to track token length now, v1 synthesizes the marker's end as the end of the reported line (`model.getLineMaxColumn(loc.line)`). Less precise than a real token-span, but zero compiler-side risk.

---

## Behaviour

### Trigger

No debounce/on-change compile path exists today — `useCompiler.ts`'s `run()` is the only place `Basic4WebGL.transpile()` is called, and it only fires on Build/Run (`src/hooks/useCompiler.ts:18-45`). This part is genuinely new infrastructure, but less new than it first looks:

- `handleChange` in `EditPage.tsx:81-85` already dispatches `updateFile` to Redux on every keystroke — the store already reflects live file content per keystroke. No new debounce is needed at the *data* layer, only around when the *compile* is triggered.
- New: a debounced effect (~400–500ms after the last keystroke) that calls `Basic4WebGL.transpile(buildProject)` directly — reusing `useProjectForBuild(projectId)`, the same project shape `useCompiler` already builds — without dispatching `addLog` / `setTranspiled` / `setIsRunning`. A silent, read-only compile purely for diagnostics.

### Diagnostic → marker mapping

`Editor` (`src/components/Editor/index.tsx`) shows exactly one file's content at a time (`value={file.source}` — no per-file Monaco model/tab switching inside the component; tab state lives in `EditPage.tsx`). So for v1:

- If the diagnostic's `loc.filename` matches the **currently open** file, call `monaco.editor.setModelMarkers(model, 'softbasic', [marker])` on that model.
- If the diagnostic belongs to a **different** file than the one open — a real case, since the project compiles multiple dependency-ordered files together — v1 does **not** auto-switch tabs or show it inline (no model exists for a closed file, and auto-switching mid-typing would yank focus away from what the developer is doing — see "No auto-switch while typing" below). It still reaches the log panel as it does today.
- Markers are cleared (`setModelMarkers(model, 'softbasic', [])`) at the start of every debounce cycle and on file switch, so stale squiggles never linger.

### No auto-switch while typing — click-to-jump from the console instead

Agreed 2026-07-31: live/debounced diagnostics never change which file is open — a background recompile firing mid-keystroke must not yank the editor to another tab, especially since code is often momentarily invalid while still being typed. Cross-file navigation instead becomes an explicit, deliberate action: **clicking an error entry in the console/problems panel jumps to that file and line.**

This applies uniformly to both the new live diagnostic and the existing Build/Run diagnostic (`useCompiler.ts`) — same click-to-jump behaviour regardless of which path produced the log entry.

Implementation:
- `LogItem` (`src/Types/LogItem.ts:8-11`) gains an optional `loc?: SourceLocation`, populated alongside `text` wherever an error `LogItem` is created (`useCompiler.ts:36`, and the new `useLiveDiagnostics` consumer if it also logs — TBD whether live diagnostics write to the log at all, see open question below).
- `BottomPanel` (`src/components/BottomPanel/index.tsx`) gains an `onJumpToLoc?: (loc: SourceLocation) => void` prop; each log `<li>` becomes clickable (only when `log.loc` is present) and calls it.
- `EditPage.tsx` supplies the handler: look up the file by `loc.filename` in `useAllFilesForProject(id)` (matching on `file.name`, the same field `useProjectForBuild` uses when building `SourceLocation.filename` — `useProjectForBuild.ts:37-40`), `dispatch(selectFile(...))` to switch tabs, and set a new piece of state (`jumpTarget: {line, col} | null`) passed down to `<Editor jumpTo={jumpTarget} .../>`.
- `Editor/index.tsx` stores the mounted `editor` instance in a ref (currently `handleMount` only wires `onDidChangeCursorPosition`, doesn't keep the instance). A new effect keyed on `jumpTo` calls `editorRef.current?.setPosition({lineNumber, column})`, `.revealPositionInCenter(...)`, and `.focus()`.

Open question to resolve during implementation, not blocking the spec: does live/debounced typing produce a console log entry at all (so it's clickable), or does it *only* draw the inline squiggle, with the console log entry reserved for explicit Build/Run? Leaning toward the latter — a log entry appearing/disappearing on every keystroke pause would clutter the console — but worth confirming against how `clearLogs`/`addLog` are currently used before writing code.

### Marker shape

```ts
{
  severity: monaco.MarkerSeverity.Error, // Diagnostic.severity is typed 'error' | 'warning' but only 'error' is ever produced today
  message: diagnostic.message,
  startLineNumber: diagnostic.loc.line,
  startColumn: diagnostic.loc.col,
  endLineNumber: diagnostic.loc.line,
  endColumn: model.getLineMaxColumn(diagnostic.loc.line),
}
```

If `diagnostic.loc` is undefined (`SourceLocation` is optional on `Diagnostic` — some thrown errors may not attach one), no marker is set and the diagnostic still only reaches the log panel. Existing gap, not introduced by this work.

### Loc accuracy prerequisite

`docs/roadmap.md`'s known-issue #1 flags `BoolTermRule`, `ExpressionRule`, `ModuleFactorRule` as delegation-only parser rules with unverified loc propagation. Reading them directly (2026-07-31):

- `BoolTermRule` (`src/lib/Basic4WebGL/parserRules/rules/Expressions/BoolTermRule.ts:11-17`) purely delegates to `BoolFactor` and returns its node unchanged — inherits whatever loc `BoolFactor` set. No bug found on inspection, but untested.
- `ExpressionRule` (`.../Expressions/ExpressionRule.ts`) mostly delegates the same way; the one spot with a `null` loc (line 40, `new ExpressionNode(null, term)`) sits in a `switch` `default` branch that's unreachable given the enclosing `while` condition — dead code, not a live bug.
- `ModuleFactorRule` (`.../Expressions/ModuleFactorRule.ts:31`) does set its own loc via `tokenStream.current().loc()`, but that's read *after* parsing the full argument list — a module function call error may land at the closing paren rather than the call site. A real, if minor, imprecision.

None look like "no loc at all" bugs on inspection — and since v1's underline strategy already goes coarse (whole line), only the **line number** being right actually matters, not the exact column. Recommend a handful of targeted tests (error inside a boolean expression, inside a bare arithmetic expression, inside a module-call argument) confirming `loc.line` is correct, before wiring the UI — fix only if a test actually fails, rather than assuming a compiler change is required up front.

---

## Architecture

### File Map

| File | Action | Purpose |
|---|---|---|
| `src/monacoHelpers/diagnostics.ts` | CREATE | Pure `toMarkers(diagnostics, model, activeFilename)` mapping function |
| `src/hooks/useLiveDiagnostics.ts` | CREATE | Debounced hook: watches `buildProject` via `useProjectForBuild`, calls `Basic4WebGL.transpile()` silently, returns current diagnostics |
| `src/components/Editor/index.tsx` | MODIFY | Call `useLiveDiagnostics`, apply/clear markers via `monaco.editor.setModelMarkers`; store mounted `editor` in a ref; add `jumpTo?: {line, col}` prop + effect that sets cursor position and reveals it |
| `src/Types/LogItem.ts` | MODIFY | Add optional `loc?: SourceLocation` to `LogItem` |
| `src/hooks/useCompiler.ts` | MODIFY | Pass `loc: d.loc` into the `addLog` payload for error diagnostics (`useCompiler.ts:36`) |
| `src/components/BottomPanel/index.tsx` | MODIFY | Add `onJumpToLoc?: (loc: SourceLocation) => void` prop; make error log entries with a `loc` clickable |
| `src/pages/EditPage.tsx` | MODIFY | Add `jumpTarget` state; implement `onJumpToLoc` (resolve `loc.filename` → file via `useAllFilesForProject`, dispatch `selectFile`, set `jumpTarget`); pass `jumpTo={jumpTarget}` to `<Editor>` |
| `tests/lib/Basic4WebGL/unit/nodes/locPropagation.test.ts` | CREATE | Targeted `loc.line` assertions for errors raised inside BoolTerm/Expression/ModuleFactor delegation chains |
| `tests/monacoHelpers/diagnostics.test.ts` | CREATE | Unit tests for `toMarkers()` — single diagnostic → one marker; no loc → no marker; filename mismatch → no marker |
| `tests/hooks/useLiveDiagnostics.test.ts` | CREATE | Debounce behaviour; confirms no log/session dispatch occurs (silent compile) |
| `tests/ui/components/BottomPanel/*.test.tsx` | CREATE/MODIFY | Click on an error log entry with a `loc` calls `onJumpToLoc`; entries without `loc` are not clickable |

### Debounce hook sketch

```ts
export function useLiveDiagnostics(projectId: string): Diagnostic[] {
  const buildProject = useProjectForBuild(projectId);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (buildProject.dependencyError) { setDiagnostics([]); return; }
      const result = Basic4WebGL.transpile(buildProject);
      setDiagnostics(result.diagnostics);
    }, 450);
    return () => clearTimeout(timer);
  }, [buildProject]);

  return diagnostics;
}
```

Watch-item: `useProjectForBuild` builds a fresh object every render (not memoized), so this effect's dependency fires on every keystroke-driven re-render, gated only by the debounce timer resetting each time — which is the intended behaviour, but means `Basic4WebGL.transpile()` runs on essentially every pause in typing with no additional throttle. No perf testing done against a large multi-file project; flag as a v1 watch-item rather than a blocker.

---

## Tests

- `locPropagation.test.ts` — line-number correctness for errors inside the three flagged delegation rules (see above)
- `diagnostics.test.ts` — `toMarkers()` mapping cases (present loc / missing loc / filename mismatch)
- `useLiveDiagnostics.test.ts` — debounce fires once after rapid changes settle; no Redux log/session actions dispatched

---

## Docs

No user-facing docs update needed — this is IDE tooling behaviour, not a softBASIC language/library feature, consistent with how autocomplete/hover/signature help shipped without a dedicated docs page.

## Roadmap

`docs/roadmap.md` Milestone 2 — mark "Error underlining" done (noting the v1 same-file-only caveat) once implemented. "Dynamic symbol resolution" remains the one other tracked M2 item.
