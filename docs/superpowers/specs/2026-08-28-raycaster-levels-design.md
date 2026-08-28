# Raycaster Endless Levels — Design

## Goal

Turn Raycaster from a single fixed maze into a proper endless-levels game: reach the exit to regenerate a new, bigger maze with more enemies; survive as many levels as possible before dying. The result is a "how many levels before you die?" high-score contest, with the best run persisted across page reloads.

## Background

Raycaster currently generates one 33×33 maze at `GameScene.onenter()` and never regenerates — there's no win condition, no progression, and no persisted score. Death is a static "GAME OVER!" text overlay frozen in place inside `GameScene`, not a real scene. This builds directly on top of the demo's existing procedural maze generator (`MazeGrid.bas`), patrol/chase enemies (`Enemy.bas`), and scene structure (`Main.bas`/`TitleScene.bas`/`GameScene.bas`).

## 1. Level progression state

`GameScene` gains two new fields: `dim level` (starts at 1 each run) and `dim bestLevel` (loaded from persisted save data at `onenter()`, described in Section 5).

Two formulas drive per-level difficulty, both capped so a level count with no upper bound never breaks anything:

- **Maze size**: `MazeGrid`'s recursive backtracker works over *logical* cells at odd real coordinates — `mapSize = 2 * logicalSize + 1`. Logical size starts at 4 (a 9×9 real grid) at level 1, growing by 1 per level, capping at 16 (33×33 real, today's fixed size) at level 13: `logicalSize = math.min(4 + (level - 1), 16)`.
- **Enemy count**: starts at 4, `+2` per level, capping at 20: `math.min(4 + 2 * (level - 1), 20)` — reaches the cap at level 9 and holds there for every level after.

## 2. `MazeGrid.generate(size)` becomes parametrized

Currently `MazeGrid.bas` hardcodes `mapW = 33` / `mapH = 33` as module-level dims, and `generate()` takes no arguments. This changes to:

- `generate(size)` sets `mapW = size` and `mapH = size` at the start of the call, then runs the same recursive-backtracker logic as today (unchanged algorithm), bounded by the new `mapW`/`mapH`.
- `cells(1089)` (the array itself) stays sized for the worst case (33×33) regardless of what size is actually in use for a given level — a smaller maze just uses a subset of the array, the same way it already does today implicitly.
- `getCell`/`setCell`/`isOpen`/`randomOpenCell` are unaffected — they already read `mapW`/`mapH` as module state rather than a hardcoded constant, so they automatically respect whatever size the most recent `generate(size)` call set.

## 3. The exit — a code-drawn billboard, no new asset

A single object, not an array like enemies — so it's a few more plain `self.*` fields directly on `GameScene` (`exitX`, `exitY`, `exitScreenX`, `exitTransformY`), not a new class. Since it's never stored in an array or passed around as a typed parameter, it never hits the Object-type-inference gap `Enemy` needed getters for — direct field access is fine here.

- **Placement**: `mazegrid.randomOpenCell()`, rerolled (same reroll-until-far-enough pattern `pickEnemySpawn()` already uses) until it's at least 60% of the maze's diagonal away from the player's spawn corner — a real trek, not a coin-flip-distance placement.
- **Projection**: `projectExit()` mirrors `projectEnemy()`'s billboard camera-transform math exactly (same formula, one object instead of a loop).
- **Drawing**: `drawExit()` mirrors `drawEnemy()`'s column-by-column loop and z-buffer occlusion check, but draws a solid-color `drawing.drawRect` per visible column (sized/positioned identically to how an enemy strip would be) instead of sampling `drawing.drawImageStrip` from a texture — no image asset needed. A bright gold/glow fill color (`pen.setFillColor`) distinguishes it clearly from enemies and walls.

## 4. Compass arrow (also no new asset)

A small arrow drawn every frame via 2-3 `drawing.drawLine` calls (a simple chevron shape), rotated by hand — basic trig (`math.cos`/`math.sin`), not an image — around a fixed HUD anchor point (e.g. top-right corner), pointing in the direction of `atan2(exitY - posY, exitX - posX)` relative to the player's current facing angle. Always visible regardless of whether the exit itself is currently on-screen, so a 32×32 maze stays navigable.

## 5. Reaching the exit → next level

`GameScene.onupdate()` checks `math.distance(posX, posY, exitX, exitY)` each frame; within a small radius (matching the same proximity-trigger style as `checkHit`'s aim tolerance, tuned by feel), calls a new `nextLevel()`:

1. `self.level = self.level + 1`
2. Recompute the maze-size and enemy-count formulas for the new level.
3. `mazegrid.generate(newMapSize)`.
4. Respawn the player at the new maze's guaranteed-open start cell (`(1.5, 1.5)`, same as today's one-time spawn).
5. Respawn `ENEMY_COUNT` fresh `Enemy` instances (same `pickEnemySpawn()` reroll-away-from-player logic already used).
6. Pick a new exit position (Section 3's placement logic).

**Player health carries over between levels, not reset.** Resetting it every level would make death from attrition nearly impossible, undermining the entire "how many levels before you die" premise.

## 6. Death → real `GameOverScene`

Today's inline "GAME OVER!" text (drawn in place inside `GameScene`, frozen, no restart path) becomes a proper `GameOverScene.bas` (`Class Extends scene`), matching the existing `TitleScene`/`GameScene` split.

**Sharing the reached level across the scene switch**: a new `GameData.bas` (a plain `Class`, no `Extends` — mirroring Coins Platformer's own `GameData.bas`, the established pattern in this project for exactly this "a small piece of state needs to survive a scene switch" need), constructed once in `Main.bas` and passed into both `GameScene`'s and `GameOverScene`'s constructors. It holds one field, `dim levelReached`. `GameScene.onupdate()` still owns the death check (`playerHealth < 1`); on death, it sets `self.gameData.levelReached = self.level` and calls `scenemanager.switch("gameover")` instead of drawing an overlay in place.

`GameOverScene.onenter()`:
- Reads `self.gameData.levelReached`.
- Checks `save.exists("raycasterBestLevel")` / `save.get(...)` for the prior best, compares against `levelReached`, and calls `save.set("raycasterBestLevel", ...)` if it's a new best — same pattern Bullet Hell Shooter's `GameData.bas` already uses for its own persisted best time.
- Displays "You reached Level N" and the persisted best (highlighting if this run set a new one).
- `onkeydown` switches back to `"game"`.

Since scenes in this engine are constructed once in `Main.bas` and reused (not recreated on every switch), `GameScene.onenter()` must fully reset ALL of its own state on every entry (not just the first) — `level = 1`, fresh `playerHealth`, fresh maze, fresh enemies, fresh exit — since it's no longer a "runs exactly once" scene the way it was before this change.

## 7. File structure summary

- **New**: `demo-src/raycaster/GameData.bas` (plain `Class`, `dim levelReached`).
- **New**: `demo-src/raycaster/GameOverScene.bas` (`Class Extends scene`).
- **Modified**: `demo-src/raycaster/MazeGrid.bas` (`generate()` → `generate(size)`).
- **Modified**: `demo-src/raycaster/Enemy.bas` — no interface changes expected; `pickPatrolTarget()`'s and `tryMove()`'s reliance on `mazegrid.mapW`/`mazegrid.mapH` already reads module state rather than a hardcoded constant, so it should need no changes at all now that maze size varies per level.
- **Modified**: `demo-src/raycaster/GameScene.bas` — `Constructor(gameData as GameData)` (or similar), `level`/`bestLevel`/exit fields added, `nextLevel()` added, death handling changed from drawing an overlay to a scene switch, `onenter()` made fully idempotent (re-enterable, not "runs once").
- **Modified**: `demo-src/raycaster/Main.bas` — constructs one `GameData`, passes it to both `GameScene` and `GameOverScene`, registers `"gameover"`.

## Testing

No automated test suite for this demo's game logic (softBASIC `.bas` files aren't unit-testable the way the compiler/engine TypeScript is) — verified live in the browser per this project's established practice for every prior demo change this session: synthetic `KeyboardEvent`s + manually driving `app.ticker.update`. Specifically: confirm maze size and enemy count actually change between at least levels 1, 2, and a later level (e.g. force-test level 9+ to confirm the enemy-count cap holds); confirm the compass arrow points correctly as the player turns; confirm reaching the exit regenerates everything (new maze, new enemy count, health unchanged); confirm dying shows the game-over screen with the correct level and that a repeat run correctly updates the persisted best only when it's genuinely higher; confirm restarting from game-over produces a fully fresh level-1 state, not leftover state from the previous run.

Full suite (`npx vitest run`), build (`npx vite build`), and `cypress/e2e/demos.cy.ts`'s existing Raycaster block (still just asserts zero console `ERR` on a fresh run — no changes expected there) all must pass, per every prior change to this demo this session.

## Docs

Per `CLAUDE.md`, `raycaster.md` and `demoRegistry.ts`'s description need updating in the same commit(s) as the code — the demo is no longer "one fixed maze," it's an endless-levels game with a real win/lose loop and a persisted high score.
