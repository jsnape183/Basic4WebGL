# Asset Preview & Text Editor Design

**Date:** 2026-06-09
**Status:** Approved

## Goal

Allow assets to be previewed and edited directly in the IDE: double-clicking an asset opens it in an editor tab (image viewer for images, textarea editor for text/JSON); text assets can be edited and saved back to local storage; new blank text files can be created from the asset panel.

---

## Supported Interactions

| Action | Result |
|--------|--------|
| Double-click an image asset | Opens image viewer tab |
| Double-click a text/JSON asset | Opens text editor tab |
| Double-click an already-open asset | Focuses existing tab (no duplicate) |
| Click "New file" in asset panel header | Name modal → blank text editor tab |
| Edit text in editor tab | Draft state — not saved yet |
| Click Save in text editor tab | Writes encoded content to Redux → localStorage |
| Close tab with unsaved changes | Confirm prompt ("Discard unsaved changes?") |
| Close tab with no unsaved changes | Tab closes immediately |

---

## File Type Routing

Detection is extension-based via a `getAssetType(name: string): 'image' | 'text'` helper.

**Image extensions:** `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`

**Text (everything else):** `.json`, `.txt`, `.csv`, `.xml`, `.bas`, unknown/no extension — all → text editor.

---

## Architecture

### Tab State

Open asset tabs are tracked in **local React state** inside `FileTabs` (not Redux). This keeps UI concerns out of the data store. An array of descriptors `Array<{ assetId: string }>` sits alongside the existing code file tabs.

Redux is only touched for data operations:
- `updateAsset` — save edited text content
- `addAsset` — create a new text file

### Content Encoding

Assets are stored as base64 data URLs (existing format from `FileReader.readAsDataURL`).

- **Display:** decode on mount — `atob(content.split(',')[1])`
- **Save:** re-encode — `'data:text/plain;base64,' + btoa(editedText)`
- **New file:** initial content — `'data:text/plain;base64,'` (empty string encoded)

---

## Components

### New Files

| File | Responsibility |
|------|---------------|
| `src/components/AssetPreview/index.tsx` | Wrapper — calls `getAssetType`, renders `ImagePreview` or `TextEditor` |
| `src/components/AssetPreview/ImagePreview.tsx` | Renders `<img src={asset.content} />` centred in tab; shows error message on load failure |
| `src/components/AssetPreview/TextEditor.tsx` | Textarea + Save button; manages local draft state; dispatches `updateAsset` on save |
| `src/components/AssetPreview/getAssetType.ts` | Pure helper — maps filename extension to `'image' \| 'text'` |

### Modified Files

| File | Change |
|------|--------|
| `src/components/FileTabs/index.tsx` | Add asset tab type to local state + render `AssetPreview` for asset tabs |
| `src/components/TreePanel/AssetTree/index.tsx` | Add double-click handler on assets; add "New file" button to panel header |

---

## New File Creation Flow

1. User clicks **"New file"** button in the `AssetTree` panel header
2. Name modal opens (same visual pattern as existing rename modal)
3. Input validation (confirm button disabled while invalid):
   - Empty name → disabled
   - Name already exists in **the same folder** (same `folderId`) → inline error, disabled
   - Same name in a *different* folder → allowed
4. On confirm:
   - Dispatch `addAsset({ name, content: 'data:text/plain;base64,', folderId: currentFolderId, projectId })`
   - Open editor tab for the new asset

---

## Save Flow

- `TextEditor` holds a local `draftText` state string, decoded from `asset.content` on mount
- Tab title shows a `•` unsaved indicator when `draftText !== decoded(asset.content)`
- Clicking **Save** dispatches `updateAsset({ ...asset, content: 'data:text/plain;base64,' + btoa(draftText) })`
- Redux-persist handles localStorage sync automatically (no additional wiring needed)
- Closing a tab with unsaved changes shows a confirm prompt ("Discard unsaved changes?"); confirmed close discards draft without saving

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Empty filename in modal | Confirm button disabled |
| Duplicate name in same folder | Inline error below input; confirm disabled |
| Duplicate name in different folder | Allowed — no error |
| Image fails to load | "Unable to display image" message in tab body |
| Save (Redux dispatch) | In-memory operation — cannot fail under normal conditions |

---

## Tests

**File:** `tests/lib/Basic4WebGL/unit/components/AssetPreview/getAssetType.test.ts`

### `getAssetType` helper

1. `.png` → `'image'`
2. `.jpg` → `'image'`
3. `.jpeg` → `'image'`
4. `.gif` → `'image'`
5. `.webp` → `'image'`
6. `.svg` → `'image'`
7. `.bmp` → `'image'`
8. `.json` → `'text'`
9. `.txt` → `'text'`
10. `.csv` → `'text'`
11. `.bas` → `'text'`
12. No extension → `'text'`
13. Unknown extension → `'text'`
14. Extension is case-insensitive (`.PNG` → `'image'`)

### `TextEditor` component

15. Renders decoded asset content in textarea on mount
16. Marks tab as unsaved (shows `•`) when textarea content changes
17. Does not show unsaved indicator on initial render
18. Clicking Save dispatches `updateAsset` with correctly base64-encoded content
19. After save, unsaved indicator clears

### Name modal — filename validation

20. Confirm button is disabled when input is empty
21. Confirm button is disabled when a file with the same name exists in the **same folder** (`folderId` matches)
22. Confirm button is **enabled** when a file with the same name exists in a **different folder** (`folderId` differs)
23. Inline error message shown for same-folder duplicate
24. No error shown for different-folder name collision
25. Confirm button is enabled for a unique name in the current folder

### Tab deduplication

26. Double-clicking an asset that is not open creates a new tab
27. Double-clicking an asset that is already open focuses the existing tab without creating a duplicate

---

## Non-Goals

- Monaco editor for text assets (plain textarea is sufficient)
- Syntax highlighting in the text editor
- Auto-save on every keystroke
- Persisting open tab state across page reloads
- Editing image assets
- Renaming an asset from the editor tab
