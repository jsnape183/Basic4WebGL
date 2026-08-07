# Pathfinding Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `pathfinding` softBASIC module — A* over a `TileMapSet`'s flagged blocking layers, with a `navigateTo`/`isNavigating`/`stopNavigating` API — so sprites (e.g. bullet-hell enemies) can navigate around tilemap obstacles.

**Architecture:** A new self-contained engine file (`src/components/Runner/engine/pathfinding.js`, plain-object module following the `tilemap.js`/`camera.js` pattern) builds a flat precomputed walkability grid from a `TileMapSet`'s named layers, runs 8-directional A* with corner-cut prevention, and steps sprites along the resulting path each frame. Movement is driven the same way `camera.follow` already is — a hardcoded per-frame call from `scene.js`'s `_update`, since (unlike class instances) built-in engine modules have no generic `onupdate` auto-registration in this codebase. A matching `pathfinding.bas` def file exposes the API, following `collision.bas`'s call convention exactly.

**Tech Stack:** softBASIC transpiler (TypeScript), PIXI.js-backed JS engine runtime, Vitest.

**Design spec:** `docs/superpowers/specs/2026-08-07-pathfinding-design.md` (see its "Amendments" section for a correction found during this plan's research: the spec's claim that engine modules get an automatic `onupdate` hook "the same mechanism collision/world already rely on" was wrong — neither has one, and the real per-frame wiring is the hardcoded `scene.js` call described above).

---

## Before you start

Read `docs/superpowers/specs/2026-08-07-pathfinding-design.md` in full — it has the scope decisions (whole-layer blocking, 1:1 grid resolution, 8-directional movement with corner-cut prevention, snap-to-nearest-walkable for bad targets, throw-on-misuse) this plan implements without re-deriving.

**Naming convention reminder** (from `collision.bas`): a `.bas` function's softBASIC parameter names get prefixed `<lowercasedfunctionname>_` inside its `call("...")` string, e.g. `navigateto_sprite`. A `.bas` function that takes a class instance (e.g. a `Sprite`, `TileMapSet`) passes that instance **as-is** into the call string — it does **not** write `.{_handle}` itself. The receiving JS function is what reads `.{_handle}` off the value it's handed (see `collision.js`'s `spriteCollide(a, b)`, which does `a._handle`/`b._handle` internally). This matters for Task 9 — get it backwards and the transpiler tests will still pass (they only check the call shape, not runtime correctness), but the module will break at actual runtime.

---

### Task 1: Nav grid construction

**Files:**
- Create: `src/components/Runner/engine/pathfinding.js`
- Test: `tests/components/Runner/pathfinding.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/components/Runner/pathfinding.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/pathfinding.test.ts`
Expected: FAIL — `Cannot find module 'src/components/Runner/engine/pathfinding.js'` (file doesn't exist yet).

- [ ] **Step 3: Write the minimal implementation**

Create `src/components/Runner/engine/pathfinding.js`:

```js
const _sbPathfinding = {
  _navGrid: null,
  _navState: new Map(),
  _recomputeInterval: 200,

  setupNavGrid(tileMapSetObj, blockingLayerNames) {
    if (!tileMapSetObj || !tileMapSetObj._handle) {
      throw new Error('pathfinding.setup: expected a TileMapSet instance');
    }
    const layerContainers = tileMapSetObj._handle._layerContainers || {};

    const flaggedLayers = [];
    for (let i = 0; i < blockingLayerNames.length; i++) {
      const name = blockingLayerNames[i];
      const layer = layerContainers[name];
      if (!layer) {
        const available = Object.keys(layerContainers).join(', ') || '(none)';
        throw new Error(`pathfinding.setup: no layer named "${name}". Available layers: ${available}`);
      }
      flaggedLayers.push(layer);
    }

    const reference = Object.values(layerContainers)[0];
    if (!reference) {
      throw new Error('pathfinding.setup: TileMapSet has no layers');
    }

    const rows = reference._map.length;
    const cols = reference._map[0] ? reference._map[0].length : 0;
    const blocked = new Uint8Array(rows * cols);

    for (const layer of flaggedLayers) {
      for (let row = 0; row < rows; row++) {
        const layerRow = layer._map[row];
        if (!layerRow) continue;
        for (let col = 0; col < cols; col++) {
          if (layerRow[col]) blocked[row * cols + col] = 1;
        }
      }
    }

    this._navGrid = {
      blocked,
      rows,
      cols,
      tileW: reference._tileW,
      tileH: reference._tileH,
      reference,
    };
    this._navState.clear();
  },

  _isBlocked(row, col) {
    const grid = this._navGrid;
    if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) return true;
    return grid.blocked[row * grid.cols + col] === 1;
  },
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/pathfinding.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/pathfinding.js tests/components/Runner/pathfinding.test.ts
git commit -m "feat: pathfinding nav grid construction from TileMapSet layers"
```

---

### Task 2: World↔grid coordinate conversion

**Files:**
- Modify: `src/components/Runner/engine/pathfinding.js`
- Modify: `tests/components/Runner/pathfinding.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/pathfinding.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/pathfinding.test.ts`
Expected: FAIL — `pf._worldToCell is not a function`

- [ ] **Step 3: Write the minimal implementation**

Add these three methods to the `_sbPathfinding` object in `src/components/Runner/engine/pathfinding.js`, after `_isBlocked`:

```js
  _gridOffset() {
    let offsetX = 0;
    let offsetY = 0;
    let node = this._navGrid.reference;
    while (node && node !== worldContainer && node !== hudContainer) {
      offsetX += node.x;
      offsetY += node.y;
      node = node.parent;
    }
    return { offsetX, offsetY };
  },

  _worldToCell(worldX, worldY) {
    const grid = this._navGrid;
    const { offsetX, offsetY } = this._gridOffset();
    const col = Math.floor((Number(worldX) - offsetX) / grid.tileW);
    const row = Math.floor((Number(worldY) - offsetY) / grid.tileH);
    return { row, col };
  },

  _cellCenterWorld(row, col) {
    const grid = this._navGrid;
    const { offsetX, offsetY } = this._gridOffset();
    return {
      x: offsetX + col * grid.tileW + grid.tileW / 2,
      y: offsetY + row * grid.tileH + grid.tileH / 2,
    };
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/pathfinding.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/pathfinding.js tests/components/Runner/pathfinding.test.ts
git commit -m "feat: pathfinding world-to-grid coordinate conversion"
```

---

### Task 3: Nearest-walkable snapping

**Files:**
- Modify: `src/components/Runner/engine/pathfinding.js`
- Modify: `tests/components/Runner/pathfinding.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/pathfinding.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/pathfinding.test.ts`
Expected: FAIL — `pf._nearestWalkable is not a function`

- [ ] **Step 3: Write the minimal implementation**

Add these two methods to `_sbPathfinding`, after `_cellCenterWorld`:

```js
  _nearestWalkable(row, col) {
    const grid = this._navGrid;
    if (!this._isBlocked(row, col)) return { row, col };
    const maxRadius = Math.max(grid.rows, grid.cols);
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== radius) continue;
          const r = row + dr;
          const c = col + dc;
          if (r < 0 || r >= grid.rows || c < 0 || c >= grid.cols) continue;
          if (!this._isBlocked(r, c)) return { row: r, col: c };
        }
      }
    }
    return null;
  },

  _resolveTargetCell(worldX, worldY) {
    const cell = this._worldToCell(worldX, worldY);
    if (!this._isBlocked(cell.row, cell.col)) return cell;
    return this._nearestWalkable(cell.row, cell.col);
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/pathfinding.test.ts`
Expected: PASS (14 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/pathfinding.js tests/components/Runner/pathfinding.test.ts
git commit -m "feat: pathfinding nearest-walkable-cell snapping for blocked targets"
```

---

### Task 4: A* search

**Files:**
- Modify: `src/components/Runner/engine/pathfinding.js`
- Modify: `tests/components/Runner/pathfinding.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/pathfinding.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/pathfinding.test.ts`
Expected: FAIL — `pf._findPath is not a function`

- [ ] **Step 3: Write the minimal implementation**

Add a private min-heap factory and octile-distance helper **above** `const _sbPathfinding = {` in `src/components/Runner/engine/pathfinding.js` (matching `collision.js`'s pattern of private top-level helpers like `_slabTest`):

```js
function _createNavMinHeap() {
  const items = [];

  function push(key, f) {
    items.push({ key, f });
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent].f <= items[i].f) break;
      const tmp = items[parent];
      items[parent] = items[i];
      items[i] = tmp;
      i = parent;
    }
  }

  function pop() {
    const top = items[0];
    const last = items.pop();
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        const right = i * 2 + 2;
        let smallest = i;
        if (left < items.length && items[left].f < items[smallest].f) smallest = left;
        if (right < items.length && items[right].f < items[smallest].f) smallest = right;
        if (smallest === i) break;
        const tmp = items[smallest];
        items[smallest] = items[i];
        items[i] = tmp;
        i = smallest;
      }
    }
    return top.key;
  }

  return { size: () => items.length, push, pop };
}

function _octileDistance(r1, c1, r2, c2) {
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  return Math.max(dr, dc) + (Math.SQRT2 - 1) * Math.min(dr, dc);
}
```

Add these two methods to `_sbPathfinding`, after `_resolveTargetCell`:

```js
  _findPath(startRow, startCol, goalRow, goalCol) {
    if (this._isBlocked(goalRow, goalCol)) return null;
    if (startRow === goalRow && startCol === goalCol) return [];

    const cols = this._navGrid.cols;
    const key = (r, c) => r * cols + c;
    const goalKey = key(goalRow, goalCol);
    const startKey = key(startRow, startCol);

    const open = _createNavMinHeap();
    const gScore = new Map([[startKey, 0]]);
    const cameFrom = new Map();
    const visited = new Set();
    open.push(startKey, _octileDistance(startRow, startCol, goalRow, goalCol));

    const neighbors = [
      [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
      [-1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [1, 1, Math.SQRT2],
    ];

    while (open.size() > 0) {
      const currentKey = open.pop();
      if (visited.has(currentKey)) continue;
      visited.add(currentKey);
      if (currentKey === goalKey) {
        return this._reconstructPath(cameFrom, currentKey, cols);
      }

      const row = Math.floor(currentKey / cols);
      const col = currentKey % cols;

      for (const [dr, dc, cost] of neighbors) {
        const nr = row + dr;
        const nc = col + dc;
        if (this._isBlocked(nr, nc)) continue;
        if (dr !== 0 && dc !== 0 && (this._isBlocked(row + dr, col) || this._isBlocked(row, col + dc))) {
          continue;
        }
        const nKey = key(nr, nc);
        const tentativeG = gScore.get(currentKey) + cost;
        if (tentativeG < (gScore.get(nKey) ?? Infinity)) {
          gScore.set(nKey, tentativeG);
          cameFrom.set(nKey, currentKey);
          open.push(nKey, tentativeG + _octileDistance(nr, nc, goalRow, goalCol));
        }
      }
    }
    return null;
  },

  _reconstructPath(cameFrom, currentKey, cols) {
    const path = [];
    let k = currentKey;
    while (cameFrom.has(k)) {
      path.push({ row: Math.floor(k / cols), col: k % cols });
      k = cameFrom.get(k);
    }
    path.reverse();
    return path;
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/pathfinding.test.ts`
Expected: PASS (20 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/pathfinding.js tests/components/Runner/pathfinding.test.ts
git commit -m "feat: pathfinding A* search with 8-directional movement and corner-cut prevention"
```

---

### Task 5: navigateTo / isNavigating / stopNavigating + recompute cooldown

**Files:**
- Modify: `src/components/Runner/engine/pathfinding.js`
- Modify: `tests/components/Runner/pathfinding.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/pathfinding.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/pathfinding.test.ts`
Expected: FAIL — `pf.navigateTo is not a function`

- [ ] **Step 3: Write the minimal implementation**

Add these four methods to `_sbPathfinding`, after `_reconstructPath`:

```js
  setRecomputeInterval(ms) {
    this._recomputeInterval = Number(ms);
  },

  navigateTo(spriteObj, worldX, worldY, speed) {
    if (!this._navGrid) {
      throw new Error('pathfinding.navigateTo: call pathfinding.setup() before navigateTo()');
    }
    if (!spriteObj || !spriteObj._handle) return;

    const targetCell = this._resolveTargetCell(worldX, worldY);
    if (!targetCell) {
      this._navState.delete(spriteObj);
      return;
    }

    const state = this._navState.get(spriteObj);
    const now = performance.now();

    if (state) {
      state.speed = Number(speed);
      const targetChanged = state.targetRow !== targetCell.row || state.targetCol !== targetCell.col;
      const cooldownElapsed = now - state.lastRecomputeTime >= this._recomputeInterval;
      if (!targetChanged || !cooldownElapsed) {
        return;
      }
    }

    const startCell = this._worldToCell(spriteObj._handle.position.x, spriteObj._handle.position.y);
    const path = this._findPath(startCell.row, startCell.col, targetCell.row, targetCell.col);

    if (!path) {
      this._navState.delete(spriteObj);
      return;
    }

    this._navState.set(spriteObj, {
      path,
      waypointIndex: 0,
      speed: Number(speed),
      targetRow: targetCell.row,
      targetCol: targetCell.col,
      lastRecomputeTime: now,
    });
  },

  isNavigating(spriteObj) {
    if (!this._navGrid) {
      throw new Error('pathfinding.isNavigating: call pathfinding.setup() before isNavigating()');
    }
    const state = this._navState.get(spriteObj);
    return !!(state && state.waypointIndex < state.path.length);
  },

  stopNavigating(spriteObj) {
    if (!this._navGrid) {
      throw new Error('pathfinding.stopNavigating: call pathfinding.setup() before stopNavigating()');
    }
    this._navState.delete(spriteObj);
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/pathfinding.test.ts`
Expected: PASS (35 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/pathfinding.js tests/components/Runner/pathfinding.test.ts
git commit -m "feat: pathfinding navigateTo/isNavigating/stopNavigating with recompute cooldown"
```

---

### Task 6: Movement stepping + wire into scene.js's per-frame update

**Files:**
- Modify: `src/components/Runner/engine/pathfinding.js`
- Modify: `src/components/Runner/engine/scene.js:41-49`
- Modify: `tests/components/Runner/pathfinding.test.ts`
- Create: `tests/components/Runner/scene.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/pathfinding.test.ts`:

```ts
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
```

Create `tests/components/Runner/scene.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect, vi } from 'vitest';

// engine/scene.js is a plain script (not an ES module) — it declares a bare
// `const _sbScene` and reads a `_sbLifecycle` global the bootstrapper
// concatenates in. Evaluate it in a Function context with that supplied, the
// same technique camera.test.ts/lifecycle.test.ts use. The methods it calls
// on `this` (`_cameraUpdate`, `_pathfindingUpdate`, `_resetFrameInput`) come
// from other engine modules at runtime (via the `_sb` spread) — here they're
// stubbed directly on the returned object, the same way FakeContainer stubs
// PIXI in other engine tests.
function loadScene() {
  const src = readFileSync('src/components/Runner/engine/scene.js', 'utf-8');
  const lifecycle = { _update: vi.fn() };
  const factory = new Function('_sbLifecycle', `${src}\n return _sbScene;`);
  const scene = factory(lifecycle);
  scene._cameraUpdate = vi.fn();
  scene._pathfindingUpdate = vi.fn();
  scene._resetFrameInput = vi.fn();
  return scene;
}

describe('_sbScene._update — pathfinding movement wiring', () => {
  test('calls _pathfindingUpdate(delta) every frame, alongside _cameraUpdate', () => {
    const scene = loadScene();

    scene._update(16.67);

    expect(scene._pathfindingUpdate).toHaveBeenCalledWith(16.67);
    expect(scene._cameraUpdate).toHaveBeenCalledWith(16.67);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/pathfinding.test.ts tests/components/Runner/scene.test.ts`
Expected: FAIL — `pf._pathfindingUpdate is not a function` (pathfinding.test.ts) and the `_pathfindingUpdate` assertion failing with 0 calls (scene.test.ts).

- [ ] **Step 3: Write the minimal implementation**

Add this method to `_sbPathfinding`, after `stopNavigating` (in `src/components/Runner/engine/pathfinding.js`):

```js
  _pathfindingUpdate(delta) {
    if (this._navState.size === 0) return;
    for (const [spriteObj, state] of this._navState) {
      if (!this._sbInstances.includes(spriteObj)) {
        this._navState.delete(spriteObj);
        continue;
      }
      if (state.waypointIndex >= state.path.length) {
        this._navState.delete(spriteObj);
        continue;
      }
      const waypoint = state.path[state.waypointIndex];
      const target = this._cellCenterWorld(waypoint.row, waypoint.col);
      const handle = spriteObj._handle;
      const dx = target.x - handle.position.x;
      const dy = target.y - handle.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = state.speed * (delta / 1000);

      if (dist <= step || dist === 0) {
        handle.position.x = target.x;
        handle.position.y = target.y;
        state.waypointIndex += 1;
      } else {
        handle.position.x += (dx / dist) * step;
        handle.position.y += (dy / dist) * step;
      }
    }
  },
```

In `src/components/Runner/engine/scene.js`, wire it into the per-frame `_update` alongside `_cameraUpdate` — this mirrors how camera movement is already driven, since (as confirmed while researching this plan) built-in engine modules have no generic auto-`onupdate` registration; `_sbClasses` only ever receives entries from transpiled user-authored softBASIC modules/classes, never from engine JS files:

```js
  _update(delta) {
    _sbLifecycle._update.call(this, delta);
    if (this._activeScene && this._activeScene.onupdate) {
      try { this._activeScene.onupdate(delta); } catch(e) { _throwError(e); }
    }
    this._applySwitch();
    this._cameraUpdate(delta);
    this._pathfindingUpdate(delta);
    this._resetFrameInput();
  },
```

(That's the existing method with one new line, `this._pathfindingUpdate(delta);`, added right after `this._cameraUpdate(delta);`.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/pathfinding.test.ts tests/components/Runner/scene.test.ts`
Expected: PASS (40 tests in pathfinding.test.ts, 1 test in scene.test.ts)

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/pathfinding.js src/components/Runner/engine/scene.js tests/components/Runner/pathfinding.test.ts tests/components/Runner/scene.test.ts
git commit -m "feat: pathfinding per-frame movement stepping, wired into scene update"
```

---

### Task 7: Reset nav state on scene clear

**Files:**
- Modify: `src/components/Runner/engine/pathfinding.js`
- Modify: `src/components/Runner/engine/stage.js:56-62`
- Modify: `tests/components/Runner/pathfinding.test.ts`
- Modify: `tests/components/Runner/stage.test.ts`

Without this, switching scenes leaves the previous scene's nav grid active. Since `world.clear()`/scene-switch already empties `_sbInstances`, `_pathfindingUpdate` would self-heal the *nav state* on its own next tick — but `_navGrid` itself (which layer containers it points at) would stay stale, so a new scene that calls `navigateTo` without first calling `setup()` would silently path against the *previous* scene's map instead of getting the "call setup() first" error it should. `camera` resets itself the same way (`_cameraReset()` inside `clear()`) — `pathfinding` needs the same treatment.

- [ ] **Step 1: Write the failing tests**

Append to `tests/components/Runner/pathfinding.test.ts`:

```ts
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
```

Append to `tests/components/Runner/stage.test.ts` (below the existing describes — it defines its own minimal loader rather than reusing `loadEngine`, since it only needs `_sbStage` in isolation with `_cameraReset`/`_pathfindingReset` stubbed, the same way `scene.test.ts` stubs `_pathfindingUpdate`):

```ts
describe('clear() resets pathfinding state alongside the camera', () => {
  function loadStageOnly() {
    const src = readFileSync('src/components/Runner/engine/stage.js', 'utf-8');
    const PIXI = { Container: FakeContainer };
    const app = { stage: new FakeContainer(), renderer: { width: 640, height: 360, background: { color: 0 } } };
    const factory = new Function('PIXI', 'app', `${src}\n return _sbStage;`);
    const stage = factory(PIXI, app);
    stage._sbInstances = [];
    stage._initStage();
    return stage;
  }

  test('calls _pathfindingReset()', () => {
    const stage = loadStageOnly();
    stage._cameraReset = vi.fn();
    stage._pathfindingReset = vi.fn();

    stage.clear();

    expect(stage._pathfindingReset).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/pathfinding.test.ts tests/components/Runner/stage.test.ts`
Expected: FAIL — `pf._pathfindingReset is not a function` (pathfinding.test.ts) and the new stage.test.ts assertion failing with 0 calls.

- [ ] **Step 3: Write the minimal implementation**

Add this method to `_sbPathfinding`, after `_isBlocked` (in `src/components/Runner/engine/pathfinding.js`):

```js
  _pathfindingReset() {
    this._navGrid = null;
    this._navState.clear();
  },
```

In `src/components/Runner/engine/stage.js`, add the reset call to `clear()`:

```js
  clear() {
    worldContainer.removeChildren();
    hudContainer.removeChildren();
    // Emptied in place, never replaced — see _retainInstances in lifecycle.js.
    this._sbInstances.length = 0;
    this._cameraReset();
    this._pathfindingReset();
  },
```

(That's the existing method with one new line, `this._pathfindingReset();`, added right after `this._cameraReset();`.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/pathfinding.test.ts tests/components/Runner/stage.test.ts`
Expected: PASS (41 tests in pathfinding.test.ts; all stage.test.ts tests including the new one)

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/pathfinding.js src/components/Runner/engine/stage.js tests/components/Runner/pathfinding.test.ts tests/components/Runner/stage.test.ts
git commit -m "feat: reset pathfinding nav state on scene clear"
```

---

### Task 8: Wire pathfinding.js into the runtime bundle

**Files:**
- Modify: `src/components/Runner/index.tsx:12-16,44`
- Modify: `src/components/Runner/softBasicEngine.js`
- Modify: `tests/components/Runner/stage.test.ts:13-28`

This makes `pathfinding` a real part of `_sb` at runtime (it only existed as a standalone file under isolated test harnesses until now) and adds it to the full-engine integration test's module list, so the existing `_sb`-spread regression coverage in `stage.test.ts` exercises it too.

- [ ] **Step 1: Write the failing test**

Modify `tests/components/Runner/stage.test.ts` — add `'pathfinding'` to the `ENGINE_MODULES` array (insert after `'collision'`, matching the position it'll have in `index.tsx`):

```ts
const ENGINE_MODULES = [
  'lifecycle',
  'input',
  'assets',
  'file',
  'save',
  'audio',
  'drawing',
  'stage',
  'sprites',
  'animatedSprite',
  'tilemap',
  'collision',
  'pathfinding',
  'scene',
  'camera',
];
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/stage.test.ts`
Expected: FAIL — `ENOENT: no such file or directory, open 'src/components/Runner/engine/pathfinding.js'`... actually the file already exists from Task 1, so instead expect a `ReferenceError` or similar from `_sb._update`/`_sb.clear()` calls if `_sbPathfinding`'s methods (e.g. `_pathfindingUpdate`, referencing `worldContainer`) aren't yet reachable via the full concatenation+spread — in practice this will most likely still PASS as-is, since `pathfinding.js` alone doesn't break anything by simply not being in the list yet. Treat this step as a checkpoint rather than a strict red/green gate: confirm the suite runs clean before proceeding, then continue to Step 3 regardless.

- [ ] **Step 3: Wire the module in**

In `src/components/Runner/index.tsx`, add the import (after `sbCollision`, before `sbScene`):

```tsx
import sbCollision from './engine/collision.js?raw';
import sbPathfinding from './engine/pathfinding.js?raw';
import sbScene from './engine/scene.js?raw';
```

And add `sbPathfinding` to the concatenation array in the same file:

```tsx
            [sbLifecycle, sbInput, sbAssets, sbFile, sbSave, sbAudio, sbDrawing, sbStage, sbSprites, sbAnimatedSprites, sbTilemaps, sbCollision, sbPathfinding, sbScene, sbCamera, softBasicEngine].join('\n')
```

In `src/components/Runner/softBasicEngine.js`, add `_sbPathfinding` to the `_sb` spread (after `_sbCollision`):

```js
const _sb = {
  ..._sbLifecycle,
  ..._sbScene,
  ..._sbInput,
  ..._sbAssets,
  ..._sbFile,
  ..._sbSave,
  ..._sbAudio,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbCamera,
  ..._sbSprites,
  ..._sbAnimatedSprites,
  ..._sbTilemaps,
  ..._sbCollision,
  ..._sbPathfinding,
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/stage.test.ts`
Expected: PASS (all existing tests still pass with `pathfinding` now part of the full-engine concatenation)

Also run the full test suite once here as a broader integration check, since this task touches shared bootstrapping files:

Run: `npx vitest run`
Expected: PASS (no regressions in any other engine/transpiler test)

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/index.tsx src/components/Runner/softBasicEngine.js tests/components/Runner/stage.test.ts
git commit -m "feat: wire pathfinding module into the runtime engine bundle"
```

---

### Task 9: `pathfinding.bas` definition file

**Files:**
- Create: `src/lib/Basic4WebGL/defs/pathfinding.bas`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/pathfinding.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/lib/Basic4WebGL/unit/transpiler/pathfinding.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const pathfindingSource = readFileSync('src/lib/Basic4WebGL/defs/pathfinding.bas', 'utf-8');
const arraySource = readFileSync('src/lib/Basic4WebGL/defs/array.bas', 'utf-8');

const transpileWithPathfinding = (source: string) =>
  compiler.transpile({
    lib: [
      { name: 'pathfinding', source: pathfindingSource },
      { name: 'array', source: arraySource },
    ],
    files: [{ name: 'Main.bas', source }],
  });

// ─── setup ──────────────────────────────────────────────────────────────────

describe('pathfinding — setup', () => {
  test('compiles without error', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim tm',
      '  dim layers(0)',
      '  array.push(layers, "walls")',
      '  pathfinding.setup(tm, layers)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.setupNavGrid( and passes the TileMapSet instance directly (no ._handle in the call string)', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim tm',
      '  dim layers(0)',
      '  array.push(layers, "walls")',
      '  pathfinding.setup(tm, layers)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.setupNavGrid(');
    expect(result.code).not.toContain('setup_tm._handle');
  });
});

// ─── setRecomputeInterval ───────────────────────────────────────────────────

describe('pathfinding — setRecomputeInterval', () => {
  test('compiles without error', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  pathfinding.setRecomputeInterval(200)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.setRecomputeInterval(', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  pathfinding.setRecomputeInterval(200)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.setRecomputeInterval(');
  });
});

// ─── navigateTo ─────────────────────────────────────────────────────────────

describe('pathfinding — navigateTo', () => {
  test('compiles without error', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim enemy',
      '  pathfinding.navigateTo(enemy, 100, 200, 120)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.navigateTo( and passes the sprite instance directly', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim enemy',
      '  pathfinding.navigateTo(enemy, 100, 200, 120)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.navigateTo(');
    expect(result.code).not.toContain('navigateto_enemy._handle');
  });
});

// ─── isNavigating ───────────────────────────────────────────────────────────

describe('pathfinding — isNavigating', () => {
  test('compiles without error', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim enemy',
      '  dim navigating',
      '  navigating = pathfinding.isNavigating(enemy)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.isNavigating(', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim enemy',
      '  dim navigating',
      '  navigating = pathfinding.isNavigating(enemy)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.isNavigating(');
  });
});

// ─── stopNavigating ─────────────────────────────────────────────────────────

describe('pathfinding — stopNavigating', () => {
  test('compiles without error', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim enemy',
      '  pathfinding.stopNavigating(enemy)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.stopNavigating(', () => {
    const result = transpileWithPathfinding([
      'function test()',
      '  dim enemy',
      '  pathfinding.stopNavigating(enemy)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.stopNavigating(');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/pathfinding.test.ts`
Expected: FAIL — `ENOENT: no such file or directory, open 'src/lib/Basic4WebGL/defs/pathfinding.bas'`

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/Basic4WebGL/defs/pathfinding.bas`:

```bas
function setup(tileMapSet, blockingLayers)
    call("_sb.setupNavGrid(setup_tileMapSet, setup_blockingLayers)")
endfunction

function setRecomputeInterval(ms)
    call("_sb.setRecomputeInterval(setrecomputeinterval_ms)")
endfunction

function navigateTo(sprite, x, y, speed)
    call("_sb.navigateTo(navigateto_sprite, navigateto_x, navigateto_y, navigateto_speed)")
endfunction

function isNavigating(sprite)
    return call("_sb.isNavigating(isnavigating_sprite)")
endfunction

function stopNavigating(sprite)
    call("_sb.stopNavigating(stopnavigating_sprite)")
endfunction
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/pathfinding.test.ts`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/defs/pathfinding.bas tests/lib/Basic4WebGL/unit/transpiler/pathfinding.test.ts
git commit -m "feat: pathfinding.bas definition file"
```

---

### Task 10: Register the module in the softGfx package

**Files:**
- Modify: `src/constants/firstPartyPackages.ts`

`pathfinding` needs to be in `moduleNames` for projects to be able to use it at all — this is the same registration every prior module addition required (confirmed via `git log`: e.g. `tilemapset`/`tilemaplayer`'s addition bumped `softgfx` from `2.2.0` to `2.3.0`). There's no dedicated test file for this constant elsewhere in the codebase (`softgfx.test.ts` tests behavior, not this list directly) — verified by the full suite run in Task 13.

- [ ] **Step 1: Make the change**

In `src/constants/firstPartyPackages.ts`, bump the version and add `pathfinding` to `moduleNames` (insert after `collision`):

```ts
import { IPackage } from '../features/packages/packagesSlice';

export const firstPartyPackages: IPackage[] = [
  {
    id: 'softcore',
    name: 'softCore',
    version: '1.1.0',
    isCore: true,
    isFirstParty: true,
    moduleNames: ['math', 'string', 'array', 'dict', 'file', 'save'],
  },
  {
    id: 'softgfx',
    name: 'softGfx',
    version: '2.4.0',
    isCore: false,
    isFirstParty: true,
    moduleNames: ['gfx', 'input', 'drawing', 'stage', 'pen', 'assetmanager', 'ObjectTransform', 'sprite', 'animatedsprite', 'text', 'tilemap', 'tilemaplayer', 'tilemapset', 'audio', 'collision', 'pathfinding', 'rayhit', 'scene', 'scenemanager', 'camera', 'world', 'hud'],
  },
];
```

- [ ] **Step 2: Verify no regressions**

Run: `npx vitest run`
Expected: PASS (full suite, no test asserts an exact `moduleNames` snapshot for `softgfx`, so this is a safety check rather than a red/green TDD step)

- [ ] **Step 3: Commit**

```bash
git add src/constants/firstPartyPackages.ts
git commit -m "feat: register pathfinding in the softGfx package"
```

---

### Task 11: API reference docs

**Files:**
- Create: `src/docs/api-reference/pathfinding.md`
- Modify: `src/docs/manifest.ts`
- Modify: `src/docs/api-reference/tilemapset.md`

- [ ] **Step 1: Create the API reference page**

Create `src/docs/api-reference/pathfinding.md`, following `collision.md`'s structure (module intro, one `##` section per function, parameter table, `**Returns:**` line, `.bas` example):

```markdown
# pathfinding

The `pathfinding` module lets sprites navigate around obstacles defined by a `TileMapSet`'s layers, using pathfinding to route around walls instead of moving in a straight line. Include the **softGfx** package to use it.

## setup(tileMapSet, blockingLayers)

Builds the navigation grid from a `TileMapSet`, using the named layers as obstacles. Call this once, typically when a scene starts. Calling it again (for example on a scene change) replaces the previous grid.

Any layer not listed in `blockingLayers` is ignored for navigation — a good fit for decorative "floor" or "background" layers that shouldn't block movement.

| Parameter      | Type   | Description |
|----------------|--------|-------------|
| tileMapSet     | object | The TileMapSet to build the navigation grid from |
| blockingLayers | array  | Names of the layers whose tiles block movement |

```bas
dim layers(0)
array.push(layers, "walls")
array.push(layers, "obstacles")
pathfinding.setup(tileMapSet, layers)
```

## setRecomputeInterval(ms)

Sets the minimum time, in milliseconds, between path recalculations for a single sprite. Optional — defaults to `200`. Calling `navigateTo` every frame with a moving target (like a chasing enemy) is designed to be cheap: a new path is only calculated when the target has moved to a different tile **and** this interval has passed since the last calculation.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| ms        | number | Minimum milliseconds between path recalculations |

```bas
pathfinding.setRecomputeInterval(300)
```

## navigateTo(sprite, x, y, speed)

Moves a sprite toward `(x, y)`, routing around any blocking tiles. Call this every frame — for example from an enemy's `onupdate` — passing the target's current position; it's safe and cheap to call repeatedly even while already navigating.

If `(x, y)` lands on a blocked or off-grid tile, the sprite paths to the nearest walkable tile instead.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| sprite    | object | The sprite to move |
| x         | number | Target x position |
| y         | number | Target y position |
| speed     | number | Movement speed in pixels per second |

```bas
class Enemy
  dim sprite

  function onupdate(delta)
    pathfinding.navigateTo(self.sprite, player.x(), player.y(), 120)
  endfunction
endclass
```

## isNavigating(sprite)

Checks whether a sprite is currently following a path.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| sprite    | object | The sprite to check |

**Returns:** `true` if the sprite is still moving toward its target, `false` if it has arrived, was never given a target, or no path could be found.

```bas
if pathfinding.isNavigating(enemy.sprite) = false then
  playAttackAnimation()
endif
```

## stopNavigating(sprite)

Immediately stops a sprite's navigation. The sprite stops where it is — call `navigateTo` again to resume.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| sprite    | object | The sprite to stop |

```bas
pathfinding.stopNavigating(enemy.sprite)
```
```

- [ ] **Step 2: Register the page in the docs manifest**

In `src/docs/manifest.ts`, add a `pathfinding` entry to the `softGfx` group's `topics` array, after `collision`:

```ts
          { slug: 'collision',       title: 'collision',       file: 'api-reference/collision.md' },
          { slug: 'pathfinding',     title: 'pathfinding',     file: 'api-reference/pathfinding.md' },
          { slug: 'scene',           title: 'scene / scenemanager', file: 'api-reference/scene.md' },
```

- [ ] **Step 3: Cross-link from tilemapset.md**

In `src/docs/api-reference/tilemapset.md`, add a short pointer near the top of the file (right after the intro paragraph) so readers researching multi-layer maps discover navigation:

```markdown
For pathfinding around a `TileMapSet`'s obstacle layers, see [pathfinding](pathfinding).
```

- [ ] **Step 4: Verify the docs build**

Run: `npx vite build`
Expected: build succeeds (this catches a manifest/markdown-loading mistake, e.g. a bad slug or missing file, the same way it would for any other docs page)

- [ ] **Step 5: Commit**

```bash
git add src/docs/api-reference/pathfinding.md src/docs/manifest.ts src/docs/api-reference/tilemapset.md
git commit -m "docs: add pathfinding API reference page"
```

---

### Task 12: Roadmap sync

**Files:**
- Modify: `docs/language/library-roadmap.md`

- [ ] **Step 1: Add the module table row**

In `docs/language/library-roadmap.md`'s "Existing modules" table (under `## Current State`), add a `pathfinding` row after the `collision` row:

```markdown
| `collision` | `spriteCollide(a,b)` `boxCollide(...)` `circleCollide(a,rA,b,rB)` `pointInBox(x,y,sprite)` `raycast(x,y,angle,dist,sprites)` `raycastAll(...)` |
| `pathfinding` | `setup(tileMapSet,blockingLayers)` `setRecomputeInterval(ms)` `navigateTo(sprite,x,y,speed)` `isNavigating(sprite)` `stopNavigating(sprite)` |
```

- [ ] **Step 2: Add a Priorities write-up entry**

Under `## Priorities`, after the `~~P12 — Pixel-art texture filtering~~` entry, add:

```markdown
### ~~P13 — Pathfinding~~ **[DONE]**
Shipped as the `pathfinding` module (`pathfinding.bas` + `src/components/Runner/engine/pathfinding.js`). Built to unblock the upcoming bullet-hell shooter demo's enemy AI. A* over a flat precomputed walkability grid built from a `TileMapSet`'s named layers (`pathfinding.setup(tileMapSet, blockingLayers)` — any non-zero tile in a listed layer blocks that cell; unlisted layers, like decorative floors, are ignored), 8-directional with corner-cut prevention, octile-distance heuristic.

`navigateTo(sprite, x, y, speed)` is designed to be called every frame with the target's current position (e.g. `player.x()`, `player.y()` from an enemy's `onupdate`) — cheap to call repeatedly, since a fresh path is only computed when the target has moved to a new grid cell **and** `setRecomputeInterval`'s cooldown (default 200ms) has elapsed since the last computation. A target on a blocked or off-grid tile snaps to the nearest walkable tile rather than failing.

Movement itself is driven by a hardcoded per-frame call from `scene.js`'s `_update` (`this._pathfindingUpdate(delta)`, alongside the existing `this._cameraUpdate(delta)`) — **not** the generic `_sbClasses`/`onupdate` auto-dispatch mechanism, which only ever receives entries from transpiled user-authored softBASIC modules/classes, never from built-in engine JS files. This was discovered during implementation planning: the original design spec assumed collision/world-style modules got an automatic per-frame hook "the same mechanism `collision`/`world` already rely on" — neither of those actually has one, so the assumption was wrong. `camera.follow`'s existing hardcoded-call pattern turned out to be the real precedent to follow instead.

Nav state resets alongside camera state in `stage.js`'s `clear()` (`this._pathfindingReset()`), so a scene switch can't leave a stale grid from the previous scene silently active.

**Not built:** shared flow-field/Dijkstra-map optimization for many-agents-to-one-target (every sprite computes its own path independently, bounded by the recompute cooldown); dynamic obstacle avoidance (other sprites don't block computed paths, only the tilemap does); per-tile-ID blocking within a flagged layer (whole-layer only).

Design spec: `docs/superpowers/specs/2026-08-07-pathfinding-design.md`. Tests: `tests/components/Runner/pathfinding.test.ts`, `tests/components/Runner/scene.test.ts`, `tests/components/Runner/stage.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/pathfinding.test.ts`. Docs: `src/docs/api-reference/pathfinding.md`.
```

- [ ] **Step 3: Commit**

```bash
git add docs/language/library-roadmap.md
git commit -m "docs: roadmap sync for pathfinding module"
```

---

### Task 13: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — every test file in the repo, including all new files from this plan (`pathfinding.test.ts` ×2, `scene.test.ts`, plus the modified `stage.test.ts`), with zero failures.

- [ ] **Step 2: Run the build**

Run: `npx vite build`
Expected: build succeeds with no errors (per `CLAUDE.md`, this is the project's standard verification command — do **not** use `tsc --noEmit`, which has unrelated pre-existing `tsconfig.node.json` issues).

- [ ] **Step 3: Manual smoke check (optional but recommended before considering this done)**

There's no published tutorial or demo using `pathfinding` yet, so there's no existing Cypress spec to run against it, and none is added in this plan (per the design spec's Testing section — that lands with the eventual bullet-hell demo's own `demos.cy.ts` entry). If you want a live sanity check before moving on to demo work, build a throwaway project in the app: a `TileMapSet` with one blocking "walls" layer, a sprite, and:

```bas
pathfinding.setup(tm, layers)

function onupdate(delta)
  pathfinding.navigateTo(enemy, player.x(), player.y(), 100)
endfunction
```

and confirm the enemy sprite visibly routes around walls toward the player rather than clipping through them.

No commit for this task — it's a checkpoint, not a change.
