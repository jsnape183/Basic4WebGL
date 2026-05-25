# Folders Feature — Stage 2: UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render folders in the Files and Assets sections of the tree panel, with 📁+ creation, collapse/expand, drag-into-folder, auto-expand on drag hover, and folder rename/delete modals.

**Architecture:** `FolderNode` is a presentational component rendered by `FileTree` and `AssetTree`. Each section gets nested `SortableContext`s (one per folder level) so dnd-kit can handle reordering within and between folders. The `DndContext` wraps the whole section and classifies drops in `onDragEnd` — folder-container drops call `setFileFolder`/`setAssetFolder`; sibling reorders call the existing reorder actions. `fileOrder` keys migrate from `projectId` to `${projectId}:${folderId ?? 'root'}` to support per-folder ordering; `assetsSlice` gains the same ordering structure. Stage 2 depends on Stage 1 being merged first.

**Tech Stack:** React, Redux Toolkit, dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`), Tailwind CSS, Vitest

---

## Prerequisites

Stage 1 backend plan (`docs/superpowers/plans/2026-05-25-folders-stage1-backend.md`) must be complete and merged before starting this plan.

---

## File Map

| Action | Path |
|---|---|
| Create | `src/components/FileTree/FolderNode.tsx` |
| Modify | `src/features/files/filesSlice.ts` |
| Modify | `src/features/assets/assetsSlice.ts` |
| Modify | `src/hooks/useFilesForProject.ts` |
| Modify | `src/hooks/useAssetsForProject.ts` |
| Modify | `src/components/FileTree/index.tsx` |
| Modify | `src/components/TreePanel/AssetTree/index.tsx` |
| Modify | `tests/ui/features/files/filesSlice.test.ts` |
| Modify | `tests/ui/features/assets/assetsSlice.test.ts` |

---

### Task 1: `fileOrder` key migration + asset ordering

**Current state:** `filesSlice.fileOrder` is keyed by `projectId`. Assets have no ordering.
**Target:** Both use key format `${projectId}:${folderId ?? 'root'}` so items within each folder level can be independently reordered.

This is a persisted-state migration. Existing persisted data has keys like `"p1"` (no colon). The hook falls back gracefully when the new key is absent.

**Files:**
- Modify: `src/features/files/filesSlice.ts`
- Modify: `src/features/assets/assetsSlice.ts`
- Modify: `src/hooks/useFilesForProject.ts`
- Modify: `src/hooks/useAssetsForProject.ts`
- Modify: `tests/ui/features/files/filesSlice.test.ts`
- Modify: `tests/ui/features/assets/assetsSlice.test.ts`

- [ ] **Step 1: Write failing tests for updated `filesSlice` key format**

Add to `tests/ui/features/files/filesSlice.test.ts` (after the existing `fileOrder` describe block):

```ts
describe('fileOrder — folder-scoped keys', () => {
  const clean: IFilesState = { byId: {}, dirtyFileIds: [], fileOrder: {} };

  test('addFile with no folderId uses projectId:root key', () => {
    const s = filesReducer(clean, addFile({ id: 'f1', name: 'a.bas', source: '', projectId: 'p1' }));
    expect(s.fileOrder['p1:root']).toEqual(['f1']);
  });

  test('addFile with a folderId uses projectId:folderId key', () => {
    const s = filesReducer(clean, addFile({ id: 'f1', name: 'a.bas', source: '', projectId: 'p1', folderId: 'folder1', fullName: 'Game/a.bas' }));
    expect(s.fileOrder['p1:folder1']).toEqual(['f1']);
  });

  test('removeFile removes from the correct scoped key', () => {
    let s = filesReducer(clean, addFile({ id: 'f1', name: 'a.bas', source: '', projectId: 'p1', folderId: 'folder1', fullName: 'Game/a.bas' }));
    s = filesReducer(s, removeFile('f1'));
    expect(s.fileOrder['p1:folder1']).toEqual([]);
  });

  test('reorderFiles accepts a scoped key', () => {
    let s = filesReducer(clean, addFile({ id: 'f1', name: 'a.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, addFile({ id: 'f2', name: 'b.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, reorderFiles({ orderKey: 'p1:root', fromIndex: 0, toIndex: 1 }));
    expect(s.fileOrder['p1:root']).toEqual(['f2', 'f1']);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```
npx vitest run tests/ui/features/files/filesSlice.test.ts
```
Expected: FAIL — new tests fail, key format not yet changed.

- [ ] **Step 3: Update `filesSlice.ts` to use scoped keys**

Update `addFile`, `removeFile`, and `reorderFiles` in `src/features/files/filesSlice.ts`. Keep the existing `projectId` tests passing by leaving old key-format behaviour in `reorderFiles` as a fallback (it accepts `orderKey` now instead of `projectId`).

```ts
// Helper used by addFile and removeFile
function orderKey(projectId: string, folderId: string | null): string {
  return `${projectId}:${folderId ?? 'root'}`;
}

// Updated reducers inside createSlice:
addFile: (state, action: PayloadAction<Omit<IFile, 'folderId' | 'fullName'> & Partial<Pick<IFile, 'folderId' | 'fullName'>>>) => {
  const file: IFile = {
    folderId: null,
    fullName: action.payload.name,
    ...action.payload,
  };
  state.byId[file.id] = file;
  const key = orderKey(file.projectId, file.folderId ?? null);
  if (!state.fileOrder[key]) state.fileOrder[key] = [];
  state.fileOrder[key].push(file.id);
},
removeFile: (state, action: PayloadAction<string>) => {
  const file = state.byId[action.payload];
  if (file) {
    const key = orderKey(file.projectId, file.folderId ?? null);
    const order = state.fileOrder[key];
    if (order) {
      state.fileOrder[key] = order.filter((id) => id !== action.payload);
    }
  }
  delete state.byId[action.payload];
  state.dirtyFileIds = state.dirtyFileIds.filter((id) => id !== action.payload);
},
reorderFiles: (
  state,
  action: PayloadAction<{ orderKey: string; fromIndex: number; toIndex: number }>
) => {
  const { orderKey: key, fromIndex, toIndex } = action.payload;
  const order = state.fileOrder[key];
  if (!order) return;
  state.fileOrder[key] = reorder(order, fromIndex, toIndex);
},
```

Export `reorderFiles` still — just the payload shape changed.

- [ ] **Step 4: Update `useFilesForProject.ts` to use scoped key with legacy fallback**

```ts
// src/hooks/useFilesForProject.ts
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { IFile } from '../features/files/filesSlice';

export const useFilesForProject = (projectId: string, folderId: string | null = null): IFile[] => {
  return useSelector((state: RootState) => {
    const scopedKey = `${projectId}:${folderId ?? 'root'}`;
    const legacyKey = projectId; // pre-migration persisted state

    let order = state.files.fileOrder[scopedKey];

    if (!order || order.length === 0) {
      // Fall back to legacy key (persisted data before this migration)
      order = state.files.fileOrder[legacyKey];
    }

    if (!order || order.length === 0) {
      // Final fallback: unordered enumeration (very old persisted state)
      return Object.values(state.files.byId).filter(
        (file) => file.projectId === projectId && (file.folderId ?? null) === folderId
      ) as IFile[];
    }

    return order
      .map((id) => state.files.byId[id])
      .filter((file): file is IFile => Boolean(file));
  });
};
```

- [ ] **Step 5: Add asset ordering to `assetsSlice.ts`**

Add `assetOrder: Record<string, string[]>` to `IAssetsState`, update `addAsset`/`removeAsset`, add `reorderAssets`:

```ts
export interface IAssetsState {
  byId: Record<string, IAsset>;
  assetOrder: Record<string, string[]>;  // NEW — key: "${projectId}:${folderId ?? 'root'}"
}

const initialState: IAssetsState = { byId: {}, assetOrder: {} };

// Helper
function orderKey(projectId: string, folderId: string | null): string {
  return `${projectId}:${folderId ?? 'root'}`;
}

// Updated reducers:
addAsset: (state, action) => {
  const asset: IAsset = { folderId: null, fullName: action.payload.name, ...action.payload };
  state.byId[asset.id] = asset;
  const key = orderKey(asset.projectId, asset.folderId ?? null);
  if (!state.assetOrder[key]) state.assetOrder[key] = [];
  state.assetOrder[key].push(asset.id);
},
removeAsset: (state, action: PayloadAction<string>) => {
  const asset = state.byId[action.payload];
  if (asset) {
    const key = orderKey(asset.projectId, asset.folderId ?? null);
    if (state.assetOrder[key]) {
      state.assetOrder[key] = state.assetOrder[key].filter((id) => id !== action.payload);
    }
  }
  delete state.byId[action.payload];
},
reorderAssets: (
  state,
  action: PayloadAction<{ orderKey: string; fromIndex: number; toIndex: number }>
) => {
  const { orderKey: key, fromIndex, toIndex } = action.payload;
  const order = state.assetOrder[key];
  if (!order) return;
  state.assetOrder[key] = reorder(order, fromIndex, toIndex);
},
```

Add `import { reorder } from '../../utils/reorder';` at the top of `assetsSlice.ts`.

Export `reorderAssets` from the slice.

- [ ] **Step 6: Update `useAssetsForProject.ts` to use scoped key**

```ts
// src/hooks/useAssetsForProject.ts
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { IAsset } from '../features/assets/assetsSlice';

export const useAssetsForProject = (projectId: string, folderId: string | null = null): IAsset[] => {
  return useSelector((state: RootState) => {
    const key = `${projectId}:${folderId ?? 'root'}`;
    const order = state.assets.assetOrder?.[key];

    if (!order || order.length === 0) {
      // Fallback: unordered enumeration (legacy persisted state)
      return Object.values(state.assets.byId).filter(
        (a) => a.projectId === projectId && (a.folderId ?? null) === folderId
      ) as IAsset[];
    }

    return order
      .map((id) => state.assets.byId[id])
      .filter((a): a is IAsset => Boolean(a));
  });
};
```

- [ ] **Step 7: Add asset ordering tests**

Add to `tests/ui/features/assets/assetsSlice.test.ts`:

```ts
import { reorderAssets } from '../../../../src/features/assets/assetsSlice';

describe('assetOrder', () => {
  const clean: IAssetsState = { byId: {}, assetOrder: {} };

  test('addAsset adds id to assetOrder with scoped key', () => {
    const s = assetsReducer(clean, addAsset({ id: 'a1', name: 'bunny.png', content: '', projectId: 'p1' }));
    expect(s.assetOrder['p1:root']).toEqual(['a1']);
  });

  test('removeAsset removes id from assetOrder', () => {
    let s = assetsReducer(clean, addAsset({ id: 'a1', name: 'bunny.png', content: '', projectId: 'p1' }));
    s = assetsReducer(s, removeAsset('a1'));
    expect(s.assetOrder['p1:root']).toEqual([]);
  });

  test('reorderAssets moves an id from one index to another', () => {
    let s = assetsReducer(clean, addAsset({ id: 'a1', name: 'a.png', content: '', projectId: 'p1' }));
    s = assetsReducer(s, addAsset({ id: 'a2', name: 'b.png', content: '', projectId: 'p1' }));
    s = assetsReducer(s, reorderAssets({ orderKey: 'p1:root', fromIndex: 0, toIndex: 1 }));
    expect(s.assetOrder['p1:root']).toEqual(['a2', 'a1']);
  });
});
```

- [ ] **Step 8: Run the full test suite**

```
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/features/files/filesSlice.ts src/features/assets/assetsSlice.ts src/hooks/useFilesForProject.ts src/hooks/useAssetsForProject.ts tests/ui/features/files/filesSlice.test.ts tests/ui/features/assets/assetsSlice.test.ts
git commit -m "feat: migrate fileOrder to scoped keys; add asset ordering"
```

---

### Task 2: `FolderNode` component

Presentational component: renders a folder row with chevron, folder icon, name, item-count badge (when collapsed), and hover-revealed rename/delete buttons. No Redux, no drag logic — those live in the parent.

**Files:**
- Create: `src/components/FileTree/FolderNode.tsx`

- [ ] **Step 1: Create `FolderNode.tsx`**

```tsx
// src/components/FileTree/FolderNode.tsx
import React from 'react';

type FolderNodeProps = {
  name: string;
  isOpen: boolean;
  itemCount: number;         // total descendant count — shown in badge when collapsed
  depth: number;             // indentation level (0 = root)
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  /** dnd-kit drag handle props passed through from useSortable */
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  isDragging?: boolean;
};

const FolderNode: React.FC<FolderNodeProps> = ({
  name,
  isOpen,
  itemCount,
  depth,
  onToggle,
  onRename,
  onDelete,
  dragHandleProps,
  isDragging,
}) => {
  const indent = depth * 12; // px per level

  return (
    <div
      style={{ paddingLeft: indent, opacity: isDragging ? 0.5 : 1 }}
      className="group flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text select-none"
      onClick={onToggle}
    >
      {/* Drag handle */}
      <button
        {...dragHandleProps}
        aria-label="Drag folder"
        tabIndex={-1}
        className="opacity-0 group-hover:opacity-100 text-ds-text-dim cursor-grab active:cursor-grabbing leading-none transition-opacity flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </button>

      {/* Chevron */}
      <span className="text-ds-text-dim text-[9px] w-2 flex-shrink-0">
        {isOpen ? '▼' : '▶'}
      </span>

      {/* Folder icon */}
      <span className="flex-shrink-0">📁</span>

      {/* Name */}
      <span className="truncate flex-1 font-medium">{name}</span>

      {/* Collapsed item-count badge */}
      {!isOpen && itemCount > 0 && (
        <span className="text-[9px] text-ds-text-dim bg-ds-surface rounded px-1">
          {itemCount}
        </span>
      )}

      {/* Hover actions */}
      <button
        onClick={(e) => { e.stopPropagation(); onRename(); }}
        className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-text transition-opacity flex-shrink-0 p-0.5"
        aria-label={`Rename folder ${name}`}
        title="Rename"
        tabIndex={-1}
      >
        ✏️
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error transition-opacity flex-shrink-0"
        aria-label={`Delete folder ${name}`}
        title="Delete"
        tabIndex={-1}
      >
        🗑
      </button>
    </div>
  );
};

export default FolderNode;
```

- [ ] **Step 2: Run the full test suite (TypeScript + tests)**

```
npx vitest run
```
Expected: PASS — new file has no tests, but existing suite must remain green.

- [ ] **Step 3: Commit**

```bash
git add src/components/FileTree/FolderNode.tsx
git commit -m "feat: add FolderNode presentational component"
```

---

### Task 3: FileTree — render folder hierarchy (Files section)

Rewrite `FileTree` to render a recursive folder tree. Each folder is collapsible via local state. Files at root render as before. Files inside a folder render indented beneath the folder. No drag-into-folder yet — that's Task 5.

`FileTree` calls `useFilesForProject(projectId, folderId)` per folder level (including root). It reads `state.folders.items` filtered by project to build the tree.

**Files:**
- Modify: `src/components/FileTree/index.tsx`

- [ ] **Step 1: Update `FileTree/index.tsx`**

The full updated component. Key changes:
- Reads `folders` from Redux (filtered to this project)
- Renders a recursive `renderLevel` function
- Collapse state is `Record<string, boolean>` keyed by folder id
- `reorderFiles` now passes `orderKey` instead of `projectId`

```tsx
// src/components/FileTree/index.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { RootState, AppDispatch } from '../../store';
import { useFilesForProject } from '../../hooks/useFilesForProject';
import { ModalWithInput } from '../Modal';
import { IFile, addFile, removeFile, reorderFiles } from '../../features/files/filesSlice';
import { validateFileName, normaliseFileName } from '../../utils/fileNameValidation';
import { selectFile, clearProjectSelection } from '../../features/ui/uiSlice';
import { IFolder, addFolder } from '../../features/folders/foldersSlice';
import { renameFolderWithCascade, removeFolderWithCascade } from '../../features/folders/folderThunks';
import { getFullName } from '../../selectors/getFullName';
import SortableFileItem from './SortableFileItem';
import FolderNode from './FolderNode';
import PackagesSection from './PackagesSection';
import AddPackageModal from '../AddPackageModal';
import ReactDOM from 'react-dom';

type FileTreeProps = { projectId: string };

/** Recursively count all files under a folder (any depth). */
function countFiles(folderId: string, folders: IFolder[], allFiles: IFile[]): number {
  const directFiles = allFiles.filter((f) => f.folderId === folderId).length;
  const childFolders = folders.filter((f) => f.parentId === folderId);
  return directFiles + childFolders.reduce((sum, cf) => sum + countFiles(cf.id, folders, allFiles), 0);
}

const FileTree: React.FC<FileTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const allFiles = useFilesForProject(projectId);  // all files for the project
  const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [creatingFolderParent, setCreatingFolderParent] = useState<string | null | undefined>(undefined); // undefined = not creating
  const [newFolderName, setNewFolderName] = useState('');
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  // Folder rename modal state
  const [renamingFolder, setRenamingFolder] = useState<IFolder | null>(null);
  // Folder delete modal state
  const [deletingFolder, setDeletingFolder] = useState<IFolder | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const deleteInputRef = useRef<HTMLInputElement>(null);

  const selectedFileId = useSelector(
    (state: RootState) => state.ui.selectedFileByProject[projectId]
  );

  const folders: IFolder[] = useSelector((state: RootState) =>
    state.folders.items.filter((f) => f.projectId === projectId)
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (!selectedFileId && allFiles.length > 0) {
      dispatch(selectFile({ projectId, fileId: allFiles[0].id }));
    }
  }, [selectedFileId, allFiles, dispatch, projectId]);

  useEffect(() => {
    if (creatingFolderParent !== undefined) {
      setTimeout(() => newFolderInputRef.current?.focus(), 0);
    }
  }, [creatingFolderParent]);

  useEffect(() => {
    if (deletingFolder) setTimeout(() => deleteInputRef.current?.focus(), 0);
  }, [deletingFolder]);

  useEffect(() => {
    if (!deletingFolder) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDeletingFolder(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [deletingFolder]);

  useEffect(() => {
    if (!renamingFolder) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setRenamingFolder(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [renamingFolder]);

  const handleFileSelected = (id: string) => dispatch(selectFile({ projectId, fileId: id }));

  const handleNewFile = (filename: string) => {
    const file: IFile = {
      id: uuidv4(),
      name: normaliseFileName(filename),
      source: '',
      projectId,
      folderId: null,
      fullName: normaliseFileName(filename),
    };
    dispatch(addFile(file));
    handleFileSelected(file.id);
  };

  const handleDeleteFile = (id: string) => {
    dispatch(removeFile(id));
    if (id === selectedFileId) {
      const remaining = allFiles.filter((f) => f.id !== id);
      if (remaining.length > 0) handleFileSelected(remaining[0].id);
      else dispatch(clearProjectSelection(projectId));
    }
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) { setCreatingFolderParent(undefined); return; }
    dispatch(addFolder({
      id: uuidv4(),
      name,
      projectId,
      parentId: creatingFolderParent ?? null,
    }));
    setNewFolderName('');
    setCreatingFolderParent(undefined);
  };

  const handleDragEnd = useCallback((event: DragEndEvent, orderKey: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const filesAtLevel = allFiles.filter((f) => {
      const key = `${projectId}:${f.folderId ?? 'root'}`;
      return key === orderKey;
    });
    const fromIndex = filesAtLevel.findIndex((f) => f.id === active.id);
    const toIndex = filesAtLevel.findIndex((f) => f.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      dispatch(reorderFiles({ orderKey, fromIndex, toIndex }));
    }
  }, [allFiles, dispatch, projectId]);

  /** Render all folders and files at a given parent level. */
  const renderLevel = (parentId: string | null, depth: number): React.ReactNode => {
    const levelFolders = folders.filter((f) => f.parentId === parentId);
    const levelFiles = allFiles.filter((f) => (f.folderId ?? null) === parentId);
    const levelOrderKey = `${projectId}:${parentId ?? 'root'}`;
    const fileIds = levelFiles.map((f) => f.id);

    return (
      <>
        {/* Folder nodes at this level */}
        {levelFolders.map((folder) => {
          const isOpen = openFolders[folder.id] !== false; // default open
          const count = countFiles(folder.id, folders, allFiles);
          return (
            <div key={folder.id}>
              <FolderNode
                name={folder.name}
                isOpen={isOpen}
                itemCount={count}
                depth={depth}
                onToggle={() => setOpenFolders((prev) => ({ ...prev, [folder.id]: !isOpen }))}
                onRename={() => setRenamingFolder(folder)}
                onDelete={() => { setDeletingFolder(folder); setDeleteConfirmName(''); }}
              />
              {isOpen && (
                <div style={{ paddingLeft: (depth + 1) * 4 }}>
                  {renderLevel(folder.id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}

        {/* Files at this level */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => handleDragEnd(e, levelOrderKey)}
        >
          <SortableContext items={fileIds} strategy={verticalListSortingStrategy}>
            <ul role="listbox" aria-label="Files" className="space-y-0.5">
              {levelFiles.map((file, index) => (
                <SortableFileItem
                  key={file.id}
                  file={file}
                  isSelected={file.id === selectedFileId}
                  showDelete={allFiles.length > 1}
                  onSelect={handleFileSelected}
                  onDelete={handleDeleteFile}
                  onKeyDown={() => {}}
                  itemRef={() => {}}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        {/* Inline folder creation input (shown when creating in this parent) */}
        {creatingFolderParent === parentId && (
          <div style={{ paddingLeft: depth * 12 }} className="flex items-center gap-1 px-2 py-1">
            <span className="text-xs">📁</span>
            <input
              ref={newFolderInputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setCreatingFolderParent(undefined);
              }}
              onBlur={handleCreateFolder}
              placeholder="Folder name"
              className="flex-1 bg-ds-bg border border-ds-border rounded px-2 py-0.5 text-xs text-ds-text focus:outline-none focus:ring-1 focus:ring-ds-accent"
            />
          </div>
        )}
      </>
    );
  };

  // --- Rename modal ---
  const renameModal = renamingFolder
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setRenamingFolder(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-folder-modal-title"
            className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
          >
            <h2 id="rename-folder-modal-title" className="text-ds-text text-lg font-semibold mb-4">
              Rename folder
            </h2>
            <ModalWithInput
              title=""
              openText=""
              placeholder="Folder name"
              saveText="Rename"
              closeText="Cancel"
              onSubmit={(name) => {
                if (name.trim() && name.trim() !== renamingFolder.name) {
                  dispatch(renameFolderWithCascade({ folderId: renamingFolder.id, name: name.trim() }));
                }
                setRenamingFolder(null);
              }}
            />
          </div>
        </div>,
        document.body
      )
    : null;

  // --- Delete modal ---
  const deleteModal = deletingFolder
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingFolder(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-folder-modal-title"
            className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
          >
            <h2 id="delete-folder-modal-title" className="text-ds-text text-lg font-semibold mb-2">
              Delete folder
            </h2>
            <p className="text-ds-text-muted text-sm mb-4">
              Items inside will move to the parent level. Type{' '}
              <span className="text-ds-text font-medium">{deletingFolder.name}</span> to confirm.
            </p>
            <input
              ref={deleteInputRef}
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && deleteConfirmName === deletingFolder.name) {
                  dispatch(removeFolderWithCascade({ folderId: deletingFolder.id }));
                  setDeletingFolder(null);
                }
              }}
              placeholder={deletingFolder.name}
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-error mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  dispatch(removeFolderWithCascade({ folderId: deletingFolder.id }));
                  setDeletingFolder(null);
                }}
                disabled={deleteConfirmName !== deletingFolder.name}
                className="bg-ds-error text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete
              </button>
              <button
                onClick={() => setDeletingFolder(null)}
                className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div>
      {renameModal}
      {deleteModal}
      <PackagesSection projectId={projectId} onAddClick={() => setIsAddPackageOpen(true)} />
      <AddPackageModal projectId={projectId} isOpen={isAddPackageOpen} onClose={() => setIsAddPackageOpen(false)} />

      {/* Section header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">Files</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCreatingFolderParent(null); setNewFolderName(''); }}
            className="text-ds-text-muted hover:text-ds-text transition text-sm leading-none"
            aria-label="New folder"
            title="New folder"
          >
            📁+
          </button>
          <ModalWithInput
            onSubmit={handleNewFile}
            openText="+"
            saveText="Save"
            closeText="Close"
            title="New file"
            placeholder="e.g. Main"
            validate={validateFileName}
          />
        </div>
      </div>

      {renderLevel(null, 0)}
    </div>
  );
};

export default FileTree;
```

- [ ] **Step 2: Run the full test suite**

```
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/FileTree/index.tsx
git commit -m "feat: render folder hierarchy in FileTree with create/rename/delete"
```

---

### Task 4: FileTree — drag items into folders

Extend the drag-and-drop logic so dropping a file onto a folder moves the file into it. This requires each `FolderNode` to be a droppable target (via `useDroppable`) in addition to being sortable.

The `DndContext` `onDragEnd` handler needs to distinguish between:
1. Drop on a folder → move file into folder
2. Same-level sort → reorder
3. Cross-level → not supported in this phase (defer to later)

**Files:**
- Modify: `src/components/FileTree/index.tsx`
- Modify: `src/components/FileTree/FolderNode.tsx`

- [ ] **Step 1: Update `FolderNode` to be a droppable target**

Add `useDroppable` to `FolderNode`:

```tsx
// Add to imports at top of FolderNode.tsx:
import { useDroppable } from '@dnd-kit/core';

// Add to FolderNodeProps:
folderId: string;
isDropTarget?: boolean;

// Replace the outer div in the component:
const FolderNode: React.FC<FolderNodeProps> = ({
  folderId,
  name,
  isOpen,
  itemCount,
  depth,
  onToggle,
  onRename,
  onDelete,
  dragHandleProps,
  isDragging,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `folder-drop:${folderId}` });
  const indent = depth * 12;

  return (
    <div
      ref={setNodeRef}
      style={{ paddingLeft: indent, opacity: isDragging ? 0.5 : 1 }}
      className={`group flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer select-none transition-colors
        ${isOver
          ? 'bg-ds-accent-subtle text-ds-text border border-ds-accent'
          : 'text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text'
        }`}
      onClick={onToggle}
    >
      {/* ... rest of content unchanged ... */}
    </div>
  );
};
```

Keep all the inner content (`dragHandleProps`, chevron, icon, name, badge, rename/delete buttons) unchanged from Task 2.

- [ ] **Step 2: Update `FileTree` `onDragEnd` to handle folder drops**

Replace `handleDragEnd` in `FileTree/index.tsx`:

```tsx
// Add to imports:
import { setFileFolder } from '../../features/files/filesSlice';

// Replace the handleDragEnd useCallback:
const handleDragEnd = useCallback((event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const activeFile = allFiles.find((f) => f.id === active.id);
  if (!activeFile) return;

  // Case 1: dropped onto a folder-drop target
  if (String(over.id).startsWith('folder-drop:')) {
    const targetFolderId = String(over.id).replace('folder-drop:', '');
    const targetFolder = folders.find((f) => f.id === targetFolderId);
    if (!targetFolder) return;
    const newFullName = getFullName(activeFile.name, targetFolderId, folders);
    dispatch(setFileFolder({ fileId: activeFile.id, folderId: targetFolderId, fullName: newFullName }));
    // Expand the target folder
    setOpenFolders((prev) => ({ ...prev, [targetFolderId]: true }));
    return;
  }

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
}, [allFiles, folders, dispatch, projectId]);
```

Update `renderLevel` to pass the unified `handleDragEnd` to the single `DndContext` that wraps the whole section (move `DndContext` out of `renderLevel` to wrap the entire Files tree), and pass `folderId` to `FolderNode`:

```tsx
// In renderLevel, update FolderNode usage:
<FolderNode
  key={folder.id}
  folderId={folder.id}       // NEW
  name={folder.name}
  isOpen={isOpen}
  itemCount={count}
  depth={depth}
  onToggle={...}
  onRename={...}
  onDelete={...}
/>
```

Wrap the entire `renderLevel(null, 0)` call in the return JSX with a single top-level `DndContext`:

```tsx
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  {renderLevel(null, 0)}
</DndContext>
```

Remove the per-level `DndContext` from inside `renderLevel` — keep only `SortableContext` per level.

- [ ] **Step 3: Run the full test suite**

```
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/FileTree/index.tsx src/components/FileTree/FolderNode.tsx
git commit -m "feat: drag files into folders in FileTree"
```

---

### Task 5: FileTree — auto-expand folders on drag hover

When a file is dragged over a folder for more than 500ms, the folder auto-expands so the user can drop into a nested folder without pre-expanding it.

**Files:**
- Modify: `src/components/FileTree/index.tsx`

- [ ] **Step 1: Add auto-expand logic to `FileTree`**

Add the following to `FileTree` (inside the component body, after existing state):

```tsx
// Track which folder the drag is currently over
const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// Auto-expand when hovering over a folder for 500ms
useEffect(() => {
  if (dragOverFolderId === null) {
    if (autoExpandTimerRef.current) clearTimeout(autoExpandTimerRef.current);
    return;
  }
  autoExpandTimerRef.current = setTimeout(() => {
    setOpenFolders((prev) => ({ ...prev, [dragOverFolderId]: true }));
  }, 500);
  return () => {
    if (autoExpandTimerRef.current) clearTimeout(autoExpandTimerRef.current);
  };
}, [dragOverFolderId]);
```

Add `onDragOver` handler to the `DndContext`:

```tsx
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragOver={(event) => {
    const overId = String(event.over?.id ?? '');
    if (overId.startsWith('folder-drop:')) {
      const fId = overId.replace('folder-drop:', '');
      setDragOverFolderId((prev) => (prev === fId ? prev : fId));
    } else {
      setDragOverFolderId(null);
    }
  }}
  onDragEnd={(event) => {
    setDragOverFolderId(null);
    handleDragEnd(event);
  }}
>
```

- [ ] **Step 2: Run the full test suite**

```
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/FileTree/index.tsx
git commit -m "feat: auto-expand folder on drag hover (500ms)"
```

---

### Task 6: AssetTree — full folder support

`AssetTree` (`src/components/TreePanel/AssetTree/index.tsx`) gets the same folder treatment as `FileTree`: 📁+ button, `FolderNode` rendering, drag-into-folder, auto-expand, rename/delete modals. This task mirrors Tasks 3–5 but for the assets section.

**Files:**
- Modify: `src/components/TreePanel/AssetTree/index.tsx`

- [ ] **Step 1: Rewrite `AssetTree/index.tsx`**

Full replacement — mirrors `FileTree` but operates on `assetsSlice` and uses `useAssetsForProject`:

```tsx
// src/components/TreePanel/AssetTree/index.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { RootState, AppDispatch } from '../../../store';
import { useAssetsForProject } from '../../../hooks/useAssetsForProject';
import { IAsset, addAsset, removeAsset, reorderAssets, setAssetFolder } from '../../../features/assets/assetsSlice';
import { IFolder, addFolder } from '../../../features/folders/foldersSlice';
import { renameFolderWithCascade, removeFolderWithCascade } from '../../../features/folders/folderThunks';
import { getFullName } from '../../../selectors/getFullName';
import FolderNode from '../../FileTree/FolderNode';
import ReactDOM from 'react-dom';

type AssetTreeProps = { projectId: string };

const MAX_BYTES = 4 * 1024 * 1024;

function countAssets(folderId: string, folders: IFolder[], allAssets: IAsset[]): number {
  const direct = allAssets.filter((a) => a.folderId === folderId).length;
  const children = folders.filter((f) => f.parentId === folderId);
  return direct + children.reduce((sum, cf) => sum + countAssets(cf.id, folders, allAssets), 0);
}

const AssetTree: React.FC<AssetTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const allAssets = useAssetsForProject(projectId);
  const inputRef = useRef<HTMLInputElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const deleteInputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [creatingFolderParent, setCreatingFolderParent] = useState<string | null | undefined>(undefined);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<IFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<IFolder | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const folders: IFolder[] = useSelector((state: RootState) =>
    state.folders.items.filter((f) => f.projectId === projectId)
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (creatingFolderParent !== undefined) {
      setTimeout(() => newFolderInputRef.current?.focus(), 0);
    }
  }, [creatingFolderParent]);

  useEffect(() => {
    if (deletingFolder) setTimeout(() => deleteInputRef.current?.focus(), 0);
  }, [deletingFolder]);

  useEffect(() => {
    if (!deletingFolder) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDeletingFolder(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [deletingFolder]);

  useEffect(() => {
    if (!renamingFolder) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setRenamingFolder(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [renamingFolder]);

  useEffect(() => {
    if (dragOverFolderId === null) {
      if (autoExpandTimerRef.current) clearTimeout(autoExpandTimerRef.current);
      return;
    }
    autoExpandTimerRef.current = setTimeout(() => {
      setOpenFolders((prev) => ({ ...prev, [dragOverFolderId]: true }));
    }, 500);
    return () => { if (autoExpandTimerRef.current) clearTimeout(autoExpandTimerRef.current); };
  }, [dragOverFolderId]);

  const processFiles = async (fileList: FileList, targetFolderId: string | null = null) => {
    for (const f of Array.from(fileList)) {
      if (f.size > MAX_BYTES) { alert(`${f.name} is too large (max 4 MB).`); return; }
    }
    await Promise.all(
      Array.from(fileList).map(
        (file) =>
          new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const assetName = file.name;
              const fullName = getFullName(assetName, targetFolderId, folders);
              dispatch(addAsset({
                id: crypto.randomUUID(),
                name: assetName,
                content: reader.result as string,
                projectId,
                folderId: targetFolderId,
                fullName,
              }));
              resolve();
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    );
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) { setCreatingFolderParent(undefined); return; }
    dispatch(addFolder({ id: uuidv4(), name, projectId, parentId: creatingFolderParent ?? null }));
    setNewFolderName('');
    setCreatingFolderParent(undefined);
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setDragOverFolderId(null);
    if (!over || active.id === over.id) return;

    const activeAsset = allAssets.find((a) => a.id === active.id);
    if (!activeAsset) return;

    if (String(over.id).startsWith('folder-drop:')) {
      const targetFolderId = String(over.id).replace('folder-drop:', '');
      const newFullName = getFullName(activeAsset.name, targetFolderId, folders);
      dispatch(setAssetFolder({ assetId: activeAsset.id, folderId: targetFolderId, fullName: newFullName }));
      setOpenFolders((prev) => ({ ...prev, [targetFolderId]: true }));
      return;
    }

    const overAsset = allAssets.find((a) => a.id === over.id);
    if (!overAsset || overAsset.folderId !== activeAsset.folderId) return;
    const key = `${projectId}:${activeAsset.folderId ?? 'root'}`;
    const levelAssets = allAssets.filter((a) => (a.folderId ?? null) === (activeAsset.folderId ?? null));
    const fromIndex = levelAssets.findIndex((a) => a.id === active.id);
    const toIndex = levelAssets.findIndex((a) => a.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      dispatch(reorderAssets({ orderKey: key, fromIndex, toIndex }));
    }
  }, [allAssets, folders, dispatch, projectId]);

  const renderLevel = (parentId: string | null, depth: number): React.ReactNode => {
    const levelFolders = folders.filter((f) => f.parentId === parentId);
    const levelAssets = allAssets.filter((a) => (a.folderId ?? null) === parentId);
    const assetIds = levelAssets.map((a) => a.id);

    return (
      <>
        {levelFolders.map((folder) => {
          const isOpen = openFolders[folder.id] !== false;
          const count = countAssets(folder.id, folders, allAssets);
          return (
            <div key={folder.id}>
              <FolderNode
                folderId={folder.id}
                name={folder.name}
                isOpen={isOpen}
                itemCount={count}
                depth={depth}
                onToggle={() => setOpenFolders((prev) => ({ ...prev, [folder.id]: !isOpen }))}
                onRename={() => setRenamingFolder(folder)}
                onDelete={() => { setDeletingFolder(folder); setDeleteConfirmName(''); }}
              />
              {isOpen && (
                <div style={{ paddingLeft: (depth + 1) * 4 }}>
                  {renderLevel(folder.id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}

        <SortableContext items={assetIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-0.5">
            {levelAssets.map((asset) => (
              <li
                key={asset.id}
                style={{ paddingLeft: depth * 12 }}
                className="group flex items-center justify-between px-2 py-1 rounded text-xs text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text"
              >
                <span className="truncate">{asset.name}</span>
                <button
                  onClick={() => dispatch(removeAsset(asset.id))}
                  className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error ml-1 leading-none transition-opacity"
                  aria-label={`Remove ${asset.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </SortableContext>

        {creatingFolderParent === parentId && (
          <div style={{ paddingLeft: depth * 12 }} className="flex items-center gap-1 px-2 py-1">
            <span className="text-xs">📁</span>
            <input
              ref={newFolderInputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setCreatingFolderParent(undefined);
              }}
              onBlur={handleCreateFolder}
              placeholder="Folder name"
              className="flex-1 bg-ds-bg border border-ds-border rounded px-2 py-0.5 text-xs text-ds-text focus:outline-none focus:ring-1 focus:ring-ds-accent"
            />
          </div>
        )}
      </>
    );
  };

  // Rename modal
  const renameModal = renamingFolder
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setRenamingFolder(null); }}
        >
          <div role="dialog" aria-modal="true" className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-ds-text text-lg font-semibold mb-4">Rename folder</h2>
            <input
              autoFocus
              defaultValue={renamingFolder.name}
              type="text"
              placeholder="Folder name"
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const name = (e.target as HTMLInputElement).value.trim();
                  if (name && name !== renamingFolder.name) {
                    dispatch(renameFolderWithCascade({ folderId: renamingFolder.id, name }));
                  }
                  setRenamingFolder(null);
                }
                if (e.key === 'Escape') setRenamingFolder(null);
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={(e) => {
                  const input = (e.currentTarget.closest('[role="dialog"]') as HTMLElement)?.querySelector('input') as HTMLInputElement;
                  const name = input?.value.trim();
                  if (name && name !== renamingFolder.name) {
                    dispatch(renameFolderWithCascade({ folderId: renamingFolder.id, name }));
                  }
                  setRenamingFolder(null);
                }}
                className="bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition"
              >
                Rename
              </button>
              <button onClick={() => setRenamingFolder(null)} className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition">
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  // Delete modal
  const deleteModal = deletingFolder
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingFolder(null); }}
        >
          <div role="dialog" aria-modal="true" className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-ds-text text-lg font-semibold mb-2">Delete folder</h2>
            <p className="text-ds-text-muted text-sm mb-4">
              Items inside will move to the parent level. Type <span className="text-ds-text font-medium">{deletingFolder.name}</span> to confirm.
            </p>
            <input
              ref={deleteInputRef}
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && deleteConfirmName === deletingFolder.name) {
                  dispatch(removeFolderWithCascade({ folderId: deletingFolder.id }));
                  setDeletingFolder(null);
                }
              }}
              placeholder={deletingFolder.name}
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-error mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { dispatch(removeFolderWithCascade({ folderId: deletingFolder.id })); setDeletingFolder(null); }}
                disabled={deleteConfirmName !== deletingFolder.name}
                className="bg-ds-error text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete
              </button>
              <button onClick={() => setDeletingFolder(null)} className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition">
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div>
      {renameModal}
      {deleteModal}

      {/* Section header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">Assets</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCreatingFolderParent(null); setNewFolderName(''); }}
            className="text-ds-text-muted hover:text-ds-text transition text-sm leading-none"
            aria-label="New folder"
            title="New folder"
          >
            📁+
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="text-ds-text-muted hover:text-ds-text transition text-sm leading-none"
            aria-label="Upload asset"
            title="Upload asset"
          >
            +
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            data-testid="uploader"
            aria-label="Upload asset"
            onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = ''; }}
          />
        </div>
      </div>

      {allAssets.length === 0 && folders.length === 0 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`mt-1 border border-dashed rounded px-2 py-3 text-center cursor-pointer transition-colors
            ${dragging ? 'border-ds-accent text-ds-text-muted bg-ds-accent-subtle' : 'border-ds-border text-ds-text-dim hover:border-ds-accent hover:text-ds-text-muted'}`}
        >
          <span className="text-[10px] leading-relaxed">Drop files here<br />or click + to browse</span>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={(event) => {
            const overId = String(event.over?.id ?? '');
            if (overId.startsWith('folder-drop:')) {
              const fId = overId.replace('folder-drop:', '');
              setDragOverFolderId((prev) => (prev === fId ? prev : fId));
            } else {
              setDragOverFolderId(null);
            }
          }}
          onDragEnd={handleDragEnd}
        >
          {renderLevel(null, 0)}
          <li
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={`mt-1 border border-dashed rounded px-2 py-1.5 text-center cursor-pointer transition-colors text-[10px]
              ${dragging ? 'border-ds-accent text-ds-text-muted' : 'border-ds-border text-ds-text-dim hover:border-ds-accent'}`}
          >
            Drop to add more
          </li>
        </DndContext>
      )}
    </div>
  );
};

export default AssetTree;
```

- [ ] **Step 2: Run the full test suite**

```
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/TreePanel/AssetTree/index.tsx
git commit -m "feat: add full folder support to AssetTree"
```
