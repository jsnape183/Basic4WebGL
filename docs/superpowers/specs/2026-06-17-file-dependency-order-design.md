# File Dependency Order — Design Spec

## Problem

softBASIC projects compile all user files in a single shared symbol table pass. Each file's symbols (class name, methods, properties, constructor) are registered as that file is compiled. Any file that references a class — via `Extends`, `dim x as ClassName`, `new ClassName()`, or a member call — requires that class to already be present in the symbol table. The current compile order is the user's drag-drop order, so any forward reference produces a compiler error. Beginners cannot reasonably be expected to manually maintain this order.

## Goal

Automatically resolve file compile order so that all dependencies are compiled before the files that use them, regardless of how the user has arranged their files in the tree. Users should never need to think about file ordering.

---

## Approach

A pure `sortByDependencies` function is added and called inside `useProjectForBuild` before the files array reaches the compiler. No compiler changes, no UI changes, no Redux changes.

```
useProjectForBuild
  └── useAllFilesForProject   (unchanged — returns files in drag-drop order)
  └── sortByDependencies      (NEW — reorders by dependency graph)
  └── compiler                (unchanged — receives correctly ordered files)
```

The user's drag-drop order is preserved as a tiebreaker for files with no ordering constraint between them.

---

## Dependency Extraction

Each file's class/module name is its filename lowercased — a hard invariant in softBASIC. To find what file A depends on, scan A's source for occurrences of other user-file names using a word-boundary regex (case-insensitive).

```
files = [Main.bas, Enemy.bas, Ammo.bas]
classNames = { main, enemy, ammo }

Enemy.bas source scanned for \bammo\b → found → Enemy depends on Ammo
Main.bas source scanned for \benemy\b → found → Main depends on Enemy

Dependency graph:
  Main  → [Enemy]
  Enemy → [Ammo]
  Ammo  → []
```

**Edge cases:**

- **Lib classes excluded** — `sprite`, `text`, `audio` etc. are in the lib array, not the user files array. The scan only checks against other user file names, so lib references never create false dependency edges.
- **False positives are harmless** — if a comment or string contains another file's name, that file is treated as a dependency and compiled slightly earlier. No incorrect behaviour results.
- **Case-insensitive** — `new Enemy()`, `Extends Enemy`, `dim e as Enemy` all match.

---

## Topological Sort

Kahn's algorithm (BFS):

1. Build in-degree map (number of unresolved dependencies per file)
2. Seed queue with all files that have in-degree 0 (no dependencies), in original drag-drop order
3. While queue is non-empty: emit front file, decrement in-degree of files that depend on it, enqueue any that reach 0 — preserving original order for tiebreaking
4. If result length < total files → cycle detected

**Example — Main → Enemy → Ammo:**
```
in-degrees:  Main=1, Enemy=1, Ammo=0
queue:       [Ammo]
emit Ammo  → Enemy in-degree 0, queue: [Enemy]
emit Enemy → Main  in-degree 0, queue: [Main]
emit Main
result: [Ammo, Enemy, Main] ✓
```

**Circular dependency error:** if the algorithm terminates with unplaced files, return a compiler `Diagnostic` with severity `'error'`:

```
Circular dependency detected: Enemy.bas → Boss.bas → Enemy.bas
```

This appears in the bottom panel like any other compiler error.

---

## Function Signature

```ts
// src/lib/Basic4WebGL/sortByDependencies.ts

export type SortResult = {
  files: ProjectFile[];
  error?: string;
};

export function sortByDependencies(files: ProjectFile[]): SortResult
```

`useProjectForBuild` calls this and, if `error` is present, returns it as a `Diagnostic` instead of compiling.

---

## Files

| Action | Path |
|--------|------|
| Create | `src/lib/Basic4WebGL/sortByDependencies.ts` |
| Modify | `src/hooks/useProjectForBuild.ts` |
| Create | `tests/lib/Basic4WebGL/unit/sortByDependencies.test.ts` |
| Modify | `src/docs/language-guide/multi-file.md` |

---

## Tests

| Case | Input | Expected |
|------|-------|----------|
| No dependencies | `[A, B, C]` — no cross-refs | `[A, B, C]` — original order preserved |
| Direct dependency | `[Main, Enemy]` — Main refs Enemy | `[Enemy, Main]` |
| Transitive chain | `[Main, Enemy, Ammo]` — Main→Enemy→Ammo | `[Ammo, Enemy, Main]` |
| Diamond | `[Main, A, B, Base]` — Main→A,B; A→Base; B→Base | Base before A and B; A and B before Main |
| Already correct order | `[Ammo, Enemy, Main]` with Main→Enemy→Ammo | `[Ammo, Enemy, Main]` unchanged |
| Tiebreaker | `[A, B, C]` — only C has a dep on X | X, then A, B, C in original relative order |
| Circular dependency | `A→B→A` | `error` string returned, no crash |
| Lib name collision | User file named `sprite.bas` | No false edges from built-in lib class names |

---

## Docs Update

**`src/docs/language-guide/multi-file.md` — rewrite `## Load Order` section:**

Replace the current two-line placeholder with an explanation that dependency order is automatic:

- The compiler resolves dependencies automatically based on what each file references
- Users never need to manually order files
- Circular dependencies (A depends on B and B depends on A) are not allowed and produce a clear error
- Remove any suggestion that file position in the tree affects compilation

No other docs pages reference file load ordering.
