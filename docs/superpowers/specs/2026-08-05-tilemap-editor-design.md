# Visual Tilemap Editor Design

**Date:** 2026-08-05
**Status:** Approved

## Goal

Add a visual editor for authoring `.stm` files (the multi-layer tilemap format shipped in the `TileMapSet`/`TileMapLayer` runtime feature, see `docs/superpowers/specs/2026-08-05-tilemapset-design.md`): load a tileset image, paint tiles onto a per-layer grid, manage layers, and save back to the asset. This is sub-project B of two — it builds entirely on the `.stm` format and runtime classes already shipped; no further engine-level changes are needed.

## Background

`docs/roadmap.md` Milestone 12 ("Tilemap editor") calls for exactly this: load/save from assets, load a tileset image and auto-split it by tile width/height, paint/erase tiles onto a grid per layer, and manage layers. The prerequisite engine gap (multi-layer support) is already resolved.

---

## Entry Points

**Clicking a `.stm` file in the assets panel** opens it directly in the editor, as a tab — following the existing `AssetPreview` dispatch pattern:
- `src/components/AssetPreview/getAssetType.ts` gains a `.stm` → `'tilemap'` case.
- `src/components/AssetPreview/index.tsx`'s dispatcher gains a `tilemap → TileMapEditor` branch.
- No changes needed to tab open/close/dirty-tracking (`EditPage.tsx`, `FileTabs`) — that machinery is asset-id based, not type-specific.

**A new left-sidebar (activity bar) entry**, added to `EditPage.tsx`'s `activitySections` array with a new icon (e.g. `TilemapIcon`, following the `FilesIcon`/`ExportIcon` pattern in `ProjectShell/index.tsx`). Like the existing `export` section, it's an **action button** (`onAction`, no persistent panel): clicking it opens a modal with two choices:
- **"New Tilemap"** → opens the New Tilemap dialog (below).
- **"Open existing"** → lists the project's current `.stm` assets; picking one opens that asset's tab (same as clicking it in the tree).

### New Tilemap Dialog

A modal collecting:
- **Tileset image** — a combined picker: browse existing project image assets, *or* drag-and-drop a new image file directly onto the picker. Dropping a new file uploads it as a project asset first (reusing `AssetTree`'s existing upload logic), then selects it. One control, two ways to fill it.
- **Tile width**, **tile height**, **grid columns**, **grid rows** — four numeric fields.
- **Filename** — defaults to `untitled.stm`, editable.

On submit: creates a new `.stm` asset with the given metadata and one default layer named `"background"`, sized `rows × cols`, filled with `0`s (empty) — so there's immediately a grid to paint on. Opens it in the editor tab.

---

## Editor Layout

Three columns inside the `TileMapEditor` tab, reusing this app's existing `ds-surface`/`ds-border` design tokens (per `CLAUDE.md`) — no new visual language:

```
┌──────────┬─────────────────────┬───────────┐
│ Palette  │       Canvas        │  Layers   │
│  (left)  │      (center)       │  (right)  │
└──────────┴─────────────────────┴───────────┘
```

### Palette (left)

- Reads `tileWidth`, `tileHeight`, `tileImage` from the `.stm` file's top-level metadata — **one palette for the whole file**, shared by every layer (all layers in a `.stm` share one tileset — a sub-project A constraint).
- Slices the tileset image into a grid of thumbnails client-side: plain `<canvas>`/CSS `background-position` cropping, no PIXI in the editor (this is a React component, not runtime game code). The slicing order mirrors the engine's own row-major slicing (`src/components/Runner/engine/tilemap.js`'s `createTileMapSet`), so palette tile IDs line up exactly with what renders at runtime.
- Clicking a thumbnail selects it as the "current tile" (highlighted border).
- A separate **Eraser** tool button sits above the palette grid. Selecting it means paint strokes write `0` (empty) instead of a tile ID.

### Canvas (center)

- Renders the **active layer only**, as a grid of cells at `tileWidth × tileHeight`, scaled up for visibility (actual pixel dims like 8×8 are too small to click precisely — the editor applies a fixed minimum on-screen cell size, e.g. ~24px, regardless of source tile size).
- Cells show the sliced tile thumbnail when non-empty, or a checkerboard/empty pattern for `0`.
- A faint grid-line overlay.

**Painting interaction:**
- Mouse-down on a cell paints the selected tile (or erases, if Eraser is active) into that cell on the active layer.
- Drag while mouse is down paints every cell the cursor passes over (continuous paint) — tracked via pointer-move while a "painting" flag is set, cleared on mouse-up or the pointer leaving the canvas.
- Painting marks the tab dirty, matching `TextEditor`'s existing `onDirtyChange` pattern. No autosave.

### Layers (right)

- Lists layer names **in file order** — top of list = first/back layer, matching render order (`TileMapSet` renders `layers` object keys in insertion order, first key at the back).
- Click a layer name to make it **active** — canvas re-renders to show that layer's data; painting only ever writes to the active layer.
- **Reorderable** via drag-and-drop, reusing the same `@dnd-kit` drag-handle pattern `AssetTree` already uses for asset/file reordering. Reordering updates the in-memory layer order; Save writes the `.stm` file's `layers` object back out in the new key order.
- **Add layer**: prompts for a name, appends an all-`0` layer sized `rows × cols`.
- **Rename**: inline edit (double-click or an edit icon), mirroring `AssetTree`'s existing rename-in-place interaction.
- **Remove**: a delete icon per layer (hover-to-reveal, matching `AssetTree`'s existing pattern).

---

## Save / Load

**Save:** an explicit **Save** button (matching `TextEditor`'s convention) serializes the in-memory `{tileWidth, tileHeight, tileImage, layers}` object back to JSON and dispatches the same `updateAsset` action every other asset editor uses. No new persistence mechanism.

**Load (opening an existing `.stm`):** parses the file, builds the palette from its `tileImage`/`tileWidth`/`tileHeight`, populates the layers list in file order, selects the first layer as active, renders its grid.

---

## File Structure

- `src/components/TileMapEditor/index.tsx` — top-level component, wired into `AssetPreview/index.tsx`'s dispatcher. Owns the in-memory `.stm` document state (metadata + layers + active layer + dirty flag) and the Save action.
- `src/components/TileMapEditor/Palette.tsx` — tileset slicing, thumbnail grid, tile/eraser selection.
- `src/components/TileMapEditor/Canvas.tsx` — grid rendering for the active layer, paint/erase pointer handling.
- `src/components/TileMapEditor/LayersPanel.tsx` — layer list, active-layer selection, add/rename/remove/reorder.
- `src/components/TileMapEditor/NewTilemapDialog.tsx` — the "New Tilemap" modal (tileset picker + numeric fields + filename), invoked from the new sidebar action.
- `src/components/ProjectShell/` — new `TilemapIcon` and the sidebar action wiring (small addition to existing files, not a new file).

Each component has one clear responsibility and communicates through props/callbacks owned by `TileMapEditor/index.tsx` — no shared mutable state outside that owner, matching this project's "smaller, well-bounded units" convention.

---

## Testing

Component tests in `tests/ui/components/TileMapEditor/`, following the existing `AssetPreview.test.tsx`/`ImagePreview.test.tsx` pattern (React Testing Library + Vitest):
- New Tilemap dialog: field validation, submit creates the expected `.stm` asset shape, drag-drop image upload path.
- Palette: correct slicing/thumbnail count for a given tileset + tile dimensions, selection state, eraser toggle.
- Canvas: click and click-drag paint/erase write to the correct cell(s) of the active layer only; other layers unaffected.
- Layers panel: add/rename/remove/reorder update state correctly; active-layer switching re-renders the canvas from the right layer's data.
- Save: produces the exact `{tileWidth, tileHeight, tileImage, layers}` JSON shape, with layers keyed in current display order.

No Cypress e2e spec is needed — this is pure editor UI with no compiled softBASIC involved, unlike the tutorials/demos e2e suite's scope (which exercises the *runtime*, not the IDE's editors).

---

## Constraints & Non-Goals

- One tileset image per `.stm` file, shared by all layers — no per-layer tileset override (matches the runtime format).
- Map dimensions (`rows`/`cols`) are fixed at creation — no resize UI in this iteration (a later enhancement would need to pad/truncate every layer's array simultaneously).
- No undo/redo in this iteration (deferred, per the earlier sub-project A decision carried forward — the paint surface is the same kind of grid-editing interaction).
- No tile-property metadata (e.g. "this tile is solid") — out of scope; `.stm` stores tile IDs only, same as the bare-array format.
- No animated tiles.
