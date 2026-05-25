# Folders Feature — Stage 1: Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add folder data model, `fullName` persistence, and cascade thunks to the Redux layer so folder-aware data is available for the Stage 2 UI.

**Architecture:** New `foldersSlice` stores `IFolder` entities with `parentId` for nesting. `IFile` and `IAsset` gain `folderId` and `fullName` fields. A shared `getFullName` utility computes paths; cascade thunks keep `fullName` in sync after folder rename/move/delete. Two integration points are updated: `useProjectForBuild` passes `file.fullName` to the compiler (error filenames), and `assets.js` uses `fullName` as the PIXI asset alias (runtime asset loading by folder path).

**Tech Stack:** Redux Toolkit, TypeScript, Vitest

---

## File Map

| Action | Path |
|---|---|
| Create | `src/selectors/getFullName.ts` |
| Create | `src/features/folders/foldersSlice.ts` |
| Create | `src/features/folders/folderThunks.ts` |
| Create | `tests/ui/selectors/getFullName.test.ts` |
| Create | `tests/ui/features/folders/foldersSlice.test.ts` |
| Create | `tests/ui/features/folders/folderThunks.test.ts` |
| Modify | `src/features/files/filesSlice.ts` |
| Modify | `src/features/assets/assetsSlice.ts` |
| Modify | `src/store.ts` |
| Modify | `src/features/projects/createProjectWithMainFile.ts` |
| Modify | `src/features/projects/deleteProjectAndFiles.ts` |
| Modify | `src/hooks/useProjectForBuild.ts` |
| Modify | `src/components/Runner/engine/assets.js` |
| Modify | `tests/ui/features/files/filesSlice.test.ts` |

---

### Task 1: `getFullName` utility

Computes `"folder/subfolder/name"` by walking up the `parentId` chain. Used only inside thunks — never in render or runtime code.

**Files:**
- Create: `src/selectors/getFullName.ts`
- Create: `tests/ui/selectors/getFullName.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/ui/selectors/getFullName.test.ts
import { describe, test, expect } from 'vitest';
import { getFullName } from '../../../src/selectors/getFullName';
import { IFolder } from '../../../src/features/folders/foldersSlice';

const folders: IFolder[] = [
  { id: 'f1', name: 'Game', projectId: 'p1', parentId: null },
  { id: 'f2', name: 'Enemies', projectId: 'p1', parentId: 'f1' },
  { id: 'f3', name: 'Bosses', projectId: 'p1', parentId: 'f2' },
];

describe('getFullName', () => {
  test('root item — no folderId — returns just name', () => {
    expect(getFullName('Main.bas', null, folders)).toBe('Main.bas');
  });

  test('single folder level', () => {
    expect(getFullName('Player.bas', 'f1', folders)).toBe('Game/Player.bas');
  });

  test('two levels deep', () => {
    expect(getFullName('Goblin.bas', 'f2', folders)).toBe('Game/Enemies/Goblin.bas');
  });

  test('three levels deep', () => {
    expect(getFullName('FinalBoss.bas', 'f3', folders)).toBe('Game/Enemies/Bosses/FinalBoss.bas');
  });

  test('unknown folderId — treats as root', () => {
    expect(getFullName('Main.bas', 'missing', folders)).toBe('Main.bas');
  });

  test('empty folder list — treats as root', () => {
    expect(getFullName('Main.bas', 'f1', [])).toBe('Main.bas');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run tests/ui/selectors/getFullName.test.ts
```
Expected: FAIL — `getFullName` not found.

- [ ] **Step 3: Create `src/selectors/getFullName.ts`**

Note: `IFolder` is imported from `foldersSlice` which does not exist yet — create it as a type-only stub first, or create both files together. The type definition in Task 2 is what matters; the function only needs the shape. Write both in this task:

```ts
// src/selectors/getFullName.ts
import { IFolder } from '../features/folders/foldersSlice';

export function getFullName(
  itemName: string,
  folderId: string | null,
  folders: IFolder[]
): string {
  if (!folderId) return itemName;
  const parts: string[] = [itemName];
  let current = folders.find((f) => f.id === folderId);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId
      ? folders.find((f) => f.id === current!.parentId)
      : undefined;
  }
  return parts.join('/');
}
```

```ts
// src/features/folders/foldersSlice.ts  (stub — full implementation in Task 2)
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IFolder {
  id: string;
  name: string;
  projectId: string;
  parentId: string | null;
}

export interface IFoldersState {
  items: IFolder[];
}

const initialState: IFoldersState = { items: [] };

const foldersSlice = createSlice({
  name: 'folders',
  initialState,
  reducers: {},
});

export default foldersSlice.reducer;
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/ui/selectors/getFullName.test.ts
```
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/selectors/getFullName.ts src/features/folders/foldersSlice.ts tests/ui/selectors/getFullName.test.ts
git commit -m "feat: add getFullName utility and IFolder type stub"
```

---

### Task 2: `foldersSlice` — full implementation

Replaces the stub with the full CRUD slice. `removeFolder` re-parents direct child folders to the deleted folder's own parent.

**Files:**
- Modify: `src/features/folders/foldersSlice.ts`
- Create: `tests/ui/features/folders/foldersSlice.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/ui/features/folders/foldersSlice.test.ts
import { describe, test, expect } from 'vitest';
import foldersReducer, {
  IFolder,
  IFoldersState,
  addFolder,
  removeFolder,
  renameFolder,
  moveFolder,
} from '../../../../src/features/folders/foldersSlice';

const initial: IFoldersState = { items: [] };

const f1: IFolder = { id: 'f1', name: 'Game', projectId: 'p1', parentId: null };
const f2: IFolder = { id: 'f2', name: 'Enemies', projectId: 'p1', parentId: 'f1' };
const f3: IFolder = { id: 'f3', name: 'Bosses', projectId: 'p1', parentId: 'f2' };

describe('addFolder', () => {
  test('stores the folder', () => {
    const state = foldersReducer(initial, addFolder(f1));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual(f1);
  });
});

describe('removeFolder', () => {
  test('removes the folder', () => {
    let s = foldersReducer(initial, addFolder(f1));
    s = foldersReducer(s, removeFolder('f1'));
    expect(s.items).toHaveLength(0);
  });

  test('re-parents direct children to the removed folder\'s parent', () => {
    // f1 (root) → f2 → f3
    // Remove f2 → f3 should become a direct child of f1
    let s = foldersReducer(initial, addFolder(f1));
    s = foldersReducer(s, addFolder(f2));
    s = foldersReducer(s, addFolder(f3));
    s = foldersReducer(s, removeFolder('f2'));
    expect(s.items.find((f) => f.id === 'f2')).toBeUndefined();
    expect(s.items.find((f) => f.id === 'f3')?.parentId).toBe('f1');
  });

  test('re-parents children of a root folder to null', () => {
    let s = foldersReducer(initial, addFolder(f1));
    s = foldersReducer(s, addFolder(f2));
    s = foldersReducer(s, removeFolder('f1'));
    expect(s.items.find((f) => f.id === 'f2')?.parentId).toBeNull();
  });
});

describe('renameFolder', () => {
  test('updates folder name', () => {
    let s = foldersReducer(initial, addFolder(f1));
    s = foldersReducer(s, renameFolder({ folderId: 'f1', name: 'Logic' }));
    expect(s.items[0].name).toBe('Logic');
  });

  test('no-ops for unknown folderId', () => {
    const s = foldersReducer(initial, renameFolder({ folderId: 'nope', name: 'X' }));
    expect(s.items).toHaveLength(0);
  });
});

describe('moveFolder', () => {
  test('updates parentId', () => {
    const f4: IFolder = { id: 'f4', name: 'UI', projectId: 'p1', parentId: null };
    let s = foldersReducer(initial, addFolder(f1));
    s = foldersReducer(s, addFolder(f4));
    s = foldersReducer(s, moveFolder({ folderId: 'f4', parentId: 'f1' }));
    expect(s.items.find((f) => f.id === 'f4')?.parentId).toBe('f1');
  });

  test('can move to root (null)', () => {
    let s = foldersReducer(initial, addFolder(f1));
    s = foldersReducer(s, addFolder(f2));
    s = foldersReducer(s, moveFolder({ folderId: 'f2', parentId: null }));
    expect(s.items.find((f) => f.id === 'f2')?.parentId).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/ui/features/folders/foldersSlice.test.ts
```
Expected: FAIL — actions not exported from slice.

- [ ] **Step 3: Implement full `foldersSlice`**

```ts
// src/features/folders/foldersSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IFolder {
  id: string;
  name: string;
  projectId: string;
  parentId: string | null;
}

export interface IFoldersState {
  items: IFolder[];
}

const initialState: IFoldersState = { items: [] };

const foldersSlice = createSlice({
  name: 'folders',
  initialState,
  reducers: {
    addFolder: (state, action: PayloadAction<IFolder>) => {
      state.items.push(action.payload);
    },
    removeFolder: (state, action: PayloadAction<string>) => {
      const folderId = action.payload;
      const folder = state.items.find((f) => f.id === folderId);
      if (!folder) return;
      // Re-parent direct children to this folder's parent
      state.items.forEach((f) => {
        if (f.parentId === folderId) {
          f.parentId = folder.parentId;
        }
      });
      state.items = state.items.filter((f) => f.id !== folderId);
    },
    renameFolder: (state, action: PayloadAction<{ folderId: string; name: string }>) => {
      const folder = state.items.find((f) => f.id === action.payload.folderId);
      if (!folder) return;
      folder.name = action.payload.name;
    },
    moveFolder: (state, action: PayloadAction<{ folderId: string; parentId: string | null }>) => {
      const folder = state.items.find((f) => f.id === action.payload.folderId);
      if (!folder) return;
      folder.parentId = action.payload.parentId;
    },
  },
});

export const { addFolder, removeFolder, renameFolder, moveFolder } = foldersSlice.actions;
export default foldersSlice.reducer;
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/ui/features/folders/foldersSlice.test.ts
```
Expected: PASS — all tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/folders/foldersSlice.ts tests/ui/features/folders/foldersSlice.test.ts
git commit -m "feat: add foldersSlice with CRUD reducers"
```

---

### Task 3: Update `IFile` — add `folderId` and `fullName`

Add two new fields to `IFile` and the reducers needed by cascade thunks. Migration: `addFile` defaults both fields when caller omits them (backward compatibility with existing persisted state).

**Files:**
- Modify: `src/features/files/filesSlice.ts`
- Modify: `tests/ui/features/files/filesSlice.test.ts`

- [ ] **Step 1: Write the failing tests**

Add at the bottom of `tests/ui/features/files/filesSlice.test.ts`:

```ts
// --- folderId + fullName ---
import {
  setFileFolder,
  batchSetFileFolder,
  batchSetFileFullNames,
} from '../../../../src/features/files/filesSlice';

describe('folderId and fullName fields', () => {
  const clean: IFilesState = { byId: {}, dirtyFileIds: [], fileOrder: {} };

  test('addFile defaults folderId to null and fullName to name', () => {
    const s = filesReducer(clean, addFile({ id: 'f1', name: 'Main.bas', source: '', projectId: 'p1' }));
    expect(s.byId['f1'].folderId).toBeNull();
    expect(s.byId['f1'].fullName).toBe('Main.bas');
  });

  test('addFile accepts explicit folderId and fullName', () => {
    const s = filesReducer(
      clean,
      addFile({ id: 'f1', name: 'Main.bas', source: '', projectId: 'p1', folderId: 'folder1', fullName: 'Game/Main.bas' })
    );
    expect(s.byId['f1'].folderId).toBe('folder1');
    expect(s.byId['f1'].fullName).toBe('Game/Main.bas');
  });

  test('setFileFolder updates folderId and fullName', () => {
    let s = filesReducer(clean, addFile({ id: 'f1', name: 'Main.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, setFileFolder({ fileId: 'f1', folderId: 'folder1', fullName: 'Game/Main.bas' }));
    expect(s.byId['f1'].folderId).toBe('folder1');
    expect(s.byId['f1'].fullName).toBe('Game/Main.bas');
  });

  test('batchSetFileFolder updates multiple files', () => {
    let s = filesReducer(clean, addFile({ id: 'f1', name: 'A.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, addFile({ id: 'f2', name: 'B.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, batchSetFileFolder([
      { id: 'f1', folderId: 'folder1', fullName: 'Game/A.bas' },
      { id: 'f2', folderId: null, fullName: 'B.bas' },
    ]));
    expect(s.byId['f1'].folderId).toBe('folder1');
    expect(s.byId['f2'].folderId).toBeNull();
  });

  test('batchSetFileFullNames updates fullName only', () => {
    let s = filesReducer(clean, addFile({ id: 'f1', name: 'Main.bas', source: '', projectId: 'p1', folderId: 'folder1', fullName: 'OldPath/Main.bas' }));
    s = filesReducer(s, batchSetFileFullNames([{ id: 'f1', fullName: 'NewPath/Main.bas' }]));
    expect(s.byId['f1'].fullName).toBe('NewPath/Main.bas');
    expect(s.byId['f1'].folderId).toBe('folder1'); // unchanged
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/ui/features/files/filesSlice.test.ts
```
Expected: FAIL — `folderId`/`fullName` fields and new actions do not exist.

- [ ] **Step 3: Update `filesSlice.ts`**

```ts
// src/features/files/filesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { reorder } from '../../utils/reorder';

export interface IFile {
  id: string;
  name: string;
  source: string;
  projectId: string;
  folderId: string | null;
  fullName: string;
}

export interface IFilesState {
  byId: Record<string, IFile>;
  dirtyFileIds: string[];
  fileOrder: Record<string, string[]>;
}

const initialState: IFilesState = {
  byId: {},
  dirtyFileIds: [],
  fileOrder: {},
};

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<Omit<IFile, 'folderId' | 'fullName'> & Partial<Pick<IFile, 'folderId' | 'fullName'>>>) => {
      const file: IFile = {
        folderId: null,
        fullName: action.payload.name,
        ...action.payload,
      };
      state.byId[file.id] = file;
      if (!state.fileOrder[file.projectId]) {
        state.fileOrder[file.projectId] = [];
      }
      state.fileOrder[file.projectId].push(file.id);
    },
    updateFile: (state, action: PayloadAction<IFile>) => {
      state.byId[action.payload.id] = action.payload;
      state.dirtyFileIds = [
        ...state.dirtyFileIds.filter((id) => id !== action.payload.id),
        action.payload.id,
      ];
    },
    removeFile: (state, action: PayloadAction<string>) => {
      const file = state.byId[action.payload];
      if (file) {
        const order = state.fileOrder[file.projectId];
        if (order) {
          state.fileOrder[file.projectId] = order.filter((id) => id !== action.payload);
        }
      }
      delete state.byId[action.payload];
      state.dirtyFileIds = state.dirtyFileIds.filter((id) => id !== action.payload);
    },
    clearAllDirty: (state) => {
      state.dirtyFileIds = [];
    },
    reorderFiles: (
      state,
      action: PayloadAction<{ projectId: string; fromIndex: number; toIndex: number }>
    ) => {
      const { projectId, fromIndex, toIndex } = action.payload;
      const order = state.fileOrder[projectId];
      if (!order) return;
      state.fileOrder[projectId] = reorder(order, fromIndex, toIndex);
    },
    setFileFolder: (
      state,
      action: PayloadAction<{ fileId: string; folderId: string | null; fullName: string }>
    ) => {
      const file = state.byId[action.payload.fileId];
      if (!file) return;
      file.folderId = action.payload.folderId;
      file.fullName = action.payload.fullName;
    },
    batchSetFileFolder: (
      state,
      action: PayloadAction<{ id: string; folderId: string | null; fullName: string }[]>
    ) => {
      action.payload.forEach(({ id, folderId, fullName }) => {
        const file = state.byId[id];
        if (!file) return;
        file.folderId = folderId;
        file.fullName = fullName;
      });
    },
    batchSetFileFullNames: (
      state,
      action: PayloadAction<{ id: string; fullName: string }[]>
    ) => {
      action.payload.forEach(({ id, fullName }) => {
        const file = state.byId[id];
        if (!file) return;
        file.fullName = fullName;
      });
    },
  },
});

export const {
  addFile,
  updateFile,
  removeFile,
  clearAllDirty,
  reorderFiles,
  setFileFolder,
  batchSetFileFolder,
  batchSetFileFullNames,
} = filesSlice.actions;
export default filesSlice.reducer;
```

- [ ] **Step 4: Run ALL file slice tests to verify they pass**

```
npx vitest run tests/ui/features/files/filesSlice.test.ts
```
Expected: PASS — all tests including the new ones.

- [ ] **Step 5: Commit**

```bash
git add src/features/files/filesSlice.ts tests/ui/features/files/filesSlice.test.ts
git commit -m "feat: add folderId and fullName fields to IFile with new reducers"
```

---

### Task 4: Update `IAsset` — add `folderId` and `fullName`

Mirror of Task 3 for assets. Assets have no `fileOrder` equivalent today — ordering is added in Stage 2.

**Files:**
- Modify: `src/features/assets/assetsSlice.ts`
- Create: `tests/ui/features/assets/assetsSlice.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/ui/features/assets/assetsSlice.test.ts
import { describe, test, expect } from 'vitest';
import assetsReducer, {
  IAsset,
  IAssetsState,
  addAsset,
  removeAsset,
  setAssetFolder,
  batchSetAssetFolder,
  batchSetAssetFullNames,
} from '../../../../src/features/assets/assetsSlice';

const initial: IAssetsState = { byId: {} };

describe('addAsset', () => {
  test('defaults folderId to null and fullName to name', () => {
    const s = assetsReducer(initial, addAsset({ id: 'a1', name: 'bunny.png', content: 'data:...', projectId: 'p1' }));
    expect(s.byId['a1'].folderId).toBeNull();
    expect(s.byId['a1'].fullName).toBe('bunny.png');
  });

  test('accepts explicit folderId and fullName', () => {
    const s = assetsReducer(initial, addAsset({
      id: 'a1', name: 'bunny.png', content: 'data:...', projectId: 'p1',
      folderId: 'sprites', fullName: 'sprites/bunny.png',
    }));
    expect(s.byId['a1'].folderId).toBe('sprites');
    expect(s.byId['a1'].fullName).toBe('sprites/bunny.png');
  });
});

describe('setAssetFolder', () => {
  test('updates folderId and fullName', () => {
    let s = assetsReducer(initial, addAsset({ id: 'a1', name: 'bunny.png', content: '', projectId: 'p1' }));
    s = assetsReducer(s, setAssetFolder({ assetId: 'a1', folderId: 'f1', fullName: 'Sprites/bunny.png' }));
    expect(s.byId['a1'].folderId).toBe('f1');
    expect(s.byId['a1'].fullName).toBe('Sprites/bunny.png');
  });
});

describe('batchSetAssetFolder', () => {
  test('updates multiple assets', () => {
    let s = assetsReducer(initial, addAsset({ id: 'a1', name: 'a.png', content: '', projectId: 'p1' }));
    s = assetsReducer(s, addAsset({ id: 'a2', name: 'b.png', content: '', projectId: 'p1' }));
    s = assetsReducer(s, batchSetAssetFolder([
      { id: 'a1', folderId: 'f1', fullName: 'Sprites/a.png' },
      { id: 'a2', folderId: null, fullName: 'b.png' },
    ]));
    expect(s.byId['a1'].fullName).toBe('Sprites/a.png');
    expect(s.byId['a2'].folderId).toBeNull();
  });
});

describe('batchSetAssetFullNames', () => {
  test('updates fullName only', () => {
    let s = assetsReducer(initial, addAsset({ id: 'a1', name: 'a.png', content: '', projectId: 'p1', folderId: 'f1', fullName: 'Old/a.png' }));
    s = assetsReducer(s, batchSetAssetFullNames([{ id: 'a1', fullName: 'New/a.png' }]));
    expect(s.byId['a1'].fullName).toBe('New/a.png');
    expect(s.byId['a1'].folderId).toBe('f1');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/ui/features/assets/assetsSlice.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Update `assetsSlice.ts`**

```ts
// src/features/assets/assetsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IAsset {
  id: string;
  name: string;
  content: string;
  projectId: string;
  folderId: string | null;
  fullName: string;
}

export interface IAssetsState {
  byId: Record<string, IAsset>;
}

const initialState: IAssetsState = { byId: {} };

const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    addAsset: (
      state,
      action: PayloadAction<Omit<IAsset, 'folderId' | 'fullName'> & Partial<Pick<IAsset, 'folderId' | 'fullName'>>>
    ) => {
      const asset: IAsset = {
        folderId: null,
        fullName: action.payload.name,
        ...action.payload,
      };
      state.byId[asset.id] = asset;
    },
    updateAsset: (state, action: PayloadAction<IAsset>) => {
      state.byId[action.payload.id] = action.payload;
    },
    removeAsset: (state, action: PayloadAction<string>) => {
      delete state.byId[action.payload];
    },
    setAssetFolder: (
      state,
      action: PayloadAction<{ assetId: string; folderId: string | null; fullName: string }>
    ) => {
      const asset = state.byId[action.payload.assetId];
      if (!asset) return;
      asset.folderId = action.payload.folderId;
      asset.fullName = action.payload.fullName;
    },
    batchSetAssetFolder: (
      state,
      action: PayloadAction<{ id: string; folderId: string | null; fullName: string }[]>
    ) => {
      action.payload.forEach(({ id, folderId, fullName }) => {
        const asset = state.byId[id];
        if (!asset) return;
        asset.folderId = folderId;
        asset.fullName = fullName;
      });
    },
    batchSetAssetFullNames: (
      state,
      action: PayloadAction<{ id: string; fullName: string }[]>
    ) => {
      action.payload.forEach(({ id, fullName }) => {
        const asset = state.byId[id];
        if (!asset) return;
        asset.fullName = fullName;
      });
    },
  },
});

export const {
  addAsset,
  updateAsset,
  removeAsset,
  setAssetFolder,
  batchSetAssetFolder,
  batchSetAssetFullNames,
} = assetsSlice.actions;
export default assetsSlice.reducer;
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/ui/features/assets/assetsSlice.test.ts
```
Expected: PASS — all tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/assets/assetsSlice.ts tests/ui/features/assets/assetsSlice.test.ts
git commit -m "feat: add folderId and fullName fields to IAsset with new reducers"
```

---

### Task 5: Folder thunks — cascade rename, move, and delete

These thunks dispatch to multiple slices. `renameFolderWithCascade` dispatches `renameFolder` then recomputes `fullName` for every file/asset whose path passes through the renamed folder. `moveFolderWithCascade` does the same after moving. `removeFolderWithCascade` moves items in the deleted folder to its parent, then dispatches `removeFolder`.

**Files:**
- Create: `src/features/folders/folderThunks.ts`
- Create: `tests/ui/features/folders/folderThunks.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/ui/features/folders/folderThunks.test.ts
import { describe, test, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import foldersReducer, { addFolder, IFolder } from '../../../../src/features/folders/foldersSlice';
import filesReducer, { addFile } from '../../../../src/features/files/filesSlice';
import assetsReducer, { addAsset } from '../../../../src/features/assets/assetsSlice';
import {
  renameFolderWithCascade,
  moveFolderWithCascade,
  removeFolderWithCascade,
} from '../../../../src/features/folders/folderThunks';

function makeStore() {
  return configureStore({
    reducer: {
      folders: foldersReducer,
      files: filesReducer,
      assets: assetsReducer,
    },
  });
}

// Folder tree: root → f1 (Game) → f2 (Enemies)
const f1: IFolder = { id: 'f1', name: 'Game', projectId: 'p1', parentId: null };
const f2: IFolder = { id: 'f2', name: 'Enemies', projectId: 'p1', parentId: 'f1' };

describe('renameFolderWithCascade', () => {
  test('updates fullName of files inside the renamed folder', () => {
    const store = makeStore();
    store.dispatch(addFolder(f1));
    store.dispatch(addFile({ id: 'file1', name: 'Player.bas', source: '', projectId: 'p1', folderId: 'f1', fullName: 'Game/Player.bas' }));
    store.dispatch(renameFolderWithCascade({ folderId: 'f1', name: 'Logic' }));
    expect(store.getState().files.byId['file1'].fullName).toBe('Logic/Player.bas');
  });

  test('updates fullName of files in nested folders', () => {
    const store = makeStore();
    store.dispatch(addFolder(f1));
    store.dispatch(addFolder(f2));
    store.dispatch(addFile({ id: 'file1', name: 'Goblin.bas', source: '', projectId: 'p1', folderId: 'f2', fullName: 'Game/Enemies/Goblin.bas' }));
    store.dispatch(renameFolderWithCascade({ folderId: 'f1', name: 'Logic' }));
    expect(store.getState().files.byId['file1'].fullName).toBe('Logic/Enemies/Goblin.bas');
  });

  test('updates fullName of assets inside the renamed folder', () => {
    const store = makeStore();
    store.dispatch(addFolder(f1));
    store.dispatch(addAsset({ id: 'a1', name: 'hero.png', content: '', projectId: 'p1', folderId: 'f1', fullName: 'Game/hero.png' }));
    store.dispatch(renameFolderWithCascade({ folderId: 'f1', name: 'Sprites' }));
    expect(store.getState().assets.byId['a1'].fullName).toBe('Sprites/hero.png');
  });

  test('does not affect files in other folders', () => {
    const store = makeStore();
    store.dispatch(addFolder(f1));
    store.dispatch(addFile({ id: 'file1', name: 'Utils.bas', source: '', projectId: 'p1', folderId: null, fullName: 'Utils.bas' }));
    store.dispatch(renameFolderWithCascade({ folderId: 'f1', name: 'Logic' }));
    expect(store.getState().files.byId['file1'].fullName).toBe('Utils.bas');
  });
});

describe('moveFolderWithCascade', () => {
  test('updates fullName of files after folder is moved under a new parent', () => {
    const store = makeStore();
    const fA: IFolder = { id: 'fA', name: 'Assets', projectId: 'p1', parentId: null };
    const fB: IFolder = { id: 'fB', name: 'Sprites', projectId: 'p1', parentId: null };
    store.dispatch(addFolder(fA));
    store.dispatch(addFolder(fB));
    store.dispatch(addFile({ id: 'file1', name: 'hero.png', source: '', projectId: 'p1', folderId: 'fB', fullName: 'Sprites/hero.png' }));
    // Move fB under fA
    store.dispatch(moveFolderWithCascade({ folderId: 'fB', parentId: 'fA' }));
    expect(store.getState().files.byId['file1'].fullName).toBe('Assets/Sprites/hero.png');
  });
});

describe('removeFolderWithCascade', () => {
  test('moves items in deleted folder to its parent folder', () => {
    const store = makeStore();
    store.dispatch(addFolder(f1)); // root
    store.dispatch(addFolder(f2)); // f2 is child of f1
    store.dispatch(addFile({ id: 'file1', name: 'Goblin.bas', source: '', projectId: 'p1', folderId: 'f2', fullName: 'Game/Enemies/Goblin.bas' }));
    // Remove f2 — file should move to f1
    store.dispatch(removeFolderWithCascade({ folderId: 'f2' }));
    const file = store.getState().files.byId['file1'];
    expect(file.folderId).toBe('f1');
    expect(file.fullName).toBe('Game/Goblin.bas');
  });

  test('moves items in deleted root folder to null (root)', () => {
    const store = makeStore();
    store.dispatch(addFolder(f1));
    store.dispatch(addAsset({ id: 'a1', name: 'hero.png', content: '', projectId: 'p1', folderId: 'f1', fullName: 'Game/hero.png' }));
    store.dispatch(removeFolderWithCascade({ folderId: 'f1' }));
    const asset = store.getState().assets.byId['a1'];
    expect(asset.folderId).toBeNull();
    expect(asset.fullName).toBe('hero.png');
  });

  test('removes the folder from the store', () => {
    const store = makeStore();
    store.dispatch(addFolder(f1));
    store.dispatch(removeFolderWithCascade({ folderId: 'f1' }));
    expect(store.getState().folders.items).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run tests/ui/features/folders/folderThunks.test.ts
```
Expected: FAIL — thunks not found.

- [ ] **Step 3: Implement `folderThunks.ts`**

Note: the file imports `AppDispatch` and `RootState` from `../../store` — this works because `store.ts` imports the slice reducers but does NOT import this file, so there is no circular dependency.

```ts
// src/features/folders/folderThunks.ts
import { AppDispatch, RootState } from '../../store';
import { getFullName } from '../../selectors/getFullName';
import { renameFolder, moveFolder, removeFolder } from './foldersSlice';
import { batchSetFileFolder, batchSetFileFullNames } from '../files/filesSlice';
import { batchSetAssetFolder, batchSetAssetFullNames } from '../assets/assetsSlice';

/** Returns the IDs of all folders in the subtree rooted at rootId (not including rootId itself). */
function getSubtreeFolderIds(rootId: string, folders: RootState['folders']['items']): string[] {
  const result: string[] = [];
  const queue = [rootId];
  while (queue.length) {
    const current = queue.shift()!;
    const children = folders.filter((f) => f.parentId === current);
    children.forEach((c) => { result.push(c.id); queue.push(c.id); });
  }
  return result;
}

export const renameFolderWithCascade =
  ({ folderId, name }: { folderId: string; name: string }) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(renameFolder({ folderId, name }));
    // getState() now has the updated folder name
    const { folders, files, assets } = getState();
    const allFolders = folders.items;
    const subtreeIds = getSubtreeFolderIds(folderId, allFolders);
    const affectedFolderIds = new Set([folderId, ...subtreeIds]);

    const fileUpdates = Object.values(files.byId)
      .filter((f) => f.folderId !== null && affectedFolderIds.has(f.folderId))
      .map((f) => ({ id: f.id, fullName: getFullName(f.name, f.folderId, allFolders) }));

    const assetUpdates = Object.values(assets.byId)
      .filter((a) => a.folderId !== null && affectedFolderIds.has(a.folderId))
      .map((a) => ({ id: a.id, fullName: getFullName(a.name, a.folderId, allFolders) }));

    if (fileUpdates.length) dispatch(batchSetFileFullNames(fileUpdates));
    if (assetUpdates.length) dispatch(batchSetAssetFullNames(assetUpdates));
  };

export const moveFolderWithCascade =
  ({ folderId, parentId }: { folderId: string; parentId: string | null }) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(moveFolder({ folderId, parentId }));
    const { folders, files, assets } = getState();
    const allFolders = folders.items;
    const subtreeIds = getSubtreeFolderIds(folderId, allFolders);
    const affectedFolderIds = new Set([folderId, ...subtreeIds]);

    const fileUpdates = Object.values(files.byId)
      .filter((f) => f.folderId !== null && affectedFolderIds.has(f.folderId))
      .map((f) => ({ id: f.id, fullName: getFullName(f.name, f.folderId, allFolders) }));

    const assetUpdates = Object.values(assets.byId)
      .filter((a) => a.folderId !== null && affectedFolderIds.has(a.folderId))
      .map((a) => ({ id: a.id, fullName: getFullName(a.name, a.folderId, allFolders) }));

    if (fileUpdates.length) dispatch(batchSetFileFullNames(fileUpdates));
    if (assetUpdates.length) dispatch(batchSetAssetFullNames(assetUpdates));
  };

export const removeFolderWithCascade =
  ({ folderId }: { folderId: string }) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    const { folders, files, assets } = getState();
    const folder = folders.items.find((f) => f.id === folderId);
    if (!folder) return;

    const newFolderId = folder.parentId; // null = root
    const allFoldersAfterRemove = folders.items.filter((f) => f.id !== folderId);

    const fileUpdates = Object.values(files.byId)
      .filter((f) => f.folderId === folderId)
      .map((f) => ({
        id: f.id,
        folderId: newFolderId,
        fullName: getFullName(f.name, newFolderId, allFoldersAfterRemove),
      }));

    const assetUpdates = Object.values(assets.byId)
      .filter((a) => a.folderId === folderId)
      .map((a) => ({
        id: a.id,
        folderId: newFolderId,
        fullName: getFullName(a.name, newFolderId, allFoldersAfterRemove),
      }));

    // removeFolder (in foldersSlice) re-parents child folders automatically
    dispatch(removeFolder(folderId));
    if (fileUpdates.length) dispatch(batchSetFileFolder(fileUpdates));
    if (assetUpdates.length) dispatch(batchSetAssetFolder(assetUpdates));
  };
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run tests/ui/features/folders/folderThunks.test.ts
```
Expected: PASS — all tests.

- [ ] **Step 5: Commit**

```bash
git add src/features/folders/folderThunks.ts tests/ui/features/folders/folderThunks.test.ts
git commit -m "feat: add folder cascade thunks (rename, move, remove)"
```

---

### Task 6: Register `foldersSlice`; update project create/delete

Wire `foldersSlice` into the Redux store, update `createProjectWithMainFile` to set `fullName` on the main file, and update `deleteProjectAndFiles` to remove a project's folders.

**Files:**
- Modify: `src/store.ts`
- Modify: `src/features/projects/createProjectWithMainFile.ts`
- Modify: `src/features/projects/deleteProjectAndFiles.ts`

(No new tests — behaviour is covered by existing project tests. The store change is verified by running the full test suite.)

- [ ] **Step 1: Register `foldersSlice` in `src/store.ts`**

Add the import and entry to `rootReducer`:

```ts
// Add to imports:
import foldersReducer from './features/folders/foldersSlice';

// Add to rootReducer:
const rootReducer = combineReducers({
  projects: projectsReducer,
  files: filesReducer,
  assets: assetsReducer,
  folders: foldersReducer,   // NEW
  ui: uiReducer,
  session: sessionReducer,
  packages: packagesReducer,
});
```

- [ ] **Step 2: Update `createProjectWithMainFile.ts`**

```ts
// src/features/projects/createProjectWithMainFile.ts
import { AppDispatch } from '../../store';
import { v4 as uuidv4 } from 'uuid';
import { addProject } from './projectsSlice';
import { addFile } from '../files/filesSlice';

export const createProjectWithMainFile =
  (name: string) => (dispatch: AppDispatch) => {
    const projectId = uuidv4();
    const mainFileId = uuidv4();

    dispatch(addProject({ id: projectId, name, packageIds: ['softcore', 'softgfx'] }));

    dispatch(
      addFile({
        id: mainFileId,
        name: 'Main.bas',
        source: '',
        projectId,
        folderId: null,
        fullName: 'Main.bas',
      })
    );
  };
```

- [ ] **Step 3: Update `deleteProjectAndFiles.ts`**

Add folder removal. Import `IFolder` and `removeFolder` from `foldersSlice`:

```ts
// src/features/projects/deleteProjectAndFiles.ts
import { AppDispatch, RootState } from '../../store';
import { removeProject } from './projectsSlice';
import { IFile, removeFile } from '../files/filesSlice';
import { IAsset, removeAsset } from '../assets/assetsSlice';
import { IFolder, removeFolder } from '../folders/foldersSlice';
import { clearProjectSelection } from '../ui/uiSlice';

export const deleteProjectWithMainFile =
  (projectId: string) => (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();

    const files = Object.values(state.files.byId).filter(
      (file) => (file as IFile).projectId === projectId
    );
    files.forEach((file) => dispatch(removeFile((file as IFile).id)));

    const assets = Object.values(state.assets.byId).filter(
      (asset) => (asset as IAsset).projectId === projectId
    );
    assets.forEach((asset) => dispatch(removeAsset((asset as IAsset).id)));

    const folders = state.folders.items.filter(
      (folder: IFolder) => folder.projectId === projectId
    );
    folders.forEach((folder: IFolder) => dispatch(removeFolder(folder.id)));

    dispatch(clearProjectSelection(projectId));
    dispatch(removeProject(projectId));
  };
```

- [ ] **Step 4: Run the full test suite**

```
npx vitest run
```
Expected: All tests pass. TypeScript compilation (`tsc --noEmit`) should also be clean.

- [ ] **Step 5: Commit**

```bash
git add src/store.ts src/features/projects/createProjectWithMainFile.ts src/features/projects/deleteProjectAndFiles.ts
git commit -m "feat: register foldersSlice in store; update project create/delete for folder cleanup"
```

---

### Task 7: Compiler integration — use `fullName` for error filenames

The compiler receives files as `ProjectFile[]` with a `name` field. Currently `useProjectForBuild` passes `IFile` objects directly (duck-typed). Change it to map `IFile` to `ProjectFile` with `name: file.fullName ?? file.name` so error `SourceLocation.filename` shows the folder path.

**Files:**
- Modify: `src/hooks/useProjectForBuild.ts`

- [ ] **Step 1: Update `useProjectForBuild.ts`**

```ts
// src/hooks/useProjectForBuild.ts
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ProjectFile } from '../lib/CompilerLib/compiler/types';
import { packageModules } from '../constants/packageModules';
import { useFilesForProject } from './useFilesForProject';

type BuildProject = {
  lib: Array<ProjectFile>;
  files: Array<ProjectFile>;
};

const DEFAULT_PACKAGE_IDS = ['softcore', 'softgfx'];

export const useProjectForBuild = (projectId: string): BuildProject => {
  const packageIds = useSelector((state: RootState) => {
    const project = state.projects.items.find((p) => p.id === projectId);
    return project?.packageIds ?? DEFAULT_PACKAGE_IDS;
  });

  const packagesById = useSelector((state: RootState) => state.packages.byId);
  const files = useFilesForProject(projectId);

  const lib: ProjectFile[] = packageIds.flatMap((pkgId) => {
    const pkg = packagesById[pkgId];
    if (!pkg) return [];
    return pkg.moduleNames
      .map((name) => ({ name, source: packageModules[name] ?? '' }))
      .filter((m) => m.source !== '');
  });

  // Map IFile → ProjectFile, using fullName (folder path) as the filename for
  // error reporting (e.g. "ui/Menu.bas:5:3"). Falls back to name for legacy
  // persisted files that predate the fullName field.
  const projectFiles: ProjectFile[] = files.map((f) => ({
    name: f.fullName ?? f.name,
    source: f.source,
  }));

  return { lib, files: projectFiles };
};
```

- [ ] **Step 2: Run the full test suite**

```
npx vitest run
```
Expected: All tests pass. No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useProjectForBuild.ts
git commit -m "feat: use file.fullName in compiler input for folder-aware error reporting"
```

---

### Task 8: Asset loading — use `fullName` as PIXI alias

`assets.js` runs inside the iframe and reads from `localStorage` directly. It uses `a.name` as the PIXI asset alias. Change to `a.fullName ?? a.name` so `loadImage("sprites/bunny.png")` works once an asset is placed in a folder. Existing assets at root have `fullName === name`, so no behaviour change.

**Files:**
- Modify: `src/components/Runner/engine/assets.js`

- [ ] **Step 1: Update `preloadFromLocalStorage` in `assets.js`**

Change the single line that builds the manifest:

```js
// Before:
await this.preload(assets.map((a) => ({ name: a.name, src: a.content })));

// After:
await this.preload(assets.map((a) => ({ name: a.fullName ?? a.name, src: a.content })));
```

The full updated `preloadFromLocalStorage` method:

```js
async preloadFromLocalStorage(projectId) {
  const raw = window.localStorage.getItem('persist:softBASIC');
  if (!raw) { _ready = true; return; }
  let assetsById = {};
  try {
    const persisted = JSON.parse(raw);
    assetsById = JSON.parse(persisted.assets ?? '{}').byId ?? {};
  } catch (_) {
    _ready = true;
    return;
  }
  const assets = Object.values(assetsById).filter((a) => a.projectId === projectId);
  if (assets.length === 0) { _ready = true; return; }
  await this.preload(assets.map((a) => ({ name: a.fullName ?? a.name, src: a.content })));
},
```

- [ ] **Step 2: Run the full test suite**

```
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/Runner/engine/assets.js
git commit -m "feat: use asset fullName as PIXI alias for folder-aware asset loading"
```
