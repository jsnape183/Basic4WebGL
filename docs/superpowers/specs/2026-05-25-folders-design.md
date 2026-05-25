# Folders Feature — Design Spec

## Goal

Add folder support to the project file tree so users can organise source files and assets into named, nestable groups without changing how either is referenced by the compiler or runtime. A persisted `fullName` field carries the folder path wherever it is needed (asset loading, error reporting).

---

## Constraints

- **Globally unique file names.** Two files cannot share a name regardless of folder. This means transpiled class names never need folder prefixes to avoid collisions.
- **No full-path referencing in source code for files.** `include` does not exist; files are compiled together. Error messages, however, must show the full path (e.g. `ui/Menu.bas`).
- **Asset `fullName` is the key user code uses.** `loadImage("sprites/bunny.png")` — the folder prefix is part of the asset identifier. Moving an asset to a different folder is a breaking change the user must make deliberately.
- **UI-only folders.** The compiler, runtime, and all file I/O are unaffected by folder structure except at the two integration points (asset resolution and error filenames).

---

## Data Model

### `IFolder`

```ts
interface IFolder {
  id: string;
  name: string;
  projectId: string;
  parentId: string | null;   // null = root level
}
```

Stored in a new Redux slice: `foldersSlice`.

### `IFile` (additions)

```ts
interface IFile {
  // ...existing fields...
  folderId: string | null;   // null = root level
  fullName: string;          // persisted: "ui/Menu.bas" or "Main.bas"
}
```

### `IAsset` (additions)

```ts
interface IAsset {
  // ...existing fields...
  folderId: string | null;
  fullName: string;          // persisted: "sprites/bunny.png" or "bunny.png"
}
```

---

## `fullName` — Persistence Strategy

`fullName` is **stored, not computed at runtime**. It is recomputed eagerly in the Redux layer whenever a UI action changes it, keeping runtime overhead at zero.

### `getFullName` utility

```ts
// src/selectors/getFullName.ts
export function getFullName(
  itemName: string,
  folderId: string | null,
  folders: IFolder[]
): string {
  if (!folderId) return itemName;
  const parts: string[] = [itemName];
  let current = folders.find(f => f.id === folderId);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId
      ? folders.find(f => f.id === current!.parentId)
      : undefined;
  }
  return parts.join('/');
}
```

Used only inside Redux thunks — never in rendering or runtime code.

### When `fullName` is recomputed

| Trigger | Affected items |
|---|---|
| Item moved to / from a folder | That item only |
| Item created | That item only |
| Folder renamed | Every file/asset whose path passes through that folder |
| Folder moved (parentId changes) | Every file/asset whose path passes through that folder |
| Folder deleted | Items at that folder move to root; `fullName = name` |

Cascade updates (folder rename / move) are handled by thunks, not plain reducers, because the files/assets reducers do not have access to the folders slice state needed to recompute paths.

---

## Redux Changes

### New: `foldersSlice`

```
src/features/folders/foldersSlice.ts
```

Plain reducers:
- `addFolder(folder: IFolder)`
- `removeFolder(folderId: string)` — moves child folders to parent (or root), moves items to root
- `renameFolder({ folderId, name })` — updates name only; cascade is handled by thunk

Thunks (in `src/features/folders/folderThunks.ts`):
- `renameFolderWithCascade({ folderId, name })` — dispatches `renameFolder`, then recomputes and batch-updates `fullName` for all affected files and assets
- `moveFolderWithCascade({ folderId, parentId })` — dispatches `moveFolder`, then cascades `fullName` updates

### Modified: `filesSlice`

- Add `folderId: string | null` and `fullName: string` to `IFile`
- Add reducers: `setFileFolder({ fileId, folderId, fullName })`, `batchSetFileFullNames(updates: { id, fullName }[])`
- Migration: existing files get `folderId: null`, `fullName: name`

### Modified: `assetsSlice`

- Same additions and migration as `filesSlice`

### Modified: `fileOrderSlice` (or equivalent)

`fileOrder` is currently keyed by `projectId`. With folders, ordering is per parent context:

```ts
// Key format: "${projectId}:${folderId ?? 'root'}"
fileOrder: Record<string, string[]>
```

Each folder level maintains its own independently-sorted list of item IDs (files, assets, and child folders interleaved within their section).

---

## Integration Points

### Asset loading

The asset manager currently indexes assets by `name`. It switches to indexing by `fullName`. Existing projects are unaffected because assets at root have `fullName === name`.

### Error reporting

The editor passes `file.name` to the compiler entry point today. This changes to `file.fullName`. `SourceLocation` shape is unchanged — it stores whatever string is passed in. No compiler internals change.

---

## UI — Two Stages

### Stage 1: Backend

All Redux/data work. No visible UI changes to the user. Tests cover:
- `getFullName` utility for single, nested, and root items
- `foldersSlice` CRUD
- Cascade thunks (rename, move)
- `fullName` recomputation correctness
- `fileOrder` key format

### Stage 2: UI

All component work, building on Stage 1.

#### File tree structure

- Each section (Files, Assets) gains a `📁+` button in its header to create a new folder at root
- Folder nodes render with a chevron (▼/▶), folder icon, name
- Collapse state is **local component state** — not persisted
- Collapsed folders show an item-count badge
- Hover on a folder reveals ✏️ rename and 🗑 delete icons (same pattern as project cards)
- Folders can be nested to arbitrary depth; indentation increases per level

#### Folder creation

Clicking `📁+` inserts an inline text input at the top of that section. Pressing Enter (or clicking away with a name) dispatches `addFolder`. Escape cancels. Empty name is a no-op.

#### Drag and drop

Built on existing dnd-kit infrastructure:

- Each folder's children have their own `SortableContext` (nested contexts)
- Each folder node is simultaneously `useSortable` (reorderable among siblings) and `useDroppable` (items can be dropped into it)
- `onDragEnd` logic:
  - Drop target is a folder → `setFileFolder` / `setAssetFolder` + update `fullName`
  - Same-parent reorder → existing reorder dispatch
  - Cross-folder reorder → move dispatch + reorder in destination
- **Auto-expand on drag hover:** `dragOverFolderId` state + 500ms `useEffect` timeout expands the folder, allowing items to be dropped into nested folders without pre-expanding

#### Folder rename

Clicking ✏️ on a folder opens the existing `ModalWithInput` component pre-filled with the current name. Confirm dispatches `renameFolderWithCascade`.

#### Folder delete

Clicking 🗑 on a folder opens a confirmation modal (same pattern as project delete — user must type the folder name). Dispatches `removeFolder`. Items inside move to the deleted folder's parent (or root). Child folders also move up one level.

---

## File Map

### New files

| Path | Purpose |
|---|---|
| `src/features/folders/foldersSlice.ts` | Redux slice for folder entities |
| `src/features/folders/folderThunks.ts` | Cascade thunks for rename and move |
| `src/selectors/getFullName.ts` | Utility: compute fullName from folder tree |
| `src/components/FileTree/FolderNode.tsx` | Folder row component (chevron, name, actions) |

### Modified files

| Path | Change |
|---|---|
| `src/features/files/filesSlice.ts` | Add `folderId`, `fullName` to `IFile`; new reducers |
| `src/features/assets/assetsSlice.ts` | Add `folderId`, `fullName` to `IAsset`; new reducers |
| `src/features/fileOrder/fileOrderSlice.ts` | Update key format to `projectId:folderId\|root` |
| `src/store.ts` | Register `foldersSlice` reducer |
| `src/components/FileTree/index.tsx` | Integrate `FolderNode`, nested `SortableContext`, drag-into-folder |
| `src/components/FileTree/SortableFileItem.tsx` | No structural change; drag-out behaviour wired via parent |
| Editor compile invocation | Pass `file.fullName` instead of `file.name` |
| Asset manager | Index by `fullName` instead of `name` |

---

## Testing

- Unit: `getFullName` — root item, single folder, three levels deep
- Unit: `foldersSlice` — add, remove (cascade to items), rename
- Unit: cascade thunks — rename propagates to all items under folder and its descendants
- Unit: `fileOrder` key format
- Integration: asset loaded by `fullName` after folder assignment
- Integration: error `SourceLocation.filename` contains folder path after file moved
