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

  test('expands past radius 1 when the whole first ring is blocked too', () => {
    const pf = loadPathfinding();
    const map = [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
    ];
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer(map) }), ['walls']);

    const result = pf._nearestWalkable(2, 2);

    expect(pf._isBlocked(result.row, result.col)).toBe(false);
    // the radius-1 ring around (2,2) is entirely blocked, so the nearest
    // walkable cell must be found on the radius-2 ring, exercising the
    // loop's radius-advancement path.
    expect(Math.max(Math.abs(result.row - 2), Math.abs(result.col - 2))).toBe(2);
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

describe('_findPath', () => {
  test('returns an empty path when start and goal are the same cell', () => {
    const pf = loadPathfinding();
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer([[0, 0], [0, 0]]) }), ['walls']);
    expect(pf._findPath(0, 0, 0, 0)).toEqual([]);
  });

  test('finds a straight orthogonal path across an open grid', () => {
    const pf = loadPathfinding();
    const open = Array.from({ length: 3 }, () => [0, 0, 0]);
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer(open) }), ['walls']);

    expect(pf._findPath(0, 0, 0, 2)).toEqual([{ row: 0, col: 1 }, { row: 0, col: 2 }]);
  });

  test('takes a diagonal shortcut across an open grid rather than a longer orthogonal route', () => {
    const pf = loadPathfinding();
    const open = Array.from({ length: 3 }, () => [0, 0, 0]);
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer(open) }), ['walls']);

    expect(pf._findPath(0, 0, 2, 2)).toEqual([{ row: 1, col: 1 }, { row: 2, col: 2 }]);
  });

  test('routes around a wall', () => {
    const pf = loadPathfinding();
    const map = [
      [0, 1, 0],
      [0, 1, 0],
      [0, 0, 0],
    ];
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer(map) }), ['walls']);

    const path = pf._findPath(0, 0, 0, 2);

    expect(path.some((p: { row: number; col: number }) => p.row === 0 && p.col === 1)).toBe(false);
    expect(path[path.length - 1]).toEqual({ row: 0, col: 2 });
  });

  test('prevents cutting diagonally across a wall corner', () => {
    const pf = loadPathfinding();
    // (0,1) and (1,0) both blocked — a diagonal step from (0,0) to (1,1) must
    // not be allowed to cut between them, so the goal becomes unreachable.
    const map = [
      [0, 1],
      [1, 0],
    ];
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer(map) }), ['walls']);

    expect(pf._findPath(0, 0, 1, 1)).toBe(null);
  });

  test('returns null when the goal is unreachable', () => {
    const pf = loadPathfinding();
    const map = [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ];
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer(map) }), ['walls']);

    expect(pf._findPath(0, 0, 0, 2)).toBe(null);
  });
});

// A minimal stand-in for a softBASIC sprite instance — navigateTo receives
// the instance itself (per the .bas call convention) and reads
// `._handle.position` internally, matching how sprites.js's setPosition/
// getPositionX/getPositionY operate on `obj.position`.
function makeSprite(x: number, y: number) {
  return { _handle: { position: { x, y } } };
}

function setupOpenGrid(pf: ReturnType<typeof loadPathfinding>, size = 3) {
  const open = Array.from({ length: size }, () => Array(size).fill(0));
  pf.setupNavGrid(makeTileMapSet({ walls: makeLayer(open) }), ['walls']);
}

describe('navigateTo / isNavigating / stopNavigating', () => {
  test('throws if called before setupNavGrid', () => {
    const pf = loadPathfinding();
    expect(() => pf.navigateTo(makeSprite(0, 0), 10, 10, 100)).toThrow(/call pathfinding\.setup\(\)/);
  });

  test('isNavigating throws if called before setupNavGrid', () => {
    const pf = loadPathfinding();
    expect(() => pf.isNavigating(makeSprite(0, 0))).toThrow(/call pathfinding\.setup\(\)/);
  });

  test('stopNavigating throws if called before setupNavGrid', () => {
    const pf = loadPathfinding();
    expect(() => pf.stopNavigating(makeSprite(0, 0))).toThrow(/call pathfinding\.setup\(\)/);
  });

  test('isNavigating is false before any navigateTo call', () => {
    const pf = loadPathfinding();
    setupOpenGrid(pf);
    expect(pf.isNavigating(makeSprite(0, 0))).toBe(false);
  });

  test('computes a path and reports isNavigating true', () => {
    const pf = loadPathfinding();
    setupOpenGrid(pf);
    const sprite = makeSprite(5, 5); // row 0, col 0

    pf.navigateTo(sprite, 25, 5, 100); // target row 0, col 2

    expect(pf.isNavigating(sprite)).toBe(true);
  });

  test('isNavigating is false when start and target are the same cell', () => {
    const pf = loadPathfinding();
    setupOpenGrid(pf);
    const sprite = makeSprite(5, 5);

    pf.navigateTo(sprite, 5, 5, 100);

    expect(pf.isNavigating(sprite)).toBe(false);
  });

  test('isNavigating is false when the target is unreachable', () => {
    const pf = loadPathfinding();
    const map = [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ];
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer(map) }), ['walls']);
    const sprite = makeSprite(5, 5);

    pf.navigateTo(sprite, 25, 5, 100);

    expect(pf.isNavigating(sprite)).toBe(false);
  });

  test('stopNavigating clears nav state immediately', () => {
    const pf = loadPathfinding();
    setupOpenGrid(pf);
    const sprite = makeSprite(5, 5);
    pf.navigateTo(sprite, 25, 5, 100);

    pf.stopNavigating(sprite);

    expect(pf.isNavigating(sprite)).toBe(false);
  });

  test('does not throw when the target lands on a blocked/off-grid cell — snaps instead', () => {
    const pf = loadPathfinding();
    const map = [[1, 0, 0]];
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer(map) }), ['walls']);
    const sprite = makeSprite(15, 5); // row 0, col 1

    expect(() => pf.navigateTo(sprite, 5, 5, 100)).not.toThrow();
  });
});

describe('navigateTo recompute cooldown', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('a repeated call with the same target cell does not recompute the path', () => {
    const pf = loadPathfinding();
    setupOpenGrid(pf);
    const sprite = makeSprite(5, 5);

    vi.spyOn(performance, 'now').mockReturnValue(1000);
    pf.navigateTo(sprite, 25, 5, 100);
    const findPathSpy = vi.spyOn(pf, '_findPath');

    pf.navigateTo(sprite, 25, 5, 200); // same target cell, different speed

    expect(findPathSpy).not.toHaveBeenCalled();
  });

  test('updates speed even when the path is not recomputed', () => {
    const pf = loadPathfinding();
    setupOpenGrid(pf);
    const sprite = makeSprite(5, 5);

    pf.navigateTo(sprite, 25, 5, 100);
    pf.navigateTo(sprite, 25, 5, 250);

    expect(pf._navState.get(sprite).speed).toBe(250);
  });

  test('a target-cell change before the cooldown elapses does not recompute', () => {
    const pf = loadPathfinding();
    setupOpenGrid(pf);
    const sprite = makeSprite(5, 5);

    vi.spyOn(performance, 'now').mockReturnValue(1000);
    pf.navigateTo(sprite, 25, 5, 100); // target row 0, col 2

    vi.spyOn(performance, 'now').mockReturnValue(1050); // 50ms later; default cooldown is 200ms
    const findPathSpy = vi.spyOn(pf, '_findPath');
    pf.navigateTo(sprite, 5, 25, 100); // different target: row 2, col 0

    expect(findPathSpy).not.toHaveBeenCalled();
  });

  test('a target-cell change after the cooldown elapses recomputes the path', () => {
    const pf = loadPathfinding();
    setupOpenGrid(pf);
    const sprite = makeSprite(5, 5);

    vi.spyOn(performance, 'now').mockReturnValue(1000);
    pf.navigateTo(sprite, 25, 5, 100); // target row 0, col 2

    vi.spyOn(performance, 'now').mockReturnValue(1300); // 300ms later
    pf.navigateTo(sprite, 5, 25, 100); // different target: row 2, col 0

    expect(pf._navState.get(sprite).targetRow).toBe(2);
    expect(pf._navState.get(sprite).targetCol).toBe(0);
  });
});

describe('setRecomputeInterval', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('defaults to 200ms', () => {
    const pf = loadPathfinding();
    expect(pf._recomputeInterval).toBe(200);
  });

  test('changes the cooldown used by navigateTo', () => {
    const pf = loadPathfinding();
    setupOpenGrid(pf);
    pf.setRecomputeInterval(1000);
    const sprite = makeSprite(5, 5);

    vi.spyOn(performance, 'now').mockReturnValue(1000);
    pf.navigateTo(sprite, 25, 5, 100);

    vi.spyOn(performance, 'now').mockReturnValue(1500); // 500ms later — under the new 1000ms cooldown
    const findPathSpy = vi.spyOn(pf, '_findPath');
    pf.navigateTo(sprite, 5, 25, 100); // different target

    expect(findPathSpy).not.toHaveBeenCalled();
  });
});

describe('_pathfindingUpdate', () => {
  test('moves a navigating sprite toward its next waypoint by speed * delta (speed is px/sec, delta is ms)', () => {
    const pf = loadPathfinding();
    setupOpenGrid(pf);
    const sprite = makeSprite(5, 5); // row 0, col 0
    pf._sbInstances = [sprite];
    pf.navigateTo(sprite, 25, 5, 100); // target row 0, col 2; speed 100px/s

    pf._pathfindingUpdate(100); // 100ms = 0.1s -> 10px step

    expect(sprite._handle.position.x).toBeCloseTo(15, 5);
    expect(sprite._handle.position.y).toBeCloseTo(5, 5);
  });

  test('snaps to the waypoint and advances when within one step of it', () => {
    const pf = loadPathfinding();
    setupOpenGrid(pf);
    const sprite = makeSprite(5, 5);
    pf._sbInstances = [sprite];
    pf.navigateTo(sprite, 25, 5, 1000); // fast enough to overshoot the first waypoint this frame

    pf._pathfindingUpdate(100);

    expect(pf._navState.get(sprite)?.waypointIndex).toBeGreaterThanOrEqual(1);
  });

  test('clears nav state and stops isNavigating once the final waypoint is reached', () => {
    const pf = loadPathfinding();
    setupOpenGrid(pf);
    const sprite = makeSprite(5, 5);
    pf._sbInstances = [sprite];
    pf.navigateTo(sprite, 25, 5, 1000);

    for (let i = 0; i < 10; i++) pf._pathfindingUpdate(1000);

    expect(pf.isNavigating(sprite)).toBe(false);
    expect(sprite._handle.position.x).toBeCloseTo(25, 5);
    expect(sprite._handle.position.y).toBeCloseTo(5, 5);
  });

  test('drops nav state for a sprite no longer registered in _sbInstances, without moving it', () => {
    const pf = loadPathfinding();
    setupOpenGrid(pf);
    const sprite = makeSprite(5, 5);
    pf._sbInstances = [sprite];
    pf.navigateTo(sprite, 25, 5, 100);
    pf._sbInstances = []; // simulate world.remove(sprite)

    pf._pathfindingUpdate(100);

    expect(sprite._handle.position.x).toBe(5);
    expect(pf._navState.has(sprite)).toBe(false);
  });

  test('does nothing when no sprite is navigating', () => {
    const pf = loadPathfinding();
    setupOpenGrid(pf);
    pf._sbInstances = [];
    expect(() => pf._pathfindingUpdate(16)).not.toThrow();
  });
});

describe('_pathfindingReset', () => {
  test('clears the active grid and all nav state', () => {
    const pf = loadPathfinding();
    pf.setupNavGrid(makeTileMapSet({ walls: makeLayer([[0]]) }), ['walls']);
    pf._navState.set({}, { path: [], waypointIndex: 0 });

    pf._pathfindingReset();

    expect(pf._navGrid).toBe(null);
    expect(pf._navState.size).toBe(0);
  });
});
