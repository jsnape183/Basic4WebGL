# File Dependency Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically sort user files into correct compile order so that any file referencing another class/module is always compiled after it, regardless of where the user placed it in the file tree.

**Architecture:** A pure `sortByDependencies` function (Kahn's topological sort, word-boundary regex dependency scan) is inserted into `useProjectForBuild` between the file list and the compiler. `useCompiler` gets an early-return guard for circular dependency errors. No compiler changes, no Redux changes, no UI changes.

**Tech Stack:** TypeScript, Vitest (unit tests), React hooks (wiring only)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/Basic4WebGL/sortByDependencies.ts` | Pure sort function + `SortResult` type |
| Create | `tests/lib/Basic4WebGL/unit/sortByDependencies.test.ts` | All 10 test cases |
| Modify | `src/hooks/useProjectForBuild.ts` | Call sort; expose `dependencyError` |
| Modify | `src/hooks/useCompiler.ts` | Early-exit on `dependencyError` |
| Modify | `src/docs/language-guide/multi-file.md` | Rewrite Load Order section |

---

## Task 1: Write failing tests for `sortByDependencies`

**Files:**
- Create: `tests/lib/Basic4WebGL/unit/sortByDependencies.test.ts`

- [ ] **Step 1: Create the test file**

```ts
// tests/lib/Basic4WebGL/unit/sortByDependencies.test.ts
import { describe, test, expect } from 'vitest';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { ProjectFile } from '@CompilerLib/compiler/types';

const f = (name: string, source = ''): ProjectFile => ({ name, source });

describe('sortByDependencies', () => {
  test('empty array returns empty', () => {
    const { files, error } = sortByDependencies([]);
    expect(error).toBeUndefined();
    expect(files).toEqual([]);
  });

  test('no dependencies — preserves original order', () => {
    const { files, error } = sortByDependencies([f('A'), f('B'), f('C')]);
    expect(error).toBeUndefined();
    expect(files.map((x) => x.name)).toEqual(['A', 'B', 'C']);
  });

  test('direct dependency — dependent compiled after', () => {
    const { files, error } = sortByDependencies([
      f('Main', 'new Enemy()'),
      f('Enemy', ''),
    ]);
    expect(error).toBeUndefined();
    expect(files.map((x) => x.name)).toEqual(['Enemy', 'Main']);
  });

  test('transitive chain — full chain resolved', () => {
    const { files, error } = sortByDependencies([
      f('Main', 'new Enemy()'),
      f('Enemy', 'new Ammo()'),
      f('Ammo', ''),
    ]);
    expect(error).toBeUndefined();
    const names = files.map((x) => x.name);
    expect(names.indexOf('Ammo')).toBeLessThan(names.indexOf('Enemy'));
    expect(names.indexOf('Enemy')).toBeLessThan(names.indexOf('Main'));
  });

  test('diamond dependency — base before both; both before main', () => {
    const { files, error } = sortByDependencies([
      f('Main', 'new A()\nnew B()'),
      f('A', 'new Base()'),
      f('B', 'new Base()'),
      f('Base', ''),
    ]);
    expect(error).toBeUndefined();
    const names = files.map((x) => x.name);
    expect(names.indexOf('Base')).toBeLessThan(names.indexOf('A'));
    expect(names.indexOf('Base')).toBeLessThan(names.indexOf('B'));
    expect(names.indexOf('A')).toBeLessThan(names.indexOf('Main'));
    expect(names.indexOf('B')).toBeLessThan(names.indexOf('Main'));
  });

  test('already correct order — unchanged', () => {
    const { files, error } = sortByDependencies([
      f('Ammo', ''),
      f('Enemy', 'new Ammo()'),
      f('Main', 'new Enemy()'),
    ]);
    expect(error).toBeUndefined();
    expect(files.map((x) => x.name)).toEqual(['Ammo', 'Enemy', 'Main']);
  });

  test('tiebreaker — independent files keep relative original order', () => {
    // A and B have no constraints; C depends on D
    const { files, error } = sortByDependencies([
      f('A', ''),
      f('B', ''),
      f('C', 'new D()'),
      f('D', ''),
    ]);
    expect(error).toBeUndefined();
    const names = files.map((x) => x.name);
    expect(names.indexOf('D')).toBeLessThan(names.indexOf('C'));
    expect(names.indexOf('A')).toBeLessThan(names.indexOf('B'));
  });

  test('circular dependency — returns error string, original files unchanged', () => {
    const input = [f('A', 'new B()'), f('B', 'new A()')];
    const { error } = sortByDependencies(input);
    expect(error).toBeDefined();
    expect(error).toContain('Circular dependency');
  });

  test('case-insensitive matching', () => {
    const { files, error } = sortByDependencies([
      f('Main', 'dim e as Enemy()'),
      f('Enemy', ''),
    ]);
    expect(error).toBeUndefined();
    expect(files.map((x) => x.name)).toEqual(['Enemy', 'Main']);
  });

  test('comment containing another file name is not a dependency', () => {
    // Enemy.bas has "dim a as Ammo" (real dep).
    // Ammo.bas has "' enemy ammo" in a comment — must NOT create a false Ammo→Enemy edge.
    const { files, error } = sortByDependencies([
      f('Enemy', "dim a as Ammo\n' loads ammo objects"),
      f('Ammo', "' enemy ammo\ndim b as ammoRemaining"),
    ]);
    expect(error).toBeUndefined();
    expect(files.map((x) => x.name)).toEqual(['Ammo', 'Enemy']);
  });

  test('plain variable name matching a file name is not a dependency', () => {
    // Ammo.bas declares "dim enemy" — a plain untyped variable, not a type reference.
    // Must NOT create a false Ammo→Enemy edge that produces a phantom cycle.
    const { files, error } = sortByDependencies([
      f('Enemy', 'dim a as Ammo'),
      f('Ammo', 'dim enemy\nenemy = 5'),
    ]);
    expect(error).toBeUndefined();
    expect(files.map((x) => x.name)).toEqual(['Ammo', 'Enemy']);
  });
});
```

- [ ] **Step 2: Run tests to confirm they all fail**

```
npx vitest run tests/lib/Basic4WebGL/unit/sortByDependencies.test.ts
```

Expected: all 11 tests fail with `Cannot find module '@Basic4WebGL/sortByDependencies'`.

---

## Task 2: Implement `sortByDependencies`

**Files:**
- Create: `src/lib/Basic4WebGL/sortByDependencies.ts`

- [ ] **Step 1: Create the implementation**

```ts
// src/lib/Basic4WebGL/sortByDependencies.ts
import { ProjectFile } from '../CompilerLib/compiler/types';

export type SortResult = {
  files: ProjectFile[];
  error?: string;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Strip softBASIC line comments (' to end of line) before scanning for
// dependency names. Without this, a comment like "' enemy ammo" in Ammo.bas
// would add a false Ammo→Enemy edge and produce a phantom circular dependency.
function stripComments(source: string): string {
  return source
    .split('\n')
    .map((line) => {
      const idx = line.indexOf("'");
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join('\n');
}

export function sortByDependencies(files: ProjectFile[]): SortResult {
  if (files.length === 0) return { files: [] };

  // Build lookup keyed by lowercased filename (= softBASIC class/module name).
  // Map insertion order mirrors the user's drag-drop order, which we use as the
  // tiebreaker when multiple files become eligible at the same sort step.
  const fileMap = new Map<string, ProjectFile>();
  for (const f of files) {
    fileMap.set(f.name.toLowerCase(), f);
  }
  const names = Array.from(fileMap.keys()); // original order

  const originalIndex = new Map<string, number>();
  names.forEach((name, i) => originalIndex.set(name, i));

  // Dependency edges: name → set of other names this file references.
  // We require the file name to appear in a syntactically meaningful position —
  // one of the four patterns that actually create a compile-time dependency.
  // A bare occurrence like "dim enemy" (variable name) or "' enemy" (comment)
  // does not match any pattern and produces no edge.
  const PATTERN_FACTORIES = [
    (e: string) => new RegExp(`\\bnew\\s+${e}\\b`, 'i'),      // new ClassName
    (e: string) => new RegExp(`\\bas\\s+${e}\\b`, 'i'),       // dim x as ClassName
    (e: string) => new RegExp(`\\b${e}\\.`, 'i'),              // ClassName.method()
    (e: string) => new RegExp(`\\bextends\\s+${e}\\b`, 'i'),  // Extends ClassName
  ];

  const deps = new Map<string, Set<string>>();
  for (const name of names) {
    const file = fileMap.get(name)!;
    const strippedSource = stripComments(file.source);
    const referenced = new Set<string>();
    for (const other of names) {
      if (other === name) continue;
      const escaped = escapeRegex(other);
      if (PATTERN_FACTORIES.some((make) => make(escaped).test(strippedSource))) {
        referenced.add(other);
      }
    }
    deps.set(name, referenced);
  }

  // Reverse edges: name → files that depend on it (so we can decrement in-degree).
  const dependents = new Map<string, string[]>();
  for (const name of names) dependents.set(name, []);
  for (const [name, depSet] of deps) {
    for (const dep of depSet) {
      dependents.get(dep)!.push(name);
    }
  }

  // Kahn's BFS topological sort.
  const inDegree = new Map<string, number>();
  for (const name of names) inDegree.set(name, deps.get(name)!.size);

  // Seed with zero-in-degree nodes in their original order.
  const queue: string[] = names.filter((name) => inDegree.get(name) === 0);
  const result: ProjectFile[] = [];

  while (queue.length > 0) {
    const name = queue.shift()!;
    result.push(fileMap.get(name)!);

    const newlyEligible: string[] = [];
    for (const dep of dependents.get(name)!) {
      const degree = inDegree.get(dep)! - 1;
      inDegree.set(dep, degree);
      if (degree === 0) newlyEligible.push(dep);
    }
    // Sort newly eligible nodes by original position to preserve drag-drop order.
    newlyEligible.sort((a, b) => originalIndex.get(a)! - originalIndex.get(b)!);
    queue.push(...newlyEligible);
  }

  if (result.length < files.length) {
    const cycleNames = names
      .filter((name) => !result.some((f) => f.name.toLowerCase() === name))
      .map((name) => fileMap.get(name)!.name);
    return {
      files,
      error: `Circular dependency detected: ${cycleNames.join(' → ')}`,
    };
  }

  return { files: result };
}
```

- [ ] **Step 2: Run the tests to confirm they all pass**

```
npx vitest run tests/lib/Basic4WebGL/unit/sortByDependencies.test.ts
```

Expected: all 11 tests pass.

- [ ] **Step 3: Run the full test suite to confirm no regressions**

```
npx vitest run
```

Expected: all existing tests still pass.

- [ ] **Step 4: Commit**

```
git add src/lib/Basic4WebGL/sortByDependencies.ts tests/lib/Basic4WebGL/unit/sortByDependencies.test.ts
git commit -m "feat: add sortByDependencies — topological sort for file compile order"
```

---

## Task 3: Wire `sortByDependencies` into `useProjectForBuild` and `useCompiler`

**Files:**
- Modify: `src/hooks/useProjectForBuild.ts`
- Modify: `src/hooks/useCompiler.ts`

### 3a — `useProjectForBuild`

- [ ] **Step 1: Update the hook to sort files and surface circular dep errors**

Replace the entire file content with:

```ts
// src/hooks/useProjectForBuild.ts
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ProjectFile } from '../lib/CompilerLib/compiler/types';
import { packageModules } from '../constants/packageModules';
import { useAllFilesForProject } from './useAllFilesForProject';
import { sortByDependencies } from '../lib/Basic4WebGL/sortByDependencies';

type BuildProject = {
  lib: Array<ProjectFile>;
  files: Array<ProjectFile>;
  dependencyError?: string;
};

const DEFAULT_PACKAGE_IDS = ['softcore', 'softgfx'];

export const useProjectForBuild = (projectId: string): BuildProject => {
  const packageIds = useSelector((state: RootState) => {
    const project = state.projects.items.find((p) => p.id === projectId);
    return project?.packageIds ?? DEFAULT_PACKAGE_IDS;
  });

  const packagesById = useSelector((state: RootState) => state.packages.byId);

  const files = useAllFilesForProject(projectId);

  const lib: ProjectFile[] = packageIds.flatMap((pkgId) => {
    const pkg = packagesById[pkgId];
    if (!pkg) return [];
    return pkg.moduleNames
      .map((name) => ({ name, source: packageModules[name] ?? '' }))
      .filter((m) => m.source !== '');
  });

  // Map IFile → ProjectFile. Use plain name (not fullName) so the lexer
  // derives the correct class name — filenames are unique across the project
  // regardless of folder, so there is no ambiguity in error reporting.
  const projectFiles: ProjectFile[] = files.map((f) => ({
    name: f.name,
    source: f.source,
  }));

  const { files: sortedFiles, error: dependencyError } = sortByDependencies(projectFiles);

  return { lib, files: sortedFiles, dependencyError };
};
```

### 3b — `useCompiler`

- [ ] **Step 2: Add early-exit guard before calling the compiler**

Replace the `run` function in `src/hooks/useCompiler.ts` with:

```ts
  const run = () => {
    dispatch(clearLogs());
    dispatch(addLog({ type: LogItemType.Notice, text: 'Compiling project...' }));

    if (buildProject.dependencyError) {
      dispatch(addLog({ type: LogItemType.Error, text: buildProject.dependencyError }));
      dispatch(setIsRunning(false));
      dispatch(setTranspiled(''));
      return;
    }

    const result = Basic4WebGL.transpile(buildProject);

    if (result.diagnostics.length > 0) {
      result.diagnostics.forEach((d) => {
        const locStr = d.loc
          ? ` (${d.loc.filename}:${d.loc.line}:${d.loc.col})`
          : '';
        dispatch(addLog({ type: LogItemType.Error, text: d.message + locStr }));
      });
      dispatch(setIsRunning(false));
      dispatch(setTranspiled(''));
    } else {
      dispatch(addLog({ type: LogItemType.Notice, text: 'Project compiled successfully...' }));
      dispatch(setTranspiled(result.code!));
      dispatch(setIsRunning(true));
    }
  };
```

- [ ] **Step 3: Build to confirm no TypeScript errors**

```
npx vite build
```

Expected: build completes without errors.

- [ ] **Step 4: Run the full test suite**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```
git add src/hooks/useProjectForBuild.ts src/hooks/useCompiler.ts
git commit -m "feat: wire sortByDependencies into build pipeline"
```

---

## Task 4: Update docs — rewrite Load Order section in `multi-file.md`

**Files:**
- Modify: `src/docs/language-guide/multi-file.md`

- [ ] **Step 1: Replace the Load Order section**

Find this block in `src/docs/language-guide/multi-file.md`:

```markdown
## Load Order

All files in a project are compiled together. There is no explicit import — every file is available to every other file by its filename identifier.
```

Replace it with:

```markdown
## Load Order

The compiler resolves file dependencies automatically. You do not need to arrange your files in any particular order — the compiler analyses what each file references and ensures dependencies are compiled first.

For example, if `Main.bas` creates a `new Enemy()` and `Enemy.bas` is defined elsewhere in the project, `Enemy.bas` will always be compiled before `Main.bas` regardless of where it appears in the file panel.

Circular dependencies — where file A depends on file B and file B depends on file A — are not allowed. If a circular dependency is detected, a clear error appears in the console panel when you run the project.
```

- [ ] **Step 2: Build to confirm docs changes don't break anything**

```
npx vite build
```

Expected: build completes without errors.

- [ ] **Step 3: Commit**

```
git add src/docs/language-guide/multi-file.md
git commit -m "docs: update multi-file Load Order section — dependency order is now automatic"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| `sortByDependencies(files): SortResult` signature | Task 2 |
| Word-boundary regex scan, case-insensitive | Task 2 implementation |
| Lib names excluded from scan | Not needed — only user file names are in `files`; lib is in a separate `lib` array and never passed to `sortByDependencies` |
| Kahn's algorithm with original-order tiebreaker | Task 2 implementation |
| Circular dep returns `error` string, no crash | Task 1 test + Task 2 implementation |
| `useProjectForBuild` calls sort | Task 3a |
| Circular dep shown as error in console panel | Task 3b |
| `multi-file.md` Load Order rewritten | Task 4 |
| All 8 test cases from spec | Task 1 (10 tests — spec cases + case-insensitive + comment false-positive) |
| Comment stripping — name in `'` comment must not create dependency edge | Task 1 test + `stripComments` helper in Task 2 |
| Pattern-based matching — bare variable name (`dim enemy`) must not create dependency edge | Task 1 test + `PATTERN_FACTORIES` in Task 2 |

**Placeholder scan:** None found. All steps have complete code.

**Type consistency:**
- `SortResult = { files: ProjectFile[]; error?: string }` — defined in Task 2, consumed in Task 3a. ✓
- `BuildProject.dependencyError?: string` — added in Task 3a, read in Task 3b. ✓
- `@Basic4WebGL/sortByDependencies` import alias — resolves to `src/lib/Basic4WebGL/sortByDependencies.ts` per `vite.config.ts`. ✓
