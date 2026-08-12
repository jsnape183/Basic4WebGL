import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/tilemap.js is a plain script (not an ES module) — it declares a bare
// `const _sbTilemaps` that the runner concatenates into the sandboxed iframe,
// and (after this fix) reads two globals `stage.js` owns: `worldContainer`
// and `hudContainer`. Evaluate it in a Function context with those supplied,
// the same technique camera.test.ts and lifecycle.test.ts use. `PIXI` and
// `_sbAssets` are only referenced inside createTileMap/createTileMapSet,
// which these tests never call — only the pure offset/lookup math in
// tileAt/tileAtInSet/getTileMapSetLayer is under test here.
function loadTilemap(worldContainer: unknown = {}, hudContainer: unknown = {}) {
  const src = readFileSync('src/components/Runner/engine/tilemap.js', 'utf-8');
  const factory = new Function(
    'worldContainer',
    'hudContainer',
    `${src}\n return _sbTilemaps;`
  );
  return factory(worldContainer, hudContainer);
}

// createTileMap/createTileMapSet actually need real `_sbAssets`/`PIXI` in
// scope (issue #21's frame-slice cache), unlike the offset-math-only tests
// above — concatenate assets.js + tilemap.js together, the same technique
// stage.test.ts uses for cross-module engine wiring, with a minimal PIXI
// stub (Container/Texture/Rectangle) rather than the real library.
class FakeRectangle {
  x: number; y: number; width: number; height: number;
  constructor(x: number, y: number, width: number, height: number) {
    this.x = x; this.y = y; this.width = width; this.height = height;
  }
}
class FakeTexture {
  source: unknown; frame: FakeRectangle; width: number; height: number;
  constructor({ source, frame }: { source: unknown; frame: FakeRectangle }) {
    this.source = source; this.frame = frame; this.width = frame.width; this.height = frame.height;
  }
}
class FakeContainer {
  children: unknown[] = [];
  x = 0; y = 0; parent: unknown = null;
  addChild(c: unknown) { this.children.push(c); }
  removeChildren() { this.children = []; }
}

/** loadResults maps asset name -> what the stubbed PIXI.Assets.load() resolves to. */
function loadTilemapWithAssets(loadResults: Record<string, unknown>) {
  const assetsSrc = readFileSync('src/components/Runner/engine/assets.js', 'utf-8');
  const tilemapSrc = readFileSync('src/components/Runner/engine/tilemap.js', 'utf-8');
  const PIXI = {
    Container: FakeContainer,
    Texture: FakeTexture,
    Rectangle: FakeRectangle,
    Sprite: FakeContainer,
    Assets: { add() {}, async load(name: string) { return loadResults[name]; } },
  };
  const factory = new Function(
    'PIXI', 'worldContainer', 'hudContainer',
    `${assetsSrc}\n${tilemapSrc}\n return { _sbAssets, _sbTilemaps };`
  );
  return factory(PIXI, {}, {});
}

/** A preloaded tilemap engine whose 'sheet.png' asset is a real-shaped base texture. */
async function withLoadedSheet(width = 256, height = 256) {
  const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, width, height) });
  const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({ 'sheet.png': texture });
  await _sbAssets.preload([{ name: 'sheet.png', src: 'sheet.png' }]);
  return { _sbAssets, _sbTilemaps, texture };
}

// A minimal stand-in for a PIXI.Container as built by createTileMap/
// createTileMapSet — just the fields tileAt actually reads.
function makeLayerHandle(overrides: Record<string, unknown> = {}) {
  return {
    x: 0,
    y: 0,
    parent: null,
    _tileW: 10,
    _tileH: 10,
    _map: [
      [0, 1],
      [2, 3],
    ],
    ...overrides,
  };
}

describe('tileAt — single container (no parent), existing behavior unchanged', () => {
  test('reads the correct cell using only the handle\'s own offset', () => {
    const { tileAt } = loadTilemap();
    const handle = makeLayerHandle({ x: 20, y: 0 });
    // world (25, 5) minus offset (20, 0) = local (5, 5) -> col 0, row 0
    expect(tileAt(handle, 25, 5)).toBe(0);
    // world (35, 5) minus offset (20, 0) = local (15, 5) -> col 1, row 0
    expect(tileAt(handle, 35, 5)).toBe(1);
  });

  test('a handle parented directly to worldContainer behaves the same as unparented', () => {
    const worldContainer = {};
    const { tileAt } = loadTilemap(worldContainer);
    const handle = makeLayerHandle({ x: 20, y: 0, parent: worldContainer });
    expect(tileAt(handle, 35, 5)).toBe(1);
  });

  test('out-of-bounds world position returns 0', () => {
    const { tileAt } = loadTilemap();
    const handle = makeLayerHandle();
    expect(tileAt(handle, -100, -100)).toBe(0);
  });
});

describe('tileAt — layer nested inside a TileMapSet, accounts for the parent transform', () => {
  test('sums the layer\'s own offset and the wrapping set\'s offset', () => {
    const worldContainer = {};
    const { tileAt } = loadTilemap(worldContainer);
    const setHandle = { x: 30, y: 0, parent: worldContainer };
    const layerHandle = makeLayerHandle({ x: 0, y: 0, parent: setHandle });

    // world (35, 5): with only the set's offset (30) accounted for, local
    // would be (5, 5) -> col 0. The bug this fixes: previously only the
    // layer's own x/y (0) was used, giving local (35, 5) -> col 3 (out of
    // bounds) -> wrongly returned 0 instead of the real tile at col 0.
    expect(tileAt(layerHandle, 35, 5)).toBe(0);
    expect(tileAt(layerHandle, 45, 5)).toBe(1);
  });

  test('combines both the layer\'s own transform and the set\'s transform', () => {
    const worldContainer = {};
    const { tileAt } = loadTilemap(worldContainer);
    const setHandle = { x: 30, y: 0, parent: worldContainer };
    const layerHandle = makeLayerHandle({ x: 10, y: 0, parent: setHandle });

    // combined offset = 30 (set) + 10 (layer) = 40
    expect(tileAt(layerHandle, 45, 5)).toBe(0);
    expect(tileAt(layerHandle, 55, 5)).toBe(1);
  });

  test('stops accumulating at worldContainer — camera pan is not included', () => {
    // worldContainer itself is never treated as part of the offset, even if
    // it has a nonzero position (e.g. from camera panning) — matching the
    // existing single-layer contract, which is deliberately camera-agnostic.
    const worldContainer = { x: 500, y: 500 };
    const { tileAt } = loadTilemap(worldContainer);
    const setHandle = { x: 30, y: 0, parent: worldContainer };
    const layerHandle = makeLayerHandle({ x: 0, y: 0, parent: setHandle });

    expect(tileAt(layerHandle, 35, 5)).toBe(0);
    expect(tileAt(layerHandle, 45, 5)).toBe(1);
  });
});

describe('getTileMapSetLayer', () => {
  test('returns the named layer container', () => {
    const { getTileMapSetLayer } = loadTilemap();
    const layer = makeLayerHandle();
    const setHandle = { _layerContainers: { background: layer } };
    expect(getTileMapSetLayer(setHandle, 'background')).toBe(layer);
  });

  test('throws a clear error for an unknown layer name', () => {
    const { getTileMapSetLayer } = loadTilemap();
    const setHandle = { _layerContainers: { background: makeLayerHandle() } };
    expect(() => getTileMapSetLayer(setHandle, 'nope')).toThrow(/no layer named "nope"/);
  });
});

describe('tileAtInSet — TileMapSet.tileAt(name, x, y) convenience method', () => {
  // Called bound (`tilemap.tileAtInSet(...)`, not destructured) — this
  // engine module follows the project-wide convention of calling sibling
  // functions via `this` (see docs/roadmap.md known issue #16), so
  // `tileAtInSet` internally does `this.getTileMapSetLayer`/`this.tileAt`.
  // In real usage `this` is always `_sb`; here it's the `_sbTilemaps`
  // object itself, which still has both siblings.
  test('looks up the named layer and delegates to the same tileAt used elsewhere', () => {
    const worldContainer = {};
    const tilemap = loadTilemap(worldContainer);
    const setHandle: any = { x: 30, y: 0, parent: worldContainer };
    const layer = makeLayerHandle({ x: 0, y: 0, parent: setHandle });
    setHandle._layerContainers = { background: layer };

    expect(tilemap.tileAtInSet(setHandle, 'background', 45, 5)).toBe(1);
  });

  test('throws the same clear error as getTileMapSetLayer for an unknown name', () => {
    const tilemap = loadTilemap();
    const setHandle = { _layerContainers: { background: makeLayerHandle() } };
    expect(() => tilemap.tileAtInSet(setHandle, 'nope', 0, 0)).toThrow(/no layer named "nope"/);
  });
});

// ---------------------------------------------------------------------------
// Roadmap issue #21: createTileMap/createTileMapSet used to re-slice their
// tileset into a fresh frames array on every single construction, even for
// two TileMaps built from the identical (tileset, tileW, tileH). They now
// route through _sbAssets.getSlices, which memoizes by that key — verified
// here by reference equality on the underlying frames array.
// ---------------------------------------------------------------------------

describe('createTileMap — reuses the shared frame-slice cache (issue #21)', () => {
  test('two TileMaps built from the same tileset+size share the same frames array', async () => {
    const { _sbTilemaps } = await withLoadedSheet();
    const first = _sbTilemaps.createTileMap('sheet.png', 32, 32);
    const second = _sbTilemaps.createTileMap('sheet.png', 32, 32);
    expect(second._frames).toBe(first._frames);
    expect(first._frames).toHaveLength(64); // 256/32 = 8x8
  });

  test('a different tile size produces an independent frames array', async () => {
    const { _sbTilemaps } = await withLoadedSheet();
    const at32 = _sbTilemaps.createTileMap('sheet.png', 32, 32);
    const at64 = _sbTilemaps.createTileMap('sheet.png', 64, 64);
    expect(at64._frames).not.toBe(at32._frames);
  });
});

describe('createTileMapSet — layers share the same frame-slice cache as createTileMap (issue #21)', () => {
  test('a TileMapSet built from the same tileset+size as a TileMap shares frames with it', async () => {
    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 256, 256) });
    const stm = { tileWidth: 32, tileHeight: 32, tileImage: 'sheet.png', layers: { bg: [[1]] } };
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({
      'sheet.png': texture,
      'level.stm': stm,
    });
    await _sbAssets.preload([
      { name: 'sheet.png', src: 'sheet.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    const tileMap = _sbTilemaps.createTileMap('sheet.png', 32, 32);
    const set = _sbTilemaps.createTileMapSet('level.stm');

    expect(set._layerContainers.bg._frames).toBe(tileMap._frames);
  });
});

describe('createTileMapSet — marker layers (no rendering, accumulated into handle._markers)', () => {
  test('a marker layer produces no layer container and no rendered sprites', async () => {
    const stm = {
      tileWidth: 16, tileHeight: 16, tileImage: 'sheet.png',
      layers: {
        background: [[1, 1]],
        spawns: { type: 'markers', markers: [{ row: 0, col: 1, tag: 'spawn' }] },
      },
    };
    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 256, 256) });
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({ 'sheet.png': texture, 'level.stm': stm });
    await _sbAssets.preload([
      { name: 'sheet.png', src: 'sheet.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    const set = _sbTilemaps.createTileMapSet('level.stm');

    expect(Object.keys(set._layerContainers)).toEqual(['background']);
    expect(set._markers).toEqual([{ row: 0, col: 1, tag: 'spawn' }]);
  });

  test('an old-format file with only bare-array tile layers is completely unaffected', async () => {
    const stm = { tileWidth: 16, tileHeight: 16, tileImage: 'sheet.png', layers: { background: [[1, 0]] } };
    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 256, 256) });
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({ 'sheet.png': texture, 'level.stm': stm });
    await _sbAssets.preload([
      { name: 'sheet.png', src: 'sheet.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    const set = _sbTilemaps.createTileMapSet('level.stm');

    expect(Object.keys(set._layerContainers)).toEqual(['background']);
    expect(set._markers).toEqual([]);
  });

  test('a file with multiple marker layers accumulates markers from all of them', async () => {
    const stm = {
      tileWidth: 16, tileHeight: 16, tileImage: 'sheet.png',
      layers: {
        spawns: { type: 'markers', markers: [{ row: 0, col: 0, tag: 'spawn' }] },
        pickups: { type: 'markers', markers: [{ row: 1, col: 1, tag: 'pickup' }] },
      },
    };
    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 256, 256) });
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({ 'sheet.png': texture, 'level.stm': stm });
    await _sbAssets.preload([
      { name: 'sheet.png', src: 'sheet.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    const set = _sbTilemaps.createTileMapSet('level.stm');

    expect(set._markers).toEqual([
      { row: 0, col: 0, tag: 'spawn' },
      { row: 1, col: 1, tag: 'pickup' },
    ]);
  });
});

describe('createTileMapSet — collision layers (no rendering, no tile-art parsing)', () => {
  test('a collision layer produces a layer container with no rendered sprites', async () => {
    const stm = {
      tileWidth: 16, tileHeight: 16, tileImage: 'sheet.png',
      layers: {
        background: [[1, 1]],
        solidmask: { type: 'collision', data: [[1, 0]] },
      },
    };
    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 256, 256) });
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({ 'sheet.png': texture, 'level.stm': stm });
    await _sbAssets.preload([
      { name: 'sheet.png', src: 'sheet.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    const set = _sbTilemaps.createTileMapSet('level.stm');

    expect(Object.keys(set._layerContainers)).toEqual(['background', 'solidmask']);
    expect(set._layerContainers.solidmask.children).toEqual([]);
    expect(set._layerContainers.solidmask._map).toEqual([[1, 0]]);
  });

  test('a collision layer with a tile-id-like value (e.g. 5) does not attempt to render tile art', async () => {
    // The collision grid's values are opaque booleans (0/non-zero), not tile
    // indices into `frames` -- confirms the loader never treats collision
    // data as tile art, even if a value happens to look like a valid tile id.
    const stm = {
      tileWidth: 16, tileHeight: 16, tileImage: 'sheet.png',
      layers: { solidmask: { type: 'collision', data: [[5]] } },
    };
    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 16, 16) });
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({ 'sheet.png': texture, 'level.stm': stm });
    await _sbAssets.preload([
      { name: 'sheet.png', src: 'sheet.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    const set = _sbTilemaps.createTileMapSet('level.stm');

    expect(set._layerContainers.solidmask.children).toEqual([]);
  });

  test('a file mixing tile, marker, and collision layers accumulates each correctly', async () => {
    const stm = {
      tileWidth: 16, tileHeight: 16, tileImage: 'sheet.png',
      layers: {
        background: [[1]],
        spawns: { type: 'markers', markers: [{ row: 0, col: 0, tag: 'spawn' }] },
        solidmask: { type: 'collision', data: [[1]] },
      },
    };
    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 16, 16) });
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({ 'sheet.png': texture, 'level.stm': stm });
    await _sbAssets.preload([
      { name: 'sheet.png', src: 'sheet.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    const set = _sbTilemaps.createTileMapSet('level.stm');

    expect(Object.keys(set._layerContainers)).toEqual(['background', 'solidmask']);
    expect(set._markers).toEqual([{ row: 0, col: 0, tag: 'spawn' }]);
  });
});

describe('markersByTag', () => {
  test('returns world-space cell-center positions for every marker matching the tag', () => {
    const { tileAt, markersByTag } = loadTilemap();
    const handle = {
      x: 0, y: 0, parent: null,
      _tileW: 10, _tileH: 10,
      _markers: [
        { row: 0, col: 1, tag: 'spawn' },
        { row: 2, col: 0, tag: 'spawn' },
        { row: 1, col: 1, tag: 'pickup' },
      ],
    };
    void tileAt; // unused in this describe block, imported for symmetry with other tests in this file

    const results = markersByTag(handle, 'spawn');

    expect(results).toEqual([
      { x: 15, y: 5 },  // col 1, row 0 -> local center (15, 5)
      { x: 5, y: 25 },  // col 0, row 2 -> local center (5, 25)
    ]);
  });

  test('returns an empty array when no marker matches the tag', () => {
    const { markersByTag } = loadTilemap();
    const handle = { x: 0, y: 0, parent: null, _tileW: 10, _tileH: 10, _markers: [{ row: 0, col: 0, tag: 'spawn' }] };

    expect(markersByTag(handle, 'nope')).toEqual([]);
  });

  test('accounts for the TileMapSet handle\'s own offset, same as tileAt', () => {
    const worldContainer = {};
    const { markersByTag } = loadTilemap(worldContainer);
    const handle = { x: 20, y: 0, parent: worldContainer, _tileW: 10, _tileH: 10, _markers: [{ row: 0, col: 0, tag: 'spawn' }] };

    // local center (5, 5) + offset (20, 0) = world (25, 5)
    expect(markersByTag(handle, 'spawn')).toEqual([{ x: 25, y: 5 }]);
  });
});
