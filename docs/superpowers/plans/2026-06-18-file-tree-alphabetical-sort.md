# File Tree Alphabetical Sort Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make files and folders display in alphabetical order at all times; same-folder drag becomes a no-op so only cross-folder moves are possible.

**Architecture:** Two isolated edits — (1) replace the `fileOrder`-based sort in `useAllFilesForProject` with `localeCompare`, (2) sort `levelFolders` in `renderLevel` and remove the `reorderFiles` dispatch from `handleDragEnd`. Neither change touches Redux state shape or cross-folder drag logic.

**Tech Stack:** TypeScript, React, Redux Toolkit, @dnd-kit/core, Vitest, @testing-library/react

---

## Files

| Action | Path | Change |
|--------|------|--------|
| Modify | `src/hooks/useAllFilesForProject.ts` | Replace `fileOrder`-based comparator with `localeCompare`; remove unused `fileOrder` selector |
| Modify | `src/components/FileTree/index.tsx` | Sort `levelFolders` in `renderLevel`; remove `dispatch(reorderFiles(...))` from `handleDragEnd`; remove `reorderFiles` from import |
| Create | `tests/ui/hooks/useAllFilesForProject.test.tsx` | New test — files returned in alphabetical order regardless of insertion order |
| Modify | `tests/ui/components/FileTree/FileTree.test.tsx` | Add test — files render in alphabetical order regardless of insertion order |

---

## Task 1: Sort files alphabetically in `useAllFilesForProject`

**Files:**
- Modify: `src/hooks/useAllFilesForProject.ts`
- Create: `tests/ui/hooks/useAllFilesForProject.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/ui/hooks/useAllFilesForProject.test.tsx`:

```tsx
// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import filesReducer, { addFile } from '../../../src/features/files/filesSlice';
import uiReducer from '../../../src/features/ui/uiSlice';
import projectsReducer, { addProject } from '../../../src/features/projects/projectsSlice';
import packagesReducer, { seedPackages } from '../../../src/features/packages/packagesSlice';
import foldersReducer from '../../../src/features/folders/foldersSlice';
import { firstPartyPackages } from '../../../src/constants/firstPartyPackages';
import { useAllFilesForProject } from '../../../src/hooks/useAllFilesForProject';

const makeStore = () => {
  const store = configureStore({
    reducer: {
      files: filesReducer,
      ui: uiReducer,
      projects: projectsReducer,
      packages: packagesReducer,
      folders: foldersReducer,
    },
  });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: [] }));
  // Add files in reverse alphabetical order
  store.dispatch(addFile({ id: 'f3', name: 'Zebra.bas', source: '', projectId: 'p1' }));
  store.dispatch(addFile({ id: 'f2', name: 'Main.bas', source: '', projectId: 'p1' }));
  store.dispatch(addFile({ id: 'f1', name: 'Ammo.bas', source: '', projectId: 'p1' }));
  return store;
};

const wrap = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

test('returns files sorted alphabetically regardless of insertion order', () => {
  const store = makeStore();
  const { result } = renderHook(() => useAllFilesForProject('p1'), { wrapper: wrap(store) });
  expect(result.current.map((f) => f.name)).toEqual(['Ammo.bas', 'Main.bas', 'Zebra.bas']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/hooks/useAllFilesForProject.test.tsx`

Expected: FAIL — files will be returned in insertion order (`['Zebra.bas', 'Main.bas', 'Ammo.bas']`), not alphabetical.

- [ ] **Step 3: Implement — replace `fileOrder` sort with `localeCompare`**

Replace the entire contents of `src/hooks/useAllFilesForProject.ts` with:

```ts
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { IFile } from '../features/files/filesSlice';

export const useAllFilesForProject = (projectId: string): IFile[] => {
  const filesById = useSelector((state: RootState) => state.files.byId);
  return useMemo(() => {
    const allFiles = Object.values(filesById).filter((f) => f.projectId === projectId) as IFile[];
    return allFiles.sort((a, b) => a.name.localeCompare(b.name));
  }, [filesById, projectId]);
};
```

Key changes: removed `fileOrder` selector and its `useMemo` dependency; replaced the `fileOrder.indexOf` comparator with `localeCompare`; removed the `aKey !== bKey` early-return (no longer needed — cross-folder pairs simply sort by name).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/hooks/useAllFilesForProject.test.tsx`

Expected: PASS

- [ ] **Step 5: Run full suite to check for regressions**

Run: `npx vitest run`

Expected: all tests pass (same count as before, no failures). If any FileTree tests that relied on insertion order fail, they need their expected order updated to alphabetical — but no test should break on logic, only on expected sort order.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useAllFilesForProject.ts tests/ui/hooks/useAllFilesForProject.test.tsx
git commit -m "feat: sort files alphabetically in useAllFilesForProject"
```

---

## Task 2: Sort folders + no-op same-folder drag in `FileTree`

**Files:**
- Modify: `src/components/FileTree/index.tsx`
- Modify: `tests/ui/components/FileTree/FileTree.test.tsx`

- [ ] **Step 1: Write failing test for alphabetical file rendering**

Add to `tests/ui/components/FileTree/FileTree.test.tsx` (append after existing tests):

```tsx
test('renders files in alphabetical order regardless of insertion order', () => {
  const store = configureStore({
    reducer: { files: filesReducer, ui: uiReducer, projects: projectsReducer, packages: packagesReducer, folders: foldersReducer },
  });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(addProject({ id: 'p2', name: 'AlphaTest', packageIds: [] }));
  // Insert in reverse alphabetical order
  store.dispatch(addFile({ id: 'fx3', name: 'Zebra.bas', source: '', projectId: 'p2' }));
  store.dispatch(addFile({ id: 'fx2', name: 'Main.bas', source: '', projectId: 'p2' }));
  store.dispatch(addFile({ id: 'fx1', name: 'Ammo.bas', source: '', projectId: 'p2' }));

  render(<FileTree projectId="p2" />, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
  });

  const items = screen.getAllByRole('option');
  const names = items.map((el) => el.textContent?.replace(/[^A-Za-z.]/g, '') ?? '');
  expect(names[0]).toContain('Ammo');
  expect(names[1]).toContain('Main');
  expect(names[2]).toContain('Zebra');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/components/FileTree/FileTree.test.tsx`

Expected: new test FAILS — files render in insertion order (Zebra, Main, Ammo) rather than alphabetical.

Note: Task 1 already makes `useAllFilesForProject` return sorted files, so this test should actually pass once Task 1 is committed. If it passes already after Task 1, that confirms the hook change flows through to the render correctly — mark it green and proceed.

- [ ] **Step 3: Sort folders alphabetically in `renderLevel`**

In `src/components/FileTree/index.tsx`, find line 239:

```ts
const levelFolders = folders.filter((f) => f.parentId === parentId);
```

Replace with:

```ts
const levelFolders = folders
  .filter((f) => f.parentId === parentId)
  .sort((a, b) => a.name.localeCompare(b.name));
```

- [ ] **Step 4: Remove `reorderFiles` dispatch from `handleDragEnd` Case 2**

In `src/components/FileTree/index.tsx`, find the Case 2 block (lines 197–206):

```ts
// Case 2: same-level sort (over.id is a file id)
const overFile = allFiles.find((f) => f.id === over.id);
if (!overFile || overFile.folderId !== activeFile.folderId) return;
const levelOrderKey = `${projectId}:${activeFile.folderId ?? 'root'}`;
const levelFiles = allFiles.filter((f) => (f.folderId ?? null) === (activeFile.folderId ?? null));
const fromIndex = levelFiles.findIndex((f) => f.id === active.id);
const toIndex = levelFiles.findIndex((f) => f.id === over.id);
if (fromIndex !== -1 && toIndex !== -1) {
  dispatch(reorderFiles({ orderKey: levelOrderKey, fromIndex, toIndex }));
}
```

Replace with (keep the early-return guard, remove everything after it):

```ts
// Case 2: same-folder drag — no-op; file will snap back to alphabetical position
const overFile = allFiles.find((f) => f.id === over.id);
if (!overFile || overFile.folderId !== activeFile.folderId) return;
```

- [ ] **Step 5: Remove unused `reorderFiles` from import**

In `src/components/FileTree/index.tsx`, find line 17:

```ts
import { IFile, addFile, removeFile, reorderFiles, setFileFolder } from '../../features/files/filesSlice';
```

Replace with:

```ts
import { IFile, addFile, removeFile, setFileFolder } from '../../features/files/filesSlice';
```

- [ ] **Step 6: Run tests to verify**

Run: `npx vitest run tests/ui/components/FileTree/FileTree.test.tsx`

Expected: all tests PASS including the new alphabetical order test.

- [ ] **Step 7: Run full suite**

Run: `npx vitest run`

Expected: all tests pass.

- [ ] **Step 8: Build to confirm no TypeScript errors**

Run: `npx vite build`

Expected: build succeeds with no errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/FileTree/index.tsx tests/ui/components/FileTree/FileTree.test.tsx
git commit -m "feat: sort folders alphabetically; same-folder drag is no-op"
```
