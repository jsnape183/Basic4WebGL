# Bullet Hell Shooter Kinematic Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `Player.bas` in the bullet-hell-shooter demo off hand-rolled single-point tile collision onto the shipped kinematic movement API (`setVelocity` + `collision.setupTileCollision`), add two small `math` helpers this needs (`normalizeX`/`normalizeY`), give all three level maps a `collision` layer, and repoint `pathfinding.setup` at that same layer.

**Architecture:** No new engine code — every primitive this needs already shipped (Component 1: collision tilemap layers; Component 2: kinematic movement). This is pure application: two new `math.bas` functions (thin JS expression wrappers, same style as existing ones), a `Player.bas` rewrite, three `.stm` map files gaining a `collision` layer (derived programmatically from the existing `walls` layer, not hand-painted — see Task 3's rationale), and three scene files' `onenter()`/`wallLayers()` updated to point at it.

**Tech Stack:** softBASIC compiler, `.stm` JSON tilemap format, Vitest, Cypress, `npm run build:demo`.

---

## Prerequisite reading (context, not a task)

- Design doc: `docs/superpowers/specs/2026-08-14-bullet-hell-kinematic-refactor-design.md` — read this first, this plan implements it exactly.
- `docs/superpowers/specs/2026-08-12-kinematic-tile-collision-design.md` and `docs/superpowers/plans/2026-08-13-kinematic-movement-plan.md` — the shipped feature this plan builds on. `sprite.setVelocity`/`animatedsprite.setVelocity`/`collision.setupTileCollision`/`isBlockedUp/Down/Left/Right` all already exist and are tested; this plan does not modify any of them.
- `demo-src/bullet-hell-shooter/Player.bas`, `Level1Scene.bas`, `Level2Scene.bas`, `Level3Scene.bas` — the files this plan edits.
- `src/lib/Basic4WebGL/defs/math.bas` — the file Task 1 extends. Every function in it is a one-line `function name(...):return call("<JS expression>"):endfunction` (or, for void functions elsewhere in the codebase, `call(...)` without `return` — but every function in *this* file returns a value).

---

### Task 1: `math.normalizeX` / `math.normalizeY`

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/math.bas`
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/math.test.ts`
- Modify: `src/docs/api-reference/math.md`

`math.bas` is hand-written (not in `src/lib/Basic4WebGL/library/registry.ts`'s descriptor-generated list — confirm this yourself by checking the registry before editing, same verification step used for every other hand-written `.bas` file this session), so it's edited directly.

- [ ] **Step 1: Write the failing tests**

Add to `tests/lib/Basic4WebGL/unit/transpiler/math.test.ts`, inside the existing `describe('math — new utility functions compile', ...)` block (add two more `test(...)` calls alongside `distance compiles` etc.):

```ts
  test('normalizeX compiles', () => {
    expect(fn('x = math.normalizeX(3, 4)').diagnostics).toHaveLength(0);
  });
  test('normalizeY compiles', () => {
    expect(fn('x = math.normalizeY(3, 4)').diagnostics).toHaveLength(0);
  });
```

And inside the existing `describe('math — output correctness', ...)` block:

```ts
  test('normalizeX emits Math.sqrt(...) and a zero-vector guard', () => {
    const result = fn('x = math.normalizeX(3, 4)');
    expect(result.code).toContain('Math.sqrt(');
    expect(result.code).toContain('=== 0');
  });
  test('normalizeY emits Math.sqrt(...) and a zero-vector guard', () => {
    const result = fn('x = math.normalizeY(3, 4)');
    expect(result.code).toContain('Math.sqrt(');
    expect(result.code).toContain('=== 0');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/math.test.ts`
Expected: FAIL — `normalizeX`/`normalizeY` are not recognized `math` functions.

- [ ] **Step 3: Add the functions to `math.bas`**

In `src/lib/Basic4WebGL/defs/math.bas`, add these two lines near `distance` (after it, before `round`), matching the file's existing one-line-per-function style exactly:

```bas
function normalizeX(x, y):return call("(normalizex_x === 0 && normalizex_y === 0) ? 0 : normalizex_x / Math.sqrt(normalizex_x*normalizex_x + normalizex_y*normalizex_y)"):endfunction
function normalizeY(x, y):return call("(normalizey_x === 0 && normalizey_y === 0) ? 0 : normalizey_y / Math.sqrt(normalizey_x*normalizey_x + normalizey_y*normalizey_y)"):endfunction
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/math.test.ts`
Expected: PASS, including all pre-existing tests in this file.

- [ ] **Step 5: Runtime sanity check (not a Vitest test — this project's transpiler tests only check emitted code, not runtime values; verify the actual math by hand)**

Confirm by inspection that the emitted expression is correct: for `normalizeX(3, 4)`, magnitude is `sqrt(9+16) = 5`, so `normalizeX` should evaluate to `3/5 = 0.6` and `normalizeY` to `4/5 = 0.8` — i.e. `(0.6, 0.8)` is a unit vector (`0.6² + 0.8² = 1`). For `normalizeX(0, 0)`, the guard returns `0` (not `NaN`). Write this confirmation into your task report; no code changes needed if it checks out.

- [ ] **Step 6: Document in the API reference**

Add to `src/docs/api-reference/math.md`, inside the `## Distance and Interpolation` section, after the existing `lerp(a, b, t)` entry (before the next `## Trigonometry` heading):

```markdown

### normalizeX(x, y)

Returns the x component of the direction `(x, y)` scaled to length 1 — useful for making movement speed the same in every direction, even diagonally. Returns 0 if both `x` and `y` are 0.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | X component of the direction |
| y         | number | Y component of the direction |

**Returns:** number

```bas
dim nx
dim ny
nx = math.normalizeX(moveX, moveY)
ny = math.normalizeY(moveX, moveY)
self.setVelocity(nx * 150, ny * 150)   ' always 150 pixels per second, even moving diagonally
```

### normalizeY(x, y)

Returns the y component of the direction `(x, y)` scaled to length 1. See `normalizeX` for the full example — the two are always called together.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | X component of the direction |
| y         | number | Y component of the direction |

**Returns:** number
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/Basic4WebGL/defs/math.bas tests/lib/Basic4WebGL/unit/transpiler/math.test.ts src/docs/api-reference/math.md
git commit -m "feat: add math.normalizeX/normalizeY for direction-vector movement"
```

---

### Task 2: `Player.bas` — kinematic movement

**Files:**
- Modify: `demo-src/bullet-hell-shooter/Player.bas`

No new automated test — `Player.bas` has no existing unit test file (verified during design), and this project's convention for demo `.bas` files is Cypress-level ("no ERR") + manual play-testing, not per-class unit tests. Verification for this task is Step 2 (compile check) plus the full-demo verification in Task 5.

- [ ] **Step 1: Rewrite the movement block**

In `demo-src/bullet-hell-shooter/Player.bas`, in the `onupdate(delta)` function:

1. Add two new locals to the existing `dim` block at the top of the function (alongside `moveX`, `moveY`, etc.): `dim nx` and `dim ny`.
2. Remove these locals, which are no longer used: `dim newX`, `dim newY`. (`x` and `y` stay — still used for the aim-angle calculation later in the function.)
3. Replace this block:

```bas
  if moveX <> 0 then
    newX = x + moveX * 150 * dt
    if self.level.tileAt("walls", newX, y) = 0 then
      x = newX
    endif
  endif
  if moveY <> 0 then
    newY = y + moveY * 150 * dt
    if self.level.tileAt("walls", x, newY) = 0 then
      y = newY
    endif
  endif

  self.transform.setPosition(x, y)
```

with:

```bas
  nx = math.normalizeX(moveX, moveY)
  ny = math.normalizeY(moveX, moveY)
  self.setVelocity(nx * 150, ny * 150)
```

4. Leave everything else in `onupdate` unchanged — `x`/`y` are still read immediately after this block for the aim-angle calculation (`aimAngle = math.atan2(mouseWorldY - y, mouseWorldX - x)`), and per the design doc this now reflects the *previous* frame's resolved position (a one-frame lag), which is intentional and not something to fix.

- [ ] **Step 2: Compile check**

There's no dedicated test file for this demo's `.bas` sources, so verify compilation directly:

```bash
npm run check:demo -- demo-src/bullet-hell-shooter
```

Expected output: `OK — 14 file(s) compiled with zero diagnostics.` (14 is the current count of `.bas` files directly in `demo-src/bullet-hell-shooter/`; confirm with `ls demo-src/bullet-hell-shooter/*.bas | wc -l` if in doubt — the important thing is "zero diagnostics", not the exact count).

- [ ] **Step 3: Commit**

```bash
git add demo-src/bullet-hell-shooter/Player.bas
git commit -m "feat: move bullet-hell-shooter Player to kinematic movement"
```

---

### Task 3: Add a `collision` layer to all three maps

**Files:**
- Modify: `demo-src/bullet-hell-shooter/assets/map1.stm`
- Modify: `demo-src/bullet-hell-shooter/assets/map2.stm`
- Modify: `demo-src/bullet-hell-shooter/assets/map3.stm`

**Why scripted, not hand-painted in the Tilemap Editor:** the design doc describes this as "paint a `collision` layer matching `walls`' footprint" via the editor UI — the actual required *outcome* is a `.stm` file with a `collision`-kind layer whose solid cells are identical to `walls`' non-zero cells. `.stm` is plain JSON (confirmed: `{tileWidth, tileHeight, tileImage, layers: {name: number[][] | {type, ...}}}`), and a `'collision'` layer's on-disk shape is `{type: 'collision', data: number[][]}` (per `docs/superpowers/specs/2026-08-12-kinematic-tile-collision-design.md`). Deriving this data mechanically from the existing `walls` layer is exact and reproducible — hand-painting in the UI risks a pixel/cell mismatch against `walls` that a script cannot. Do this with a one-off Node script (not committed — it's a one-time content transform, not reusable tooling); the checked-in artifact is the resulting `.stm` files, not the script.

- [ ] **Step 1: Write and run a one-off transform script**

Create a temporary script (e.g. in your scratchpad, NOT committed to the repo) — adapt paths as needed:

```js
// scratch: add-collision-layer.mjs
import { readFileSync, writeFileSync } from 'node:fs';

for (const mapPath of [
  'demo-src/bullet-hell-shooter/assets/map1.stm',
  'demo-src/bullet-hell-shooter/assets/map2.stm',
  'demo-src/bullet-hell-shooter/assets/map3.stm',
]) {
  const doc = JSON.parse(readFileSync(mapPath, 'utf-8'));
  const walls = doc.layers.walls;
  if (!Array.isArray(walls)) {
    throw new Error(`${mapPath}: expected "walls" to be a tile-art layer (array), got ${JSON.stringify(walls)}`);
  }
  const collisionData = walls.map((row) => row.map((cell) => (cell ? 1 : 0)));
  doc.layers.collision = { type: 'collision', data: collisionData };
  writeFileSync(mapPath, JSON.stringify(doc, null, 2), 'utf-8');
  const solidCount = collisionData.flat().filter(Boolean).length;
  console.log(`${mapPath}: added collision layer, ${solidCount} solid cells`);
}
```

Run: `node scratch/add-collision-layer.mjs` (or wherever you placed it). Confirm the console output reports a non-zero solid-cell count for all three maps (sanity check — a `0` would mean `walls` was empty or the script read the wrong field).

- [ ] **Step 2: Verify the transform**

For each of the three `.stm` files, confirm via a quick inline check (e.g. `node -e "..."` or `python3 -c "..."`) that:
1. `layers.collision` exists and has shape `{type: 'collision', data: [...]}`.
2. `layers.collision.data` has the exact same dimensions as `layers.walls`.
3. Every cell where `layers.walls[r][c]` is non-zero has `layers.collision.data[r][c] === 1`, and every cell where `walls` is `0` has `collision.data[r][c] === 0` (i.e. an exact non-zero-to-1 mapping, cell for cell).
4. `layers.walls` itself is byte-for-byte unchanged (still the original tile IDs, not touched by the script).

- [ ] **Step 3: Commit**

```bash
git add demo-src/bullet-hell-shooter/assets/map1.stm demo-src/bullet-hell-shooter/assets/map2.stm demo-src/bullet-hell-shooter/assets/map3.stm
git commit -m "feat: add collision layer to bullet-hell-shooter maps, derived from walls"
```

(Delete or leave the scratch script outside the repo — do not commit it.)

---

### Task 4: Wire `collision.setupTileCollision` + repoint `pathfinding.setup`

**Files:**
- Modify: `demo-src/bullet-hell-shooter/Level1Scene.bas`
- Modify: `demo-src/bullet-hell-shooter/Level2Scene.bas`
- Modify: `demo-src/bullet-hell-shooter/Level3Scene.bas`

All three scenes share an identical shape (confirmed during design: same `onenter()`/`wallLayers()` structure, differing only in which `mapN.stm` they load). Apply the same two edits to each.

- [ ] **Step 1: Edit `Level1Scene.bas`**

In `onenter()`, immediately after `world.add(tm)` / `self.tilemapset = tm` and before the existing `pathfinding.setup(tm, self.wallLayers())` line, add:

```bas
  collision.setupTileCollision(tm)
```

Then in `wallLayers()`, change:

```bas
function wallLayers()
  dim layers(0)
  array.push(layers, "walls")
  return layers
endfunction
```

to:

```bas
function wallLayers()
  dim layers(0)
  array.push(layers, "collision")
  return layers
endfunction
```

- [ ] **Step 2: Apply the identical two edits to `Level2Scene.bas` and `Level3Scene.bas`**

Same `collision.setupTileCollision(tm)` insertion point (after the tilemap is created and added, before `pathfinding.setup`), same `wallLayers()` change (`"walls"` → `"collision"`).

- [ ] **Step 3: Compile check**

```bash
npm run check:demo -- demo-src/bullet-hell-shooter
```

Expected: `OK — 14 file(s) compiled with zero diagnostics.` (same command and expectation as Task 2 Step 2).

- [ ] **Step 4: Commit**

```bash
git add demo-src/bullet-hell-shooter/Level1Scene.bas demo-src/bullet-hell-shooter/Level2Scene.bas demo-src/bullet-hell-shooter/Level3Scene.bas
git commit -m "feat: activate tile collision and repoint pathfinding at collision layer"
```

---

### Task 5: Rebuild the shipped demo export + full verification

**Files:**
- Modify: `src/docs/demos/BulletHellShooter.b4wgl.json` (regenerated, not hand-edited)

- [ ] **Step 1: Rebuild the demo export**

Run: `npm run build:demo -- demo-src/bullet-hell-shooter BulletHellShooter`

(Confirm `BulletHellShooter` is the correct slug by checking the existing filename `src/docs/demos/BulletHellShooter.b4wgl.json` before running — this must match exactly or the script will write a differently-named file instead of updating the existing one.)

Expected: the command reports how many `.bas` files and assets were bundled, and `src/docs/demos/BulletHellShooter.b4wgl.json` is overwritten in place. Confirm via `git diff --stat src/docs/demos/BulletHellShooter.b4wgl.json` that the file actually changed (if it's byte-identical to before, something didn't pick up — investigate before proceeding, since the whole point of this task is to ship the updated maps/Player/scenes).

- [ ] **Step 2: Full Vitest suite**

Run: `npx vitest run`
Expected: all tests pass, including Task 1's new `math.test.ts` additions, with no regressions anywhere else in the project.

- [ ] **Step 3: Build verification**

Run: `npx vite build`
Expected: builds cleanly (per `CLAUDE.md`, do not use `tsc --noEmit`).

- [ ] **Step 4: Cypress — demo spec**

Start the dev server (`npm run dev` in one terminal; Cypress does not start it itself per `CLAUDE.md`), then run:

```bash
npx cypress run --spec cypress/e2e/demos.cy.ts
```

Expected: the bullet-hell-shooter demo's existing `describe` block in `demos.cy.ts` still passes (no `ERR` console entries) using the freshly-rebuilt `.b4wgl.json` from Step 1. This is the smoke test that the refactor didn't break compilation or cause an immediate runtime crash — it does not assert specific gameplay/collision behavior (that's Step 6, manual).

- [ ] **Step 5: Full Cypress suite (regression check)**

```bash
npx cypress run
```

Expected: every spec passes, not just `demos.cy.ts` — this refactor didn't touch shared engine code (only demo content + the two new `math` functions, which are additive), so no regression is expected anywhere else, but confirm it directly rather than assuming.

Stop the dev server afterward.

- [ ] **Step 6: Manual play-test verification (in a real browser, via the deployed demo)**

Per the design doc's manual verification checklist — play through the demo (or at minimum Level 1) and confirm:
1. Player no longer visibly overlaps/clips into walls.
2. Diagonal movement (two keys held, e.g. W+D) feels capped at the same speed as single-axis movement — no longer visibly faster.
3. Approaching a wall at an angle causes the player to slide along it rather than stopping dead.
4. Mobs still path around walls correctly and don't walk through them (pathfinding now reads the `collision` layer instead of `walls` — same solid cells, so this should be visually unchanged from before the refactor).
5. Bullets still behave exactly as before — they're out of scope for this refactor and still read the untouched `walls` tile-art layer directly.
6. Spot-check Level 2 and Level 3 (not just Level 1) for the same collision behavior, since all three maps were edited.

- [ ] **Step 7: Report and stop**

Report the full verification results (Vitest pass count, build success, both Cypress runs' results, manual checklist results) back. Per this project's established convention (do not push unless explicitly asked), do not run the release-notes/version-bump/push sequence — this is a demo-content change; per `CLAUDE.md`'s versioning exception ("doesn't affect the editor UI, the runtime/engine, or the softBASIC language/library"), note for the user that this change DOES touch the softBASIC library (`math.bas` gained two functions) even though the bulk of the change is demo content, so when the user does ask to push, this needs a release-notes entry and patch version bump like any other library addition — don't assume it's exempt just because most of the diff is demo files.
