# Runtime Collision Toggling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `collision.setTileSolid(x, y, solid)` and `collision.isTileSolid(x, y)` — the ability to flip a single tile's solidity at runtime, against the *active* collision grid `collision.setupTileCollision` already builds. This is what lets a `.stm` file's collision layer be just the *starting* state (e.g. a locked door that opens once the player has a key), rather than fixed for the whole game.

**Architecture:** Both functions live in `collision.js` (not `tilemapset`) because they must mutate the same already-merged `_tileCollisionGrid` singleton that `_applyKinematics`/`_resolveAxis` read every frame — mutating a tilemap's raw per-layer data wouldn't touch that merged grid at all. Both reuse the exact world→row/col conversion `_resolveAxis` already performs via the existing `_tileGridOffset` helper — no new coordinate-conversion logic. This is Component 3 of the kinematic-movement/tile-collision work (Component 1: collision layers, Component 2: kinematic movement, this: runtime toggling) and this is a prerequisite for a following demo plan (Zelda-style adventure) that isn't part of this plan.

**Tech Stack:** softBASIC compiler, PIXI.js runtime engine (`collision.js`), Vitest.

---

## Prerequisite reading (context, not a task)

- Design doc: `docs/superpowers/specs/2026-08-15-zelda-adventure-demo-design.md` — read the "New engine feature" section, this plan implements it exactly.
- `src/components/Runner/engine/collision.js` — read `setupTileCollision`, `_tileCollisionReset`, `_isSolidCell`, `_tileGridOffset` in full (all already shipped, all reused unchanged by this plan).
- `tests/components/Runner/collision.test.ts` — read the existing `setupTileCollision` describe block and its `loadCollision`/`makeCollisionLayer`/`makeTileMapSet`/`makeHandle`/`makeGridFixture` helpers; this plan's new tests reuse them.
- `src/lib/Basic4WebGL/defs/collision.bas` — hand-written (not descriptor-generated — confirmed absent from `src/lib/Basic4WebGL/library/registry.ts`'s generated-files list), edited directly, same as `setupTileCollision`'s own definition already is.

---

### Task 1: `collision.setTileSolid` / `collision.isTileSolid` — engine implementation

**Files:**
- Modify: `src/components/Runner/engine/collision.js`
- Modify: `tests/components/Runner/collision.test.ts`

- [ ] **Step 1: Write the failing tests**

Add a new describe block to `tests/components/Runner/collision.test.ts`, after the existing `describe('setupTileCollision', ...)` block:

```ts
describe('setTileSolid / isTileSolid', () => {
  test('setTileSolid flips a not-solid cell to solid', () => {
    const c = loadCollision();
    const walls = makeCollisionLayer([[0, 0], [0, 0]]);
    c.setupTileCollision(makeTileMapSet({ walls }));

    expect(c.isTileSolid(5, 5)).toBe(false); // world (5,5) -> row 0, col 0
    c.setTileSolid(5, 5, true);
    expect(c.isTileSolid(5, 5)).toBe(true);
    expect(c._isSolidCell(c._tileCollisionGrid, 0, 0)).toBe(true);
  });

  test('setTileSolid flips a solid cell to not-solid', () => {
    const c = loadCollision();
    const walls = makeCollisionLayer([[1, 1], [1, 1]]);
    c.setupTileCollision(makeTileMapSet({ walls }));

    expect(c.isTileSolid(5, 5)).toBe(true);
    c.setTileSolid(5, 5, false);
    expect(c.isTileSolid(5, 5)).toBe(false);
  });

  test('setTileSolid on out-of-range coordinates is a safe no-op, not an error', () => {
    const c = loadCollision();
    const walls = makeCollisionLayer([[0, 0], [0, 0]]);
    c.setupTileCollision(makeTileMapSet({ walls }));

    expect(() => c.setTileSolid(-500, -500, true)).not.toThrow();
    expect(() => c.setTileSolid(5000, 5000, true)).not.toThrow();
  });

  test('isTileSolid on out-of-range coordinates returns false, not an error', () => {
    const c = loadCollision();
    const walls = makeCollisionLayer([[1, 1], [1, 1]]);
    c.setupTileCollision(makeTileMapSet({ walls }));

    expect(c.isTileSolid(-500, -500)).toBe(false);
    expect(c.isTileSolid(5000, 5000)).toBe(false);
  });

  test('setTileSolid throws if setupTileCollision was never called', () => {
    const c = loadCollision();
    expect(() => c.setTileSolid(5, 5, true)).toThrow(/setupTileCollision/);
  });

  test('isTileSolid throws if setupTileCollision was never called', () => {
    const c = loadCollision();
    expect(() => c.isTileSolid(5, 5)).toThrow(/setupTileCollision/);
  });

  test('a sprite that was blocked by a tile can pass through it after setTileSolid unlocks it', () => {
    const c = loadCollision();
    c._tileCollisionGrid = makeGridFixture(['..#.']); // solid at col 2, x:20-30
    const handle = makeHandle(5, 0, 8, 8); // bounds x:5-13
    handle._sbVelocityX = 100; // dx = 10 per 100ms frame

    c._applyKinematics(handle, 100);
    expect(handle.position.x).toBe(12); // clipped at the wall, as in the existing directional tests
    expect(c.isBlockedRight(handle)).toBe(true);

    c.setTileSolid(25, 0, false); // world (25, 0) falls in the solid column -> open it

    c._applyKinematics(handle, 100);
    expect(handle.position.x).toBe(22); // moved the full 10px this time, wall is gone
    expect(c.isBlockedRight(handle)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/components/Runner/collision.test.ts`
Expected: FAIL — `c.setTileSolid`/`c.isTileSolid` are not functions.

- [ ] **Step 3: Implement `setTileSolid` and `isTileSolid` in `collision.js`**

Add these two methods to the `_sbCollision` object, after `_tileCollisionReset()` and before `_isSolidCell`:

```js
    // Flips whichever cell of the ACTIVE collision grid the world position
    // (x, y) falls in. Out-of-range coordinates are a safe no-op -- matches
    // _isSolidCell's existing lenient out-of-range handling, not an error.
    // This is what makes a .stm file's collision layer only the *starting*
    // state: a locked door tile can start solid and be opened later by
    // calling this once the player has the key, with no need to re-run
    // setupTileCollision or touch the tilemap's own stored layer data.
    setTileSolid(x, y, solid) {
      const grid = this._tileCollisionGrid;
      if (!grid) {
        throw new Error('collision.setTileSolid: call collision.setupTileCollision() first');
      }
      const { offsetX, offsetY } = this._tileGridOffset(grid.reference);
      const col = Math.floor((Number(x) - offsetX) / grid.tileW);
      const row = Math.floor((Number(y) - offsetY) / grid.tileH);
      if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) return;
      grid.solid[row * grid.cols + col] = solid ? 1 : 0;
    },

    // Reads the ACTIVE grid, not the tilemap's original static data --
    // reflects any prior setTileSolid calls, unlike tileMapSet.tileAt()
    // which only ever sees the .stm file's unmodified starting layout.
    isTileSolid(x, y) {
      const grid = this._tileCollisionGrid;
      if (!grid) {
        throw new Error('collision.isTileSolid: call collision.setupTileCollision() first');
      }
      const { offsetX, offsetY } = this._tileGridOffset(grid.reference);
      const col = Math.floor((Number(x) - offsetX) / grid.tileW);
      const row = Math.floor((Number(y) - offsetY) / grid.tileH);
      return this._isSolidCell(grid, row, col);
    },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/Runner/collision.test.ts`
Expected: PASS, including all pre-existing tests in this file.

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: all tests pass, no regressions (this touches shared engine code every kinematic-movement game runs through).

- [ ] **Step 6: Commit**

```bash
git add src/components/Runner/engine/collision.js tests/components/Runner/collision.test.ts
git commit -m "feat: add collision.setTileSolid/isTileSolid for runtime tile toggling"
```

---

### Task 2: `collision.bas` definitions

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/collision.bas`
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts`, after the existing `describe('collision — setupTileCollision', ...)` block:

```ts
// ─── setTileSolid ──────────────────────────────────────────────────────────

describe('collision — setTileSolid', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  collision.setTileSolid(160, 112, true)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.setTileSolid(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  collision.setTileSolid(160, 112, false)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.setTileSolid(');
  });
});

// ─── isTileSolid ───────────────────────────────────────────────────────────

describe('collision — isTileSolid', () => {
  test('compiles without error', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim solid',
      '  solid = collision.isTileSolid(160, 112)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits _sb.isTileSolid(', () => {
    const result = transpileWithCollision([
      'function test()',
      '  dim solid',
      '  solid = collision.isTileSolid(160, 112)',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('_sb.isTileSolid(');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts`
Expected: FAIL — `setTileSolid`/`isTileSolid` are not recognised `collision` functions.

- [ ] **Step 3: Add the functions to `collision.bas`**

In `src/lib/Basic4WebGL/defs/collision.bas`, add at the end of the file:

```bas

function setTileSolid(x, y, solid)
    call("_sb.setTileSolid(settilesolid_x, settilesolid_y, settilesolid_solid)")
endfunction

function isTileSolid(x, y)
    return call("_sb.isTileSolid(istilesolid_x, istilesolid_y)")
endfunction
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts`
Expected: PASS, including all pre-existing tests in this file.

- [ ] **Step 5: Commit**

```bash
git add src/lib/Basic4WebGL/defs/collision.bas tests/lib/Basic4WebGL/unit/transpiler/collision.test.ts
git commit -m "feat: add collision.setTileSolid/isTileSolid definitions"
```

---

### Task 3: API reference docs

**Files:**
- Modify: `src/docs/api-reference/collision.md`

No test — docs are prose, verified by reading. Follow `CLAUDE.md`'s "Writing style for API docs" (beginner audience, no JS/PIXI internals, `number`/`true or false` types, game-like examples).

- [ ] **Step 1: Update the module description line**

Currently reads (after the prior `setupTileCollision` addition): "The `collision` module provides six functions for detecting overlaps, proximity, and line-of-sight between sprites, plus one for setting up automatic tilemap collision." Change to:

```markdown
The `collision` module provides six functions for detecting overlaps, proximity, and line-of-sight between sprites, one for setting up automatic tilemap collision, and two for changing which tiles are solid while the game is running. Include the **softGfx** package to use it.
```

- [ ] **Step 2: Add two new sections**

Add after the existing `setupTileCollision(tileMapSet)` section and before the `## Note: gfx.boxCollide (deprecated)` section:

```markdown
## setTileSolid(x, y, solid)

Changes whether the tile at a position blocks movement, while the game is running — the tilemap's collision layer only sets the *starting* state; this changes it. Use this for things like a locked door that becomes passable once the player has picked up a key.

| Parameter | Type              | Description |
|-----------|-------------------|-------------|
| x         | number            | X position, in pixels, of a point inside the tile to change |
| y         | number            | Y position, in pixels, of a point inside the tile to change |
| solid     | `true` or `false` | `true` to block movement through this tile, `false` to allow it |

A position outside the tilemap is silently ignored. `collision.setupTileCollision` must have been called first.

```bas
if player.hasKey then
  collision.setTileSolid(doorX, doorY, false)
endif
```

## isTileSolid(x, y)

Returns whether the tile at a position currently blocks movement — reflects any changes already made with `setTileSolid`, not just the tilemap's original collision layer.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | X position, in pixels, of a point inside the tile to check |
| y         | number | Y position, in pixels, of a point inside the tile to check |

**Returns:** `true` or `false`. A position outside the tilemap returns `false`. `collision.setupTileCollision` must have been called first.

```bas
if not collision.isTileSolid(doorX, doorY) then
  self.showText("The door is open.")
endif
```
```

- [ ] **Step 3: Commit**

```bash
git add src/docs/api-reference/collision.md
git commit -m "docs: document collision.setTileSolid/isTileSolid"
```

---

### Task 4: Roadmap addendum

**Files:**
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Update the closed "Tile collision helper" entry**

Find `## ~~Next up — Tile collision helper~~ **[DONE — shipped as v0.6.13, 2026-08-14]**` (per `CLAUDE.md` step 6 — this feature partially extends an already-closed roadmap item, so note it there rather than leaving that entry describing a now-slightly-incomplete picture). Add one new bullet under the existing "Resolved, in full" list (after the "API shape" bullet), keeping the existing bullets and their dates unchanged:

```markdown
- **Runtime tile toggling (added 2026-08-15):** `collision.setTileSolid(x, y, solid)` / `collision.isTileSolid(x, y)` let a game change which tiles block movement while running, against the same active grid `setupTileCollision` builds — the tilemap's collision layer is only the starting state. Motivated by a locked-door mechanic in a following demo.
```

- [ ] **Step 2: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs: note runtime tile toggling in the tile collision roadmap entry"
```

---

### Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Full Vitest suite**

Run: `npx vitest run`
Expected: all tests pass, no regressions.

- [ ] **Step 2: Build**

Run: `npx vite build`
Expected: builds cleanly.

- [ ] **Step 3: Manual sanity check**

In the running app (`npm run dev`), create a small scratch project: a tilemap with a `collision` layer with one solid tile, `collision.setupTileCollision(tm)`, a sprite with `setVelocity` moving toward that tile, confirm it's blocked; call `collision.setTileSolid` on that same world position with `false`, confirm the sprite can now move through it; call `collision.isTileSolid` before and after to confirm it reports correctly both times. This does not need to be a full game — a few lines in `Main.bas` exercising the API directly is enough.

- [ ] **Step 4: Report and stop**

Report results. Do not push — per `CLAUDE.md`, this needs a release-notes entry and version bump (it's a real softBASIC library addition) whenever the user asks to push, and per this session's established pattern, this plan's work is a prerequisite for a following demo plan that should land in the same push.
