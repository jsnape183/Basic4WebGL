# Delete an in-use tag — design

**Date:** 2026-09-11
**Status:** Approved, ready for planning
**Scope:** Extend the tilemap editor's tag-registry delete (×) to work on tags
that are still used by markers, with an explicit choice about whether to also
strip those markers. Paint-palette only — the per-cell "remove tag from this
cell" affordance in the Select tool's cell inspector is untouched.

## Problem

The registry delete (×) added in v0.7.7 only appears for tags with zero
markers using them. A typo'd tag that got painted even once becomes permanent:
there's no way to find every cell carrying it (short of clicking around the
whole grid) or to remove it in one action.

## Solution overview

The × becomes available on **every** registered tag. Clicking it:

- **Unused tag** → deleted immediately, exactly as today. No dialog.
- **In-use tag** → opens a confirm dialog naming how many markers/layers carry
  it, with three choices:
  - **Cancel** — closes, nothing changes.
  - **Delete from list only** — removes the tag from the registry (it stops
    being offered to paint with) but leaves every existing marker that carries
    it untouched. Those cells remain fully manageable via the Select tool's
    cell inspector, which reads a cell's tags directly from its markers, not
    the registry.
  - **Remove everywhere** — removes the tag from the registry **and** strips
    it from every marker, on every marker layer, that carries it.

## A required side-effect: the palette must stop resurrecting a removed tag

Today `markerTags` (what the paint palette offers) is
`registry ∪ tagsInUse ∪ loadedTags` — the `tagsInUse` term exists as a
fallback for a legacy `.stm` file whose markers reference a tag `decodeStmText`
hadn't registered yet. Since v0.7.7, `decodeStmText` already seeds the registry
from every tag found on markers at load time, and every code path that adds a
tag to a cell calls `registerTag` first — so outside of a deliberate registry
removal, "in use" and "in the registry" are always in sync. **"Delete from
list only" is deliberately the one case that breaks that sync on purpose**, so
`tagsInUse` must be dropped from the `markerTags` union — otherwise the tag
would reappear in the palette immediately because cells still carry it.

`markerTags` becomes `registry ∪ loadedTags` (the `tagsInUse` set stays around
in `index.tsx`, just for computing whether a delete is destructive and for the
confirm dialog's counts).

## Components

### `TagPicker.tsx` (paint branch only)

- Drop the `removable = !!onRemoveTag && !tagsInUse.includes(tag)` gate — the
  × shows for any tag whenever `onRemoveTag` is provided, in use or not.
- Drop the `tagsInUse` prop (no longer read by this component — the in-use
  decision now happens in `index.tsx`, which already owns that computation).
- Tooltip text changes from "Unused — delete from tilemap" to
  "Delete tag from tilemap" (it's no longer unused-only).
- `aria-label` stays `Delete tag ${tag} from tilemap`.

### New `DeleteTagDialog.tsx`

Same portal + backdrop pattern as `ResizeTilemapDialog` (`ReactDOM.createPortal`
into `document.body`, `fixed inset-0 bg-black/60` backdrop closing on
backdrop-click, `role="dialog" aria-modal="true"`, Escape closes). Props:

```ts
type Props = {
  tag: string;
  markerCount: number;
  layerCount: number;
  onCancel: () => void;
  onDeleteFromListOnly: () => void;
  onRemoveEverywhere: () => void;
};
```

Body copy: `"<tag>" is used on {markerCount} marker{s} across {layerCount}
layer{s}.` Three buttons in this order: **Cancel** (neutral), **Delete from
list only**, **Remove everywhere** (styled like the resize dialog's destructive
Confirm — bordered `ds-error`).

### `index.tsx`

- New state: `const [pendingDeleteTag, setPendingDeleteTag] = useState<string | null>(null);` — reset to `null` in the asset-load effect alongside the other per-asset resets.
- `tagsInUse` (existing `Set<string>`, computed from `draftDoc.layers`) is now also used to decide whether a delete is destructive.
- `deleteTagFromRegistry(tag)` — the current body of `handleRemoveTag`, unchanged (removes from `draftDoc.tags`, drops it from `selectedTags`, marks dirty). Renamed since it's now an internal step rather than the direct click handler.
- `handleRemoveTagClick(tag)` (replaces `handleRemoveTag` as the prop passed to `TagPicker`): if `tagsInUse.has(tag)` → `setPendingDeleteTag(tag)`; else → `deleteTagFromRegistry(tag)` directly (no dialog — unused path is unchanged from the user's perspective).
- `handleCancelDeleteTag()` → `setPendingDeleteTag(null)`.
- `handleDeleteTagFromListOnly()` → `deleteTagFromRegistry(pendingDeleteTag)`, then `setPendingDeleteTag(null)`.
- `handleRemoveTagEverywhere()` → one `setDraftDoc` that both filters `tags` and maps every marker layer's `markers` to drop entries whose `tag === pendingDeleteTag`; also drops it from `selectedTags`; `setIsDirty(true)`; `setPendingDeleteTag(null)`.
- `markerTags`: drop the `...tagsInUse` spread (see above).
- Render `<DeleteTagDialog>` when `pendingDeleteTag` is set, with `markerCount`/`layerCount` computed from `draftDoc.layers` for that tag right before render (cheap — tilemaps are small grids).
- `<TagPicker>` wiring: `onRemoveTag={handleRemoveTagClick}`, drop the `tagsInUse={...}` prop.

## Testing (high level — exact tests specified in the plan)

- `TagPicker.test.tsx`: × is now offered for a tag passed with no
  `tagsInUse`-style restriction (prop removed); clicking it always calls
  `onRemoveTag`.
- `DeleteTagDialog.test.tsx`: renders the count sentence; Cancel/Escape/backdrop
  call `onCancel`; the two action buttons call the right callback.
- `TileMapEditor.test.tsx`:
  - Deleting an unused tag still has no dialog (regression — existing
    behavior).
  - Deleting an in-use tag opens the confirm dialog with the right counts.
  - "Delete from list only": tag disappears from the palette; the marker(s)
    that had it are unchanged on Save.
  - "Remove everywhere": tag disappears from the palette **and** every marker
    that had it is gone on Save (across multiple marker layers, to prove the
    "every layer" part).
  - Cancel: dialog closes, nothing changes, doc not marked dirty by the
    click itself.

## Docs & release

Editor-only, no `.stm` format change, no softBASIC surface → no API/Language
Guide update. Release-notes entry + patch version bump on push.

## Out of scope

- Renaming a tag (editing every marker's tag value in place while keeping it
  one operation) — a separate, cleaner fix for the "typo" case, not requested
  here.
- Any change to the per-cell "remove tag from this cell" chips in the Select
  tool's cell inspector.
- Undo for this action (the editor has no undo anywhere yet).
