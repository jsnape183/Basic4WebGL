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

  // Regression coverage for the swept-tile-scan fix: _resolveAxis must check
  // every tile the leading edge sweeps through along the movement axis, not
  // just the single tile it lands in. A naive "check only the destination
  // tile" implementation passes every other test in this file (they only
  // ever cross a single tile boundary in one frame) but fails these two.
  test('a multi-tile jump stops at an intermediate solid tile even though the destination tile is open (tunneling regression)', () => {
    const c = loadCollision();
    // col0 open (start), col1 solid, col2-4 open (including the destination).
    c._tileCollisionGrid = makeGridFixture(['.#...']);
    const handle = makeHandle(0, 0, 8, 8); // bounds x:0-8, entirely within col0
    handle._sbVelocityX = 270; // dx = 27 -> destination bounds x:27-35 (col3, open) but sweeps through col1 (solid)
    c._applyKinematics(handle, 100);

    // A naive destination-only check would see col3 is open and let the
    // sprite sail through to x=27. The correct swept check clips it at
    // col1's boundary instead.
    expect(handle.position.x).toBe(2);
    expect(c.isBlockedRight(handle)).toBe(true);
  });

  test('when the swept range contains multiple solid tiles, the sprite stops at the nearest one, not a farther one', () => {
    const c = loadCollision();
    // col0-1 open (start), col2 solid (near wall), col3 open, col4 solid (far wall).
    c._tileCollisionGrid = makeGridFixture(['..#.#']);
    const handle = makeHandle(0, 0, 8, 8); // bounds x:0-8, within col0
    handle._sbVelocityX = 450; // dx = 45 -> would reach past col4 if unblocked
    c._applyKinematics(handle, 100);

    // Stops at the near wall (col2), never reaches the far wall (col4).
    expect(handle.position.x).toBe(12);
    expect(c.isBlockedRight(handle)).toBe(true);
  });

  // Regression coverage for a second, distinct tunneling bug: when the
  // sprite's leading edge is resting EXACTLY on a solid tile's near boundary
  // (as it is immediately after being clipped there) and velocity still
  // points into the wall, `Math.floor()` of an exact-multiple boundary value
  // resolves to the solid tile's OWN column, not the tile behind it. The
  // swept scan then starts at `startCol + dir`, skipping the solid tile
  // entirely, and the sprite drifts into it frame after frame. This is
  // different from the multi-tile-jump regressions above, which cover fast
  // motion clearing a tile in one frame -- this covers a slow/stationary
  // sprite parked flush against a wall that never gets re-checked.
  test('does not tunnel when resting exactly on a solid tile boundary with velocity still pointing into it', () => {
    const c = loadCollision();
    c._tileCollisionGrid = makeGridFixture(['..#.']); // solid at col 2, x:20-30
    // Right edge (12 + 8 = 20) sits exactly on col 2's near boundary, exactly
    // as it would immediately after being clipped there on a prior frame.
    const handle = makeHandle(12, 0, 8, 8);
    handle._sbVelocityX = 50; // dx = 5 -> still pointing into the wall, dx < tileW
    c._applyKinematics(handle, 100);

    // Must stay clipped at the boundary, not penetrate into col 2.
    expect(handle.position.x).toBe(12);
    expect(c.isBlockedRight(handle)).toBe(true);
  });
});
