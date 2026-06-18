# File Tree Alphabetical Sort — Design Spec

## Problem

Now that `sortByDependencies` automatically resolves compile order, manual file ordering in the tree has no effect on compilation. Allowing users to drag-reorder files within a folder creates a false impression of control and adds confusion. A consistent alphabetical sort is simpler and more predictable.

## Goal

Files and folders always display in alphabetical order. Drag-and-drop is retained solely for moving files between folders.

---

## Behaviour

### Sorting

- Files within a folder are sorted A→Z by their `name` field (`localeCompare`)
- Folders within a nesting level are sorted A→Z by their `name` field
- Order is purely derived at render time — no stored sort order is consulted

### Drag-and-drop

- **Cross-folder drag** (drop onto a folder target): unchanged — moves the file into the target folder
- **Same-folder drag** (drop onto a sibling file): no-op — state is not updated, file snaps back to its alphabetical position
- The `SortableContext` remains in place so files are still draggable for folder drops; the brief visual shift during a same-folder drag that resolves on drop is acceptable

---

## Files

| Action | Path | Change |
|--------|------|--------|
| Modify | `src/hooks/useAllFilesForProject.ts` | Replace `fileOrder`-based comparator with `a.name.localeCompare(b.name)` |
| Modify | `src/components/FileTree/index.tsx` | Sort `levelFolders` alphabetically in `renderLevel`; remove `dispatch(reorderFiles(...))` from `handleDragEnd` Case 2 |

### `useAllFilesForProject.ts` — sort change

Replace:
```ts
return order.indexOf(a.id) - order.indexOf(b.id);
```
With:
```ts
return a.name.localeCompare(b.name);
```
The `aKey !== bKey` early-return becomes irrelevant (cross-folder pairs have no meaningful relative order to preserve) but can stay for safety.

### `FileTree/index.tsx` — two changes

**1. Sort folders in `renderLevel`:**
```ts
const levelFolders = folders
  .filter((f) => f.parentId === parentId)
  .sort((a, b) => a.name.localeCompare(b.name));
```

**2. Remove same-folder reorder from `handleDragEnd` Case 2:**

Keep the guard that returns early when folders differ:
```ts
if (!overFile || overFile.folderId !== activeFile.folderId) return;
```
Remove everything after it (the `dispatch(reorderFiles(...))` block). The whole Case 2 body becomes a no-op.

---

## What does NOT change

- `fileOrder` in Redux state — still populated on file creation, not harmful to keep
- `reorderFiles` action — no longer called but not removed (out of scope)
- `SortableContext` / `SortableFileItem` — kept as-is for cross-folder drag source
- Cross-folder drop logic — unchanged
