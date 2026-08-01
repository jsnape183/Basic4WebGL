# Dynamic Symbol Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend autocomplete, hover, and signature help beyond the static library catalogue to resolve user-defined functions, classes, and in-scope variables — closing out the last Milestone 2 deliverable. Full design rationale, code sketches, and the compiler-internals investigation behind every decision below live in `docs/superpowers/specs/2026-08-01-dynamic-symbol-resolution-design.md` — read it first; this plan assumes it.

**Architecture (one-line recap):** `Symbols.getSnapshot()` exposes a serializable, flat symbol table. `useLiveDiagnostics` (renamed `useLiveAnalysis`) already debounce-compiles for error underlining — it now also caches the snapshot, but **only advances it on a zero-diagnostic compile** (last-known-good; no parser error-recovery work). A new `scopeScanner.ts` textually tracks live `function`/`endfunction` and `constructor`/`endconstructor` nesting at the cursor (independent of the compiler, so it works on a currently-broken buffer) — block constructs (`if`/`for`/`while`/`do`) deliberately don't nest scope, matching the compiler today (tracked as an open design question in `docs/roadmap.md`'s parking lot, not solved here). A new `symbolCatalogue.ts` is the dynamic mirror of the static `catalogue.ts`, merged into `completions.ts`/`hover.ts`/`signatures.ts` as a fallback after the static catalogue.

**Tech Stack:** Monaco Editor via `@monaco-editor/react`, React, Redux Toolkit, TypeScript, Vitest, Testing Library

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/lib/CompilerLib/symbols/index.ts` | MODIFY | Add `Symbols.getSnapshot()` + export `SymbolSnapshotEntry` |
| `tests/lib/CompilerLib/unit/symbols/symbolTable.test.ts` | MODIFY | `getSnapshot()` unit cases |
| `src/lib/CompilerLib/compiler/types.ts` | MODIFY | Add `symbols?: SymbolSnapshotEntry[]` to `CompileResult` |
| `src/lib/Basic4WebGL/index.ts` | MODIFY | Return snapshot on the success path of `transpile()` |
| `tests/lib/Basic4WebGL/integration/compiler/symbolSnapshot.test.ts` | CREATE | End-to-end snapshot shape, including constructor-parameters caveat |
| `src/hooks/useLiveDiagnostics.ts` | RENAME → `src/hooks/useLiveAnalysis.ts` | Broaden to `{ diagnostics, symbols }`; last-known-good caching |
| `tests/ui/hooks/useLiveDiagnostics.test.tsx` | RENAME → `tests/ui/hooks/useLiveAnalysis.test.tsx` | Existing cases + snapshot persistence across a failing compile |
| `src/monacoHelpers/scopeScanner.ts` | CREATE | `scanEnclosingScope()` |
| `tests/monacoHelpers/scopeScanner.test.ts` | CREATE | Nesting cases |
| `src/monacoHelpers/symbolCatalogue.ts` | CREATE | `getVisibleSymbols`, `getMembers`, `resolveOwnerScopeName`, `getCallableSignature` |
| `tests/monacoHelpers/symbolCatalogue.test.ts` | CREATE | Pure-function cases |
| `src/monacoHelpers/completions.ts` | MODIFY | Bare-word branch; dynamic fallback in dot-context branch |
| `src/monacoHelpers/hover.ts` | MODIFY | Dynamic fallback in bare-word branch |
| `src/monacoHelpers/signatures.ts` | MODIFY | Dynamic fallback in bare-word branch |
| `tests/monacoHelpers/completions.test.ts`, `hover.test.ts`, `signatures.test.ts` | MODIFY | Dynamic-symbol cases; static-wins-on-conflict case |
| `src/components/Editor/index.tsx` | MODIFY | `symbols` prop → ref; pass `SymbolContext` into register calls |
| `tests/ui/components/Editor/Editor.test.tsx` | MODIFY | `symbols` prop reaches the provider context |
| `src/pages/EditPage.tsx` | MODIFY | Switch to `useLiveAnalysis`; pass `symbols` to `<Editor>` |
| `tests/ui/pages/EditPage.test.tsx` | MODIFY | Smoke-check the new hook wiring doesn't break existing tests |
| `docs/roadmap.md` | MODIFY | Mark "Dynamic symbol resolution" done; note Milestone 2 is now fully closed |

---

### Task 1: `Symbols.getSnapshot()` and compiler wiring

**Files:**
- Modify: `src/lib/CompilerLib/symbols/index.ts`
- Modify: `tests/lib/CompilerLib/unit/symbols/symbolTable.test.ts`
- Modify: `src/lib/CompilerLib/compiler/types.ts`
- Modify: `src/lib/Basic4WebGL/index.ts`
- Create: `tests/lib/Basic4WebGL/integration/compiler/symbolSnapshot.test.ts`

- [x] **Step 1: Write the failing unit tests for `getSnapshot()`**

Add to `tests/lib/CompilerLib/unit/symbols/symbolTable.test.ts`, following that file's existing `Symbols` construction pattern:

```ts
test('getSnapshot maps a plain variable', () => {
  const table = new Symbols(getBuiltInType(builtInTypes.Variant), (a, b) => a === b);
  table.add('score', symbolTypes.Variable);
  const snap = table.getSnapshot().find(s => s.name === 'score');
  expect(snap).toMatchObject({ name: 'score', kind: 'Variable', scopeName: '', fullScope: '' });
});

test('getSnapshot carries classSymbol name for a typed array', () => {
  const table = new Symbols(getBuiltInType(builtInTypes.Variant), (a, b) => a === b);
  const classSym = table.addTyped(new (require('@Basic4WebGL/symbolTypes').ArraySymbol)(
    'enemy', symbolTypes.Class, table.getScope(), table.getFullScopeName(), 0
  ));
  const arr = new (require('@Basic4WebGL/symbolTypes').ArraySymbol)(
    'enemies', symbolTypes.Array, table.getScope(), table.getFullScopeName(), 1, classSym
  );
  table.addTyped(arr);
  const snap = table.getSnapshot().find(s => s.name === 'enemies');
  expect(snap).toMatchObject({ kind: 'Array', dimensions: 1, className: 'enemy' });
});
```

Adjust imports/construction to match whatever the existing top of `symbolTable.test.ts` already sets up (`builtInTypes`, `getBuiltInType`, `symbolTypes`) — don't reintroduce a second way of constructing a `Symbols` instance.

- [x] **Step 2: Run to confirm it fails** — `getSnapshot` doesn't exist yet.

```
npx vitest run tests/lib/CompilerLib/unit/symbols/symbolTable.test.ts
```

- [x] **Step 3: Implement `getSnapshot()`**

Per the spec's Architecture §1 — add the method and export `SymbolSnapshotEntry` from `src/lib/CompilerLib/symbols/index.ts`. Map `classSymbol?.name`, `parentClassName`, `isParam`, `dimensions`, and `parameters` (recursively mapping each `FunctionSymbol.parameters` entry's own `classSymbol?.name`) — all of these are dynamically-added properties on subclasses (`ArraySymbol`, `DictionarySymbol`, `FunctionSymbol`) or bolted on ad hoc (`isParam`, `classSymbol` on cloned Object symbols), so read them via an `as any` cast at the mapping boundary rather than widening the base `Symbol` class's declared shape.

- [x] **Step 4: Run to confirm it passes**

- [x] **Step 5: Add `symbols?: SymbolSnapshotEntry[]` to `CompileResult`**

`src/lib/CompilerLib/compiler/types.ts` — import `SymbolSnapshotEntry` from `@CompilerLib/symbols`.

- [x] **Step 6: Write the failing integration test**

```ts
// tests/lib/Basic4WebGL/integration/compiler/symbolSnapshot.test.ts
import compiler from '@Basic4WebGL/index';

test('transpile returns a symbol snapshot including a constructor parameter, derived via fullScope not .parameters', () => {
  const src = [
    'Class',
    'constructor(hp)',
    '  self.hp = hp',
    'endconstructor',
    'function takedamage(amount)',
    '  self.hp = self.hp - amount',
    'endfunction',
  ].join('\n');
  const result = compiler.transpile({ lib: [], files: [{ name: 'Enemy', source: src }] });

  expect(result.diagnostics).toHaveLength(0);
  const symbols = result.symbols!;

  // Regular function: .parameters is populated directly.
  const takedamage = symbols.find(s => s.kind === 'Function' && s.name === 'takedamage');
  expect(takedamage?.parameters?.map(p => p.name)).toEqual(['amount']);

  // Constructor: .parameters is NOT populated (ConstructorRule hardcodes []) — the
  // real param must be found by filtering on fullScope instead.
  const ctorGuard = symbols.find(s => s.kind === 'Function' && s.name === 'constructor');
  expect(ctorGuard?.parameters).toEqual([]);
  const ctorParam = symbols.find(s => s.isParam && s.fullScope === 'Enemy.constructor');
  expect(ctorParam?.name.toLowerCase()).toBe('hp');
});
```

Check the exact `fullScope` casing/format this produces against what `Symbols.getFullScopeName()` actually returns (it joins scope *names* as stored — confirm whether the class scope name is `'Enemy'` or `'enemy'` by running the test first) and adjust the assertion rather than assuming.

- [x] **Step 7: Run to confirm it fails, then wire `Basic4WebGL.transpile()`**

In `src/lib/Basic4WebGL/index.ts`, add `symbols: parseResult.symbolTable.getSnapshot()` to the success-path return object only. Do not touch the `catch` block (per the spec's last-known-good decision, failed compiles never need to return symbols).

- [x] **Step 8: Run to confirm it passes**

```
npx vitest run tests/lib/CompilerLib/unit/symbols/symbolTable.test.ts tests/lib/Basic4WebGL/integration/compiler/symbolSnapshot.test.ts
```

---

### Task 2: `useLiveDiagnostics` → `useLiveAnalysis`

**Files:**
- Rename: `src/hooks/useLiveDiagnostics.ts` → `src/hooks/useLiveAnalysis.ts`
- Rename: `tests/ui/hooks/useLiveDiagnostics.test.tsx` → `tests/ui/hooks/useLiveAnalysis.test.tsx`

- [x] **Step 1: Write the failing test** (add to the renamed test file, alongside the existing debounce cases which must keep passing under the new name/shape)

```ts
test('a symbol snapshot from a clean compile survives a subsequent failing compile', () => {
  const spy = vi.spyOn(Basic4WebGL, 'transpile');
  spy.mockReturnValueOnce({ diagnostics: [], symbols: [{ name: 'score', kind: 'Variable', scopeName: '', scopeType: '', fullScope: '' }] });

  const store = makeStore();
  const { result, rerender } = renderHook(() => useLiveAnalysis('p1'), { wrapper: wrapper(store) });
  act(() => { vi.advanceTimersByTime(500); });
  expect(result.current.symbols).toHaveLength(1);

  spy.mockReturnValueOnce({ diagnostics: [{ message: 'oops', severity: 'error' }] });
  store.dispatch(updateFile({ id: 'f1', projectId: 'p1', name: 'Main', source: 'broken' } as any));
  act(() => { vi.advanceTimersByTime(500); });
  rerender();

  expect(result.current.diagnostics).toHaveLength(1);
  expect(result.current.symbols).toHaveLength(1); // unchanged — last-known-good
});
```

Match the existing file's `makeStore`/`wrapper` setup exactly — don't rebuild it.

- [x] **Step 2: Run to confirm it fails**

- [x] **Step 3: Implement** — per the spec's Architecture §2 sketch. `setDiagnostics` always runs; `setSymbols` only runs when `result.diagnostics.length === 0 && result.symbols`. Rename the exported function and the file; update the one import site (`EditPage.tsx` — updated in Task 9, so this hook will have a temporarily-unused new name/shape until then, which is fine mid-plan).

- [x] **Step 4: Run to confirm it passes**

```
npx vitest run tests/ui/hooks/useLiveAnalysis.test.tsx
```

---

### Task 3: `scopeScanner.ts`

**Files:**
- Create: `src/monacoHelpers/scopeScanner.ts`
- Create: `tests/monacoHelpers/scopeScanner.test.ts`

- [x] **Step 1: Write the failing tests**

```ts
import { scanEnclosingScope } from '../../src/monacoHelpers/scopeScanner';

const at = (text: string, line: number, col: number) => scanEnclosingScope(text, line, col);

test('top level of a file returns an empty stack', () => {
  expect(at('dim x = 1\nprint x\n', 2, 1)).toEqual([]);
});

test('inside a function body returns the function name', () => {
  const src = ['function takedamage(amount)', '  dim x = 1', 'endfunction'].join('\n');
  expect(at(src, 2, 3)).toEqual(['takedamage']);
});

test('after endfunction returns to the empty stack', () => {
  const src = ['function foo()', 'endfunction', 'print "done"'].join('\n');
  expect(at(src, 3, 1)).toEqual([]);
});

test('inside a constructor returns ["constructor"]', () => {
  const src = ['Class', 'constructor(hp)', '  self.hp = hp', 'endconstructor'].join('\n');
  expect(at(src, 3, 3)).toEqual(['constructor']);
});

test('cursor on the same line as the function open, before the block closes, is inside it', () => {
  const src = 'function foo(x, y)';
  expect(at(src, 1, 20)).toEqual(['foo']);
});

test('is case-insensitive for keywords', () => {
  const src = ['FUNCTION Foo()', 'ENDFUNCTION'].join('\n');
  expect(at(src, 1, 15)).toEqual(['foo']);
});

test('an unbalanced buffer (mid-edit, missing endfunction) does not throw', () => {
  const src = ['function foo()', '  dim x = 1'].join('\n');
  expect(() => at(src, 2, 3)).not.toThrow();
  expect(at(src, 2, 3)).toEqual(['foo']);
});

test('does not pop the constructor frame on a bare endfunction line', () => {
  const src = ['Class', 'constructor(hp)', 'endfunction', 'endconstructor'].join('\n');
  // malformed input (endfunction inside a constructor) — must not corrupt the stack
  expect(() => at(src, 4, 1)).not.toThrow();
});
```

- [x] **Step 2: Run to confirm it fails**

- [x] **Step 3: Implement** — per the spec's Architecture §3 code sketch. Regex-match against each line up to (and, for the cursor's own line, only up to `cursorCol - 1` of) the cursor position.

- [x] **Step 4: Run to confirm it passes**

```
npx vitest run tests/monacoHelpers/scopeScanner.test.ts
```

---

### Task 4: `symbolCatalogue.ts`

**Files:**
- Create: `src/monacoHelpers/symbolCatalogue.ts`
- Create: `tests/monacoHelpers/symbolCatalogue.test.ts`

- [x] **Step 1: Write the failing tests**

Build a hand-written `SymbolSnapshotEntry[]` fixture representing a small project: a global `score` variable, a `talk` file with a top-level `sayhello` function, an `Enemy` class file with a `hp` field... (adjust to what's actually representable — a plain `dim hp` at class scope, a `constructor` with an `hp` param per the Task 1 caveat, and a `takedamage(amount)` method), plus a `dim e as Enemy` object and a `dim enemies(10) as Enemy` typed array in a `Main` file. Cover, per the spec's Architecture §4:

```ts
test('getVisibleSymbols includes globals, the file module scope, and each scope-stack frame', () => { /* ... */ });
test('getMembers returns a class scope\'s members for a typed-array owner', () => { /* ... */ });

test('resolveOwnerScopeName: Object variable resolves to its own name', () => {
  // dim e as Enemy -> 'e', not 'enemy'
});
test('resolveOwnerScopeName: typed array resolves to the class name, not the variable name', () => {
  // dim enemies(10) as Enemy -> 'enemy'
});
test('resolveOwnerScopeName: another file/module resolves to itself', () => {
  // 'talk' -> 'talk'
});
test('resolveOwnerScopeName: a plain Variable owner returns null', () => { /* ... */ });

test('getCallableSignature returns .parameters for a regular function', () => { /* ... */ });
test('getCallableSignature falls back to a fullScope filter for a constructor', () => {
  // must return the real 'hp' param, not the empty [] on the guard FunctionSymbol
});

test('all lookups are case-insensitive', () => {
  // identifier typed as 'ENEMIES' or 'Enemies' still resolves
});
```

- [x] **Step 2: Run to confirm it fails**

- [x] **Step 3: Implement** — per the spec's Architecture §4. `resolveOwnerScopeName`'s scope-priority search (innermost `scopeStack` frame first, then the file's own module scope, then globals) mirrors `Symbols.retrieveSymbol`'s priority order — don't just take the first match found anywhere in the snapshot.

- [x] **Step 4: Run to confirm it passes**

```
npx vitest run tests/monacoHelpers/symbolCatalogue.test.ts
```

---

### Task 5: Dynamic completions

**Files:**
- Modify: `src/monacoHelpers/completions.ts`
- Modify: `tests/monacoHelpers/completions.test.ts`

- [x] **Step 1: Write the failing tests** — a bare-word case (no dot before the cursor) that returns dynamic symbols from a fixture snapshot; a dot-context case where the module name isn't in the static `CATALOGUE` but is in the dynamic snapshot; a conflict case confirming the static catalogue entry wins when both exist for the same name.

- [x] **Step 2: Run to confirm it fails**

- [x] **Step 3: Implement.** `registerCompletionProvider` needs the `SymbolContext` (see spec Architecture §5) threaded in as a parameter — update its signature and the one call site (deferred to Task 8, so this file will have a temporarily-updated signature with no caller update until then — fine mid-plan, `Editor.test.tsx` isn't touched until Task 8 either). Bare-word branch calls `scanEnclosingScope` on `model.getValue()` up to `position`, then `getVisibleSymbols`. Dot-context branch: keep the existing static check first; only call `resolveOwnerScopeName` + `getMembers` when `!isKnownModule(moduleName)`.

- [x] **Step 4: Run to confirm it passes**

```
npx vitest run tests/monacoHelpers/completions.test.ts
```

---

### Task 6: Dynamic hover

**Files:**
- Modify: `src/monacoHelpers/hover.ts`
- Modify: `tests/monacoHelpers/hover.test.ts`

- [x] **Step 1: Write the failing tests** — hovering a user function name shows its signature; hovering a variable shows its kind/class (e.g. `e : Enemy`); static `getConstructor` result still wins over a same-named dynamic symbol.

- [x] **Step 2: Run to confirm it fails**

- [x] **Step 3: Implement** — extend the existing "Case 2: bare word" branch (currently only `getConstructor`) with a dynamic fallback using the same `SymbolContext` parameter added in Task 5.

- [x] **Step 4: Run to confirm it passes**

```
npx vitest run tests/monacoHelpers/hover.test.ts
```

---

### Task 7: Dynamic signature help

**Files:**
- Modify: `src/monacoHelpers/signatures.ts`
- Modify: `tests/monacoHelpers/signatures.test.ts`

- [x] **Step 1: Write the failing tests** — typing `takedamage(` shows `amount` as the active parameter; typing `new Enemy(` shows the real constructor param (`hp`), not an empty signature.

- [x] **Step 2: Run to confirm it fails**

- [x] **Step 3: Implement** — extend the existing bare-word branch (already structurally present for `getConstructor`) with `getCallableSignature`.

- [x] **Step 4: Run to confirm it passes**

```
npx vitest run tests/monacoHelpers/signatures.test.ts
```

---

### Task 8: Wire `symbols` through `Editor`

**Files:**
- Modify: `src/components/Editor/index.tsx`
- Modify: `tests/ui/components/Editor/Editor.test.tsx`

- [x] **Step 1: Write the failing test** — pass a `symbols` prop with a fixture entry; assert that a completion/hover/signature request issued through the mocked `monaco` after mount reflects it (or, if the existing mock doesn't exercise provider callbacks directly, assert the ref-sync effect ran — check what `Editor.test.tsx`'s existing mock actually allows before deciding which is testable, matching how Task 5 of the error-underlining plan resolved an analogous question).

- [x] **Step 2: Run to confirm it fails**

- [x] **Step 3: Implement** — add `symbols?: SymbolSnapshotEntry[]` to `SBEditorProps`; keep it in a ref (`symbolsRef`) updated via a `useEffect([symbols])`, matching the existing `editorRef`/`jumpTo` pattern. Build the `SymbolContext` object (`getSymbols: () => symbolsRef.current ?? []`, `getActiveFilename: () => file?.name`) and pass it into the three `register*Provider` calls alongside `monaco`.

- [x] **Step 4: Run to confirm it passes**

```
npx vitest run tests/ui/components/Editor/Editor.test.tsx
```

---

### Task 9: Wire it up in `EditPage`

**Files:**
- Modify: `src/pages/EditPage.tsx`
- Modify: `tests/ui/pages/EditPage.test.tsx`

- [x] **Step 1:** Replace `const diagnostics = useLiveDiagnostics(id ?? '')` with `const { diagnostics, symbols } = useLiveAnalysis(id ?? '')`; pass `symbols={symbols}` to `<Editor>`.

- [x] **Step 2: Run the existing `EditPage.test.tsx` suite to confirm nothing regresses** — this task shouldn't need new test cases (the hook rename/broadening is already covered by Task 2, the prop plumbing by Task 8); it's the integration point, so a green existing suite is the bar, not new assertions. If the existing tests mock `useLiveDiagnostics` directly by name, update those mocks to `useLiveAnalysis` returning `{ diagnostics, symbols }`.

```
npx vitest run tests/ui/pages/EditPage.test.tsx
```

---

### Task 10: Roadmap update

**Files:**
- Modify: `docs/roadmap.md`

- [x] Mark "Dynamic symbol resolution" done in the Milestone 2 deliverables/remaining-scope list, describing the shipped behaviour (last-known-good symbol snapshot from the existing debounced compile; live textual scope detection for function/constructor nesting; block-level scoping explicitly out of scope, tracked separately in the parking lot). Note that this closes Milestone 2 — the *next* push is a minor bump (`v0.4.0`) per the versioning model, not something to do in this task's commit.

No version bump / release notes update as part of this task — per this project's convention, that only happens when explicitly asked to push.

---

### Task 11: Full verification

- [x] `npx vitest run` — full suite green (958 passed, 2 skipped scratch debug files)
- [x] `npx vite build` — clean build
- [ ] Manual smoke check via the dev server (`npm run dev`): define a function and a class with a constructor in one file, confirm bare-word completion suggests the function name and hovering shows its params; in another file, `dim e as ClassName` and confirm `e.` suggests the class's methods; confirm the static library catalogue (e.g. `math.`) is unaffected. **Skipped** — no interactive browser session available; deferred to a future session. Automated coverage (`completions.test.ts`, `hover.test.ts`, `signatures.test.ts`, `symbolCatalogue.test.ts`, `scopeScanner.test.ts`, `Editor.test.tsx`) exercises the same logic with Monaco mocked.
