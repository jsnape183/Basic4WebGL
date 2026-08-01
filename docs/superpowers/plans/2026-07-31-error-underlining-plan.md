# Inline Error Underlining Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface compiler diagnostics as inline squiggly underlines in the Monaco editor, live as the developer types (debounced), and make error log entries in the bottom console clickable to jump to the file/line — without ever auto-switching tabs on a background recompile. Also stands up the silent debounced-compile plumbing that dynamic symbol resolution (the other remaining Milestone 2 piece) will reuse next.

**Architecture:** A new `useLiveDiagnostics` hook debounces (~450ms) a silent call to the existing `Basic4WebGL.transpile()`, reusing `useProjectForBuild` exactly as `useCompiler` does today, but without dispatching to the log/session state. A pure `toMarkers()` function in `src/monacoHelpers/diagnostics.ts` maps the (at most one) resulting `Diagnostic` to a Monaco marker, synthesizing the end-of-range as end-of-line since `SourceLocation` is a point, not a range. `Editor` applies/clears markers via `monaco.editor.setModelMarkers` and gains a `jumpTo` prop for external cursor navigation. Separately, `LogItem` gains an optional `loc`, threaded from `useCompiler`'s existing error diagnostics, and `BottomPanel` makes those entries clickable — `EditPage` resolves the click to a file + dispatches the existing `selectFile` action + sets the `jumpTo` target. Per the agreed design, live/debounced diagnostics **never** write a console log entry and **never** switch files — only the explicit Build/Run path and explicit clicks touch the console/tab state.

**Tech Stack:** Monaco Editor via `@monaco-editor/react`, React, Redux Toolkit, TypeScript, Vitest, Testing Library

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `tests/lib/Basic4WebGL/unit/parser/locPropagation.test.ts` | CREATE | Compiler-correctness gate: `loc.line` is correct for errors raised inside `BoolTerm`/`Expression`/`ModuleFactor` delegation chains |
| `src/Types/LogItem.ts` | MODIFY | Add optional `loc?: SourceLocation` to `LogItem` |
| `src/hooks/useCompiler.ts` | MODIFY | Pass `loc: d.loc` into the `addLog` payload for error diagnostics |
| `src/monacoHelpers/diagnostics.ts` | CREATE | Pure `toMarkers(diagnostics, model, activeFilename)` mapping function |
| `tests/monacoHelpers/diagnostics.test.ts` | CREATE | Unit tests for `toMarkers()` |
| `src/hooks/useLiveDiagnostics.ts` | CREATE | Debounced hook: silent `Basic4WebGL.transpile()` call, returns current diagnostics |
| `tests/ui/hooks/useLiveDiagnostics.test.tsx` | CREATE | Debounce behaviour; confirms no log/session dispatch occurs |
| `src/components/Editor/index.tsx` | MODIFY | Call `useLiveDiagnostics`, apply/clear markers; store mounted `editor` in a ref; add `jumpTo` prop + effect |
| `tests/ui/components/Editor/Editor.test.tsx` | CREATE | Markers set/cleared on diagnostics change; `jumpTo` prop moves the cursor and reveals it |
| `src/components/BottomPanel/index.tsx` | MODIFY | Add `onJumpToLoc?: (loc: SourceLocation) => void` prop; make error entries with a `loc` clickable |
| `tests/ui/components/BottomPanel/BottomPanel.test.tsx` | MODIFY | Click on an error log entry with a `loc` calls `onJumpToLoc`; entries without `loc` are not clickable |
| `src/pages/EditPage.tsx` | MODIFY | Add `jumpTarget` state; implement `onJumpToLoc`; pass `jumpTo` to `<Editor>` and `onJumpToLoc` to `<BottomPanel>` |
| `tests/ui/pages/EditPage.test.tsx` | MODIFY | Clicking a `BottomPanel` error entry switches the selected file and sets `jumpTarget` |
| `docs/roadmap.md` | MODIFY | Mark "Error underlining" done in Milestone 2, noting the click-to-jump / no-auto-switch design |

---

### Task 1: Loc propagation gate for delegation-only parser rules

**Files:**
- Create: `tests/lib/Basic4WebGL/unit/parser/locPropagation.test.ts`

**Context:** `docs/roadmap.md`'s known-issue #1 flags `BoolTermRule`, `ExpressionRule`, `ModuleFactorRule` as delegation-only with unverified loc propagation. Reading them directly showed no obvious "missing loc" bug, but they're untested. Since v1's marker strategy underlines to end-of-line, only `loc.line` being correct actually matters here — this task is a fast gate, not an assumed fix.

- [x] **Step 1: Write the failing/characterizing tests**

Compile small snippets through `Basic4WebGL.transpile()` (or `parser`/`lexOnly` directly, matching the existing pattern in `tests/lib/Basic4WebGL/unit/nodes/nodeLoc.test.ts` and the integration-test `compileOk`/`compileFail`-style helpers under `tests/lib/Basic4WebGL/integration/`) that force an error to be thrown from inside each of the three rules, and assert `err.loc.line` matches the line the mistake is actually on:

There is no `compileFail`-style helper today — only `compileOk` (`tests/lib/Basic4WebGL/helpers.ts:22-28`), which asserts zero diagnostics. Call the compiler directly instead, the same way `compileOk` does internally (`compiler.transpile(project)` from `@Basic4WebGL/index`), and assert on `result.diagnostics`:

```ts
// tests/lib/Basic4WebGL/unit/parser/locPropagation.test.ts
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';

const compileErrorLoc = (source: string) => {
  const result = compiler.transpile({ lib: [], files: [{ name: 'Main', source }] });
  expect(result.diagnostics.length, 'expected a compile error but got none').toBeGreaterThan(0);
  return result.diagnostics[0].loc;
};

describe('loc propagation through delegation-only parser rules', () => {
  test('error inside a boolean expression reports the correct line', () => {
    const src = [
      'function onenter()',
      '    if true and undefinedVar then',
      '        print "hi"',
      '    endif',
      'endfunction',
    ].join('\n');
    expect(compileErrorLoc(src)?.line).toBe(2);
  });

  test('error inside a bare arithmetic expression reports the correct line', () => {
    const src = [
      'function onenter()',
      '    dim x = 1',
      '    dim y = x + undefinedVar',
      'endfunction',
    ].join('\n');
    expect(compileErrorLoc(src)?.line).toBe(3);
  });

  test('error inside a module-call argument reports a line at or after the call', () => {
    const src = [
      'function onenter()',
      '    dim x = math.floor(undefinedVar)',
      'endfunction',
    ].join('\n');
    expect(compileErrorLoc(src)?.line).toBe(2);
  });
});
```

Check whether these snippets actually need `softcore`/`softgfx` lib files passed in `lib: []` for `math.floor` and boolean/undefined-variable errors to surface as expected (vs. some other earlier error, e.g. an unresolved module) — pattern-match against how other unit tests under `tests/lib/Basic4WebGL/unit/` that don't use the full `textLib`-style fixture handle this, and adjust the snippets/lib array if the first run surfaces the wrong diagnostic.

- [x] **Step 2: Run and see what actually happens** — the arithmetic-expression case failed (reported line 4 instead of 3). Root cause: `VariableFactorRule`'s bare-identifier `symbolTable.get(name)` call threw a `SymbolError` with no `loc`; since the identifier token had already been consumed by `matchAndMove` before the lookup, the fallback in `parser/index.ts` (`err.loc = stream.current().loc()`) grabbed whatever token followed — the trailing newline, which reported the next line. Fixed by wrapping the lookup in `VariableFactorRule.ts` in a try/catch that attaches the already-captured identifier `loc` before rethrowing. `BoolTermRule`/`ExpressionRule`/`ModuleFactorRule` themselves needed no changes — the bug was one level deeper.

```
npx vitest run tests/lib/Basic4WebGL/unit/parser/locPropagation.test.ts
```

If all three pass, the delegation rules are fine as-is — stop here, no compiler change needed, move to Task 2. If one fails, fix only that rule (attach the correct child/token loc at the point the error is thrown or the node is constructed) and re-run until green. Do not preemptively touch `BoolTermRule`/`ExpressionRule`/`ModuleFactorRule` — let the failing test tell you which one, if any, is actually wrong.

---

### Task 2: Thread `loc` through `LogItem` and `useCompiler`

**Files:**
- Modify: `src/Types/LogItem.ts`
- Modify: `src/hooks/useCompiler.ts`
- Modify: `tests/ui/hooks/useCompiler.test.tsx`

- [x] **Step 1: Write the failing test**

Add to `tests/ui/hooks/useCompiler.test.tsx`:

```ts
test('run attaches loc to error log entries when the diagnostic has one', () => {
  const loc = { line: 3, col: 5, filename: 'Main' };
  vi.spyOn(Basic4WebGL, 'transpile').mockReturnValue({
    code: undefined,
    diagnostics: [{ message: 'Undefined variable', severity: 'error', loc }],
  });

  const store = makeStore();
  const { result } = renderHook(() => useCompiler('p1'), { wrapper: wrapper(store) });

  act(() => { result.current.run(); });

  const errorLog = store.getState().session.logs.find((l) => l.text.startsWith('Undefined variable'));
  expect(errorLog?.loc).toEqual(loc);
});
```

- [x] **Step 2: Run to confirm it fails** — `LogItem` has no `loc` field yet, so `addLog` never carries one through.

```
npx vitest run tests/ui/hooks/useCompiler.test.tsx
```

- [x] **Step 3: Add `loc` to `LogItem`**

```ts
// src/Types/LogItem.ts
import { SourceLocation } from '../lib/CompilerLib/compiler/types';

export enum LogItemType {
  Notice,
  Warning,
  Error,
  Output,
}

export type LogItem = {
  text: string;
  type: LogItemType;
  loc?: SourceLocation;
};
```

- [x] **Step 4: Thread it through `useCompiler.ts`**

In `src/hooks/useCompiler.ts:32-37`, change the error-dispatch loop to include `loc: d.loc`:

```ts
result.diagnostics.forEach((d) => {
  const locStr = d.loc ? ` (${d.loc.filename}:${d.loc.line}:${d.loc.col})` : '';
  dispatch(addLog({ type: LogItemType.Error, text: d.message + locStr, loc: d.loc }));
});
```

- [x] **Step 5: Run to confirm it passes**

```
npx vitest run tests/ui/hooks/useCompiler.test.tsx
```

---

### Task 3: `toMarkers()` pure mapping function

**Files:**
- Create: `src/monacoHelpers/diagnostics.ts`
- Create: `tests/monacoHelpers/diagnostics.test.ts`

- [x] **Step 1: Write the failing tests**

```ts
// tests/monacoHelpers/diagnostics.test.ts
import { describe, test, expect } from 'vitest';
import { toMarkers } from '../../src/monacoHelpers/diagnostics';
import type { Diagnostic } from '../../src/lib/CompilerLib/compiler/types';

const fakeModel = { getLineMaxColumn: (line: number) => (line === 5 ? 40 : 1) };

describe('toMarkers', () => {
  test('maps a single diagnostic in the active file to one marker', () => {
    const diagnostics: Diagnostic[] = [
      { message: 'Undefined variable', severity: 'error', loc: { line: 5, col: 8, filename: 'Main' } },
    ];
    const markers = toMarkers(diagnostics, fakeModel as any, 'Main');
    expect(markers).toHaveLength(1);
    expect(markers[0]).toMatchObject({
      message: 'Undefined variable',
      startLineNumber: 5,
      startColumn: 8,
      endLineNumber: 5,
      endColumn: 40,
    });
  });

  test('returns no markers when the diagnostic has no loc', () => {
    const diagnostics: Diagnostic[] = [{ message: 'Something broke', severity: 'error' }];
    expect(toMarkers(diagnostics, fakeModel as any, 'Main')).toHaveLength(0);
  });

  test('returns no markers when the diagnostic belongs to a different file', () => {
    const diagnostics: Diagnostic[] = [
      { message: 'Undefined variable', severity: 'error', loc: { line: 5, col: 8, filename: 'Other' } },
    ];
    expect(toMarkers(diagnostics, fakeModel as any, 'Main')).toHaveLength(0);
  });

  test('returns no markers for an empty diagnostics array', () => {
    expect(toMarkers([], fakeModel as any, 'Main')).toHaveLength(0);
  });
});
```

- [x] **Step 2: Run to confirm it fails** — `../../src/monacoHelpers/diagnostics` doesn't exist yet.

- [x] **Step 3: Implement `toMarkers()`**

```ts
// src/monacoHelpers/diagnostics.ts
import type * as monaco from 'monaco-editor';
import type { Diagnostic } from '../lib/CompilerLib/compiler/types';

export function toMarkers(
  diagnostics: Diagnostic[],
  model: Pick<monaco.editor.ITextModel, 'getLineMaxColumn'>,
  activeFilename: string
): monaco.editor.IMarkerData[] {
  return diagnostics
    .filter((d) => d.loc && d.loc.filename === activeFilename)
    .map((d) => ({
      severity: 8, // monaco.MarkerSeverity.Error — avoid importing the runtime enum in a pure/testable module
      message: d.message,
      startLineNumber: d.loc!.line,
      startColumn: d.loc!.col,
      endLineNumber: d.loc!.line,
      endColumn: model.getLineMaxColumn(d.loc!.line),
    }));
}
```

Confirm the numeric value for `monaco.MarkerSeverity.Error` (it's `8` in current Monaco versions) rather than hardcoding blindly — check `node_modules/monaco-editor`'s type defs, or import the enum directly in the caller (`Editor/index.tsx`, which already has a live `monaco` instance) and pass severity in from there instead of hardcoding it in the pure function. Prefer the latter if it keeps `diagnostics.ts` free of a `monaco-editor` import — matches the existing pattern in `completions.ts`/`hover.ts`/`signatures.ts`, which take `monaco` as a parameter rather than importing the module directly.

- [x] **Step 4: Run to confirm it passes**

```
npx vitest run tests/monacoHelpers/diagnostics.test.ts
```

---

### Task 4: `useLiveDiagnostics` debounced hook

**Files:**
- Create: `src/hooks/useLiveDiagnostics.ts`
- Create: `tests/ui/hooks/useLiveDiagnostics.test.tsx`

- [x] **Step 1: Write the failing tests**

Follow the `renderHook` + fake store pattern from `tests/ui/hooks/useCompiler.test.tsx`, plus `vi.useFakeTimers()` to control the debounce:

```ts
// tests/ui/hooks/useLiveDiagnostics.test.tsx
import { renderHook, act } from '@testing-library/react';
import { vi, afterEach, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import filesReducer, { updateFile } from '../../../src/features/files/filesSlice';
import projectsReducer, { addProject } from '../../../src/features/projects/projectsSlice';
import packagesReducer from '../../../src/features/packages/packagesSlice';
import sessionReducer from '../../../src/features/session/sessionSlice';
import { useLiveDiagnostics } from '../../../src/hooks/useLiveDiagnostics';
import Basic4WebGL from '../../../src/lib/Basic4WebGL';
import React from 'react';

// wrapper/makeStore following useCompiler.test.tsx's pattern, seeded with one file

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

test('does not compile before the debounce interval elapses', () => {
  const spy = vi.spyOn(Basic4WebGL, 'transpile');
  const store = makeStore();
  renderHook(() => useLiveDiagnostics('p1'), { wrapper: wrapper(store) });

  act(() => { vi.advanceTimersByTime(200); });
  expect(spy).not.toHaveBeenCalled();
});

test('compiles silently after the debounce interval, without touching session state', () => {
  vi.spyOn(Basic4WebGL, 'transpile').mockReturnValue({
    diagnostics: [{ message: 'Undefined variable', severity: 'error', loc: { line: 1, col: 1, filename: 'Main' } }],
  });
  const store = makeStore();
  const { result } = renderHook(() => useLiveDiagnostics('p1'), { wrapper: wrapper(store) });

  act(() => { vi.advanceTimersByTime(500); });

  expect(result.current).toHaveLength(1);
  expect(store.getState().session.logs).toHaveLength(0);
  expect(store.getState().session.transpiled).toBe('');
});

test('resets the timer on rapid successive changes (only compiles once)', () => {
  const spy = vi.spyOn(Basic4WebGL, 'transpile').mockReturnValue({ diagnostics: [] });
  const store = makeStore();
  const { rerender } = renderHook(() => useLiveDiagnostics('p1'), { wrapper: wrapper(store) });

  act(() => {
    store.dispatch(updateFile({ id: 'f1', projectId: 'p1', name: 'Main', source: 'a' } as any));
    vi.advanceTimersByTime(200);
    store.dispatch(updateFile({ id: 'f1', projectId: 'p1', name: 'Main', source: 'ab' } as any));
    vi.advanceTimersByTime(200);
  });
  rerender();
  act(() => { vi.advanceTimersByTime(500); });

  expect(spy).toHaveBeenCalledTimes(1);
});
```

Adjust the `updateFile`/store seeding details to match `filesSlice`'s actual action shape and however `useProjectForBuild.test.tsx` seeds a project+file — copy that setup rather than guessing field names.

- [x] **Step 2: Run to confirm it fails**

- [x] **Step 3: Implement the hook**

```ts
// src/hooks/useLiveDiagnostics.ts
import { useEffect, useState } from 'react';
import { useProjectForBuild } from './useProjectForBuild';
import Basic4WebGL from '../lib/Basic4WebGL';
import { Diagnostic } from '../lib/CompilerLib/compiler/types';

const DEBOUNCE_MS = 450;

export const useLiveDiagnostics = (projectId: string): Diagnostic[] => {
  const buildProject = useProjectForBuild(projectId);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (buildProject.dependencyError) {
        setDiagnostics([]);
        return;
      }
      const result = Basic4WebGL.transpile(buildProject);
      setDiagnostics(result.diagnostics);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [buildProject]);

  return diagnostics;
};
```

- [x] **Step 4: Run to confirm it passes**

---

### Task 5: Wire markers and `jumpTo` into `Editor`

**Files:**
- Modify: `src/components/Editor/index.tsx`
- Create: `tests/ui/components/Editor/Editor.test.tsx`

- [x] **Step 1: Write the failing tests**

Mock `@monaco-editor/react` with a controllable fake that captures `onMount` and exposes a fake editor instance (`setPosition`, `revealPositionInCenter`, `focus` as `vi.fn()`), plus a fake model with `getLineMaxColumn` — similar in spirit to the `vi.mock('@monaco-editor/react', ...)` already used in `EditPage.test.tsx`, but richer:

```ts
// tests/ui/components/Editor/Editor.test.tsx
const fakeModel = { getLineMaxColumn: () => 40 };
const fakeEditor = { setPosition: vi.fn(), revealPositionInCenter: vi.fn(), focus: vi.fn(), getModel: () => fakeModel };

vi.mock('@monaco-editor/react', () => ({
  default: ({ onMount }: any) => { onMount?.(fakeEditor, {}); return null; },
  useMonaco: () => ({ /* minimal stub: languages.register, editor.setModelMarkers spy, etc. */ }),
}));
```

Cases to cover:
- Rendering with a `diagnostics` prop (or via a mocked `useLiveDiagnostics`) whose `loc.filename` matches the open file calls `monaco.editor.setModelMarkers` with one marker.
- A diagnostic for a different filename results in an empty markers call (or no call).
- Passing a new `jumpTo={{ line: 7, col: 3 }}` prop calls `fakeEditor.setPosition({ lineNumber: 7, column: 3 })`, `revealPositionInCenter`, and `focus`.
- `jumpTo={null}`/unset does not call any of those.

Check how `useLiveDiagnostics` should be invoked from inside `Editor` — it needs `projectId`, which `Editor` doesn't currently receive (`SBEditorProps` only has `file`, `height`, `onChange`, `onCursorChange`). Decide here whether to (a) add a `projectId` prop to `Editor` and call `useLiveDiagnostics` internally, or (b) lift `useLiveDiagnostics` up to `EditPage` (which already has `projectId`) and pass `diagnostics` down as a prop instead. **Prefer (b)** — keeps `Editor` a dumber, more testable component (it already receives `file` as a prop rather than fetching it itself), and matches the existing pattern where `EditPage` owns data-fetching and `Editor` just renders. Adjust the File Map/tests above accordingly: `Editor` takes a new `diagnostics: Diagnostic[]` prop instead of calling the hook itself.

- [x] **Step 2: Run to confirm it fails**

- [x] **Step 3: Implement**

```tsx
// src/components/Editor/index.tsx (additions)
import type * as monacoT from 'monaco-editor';
import { toMarkers } from '../../monacoHelpers/diagnostics';
import { Diagnostic } from '../../lib/CompilerLib/compiler/types';

type SBEditorProps = {
  file: IFile | undefined;
  height: string;
  onChange: (source: string | undefined) => void;
  onCursorChange?: (line: number, col: number) => void;
  diagnostics?: Diagnostic[];
  jumpTo?: { line: number; col: number } | null;
};

// inside the component:
const editorRef = useRef<monacoT.editor.IStandaloneCodeEditor | null>(null);

const handleMount: OnMount = (editor) => {
  editorRef.current = editor;
  editor.onDidChangeCursorPosition((e) => {
    onCursorChange?.(e.position.lineNumber, e.position.column);
  });
};

useEffect(() => {
  const ed = editorRef.current;
  const model = ed?.getModel();
  if (!monaco || !ed || !model || !file) return;
  const markers = toMarkers(diagnostics ?? [], model, file.name);
  monaco.editor.setModelMarkers(model, 'softbasic', markers);
}, [monaco, diagnostics, file?.id]);

useEffect(() => {
  if (!jumpTo || !editorRef.current) return;
  editorRef.current.setPosition({ lineNumber: jumpTo.line, column: jumpTo.col });
  editorRef.current.revealPositionInCenter({ lineNumber: jumpTo.line, column: jumpTo.col });
  editorRef.current.focus();
}, [jumpTo]);
```

Confirm the exact `file.name` vs `file.fullName` field to key the marker filter on — must match whatever `SourceLocation.filename` actually contains (per the spec, `useProjectForBuild.ts:37-40` uses `f.name`, so use `file.name` here too, not `file.fullName`).

- [x] **Step 4: Run to confirm it passes**

---

### Task 6: Clickable error entries in `BottomPanel`

**Files:**
- Modify: `src/components/BottomPanel/index.tsx`
- Modify: `tests/ui/components/BottomPanel/BottomPanel.test.tsx`

- [x] **Step 1: Write the failing tests**

Add to the existing test file:

```ts
test('clicking an error log entry with a loc calls onJumpToLoc', async () => {
  const user = userEvent.setup();
  const onJumpToLoc = vi.fn();
  const loc = { line: 4, col: 1, filename: 'main.bas' };
  const logsWithLoc = [
    { type: LogItemType.Error, text: 'main.bas:4 undefined var', loc },
  ];
  render(<BottomPanel logs={logsWithLoc} onJumpToLoc={onJumpToLoc} />);
  await user.click(screen.getByText('main.bas:4 undefined var'));
  expect(onJumpToLoc).toHaveBeenCalledWith(loc);
});

test('error entries without a loc are not clickable', async () => {
  const user = userEvent.setup();
  const onJumpToLoc = vi.fn();
  render(<BottomPanel logs={logs} onJumpToLoc={onJumpToLoc} />);
  await user.click(screen.getByText('main.bas:4 undefined var'));
  expect(onJumpToLoc).not.toHaveBeenCalled();
});
```

(`logs` here is the existing fixture at the top of the file, whose Error entry has no `loc`.)

- [x] **Step 2: Run to confirm it fails**

- [x] **Step 3: Implement**

```tsx
// src/components/BottomPanel/index.tsx
type BottomPanelProps = {
  logs: LogItem[];
  onJumpToLoc?: (loc: SourceLocation) => void;
};

// in the log <li> rendering:
{visibleLogs.map((log, i) => (
  <li
    key={i}
    className={`flex items-start gap-2 px-1 py-0.5 ${log.loc ? 'cursor-pointer hover:bg-ds-surface-2' : ''}`}
    onClick={log.loc ? () => onJumpToLoc?.(log.loc!) : undefined}
  >
    ...
  </li>
))}
```

- [x] **Step 4: Run to confirm it passes**

---

### Task 7: Wire it up in `EditPage`

**Files:**
- Modify: `src/pages/EditPage.tsx`
- Modify: `tests/ui/pages/EditPage.test.tsx`

- [x] **Step 1: Write the failing test**

Extend `EditPage.test.tsx` (which already seeds a project/store and renders `EditPage` with Monaco mocked to `null`) to: seed a second file, dispatch an error log with a `loc` pointing at that second file, click the corresponding `BottomPanel` entry, and assert the selected file switched (check the resulting `state.ui`/whatever `selectFile` updates) — this is verifiable even with Monaco mocked out, since it only tests the `onJumpToLoc` → `selectFile` dispatch chain, not the actual cursor move (that's covered in Task 5's `Editor.test.tsx`).

- [x] **Step 2: Run to confirm it fails**

- [x] **Step 3: Implement**

```tsx
// src/pages/EditPage.tsx
const [jumpTarget, setJumpTarget] = useState<{ line: number; col: number } | null>(null);

const handleJumpToLoc = (loc: SourceLocation) => {
  const target = files.find((f) => f.name === loc.filename);
  if (!target) return;
  dispatch(selectFile({ projectId: project.id, fileId: target.id }));
  setJumpTarget({ line: loc.line, col: loc.col });
};

// pass diagnostics down too:
const diagnostics = useLiveDiagnostics(project.id);

// <Editor ... diagnostics={diagnostics} jumpTo={jumpTarget} />
// <BottomPanel logs={logs} onJumpToLoc={handleJumpToLoc} />
```

Reset or leave `jumpTarget` after it's consumed — if `Editor`'s jump effect is keyed only on `jumpTo` reference identity, clicking the *same* error twice in a row (same `{line, col}` object shape but a new object each time) still needs to re-trigger the effect. Since `handleJumpToLoc` always creates a fresh object, a `[jumpTo]` dependency on object reference is sufficient — no explicit reset needed. Confirm this during implementation rather than assuming.

- [x] **Step 4: Run to confirm it passes**

---

### Task 8: Roadmap update

**Files:**
- Modify: `docs/roadmap.md`

- [x] Mark "Error underlining" done in the Milestone 2 deliverables list, describing the shipped behaviour (live squiggle in the active file only; click-to-jump from the console for cross-file navigation; no auto-switching). Leave "Dynamic symbol resolution" as the one remaining M2 item, matching the split agreed on 2026-07-31.

No version bump / release notes update as part of this task — per this project's convention, that only happens when explicitly asked to push.

---

### Task 9: Full verification

- [x] `npx vitest run` — full suite green (917 passed, 2 skipped scratch debug files)
- [x] `npx vite build` — clean build
- [ ] Manual smoke check via the dev server (`npm run dev`): type an error into a file, confirm the squiggle appears after the debounce without any Build/Run click; click a cross-file error in the console and confirm it switches tabs and lands the cursor at the right line. **Skipped** — no interactive browser session available; deferred to a future session. Automated coverage (`Editor.test.tsx`, `EditPage.test.tsx`, `useLiveDiagnostics.test.tsx`) exercises the same logic with Monaco mocked.
