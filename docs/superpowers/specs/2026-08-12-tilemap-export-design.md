# Tilemap Editor: export single `.stm` — design

## Problem

Updating a demo's tilemap (e.g. `demo-src/bullet-hell-shooter/assets/map1.stm`) currently requires exporting the *entire* project via `exportProject.ts` and manually pulling the one changed asset back out of the resulting `.b4wgl.json`. There's no way to grab just the tilemap you're editing.

## Goal

A one-click "Export" action in the Tilemap Editor that downloads the currently-open tilemap as a standalone `.stm` file, ready to drop straight into a `demo-src/<slug>/assets/` folder — no project-level export, no unwrapping needed.

## Design

**Location:** New "Export" button in `TileMapEditor`'s toolbar (`src/components/TileMapEditor/index.tsx`), next to the existing "Save" button.

**Source of truth:** The current in-editor `draftDoc` state — whatever's on screen, including unsaved paint strokes. Export does **not** require clicking Save first, and does not change `isDirty`/save state.

**Output format:** Plain JSON, matching exactly what's checked into `demo-src/<slug>/assets/*.stm` on disk (confirmed by inspecting `map1.stm`: `{"tileWidth":16,"tileHeight":16,"tileImage":"tilesheet.png","layers":{...}}`) — **not** the `data:application/json;base64,...` wrapper `IAsset.content` uses internally. Reuses the exact same layer-serialization shape `encodeStmContent` already builds, so a new `exportStmDoc(doc: StmDoc): string` helper is added alongside it (extracted so both functions share the `{tileWidth, tileHeight, tileImage, layers}` construction rather than duplicating it).

**Filename:** `asset.name` verbatim (e.g. `map1.stm`) — no prompt, no extension logic needed since asset names already carry their extension throughout this codebase.

**Download mechanism:** Same pattern already used by `exportProject.ts`'s `triggerDownload`: build a `Blob` (`type: 'application/json'`), `URL.createObjectURL`, a temporary `<a download>` element, click, then clean up (`removeChild` + `revokeObjectURL`). Not a call to the existing `triggerDownload` (which is typed specifically to `ProjectExportJson` and always JSON-stringifies with `null, 2` indentation — the `.stm` files on disk are unindented) — a small local helper in `TileMapEditor/index.tsx` instead, mirroring the same four-step pattern.

**Scope / non-goals:**
- Export only. No "import a `.stm` from disk" counterpart — editing already happens live in the app; the only missing piece is getting the result onto disk.
- No context-menu / file-tree entry point — toolbar button only, per user's choice.
- No change to `Save`'s behavior or `isDirty` tracking.

## Testing

Unit test (new or added to an existing `TileMapEditor` test file) asserting:
1. The exported string is valid plain JSON (not a `data:` URL — no `data:` prefix, no base64).
2. Round-tripping the exported string through `decodeStmContent` reproduces the same `StmDoc` shape (`tileWidth`, `tileHeight`, `tileImage`, and each layer's `name`/`kind`/`data`-or-`markers`) as the `draftDoc` it was exported from.

No Cypress/e2e coverage needed — this is a pure client-side file-download action with no runtime/game-engine surface.

## Out of scope

- Batch-exporting multiple tilemaps at once.
- Any change to how `demo-src/` assets get back into the app (still the existing `npm run build:demo` assembler).
