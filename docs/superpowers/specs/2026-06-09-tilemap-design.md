# TileMap Design

**Date:** 2026-06-09
**Status:** Approved

## Goal

Add a `TileMap` class to softBASIC that enables platformer-style games with tile-based levels: load a layer from a JSON asset file, render it via a uniform-grid tileset image, and query tile IDs by world position for collision detection.

## Background

softBASIC has no tile rendering support. Without it, building a platformer requires manual sprite management for every tile, which is impractical. `TileMap` is a new, independent class (no inheritance from `Sprite` or `AnimatedSprite`) that loads a 2D tile array from a JSON file and renders it efficiently as a `PIXI.Container` of sprites.

---

## JSON Layer File Format

A bare 2D array — rows first, then columns. Zero means empty (no tile rendered). Tile indices are 1-based, counted left-to-right then top-to-bottom across the tileset grid.

```json
[[0,0,1,2],[3,0,4,0],[0,5,0,6]]
```

This is the universal format. A future visual tilemap editor may introduce an optional metadata wrapper (`{"tileW": 32, "tileH": 32, "tiles": [...]}`) but the bare array will always be a valid input.

---

## BASIC API

### Construction

```basic
dim bg as new TileMap("tileset.png", 32, 32)
' tilesetPath: path to tileset image (same asset system as Sprite)
' tileW:       width of each tile in pixels
' tileH:       height of each tile in pixels
```

Tile indices in the JSON are 1-based, ordered left-to-right then top-to-bottom across the tileset grid.

### Loading a Layer

```basic
bg.load("bg.json")
```

Loads the JSON asset, clears any previously rendered tiles, and renders the new map. Can be called again to swap map data (e.g. changing levels).

### Stage Integration

```basic
stage.add(bg)
stage.remove(bg)
```

Same as `Sprite` and `AnimatedSprite` — the `_handle` is a raw `PIXI.Container`.

### Position / Transform

```basic
bg.transform.x = -scrollX
bg.transform.y = 0
```

Uses the same `ObjectTransform` composition as `Sprite`. Setting `transform.x`/`transform.y` scrolls the layer — useful for camera offset and parallax.

### Dimensions

```basic
dim mapW = bg.widthPx()
dim mapH = bg.heightPx()
```

Returns the total pixel width/height of the loaded map (`cols × tileW`, `rows × tileH`). Returns `0` before `load()` is called.

### Tile Query

```basic
dim tileId = bg.tileAt(worldX, worldY)
if tileId > 0
    ' solid tile — handle collision
endif
```

Converts world coordinates to a tile index, accounting for the map's current `transform.x`/`transform.y`. Returns `0` for empty tiles and out-of-bounds positions.

---

## Engine Implementation

### New engine file: `src/components/Runner/engine/tilemap.js`

Provides the `_sbTilemaps` mixin spread into `_sb` in `softBasicEngine.js`.

**`createTileMap(tilesetPath, tileW, tileH)`**
- Gets the base texture via `_sbAssets.get(tilesetPath)`.
- Slices all frames: iterates rows and columns across the tileset, creating `PIXI.Texture` instances with `new PIXI.Rectangle(col*tileW, row*tileH, tileW, tileH)` — same approach as `animatedSprite.js`.
- Creates a `PIXI.Container`.
- Stores `_tileW`, `_tileH`, `_frames` (full frame array), `_map` (initially `[]`) directly on the container.
- Returns the raw container (compatible with `stage.add/remove` — `obj._handle` is a PIXI DisplayObject).

**`loadTileMap(handle, jsonPath)`**
- Retrieves the parsed JSON array from `_sbAssets.get(jsonPath)` (PIXI.Assets parses JSON natively; no change to `assets.js` needed).
- Removes all existing children from the container.
- Iterates `data[row][col]`; skips `0`; for each non-zero tile index `N`, creates a `PIXI.Sprite` from `handle._frames[N - 1]`, positions it at `(col * handle._tileW, row * handle._tileH)`, and adds to the container.
- Stores the 2D array on `handle._map`.

**`tileAt(handle, worldX, worldY)`**
```js
const col = Math.floor((worldX - handle.x) / handle._tileW);
const row = Math.floor((worldY - handle.y) / handle._tileH);
if (row < 0 || row >= handle._map.length) return 0;
if (col < 0 || col >= (handle._map[0]?.length ?? 0)) return 0;
return handle._map[row][col] ?? 0;
```

**`tileMapWidthPx(handle)`** — `(handle._map[0]?.length ?? 0) * handle._tileW`

**`tileMapHeightPx(handle)`** — `handle._map.length * handle._tileH`

### `softBasicEngine.js`

```javascript
const _sb = {
  ..._sbLifecycle,
  ..._sbInput,
  ..._sbAssets,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbSprites,
  ..._sbAnimatedSprites,
  ..._sbTilemaps,   // new
};
```

---

## BASIC Definition File

**New file: `src/lib/Basic4WebGL/defs/tilemap.bas`**

```basic
Class
dim _handle

Constructor(tilesetPath, tileW, tileH)
    _handle = call("_sb.createTileMap(constructor_tilesetPath, constructor_tileW, constructor_tileH)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function load(jsonPath)
    call("_sb.loadTileMap(this._handle, load_jsonPath)")
endfunction

function tileAt(x, y)
    return call("_sb.tileAt(this._handle, tileat_x, tileat_y)")
endfunction

function widthPx()
    return call("_sb.tileMapWidthPx(this._handle)")
endfunction

function heightPx()
    return call("_sb.tileMapHeightPx(this._handle)")
endfunction

EndClass
```

---

## Package Integration

`tilemap.bas` is added to the `softgfx` package in `src/constants/packageModules.ts`, alongside `sprite.bas` and `animatedsprite.bas`. Any project using `softgfx` automatically gets `TileMap`.

---

## Testing

**Test file:** `tests/lib/Basic4WebGL/unit/transpiler/tilemap.test.ts`

Uses the same `transpileGame` helper as `animated-sprite.test.ts`.

Tests:
1. `new TileMap(path, tileW, tileH)` compiles without diagnostics
2. `load(jsonPath)` compiles without diagnostics
3. `tileAt(x, y)` return value usable in a numeric expression
4. `widthPx()` and `heightPx()` compile without diagnostics
5. `transform.x` assignment compiles without diagnostics
6. Full end-to-end: construct → load → stage.add → tileAt in `onupdate` → zero diagnostics

---

## Constraints & Non-Goals

- Uniform grid tilesets only — no atlas/JSON descriptor tileset support
- Single tileset image per TileMap instance; cannot change after construction
- No animated tiles
- No z-ordering API (existing stage layer model applies — multiple TileMaps can be added to stage in order)
- `load()` before `stage.add()` is not required but recommended for clean first frame
- No `cacheAsTexture()` optimisation in this iteration (future enhancement for large static layers)
