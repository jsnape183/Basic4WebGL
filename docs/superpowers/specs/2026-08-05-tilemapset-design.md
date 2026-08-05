# TileMapSet Design

**Date:** 2026-08-05
**Status:** Approved

## Goal

Add multi-layer tilemap support to softBASIC via a new `TileMapSet` class and a new `.stm` file format, so background/foreground/collision layers can be authored and loaded as one unit instead of stacking independent `TileMap` instances with hand-aligned separate JSON files. This is sub-project A of two: the visual tilemap editor (sub-project B) is a separate, later spec that builds on the format and API defined here.

## Background

The existing `TileMap` class (`src/lib/Basic4WebGL/defs/tilemap.bas`, `src/components/Runner/engine/tilemap.js`) loads a bare 2D array from a JSON asset — one flat grid, one tile ID per cell, no metadata, no layer concept. Multi-layer scenes (e.g. background + foreground + solid-tile collision layer) can only be built today by stacking multiple `TileMap` instances, each constructed separately, each loaded from its own separate JSON file, and manually kept in pixel-alignment by the game author.

This gap is tracked in `docs/roadmap.md` (Milestone 12 "Tilemap editor", and known-deferred-issue #10), which explicitly calls out that a visual editor's data model and export format should be designed against real layer support rather than the current single-layer-plus-stacking workaround. `docs/superpowers/specs/2026-06-09-tilemap-design.md` (the original `TileMap` spec) also anticipated this: *"a future visual tilemap editor may introduce an optional metadata wrapper... but the bare array will always be a valid input."*

`TileMapSet` is purely additive. `TileMap`, `tilemap.bas`, and the bare-array format are unchanged — every existing project, tutorial, and demo using `TileMap.load(jsonPath)` continues to work exactly as today.

---

## `.stm` File Format

A JSON object with tileset metadata and a keyed map of named layers:

```json
{
  "tileWidth": 32,
  "tileHeight": 32,
  "tileImage": "tileset.png",
  "layers": {
    "background": [[0,0,1,2],[3,0,4,0]],
    "foreground": [[0,0,0,0],[0,5,0,0]]
  }
}
```

- `tileWidth` / `tileHeight`: pixel dimensions of one tile, used to slice `tileImage`.
- `tileImage`: asset path to the single tileset image shared by every layer in the file (same asset-resolution mechanism `TileMap`'s constructor already uses).
- `layers`: an object keyed by layer name. Each value is a bare 2D array in the same 1-based tile ID / `0` = empty convention as today's `TileMap` format. Key order is preserved (JS object insertion order) and defines render/z-order — first key renders first (bottom), last key renders last (top).

All layers in one `.stm` file share the same `tileWidth`/`tileHeight`/`tileImage` — there is no per-layer tileset override in this iteration.

---

## softBASIC API

### Construction

```basic
dim tm as new TileMapSet("level1.stm")
```

Loads the `.stm` asset, slices `tileImage` once (shared across all layers), builds one internal layer object per entry in `layers`, and adds each to the stage automatically, in file key order (bottom to top).

### Accessing a Layer

```basic
dim bg as TileMap = tm.layer("background")
```

Returns a layer object with **exactly the same API surface as today's `TileMap`** (`tileAt`, `widthPx`, `heightPx`, `transform`, `setDepth`) — no parallel/duplicate API on `TileMapSet` itself. Requesting an unknown layer name raises a runtime error (same error-reporting convention as other invalid-argument cases elsewhere in the runtime — exact mechanism confirmed during implementation planning).

### Per-Layer Transform / Scrolling

```basic
bg.transform.setPosition(-scrollX, 0)
```

Works identically to `TileMap` today — each layer is its own `PIXI.Container` with its own `ObjectTransform`, so per-layer parallax/scroll is unchanged from the existing single-layer pattern.

### Tile Query

```basic
dim tileId = bg.tileAt(worldX, worldY)
```

Unchanged from `TileMap.tileAt` — queries are per-layer, not per-set, since different layers (e.g. a "collision" layer vs. a "decoration" layer) typically need independent queries.

---

## Engine Implementation

### `src/components/Runner/engine/tilemap.js` (extended, not replaced)

Reuses the existing per-layer sprite-building logic (`loadTileMap`'s frame-lookup/positioning loop) rather than duplicating it.

**`createTileMapSet(stmPath)`**
- Loads and parses the `.stm` JSON via `_sbAssets.get(stmPath)`.
- Slices `tileImage` once into a shared `_frames` array (same slicing approach `createTileMap` already uses, keyed by `tileWidth`/`tileHeight` from the file).
- For each `[name, layerArray]` in `layers` (in key order): builds a `PIXI.Container` populated the same way `loadTileMap` populates one today (iterate `layerArray[row][col]`, skip `0`, place a `PIXI.Sprite` from the shared `_frames`), and stores it in an internal `name → container` map.
- Stage-adds each layer container in key order.
- Returns a handle exposing the `name → container` map (used by `getTileMapSetLayer`).

**`getTileMapSetLayer(handle, name)`**
- Looks up `name` in the handle's layer map.
- Returns the matching layer container — the same shape `tileAt`/`widthPx`/`heightPx`/`ObjectTransform` already operate on for `TileMap`, so no new per-layer query logic is needed.
- Throws/reports a runtime error for an unrecognized name.

### `src/components/Runner/softBasicEngine.js`

`_sbTilemaps` (already spread into `_sb`) gains the two new functions above — no new mixin needed, since this lives in the same engine module as `TileMap`.

---

## BASIC Definition File

**New file: `src/lib/Basic4WebGL/defs/tilemapset.bas`**

```basic
Class
dim _handle

Constructor(stmPath)
    _handle = call("_sb.createTileMapSet(constructor_stmPath)")
EndConstructor

function layer(name)
    return call("_sb.getTileMapSetLayer(this._handle, layer_name)")
endfunction

EndClass
```

`layer(name)` returns a raw handle usable anywhere a `TileMap` instance is expected — since `TileMap`'s own methods (`tileAt`, `widthPx`, `heightPx`, `transform`) operate on `_handle` directly, the returned container is API-compatible without needing to construct a full wrapping `TileMap` object. Exact typing mechanics (whether the transpiler needs a explicit cast/type hint at the call site, e.g. `dim bg as TileMap = tm.layer("background")`) will be confirmed during implementation planning against how the transpiler already handles similar returned-object-typing cases elsewhere.

---

## Package Integration

`tilemapset.bas` is added to `packageModules.ts` alongside `tilemap`, and included in the `softgfx` package grouping so it ships automatically wherever `TileMap` does.

---

## Testing

**Test file:** `tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts`, using the same `transpileGame` helper pattern as `tilemap.test.ts`. Written first (TDD), per project convention.

Tests:
1. `new TileMapSet(path)` compiles without diagnostics
2. `tm.layer("name")` compiles, return value usable as a `TileMap`-typed variable
3. `tileAt(x, y)` called on a returned layer compiles and its return value is usable in a numeric expression
4. `widthPx()` / `heightPx()` called on a returned layer compile without diagnostics
5. `transform.x` assignment on a returned layer compiles without diagnostics
6. Full end-to-end: construct `TileMapSet` → `layer()` → `tileAt` in `onupdate` → zero diagnostics

No Cypress e2e spec is added in this sub-project, since no published tutorial or demo uses `TileMapSet` yet. Once sub-project B (the editor) or a demo adopts it, that demo's own `demos.cy.ts` coverage exercises it at runtime, per the project's e2e conventions.

---

## Docs

- New API Reference page `src/docs/api-reference/tilemapset.md`, added to `src/docs/manifest.ts`, following the existing `tilemap.md` structure: `## Constructor` section, `layer()` method with a parameter table, a `**Returns:**` line, and a game-like `.bas` example (e.g. a `background` decoration layer plus a `collision` layer used for `tileAt` ground checks).
- Short cross-reference added to the existing `tilemap.md` page pointing readers to `TileMapSet` for multi-layer maps.

---

## Roadmap Sync

- `docs/roadmap.md` known-deferred-issue #10 ("`tilemap` has no multi-layer support") is marked resolved, referencing this spec and `TileMapSet`.
- `docs/roadmap.md` Milestone 12 ("Tilemap editor") notes that its prerequisite engine gap is now closed, and scopes the milestone's remaining work down to the editor UI itself (sub-project B).
- `docs/language/library-roadmap.md`'s module table gains a `TileMapSet` entry alongside the existing `TileMap` row.
- `src/docs/roadmap.md` (public-facing roadmap) is checked for any matching public claim and updated if needed — the "Creation tools" line already references "in-app editors for... tilemaps" generically, so it likely needs no change, but will be verified during implementation.

---

## Constraints & Non-Goals

- All layers in one `.stm` share a single tileset image — no per-layer tileset override.
- No dynamic layer add/remove/reorder at runtime — the layer set is fixed once loaded (matches `TileMap`'s existing "no reload/resize after construction" posture).
- No animated tiles (same non-goal as the original `TileMap` spec).
- No built-in cross-layer collision helper (deferred issue #17 in `docs/roadmap.md` remains open, tracked separately from this work).
- `TileMapSet` does not replace or deprecate `TileMap` — both remain valid, independent APIs; `TileMap` for single-layer use, `TileMapSet` for multi-layer.
