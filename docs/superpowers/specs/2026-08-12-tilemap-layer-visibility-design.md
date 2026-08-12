# Tilemap Editor: layer visibility toggling — design

## Problem

The Tilemap Editor renders exactly one layer at a time — switching the active layer swaps the entire canvas to that layer's grid, with no visual trace of any other layer. There's no way to see, for example, where the walls layer sits relative to the floor layer while painting spawn markers, or to compare two tile layers without repeatedly switching back and forth.

## Goal

While editing, see all visible layers composited together: the layer you're actively painting on at full opacity, every other visible layer dimmed underneath for reference, and a per-layer toggle to hide a layer from the view entirely.

## Design

### Behavior

- **Active layer:** full opacity, receives all paint interaction (unchanged from today).
- **Other visible layers:** rendered at **35% opacity**, purely for visual reference — not interactive, painting only ever affects the active layer.
- **Hidden layers:** not rendered at all. A new eye/hide toggle in the Layers panel controls this, independent of which layer is active.
- **Selecting a hidden layer as active auto-unhides it** — you can't end up painting on a layer you can't see.
- **Not persisted:** visibility is pure editor UI state, held in `TileMapEditor`'s own React state (keyed by `layer.key`, not index, so it survives layer reordering). It is **not** written to the `.stm` file — `types.ts`'s `StmDoc`/`EditorLayer`, `exportStmDoc`, and `encodeStmContent` are all unchanged. Every layer starts visible each time a tilemap is opened.

### Rendering approach

Today, `TileMapCanvas` (tile layers) and `MarkerCanvas` (marker layers) each own their own scrollable wrapper (`h-full overflow-auto p-2`) and render exactly one layer's grid. To composite multiple layers, both components are stripped down to **just the grid content** (the `role="grid"` element and its cells, sized to `cols*CELL_SIZE × rows*CELL_SIZE`, no outer scroll wrapper) — their existing props (`layerData`/`markers`, `slices`, `onPaintCell`) are unchanged, so this is a non-breaking trim for both components and their existing tests (which query cells directly, never assert on the outer wrapper).

`TileMapEditor` (`index.tsx`) gains one shared scroll container that used to live inside each canvas component. Inside it, a single relatively-positioned box sized from `gridRows`/`gridCols` holds one absolutely-positioned (`inset: 0`) wrapper per **visible** layer, stacked in layer order:

- The active layer's wrapper: `opacity: 1`, `pointerEvents: 'auto'`, wired to the real `handlePaintCell`.
- Every other visible layer's wrapper: `opacity: 0.35`, `pointerEvents: 'none'`, given a no-op paint handler (never actually invoked, since pointer events don't reach it).

Using `pointer-events: none` on every non-active layer means the active layer always receives mouse events regardless of DOM stacking order — no z-index bookkeeping needed to keep painting working as layers are reordered or added.

Both tile and marker layers composite together (per the approved design conversation) — a marker layer's colored tag chips render on top of/alongside dimmed tile art exactly like any other layer in the stack, so you can see where a spawn marker sits relative to walls.

### LayersPanel changes

Each layer row gets a new eye/hide-toggle button, alongside the existing drag/rename/remove controls. `LayersPanel` receives two new props: `hiddenKeys: Set<string>` (which layers are currently hidden) and `onToggleVisibility(index: number)`. Toggling calls back to `TileMapEditor`, which flips membership in its `hiddenLayerKeys` state.

Clicking a layer row's main area to make it active (`onSelect`) continues to work as today; `TileMapEditor`'s `onSelect` handler additionally removes that layer's key from `hiddenLayerKeys` if present, satisfying the auto-unhide requirement.

### Files touched

- `src/components/TileMapEditor/Canvas.tsx` — remove outer scroll wrapper, keep grid content only.
- `src/components/TileMapEditor/MarkerCanvas.tsx` — same trim.
- `src/components/TileMapEditor/index.tsx` — new `hiddenLayerKeys` state, `toggleLayerVisibility` handler, auto-unhide in the select handler, new shared scroll/stack container replacing the current single-canvas render.
- `src/components/TileMapEditor/LayersPanel.tsx` — new hide/eye toggle button per row, two new props.
- Tests: `tests/ui/components/TileMapEditor/Canvas.test.tsx`, `MarkerCanvas.test.tsx` (confirm trimmed components still pass unchanged), `LayersPanel.test.tsx` (new toggle button), `TileMapEditor.test.tsx` (composited rendering: dimmed layers present but non-interactive, hidden layers absent, auto-unhide on select).

### Non-goals

- No persistence of visibility state to the `.stm` file or project export.
- No configurable opacity value (fixed at 35%, matching the approved design conversation) — not exposed as a setting.
- No change to paint behavior itself — painting still only ever targets the active layer, exactly as today.
- No visibility toggle for anything other than layers (no per-tile or per-tag visibility).

## Testing

Unit/component tests only (existing convention for this component — no Cypress/e2e coverage, this is pure editor-UI behavior with no runtime/game-engine surface):

1. `Canvas.tsx`/`MarkerCanvas.tsx`: existing tests continue to pass unmodified (grid content and interaction behavior unchanged).
2. `LayersPanel.tsx`: clicking the hide toggle calls `onToggleVisibility` with the right index; the toggle's visual state reflects `hiddenKeys`.
3. `TileMapEditor.tsx` (integration): a non-active, visible layer renders in the DOM with reduced opacity and does not receive paint calls when clicked; a hidden layer's grid is absent from the DOM entirely; selecting a previously-hidden layer makes it active and removes it from the hidden set (it renders at full opacity, no longer dimmed); painting continues to affect only the active layer even with multiple layers composited on screen.
