# Kinematic Movement + Tile Collision (Component 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give sprites a velocity-based movement primitive (`setVelocity`/`velocityX`/`velocityY`) that the engine applies automatically every frame, and — when `collision.setupTileCollision(tileMapSet)` has been called — automatically clips that movement against the merged solid-cell grid from every `'collision'`-kind tilemap layer (Component 1, already shipped), reporting which side got blocked via `isBlockedUp/Down/Left/Right()`.

**Architecture:** Velocity is stored directly on each sprite's PIXI handle (`_sbVelocityX`/`_sbVelocityY`), shared machinery keyed off the handle itself rather than which softBASIC class wraps it (`sprite` and `animatedsprite` are independent hand-written `.bas` classes, not `Extends`-related, so both get thin method wrappers calling the same `_sb.*` functions). `lifecycle.js`'s existing per-instance `_update(delta)` loop applies velocity immediately after each instance's own `onupdate` runs. Collision resolution is axis-separated (X moves+clips, then Y moves+clips against the *updated* bounds) using `getBounds()` — the same technique `collision.spriteCollide` already uses — giving wall-sliding for free with no extra author code.

**Tech Stack:** softBASIC compiler (descriptor-generated `.bas` defs), PIXI.js runtime engine modules, Vitest, Cypress.

---

## Prerequisite reading (context, not a task)

- Design doc: `docs/superpowers/specs/2026-08-12-kinematic-tile-collision-design.md` — read this first, this plan implements it exactly.
- Component 1 (already shipped): `docs/superpowers/plans/2026-08-12-tilemap-collision-layer-plan.md` — the `.stm` collision-layer format and `tilemap.js`'s loader branch this plan builds on.
- `src/components/Runner/engine/pathfinding.js` — the existing precedent for "merge blocking layers into a solid grid, walk the parent chain for world offset." This plan's `setupTileCollision` deliberately diverges from it in one place (see Task 3's comment on why the *reference node* can't be a collision layer container) — know the precedent before reading why it's different.

## A note on why `setupTileCollision`'s offset reference differs from `pathfinding.setup`'s

`pathfinding.setup` computes world offset by walking `reference.parent` up to `worldContainer`/`hudContainer`, where `reference` is one of the *layer containers themselves*. That works for pathfinding because its blocking layers are ordinary tile layers, which `tilemap.js` adds as children of the TileMapSet's own wrapping container (`handle.addChild(container)`).

Collision layers are different: `tilemap.js` (Component 1) deliberately does **not** call `handle.addChild(container)` for a `'collision'`-kind layer — it has no tile art, so it's never parented into the scene graph at all. If `setupTileCollision` walked `collisionLayer.parent` the same way pathfinding walks `layer.parent`, the walk would stop after one step (its `.parent` is `null`), silently returning offset `(0, 0)` — wrong the moment a game repositions the TileMapSet itself (e.g. `tileMapSet.transform.setPosition(x, y)` to scroll a level, a realistic thing to do, unlike pathfinding's more static usage so far).

Fix used in this plan: `setupTileCollision` stores the TileMapSet's own top-level `_handle` (always attached to the scene graph once the author calls `world.add(tileMapSet)`, since every layer — tile art, markers, and collision — shares that same wrapping container's position) as the offset-walk reference, not a per-layer container. Every collision layer shares that same effective position regardless of which one is "first," so this is correct and simpler than pathfinding's per-layer approach, not just a workaround.

---

### Task 1: Sprite velocity storage (`sprites.js`)

**Files:**
- Modify: `src/components/Runner/engine/sprites.js`
- Test: `tests/components/Runner/sprites.test.ts` (new file — no engine-level test currently exists for this file; it's only covered indirectly via the transpiler/Cypress layers today)

- [ ] **Step 1: Write the failing test**

Create `tests/components/Runner/sprites.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/sprites.js is a plain script (not an ES module) — it declares a bare
// `const _sbSprites`. Evaluate it in a Function context, the same technique
// pathfinding.test.ts/lifecycle.test.ts use for their sibling engine files.
function loadSprites() {
  const src = readFileSync('src/components/Runner/engine/sprites.js', 'utf-8');
  const factory = new Function(`${src}\n return _sbSprites;`);
  return factory();
}

describe('setVelocity / getVelocityX / getVelocityY', () => {
  test('stores velocity components, readable back via the getters', () => {
    const sprites = loadSprites();
    const handle: Record<string, unknown> = {};
    sprites.setVelocity(handle, 100, -50);
    expect(sprites.getVelocityX(handle)).toBe(100);
    expect(sprites.getVelocityY(handle)).toBe(-50);
  });

  test('coerces string arguments to numbers, matching every other setter in this file', () => {
    const sprites = loadSprites();
    const handle: Record<string, unknown> = {};
    sprites.setVelocity(handle, '30', '-20');
    expect(sprites.getVelocityX(handle)).toBe(30);
    expect(sprites.getVelocityY(handle)).toBe(-20);
  });

  test('defaults to 0 on a handle that never had setVelocity called', () => {
    const sprites = loadSprites();
    const handle: Record<string, unknown> = {};
    expect(sprites.getVelocityX(handle)).toBe(0);
    expect(sprites.getVelocityY(handle)).toBe(0);
  });

  test('setting velocity on one handle does not affect another', () => {
    const sprites = loadSprites();
    const a: Record<string, unknown> = {};
    const b: Record<string, unknown> = {};
    sprites.setVelocity(a, 10, 10);
    expect(sprites.getVelocityX(b)).toBe(0);
    expect(sprites.getVelocityY(b)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/Runner/sprites.test.ts`
Expected: FAIL — `sprites.setVelocity is not a function`.

- [ ] **Step 3: Add the methods to `sprites.js`**

In `src/components/Runner/engine/sprites.js`, add these three methods to the `_sbSprites` object, right after `getPositionY` (keeps velocity next to position, both plain-property storage on the handle):

```js
  setVelocity(obj, vx, vy) {
    obj._sbVelocityX = Number(vx);
    obj._sbVelocityY = Number(vy);
  },
  getVelocityX(obj) {
    return obj._sbVelocityX || 0;
  },
  getVelocityY(obj) {
    return obj._sbVelocityY || 0;
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/Runner/sprites.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/sprites.js tests/components/Runner/sprites.test.ts
git commit -m "feat: add velocity storage to sprite engine handle"
```

---

### Task 2: Mark collision-kind tilemap layers (`tilemap.js`)

**Files:**
- Modify: `src/components/Runner/engine/tilemap.js`
- Test: `tests/components/Runner/tilemap.test.ts`

`setupTileCollision` (Task 3) needs a way to find which layers in a `TileMapSet` are collision layers versus tile-art layers — both currently store a `_map`, so `_map` presence alone doesn't distinguish them. Tag collision containers at load time.

- [ ] **Step 1: Write the failing test**

Add to `tests/components/Runner/tilemap.test.ts` (find the existing `describe` block covering the collision-layer loader branch from Component 1 — TCL-Task 5 — and add this test alongside it; if you can't find one, add a new top-level `describe`):

```ts
describe('collision layer tagging', () => {
  test('a collision-kind layer container is flagged _isCollisionLayer', () => {
    const tilemap = loadTilemap(); // use this file's existing loader helper
    const stmData = {
      tileWidth: 10,
      tileHeight: 10,
      tileImage: 'tiles.png',
      layers: {
        floor: [[1, 1], [1, 1]],
        walls: { type: 'collision', data: [[0, 1], [0, 0]] },
      },
    };
    // Reuse this file's existing asset-stubbing approach for createTileMapSet
    // (see the other tests in this describe block for the exact stub shape).
    const handle = tilemap.createTileMapSet('level1.stm'); // adapt to match this file's existing stub wiring

    expect(handle._layerContainers.floor._isCollisionLayer).toBeUndefined();
    expect(handle._layerContainers.walls._isCollisionLayer).toBe(true);
  });
});
```

> **Note for the implementer:** `tests/components/Runner/tilemap.test.ts` already has helpers (`loadTilemap`, asset/PIXI stubs, and an existing collision-layer test from TCL-Task 5) — read the file first and adapt this test's stubbing to match exactly what's already there rather than inventing a parallel stubbing approach. The assertion (`_isCollisionLayer` flag) is the only new thing; the scaffolding should match the file's existing style.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/Runner/tilemap.test.ts`
Expected: FAIL — `_isCollisionLayer` is `undefined` on `walls`, not `true`.

- [ ] **Step 3: Add the flag in `tilemap.js`**

In `src/components/Runner/engine/tilemap.js`, inside `createTileMapSet`, in the `if (layerValue.type === 'collision')` branch, add one line:

```js
        if (layerValue.type === 'collision') {
          // Collision layer: data-only, no tile art, no PIXI sprite
          // children -- but stored in `layerContainers` with a `_map` the
          // same shape a tile layer's is, so `pathfinding.setup()` can
          // treat it as a blocking layer with zero changes on that side.
          const container = new PIXI.Container();
          container._tileW = tileW;
          container._tileH = tileH;
          container._map = layerValue.data;
          // Distinguishes this from a tile-art layer (which also has a
          // _map) for collision.setupTileCollision, which merges every
          // collision-kind layer and must not also merge in tile art.
          container._isCollisionLayer = true;
          layerContainers[name] = container;
          continue;
        }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/Runner/tilemap.test.ts`
Expected: PASS, including all pre-existing tests in this file (no regressions).

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/tilemap.js tests/components/Runner/tilemap.test.ts
git commit -m "feat: tag collision-kind tilemap layer containers"
```

---

### Task 3: `collision.setupTileCollision` — merge collision layers into a solid grid

**Files:**
- Modify: `src/components/Runner/engine/collision.js`
- Test: `tests/components/Runner/collision.test.ts` (new file)

- [ ] **Step 1: Write the failing test**

Create `tests/components/Runner/collision.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/Runner/collision.test.ts`
Expected: FAIL — `c.setupTileCollision is not a function`.

- [ ] **Step 3: Implement `setupTileCollision` in `collision.js`**

In `src/components/Runner/engine/collision.js`, the module is currently `const _sbCollision = (() => { function _slabTest(...) {...} return { ...methods... }; })();`. Add `_tileCollisionGrid: null` and the new methods to the returned object, after `raycastAll`:

```js
    _tileCollisionGrid: null,

    // Merges every `'collision'`-kind layer in the given TileMapSet into one
    // solid-cell grid (OR'd — a cell is solid if ANY collision layer marks
    // it solid). Implicit and unnamed by design: a collision layer's only
    // purpose is being collision data, so there's nothing to disambiguate
    // (see docs/superpowers/specs/2026-08-12-kinematic-tile-collision-design.md).
    setupTileCollision(tileMapSetObj) {
      if (!tileMapSetObj || !tileMapSetObj._handle) {
        throw new Error('collision.setupTileCollision: expected a TileMapSet instance');
      }
      const handle = tileMapSetObj._handle;
      const layerContainers = handle._layerContainers || {};
      const collisionLayers = Object.values(layerContainers).filter((l) => l._isCollisionLayer);
      if (collisionLayers.length === 0) {
        throw new Error('collision.setupTileCollision: TileMapSet has no collision layer');
      }

      const first = collisionLayers[0];
      const rows = first._map.length;
      const cols = first._map[0] ? first._map[0].length : 0;
      const solid = new Uint8Array(rows * cols);

      for (const layer of collisionLayers) {
        for (let row = 0; row < rows; row++) {
          const layerRow = layer._map[row];
          if (!layerRow) continue;
          for (let col = 0; col < cols; col++) {
            if (layerRow[col]) solid[row * cols + col] = 1;
          }
        }
      }

      this._tileCollisionGrid = {
        solid,
        rows,
        cols,
        tileW: first._tileW,
        tileH: first._tileH,
        // The TileMapSet's own wrapping container, not a per-layer
        // container: collision layers are never added to the scene graph
        // (no tile art to render), so a per-layer container's .parent walk
        // would stop dead at null. Every layer shares this same effective
        // world position, so this is correct for all of them, not just a
        // fallback. See this plan's header note for the full reasoning.
        reference: handle,
      };
    },

    _tileCollisionReset() {
      this._tileCollisionGrid = null;
    },

    _isSolidCell(grid, row, col) {
      if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) return false;
      return grid.solid[row * grid.cols + col] === 1;
    },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/Runner/collision.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/collision.js tests/components/Runner/collision.test.ts
git commit -m "feat: add collision.setupTileCollision solid-grid merge"
```

---

### Task 4: Axis-separated collision resolution + `_applyKinematics` + `isBlockedUp/Down/Left/Right`

**Files:**
- Modify: `src/components/Runner/engine/collision.js`
- Test: `tests/components/Runner/collision.test.ts`

This is the core resolution algorithm: move one axis, check whether the sprite's AABB would cross into a solid cell, and if so clip the movement to the tile boundary instead. X resolves first, then Y resolves against the *already-moved* X position — that ordering is what makes diagonal movement into a wall slide along it instead of stopping dead.

- [ ] **Step 1: Write the failing tests**

Add to `tests/components/Runner/collision.test.ts`, below the `setupTileCollision` describe block:

```ts
// A fake PIXI handle: position is the top-left corner (matches plain
// `sprite`'s default anchor(0,0) — see sprites.js/createSprite, which never
// calls anchor.set), and getBounds() recomputes from the *current* position
// so it reflects in-progress moves during axis-separated resolution, exactly
// like a real PIXI display object's getBounds() would.
function makeHandle(x: number, y: number, w: number, h: number) {
  const handle: Record<string, unknown> & { position: { x: number; y: number } } = {
    position: { x, y },
    getBounds() {
      return { x: handle.position.x, y: handle.position.y, width: w, height: h };
    },
  };
  return handle;
}

// Builds a _tileCollisionGrid fixture directly (bypassing setupTileCollision)
// from an array of row-strings, '#' = solid, '.' = open. tileSize defaults to
// 10px per cell on both axes.
function makeGridFixture(rowStrings: string[], tileSize = 10) {
  const rows = rowStrings.length;
  const cols = rowStrings[0].length;
  const solid = new Uint8Array(rows * cols);
  rowStrings.forEach((rowStr, row) => {
    for (let col = 0; col < cols; col++) {
      if (rowStr[col] === '#') solid[row * cols + col] = 1;
    }
  });
  return { solid, rows, cols, tileW: tileSize, tileH: tileSize, reference: { x: 0, y: 0, parent: null } };
}

describe('_applyKinematics', () => {
  test('a sprite with zero velocity never moves', () => {
    const c = loadCollision();
    const handle = makeHandle(5, 5, 8, 8);
    c._applyKinematics(handle, 16);
    expect(handle.position).toEqual({ x: 5, y: 5 });
  });

  test('applies velocity * dt with no active collision grid', () => {
    const c = loadCollision();
    const handle = makeHandle(0, 0, 8, 8);
    handle._sbVelocityX = 100;
    handle._sbVelocityY = 50;
    c._applyKinematics(handle, 100); // dt = 0.1s
    expect(handle.position.x).toBeCloseTo(10);
    expect(handle.position.y).toBeCloseTo(5);
  });

  test('clips rightward movement at a solid tile and sets isBlockedRight', () => {
    const c = loadCollision();
    c._tileCollisionGrid = makeGridFixture(['..#.']); // solid at col 2, x:20-30
    const handle = makeHandle(5, 0, 8, 8); // bounds x:5-13
    handle._sbVelocityX = 100; // dx = 10 -> would land bounds x:15-23, crossing col 2 (x>=20)
    c._applyKinematics(handle, 100);

    expect(handle.position.x).toBe(12); // clipped so right edge sits exactly at x=20
    expect(c.isBlockedRight(handle)).toBe(true);
    expect(c.isBlockedLeft(handle)).toBe(false);
  });

  test('clips leftward movement at a solid tile and sets isBlockedLeft', () => {
    const c = loadCollision();
    c._tileCollisionGrid = makeGridFixture(['.#..']); // solid at col 1, x:10-20
    const handle = makeHandle(25, 0, 8, 8); // bounds x:25-33
    handle._sbVelocityX = -200; // dx = -20 -> would land bounds x:5-13, crossing col 1 (x<20)
    c._applyKinematics(handle, 100);

    expect(handle.position.x).toBe(20); // clipped so left edge sits exactly at x=20
    expect(c.isBlockedLeft(handle)).toBe(true);
    expect(c.isBlockedRight(handle)).toBe(false);
  });

  test('clips downward movement at a solid tile and sets isBlockedDown', () => {
    const c = loadCollision();
    c._tileCollisionGrid = makeGridFixture(['.', '.', '#', '.']); // solid at row 2, y:20-30
    const handle = makeHandle(0, 5, 8, 8); // bounds y:5-13
    handle._sbVelocityY = 100; // dy = 10 -> would land bounds y:15-23, crossing row 2
    c._applyKinematics(handle, 100);

    expect(handle.position.y).toBe(12);
    expect(c.isBlockedDown(handle)).toBe(true);
    expect(c.isBlockedUp(handle)).toBe(false);
  });

  test('clips upward movement at a solid tile and sets isBlockedUp', () => {
    const c = loadCollision();
    c._tileCollisionGrid = makeGridFixture(['.', '#', '.', '.']); // solid at row 1, y:10-20
    const handle = makeHandle(0, 25, 8, 8); // bounds y:25-33
    handle._sbVelocityY = -200; // dy = -20 -> would land bounds y:5-13, crossing row 1
    c._applyKinematics(handle, 100);

    expect(handle.position.y).toBe(20);
    expect(c.isBlockedUp(handle)).toBe(true);
    expect(c.isBlockedDown(handle)).toBe(false);
  });

  test('scans every row the sprite spans, not just its top row', () => {
    const c = loadCollision();
    // Solid only in row 1, column 2. A 15px-tall sprite spans rows 0-1.
    c._tileCollisionGrid = makeGridFixture(['...', '..#', '...']);
    const handle = makeHandle(5, 0, 8, 15); // bounds y:0-15 -> spans row 0 and row 1
    handle._sbVelocityX = 100;
    c._applyKinematics(handle, 100); // dx=10, would cross col 2 -> blocked via row 1's solid cell

    expect(c.isBlockedRight(handle)).toBe(true);
  });

  test('diagonal movement into a wall slides along the unblocked axis', () => {
    const c = loadCollision();
    c._tileCollisionGrid = makeGridFixture(['..#.', '....']); // solid at row 0, col 2
    const handle = makeHandle(5, 0, 8, 8); // bounds x:5-13, y:0-8, entirely within row 0
    handle._sbVelocityX = 100; // dx=10 -> blocked (same as the rightward test above)
    handle._sbVelocityY = 100; // dy=10 -> row 0 has no solid cell in the sprite's column range, unblocked
    c._applyKinematics(handle, 100);

    expect(handle.position.x).toBe(12); // X clipped
    expect(handle.position.y).toBe(10); // Y applied in full, unaffected by the X block
    expect(c.isBlockedRight(handle)).toBe(true);
    expect(c.isBlockedDown(handle)).toBe(false);
  });

  test('a sprite can move past the edge of the grid (out of range is never solid)', () => {
    const c = loadCollision();
    c._tileCollisionGrid = makeGridFixture(['..']);
    const handle = makeHandle(15, 0, 8, 8); // bounds x:15-23, already at/past the 2-col (20px) grid edge
    handle._sbVelocityX = 100;
    c._applyKinematics(handle, 100);

    expect(handle.position.x).toBe(25); // moved freely, no clip
    expect(c.isBlockedRight(handle)).toBe(false);
  });

  test('blocked flags persist across a frame with zero velocity (reflect the last-resolved frame)', () => {
    const c = loadCollision();
    c._tileCollisionGrid = makeGridFixture(['..#.']);
    const handle = makeHandle(5, 0, 8, 8);
    handle._sbVelocityX = 100;
    c._applyKinematics(handle, 100);
    expect(c.isBlockedRight(handle)).toBe(true);

    handle._sbVelocityX = 0;
    c._applyKinematics(handle, 100); // no movement this frame -> early return, flags untouched
    expect(c.isBlockedRight(handle)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/Runner/collision.test.ts`
Expected: FAIL — `c._applyKinematics is not a function`.

- [ ] **Step 3: Implement the resolution algorithm in `collision.js`**

Add these methods to the returned object in `src/components/Runner/engine/collision.js`, after `_isSolidCell`:

```js
    _tileGridOffset(reference) {
      let offsetX = 0;
      let offsetY = 0;
      let node = reference;
      while (node && node !== worldContainer && node !== hudContainer) {
        offsetX += node.x;
        offsetY += node.y;
        node = node.parent;
      }
      return { offsetX, offsetY };
    },

    // Moves an AABB by `delta` along one axis, clipping to the boundary of
    // the first solid tile it would otherwise cross. `axis` is 'x' or 'y'.
    // Scans every row (for 'x') or column (for 'y') the AABB's *other* axis
    // spans, so a sprite taller/wider than one tile is still checked fully.
    _resolveAxis(grid, bounds, delta, axis) {
      if (delta === 0) return { delta: 0, blocked: false };
      const { offsetX, offsetY } = this._tileGridOffset(grid.reference);
      const { tileW, tileH } = grid;

      if (axis === 'x') {
        const leadingEdge = delta > 0 ? bounds.x + bounds.width + delta : bounds.x + delta;
        const col = Math.floor((leadingEdge - offsetX) / tileW);
        const topRow = Math.floor((bounds.y - offsetY) / tileH);
        const bottomRow = Math.floor((bounds.y + bounds.height - 1 - offsetY) / tileH);
        for (let row = topRow; row <= bottomRow; row++) {
          if (this._isSolidCell(grid, row, col)) {
            const boundary = delta > 0
              ? offsetX + col * tileW - bounds.width
              : offsetX + (col + 1) * tileW;
            return { delta: boundary - bounds.x, blocked: true };
          }
        }
        return { delta, blocked: false };
      }

      // axis === 'y'
      const leadingEdge = delta > 0 ? bounds.y + bounds.height + delta : bounds.y + delta;
      const row = Math.floor((leadingEdge - offsetY) / tileH);
      const leftCol = Math.floor((bounds.x - offsetX) / tileW);
      const rightCol = Math.floor((bounds.x + bounds.width - 1 - offsetX) / tileW);
      for (let col = leftCol; col <= rightCol; col++) {
        if (this._isSolidCell(grid, row, col)) {
          const boundary = delta > 0
            ? offsetY + row * tileH - bounds.height
            : offsetY + (row + 1) * tileH;
          return { delta: boundary - bounds.y, blocked: true };
        }
      }
      return { delta, blocked: false };
    },

    // Applies a sprite's stored velocity for one frame, resolving against
    // the active tile-collision grid (if any). Called once per instance per
    // frame from lifecycle.js, immediately after the instance's own
    // onupdate — see that file for the call site.
    _applyKinematics(handle, delta) {
      const vx = handle._sbVelocityX || 0;
      const vy = handle._sbVelocityY || 0;
      if (vx === 0 && vy === 0) return;

      const dt = delta / 1000;
      const dx = vx * dt;
      const dy = vy * dt;

      handle._sbBlockedLeft = false;
      handle._sbBlockedRight = false;
      handle._sbBlockedUp = false;
      handle._sbBlockedDown = false;

      const grid = this._tileCollisionGrid;
      if (!grid) {
        handle.position.x += dx;
        handle.position.y += dy;
        return;
      }

      // X resolves first, using the bounds as of frame start.
      let bounds = handle.getBounds();
      const xResult = this._resolveAxis(grid, bounds, dx, 'x');
      handle.position.x += xResult.delta;
      if (xResult.blocked) {
        if (dx > 0) handle._sbBlockedRight = true;
        else handle._sbBlockedLeft = true;
      }

      // Y resolves second, against bounds updated by the X move -- this
      // ordering is what makes a diagonal approach into a wall slide along
      // it instead of stopping dead.
      bounds = handle.getBounds();
      const yResult = this._resolveAxis(grid, bounds, dy, 'y');
      handle.position.y += yResult.delta;
      if (yResult.blocked) {
        if (dy > 0) handle._sbBlockedDown = true;
        else handle._sbBlockedUp = true;
      }
    },

    isBlockedUp(handle) { return !!handle._sbBlockedUp; },
    isBlockedDown(handle) { return !!handle._sbBlockedDown; },
    isBlockedLeft(handle) { return !!handle._sbBlockedLeft; },
    isBlockedRight(handle) { return !!handle._sbBlockedRight; },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/Runner/collision.test.ts`
Expected: PASS (all tests in the file, ~14 total).

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/collision.js tests/components/Runner/collision.test.ts
git commit -m "feat: add axis-separated kinematic tile collision resolution"
```

---

### Task 5: Wire `_applyKinematics` into the per-frame lifecycle + reset on scene clear

**Files:**
- Modify: `src/components/Runner/engine/lifecycle.js`
- Modify: `src/components/Runner/engine/stage.js`
- Test: `tests/components/Runner/lifecycle.test.ts`, `tests/components/Runner/stage.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `tests/components/Runner/lifecycle.test.ts` (extend `loadLifecycle` to accept a stub `_applyKinematics`, matching the existing `_throwError`-stub pattern):

```ts
function loadLifecycle(
  throwError: (e: Error) => void = () => {},
  applyKinematics: (handle: unknown, delta: number) => void = () => {}
) {
  const src = readFileSync('src/components/Runner/engine/lifecycle.js', 'utf-8');
  const factory = new Function('_throwError', `${src}\n return _sbLifecycle;`);
  const lifecycle = factory(throwError);
  lifecycle._applyKinematics = applyKinematics;
  return lifecycle;
}
```

(This redeclares the existing `loadLifecycle` in the file — replace the current definition rather than adding a second one.)

```ts
describe('_update — kinematics hook', () => {
  test('calls _applyKinematics once per instance with a _handle, after its own onupdate', () => {
    const calls: string[] = [];
    const lifecycle = loadLifecycle(() => {}, (handle) => {
      calls.push(`kinematics:${(handle as { id: string }).id}`);
    });
    const player = {
      _handle: { id: 'player' },
      onupdate: () => calls.push('onupdate:player'),
    };
    lifecycle._sbInstances = [player];

    lifecycle._update(16);

    expect(calls).toEqual(['onupdate:player', 'kinematics:player']);
  });

  test('applies kinematics even for an instance with no onupdate of its own', () => {
    const calls: string[] = [];
    const lifecycle = loadLifecycle(() => {}, (handle) => {
      calls.push((handle as { id: string }).id);
    });
    lifecycle._sbInstances = [{ _handle: { id: 'static' } }];

    expect(() => lifecycle._update(16)).not.toThrow();
    expect(calls).toEqual(['static']);
  });

  test('skips instances with no _handle without throwing', () => {
    const lifecycle = loadLifecycle();
    lifecycle._sbInstances = [{ onupdate: () => {} }];
    expect(() => lifecycle._update(16)).not.toThrow();
  });

  test('an instance removing itself from _sbInstances during onupdate still gets its own kinematics applied this frame', () => {
    const calls: string[] = [];
    const lifecycle = loadLifecycle(() => {}, (handle) => {
      calls.push((handle as { id: string }).id);
    });
    const self: { _handle: { id: string }; onupdate: () => void } = {
      _handle: { id: 'dying' },
      onupdate: () => {
        lifecycle._retainInstances((i: unknown) => i !== self);
      },
    };
    lifecycle._sbInstances = [self];

    lifecycle._update(16);

    expect(calls).toEqual(['dying']);
    expect(lifecycle._sbInstances).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/Runner/lifecycle.test.ts`
Expected: FAIL — `calls` stays `['onupdate:player']`, missing the kinematics call.

- [ ] **Step 3: Add the hook in `lifecycle.js`**

In `src/components/Runner/engine/lifecycle.js`, modify the per-instance loop inside `_update(delta)`:

```js
    this._sbInstances.slice().forEach((inst) => {
      if (inst.onupdate) {
        try {
          inst.onupdate(delta);
        } catch (e) {
          _throwError(e);
        }
      }
      // Applies stored velocity (if any) and resolves it against the active
      // tile-collision grid (if any) -- both are no-ops when unset, so a
      // sprite that never calls setVelocity is completely unaffected.
      if (inst._handle) {
        this._applyKinematics(inst._handle, delta);
      }
    });
```

(`this._applyKinematics` resolves through `_sb` at runtime — `_sbLifecycle`'s `_update` always runs with `this` bound to the merged `_sb` object, per the existing `_sbLifecycle._update.call(this, delta)` call site in `scene.js`, so `_sbCollision`'s methods spread onto that same object are reachable as `this.*` here, exactly like `this._pathfindingUpdate(delta)` already is in `scene.js`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/Runner/lifecycle.test.ts`
Expected: PASS, including all pre-existing tests in this file.

- [ ] **Step 5: Reset the tile-collision grid on scene clear — write the failing test**

Add to `tests/components/Runner/stage.test.ts` (find the existing test(s) covering `clear()` calling `_pathfindingReset()` and add this alongside them, following the same stubbing pattern already in the file):

```ts
test('clear() also resets the active tile-collision grid', () => {
  const stage = loadStage(/* whatever this file's existing loader helper is called */);
  const resetCalls: string[] = [];
  stage._tileCollisionReset = () => resetCalls.push('reset');
  stage._pathfindingReset = () => {};
  stage._cameraReset = () => {};

  stage.clear();

  expect(resetCalls).toEqual(['reset']);
});
```

> **Note for the implementer:** read `tests/components/Runner/stage.test.ts` first to match its existing loader/stub naming exactly — the snippet above uses placeholder names for illustration.

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run tests/components/Runner/stage.test.ts`
Expected: FAIL — `resetCalls` stays empty.

- [ ] **Step 7: Wire the reset in `stage.js`**

In `src/components/Runner/engine/stage.js`, in `clear()`:

```js
  clear() {
    worldContainer.removeChildren();
    hudContainer.removeChildren();
    // Emptied in place, never replaced — see _retainInstances in lifecycle.js.
    this._sbInstances.length = 0;
    this._cameraReset();
    this._pathfindingReset();
    this._tileCollisionReset();
  },
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run tests/components/Runner/stage.test.ts`
Expected: PASS, including all pre-existing tests in this file.

- [ ] **Step 9: Commit**

```bash
git add src/components/Runner/engine/lifecycle.js src/components/Runner/engine/stage.js tests/components/Runner/lifecycle.test.ts tests/components/Runner/stage.test.ts
git commit -m "feat: apply kinematic movement per-instance each frame, reset grid on scene clear"
```

---

### Task 6: `sprite` API — `setVelocity`/`velocityX`/`velocityY`/`isBlockedUp/Down/Left/Right`

**Files:**
- Modify: `src/lib/Basic4WebGL/library/descriptors/sprite.descriptor.ts`
- Regenerate: `src/lib/Basic4WebGL/defs/sprite.bas` (via `npm run generate:library` — **never hand-edit**, see `CLAUDE.md`)
- Test: `tests/lib/Basic4WebGL/unit/transpiler/sprite.test.ts` (new file)

- [ ] **Step 1: Write the failing test**

Create `tests/lib/Basic4WebGL/unit/transpiler/sprite.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transformSource = readFileSync('src/lib/Basic4WebGL/defs/transform.bas', 'utf-8');
const spriteSource = readFileSync('src/lib/Basic4WebGL/defs/sprite.bas', 'utf-8');

const transpileWithSprite = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'ObjectTransform.bas', source: transformSource },
      { name: 'Sprite.bas', source: spriteSource },
      { name: 'Main.bas', source },
    ],
  });

describe('sprite — setVelocity', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("player.png")',
      '  s.setVelocity(100, -50)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.setVelocity(', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("player.png")',
      '  s.setVelocity(100, -50)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.setVelocity(');
  });
});

describe('sprite — velocityX / velocityY', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("player.png")',
      '  dim vx',
      '  dim vy',
      '  vx = s.velocityX()',
      '  vy = s.velocityY()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.getVelocityX( and _sb.getVelocityY(', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("player.png")',
      '  dim vx',
      '  vx = s.velocityX()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.getVelocityX(');
  });
});

describe('sprite — isBlockedUp / isBlockedDown / isBlockedLeft / isBlockedRight', () => {
  test('compiles without error', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("player.png")',
      '  if s.isBlockedDown() then',
      '    if s.isBlockedUp() then',
      '    endif',
      '    if s.isBlockedLeft() then',
      '    endif',
      '    if s.isBlockedRight() then',
      '    endif',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.isBlockedUp( / Down / Left / Right', () => {
    const result = transpileWithSprite([
      'function test()',
      '  dim s as Sprite("player.png")',
      '  dim a',
      '  dim b',
      '  dim c',
      '  dim d',
      '  a = s.isBlockedUp()',
      '  b = s.isBlockedDown()',
      '  c = s.isBlockedLeft()',
      '  d = s.isBlockedRight()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.isBlockedUp(');
    expect(result.code).toContain('_sb.isBlockedDown(');
    expect(result.code).toContain('_sb.isBlockedLeft(');
    expect(result.code).toContain('_sb.isBlockedRight(');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/sprite.test.ts`
Expected: FAIL — `s.setVelocity is not a recognised method` (or similar "unknown method" diagnostic), since `sprite.bas` doesn't define it yet.

- [ ] **Step 3: Add the methods to the descriptor**

In `src/lib/Basic4WebGL/library/descriptors/sprite.descriptor.ts`, add these seven entries to the `methods` array, after `setDepth`:

```ts
    {
      name: 'setVelocity',
      params: ['vx', 'vy'],
      body: (p, self) => `_sb.setVelocity(${self._handle}, ${p.vx}, ${p.vy})`,
    },
    {
      name: 'velocityX',
      params: [],
      returns: (_p, self) => `_sb.getVelocityX(${self._handle})`,
    },
    {
      name: 'velocityY',
      params: [],
      returns: (_p, self) => `_sb.getVelocityY(${self._handle})`,
    },
    {
      name: 'isBlockedUp',
      params: [],
      returns: (_p, self) => `_sb.isBlockedUp(${self._handle})`,
    },
    {
      name: 'isBlockedDown',
      params: [],
      returns: (_p, self) => `_sb.isBlockedDown(${self._handle})`,
    },
    {
      name: 'isBlockedLeft',
      params: [],
      returns: (_p, self) => `_sb.isBlockedLeft(${self._handle})`,
    },
    {
      name: 'isBlockedRight',
      params: [],
      returns: (_p, self) => `_sb.isBlockedRight(${self._handle})`,
    },
```

- [ ] **Step 4: Regenerate `sprite.bas`**

Run: `npm run generate:library`

This overwrites every descriptor-generated `.bas` file, including `sprite.bas` (and any others in `registry.ts` — expected, they're regenerated from their own unchanged descriptors and should come out byte-identical). Confirm `sprite.bas` now ends with:

```bas
function setVelocity(vx, vy)
    call("_sb.setVelocity(this._handle, setvelocity_vx, setvelocity_vy)")
endfunction

function velocityX()
    return call("_sb.getVelocityX(this._handle)")
endfunction

function velocityY()
    return call("_sb.getVelocityY(this._handle)")
endfunction

function isBlockedUp()
    return call("_sb.isBlockedUp(this._handle)")
endfunction

function isBlockedDown()
    return call("_sb.isBlockedDown(this._handle)")
endfunction

function isBlockedLeft()
    return call("_sb.isBlockedLeft(this._handle)")
endfunction

function isBlockedRight()
    return call("_sb.isBlockedRight(this._handle)")
endfunction

EndClass
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/sprite.test.ts tests/lib/Basic4WebGL/unit/generator/generatedDefsInSync.test.ts`
Expected: PASS — the new sprite tests, and the sync test confirming `sprite.bas` matches its descriptor's generated output exactly.

- [ ] **Step 6: Commit**

```bash
git add src/lib/Basic4WebGL/library/descriptors/sprite.descriptor.ts src/lib/Basic4WebGL/defs/sprite.bas tests/lib/Basic4WebGL/unit/transpiler/sprite.test.ts
git commit -m "feat: add velocity and blocked-direction methods to sprite"
```

---

### Task 7: `animatedsprite` API — same methods, hand-added

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/animatedsprite.bas` (hand-written — NOT descriptor-generated, per `CLAUDE.md`'s "Not every `.bas` file is descriptor-generated" list)
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts`, following the file's existing `describe` block pattern:

```ts
// ─── setVelocity ────────────────────────────────────────────────────────────

describe('AnimatedSprite — setVelocity', () => {
  test('compiles without error', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  s.setVelocity(100, -50)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.setVelocity(', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  s.setVelocity(100, -50)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.setVelocity(');
  });
});

// ─── velocityX / velocityY ──────────────────────────────────────────────────

describe('AnimatedSprite — velocityX / velocityY', () => {
  test('compiles without error', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  dim vx',
      '  vx = s.velocityX()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.getVelocityX( and _sb.getVelocityY(', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  dim vx',
      '  dim vy',
      '  vx = s.velocityX()',
      '  vy = s.velocityY()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.getVelocityX(');
    expect(result.code).toContain('_sb.getVelocityY(');
  });
});

// ─── isBlockedUp / isBlockedDown / isBlockedLeft / isBlockedRight ───────────

describe('AnimatedSprite — isBlockedUp / isBlockedDown / isBlockedLeft / isBlockedRight', () => {
  test('compiles without error', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  dim a',
      '  a = s.isBlockedDown()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
  test('emits _sb.isBlockedUp( / Down / Left / Right', () => {
    const result = transpileWithAnimSprite([
      'function test()',
      '  dim s as AnimatedSprite("hero.png", 48, 48)',
      '  dim a',
      '  dim b',
      '  dim c',
      '  dim d',
      '  a = s.isBlockedUp()',
      '  b = s.isBlockedDown()',
      '  c = s.isBlockedLeft()',
      '  d = s.isBlockedRight()',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.isBlockedUp(');
    expect(result.code).toContain('_sb.isBlockedDown(');
    expect(result.code).toContain('_sb.isBlockedLeft(');
    expect(result.code).toContain('_sb.isBlockedRight(');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts`
Expected: FAIL — the new methods don't exist on `AnimatedSprite` yet.

- [ ] **Step 3: Hand-add the methods to `animatedsprite.bas`**

In `src/lib/Basic4WebGL/defs/animatedsprite.bas`, add before `EndClass`:

```bas
function setVelocity(vx, vy)
    call("_sb.setVelocity(this._handle, setvelocity_vx, setvelocity_vy)")
endfunction

function velocityX()
    return call("_sb.getVelocityX(this._handle)")
endfunction

function velocityY()
    return call("_sb.getVelocityY(this._handle)")
endfunction

function isBlockedUp()
    return call("_sb.isBlockedUp(this._handle)")
endfunction

function isBlockedDown()
    return call("_sb.isBlockedDown(this._handle)")
endfunction

function isBlockedLeft()
    return call("_sb.isBlockedLeft(this._handle)")
endfunction

function isBlockedRight()
    return call("_sb.isBlockedRight(this._handle)")
endfunction
```

These call the exact same `_sb.*` functions `sprite.bas` calls (Task 6) — the underlying engine logic is shared and keyed off `_handle`, only the thin `.bas` wrapper is duplicated, per the design doc.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts`
Expected: PASS, including all pre-existing tests in this file.

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/defs/animatedsprite.bas tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts
git commit -m "feat: add velocity and blocked-direction methods to animatedsprite"
```

---

### Task 8: `collision.setupTileCollision` `.bas` definition

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/collision.bas` (hand-written — not in `registry.ts`'s descriptor-generated list)
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts`, after the `raycastAll` describe block:

```ts
// ─── setupTileCollision ───────────────────────────────────────────────────────

describe('collision — setupTileCollision', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim level',
      '  collision.setupTileCollision(level)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.setupTileCollision(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim level',
      '  collision.setupTileCollision(level)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.setupTileCollision(');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts`
Expected: FAIL — `setupTileCollision` is not a recognised `collision` function.

- [ ] **Step 3: Add the function to `collision.bas`**

In `src/lib/Basic4WebGL/defs/collision.bas`, add at the end of the file:

```bas

function setupTileCollision(tileMapSet)
    call("_sb.setupTileCollision(setuptilecollision_tileMapSet)")
endfunction
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts`
Expected: PASS, including all pre-existing tests in this file.

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/defs/collision.bas tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts
git commit -m "feat: add collision.setupTileCollision definition"
```

---

### Task 9: API reference docs

**Files:**
- Modify: `src/docs/api-reference/sprite.md`
- Modify: `src/docs/api-reference/animatedsprite.md`
- Modify: `src/docs/api-reference/collision.md`

No test — docs are prose, verified by reading. Follow the writing-style rules in `CLAUDE.md` (beginner audience, no JS/PIXI internals, `number`/`true or false` types, game-like examples).

- [ ] **Step 1: Add to `src/docs/api-reference/sprite.md`**, after the existing `setDepth(n)` section (the file's last section):

```markdown

## setVelocity(vx, vy)

Sets the sprite's speed, in pixels per second, along each axis. Once set, the engine moves the sprite automatically every frame — you don't need to update its position yourself. If `collision.setupTileCollision` has been called for the current tilemap, the sprite automatically stops at solid tiles instead of passing through them.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| vx        | number | Horizontal speed in pixels per second. Positive moves right, negative moves left |
| vy        | number | Vertical speed in pixels per second. Positive moves down, negative moves up |

```bas
' Move right at 150 pixels per second
self.setVelocity(150, 0)
```

## velocityX()

Returns the sprite's current horizontal speed, as set by `setVelocity`.

**Returns:** number

```bas
dim vx
vx = self.velocityX()
```

## velocityY()

Returns the sprite's current vertical speed, as set by `setVelocity`.

**Returns:** number

```bas
dim vy
vy = self.velocityY()
```

## isBlockedUp()

Returns `true` if the sprite's movement was stopped by a solid tile above it on the most recent frame. Only meaningful after `collision.setupTileCollision` has been called and the sprite has a non-zero velocity.

**Returns:** `true` or `false`

```bas
if self.isBlockedUp() then
  self.setVelocity(self.velocityX(), 0)
endif
```

## isBlockedDown()

Returns `true` if the sprite's movement was stopped by a solid tile below it on the most recent frame — useful for detecting "standing on the ground" in a platformer.

**Returns:** `true` or `false`

```bas
if self.isBlockedDown() then
  isGrounded = true
endif
```

## isBlockedLeft()

Returns `true` if the sprite's movement was stopped by a solid tile to its left on the most recent frame.

**Returns:** `true` or `false`

```bas
if self.isBlockedLeft() then
  self.setVelocity(0, self.velocityY())
endif
```

## isBlockedRight()

Returns `true` if the sprite's movement was stopped by a solid tile to its right on the most recent frame.

**Returns:** `true` or `false`

```bas
if self.isBlockedRight() then
  self.setVelocity(0, self.velocityY())
endif
```
```

- [ ] **Step 2: Add the identical seven sections to `src/docs/api-reference/animatedsprite.md`**, after its existing `setDepth(n)` section (its last section) — same headings, parameter tables, and returns lines as Step 1, with example code using `self.setVelocity(...)` exactly the same way (the API is identical between `sprite` and `animatedsprite`).

- [ ] **Step 3: Update `src/docs/api-reference/collision.md`**

Change the module description on line 3 from "provides six functions" to "provides seven functions":

```markdown
The `collision` module provides seven functions for detecting overlaps, proximity, and line-of-sight between sprites, plus one for setting up automatic tilemap collision. Include the **softGfx** package to use it.
```

Add a new section after `raycastAll` and before the `## Note: gfx.boxCollide (deprecated)` section:

```markdown
## setupTileCollision(tileMapSet)

Turns on automatic collision between every sprite with a velocity (set via `setVelocity`) and the solid tiles painted into the given tilemap's collision layer. Call this once — typically in a scene's `onenter()`, right after loading the tilemap — and every sprite moving with `setVelocity` will automatically stop at solid tiles from then on, until the next scene switch or the next call to `setupTileCollision`.

Only one tilemap's collision can be active at a time — calling this again replaces the previous one.

| Parameter  | Type   | Description |
|------------|--------|-------------|
| tileMapSet | object | A `TileMapSet` loaded from a `.stm` file containing at least one collision layer (painted in the Tilemap Editor) |

```bas
Class
Extends scenemanager.scene

dim level

function onenter()
  self.level = new TileMapSet("level1.stm")
  world.add(self.level)
  collision.setupTileCollision(self.level)
endfunction

EndClass
```
```

- [ ] **Step 4: Commit**

```bash
git add src/docs/api-reference/sprite.md src/docs/api-reference/animatedsprite.md src/docs/api-reference/collision.md
git commit -m "docs: document kinematic movement and tile collision API"
```

---

### Task 10: Cypress e2e spec — real per-frame movement and collision in a browser

**Files:**
- Create: `cypress/e2e/kinematicCollision.cy.ts`

Per this project's own convention (`CLAUDE.md`'s E2E tests section) and the design doc's testing section: Vitest checks transpiler *output*, not what a compiled game does when it runs a real `PIXI.Ticker` for real frames — exactly the category of bug (`delta` unit errors, instance-update dispatch ordering) this project's own history shows Vitest cannot catch. This spec drives an actual sprite with velocity into an actual solid tile in a real browser and asserts final position/blocked-state.

Model this file on `cypress/e2e/deltaUnits.cy.ts` (`buildPersistedState`/`run`/`consoleLines` helpers, seeding a project into `localStorage` and reading the bottom console panel) — reuse that structure rather than reinventing it. Unlike `deltaUnits.cy.ts`, no real tilemap asset is needed: `collision.setupTileCollision` only reads `tileMapSetObj._handle._layerContainers`, so the test can construct a synthetic fixture directly inside the running game via `_sb`, reached through the runner iframe exactly like `deltaUnits.cy.ts`'s wall-clock test already does with `win.eval`.

- [ ] **Step 1: Write the spec**

Create `cypress/e2e/kinematicCollision.cy.ts`:

```ts
/// <reference types="cypress" />

// ---------------------------------------------------------------------------
// Runtime proof that setVelocity()-driven movement and
// collision.setupTileCollision() resolution work end-to-end against a real
// PIXI.Ticker, in a real browser -- the one thing Vitest's transpiler-output
// tests and the isolated engine-module tests (collision.test.ts,
// lifecycle.test.ts) cannot prove on their own, since neither runs a real
// frame loop. See CLAUDE.md's "E2E tests (Cypress)" section and this
// feature's design doc's Testing section for why this spec exists.
// ---------------------------------------------------------------------------

interface FileSpec {
  name: string;
  source: string;
}

function buildPersistedState(projectId: string, projectName: string, files: FileSpec[]): string {
  const filesById: Record<string, object> = {};
  const fileOrder: string[] = [];
  files.forEach((f) => {
    const id = `file-${f.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    filesById[id] = { id, name: f.name, source: f.source, projectId, folderId: null, fullName: f.name };
    fileOrder.push(id);
  });

  const state = {
    projects: JSON.stringify({
      items: [{ id: projectId, name: projectName, packageIds: ['softcore', 'softgfx'] }],
    }),
    files: JSON.stringify({ byId: filesById, dirtyFileIds: [], fileOrder: { [`${projectId}:root`]: fileOrder } }),
    assets: JSON.stringify({ byId: {}, assetOrder: { [`${projectId}:root`]: [] } }),
    folders: JSON.stringify({ items: [] }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  };
  return JSON.stringify(state);
}

function run(projectId: string, projectName: string, files: FileSpec[], waitMs = 3000) {
  const persistedState = buildPersistedState(projectId, projectName, files);
  cy.visit(`/projects/${projectId}/edit`, {
    onBeforeLoad(win) {
      win.localStorage.setItem('persist:softBASIC', persistedState);
    },
  });
  cy.get('[aria-label="Run project"]', { timeout: 10000 }).click();
  cy.wait(waitMs);
}

function consoleLines(): Cypress.Chainable<string[]> {
  return cy.get('ul li').then(($items) => Cypress._.map($items.toArray(), (el) => (el as HTMLElement).innerText.trim()));
}

function findLine(lines: string[], needle: string): string | undefined {
  return lines.find((l) => l.includes(needle));
}

function iframeWindow(): Cypress.Chainable<Window & { eval: (s: string) => unknown }> {
  return cy.get('iframe[title="Preview"]').then(($f) => ($f[0] as HTMLIFrameElement).contentWindow as Window & { eval: (s: string) => unknown });
}

describe('kinematic movement + tile collision', () => {
  it('moves a sprite by setVelocity() alone, with no collision grid active', () => {
    const source = `
dim s
dim frames = 0

function oninit()
  s = new sprite("dot.png")
  s.setVelocity(100, 0)
  world.add(s)
endfunction

function onupdate(delta)
  frames = frames + 1
  if frames = 30 then
    print "x=" + string.str(s.transform.x())
  endif
endfunction
`.trim();

    run('kinematic01', 'Kinematic Free Move', [{ name: 'Main', source }]);
    cy.get('span').contains('ERR').should('not.exist');
    consoleLines().then((lines) => {
      const line = findLine(lines, 'x=');
      expect(line, 'x= checkpoint reported after 30 frames').to.be.a('string');
      const x = Number(/x=([0-9.eE+-]+)/.exec(line as string)?.[1]);
      // 30 real frames at ~100px/s: exact value depends on real frame timing,
      // but it must have moved meaningfully to the right and stayed well
      // short of an unbounded runaway value.
      expect(x, `sprite x after 30 frames of vx=100`).to.be.within(1, 100);
    });
  });

  it('stops a sprite at a solid tile and reports isBlockedRight()', () => {
    const source = `
dim s
dim frames = 0
dim reportedBlocked = false

function oninit()
  s = new sprite("dot.png")
  s.transform.setPosition(0, 0)
  s.setVelocity(500, 0)
  world.add(s)
endfunction

function onupdate(delta)
  frames = frames + 1
  if s.isBlockedRight() and reportedBlocked = false then
    reportedBlocked = true
    print "blocked-x=" + string.str(s.transform.x())
  endif
  if frames = 60 then
    print "final-x=" + string.str(s.transform.x())
    print "final-blocked=" + string.str(s.isBlockedRight())
  endif
endfunction
`.trim();

    run('kinematic02', 'Kinematic Tile Block', [{ name: 'Main', source }]);

    // Install a synthetic solid-tile grid directly against the running
    // game's _sb before the sprite has moved far -- no real .stm asset is
    // needed since setupTileCollision only reads the shape below.
    iframeWindow().then((win) => {
      win.eval(`
        _sb.setupTileCollision({
          _handle: {
            _layerContainers: {
              walls: { _isCollisionLayer: true, _map: [[0,0,1,0,0]], _tileW: 20, _tileH: 20 },
            },
          },
        });
      `);
    });

    cy.wait(2000);

    cy.get('span').contains('ERR').should('not.exist');
    consoleLines().then((lines) => {
      expect(findLine(lines, 'blocked-x='), 'sprite reported isBlockedRight() at least once').to.be.a('string');
      const finalBlockedLine = findLine(lines, 'final-blocked=');
      expect(finalBlockedLine, 'final-blocked checkpoint reported').to.be.a('string');
      expect(finalBlockedLine).to.include('true');

      const finalXLine = findLine(lines, 'final-x=') as string;
      const finalX = Number(/final-x=([0-9.eE+-]+)/.exec(finalXLine)?.[1]);
      // Wall starts at tile col 2 * 20px = x:40. The sprite's right edge
      // must be clipped at or before that boundary, not pass through it.
      expect(finalX, 'sprite stopped at/before the wall, did not pass through').to.be.lessThan(40);
    });
  });
});
```

> **Note for the implementer:** this spec assumes a `dot.png` asset resolves the same way `deltaUnits.cy.ts`/`tutorials.cy.ts` handle missing assets in the runner (check how those specs seed or stub asset loading — `tutorials.cy.ts`'s `buildPersistedState` supports an `assetNames` parameter with a stand-in 1×1 PNG; adapt this spec's `buildPersistedState`/`run` to seed a `dot.png` asset the same way if the runner requires assets to actually exist, rather than assuming a bare filename works with no seeded asset).

- [ ] **Step 2: Run the spec**

This requires the dev server running first (per `CLAUDE.md`, Cypress does not start it):

```bash
npm run dev
```

In a second terminal:

```bash
npx cypress run --spec cypress/e2e/kinematicCollision.cy.ts
```

Expected: both tests pass. If they don't, read the actual browser console output Cypress captures and adjust the fixture (tile size, starting position, wall column) — the exact numbers in this spec were hand-computed against the `_resolveAxis` algorithm in Task 4 for a default sprite size; if `dot.png`'s real dimensions differ from the assumption, the wall-crossing frame count and final-x bound may need adjusting.

- [ ] **Step 3: Commit**

```bash
git add cypress/e2e/kinematicCollision.cy.ts
git commit -m "test: add Cypress e2e spec for kinematic movement and tile collision"
```

---

### Task 11: Roadmap sync

**Files:**
- Modify: `docs/roadmap.md`

Per `CLAUDE.md`'s "Adding a new language feature" step 6 — this closes out the "Next up — Tile collision helper" item.

- [ ] **Step 1: Update `docs/roadmap.md`**

Find the `## Next up — Tile collision helper (patch bump)` section (currently ends with the "Original open question 1 (API shape) — reopened by a bigger question, not resolved" paragraph). Replace that whole section's body with a closure, following the same style as other resolved items in the "Known issues" numbered list (e.g. item 21/22's `**[RESOLVED, ...]**` pattern) — strike through what's resolved, state what shipped, and note the one deliberately deferred sub-feature so it isn't silently dropped:

```markdown
## ~~Next up — Tile collision helper~~ **[DONE — shipped as v0.6.13, 2026-08-13]**

**Goal:** A built-in solid-tile/platformer collision primitive, so authors stop having to hand-roll AABB-vs-tilemap collision themselves.

**Resolved, in full:** both open questions from the design phase are now shipped code, not proposals.

- **"How is solid defined" (resolved 2026-08-12):** a dedicated, paintable `'collision'` layer kind in the Tilemap Editor (boolean solid/not-solid grid) — not a per-tile-ID flag. Every collision layer in a `TileMapSet` merges automatically (OR'd), no layer name needed. Already compatible with `pathfinding.setup` unchanged.
- **"API shape" (resolved 2026-08-13):** reframed as a three-tier movement model — `setPosition` (unchanged), a new **kinematic** tier (`setVelocity(vx, vy)`, engine-applied every frame, axis-separated tile clipping, `isBlockedUp/Down/Left/Right()`), and a **rigid body** tier (full physics — deliberately parked, not designed, no physics library in `package.json`). Full design: `docs/superpowers/specs/2026-08-12-kinematic-tile-collision-design.md`. Implementation: `docs/superpowers/plans/2026-08-12-tilemap-collision-layer-plan.md` (collision layer) and `docs/superpowers/plans/2026-08-13-kinematic-movement-plan.md` (kinematic movement).

**Deliberately deferred, not dropped (tracked as future work, not this item):**
- Sprite-vs-sprite kinematic collision *response* — needs a collision-mask/category concept first (which sprites should collide with which).
- Rigid-body / full physics (mass, forces, impulses) — tier 3 above, parked indefinitely, revisit only if a real game needs it.
- Pixel-perfect / shaped collision masks beyond per-cell solid/not-solid.
- Tooling to auto-derive a collision layer from existing tile layers (a second-iteration editor convenience).
- Multiple simultaneous active tile-collision maps (`setupTileCollision` mirrors `pathfinding.setup`'s single-active-map model).
```

- [ ] **Step 2: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs: close out tile collision helper roadmap item"
```

(This commit will be folded into the same push as the rest of this feature per the user's "we will push once plan 2 is implemented" — don't push yet, see Task 12.)

---

### Task 12: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full Vitest suite**

```bash
npx vitest run
```

Expected: all tests pass, including every test added in Tasks 1–8, with no regressions in the pre-existing suite (Component 1's 1415-passing baseline plus this plan's additions).

- [ ] **Step 2: Verify the build**

```bash
npx vite build
```

Expected: builds cleanly, no errors. (Per `CLAUDE.md`, do not use `tsc --noEmit` — pre-existing env issue unrelated to this work.)

- [ ] **Step 3: Manual browser verification**

Start the dev server and, in the Editor, write a small test game exercising the full loop by hand (not just the Cypress spec):
1. Create a sprite, call `setVelocity(100, 0)`, confirm it moves across the canvas on its own with no other code.
2. Build a tilemap in the Tilemap Editor with a `'collision'` layer (reuse an existing demo's `.stm` or paint a small new one), export it, load it via `TileMapSet`, call `collision.setupTileCollision`, and confirm a moving sprite stops cleanly at the wall instead of overlapping it.
3. Confirm diagonal movement into a wall slides along it (set both `vx` and `vy` toward a wall corner) rather than stopping dead.
4. Confirm `isBlockedDown()` behaves as expected for a simple "grounded" check (set `vy` positive toward a floor collision layer, confirm it flips `true` on landing).
5. Switch scenes (or call `scene.switch` to a second scene) and confirm no stale collision grid from the first scene leaks into the second (a sprite with velocity in the new scene should NOT be blocked by the old scene's walls unless the new scene also calls `setupTileCollision`).

- [ ] **Step 4: Run the Cypress e2e suite**

Per `CLAUDE.md`: `npm run dev` in one terminal, then in another:

```bash
npx cypress run
```

Expected: the new `kinematicCollision.cy.ts` spec passes, and no existing spec (`tutorials.cy.ts`, `demos.cy.ts`, etc.) regresses — this feature changes shared runtime code (`lifecycle.js`, `stage.js`) that every existing game exercises, even ones that never call `setVelocity`.

- [ ] **Step 5: Report back to the user**

Summarize: full suite pass count, build success, manual verification results (all 5 checks from Step 3), Cypress results. Per this project's established convention, do **not** push yet — the user said "we will push once plan 2 is implemented," meaning Component 1 and Component 2 push together in one release-notes/version-bump commit. Wait for explicit confirmation before running the release-notes + version bump + push sequence from `CLAUDE.md`'s "Pushing to main" section.
