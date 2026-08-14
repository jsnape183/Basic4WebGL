import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/collision.js is a plain script (not an ES module) — it declares a
// bare `const _sbCollision` IIFE. Evaluate it in a Function context with the
// globals it needs, the same technique pathfinding.test.ts uses.
function loadCollision(worldContainer: unknown = {}, hudContainer: unknown = {}) {
  const src = readFileSync('src/components/Runner/engine/collision.js', 'utf-8');
  const factory = new Function(
    'worldContainer',
    'hudContainer',
    `${src}\n return _sbCollision;`
  );
  return factory(worldContainer, hudContainer);
}

// Minimal stand-ins matching the shapes tilemap.js's createTileMapSet builds.
function makeCollisionLayer(map: number[][], tileW = 10, tileH = 10) {
  return { _isCollisionLayer: true, _map: map, _tileW: tileW, _tileH: tileH };
}
function makeTileLayer(map: number[][], tileW = 10, tileH = 10) {
  return { _map: map, _tileW: tileW, _tileH: tileH };
}
function makeTileMapSet(layerContainers: Record<string, unknown>, handleOverrides: Record<string, unknown> = {}) {
  return { _handle: { _layerContainers: layerContainers, x: 0, y: 0, parent: null, ...handleOverrides } };
}

describe('setupTileCollision', () => {
  test('OR-reduces solid cells across every collision-kind layer, ignoring tile-art layers', () => {
    const c = loadCollision();
    const floor = makeTileLayer([[9, 9], [9, 9]]);
    const wallsA = makeCollisionLayer([[0, 1], [0, 0]]);
    const wallsB = makeCollisionLayer([[0, 0], [1, 0]]);

    c.setupTileCollision(makeTileMapSet({ floor, wallsA, wallsB }));

    expect(c._isSolidCell(c._tileCollisionGrid, 0, 0)).toBe(false);
    expect(c._isSolidCell(c._tileCollisionGrid, 0, 1)).toBe(true); // from wallsA
    expect(c._isSolidCell(c._tileCollisionGrid, 1, 0)).toBe(true); // from wallsB
    expect(c._isSolidCell(c._tileCollisionGrid, 1, 1)).toBe(false);
  });

  test('throws when the TileMapSet has no collision-kind layer', () => {
    const c = loadCollision();
    const floor = makeTileLayer([[1]]);
    expect(() => c.setupTileCollision(makeTileMapSet({ floor }))).toThrow(/no collision layer/);
  });

  test('throws when not handed a TileMapSet instance', () => {
    const c = loadCollision();
    expect(() => c.setupTileCollision(null)).toThrow(/expected a TileMapSet instance/);
    expect(() => c.setupTileCollision({})).toThrow(/expected a TileMapSet instance/);
  });

  test('an out-of-range cell is never solid', () => {
    const c = loadCollision();
    const walls = makeCollisionLayer([[1, 1], [1, 1]]);
    c.setupTileCollision(makeTileMapSet({ walls }));
    expect(c._isSolidCell(c._tileCollisionGrid, -1, 0)).toBe(false);
    expect(c._isSolidCell(c._tileCollisionGrid, 0, 5)).toBe(false);
  });

  test('stores the TileMapSet handle (not a per-layer container) as the offset reference', () => {
    const c = loadCollision();
    const walls = makeCollisionLayer([[1]]);
    const tileMapSet = makeTileMapSet({ walls });
    c.setupTileCollision(tileMapSet);
    expect(c._tileCollisionGrid.reference).toBe(tileMapSet._handle);
  });
});
