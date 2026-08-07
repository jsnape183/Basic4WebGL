import { readFileSync } from 'node:fs';
import { describe, test, expect, vi, afterEach } from 'vitest';

// engine/pathfinding.js is a plain script (not an ES module) — it declares a
// bare `const _sbPathfinding` that the runner concatenates into the sandboxed
// iframe, and (like tilemap.js) reads two globals `stage.js` owns:
// `worldContainer` and `hudContainer`. Evaluate it in a Function context with
// those supplied, the same technique tilemap.test.ts/camera.test.ts use.
function loadPathfinding(worldContainer: unknown = {}, hudContainer: unknown = {}) {
  const src = readFileSync('src/components/Runner/engine/pathfinding.js', 'utf-8');
  const factory = new Function(
    'worldContainer',
    'hudContainer',
    `${src}\n return _sbPathfinding;`
  );
  return factory(worldContainer, hudContainer);
}

// A minimal stand-in for a TileMapSet layer container, matching the shape
// createTileMapSet builds in tilemap.js — just the fields pathfinding reads.
function makeLayer(map: number[][], overrides: Record<string, unknown> = {}) {
  return {
    x: 0,
    y: 0,
    parent: null,
    _tileW: 10,
    _tileH: 10,
    _map: map,
    ...overrides,
  };
}

// A minimal stand-in for a softBASIC TileMapSet class instance — setupNavGrid
// receives the instance itself (per the .bas call convention), not its
// underlying handle, and reads `._handle._layerContainers` internally.
function makeTileMapSet(layerContainers: Record<string, unknown>) {
  return { _handle: { _layerContainers: layerContainers } };
}

describe('setupNavGrid', () => {
  test('OR-reduces blocked cells across all flagged layers, ignoring unflagged ones', () => {
    const pf = loadPathfinding();
    const floor = makeLayer([[9, 9], [9, 9]]);
    const walls = makeLayer([[0, 1], [0, 0]]);
    const obstacles = makeLayer([[0, 0], [2, 0]]);

    pf.setupNavGrid(makeTileMapSet({ floor, walls, obstacles }), ['walls', 'obstacles']);

    expect(pf._isBlocked(0, 0)).toBe(false);
    expect(pf._isBlocked(0, 1)).toBe(true); // from walls
    expect(pf._isBlocked(1, 0)).toBe(true); // from obstacles
    expect(pf._isBlocked(1, 1)).toBe(false);
  });

  test('an empty blockingLayers list produces a fully walkable grid', () => {
    const pf = loadPathfinding();
    const floor = makeLayer([[5, 5]]);

    pf.setupNavGrid(makeTileMapSet({ floor }), []);

    expect(pf._isBlocked(0, 0)).toBe(false);
    expect(pf._isBlocked(0, 1)).toBe(false);
  });

  test('throws a clear error for an unknown layer name', () => {
    const pf = loadPathfinding();
    expect(() =>
      pf.setupNavGrid(makeTileMapSet({ walls: makeLayer([[0]]) }), ['nope'])
    ).toThrow(/no layer named "nope"/);
  });

  test('cells outside the grid bounds are treated as blocked', () => {
    const pf = loadPathfinding();
    const walls = makeLayer([[0, 0], [0, 0]]);
    pf.setupNavGrid(makeTileMapSet({ walls }), ['walls']);

    expect(pf._isBlocked(-1, 0)).toBe(true);
    expect(pf._isBlocked(0, 2)).toBe(true);
    expect(pf._isBlocked(2, 0)).toBe(true);
  });

  test('calling setup again replaces the previous grid and clears nav state', () => {
    const pf = loadPathfinding();
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer([[1]]) }), ['walls']);
    pf._navState.set({}, { path: [], waypointIndex: 0 });

    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer([[0]]) }), ['walls']);

    expect(pf._isBlocked(0, 0)).toBe(false);
    expect(pf._navState.size).toBe(0);
  });
});

describe('_worldToCell / _gridOffset / _cellCenterWorld', () => {
  test('converts world coordinates to grid cell using only the reference layer\'s own offset', () => {
    const pf = loadPathfinding();
    const walls = makeLayer([[0, 0], [0, 0]], { x: 20, y: 0 });
    pf.setupNavGrid(makeTileMapSet({ walls }), ['walls']);

    // world (25, 5) minus offset (20, 0) = local (5, 5) -> col 0, row 0
    expect(pf._worldToCell(25, 5)).toEqual({ row: 0, col: 0 });
    // world (35, 5) minus offset (20, 0) = local (15, 5) -> col 1, row 0
    expect(pf._worldToCell(35, 5)).toEqual({ row: 0, col: 1 });
  });

  test('accumulates offset through an ancestor (e.g. a wrapping TileMapSet transform)', () => {
    const worldContainer = {};
    const pf = loadPathfinding(worldContainer);
    const setHandle = { x: 30, y: 0, parent: worldContainer };
    const walls = makeLayer([[0, 0], [0, 0]], { x: 0, y: 0, parent: setHandle });
    pf.setupNavGrid(makeTileMapSet({ walls }), ['walls']);

    // combined offset = 30, world 35 -> local 5 -> col 0
    expect(pf._worldToCell(35, 5)).toEqual({ row: 0, col: 0 });
  });

  test('stops accumulating at worldContainer — camera pan is not included', () => {
    const worldContainer = { x: 500, y: 500 };
    const pf = loadPathfinding(worldContainer);
    const walls = makeLayer([[0, 0]], { x: 20, y: 0, parent: worldContainer });
    pf.setupNavGrid(makeTileMapSet({ walls }), ['walls']);

    expect(pf._worldToCell(25, 5)).toEqual({ row: 0, col: 0 });
  });

  test('_cellCenterWorld returns the pixel-space center point of a cell, offset-aware', () => {
    const pf = loadPathfinding();
    const walls = makeLayer([[0, 0], [0, 0]], { x: 20, y: 0 });
    pf.setupNavGrid(makeTileMapSet({ walls }), ['walls']);

    // col 1, row 0 -> local center (15, 5) -> world (35, 5)
    expect(pf._cellCenterWorld(0, 1)).toEqual({ x: 35, y: 5 });
  });
});

describe('_nearestWalkable', () => {
  test('returns the same cell unchanged if it is already walkable', () => {
    const pf = loadPathfinding();
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer([[0, 0], [0, 0]]) }), ['walls']);
    expect(pf._nearestWalkable(0, 0)).toEqual({ row: 0, col: 0 });
  });

  test('finds the closest walkable cell by expanding rings outward', () => {
    const pf = loadPathfinding();
    const map = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ];
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer(map) }), ['walls']);

    const result = pf._nearestWalkable(1, 1);

    expect(pf._isBlocked(result.row, result.col)).toBe(false);
    // must be on the distance-1 ring around (1,1) — the nearest possible ring
    expect(Math.max(Math.abs(result.row - 1), Math.abs(result.col - 1))).toBe(1);
  });

  test('returns null when the entire grid is blocked', () => {
    const pf = loadPathfinding();
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer([[1, 1], [1, 1]]) }), ['walls']);
    expect(pf._nearestWalkable(0, 0)).toBe(null);
  });
});

describe('_resolveTargetCell', () => {
  test('returns the target cell directly when walkable', () => {
    const pf = loadPathfinding();
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer([[0, 0], [0, 0]]) }), ['walls']);
    expect(pf._resolveTargetCell(5, 5)).toEqual({ row: 0, col: 0 });
  });

  test('snaps to the nearest walkable cell when the target is blocked', () => {
    const pf = loadPathfinding();
    const map = [[1, 0]];
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer(map) }), ['walls']);
    // world (5,5) -> col 0, row 0, which is blocked -> should snap to col 1
    expect(pf._resolveTargetCell(5, 5)).toEqual({ row: 0, col: 1 });
  });
});
