# Folder Section Discriminator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `section: 'files' | 'assets'` to `IFolder` so folders created in the Files panel never appear in the Assets panel and vice versa.

**Architecture:** `IFolder` gains a required `section` field. Each tree stamps its section when dispatching `addFolder` and filters by section when reading from the store. Existing persisted folders without the field default to `'files'` via a `?? 'files'` fallback in both selectors. No reducer changes are needed — `addFolder` already accepts the full payload.

**Tech Stack:** TypeScript, Redux Toolkit, React, Vitest

---

## File Map

| Action | Path |
|---|---|
| Modify | `src/features/folders/foldersSlice.ts` |
| Modify | `src/components/FileTree/index.tsx` |
| Modify | `src/components/TreePanel/AssetTree/index.tsx` |
| Modify | `tests/ui/features/folders/foldersSlice.test.ts` |
| Modify | `tests/ui/features/folders/folderThunks.test.ts` |
| Modify | `tests/ui/selectors/getFullName.test.ts` |

---

### Task 1: Add `section` to `IFolder` and update all fixtures

Adding `section` to the interface immediately causes TypeScript compilation errors in every test file that constructs a literal `IFolder`. Fix them all in one pass so the suite is green before touching any component.

**Files:**
- Modify: `src/features/folders/foldersSlice.ts`
- Modify: `tests/ui/features/folders/foldersSlice.test.ts`
- Modify: `tests/ui/features/folders/folderThunks.test.ts`
- Modify: `tests/ui/selectors/getFullName.test.ts`

- [ ] **Step 1: Update `IFolder` in `foldersSlice.ts`**

Open `src/features/folders/foldersSlice.ts`. Change the interface:

```ts
export interface IFolder {
  id: string;
  name: string;
  projectId: string;
  parentId: string | null;
  section: 'files' | 'assets';
}
```

No other changes to this file — reducers accept the full payload and need no modification.

- [ ] **Step 2: Run tests to see TypeScript errors**

```
npx vitest run
```

Expected: FAIL — TypeScript errors in test fixtures that construct `IFolder` objects without `section`.

- [ ] **Step 3: Update fixtures in `foldersSlice.test.ts`**

Open `tests/ui/features/folders/foldersSlice.test.ts`. Add `section: 'files'` to every `IFolder` literal:

```ts
const f1: IFolder = { id: 'f1', name: 'Game',    projectId: 'p1', parentId: null, section: 'files' };
const f2: IFolder = { id: 'f2', name: 'Enemies',  projectId: 'p1', parentId: 'f1', section: 'files' };
const f3: IFolder = { id: 'f3', name: 'Bosses',   projectId: 'p1', parentId: 'f2', section: 'files' };
```

Also update the inline fixture inside the `moveFolder` describe block:

```ts
const f4: IFolder = { id: 'f4', name: 'UI', projectId: 'p1', parentId: null, section: 'files' };
```

- [ ] **Step 4: Update fixtures in `folderThunks.test.ts`**

Open `tests/ui/features/folders/folderThunks.test.ts`. Add `section: 'files'` to every `IFolder` literal:

```ts
const f1: IFolder = { id: 'f1', name: 'Game',    projectId: 'p1', parentId: null, section: 'files' };
const f2: IFolder = { id: 'f2', name: 'Enemies',  projectId: 'p1', parentId: 'f1', section: 'files' };
```

Also update the inline fixtures inside the `moveFolderWithCascade` describe block:

```ts
const fA: IFolder = { id: 'fA', name: 'Assets',  projectId: 'p1', parentId: null, section: 'files' };
const fB: IFolder = { id: 'fB', name: 'Sprites', projectId: 'p1', parentId: null, section: 'files' };
```

- [ ] **Step 5: Update fixtures in `getFullName.test.ts`**

Open `tests/ui/selectors/getFullName.test.ts`. Add `section: 'files'` to each folder in the `folders` array:

```ts
const folders: IFolder[] = [
  { id: 'f1', name: 'Game',    projectId: 'p1', parentId: null, section: 'files' },
  { id: 'f2', name: 'Enemies', projectId: 'p1', parentId: 'f1', section: 'files' },
  { id: 'f3', name: 'Bosses',  projectId: 'p1', parentId: 'f2', section: 'files' },
];
```

- [ ] **Step 6: Run the full test suite**

```
npx vitest run
```

Expected: All tests pass — the `section` field is now required and all fixtures supply it.

- [ ] **Step 7: Commit**

```bash
git add src/features/folders/foldersSlice.ts \
        tests/ui/features/folders/foldersSlice.test.ts \
        tests/ui/features/folders/folderThunks.test.ts \
        tests/ui/selectors/getFullName.test.ts
git commit -m "feat: add section field to IFolder; update test fixtures"
```

---

### Task 2: FileTree — filter by `'files'` section and stamp dispatch

`FileTree` should only see folders with `section === 'files'`. The selector gains a section filter with a legacy default, and the `addFolder` dispatch stamps `section: 'files'`.

**Files:**
- Modify: `src/components/FileTree/index.tsx`

- [ ] **Step 1: Write a failing test for section filtering**

Open `tests/ui/components/FileTree/FileTree.test.tsx`. Add this test at the end of the file (inside the existing describe block if there is one, or at the top level):

```tsx
test('does not render folders with section: assets', async () => {
  const store = configureStore({
    reducer: {
      files: filesReducer,
      ui: uiReducer,
      projects: projectsReducer,
      packages: packagesReducer,
      folders: foldersReducer,
    },
  });

  // Add a project and an assets-section folder
  store.dispatch({ type: 'projects/addProject', payload: { id: 'p1', name: 'Test', packages: [] } });
  store.dispatch(addFolder({ id: 'af1', name: 'Sprites', projectId: 'p1', parentId: null, section: 'assets' }));
  store.dispatch(addFile({ id: 'file1', name: 'Main.bas', source: '', projectId: 'p1' }));

  const { queryByText } = render(
    <Provider store={store}>
      <FileTree projectId="p1" />
    </Provider>
  );

  expect(queryByText('Sprites')).toBeNull();
});
```

`addFile`, `foldersReducer`, and `addProject` are already imported. Add `addFolder` to the existing foldersSlice import line:

```ts
// Change this:
import foldersReducer from '../../../../src/features/folders/foldersSlice';
// To this:
import foldersReducer, { addFolder } from '../../../../src/features/folders/foldersSlice';
```

Also use the already-imported `addProject` action instead of the raw dispatch:

```tsx
store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: [] }));
store.dispatch(addFolder({ id: 'af1', name: 'Sprites', projectId: 'p1', parentId: null, section: 'assets' }));
store.dispatch(addFile({ id: 'file1', name: 'Main.bas', source: '', projectId: 'p1' }));
```

- [ ] **Step 2: Run the new test to verify it fails**

```
npx vitest run tests/ui/components/FileTree/FileTree.test.tsx
```

Expected: FAIL — the test finds `'Sprites'` in the DOM because no section filter exists yet.

- [ ] **Step 3: Update the `folders` selector in `FileTree/index.tsx`**

Open `src/components/FileTree/index.tsx`. Find the selector at line 44:

```ts
const folders: IFolder[] = useSelector((state: RootState) =>
  state.folders.items.filter((f) => f.projectId === projectId)
);
```

Replace with:

```ts
const folders: IFolder[] = useSelector((state: RootState) =>
  state.folders.items.filter(
    (f) => f.projectId === projectId && (f.section ?? 'files') === 'files'
  )
);
```

- [ ] **Step 4: Update the `addFolder` dispatch in `FileTree/index.tsx`**

Find `handleCreateFolder` (around line 164). Update the dispatch:

```ts
dispatch(addFolder({
  id: uuidv4(),
  name,
  projectId,
  parentId: creatingFolderParent ?? null,
  section: 'files',
}));
```

- [ ] **Step 5: Run the full test suite**

```
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/FileTree/index.tsx tests/ui/components/FileTree/FileTree.test.tsx
git commit -m "feat: filter FileTree folders by section:'files'; stamp new folders"
```

---

### Task 3: AssetTree — filter by `'assets'` section and stamp dispatch

Mirror of Task 2 for the assets panel.

**Files:**
- Modify: `src/components/TreePanel/AssetTree/index.tsx`

- [ ] **Step 1: Write a failing test for section filtering**

There is no dedicated `AssetTree.test.tsx`. Add the test to the existing suite — create `tests/ui/components/AssetTree/AssetTree.test.tsx`:

```tsx
import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import foldersReducer, { addFolder } from '../../../../src/features/folders/foldersSlice';
import assetsReducer from '../../../../src/features/assets/assetsSlice';
import filesReducer from '../../../../src/features/files/filesSlice';
import uiReducer from '../../../../src/features/ui/uiSlice';
import projectsReducer from '../../../../src/features/projects/projectsSlice';
import packagesReducer from '../../../../src/features/packages/packagesSlice';
import AssetTree from '../../../../src/components/TreePanel/AssetTree';

function makeStore() {
  return configureStore({
    reducer: {
      folders: foldersReducer,
      assets: assetsReducer,
      files: filesReducer,
      ui: uiReducer,
      projects: projectsReducer,
      packages: packagesReducer,
    },
  });
}

describe('AssetTree section filtering', () => {
  test('does not render folders with section: files', () => {
    const store = makeStore();
    store.dispatch(addFolder({ id: 'ff1', name: 'Scripts', projectId: 'p1', parentId: null, section: 'files' }));

    const { queryByText } = render(
      <Provider store={store}>
        <AssetTree projectId="p1" />
      </Provider>
    );

    expect(queryByText('Scripts')).toBeNull();
  });

  test('renders folders with section: assets', () => {
    const store = makeStore();
    store.dispatch(addFolder({ id: 'af1', name: 'Sprites', projectId: 'p1', parentId: null, section: 'assets' }));

    const { getByText } = render(
      <Provider store={store}>
        <AssetTree projectId="p1" />
      </Provider>
    );

    expect(getByText('Sprites')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run the new tests to verify they fail**

```
npx vitest run tests/ui/components/AssetTree/AssetTree.test.tsx
```

Expected: FAIL — `'Scripts'` is found in the DOM (no section filter), and `'Sprites'` may or may not render depending on default behaviour.

- [ ] **Step 3: Update the `folders` selector in `AssetTree/index.tsx`**

Open `src/components/TreePanel/AssetTree/index.tsx`. Find the selector at line 107:

```ts
const folders: IFolder[] = useSelector((state: RootState) =>
  state.folders.items.filter((f) => f.projectId === projectId)
);
```

Replace with:

```ts
const folders: IFolder[] = useSelector((state: RootState) =>
  state.folders.items.filter(
    (f) => f.projectId === projectId && (f.section ?? 'files') === 'assets'
  )
);
```

- [ ] **Step 4: Update the `addFolder` dispatch in `AssetTree/index.tsx`**

Find `handleCreateFolder` (around line 182). Update the dispatch:

```ts
dispatch(addFolder({ id: uuidv4(), name, projectId, parentId: creatingFolderParent ?? null, section: 'assets' }));
```

- [ ] **Step 5: Run the full test suite**

```
npx vitest run
```

Expected: All tests pass, including the new `AssetTree.test.tsx`.

- [ ] **Step 6: Commit**

```bash
git add src/components/TreePanel/AssetTree/index.tsx tests/ui/components/AssetTree/AssetTree.test.tsx
git commit -m "feat: filter AssetTree folders by section:'assets'; stamp new folders"
```
