# Tilemap Markers Design

**Date:** 2026-08-10
**Status:** Approved

## Goal

Add tagged position markers to `TileMapSet`: a way to paint free-text-tagged points onto specific cells of a tilemap in the visual Tilemap Editor, persist them in the `.stm` file format, and query them by tag at runtime from softBASIC (`tileMapSet.markersByTag(tag)` → an array of world-space positions). This unblocks the upcoming bullet-hell shooter demo's mob-spawn-point and weapon-pickup-point authoring — level design for those stays entirely in the tilemap editor, rather than mixing in hardcoded coordinates in `.bas` files. This spec covers only the marker system itself; the shooter demo is a separate, later spec that consumes it once it ships.

## Background

`TileMapSet`/`TileMapLayer` (shipped `2026-08-05`, see `docs/superpowers/specs/2026-08-05-tilemapset-design.md`) and the visual Tilemap Editor (Milestone 12, shipped as `v0.6.0`) both deliberately scoped out tile-level metadata: the tilemapset spec's non-goals list says "`.stm` stores tile IDs only," and the editor spec's non-goals says the same for "tile-property metadata... out of scope for this iteration." This spec is a deliberate, scoped extension of that stated non-goal — not reopening it casually — driven by a concrete need: the shooter demo wants to author mob-spawn and weapon-pickup locations visually, per level, the same way tile art is already authored, rather than scanning tile IDs by convention (as the never-built COMPOUND demo spec originally proposed) or hardcoding coordinates in game code (as every existing demo's enemy/item placement does today).

`TileMapEditor` (`src/components/TileMapEditor/index.tsx` + `Canvas.tsx`/`Palette.tsx`/`LayersPanel.tsx`) currently has no precedent for rendering anything on the tile grid besides a tile's background-image thumbnail plus a CSS border/hover-ring — no overlay/annotation layer exists today. The `.stm` format has no dedicated TypeScript type; `StmDoc`/`EditorLayer` are defined inline in `index.tsx`, and every `layers` entry is currently assumed to be a bare 2D tile-ID array. The engine's `createTileMapSet` (`src/components/Runner/engine/tilemap.js`) treats every layer identically: an unconditional sprite-placement loop over the 2D array.

---

## Data model — `.stm` format

Additive and fully backward-compatible. A `layers` entry's value is currently always a bare 2D array (a tile layer). A marker layer is a new, distinct shape:

```json
{
  "tileWidth": 32,
  "tileHeight": 32,
  "tileImage": "tileset.png",
  "layers": {
    "background": [[0, 0, 1, 2], [3, 0, 4, 0]],
    "spawns": {
      "type": "markers",
      "markers": [
        { "row": 2, "col": 5, "tag": "spawn" },
        { "row": 6, "col": 1, "tag": "pickup" }
      ]
    }
  }
}
```

- **Discrimination**: `Array.isArray(value)` → existing tile-layer path (zero changes to that code path, zero migration needed for any existing `.stm` file). `value.type === "markers"` → new marker-layer path.
- **One marker per cell, per marker layer.** Placing a new marker on an already-marked cell replaces the old one. A level author who wants two independent marker "categories" that can coexist on the same cell creates two separate marker layers (each independently enforces its own one-per-cell rule) — this is a deliberate simplicity choice, not a limitation the system tries to prevent working around.
- **`tag` is a free-text string**, author-chosen, with no reserved vocabulary. Compound meanings (e.g. `"spawn_boss"` vs `"spawn"`) are the level author's convention to define, not something the format encodes structurally.
- **A file can mix any number of tile layers and marker layers**, in any order, in the same `layers` object. Key order still defines z-order for rendering purposes (tile layers only — marker layers don't render, so their position in the order only matters for the editor's Layers panel display).

---

## Editor UI (`src/components/TileMapEditor/`)

### Layers panel

A marker layer is a new layer *kind*, shown in the existing `LayersPanel.tsx` list alongside tile layers — same add/rename/remove/reorder UI (`@dnd-kit` drag-handle reordering, inline double-click rename, hover-reveal remove), no new panel built from scratch. "Add layer" gains a kind picker (tile vs. marker) at creation time; a layer's kind is fixed once created (no converting a tile layer to a marker layer or vice versa).

In-memory, `EditorLayer` becomes a discriminated union:

```ts
type EditorLayer =
  | { key: string; name: string; kind: 'tile'; data: number[][] }
  | { key: string; name: string; kind: 'marker'; markers: { row: number; col: number; tag: string }[] };
```

### Sidebar (palette → tag picker)

When the active layer is a marker layer, the sidebar that normally shows the tile `Palette` shows a **tag chip list** instead: one chip per tag already used in this marker layer, plus a text input to type a new tag name (Enter adds it as a new chip and selects it). Clicking a chip selects it as the "loaded" tag to paint with, matching how selecting a tile currently works (`selectedTile` state) — a `selectedTag: string | null` replaces it when a marker layer is active. Eraser behaves identically to today (clears the cell instead of placing).

### Canvas rendering

A marker's visual treatment is a **full-cell color tint**, colored per-tag (a simple hash-to-color or an assigned palette, exact scheme left to implementation), with the tag's first letter centered in the cell. Only the *active* layer's markers render on the canvas — same rule as tile layers today, where only the active layer is paintable/visible-as-editable; switching the active layer swaps what's shown, consistent with the existing single-active-layer editing model. Because of that swap (not a composite), there is no tile art underneath a marker cell to show through — the marker canvas fully replaces the tile canvas while a marker layer is active, the same way switching between two tile layers replaces one tile view with another rather than blending them. (An earlier draft of this section described the tint as "semi-transparent... tile art stays faintly visible through it," carried over from the original visual mockup, which illustrated the tint concept composited over tile art for comparison purposes only — that framing predates the swap-based architecture finalized later in this same design and was never actually correct once the single-active-layer model was settled. Corrected here, opaque tint, no transparency requirement.)

Hovering an existing marker (on any layer, active or not — TBD at implementation time whether inactive-layer markers should be dimly visible for context, or fully hidden matching tile layers' current behavior; default to matching tile layers' current behavior — fully hidden — for consistency, revisit only if it proves confusing in practice) shows its tag in a tooltip.

---

## Engine implementation

### `src/components/Runner/engine/tilemap.js`

`createTileMapSet(stmPath)`'s per-layer loop gets a branch: for a layer whose value is `Array.isArray`, do exactly what it does today (unchanged). For a layer whose value has `type === 'markers'`, skip the sprite-placement loop entirely (no `PIXI.Container` child sprites — markers are never rendered) and instead accumulate its `markers` array into a new handle-level structure, `handle._markers` — a flat array of `{ row, col, tag }` across *all* marker layers in the set (not partitioned by layer name, since queries search by tag across the whole set, not by layer).

New engine function, `markersByTag(setHandle, tag)`:
- Filters `setHandle._markers` for entries where `tag` matches.
- Converts each match's `(row, col)` to a world-space cell-center position, reusing the exact same ancestor-offset-walking technique `tileAt`/`pathfinding.js`'s `_gridOffset` already use (walk `handle.parent` up to, but excluding, `worldContainer`/`hudContainer`, summing `.x`/`.y`) — so if the `TileMapSet`'s own `.transform` moves the whole map, marker positions returned by this query move with it, exactly like `tileAt` already guarantees for tile lookups.
- Returns an array of `{ x, y }` plain objects (the softBASIC layer wraps these into `Marker` instances — see below).

### `src/lib/Basic4WebGL/defs/`

New lightweight result class, `Marker` (mirrors `RayHit`'s existing pattern for "array of struct-like results" from a query function):

```bas
Class
dim x
dim y
EndClass
```

New method on `TileMapSet` (`tilemapset.bas`):

```bas
function markersByTag(tag)
    return call("_sb.markersByTag(this._handle, markersbytag_tag)")
endfunction
```

```bas
dim spawnPoints = tileMapSet.markersByTag("spawn")
dim i
for i = 0 to array.arrLength(spawnPoints) - 1
  dim m as Marker
  m = spawnPoints(i)
  ' m.x, m.y are world-space pixel positions
next i
```

---

## Testing

- **Engine unit tests** (`tests/components/Runner/tilemap.test.ts`): marker-layer parsing (a file mixing tile and marker layers parses correctly; an old file with only bare-array tile layers is completely unaffected — explicit backward-compatibility regression coverage); `markersByTag` returns correct positions for single and multiple matches, returns an empty array for an unmatched tag, and correctly accounts for ancestor transform offset (mirroring the existing `tileAt` offset tests).
- **Transpiler tests** (`tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts` or a new file): `markersByTag(tag)` compiles and emits the correct `_sb.markersByTag(` call shape; `Marker`'s `x`/`y` field access compiles.
- **Editor tests**: following whatever test pattern already covers `TileMapEditor`'s existing components (to be confirmed against the actual test files at implementation time — this spec doesn't assume a specific harness that hasn't been verified to exist).
- **No Cypress e2e spec** in this iteration — same reasoning as `pathfinding`: no published demo exercises marker painting/querying yet. Coverage lands with the shooter demo's own `demos.cy.ts` entry once that ships.

---

## Docs

- New `## markersByTag(tag)` section on the `tilemapset` API reference page (`src/docs/api-reference/tilemapset.md`), following the project's standard per-function doc structure (description, parameter table, `**Returns:**` line, `.bas` example using a game-like scenario).
- New `Marker` class doc entry (its own small API reference page, or a subsection of `tilemapset.md` — exact placement decided at implementation time, mirroring however `RayHit` is currently documented).
- A short "placing markers" section added wherever the Tilemap Editor is documented for end users (exact page to be located at implementation time).

## Roadmap sync

- `docs/language/library-roadmap.md`: new entry in the module table (`TileMapSet` row gains `markersByTag(tag)`) and a new dated `P`-numbered write-up under `## Priorities`.
- `docs/roadmap.md`: a new bullet under "Current state," matching how `pathfinding` and other recent library additions are logged there. Also explicitly note this as a deliberate, scoped re-opening of the tile-metadata non-goal recorded when `TileMapSet`/the tilemap editor originally shipped (Milestone 12) — not a silent scope change.
- `src/docs/roadmap.md` (public-facing): checked for any claim needing an update; likely none needed, matching how comparable library-level additions (`oninit`, `setPixelPerfect`, `pathfinding`) never warranted a public-roadmap entry — only whole new in-app tools (like the tilemap editor itself) have.

## Constraints & non-goals

- **One marker per cell per marker layer** — no stacking within a single marker layer. Multiple marker layers are the escape hatch if an author wants overlapping marker categories.
- **No per-marker structured data beyond the tag string.** No key/value payloads, no numeric parameters attached to a marker — if the shooter demo (or any future consumer) needs more than "this cell has this tag," that's a future extension, not built here.
- **No marker-layer-scoped queries.** `markersByTag(tag)` searches every marker layer in the set; there's no way to query "only markers on layer X." If that's ever needed, it's an additive follow-up, not a redesign (the underlying `handle._markers` entries could gain a `layer` field without breaking the existing query shape).
- **A layer's kind (tile vs. marker) is fixed at creation** — no in-editor conversion between kinds.
- **No runtime marker mutation.** `markersByTag` is read-only; there's no softBASIC API to add/remove/move a marker at runtime (markers are level-authoring-time data, baked into the `.stm` file, not a live game-state concept). A game that wants to track "this spawn point is now destroyed" does so in its own game logic (e.g. a parallel array of booleans keyed by index), not by mutating the tilemap's markers.
