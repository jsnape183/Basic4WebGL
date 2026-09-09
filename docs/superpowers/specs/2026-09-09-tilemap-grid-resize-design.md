# Tilemap grid resize — design

**Date:** 2026-09-09
**Status:** Approved, ready for planning
**Scope:** Change a tilemap's grid dimensions (rows × columns) from inside the
Tilemap Editor. Tile *pixel* size (`tileWidth`/`tileHeight`) is explicitly out
of scope for this iteration.

## Problem

Grid dimensions are fixed at creation time in `NewTilemapDialog` and are never
editable afterwards. The editor derives the grid size implicitly from the first
tile layer's array shape (`gridRows = firstTileLayer.data.length`,
`gridCols = firstTileLayer.data[0].length`) and assumes every layer shares that
size. A level in progress that needs more (or less) room has no path forward
short of hand-editing the `.stm` JSON.

## Solution overview

A **Resize** button in the editor toolbar opens a small modal dialog. The user
enters the **new total** rows and columns (prefilled with the current size).
Larger pads empty cells at the bottom/right; smaller trims from the bottom/right.
Content is **top-left anchored** — cell (0,0) never moves. If applying would
discard non-empty content, the dialog shows a one-line confirmation before
committing (there is no undo yet).

No `.stm` file-format change: dimensions remain implicit in each dense layer's
array shape.

## UX flow

- **Resize button**: in the editor toolbar next to Export / Save. Enabled only
  when the tilemap has at least one **tile** layer (that is what defines the
  grid; `NewTilemapDialog` always creates a `background` tile layer). When
  disabled, a `title` tooltip explains why ("Add a tile layer to resize").
- **Dialog** (portal + backdrop, same pattern as `TilemapChooserModal`):
  - Two number inputs, `Rows` and `Columns`, `min=1`, integer-only, prefilled
    with the current `gridRows` / `gridCols`.
  - **Apply** is disabled when both values equal the current size (no-op).
  - **Apply** with no non-empty loss → applies immediately, dialog closes.
  - **Apply** that would trim non-empty tiles / collision cells / markers →
    dialog swaps to a confirm step. The sentence lists only the non-zero
    categories, e.g. "This removes 4 painted tiles and 1 marker. Continue?" or
    "This removes 3 collision cells. Continue?" — with **Confirm** and **Back**.
    Confirm applies and closes; Back returns to the form.
  - **Cancel** / backdrop click / Escape closes with no change.

## Data model & pure helper

New file: `src/components/TileMapEditor/resize.ts`. Pure, no React.

```ts
/** Reshape a dense grid to rows x cols, copying the top-left overlap and
 *  padding new cells with 0. */
export function resizeGrid(data: number[][], rows: number, cols: number): number[][];

/** Reshape every layer of a doc to the new grid size. Tile and collision
 *  layers go through resizeGrid; marker layers drop any marker whose row or
 *  col falls outside the new bounds. tags registry and all other fields are
 *  untouched. */
export function resizeStmDoc(doc: StmDoc, rows: number, cols: number): StmDoc;

/** Count what a resize to rows x cols would discard, for the confirm step. */
export function describeResizeLoss(
  doc: StmDoc,
  rows: number,
  cols: number,
): { tiles: number; collisionCells: number; markers: number };
```

- `resizeGrid`: builds a fresh `rows × cols` array; for `r < min(oldRows, rows)`
  and `c < min(oldCols, cols)` copies `data[r][c]`; every other cell is `0`.
  Top-left anchoring is a direct consequence of copying from index (0,0).
- `resizeStmDoc`: `{ ...doc, layers: doc.layers.map(...) }`.
  - `kind: 'tile'` → `{ ...l, data: resizeGrid(l.data, rows, cols) }`
  - `kind: 'collision'` → `{ ...l, data: resizeGrid(l.data, rows, cols) }`
  - `kind: 'marker'` → `{ ...l, markers: l.markers.filter(m => m.row < rows && m.col < cols) }`
- `describeResizeLoss`:
  - `tiles`: count of cells across all tile layers with a non-zero value at
    `row >= rows || col >= cols`.
  - `collisionCells`: same for collision layers.
  - `markers`: count of markers across all marker layers with
    `row >= rows || col >= cols`.
  - Growing in both dimensions always yields `{ 0, 0, 0 }`.

## Editor wiring & edge cases

`src/components/TileMapEditor/index.tsx`:

- New state: `const [showResize, setShowResize] = useState(false);`
- `handleResize(rows: number, cols: number)`:
  - `setDraftDoc(prev => resizeStmDoc(prev, rows, cols))`
  - `setIsDirty(true)`
  - `setSelectedCell(prev => prev && (prev.row >= rows || prev.col >= cols) ? null : prev)`
  - `setHoverCell(null)`
  - `setShowResize(false)`
- Toolbar: `Resize` button, `disabled={!firstTileLayer}`.
- Render `<ResizeTilemapDialog>` when `showResize`.

`src/components/TileMapEditor/ResizeTilemapDialog.tsx`:

- Portal to `document.body` with a `bg-black/60` backdrop; `role="dialog"`,
  `aria-modal="true"`, `aria-label="Resize tilemap"`. Backdrop click and Escape
  call `onCancel`.
- Props:
  ```ts
  type Props = {
    currentRows: number;
    currentCols: number;
    describeLoss: (rows: number, cols: number) => { tiles: number; collisionCells: number; markers: number };
    onApply: (rows: number, cols: number) => void;
    onCancel: () => void;
  };
  ```
- Internal state: `rows`, `cols` (numbers, seeded from props), `step: 'form' | 'confirm'`.
- Input parsing clamps to `Math.max(1, Math.floor(n || 1))`, matching
  `NewTilemapDialog`'s `min={1}` fields.
- `unchanged = rows === currentRows && cols === currentCols` → Apply disabled.
- On Apply: compute `loss = describeLoss(rows, cols)`; if
  `loss.tiles + loss.collisionCells + loss.markers > 0` → `setStep('confirm')`,
  else `onApply(rows, cols)`.
- Confirm step renders the sentence from `loss` and Confirm → `onApply(rows, cols)`,
  Back → `setStep('form')`.

### Edge cases

- **No tile layer**: Resize button disabled. (A tilemap can technically be
  marker-only; that path is already degenerate today — `gridRows/gridCols`
  fall back to 1 — and is not worth special-casing here.)
- **Same size**: Apply disabled; nothing happens.
- **Non-integer / zero / negative input**: clamped to `>= 1` integer on entry.
- **Collision layers** are reshaped alongside tile layers so all dense layers
  stay the same size (the editor's shared-grid assumption holds).
- **`selectedCell` / `hoverCell`** pointing outside the new bounds are cleared.

## Testing

`tests/ui/components/TileMapEditor/resize.test.ts` (unit, pure):

- `resizeGrid`: grow rows only pads new rows with 0; grow cols only pads new
  cols with 0; grow both; shrink rows trims from the bottom; shrink cols trims
  from the right; top-left values preserved in every case; shrink-then-grow does
  not resurrect trimmed values; 1×1 ↔ larger.
- `resizeStmDoc`: tile + collision + marker doc → all dense layers reshaped to
  the new size; markers outside new bounds dropped, markers inside kept; `tags`,
  `tileWidth`, `tileHeight`, `tileImage`, layer `key`/`name`/`kind` preserved;
  resizing to the current size returns an equivalent doc.
- `describeResizeLoss`: pure-grow → `{0,0,0}`; shrink over non-zero tiles counts
  them; zero (empty) tiles outside bounds are **not** counted; collision cells
  and markers counted independently; a marker exactly on the new edge
  (`row === rows`) is counted as lost.

`tests/ui/components/TileMapEditor/TileMapEditor.test.tsx` (integration):

- Resize button present; disabled when the doc has no tile layer.
- Clicking it opens a dialog with `Rows` / `Columns` prefilled to the current
  size.
- Growing: after Apply, `Row 0, Column <newMax>` is addressable on the canvas;
  Save writes arrays of the new shape (assert via `readSavedStm`).
- Shrinking with a painted tile / marker outside the new bounds shows the
  confirm step with the right counts; **Confirm** applies and Save reflects it;
  **Back** then **Cancel** leaves the doc unchanged.
- Shrinking that only drops empty cells applies with no confirm step.

## Docs & release

- Editor-only feature; no softBASIC API surface, no `.stm` format change → no
  API-reference or Language-Guide update.
- On push: add a `src/docs/release-notes.md` entry and bump `package.json`
  (patch). Not tracked on `docs/roadmap.md`; optionally add a one-line note
  there under tilemap-editor work.

## Out of scope (possible follow-ups)

- Dragging the grid's bottom/right edge to resize live (Approach B).
- Choosing an anchor other than top-left (per-edge deltas / 9-point).
- Changing tile pixel size (`tileWidth`/`tileHeight`) in-editor.
- Undo/redo for the editor generally (would relax the need for the confirm step).
