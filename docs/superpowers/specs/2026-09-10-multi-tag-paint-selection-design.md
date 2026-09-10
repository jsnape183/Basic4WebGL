# Multi-tag paint selection — design

**Date:** 2026-09-10
**Status:** Approved, ready for planning
**Scope:** In the Tilemap Editor's marker-layer **paint** mode, let the user select
several tags at once (click to toggle, click again to deselect) and stamp all of
them when painting a cell. The Select-tool / cell-inspector path is already
multi-tag and is not touched.

## Problem

Paint mode holds exactly one loaded tag (`selectedTag: string | null`, where
`null` is the eraser). To put two tags on a run of cells you paint the whole run
with tag A, reselect, then paint it all again with tag B. Painting already
*merges* a tag into whatever a cell holds, so the only missing piece is letting
more than one tag be "loaded" at once.

## Solution overview

Replace the single loaded tag with a set of loaded tags plus an explicit eraser
flag:

- Clicking a tag chip toggles it in/out of the loaded set.
- The **Eraser** is a separate, mutually-exclusive choice: selecting it clears
  the loaded set; selecting any tag clears the eraser.
- With nothing loaded and the eraser off, painting a marker cell does nothing.
- Painting with one or more tags loaded merges every loaded tag the cell does not
  already carry; tags already on the cell are kept.

No `.stm` format change. `selectedTags` / `eraserActive` are editor UI state,
never persisted.

## State (`src/components/TileMapEditor/index.tsx`)

Remove:
```ts
const [selectedTag, setSelectedTag] = useState<string | null>(null);
```
Add:
```ts
const [selectedTags, setSelectedTags] = useState<string[]>([]);
const [eraserActive, setEraserActive] = useState(false);
```

Default state is "neutral": no tags loaded, eraser off. (Today the eraser is the
implicit default because `selectedTag` starts `null`; making the user pick
explicitly is the point of this change.)

Handlers (replace `handleSelectPaintTag`). Uses the closure value of
`selectedTags`, matching the existing `handleToggleSelectedCellTag`:
```ts
const handleTogglePaintTag = (tag: string) => {
  setEraserActive(false);
  if (selectedTags.includes(tag)) {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  } else {
    registerTag(tag);
    setSelectedTags([...selectedTags, tag]);
  }
};

const handleSelectEraser = () => {
  setSelectedTags([]);
  setEraserActive(true);
};
```

`handleRemoveTag` (registry delete — unused tags only) also drops the tag from
the loaded set:
```ts
const handleRemoveTag = (tag: string) => {
  setDraftDoc((prev) => ({ ...prev, tags: (prev.tags ?? []).filter((t) => t !== tag) }));
  setSelectedTags((prev) => prev.filter((t) => t !== tag));
  setIsDirty(true);
};
```

`markerTags` union: `...(selectedTag ? [selectedTag] : [])` becomes
`...selectedTags`.

## Paint (`handlePaintCell`, marker branch)

Replace the current marker branch body:
```ts
} else {
  if (!eraserActive && selectedTags.length === 0) return;
  // tags are registered when toggled on; no need to re-register here
  setDraftDoc((prev) => ({
    ...prev,
    layers: prev.layers.map((l, i) => {
      if (i !== activeIndex || l.kind !== 'marker') return l;
      if (eraserActive) {
        return { ...l, markers: l.markers.filter((m) => !(m.row === row && m.col === col)) };
      }
      const onCell = new Set(
        l.markers.filter((m) => m.row === row && m.col === col).map((m) => m.tag)
      );
      const toAdd = selectedTags.filter((t) => !onCell.has(t));
      if (toAdd.length === 0) return l;
      return { ...l, markers: [...l.markers, ...toAdd.map((tag) => ({ row, col, tag }))] };
    }),
  }));
}
```
The `if (!eraserActive && selectedTags.length === 0) return;` early-returns from
`handlePaintCell` before the shared `setIsDirty(true)`, so a no-op paint does not
mark the doc dirty. Drag-paint (`usePaintDrag`) calls `handlePaintCell` per cell,
so the loaded set is applied to every dragged cell.

## `TagPicker` (`src/components/TileMapEditor/TagPicker.tsx`) — paint branch only

The `selectedTag` / `onSelectTag` props are used **only** by the paint branch
(select mode passes `cellTags` / `onToggleCellTag`; the editing-cell branch has
its own chips). Replace them:

```ts
// removed: selectedTag: string | null; onSelectTag: (tag: string | null) => void;
selectedTags?: string[];
eraserActive?: boolean;
onToggleTag?: (tag: string) => void;
onSelectEraser?: () => void;
```

Paint-branch render:
- Eraser `<button aria-label="Eraser" aria-pressed={eraserActive}>` → `onSelectEraser()`.
- Each tag chip's select `<button aria-label={`Tag ${tag}`} aria-pressed={selectedTags.includes(tag)}>` → `onToggleTag(tag)`.
- Pressed styling driven by `selectedTags.includes(tag)` instead of `selectedTag === tag`.
- New-tag input `commitNewTag` (paint path): `onToggleTag(trimmed)` — but only when
  `!selectedTags.includes(trimmed)` so Enter always *adds*, never toggles off.
- The remove-`×` affordance for unused tags is unchanged.

`index.tsx` wires:
```tsx
<TagPicker
  tags={markerTags}
  selectedTags={selectedTags}
  eraserActive={eraserActive}
  onToggleTag={handleTogglePaintTag}
  onSelectEraser={handleSelectEraser}
  tagsInUse={Array.from(tagsInUse)}
  onRemoveTag={handleRemoveTag}
  selectMode={markerSelectMode}
  onToggleSelectMode={() => setMarkerSelectMode((v) => !v)}
  selectedCell={selectedCell}
  cellTags={selectedCellTags}
  onToggleCellTag={handleToggleSelectedCellTag}
  onClearCell={handleClearSelectedCell}
  onDeselectCell={() => setSelectedCell(null)}
/>
```

## Testing

`tests/ui/components/TileMapEditor/TagPicker.test.tsx` — rewrite the paint-mode
tests for the new props:
- Renders a chip per tag (unchanged).
- Clicking a chip calls `onToggleTag` with that tag.
- Two chips can both be `aria-pressed` at once (render with `selectedTags={['a','b']}`).
- Eraser is `aria-pressed` when `eraserActive`, and not when tags are loaded.
- New tag name + Enter calls `onToggleTag` with the typed name.
- Enter with an empty input calls nothing.

`tests/ui/components/TileMapEditor/TileMapEditor.test.tsx` — add to the marker
describe block:
- Select two tags (type `spawn{Enter}`, type `enemy{Enter}`), paint one cell,
  Save → `markers` has both `{row,col,tag:'spawn'}` and `{...tag:'enemy'}`.
- After the above, click the `spawn` chip to deselect it, paint a second cell →
  only `enemy` lands on the second cell; the first cell still has both.
- Click `Eraser`, paint a painted cell → that cell's markers are gone; the tag
  chips remain (registry).
- With nothing selected and eraser off (fresh marker layer), `mouseDown` on a
  cell does not set the doc dirty (`onDirtyChange` not called with `('m1', true)`).

Existing marker tests that type one tag then paint keep passing: typing
`spawn{Enter}` loads `['spawn']`, painting merges it — same saved result.

## Docs & release

Editor-only, no softBASIC surface, no `.stm` change → no API/Language-Guide
update. On push: `src/docs/release-notes.md` entry + patch version bump.

## Out of scope

- Multi-tag selection in the Select tool (already multi-tag per cell there).
- Reordering / prioritising the loaded set.
- Persisting the loaded set across sessions.
