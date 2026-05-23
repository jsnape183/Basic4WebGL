# File Reorder Design Spec

**Goal:** Allow users to drag-reorder files in the FileTree panel, so compilation order can be controlled explicitly.

**Architecture:** Add an ordered ID array to the Redux files slice; update the file hook to honour it; wrap the FileTree in dnd-kit's sortable context with a drag-handle-only interaction on each row.

**Tech Stack:** TypeScript, React, Redux Toolkit, `@dnd-kit/core` + `@dnd-kit/sortable`, Vitest + Testing Library.

---

## Background

softBASIC compilation order is determined by the order files are passed to the compiler. Currently `useFilesForProject` returns `Object.values(state.files.byId).filter(...)`, which has no guaranteed order. Giving users explicit control over file order in the UI solves this directly without requiring compiler-level changes.

---

## Data Model

### `IFilesState` extension

Add `fileOrder: Record<string, string[]>` to the existing files slice state — a map from `projectId` to an ordered array of file IDs.

```typescript
interface IFilesState {
  byId: Record<string, IFile>;
  dirtyFileIds: string[];
  fileOrder: Record<string, string[]>;  // new
}
```

### Reducer changes

**`addFile`** — appends `file.id` to `fileOrder[file.projectId]`, creating the array if absent.

**`removeFile`** — filters the deleted ID out of `fileOrder[file.projectId]`.

**`reorderFiles` (new action)**

```typescript
reorderFiles(state, action: PayloadAction<{ projectId: string; fromIndex: number; toIndex: number }>)
```

Moves one ID in the array: remove from `fromIndex`, insert at `toIndex`. Uses a pure `reorder` utility (see below).

### Migration / existing persisted state

`useFilesForProject` falls back to `Object.values` order when `fileOrder[projectId]` is absent or empty (handles users upgrading from persisted state that predates this field).

---

## Pure Utility

```typescript
// src/utils/reorder.ts
export function reorder<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...list];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}
```

Used by the `reorderFiles` reducer. Independently unit-tested.

---

## Hook Change

`src/hooks/useFilesForProject.ts` — change from unordered `Object.values` to ordered lookup:

```typescript
export function useFilesForProject(projectId: string): IFile[] {
  return useSelector((state: RootState) => {
    const order = state.files.fileOrder[projectId];
    if (!order || order.length === 0) {
      // fallback for persisted state without fileOrder
      return Object.values(state.files.byId).filter(f => f.projectId === projectId);
    }
    return order
      .map(id => state.files.byId[id])
      .filter(Boolean);
  });
}
```

---

## Component Changes

### `SortableFileItem.tsx` (new)

`src/components/FileTree/SortableFileItem.tsx` — a single sortable file row extracted from `FileTree`. Uses `useSortable` from `@dnd-kit/sortable`.

- The drag handle (`⠿` button) receives `listeners` and `attributes` from `useSortable` — only grabbing the handle initiates a drag.
- The rest of the row (click-to-select, delete button) is unchanged.
- The handle is visible on hover only (matching the existing delete button pattern).
- `transform` and `transition` from `useSortable` are applied to the `<li>` for smooth animation.

### `FileTree/index.tsx` (modified)

- Imports `DndContext`, `SortableContext`, `verticalListSortingStrategy` from dnd-kit.
- Wraps the `<ul>` in `<DndContext onDragEnd={handleDragEnd}><SortableContext items={fileIds} strategy={verticalListSortingStrategy}>`.
- `handleDragEnd` receives `{ active, over }` from dnd-kit; dispatches `reorderFiles({ projectId, fromIndex, toIndex })` using the IDs to find indices.
- Renders `<SortableFileItem>` instead of the inline `<li>`.

---

## Interaction Design

- **Drag handle only** — the `⠿` grip icon initiates drag; clicking anywhere else on the row still selects the file.
- **Handle visibility** — appears on hover (same pattern as the delete button).
- **Order is implicit** — no numbering or labels; top = compiled first.
- **Persisted** — Redux Persist automatically saves `fileOrder` to localStorage on every reorder.

---

## Test Coverage

### Unit — `reorder` utility

- `reorder([a,b,c], 0, 2)` → `[b, c, a]`
- `reorder([a,b,c], 2, 0)` → `[c, a, b]`
- Moving to same index returns equivalent array

### Unit — `filesSlice` reducer

- `addFile` appends the new ID to `fileOrder[projectId]`
- `addFile` into a project with no existing order creates the array
- `removeFile` removes the ID from `fileOrder[projectId]`
- `reorderFiles` moves an ID from one index to another
- `reorderFiles` with an out-of-range index does not crash

### UI — `FileTreeReorder.test.tsx`

- Drag handle button is present for each file in the rendered list
- Drag handle has an accessible label (e.g. `aria-label="Drag to reorder"`)
- Actual drag simulation is **not** tested in jsdom — drag interaction correctness is covered by the reducer tests above

---

## Out of Scope

- End-to-end drag simulation (Playwright) — not part of this change
- Visual order numbers / compilation order indicators
- Keyboard drag (accessibility enhancement, future work)
- Touch drag support
