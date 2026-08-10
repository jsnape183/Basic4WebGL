# Bullet-Hell Shooter Demo Design

**Date:** 2026-08-10
**Status:** Approved

## Goal

A new top-down shooter demo for the `/demos` page: 3 tilemap-based levels, each populated with mob-spawn points the player must destroy to clear the level, weapon pickups that randomize the player's current weapon, and a speed-run scoring model (fastest total clear time, persisted as a personal best). Showcases `pathfinding` (mobs navigate around walls to chase the player) and tilemap markers (spawn points and weapon pickups are placed visually in the Tilemap Editor, not hardcoded) — both shipped immediately before this demo specifically to unblock it.

## Background

There is an existing design-only spec, `docs/superpowers/specs/2026-06-26-compound-shooter-design.md` ("COMPOUND"), for a similar top-down military shooter. It was never built, and it predates both `TileMapSet` and `pathfinding`: its enemies chase in a straight line with no real navigation, its "levels" are one continuous tilemap with wave-based timed spawning (not a spawn-point-destruction objective), and its win condition is surviving a fixed number of waves rather than clearing objectives. This spec supersedes COMPOUND rather than extending it — the core mechanics (deactivation-by-destruction, spawn points and pickups placed via markers, pathfinding-driven mobs, speed-run scoring) are different enough that reconciling the two designs would produce a worse result than starting fresh. COMPOUND's asset-sourcing thinking (a military tileset/sprite plan) is not reused; this demo sources art from Kenney.nl instead (see Assets, below).

---

## Architecture

Multi-file softBASIC project, following the file-per-responsibility pattern already established by the `coins-platformer` demo (`Main.bas` + `GameData.bas` + per-level `Scene` subclasses + shared helper module + entity classes):

```
Main.bas           — entry point: registers all scenes, switches to "title"
GameData.bas       — shared module-level globals: per-level times, total time, best time (loaded from save on startup)
LevelHelpers.bas   — shared module (not a class — Extends only supports single inheritance) for level-setup logic common to all 3 levels: scanning spawn/pickup markers, spawn-point bookkeeping
TitleScene.bas     — title card, "press any key to start" -> Level1Scene
Level1Scene.bas    — Class Extends scene; gameplay for level 1 (2 spawn points, 6s interval)
Level2Scene.bas    — Class Extends scene; gameplay for level 2 (3 spawn points, 4.5s interval)
Level3Scene.bas    — Class Extends scene; gameplay for level 3 (4 spawn points, 3s interval)
WinScene.bas        — "YOU SURVIVED" — total time, best time, restart
GameOverScene.bas  — "MISSION FAILED" — restart from Level1Scene
Player.bas         — Class Extends sprite: WASD movement, mouse aim, fire, HP, weapon state, invincibility flicker
Mob.bas            — Class Extends sprite: pathfinding-driven chaser, contact damage, HP
SpawnPoint.bas     — Class Extends sprite: HP, per-instance spawn timer, spawns Mob instances, destroyed visual state
WeaponPickup.bas   — Class Extends sprite: single-use, randomizes the player's weapon on pickup
Bullet.bas         — Class Extends sprite: shared by all weapons, parameterized (speed/damage/lifetime) at construction
```

### File responsibilities

**`GameData.bas`** — module-level globals only: `dim levelTimes(3)` (per-level elapsed seconds, index 0-2), `dim bestTime` (loaded once at startup via `save.get("bestTime")`, `-1` or similar sentinel if none saved yet). One instance's worth of state — since it's module-level (not a class), every file in the project can read/write it directly, matching `coins-platformer`'s `GameData.bas` pattern exactly (that one *is* a class passed into constructors; this one can be plain module globals since nothing here needs per-instance semantics — reconsidered from the "always mirror the precedent exactly" instinct: `coins-platformer`'s `GameData` is a class only because multiple demos might theoretically construct multiple instances of the SAME game in one process, which doesn't apply here any more than there than it does here — following it as a plain module is simpler and equally valid for a single-run demo).

**`Main.bas`** — registers `TitleScene`, `Level1Scene`, `Level2Scene`, `Level3Scene`, `WinScene`, `GameOverScene` with `scenemanager`; calls `scenemanager.switch("title")`. No game logic.

**`LevelHelpers.bas`** — shared functions each level scene calls, mirroring `coins-platformer`'s own `LevelHelpers.bas` conventions exactly (verified against that file directly, not assumed):
- `spawnPointsFromMarkers(tileMapSet, tag) as array` — wraps `tileMapSet.markersByTag(tag)`, constructs one `SpawnPoint` instance per returned `Marker`, adds each to `world`, returns the array of instances for the calling scene to track. Called once from each level scene's `onenter()`.
- `pickupsFromMarkers(tileMapSet, tag) as array` — same shape for `WeaponPickup` instances. Called once from `onenter()`.
- `allSpawnPointsDestroyed(spawnPoints) as boolean` — iterates the array, checking each instance's `destroyed` flag (see `SpawnPoint.bas`). Called every frame from each level scene's `onupdate`.
- `checkPickupCollisions(player, pickups)` — loops the pickups array checking `collision.spriteCollide(player, p)` for each, calling `p.collect(player)` on a hit (which applies the random weapon assignment and self-removes). Called every frame from each level scene's `onupdate` — this is the same shape `coins-platformer`'s `LevelHelpers.bas` already uses for its own coin-pickup collision loop (`collision.spriteCollide(player, c)` → `c.collect()`), not a check embedded inside `WeaponPickup`'s own `onupdate`.

**`Level1Scene.bas` / `Level2Scene.bas` / `Level3Scene.bas`** — near-identical structure, differing only in: which `.stm` asset they load, and the two difficulty constants (spawn-point count is implicit in how many `spawn`-tagged markers exist in that level's tilemap; spawn interval is an explicit constant passed to each `SpawnPoint` at construction). Each scene's `onenter()`:
1. Loads its `TileMapSet`, adds to `world`.
2. Creates the `Player` at a marker-defined or hardcoded start position, adds to `world`.
3. Calls `levelhelpers.spawnPointsFromMarkers(tm, "spawn")` and `levelhelpers.pickupsFromMarkers(tm, "pickup")`, storing both arrays.
4. Resets the level's elapsed-time accumulator to 0.
5. Sets up HUD elements (health bar, weapon name, spawn-points-remaining count, timer) via `hud.add()`.

Each scene's `onupdate(delta)`:
1. Accumulates elapsed time into `gamedata.levelTimes(N)` and updates the HUD timer display.
2. Calls `levelhelpers.checkPickupCollisions(player, pickups)`.
3. Checks `levelhelpers.allSpawnPointsDestroyed(spawnPoints)` — on first true, switches to the next level (or `WinScene` after level 3).
4. Checks `player.hp <= 0` — switches to `GameOverScene`.

**`WinScene.bas`** — reads `gamedata.levelTimes`, sums them into a total, compares against `gamedata.bestTime`; if better (or no prior best), calls `save.set("bestTime", total)` and updates `gamedata.bestTime`. Displays both the run's total time and the best time. Any key → `scenemanager.switch("title")`.

**`GameOverScene.bas`** — "MISSION FAILED" message. Any key → resets `gamedata.levelTimes` to zero and `scenemanager.switch("level1")` (the run's current attempt is discarded; only a *completed* run can beat the best time).

**`Player.bas`**
- `animatedsprite` or `sprite` (static is fine — no animation frames strictly required), 100 HP.
- WASD movement at 150px/s; wall collision via `tileMapSet.tileAt(name, x, y) <> 0` on the relevant collision layer (leading-edge check per axis, mirroring the fix already made to `coins-platformer`'s collision, not the naive single-point check that caused that bug).
- Mouse aim: `setAngle(math.atan2(worldMouseY - y, worldMouseX - x))`, world mouse = `input.mouseX() + camera.x()`, `input.mouseY() + camera.y()`.
- Left click or Space → fires the currently-equipped weapon (creates a `Bullet` parameterized by weapon type, respecting that weapon's fire-rate cooldown).
- `currentWeapon` field (string: `"pistol"` default / `"shotgun"` / `"smg"`), changed by `WeaponPickup` collision.
- `takeDamage(amount)` — reduces HP, 0.5s invincibility (sprite flicker via `setAlpha` toggling in `onupdate`) during which further damage is ignored.

**`Mob.bas`**
- `sprite`, small HP (2 hits to kill at the Pistol's 10 damage — i.e. 20 HP, matching Pistol's per-shot damage for a clean "2 pistol hits" mental model).
- `onupdate(delta)`: `pathfinding.navigateTo(self, player.transform.x(), player.transform.y(), speed)` — speed constant per mob (not per-level scaled in this iteration; difficulty scales via spawn *count* and *rate*, not individual mob speed, keeping the tuning surface to one axis for a first version).
- On `collision.spriteCollide` with the player: deals contact damage, subject to a per-mob cooldown (~0.5s) so a stationary mob doesn't deal damage every single frame of contact.
- `hit(damage)` — reduces HP; at 0, `world.remove(self)` and stops being tracked (mobs aren't counted toward the win condition — only spawn points are; a mob that's never spawned again after its point is destroyed simply exists until killed or wanders off, whichever the level scene's cleanup does — see Constraints).

**`SpawnPoint.bas`**
- `sprite`, `hp` field defaulting to 20, `destroyed` boolean flag, `spawnInterval` field (set at construction by the level scene per the difficulty table), an internal elapsed-time accumulator.
- `onupdate(delta)`: if not `destroyed`, accumulate elapsed time; on reaching `spawnInterval`, reset the accumulator and construct one `Mob` at this point's position, add to `world`.
- `hit(damage)` (called by `Bullet` on collision) — reduces `hp`; at 0, sets `destroyed = true`, swaps to a "destroyed" visual (a second static frame or a `setAlpha`/tint change — exact mechanism depends on the sourced Kenney asset's available frames), and stops spawning (the `onupdate` check above already handles this via the flag).

**`WeaponPickup.bas`**
- `sprite`, positioned at a `pickup`-tagged marker.
- `collect(player)` method (mirroring `Coin.bas`'s `collect()` exactly, extended to take the player so it can set the weapon): sets `player.currentWeapon` to one of `"pistol"`/`"shotgun"`/`"smg"` chosen via `math.randomint(3)`, then `world.remove(self)` — single-use, matching the original requirement exactly. Called by `levelhelpers.checkPickupCollisions` (see `LevelHelpers.bas`), not by an internal collision check — `WeaponPickup` itself has no `onupdate`.

**`Bullet.bas`**
- `sprite`, constructed with `(x, y, angle, weaponType)` — internally sets `speed`/`damage`/`lifetime`/`pelletSpread` from a per-weapon-type constant table (a `select`/`if` chain on `weaponType` inside the constructor; no separate config file needed for 3 fixed weapons — YAGNI).
- For Shotgun, the *caller* (Player's fire logic) constructs multiple `Bullet` instances at slightly offset angles (the spread), rather than `Bullet` itself handling multi-pellet fan-out — keeps `Bullet` itself a single-projectile class, matching `coins-platformer`/COMPOUND's precedent of one bullet = one class instance.
- `onupdate(delta)`: moves at `speed` in its fixed direction; each frame checks `tileMapSet.tileAt(...) <> 0` (destroy on wall hit) and `collision.spriteCollide` against every tracked `SpawnPoint`/`Mob` in the current level (destroy + deal damage on hit); auto-destroys after `lifetime` seconds with no hit.

---

## Tilemap & markers

Each level's `.stm` file has (at minimum): a background/floor tile layer, a walls/obstacle tile layer (used both for rendering and as `pathfinding.setup`'s blocking layer and the player's/mob's/bullet's collision checks), a `spawns` marker layer (each marker tagged `"spawn"`), and a `pickups` marker layer (each marker tagged `"pickup"`). Level authoring is entirely visual — no hardcoded coordinates anywhere in the `.bas` files, per the original requirement.

`pathfinding.setup(tileMapSet, wallLayerNames)` is called once in each level scene's `onenter()`, after the tilemap is loaded, so every `Mob` spawned during that level shares the same nav grid.

---

## Combat details

**Player**: 100 HP, 150px/s movement, mouse-aim rotation, left-click/space fire.

**Mobs**: single melee type, 20 HP (2 Pistol hits), contact damage to player (proposing 10 damage per hit, 0.5s cooldown), pathfinding-driven chase.

**Weapons** (one shared `Bullet` class, parameterized per type):

| Weapon | Fire cooldown | Pattern | Damage/hit |
|---|---|---|---|
| Pistol (default) | 300ms | 1 bullet, straight | 10 |
| Shotgun | 800ms | 4-5 bullets, spread cone (~30° total) | 8 each |
| SMG | 100ms | 1 bullet, straight, rapid | 5 |

**Spawn points**: 20 HP, destroyed by player bullets via the same collision/damage path as mobs.

**Weapon pickups**: single-use, `math.randomint(3)` chooses uniformly among the 3 weapon types (may repeat the player's current weapon — no exclusion logic, keeping it simple).

**Difficulty progression** (per level, set at `SpawnPoint` construction time in each level scene):

| Level | Spawn points (= marker count in that level's `.stm`) | Spawn interval |
|---|---|---|
| 1 | 2 | 6s |
| 2 | 3 | 4.5s |
| 3 | 4 | 3s |

---

## Win / lose flow & scoring

- **Level clear**: `levelhelpers.allSpawnPointsDestroyed(...)` returns true → a "LEVEL CLEAR" HUD overlay shown for 2 seconds (a level-scene-local timer, same accumulate-and-check pattern used everywhere else in this design), then `scenemanager.switch()` to the next level (or `WinScene` after level 3). Existing mobs from that level are not required to be cleared — only spawn points gate progression (see Constraints).
- **Win**: `WinScene` sums `gamedata.levelTimes` into a total, compares against `gamedata.bestTime` (loaded from `save` at startup), updates+persists via `save.set("bestTime", ...)` if the new run is faster (or no prior best exists). Displays both the run's total and the best.
- **Lose**: player HP reaches 0 → `GameOverScene` ("MISSION FAILED"), any key resets `gamedata.levelTimes` and restarts at `Level1Scene`. A run that ends in death does **not** get compared against the best time — only a completed win counts, so a lucky-but-incomplete fast start can't corrupt the persisted best.
- **Timer**: each level scene accumulates its own elapsed time into `gamedata.levelTimes(N)` every frame; the HUD shows a running `MM:SS` clock for the current level only (not a cumulative total mid-run, to keep the in-level HUD simple — the total is computed and shown once, on `WinScene`).

---

## HUD

Screen-space (`hud.add()`), present during all 3 level scenes:
- **Top-left**: health bar (`drawing.drawRect`, green fill scaled to `player.hp / 100`, dark background) + "HP" label.
- **Top-right**: current weapon name (`text`), spawn points remaining count (`text`, computed each frame from the tracked array).
- **Top-center**: level timer, `MM:SS` (`text`).

---

## Assets

Sourced from a Kenney.nl top-down shooter/tactical asset pack (CC0 — no licensing concern), exact pack chosen during production. Required, at minimum:
- A tileset image for level geometry (floor + wall tiles).
- Player sprite (top-down, single frame acceptable).
- One mob sprite.
- Spawn-point/turret sprite, with a distinct "destroyed" visual (either a second frame or a simple tint/alpha change applied in code if the sourced asset only has one frame).
- Three weapon-pickup icons (pistol/shotgun/SMG).
- Bullet sprite(s) — a single small sprite reused for all weapon types is sufficient; pellet-vs-single-shot is a *behavior* difference (count/spread), not necessarily a *visual* one, so one bullet asset can serve all three weapons unless a specific pack's pieces make per-weapon bullet art free to include.

`map1.stm`/`map2.stm`/`map3.stm` are authored during implementation (not user-provided) using the shipped Tilemap Editor, including their `spawns`/`pickups` marker layers.

---

## Demos page integration

Per `docs/demo-authoring-guide.md`'s mandatory checklist: `src/docs/demos/<Slug>.b4wgl.json` (project export), `src/docs/demos/<slug>.md` write-up, a `demoRegistry.ts` entry (tags likely `["Scenes", "Pathfinding", "Tilemap Markers", "Collision"]`), a `src/docs/manifest.ts` nav entry, and — mandatory, not optional — a `cypress/e2e/demos.cy.ts` `describe` block seeding the real exported JSON and asserting no `ERR` console entries after clicking Run, following the existing `raycaster`/`coins-platformer` pattern exactly.

---

## Testing

- **Cypress e2e** (`cypress/e2e/demos.cy.ts`): the only layer that verifies real runtime behavior for a shipped demo, per this project's established convention — mandatory before this demo is considered done.
- No new engine or softBASIC-API testing is needed for this demo itself: `pathfinding` and `markersByTag`/`Marker` are already fully unit/integration-tested from their own feature work. This demo's own correctness is a runtime-behavior question (does the game actually play correctly), which only Cypress can answer — consistent with how `coins-platformer`/`raycaster` have no dedicated Vitest suite of their own beyond the shared e2e spec.

---

## Constraints & non-goals

- **Mobs are not tracked toward the win condition** — only spawn-point destruction gates level progression. A mob spawned just before its point is destroyed remains in the level (still attacking the player) until killed or the scene switches away. This is a deliberate simplicity choice: tracking "all mobs AND all spawn points cleared" would require a second win-condition axis for no clear gameplay benefit, since the whole point of the objective is "shut down the spawners," not "kill every last enemy."
- **No mob variety** — one melee type only, matching your explicit earlier answer. Ranged/varied mobs are a natural future extension, not built here.
- **No mob-difficulty scaling within a level** — mob HP/speed/damage are fixed constants across all 3 levels; only spawn-point count and spawn interval change per level. Keeps the tuning surface to one axis for a first version.
- **No weapon-pickup exclusion logic** — picking up a weapon can reassign the same weapon the player already has (a "wasted" pickup). Not preventing this keeps `WeaponPickup` simple; a future iteration could bias the random choice away from the current weapon if this proves unsatisfying in playtesting.
- **No score/points system** — the original "points for speed" idea resolved to a pure timer, not a points formula (already decided during brainstorming); there is no kill-count or combo scoring of any kind.
- **No difficulty-select or level-restart-only** — dying always restarts the whole run from level 1, matching your explicit earlier answer; there's no "retry this level only" mode.
- **Reuses, does not modify, `pathfinding`/tilemap-markers** — this demo is purely a consumer of both systems; no engine or editor changes are anticipated. If implementation surfaces a real gap in either (the way `coins-platformer`'s collision bug surfaced a genuine tile-collision-helper need), that becomes its own follow-up spec, not scope creep into this one.
