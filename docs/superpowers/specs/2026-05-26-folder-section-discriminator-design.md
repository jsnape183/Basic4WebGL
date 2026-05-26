# Folder Section Discriminator Design

**Date:** 2026-05-26

## Problem

Folders are stored in a single `foldersSlice` keyed only by `projectId`. Both `FileTree` and `AssetTree` query the same list, so a folder created in Assets appears in Files and vice versa.

## Goal

Folders created in the Files panel are only visible in the Files panel. Folders created in the Assets panel are only visible in the Assets panel. The backend storage remains unified.

## Solution

Add `section: 'files' | 'assets'` to `IFolder`. Each tree filters by its own section when reading from the store and stamps the section when dispatching `addFolder`.

---

## Data Model

```ts
// src/features/folders/foldersSlice.ts
export interface IFolder {
  id: string;
  name: string;
  projectId: string;
  parentId: string | null;
  section: 'files' | 'assets';   // NEW
}
```

`section` is required on all new folders. Existing persisted folders that predate this change lack the field; they default to `'files'` at the selector level (see below), preserving existing data without a migration reducer.

---

## Changes

### `src/features/folders/foldersSlice.ts`

Add `section: 'files' | 'assets'` to `IFolder`. No reducer changes — `addFolder` already accepts the full `IFolder` payload; callers supply the field.

### `src/components/FileTree/index.tsx`

**Selector** — add section filter with legacy default:
```ts
state.folders.items.filter(
  (f) => f.projectId === projectId && (f.section ?? 'files') === 'files'
)
```

**`addFolder` dispatch** — add `section: 'files'`:
```ts
dispatch(addFolder({ id: uuidv4(), name, projectId, parentId: ..., section: 'files' }));
```

### `src/components/TreePanel/AssetTree/index.tsx`

**Selector** — same pattern with `'assets'`:
```ts
state.folders.items.filter(
  (f) => f.projectId === projectId && (f.section ?? 'files') === 'assets'
)
```

**`addFolder` dispatch** — add `section: 'assets'`:
```ts
dispatch(addFolder({ id: uuidv4(), name, projectId, parentId: ..., section: 'assets' }));
```

### No changes needed

- `src/features/folders/folderThunks.ts` — cascade thunks operate on folder IDs and parent chains; section is irrelevant.
- `src/selectors/getFullName.ts` — walks the `parentId` chain only; section is irrelevant.
- `src/features/files/filesSlice.ts` / `src/features/assets/assetsSlice.ts` — store `folderId` references; section is a UI filter concern only.

---

## Migration

No reducer migration needed. Existing persisted folders without a `section` field default to `'files'` via the `?? 'files'` fallback in both selectors. Since only `FileTree` existed before this change, all pre-existing folders are file-section folders — the default is correct.

---

## Tests

Any test fixture that constructs a literal `IFolder` object needs `section` added. Affected test files:

- `tests/ui/features/folders/foldersSlice.test.ts` (if it exists)
- `tests/ui/features/folders/folderThunks.test.ts`
- Any other test that spreads or constructs `IFolder` directly

Cascade thunk behaviour is unaffected; only fixture objects need updating.

---

## Extensibility

The `section` field is a string union. Adding a third tree panel in the future requires only a new literal (e.g., `'scenes'`) — no structural changes to the slice or thunks.
