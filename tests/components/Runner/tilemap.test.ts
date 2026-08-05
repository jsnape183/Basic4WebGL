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
