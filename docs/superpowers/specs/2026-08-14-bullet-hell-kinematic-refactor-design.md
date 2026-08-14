# Bullet Hell Shooter — kinematic movement refactor design

## Problem

The bullet-hell-shooter demo predates the kinematic movement + tile collision feature (`docs/superpowers/specs/2026-08-12-kinematic-tile-collision-design.md`, shipped as Component 1 + Component 2). `Player.bas` hand-rolls its own wall collision: it samples a single point (`self.level.tileAt("walls", newX, y)`) per axis before committing a move. This is exactly the fragile pattern the new feature exists to replace — the user originally reported this demo's sprite "partly overlaps walls" (the motivating bug for the whole feature). Now that kinematic movement is shipped, the Player should use it instead of hand-rolled collision.

## Scope

**In scope:** `Player.bas` only.

**Out of scope (explicitly, per discussion):**
- `Bullet.bas` — keeps its own hand-rolled `vx`/`vy` + single-point `tileAt` wall check. Not touched.
- `Mob.bas` — uses `pathfinding.navigateTo`, a different system (precomputed path avoiding blocked cells by construction, not velocity-driven). Not touched.

## Change 1: `math.normalizeX` / `math.normalizeY`

Two new functions in `src/lib/Basic4WebGL/defs/math.bas` (hand-written, not descriptor-generated — same file family as the existing `math.clamp`/`math.lerp`/`math.distance` compound-expression functions).

Every existing `math.*` function returns a single number — there is no precedent in this module for a function returning a compound/vector value. Rather than introduce a new pattern (e.g. an array return), this adds two scalar-returning functions, one per axis, matching the module's existing style exactly:

```bas
function normalizeX(x, y):return call("(normalizex_x === 0 && normalizex_y === 0) ? 0 : normalizex_x / Math.sqrt(normalizex_x*normalizex_x + normalizex_y*normalizex_y)"):endfunction
function normalizeY(x, y):return call("(normalizey_x === 0 && normalizey_y === 0) ? 0 : normalizey_y / Math.sqrt(normalizey_x*normalizey_x + normalizey_y*normalizey_y)"):endfunction
```

Both guard the zero-vector case (no input direction) by returning `0` rather than `NaN` from a `0/0` division. Redundant magnitude computation across the two calls (each call recomputes `sqrt(x²+y²)` independently) is accepted — this is called at most once per frame per moving sprite, negligible cost, and keeps each function callable independently and correctly on its own (no hidden coupling between the two calls).

Placed alongside the module's other trig/vector-ish helpers (near `distance`), matching `math.bas`'s existing one-line `function name(...):return call("..."):endfunction` formatting for compound-expression functions.

**Tests:** `tests/lib/Basic4WebGL/unit/transpiler/math.test.ts` (existing file — extend it) covering: compiles without error, emits the expected `Math.sqrt(...)` expression, and the zero-vector guard is present in the emitted code (can't easily assert *runtime* NaN-avoidance from a transpiler-output test, but the ternary guard's presence in emitted code is directly checkable).

## Change 2: `Player.bas` movement

Current `onupdate` (relevant excerpt):

```bas
moveX = 0
moveY = 0
if input.getKeyDown(87) then : moveY = -1 : endif
if input.getKeyDown(83) then : moveY = 1 : endif
if input.getKeyDown(65) then : moveX = -1 : endif
if input.getKeyDown(68) then : moveX = 1 : endif

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

New version:

```bas
moveX = 0
moveY = 0
if input.getKeyDown(87) then : moveY = -1 : endif
if input.getKeyDown(83) then : moveY = 1 : endif
if input.getKeyDown(65) then : moveX = -1 : endif
if input.getKeyDown(68) then : moveX = 1 : endif

nx = math.normalizeX(moveX, moveY)
ny = math.normalizeY(moveX, moveY)
self.setVelocity(nx * 150, ny * 150)
```

(`nx`, `ny` are new `dim`s in the local variable block at the top of `onupdate`, alongside the existing `moveX`/`moveY`/etc.)

`x`/`y`/`newX`/`newY` locals and the `self.transform.setPosition(x, y)` call at the end are removed entirely — the engine now owns position mutation for this sprite (applied automatically after `onupdate` returns, per the kinematic movement design). `self.level` stays on the class (still needed — `spawnBullet` passes it to `Bullet`'s constructor, and `Bullet.bas` is out of scope so still does its own `tileAt` check).

**Behavioral changes, both intentional:**
- **Diagonal speed normalized.** Today, holding two movement keys moves at ~212px/s (150 on each independent axis) instead of the intended 150px/s. `normalizeX`/`normalizeY` fix this — diagonal movement is now capped at the same 150px/s as straight movement.
- **Collision becomes full-AABB, not single-point.** The player's whole bounding box now clips against the collision layer (via the already-shipped `_resolveAxis` axis-separated resolution), instead of a single sampled point at the destination. This directly fixes the originally-reported overlap bug.

**One documented non-issue:** the aim-angle calculation (`aimAngle = math.atan2(mouseWorldY - y, mouseWorldX - x)`) reads `self.transform.x()/y()` at the *start* of `onupdate`, which — now that movement is applied after `onupdate` returns — reflects the position resolved at the end of the *previous* frame, not this frame's post-move position. This is a one-frame lag in aim tracking relative to movement, imperceptible at normal frame rates, and identical to how every other kinematic-movement sprite already behaves (e.g. `isBlockedX()` also reports "as of the last resolved frame"). Not a bug to work around.

**Tests:** no new transpiler-level tests needed beyond what Component 2 already covers for `setVelocity`/kinematic resolution generally (`sprite.test.ts`, `collision.test.ts`, `lifecycle.test.ts` — all already exist and already pass). `Player.bas` itself isn't unit-tested today (no `tests/.../Player.test.ts` exists, and this refactor doesn't change that) — verification is via the Cypress demo spec (below) and manual play-testing.

## Change 3: Map collision layers

For each of `map1.stm`, `map2.stm`, `map3.stm` (the three level maps, authored in the Tilemap Editor, exported into `demo-src/bullet-hell-shooter/assets/`):

1. Open the map in the Tilemap Editor.
2. Add a new layer: kind `collision`, name `collision`.
3. Paint the `collision` layer to match the existing `walls` layer's solid-cell footprint exactly (same cells marked solid as `walls` currently has non-zero tile IDs).
4. Re-export the `.stm` file, replacing the one in `demo-src/bullet-hell-shooter/assets/`.

`walls` is untouched and keeps rendering exactly as today (it's tile art, unaffected by adding a sibling `collision` layer). The `collision` layer is data-only and renders nothing, per the existing Component 1 loader behavior.

**Per-level scene changes** (`Level1Scene.bas`, `Level2Scene.bas`, `Level3Scene.bas` — read each to confirm they follow the same `onenter()`/`wallLayers()` shape as `Level1Scene.bas` shown during brainstorming; adjust each identically):

```bas
function onenter()
  ...
  dim tm as tilemapset
  tm = new tilemapset("map1.stm")   ' (mapN.stm per scene)
  world.add(tm)
  self.tilemapset = tm

  collision.setupTileCollision(tm)   ' <-- new line
  pathfinding.setup(tm, self.wallLayers())
  ...
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "collision")    ' <-- was "walls"
  return layers
endfunction
```

`pathfinding.setup` and `collision.setupTileCollision` now both read the same `collision` layer — one authoritative definition of solidity per level, instead of two independently-maintained ones. Order of the two setup calls doesn't matter (independent state).

**Tests:** the existing `cypress/e2e/demos.cy.ts` spec already seeds this demo's real `.b4wgl.json` export and asserts no `ERR` console entries on Run — this catches any compile/runtime break from the refactor. Per `CLAUDE.md`'s demo-authoring guide and this project's established convention, this spec's expectations don't need code changes (it doesn't assert specific gameplay behavior, only "runs without error"), but the demo's shipped `.b4wgl.json` export (`src/docs/demos/BulletHellShooter.b4wgl.json`) must be regenerated from the updated `demo-src/` + new map assets before that spec will reflect the refactored code — same "export + replace in source control" step described in `docs/demo-authoring-guide.md`.

## Manual verification checklist (post-implementation)

- Player no longer visibly overlaps/clips into walls (the original reported bug).
- Diagonal movement (two keys held) feels capped at the same speed as single-axis movement.
- Player slides along a wall when approaching it at an angle, rather than stopping dead (axis-separated resolution).
- Mobs still path around walls correctly (pathfinding repointed at `collision`, not `walls` — same solid cells, so behavior should be unchanged).
- All three levels (map1/2/3) behave consistently.
- Bullets still behave exactly as before (out of scope, must show zero regression — they still read `tileAt("walls", ...)`, untouched, still keyed off the still-present `walls` tile-art layer).

## Out of scope (explicitly, restated)

- `Bullet.bas` refactor.
- `Mob.bas` / pathfinding movement refactor.
- Any change to `SpawnPoint.bas`, `WeaponPickup.bas`, HUD, or scene-flow logic.
- Any gameplay/balance tuning beyond the diagonal-speed normalization explicitly requested.
