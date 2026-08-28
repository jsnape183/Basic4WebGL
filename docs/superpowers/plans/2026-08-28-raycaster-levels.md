# Raycaster Endless Levels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Work directly on `main`** — this repo's convention (CLAUDE.md) is no feature branches unless explicitly requested; do not create a worktree/branch for this.

**Goal:** Turn Raycaster into an endless-levels game — reach a maze exit to regenerate a bigger maze with more enemies, survive as many levels as possible, with a persisted "best level reached" high score.

**Architecture:** `MazeGrid.generate()` takes a `size` parameter instead of a hardcoded 33. `GameScene` gains level/enemy-count/maze-size formulas (both capped), a code-drawn exit billboard and HUD compass (no new image assets), and a `startLevel()`/`nextLevel()` split of what was previously one-time `onenter()` setup. Death now switches to a new `GameOverScene` instead of drawing a frozen overlay, with the reached level carried across the scene switch via a new `GameData` class (mirroring Coins Platformer's own `GameData.bas`) and a persisted best via `save.set`/`save.get`.

**Tech Stack:** softBASIC, PIXI.js runtime, `scripts/buildDemo.ts`, `mcp__Claude_Browser__*` tools for live in-browser verification (this demo has no automated per-frame test harness).

Reference material:
- Design spec: `docs/superpowers/specs/2026-08-28-raycaster-levels-design.md`
- Current source (starting point for every task below): `demo-src/raycaster/{Main,TitleScene,MazeGrid,Enemy,GameScene}.bas`
- `demo-src/coins-platformer/GameData.bas` — the existing plain-`Class` "small state that survives a scene switch" pattern this plan's `GameData.bas` mirrors.
- `demo-src/bullet-hell-shooter/GameData.bas` (lines ~20-40) — the existing `save.exists`/`save.get`/`save.set` persisted-personal-best pattern this plan's `GameOverScene.bas` mirrors exactly.

---

### Task 1: Parametrize `MazeGrid.generate(size)`

**Files:**
- Modify: `demo-src/raycaster/MazeGrid.bas`

- [ ] **Step 1: Add `size` parameter and set `mapW`/`mapH` from it**

In `demo-src/raycaster/MazeGrid.bas`, find:

```bas
function generate()
  dim i
  dim cx
  dim cy
  dim nx
  dim ny
```

Replace with:

```bas
function generate(size)
  dim i
  dim cx
  dim cy
  dim nx
  dim ny

  mapW = size
  mapH = size
```

Everything else in `generate()` is unchanged — it already reads `mapW`/`mapH` as module state (not a hardcoded constant) everywhere it's used, so the rest of the recursive-backtracker logic works correctly for any size once these two lines run first.

- [ ] **Step 2: Add `getMapW()`/`getMapH()` getters**

At the end of `demo-src/raycaster/MazeGrid.bas` (after `randomOpenCell()`), add:

```bas

function getMapW()
  return mapW
endfunction

function getMapH()
  return mapH
endfunction
```

These are needed because there's no existing precedent in this codebase for reading a bare module-level `dim` externally (e.g. `mazegrid.mapW`) — every other cross-file module access in this project goes through a function call (`mazegrid.getCell(...)`, `levelhelpers.someFunction(...)`), so following that same convention here is both consistent and the only confirmed-working approach.

- [ ] **Step 3: Rebuild — expect a compile error, and fix it**

```bash
npm run build:demo -- demo-src/raycaster Raycaster
```

This WILL fail to compile at this point — `GameScene.bas`'s existing `mazegrid.generate()` call (no argument) no longer matches `generate(size)`'s new signature. That's expected; fix it now as part of this same task rather than leaving the tree in a broken state:

In `demo-src/raycaster/GameScene.bas`'s `onenter()`, find:

```bas
function onenter()
    mazegrid.generate()
    self.posX = 1.5
    self.posY = 1.5
```

Replace with:

```bas
function onenter()
    mazegrid.generate(33)
    self.posX = 1.5
    self.posY = 1.5
```

(`33` — today's fixed size — is a temporary placeholder here; Task 3 replaces this whole block with the real per-level formula. The point of this step is only to get back to a compiling, working baseline before moving on.)

- [ ] **Step 4: Rebuild and live-verify nothing changed**

```bash
npm run build:demo -- demo-src/raycaster Raycaster
```

Load in the browser per the established technique (fetch the JSON, rename `project.name`, wrap in a `Blob`/`File`/`DataTransfer`, dispatch `change` on `input[type=file]` at `/projects`, navigate to `/edit`, click Run). Expected: identical behavior to before this task — same 33x33 maze, same gameplay, zero console `ERR`.

- [ ] **Step 5: Commit**

```bash
git add demo-src/raycaster/MazeGrid.bas demo-src/raycaster/GameScene.bas src/docs/demos/Raycaster.b4wgl.json
git commit -m "refactor: parametrize Raycaster's MazeGrid.generate() by size

generate() now takes a size argument and sets mapW/mapH from it,
instead of a hardcoded 33 -- needed so later levels can use bigger
mazes. Added getMapW()/getMapH() getters since there's no existing
precedent in this codebase for reading a bare module-level dim
externally; every other cross-file module access goes through a
function call, so this follows the same convention. GameScene's call
site updated to generate(33) as a placeholder (preserving today's exact
behavior) -- the real per-level formula lands in a later task. Verified
live: unchanged gameplay, same maze size, zero console errors."
```

---

### Task 2: `GameData.bas` and its `Main.bas` wiring

**Files:**
- Create: `demo-src/raycaster/GameData.bas`
- Modify: `demo-src/raycaster/Main.bas`
- Modify: `demo-src/raycaster/GameScene.bas` (constructor signature only, in this task — no behavior changes yet)

This task only wires up the plumbing (`GameData` exists, is passed into `GameScene`, survives a scene switch); `GameOverScene` (which actually reads it) is Task 5.

- [ ] **Step 1: Write `demo-src/raycaster/GameData.bas`**

```bas
' demo-src/raycaster/GameData.bas
'
' A plain Class (no Extends) -- mirrors Coins Platformer's own
' GameData.bas exactly: a small piece of state that needs to survive a
' scene switch (constructed once in Main.bas, passed into every scene's
' constructor that needs it) rather than scenes reading each other's
' fields directly.
Class

dim levelReached

Constructor()
  self.levelReached = 1
EndConstructor

EndClass
```

- [ ] **Step 2: Give `GameScene` a constructor parameter for it**

In `demo-src/raycaster/GameScene.bas`, add a new field near the top (after the `' Screen` block is fine, or anywhere among the other fields):

```bas
dim gameData as GameData
```

Change:

```bas
Constructor()
  self.ENEMY_COUNT = 10
```

to:

```bas
Constructor(gameData as GameData)
  self.gameData = gameData
  self.ENEMY_COUNT = 10
```

(`self.ENEMY_COUNT`'s value here becomes dead code once Task 3 lands — it'll be overwritten by the real per-level formula before it's ever read — but leave it as-is for this task so the file keeps compiling standalone; Task 3 removes it.)

- [ ] **Step 3: Wire it up in `Main.bas`**

Replace the entire contents of `demo-src/raycaster/Main.bas` with:

```bas
function oninit()
  world.setPixelPerfect(true)
endfunction

dim gamedata = new GameData()
dim titlescene = new TitleScene()
dim gamescene = new GameScene(gamedata)

scenemanager.register("title", titlescene)
scenemanager.register("game", gamescene)
scenemanager.switch("title")
```

(`gameoverscene` isn't registered yet — that's Task 5, once `GameOverScene.bas` exists to register.)

- [ ] **Step 4: Rebuild and live-verify**

```bash
npm run build:demo -- demo-src/raycaster Raycaster
```

Load in the browser. Expected: identical behavior to before this task (title screen, same maze, same gameplay) — this task only adds unused-so-far plumbing, no visible change. Zero console `ERR`.

- [ ] **Step 5: Commit**

```bash
git add demo-src/raycaster/GameData.bas demo-src/raycaster/Main.bas demo-src/raycaster/GameScene.bas src/docs/demos/Raycaster.b4wgl.json
git commit -m "feat: add Raycaster GameData for cross-scene state

A plain Class (no Extends), mirroring Coins Platformer's own
GameData.bas -- constructed once in Main.bas and passed into
GameScene's constructor, so the level reached on death can be read by
a future GameOverScene without the two scenes reading each other's
fields directly. No behavior change yet -- GameOverScene itself and the
death-triggers-a-scene-switch wiring land in a later task. Verified
live: unchanged gameplay."
```

---

### Task 3: Level progression — maze size, enemy count, `startLevel()`/`nextLevel()`

**Files:**
- Modify: `demo-src/raycaster/GameScene.bas`

This is the core of the feature: splitting `onenter()`'s current "runs exactly once" setup into one-time HUD/asset setup vs. per-level state that must be fully re-derivable on every level (and, eventually, every restart).

- [ ] **Step 1: Bump the enemy array's max size from 10 to 20**

The enemy-count cap (Section 1 of the design doc) is 20, not today's 10. Find:

```bas
dim ENEMY_COUNT
dim enemies(10) as Enemy
```

Replace with:

```bas
dim ENEMY_COUNT
dim enemies(20) as Enemy
```

And in `renderEnemies()`, find:

```bas
  dim order(10)
```

Replace with:

```bas
  dim order(20)
```

(If `dim enemies(20) as Enemy` doesn't compile for some reason even though `dim enemies(10) as Enemy` did — same array-size constant, just bigger — that would be a genuine surprise; if it happens, report it rather than silently switching to the untyped fallback, since this exact typed form is already proven working at size 10 in the current shipped code.)

- [ ] **Step 2: Add the new level-state fields**

Add these fields near `dim ENEMY_COUNT` (or anywhere among the other fields):

```bas
dim level
dim setupDone
```

- [ ] **Step 3: Remove the now-dead `self.ENEMY_COUNT = 10` from the constructor, add `level`/`setupDone` initialization**

Find (from Task 2):

```bas
Constructor(gameData as GameData)
  self.gameData = gameData
  self.ENEMY_COUNT = 10
  self.STRIP = 4
```

Replace with:

```bas
Constructor(gameData as GameData)
  self.gameData = gameData
  self.setupDone = false
  self.STRIP = 4
```

(`ENEMY_COUNT`'s real value is now always set by `startLevel()`, Step 5 below — there's no longer a meaningful "default" to set in the constructor.)

- [ ] **Step 4: Split `onenter()` into one-time setup + always-reset level state**

Find the full current `onenter()`:

```bas
function onenter()
    mazegrid.generate(33)
    self.posX = 1.5
    self.posY = 1.5

    dim i
    dim spawn
    for i = 0 to self.ENEMY_COUNT - 1
      spawn = self.pickEnemySpawn()
      self.enemies(i) = new Enemy(spawn(0), spawn(1))
    next i

    self.weaponSprite = new Sprite("gun.png")
    hud.add(self.weaponSprite)
    'weaponSprite.setScale(4, 4)
    ' `sprite` is centre-anchored, so this places the CENTRE of the 256x256
    ' gun.png here; +128 on each axis keeps its top-left corner at the same
    ' screen spot (stage.width()/2, stage.height()-200) it sat at before.
    self.weaponSprite.transform.setPosition(stage.width() / 2 + 128, stage.height() - 200 + 128)
    self.hpBg = new Sprite("healthbar_bg.png")
    self.hpBg.transform.setPosition(70, 27)
    self.hpBg.setScale(100, 14)
    hud.add(self.hpBg)

    self.hpFill = new Sprite("healthbar_fill.png")
    self.hpFill.transform.setPosition(70, 27)
    self.hpFill.setScale(100, 14)
    hud.add(self.hpFill)

    self.hpLabel = new Text("HP", 20, 36)
    self.hpLabel.setStyle(12, 255, 255, 255)
    hud.add(self.hpLabel)

    self.gameOverText = new Text("GAME OVER!",stage.width() / 2, stage.height() / 2)

    self.muzzleFlashEmitter = new Emitter("particle.png")
    self.muzzleFlashEmitter.setLifetime(0.1, 0.15)
    self.muzzleFlashEmitter.setSpeed(80, 160)
    self.muzzleFlashEmitter.setDirection(0, 360)
    ' Peak scale 200% bigger than the original 0.6 (i.e. 3x) per feedback
    ' that the flash read as too small; end-of-life scale left small so it
    ' still tapers down to a point rather than fading out oversized.
    self.muzzleFlashEmitter.setScaleOverLife(1.8, 0.08)
    self.muzzleFlashEmitter.setAlphaOverLife(1, 0)
    self.muzzleFlashEmitter.setColorOverLife(16777120, 16744448)
    self.muzzleFlashEmitter.setMaxParticles(30)
    hud.add(self.muzzleFlashEmitter)

    self.enemyHitEmitter = new Emitter("particle.png")
    self.enemyHitEmitter.setLifetime(0.15, 0.25)
    self.enemyHitEmitter.setSpeed(60, 140)
    self.enemyHitEmitter.setDirection(0, 360)
    self.enemyHitEmitter.setScaleOverLife(0.5, 0.05)
    self.enemyHitEmitter.setAlphaOverLife(1, 0)
    self.enemyHitEmitter.setColorOverLife(16777215, 16711680)
    self.enemyHitEmitter.setMaxParticles(40)
    hud.add(self.enemyHitEmitter)

    self.enemyDeathEmitter = new Emitter("particle.png")
    self.enemyDeathEmitter.setLifetime(0.4, 0.6)
    self.enemyDeathEmitter.setSpeed(80, 200)
    self.enemyDeathEmitter.setDirection(0, 360)
    self.enemyDeathEmitter.setScaleOverLife(0.7, 0.1)
    self.enemyDeathEmitter.setAlphaOverLife(1, 0)
    self.enemyDeathEmitter.setColorOverLife(16711680, 4473924)
    self.enemyDeathEmitter.setMaxParticles(80)
    hud.add(self.enemyDeathEmitter)
endfunction
```

Replace the entire function with:

```bas
function onenter()
    if not self.setupDone then
      self.setupDone = true
      self.setupHud()
    endif

    self.playerHealth = 100
    self.damageCooldown = 0
    self.flashTimer = 4
    self.dirX = 1.0
    self.dirY = 0.0
    self.planeX = 0.0
    self.planeY = 0.66
    self.level = 1

    self.startLevel()
endfunction

function setupHud()
    ' Runs exactly once, ever (guarded by self.setupDone in onenter()) --
    ' these are screen-fixed HUD elements that never need recreating
    ' between levels or between restarts after death. Recreating them on
    ' every onenter() would add duplicate sprites/emitters to hud every
    ' time the player restarts, since onenter() itself now runs more than
    ' once per page load (previously it only ever ran once).
    self.weaponSprite = new Sprite("gun.png")
    hud.add(self.weaponSprite)
    ' `sprite` is centre-anchored, so this places the CENTRE of the 256x256
    ' gun.png here; +128 on each axis keeps its top-left corner at the same
    ' screen spot (stage.width()/2, stage.height()-200) it sat at before.
    self.weaponSprite.transform.setPosition(stage.width() / 2 + 128, stage.height() - 200 + 128)
    self.hpBg = new Sprite("healthbar_bg.png")
    self.hpBg.transform.setPosition(70, 27)
    self.hpBg.setScale(100, 14)
    hud.add(self.hpBg)

    self.hpFill = new Sprite("healthbar_fill.png")
    self.hpFill.transform.setPosition(70, 27)
    self.hpFill.setScale(100, 14)
    hud.add(self.hpFill)

    self.hpLabel = new Text("HP", 20, 36)
    self.hpLabel.setStyle(12, 255, 255, 255)
    hud.add(self.hpLabel)

    self.muzzleFlashEmitter = new Emitter("particle.png")
    self.muzzleFlashEmitter.setLifetime(0.1, 0.15)
    self.muzzleFlashEmitter.setSpeed(80, 160)
    self.muzzleFlashEmitter.setDirection(0, 360)
    ' Peak scale 200% bigger than the original 0.6 (i.e. 3x) per feedback
    ' that the flash read as too small; end-of-life scale left small so it
    ' still tapers down to a point rather than fading out oversized.
    self.muzzleFlashEmitter.setScaleOverLife(1.8, 0.08)
    self.muzzleFlashEmitter.setAlphaOverLife(1, 0)
    self.muzzleFlashEmitter.setColorOverLife(16777120, 16744448)
    self.muzzleFlashEmitter.setMaxParticles(30)
    hud.add(self.muzzleFlashEmitter)

    self.enemyHitEmitter = new Emitter("particle.png")
    self.enemyHitEmitter.setLifetime(0.15, 0.25)
    self.enemyHitEmitter.setSpeed(60, 140)
    self.enemyHitEmitter.setDirection(0, 360)
    self.enemyHitEmitter.setScaleOverLife(0.5, 0.05)
    self.enemyHitEmitter.setAlphaOverLife(1, 0)
    self.enemyHitEmitter.setColorOverLife(16777215, 16711680)
    self.enemyHitEmitter.setMaxParticles(40)
    hud.add(self.enemyHitEmitter)

    self.enemyDeathEmitter = new Emitter("particle.png")
    self.enemyDeathEmitter.setLifetime(0.4, 0.6)
    self.enemyDeathEmitter.setSpeed(80, 200)
    self.enemyDeathEmitter.setDirection(0, 360)
    self.enemyDeathEmitter.setScaleOverLife(0.7, 0.1)
    self.enemyDeathEmitter.setAlphaOverLife(1, 0)
    self.enemyDeathEmitter.setColorOverLife(16711680, 4473924)
    self.enemyDeathEmitter.setMaxParticles(80)
    hud.add(self.enemyDeathEmitter)
endfunction

function startLevel()
    ' Runs once at the start of every level (both the very first, from
    ' onenter(), and every subsequent one, from nextLevel() below) --
    ' regenerates the maze at this level's size, respawns the player and
    ' a fresh enemy roster sized for this level, and picks a new exit.
    dim mapSize
    dim i
    dim spawn

    mapSize = 2 * math.min(4 + (self.level - 1), 16) + 1
    mazegrid.generate(mapSize)
    self.posX = 1.5
    self.posY = 1.5

    self.ENEMY_COUNT = math.min(4 + 2 * (self.level - 1), 20)
    for i = 0 to self.ENEMY_COUNT - 1
      spawn = self.pickEnemySpawn()
      self.enemies(i) = new Enemy(spawn(0), spawn(1))
    next i
endfunction

function nextLevel()
    self.level = self.level + 1
    self.startLevel()
endfunction
```

Note `self.gameOverText` (the old frozen-overlay `Text` object) is gone entirely here — its remaining reference in `onupdate()` is removed in the next step, and its field declaration is removed in Task 5 alongside the real death-handling rewrite (leave the `dim gameOverText as Text` field declaration alone for now; Task 5 removes it together with the code that used it, keeping this task's diff focused on level-progression state only).

- [ ] **Step 5: Update `onupdate()`'s dead-enemy-check reference to the old overlay**

Find, near the top of `onupdate()`:

```bas
    if self.playerHealth < 1
        hud.add(self.gameOverText)
        return
    endif
```

Leave this exactly as-is for now — Task 5 replaces it with the real scene-switch death handling. This task is scoped to level progression only; don't touch death handling yet.

- [ ] **Step 6: Rebuild and live-verify level 1 is unaffected**

```bash
npm run build:demo -- demo-src/raycaster Raycaster
```

Load in the browser, start the game, confirm: same behavior as before this task at level 1 — a 9x9 maze this time (not 33x33 — level 1's formula gives `mapSize = 2 * min(4, 16) + 1 = 9`, which IS the intended new level-1 size per the design, not a regression), 4 enemies (level 1's formula gives `min(4, 20) = 4`), gun/healthbar/particles all present and working. Screenshot to confirm the smaller starting maze looks right (fully enclosed, no gaps) and that exactly 4 enemies are findable while exploring it.

- [ ] **Step 7: Live-verify the level-scaling formulas directly, without playing through 9 real levels**

Since there's no in-game way yet to reach level 2+ (the exit doesn't exist until Task 4), verify the formulas themselves by temporarily forcing a higher starting level. `GameScene` instances aren't exposed on `window` by name in this project's testing setup (only function-local variables are, confirmed across every prior demo's live-testing this session), so the reliable check is a direct, temporary source edit rather than a console probe:

1. In `demo-src/raycaster/GameScene.bas`'s `onenter()`, temporarily change `self.level = 1` to `self.level = 5`.
2. Rebuild (`npm run build:demo -- demo-src/raycaster Raycaster`) and load in the browser.
3. Confirm live: the maze is visibly bigger than level 1's 9x9 (level 5's formula gives `mapSize = 2 * min(4+4, 16) + 1 = 17`) and more enemies are present than level 1's 4 (level 5's formula gives `min(4 + 8, 20) = 12`) — screenshot both level 1 (from Step 6) and this forced level 5 side by side for a clear visual comparison.
4. Revert `self.level = 5` back to `self.level = 1` in `demo-src/raycaster/GameScene.bas` — this was only a manual probe for this verification step, not a real change. Rebuild once more to confirm the reverted file is back to producing level 1 on a fresh run before moving to Step 8.

- [ ] **Step 8: Commit**

```bash
git add demo-src/raycaster/GameScene.bas src/docs/demos/Raycaster.b4wgl.json
git commit -m "feat: add Raycaster level progression (maze size + enemy count)

GameScene.onenter() splits into setupHud() (screen-fixed HUD/particle
elements, guarded by self.setupDone so it only ever runs once even
across future restarts) and startLevel() (maze regeneration, player
spawn, enemy roster -- everything that must be freshly derived every
level). nextLevel() increments self.level and re-runs startLevel().
Maze size grows from 9x9 at level 1 to 33x33 (today's fixed size) by
level 13, capped there; enemy count grows from 4 to 20 by level 9,
capped there -- both formulas share the same math.min-based cap
pattern. Enemy array bumped from 10 to 20 slots to fit the new cap.
There's no way to actually reach level 2+ yet (the exit lands in the
next task) -- verified the formulas themselves directly by temporarily
forcing self.level to a higher value, confirming a visibly bigger maze
and enemy count, then reverting. Level 1 itself verified unchanged in
spirit (now a 9x9 maze with 4 enemies, per the new formula, not a
regression from the old fixed 33x33/one-enemy-count starting point)."
```

---

### Task 4: The exit billboard and compass arrow

**Files:**
- Modify: `demo-src/raycaster/GameScene.bas`

- [ ] **Step 1: Add exit-related fields**

Add near the other fields (e.g. alongside `dim level`):

```bas
dim exitX
dim exitY
dim exitScreenX
dim exitTransformY
```

- [ ] **Step 2: Add `pickExitPosition()`**

Add this new method (anywhere among the other functions — e.g. right after `pickEnemySpawn()`):

```bas
function pickExitPosition()
  ' Rerolls (same pattern pickEnemySpawn() already uses) until the exit
  ' is a real trek from the player's spawn corner, not just "not right on
  ' top of it" -- at least 60% of the maze's diagonal away.
  dim tries
  dim spawn
  dim ex
  dim ey
  dim minDist

  minDist = mazegrid.getMapW() * 0.6

  tries = 0
  spawn = mazegrid.randomOpenCell()
  ex = spawn(0) + 0.5
  ey = spawn(1) + 0.5
  while math.distance(ex, ey, self.posX, self.posY) < minDist and tries < 30
    spawn = mazegrid.randomOpenCell()
    ex = spawn(0) + 0.5
    ey = spawn(1) + 0.5
    tries = tries + 1
  endwhile
  self.exitX = ex
  self.exitY = ey
endfunction
```

- [ ] **Step 3: Call it from `startLevel()`**

Find (from Task 3):

```bas
    self.ENEMY_COUNT = math.min(4 + 2 * (self.level - 1), 20)
    for i = 0 to self.ENEMY_COUNT - 1
      spawn = self.pickEnemySpawn()
      self.enemies(i) = new Enemy(spawn(0), spawn(1))
    next i
endfunction
```

Replace with:

```bas
    self.ENEMY_COUNT = math.min(4 + 2 * (self.level - 1), 20)
    for i = 0 to self.ENEMY_COUNT - 1
      spawn = self.pickEnemySpawn()
      self.enemies(i) = new Enemy(spawn(0), spawn(1))
    next i

    self.pickExitPosition()
endfunction
```

- [ ] **Step 4: Add `projectExit()` and `drawExit()`**

Add these two new methods (e.g. right after `drawEnemy()`):

```bas
function projectExit()
  ' Mirrors projectEnemy()'s billboard camera-transform math exactly --
  ' same formula, one object instead of a loop. No getter-workaround
  ' needed here (unlike Enemy's fields) since exitX/exitY/etc. are plain
  ' self.* fields on GameScene itself, never stored in an array or passed
  ' around as a typed parameter -- the compiler bug that pattern hits
  ' only affects reads of an EXTERNAL class-typed instance's fields.
  dim spriteX
  dim spriteY
  dim invDet
  dim transformX
  dim transformY

  spriteX = self.exitX - self.posX
  spriteY = self.exitY - self.posY

  invDet = 1.0 / (self.planeX * self.dirY - self.dirX * self.planeY)
  transformX = invDet * (self.dirY * spriteX - self.dirX * spriteY)
  transformY = invDet * ((0 - self.planeY) * spriteX + self.planeX * spriteY)

  if transformY <= 0 then
    self.exitTransformY = -1
    return
  endif

  self.exitScreenX = math.floor((self.RAYS / 2) * (1.0 + transformX / transformY))
  self.exitTransformY = transformY
endfunction

function drawExit()
  ' Mirrors drawEnemy()'s column-by-column loop and z-buffer occlusion
  ' check, but draws a solid-color drawing.drawRect per visible column
  ' instead of sampling drawing.drawImageStrip from a texture -- no image
  ' asset needed for the exit at all.
  dim spriteH
  dim spriteWCols
  dim drawLeft
  dim drawRight
  dim sc
  dim destX

  if self.exitTransformY <= 0 then
    return
  endif

  spriteH = math.floor(self.SH / self.exitTransformY)
  spriteWCols = spriteH / self.STRIP

  drawLeft = math.floor(self.exitScreenX - spriteWCols / 2)
  drawRight = math.floor(self.exitScreenX + spriteWCols / 2)

  pen.setFillColor(255, 215, 0)
  pen.setLineWidth(0)

  for sc = drawLeft to drawRight - 1
    if sc >= 0 and sc < self.RAYS then
      if self.zbuffer(sc) > self.exitTransformY then
        destX = sc * self.STRIP + self.STRIP / 2
        drawing.drawRect(destX, self.SCY, self.STRIP, spriteH)
      endif
    endif
  next sc
endfunction
```

- [ ] **Step 5: Add `drawCompass()`**

Add this new method:

```bas
function drawCompass()
  ' A small hand-rotated arrow (no image asset) always pointing toward
  ' the exit's direction relative to the player's current facing, drawn
  ' near the top-right corner of the screen -- always visible regardless
  ' of whether the exit itself is currently on-screen, so a big maze
  ' stays navigable.
  dim angleToExit
  dim playerAngle
  dim relAngle
  dim cx
  dim cy
  dim tipX
  dim tipY
  dim leftX
  dim leftY
  dim rightX
  dim rightY

  angleToExit = math.atan2(self.exitY - self.posY, self.exitX - self.posX)
  playerAngle = math.atan2(self.dirY, self.dirX)
  relAngle = angleToExit - playerAngle

  cx = self.SW - 40
  cy = 40

  tipX = cx + math.cos(relAngle) * 15
  tipY = cy + math.sin(relAngle) * 15
  leftX = cx + math.cos(relAngle + 2.6) * 10
  leftY = cy + math.sin(relAngle + 2.6) * 10
  rightX = cx + math.cos(relAngle - 2.6) * 10
  rightY = cy + math.sin(relAngle - 2.6) * 10

  pen.setLineColor(255, 215, 0)
  pen.setLineWidth(3)
  ' drawing.drawLine(x, y, x2, y2) draws from (x, y) to (x + x2, y + y2)
  ' -- x2/y2 are a LOCAL offset from the start point, not a second
  ' absolute coordinate (confirmed by reading src/components/Runner/
  ' engine/drawing.js: it builds the line from local (0,0) to (x2,y2),
  ' THEN positions the whole object at (x,y)) -- so each call below
  ' subtracts the start point back out to get an absolute-endpoint line.
  drawing.drawLine(leftX, leftY, tipX - leftX, tipY - leftY)
  drawing.drawLine(tipX, tipY, rightX - tipX, rightY - tipY)
endfunction
```

- [ ] **Step 6: Wire projection/drawing/reached-check into `onupdate()`**

Find:

```bas
    self.renderEnemies()

    hpFillWidth = 100 * (self.playerHealth / 100)
```

Replace with:

```bas
    self.renderEnemies()
    self.projectExit()
    self.drawExit()
    self.drawCompass()

    if math.distance(self.posX, self.posY, self.exitX, self.exitY) < 1.0 then
      self.nextLevel()
      return
    endif

    hpFillWidth = 100 * (self.playerHealth / 100)
```

- [ ] **Step 7: Rebuild and live-verify**

```bash
npm run build:demo -- demo-src/raycaster Raycaster
```

Load in the browser, start the game, and check, using the synthetic-keyboard-plus-`app.ticker.update()` technique:

- A gold-colored billboard is visible somewhere in the maze (walk/turn to find it) — confirms `projectExit()`/`drawExit()` render correctly and respect the z-buffer (should disappear behind walls, not show through them).
- The compass arrow near the top-right rotates sensibly as the player turns (A/D) — point yourself roughly toward the gold billboard and confirm the arrow points roughly "up"/forward in its own small frame; turn 180° and confirm it flips to point the opposite way.
- Walking onto the gold billboard's position triggers a new level: confirm the maze visibly regenerates (different layout), a 6th enemy or more appears (level 2's count, `min(4+2,20)=6`), and — critically — `playerHealth` is unchanged across the transition (deal yourself some damage first via an enemy contact, note the health bar's width, cross the exit, confirm the health bar looks the same width immediately after).

- [ ] **Step 8: Commit**

```bash
git add demo-src/raycaster/GameScene.bas src/docs/demos/Raycaster.b4wgl.json
git commit -m "feat: add Raycaster exit billboard, compass, and level transitions

The exit is a single object (not a class like Enemy -- plain self.*
fields on GameScene, never stored in an array or passed as a typed
parameter, so it never hits the Object-type-inference gap Enemy needed
getters for). projectExit()/drawExit() mirror projectEnemy()/
drawEnemy()'s billboard math and z-buffer occlusion exactly, but draw a
solid gold drawing.drawRect per column instead of sampling a texture --
no new image asset needed. drawCompass() is a small hand-rotated arrow
(also no asset) always pointing at the exit's direction relative to the
player's current facing. Reaching the exit (dist < 1.0) calls
nextLevel(). Verified live: exit billboard renders and correctly
occludes behind walls, compass rotates correctly as the player turns,
crossing the exit regenerates the maze with a bigger layout and more
enemies while leaving player health untouched."
```

---

### Task 5: `GameOverScene.bas` and the death → scene-switch rewrite

**Files:**
- Create: `demo-src/raycaster/GameOverScene.bas`
- Modify: `demo-src/raycaster/GameScene.bas`
- Modify: `demo-src/raycaster/Main.bas`

- [ ] **Step 1: Write `demo-src/raycaster/GameOverScene.bas`**

```bas
' demo-src/raycaster/GameOverScene.bas
Class
Extends scene

dim gameData as GameData
dim levelText as Text
dim bestText as Text
dim promptText as Text

Constructor(gameData as GameData)
  self.gameData = gameData
EndConstructor

function onenter()
  ' Same save.exists/save.get/save.set persisted-best pattern Bullet
  ' Hell Shooter's own GameData.bas already uses for its best-time.
  dim reached
  dim best
  dim isNewBest

  reached = self.gameData.levelReached
  isNewBest = false

  if save.exists("raycasterBestLevel") then
    best = save.get("raycasterBestLevel")
  else
    best = 0
  endif

  if reached > best then
    best = reached
    save.set("raycasterBestLevel", best)
    isNewBest = true
  endif

  world.setBackground(0, 0, 0)

  self.levelText = new Text("You reached Level " + string.str(reached), stage.width() / 2 - 130, stage.height() / 2 - 60)
  self.levelText.setStyle(28, 255, 220, 120)
  hud.add(self.levelText)

  if isNewBest then
    self.bestText = new Text("New best!", stage.width() / 2 - 60, stage.height() / 2 - 10)
  else
    self.bestText = new Text("Best: Level " + string.str(best), stage.width() / 2 - 80, stage.height() / 2 - 10)
  endif
  self.bestText.setStyle(20, 255, 255, 255)
  hud.add(self.bestText)

  self.promptText = new Text("Press any key to try again", stage.width() / 2 - 130, stage.height() / 2 + 50)
  self.promptText.setStyle(18, 200, 200, 200)
  hud.add(self.promptText)
endfunction

function onkeydown(keyCode)
  scenemanager.switch("game")
endfunction

EndClass
```

- [ ] **Step 2: Rewrite `GameScene`'s death handling to switch scenes instead of drawing an overlay**

Find, in `onupdate()`:

```bas
    if self.playerHealth < 1
        hud.add(self.gameOverText)
        return
    endif
```

Replace with:

```bas
    if self.playerHealth < 1 then
        self.gameData.levelReached = self.level
        scenemanager.switch("gameover")
        return
    endif
```

- [ ] **Step 3: Remove the now-fully-unused `gameOverText` field**

Find, among the `' Hud` fields:

```bas
dim hpLabel as Text
dim gameOverText as Text
```

Replace with:

```bas
dim hpLabel as Text
```

(There's no remaining `self.gameOverText = ...` assignment anywhere — Task 3's `setupHud()` rewrite already dropped it — so this is just removing the now-dangling field declaration.)

- [ ] **Step 4: Register the new scene in `Main.bas`**

Replace the full contents of `demo-src/raycaster/Main.bas` with:

```bas
function oninit()
  world.setPixelPerfect(true)
endfunction

dim gamedata = new GameData()
dim titlescene = new TitleScene()
dim gamescene = new GameScene(gamedata)
dim gameoverscene = new GameOverScene(gamedata)

scenemanager.register("title", titlescene)
scenemanager.register("game", gamescene)
scenemanager.register("gameover", gameoverscene)
scenemanager.switch("title")
```

- [ ] **Step 5: Rebuild and live-verify the full death → restart loop**

```bash
npm run build:demo -- demo-src/raycaster Raycaster
```

Load in the browser and, using the synthetic-input technique:

- Force the player's health to 0 (either by taking enough enemy contact damage over enough driven frames, or — faster and just as valid for verifying the SCENE TRANSITION logic itself — temporarily and only in this live test session, not in committed source, setting `playerHealth` low via direct object manipulation if a `GameScene` instance reference is reachable the way `Enemy` instances are; if not reachable, taking real damage over enough frames is the fallback). Confirm: the game-over screen appears showing "You reached Level 1", "Best: Level 1" (first ever run) or similar, and a "press any key" prompt.
- Press a key; confirm it switches back to `"game"` and a FRESH level 1 starts: 9x9 maze, 4 enemies, full health, health bar full width. Specifically confirm the health bar is genuinely full (not still showing the depleted width from the run that just ended) and that exactly one set of gun/health-bar/particle-emitter HUD elements exists (not two, confirming `setupHud()`'s `self.setupDone` guard correctly prevented duplicate HUD creation on this second `onenter()` call).
- Die again (or force it again); confirm the game-over screen now shows the higher of the two runs' levels as "Best" (or "New best!" if this run's level was higher than the previous one), proving the `save.exists`/`save.get`/`save.set` comparison logic works correctly across multiple runs within the same browser session.

- [ ] **Step 6: Commit**

```bash
git add demo-src/raycaster/GameOverScene.bas demo-src/raycaster/GameScene.bas demo-src/raycaster/Main.bas src/docs/demos/Raycaster.b4wgl.json
git commit -m "feat: add Raycaster GameOverScene with persisted best level

Death now switches to a real GameOverScene (Class Extends scene,
matching TitleScene/GameScene's shape) instead of drawing a frozen
'GAME OVER!' overlay in place inside GameScene with no restart path.
The level reached is carried across the scene switch via GameData
(added in an earlier commit); GameOverScene.onenter() compares it
against a persisted best (save.exists/save.get/save.set, the same
pattern Bullet Hell Shooter's GameData.bas already uses for its own
best-time) and shows both. Any key restarts by switching back to
'game', which GameScene.onenter() now correctly re-runs its full
level-1 reset for (setupHud()'s self.setupDone guard, from an earlier
commit, prevents duplicate HUD elements from piling up across repeated
restarts). Verified live: dying shows the correct level and best,
restarting produces a genuinely fresh level 1 (full health, single set
of HUD elements, not duplicated), and a second run's game-over screen
correctly reflects the higher of the two runs' levels as best."
```

---

### Task 6: Docs and registry

**Files:**
- Modify: `src/docs/demos/raycaster.md`
- Modify: `src/features/demos/demoRegistry.ts`

- [ ] **Step 1: Rewrite `raycaster.md`'s "How it works" to cover level progression**

Read the current `src/docs/demos/raycaster.md` in full first. Add new prose (in the same explain-the-why voice as the rest of the file) covering: the level/maze-size/enemy-count formulas and their caps (Section 1 of the design doc), the exit's code-drawn billboard and why no new asset was needed (Section 3), the compass arrow and the `drawLine` offset-not-absolute-endpoint quirk worth calling out explicitly (Section 4 — this is a real, easy-to-get-backwards API detail worth documenting the same way the muzzle-flash-offset and billboard-width-stretch quirks are already documented elsewhere in this file), health carrying across levels and why that matters for the high-score premise (Section 5), and the new `GameOverScene`/`GameData`/persisted-best-level flow (Section 6).

- [ ] **Step 2: Add new `## GameData.bas` and `## GameOverScene.bas` sections**

Following this file's existing per-file section convention (alphabetical order among the `## <File>.bas` sections), add `## GameData.bas` (alphabetically between `## Enemy.bas` and `## GameScene.bas`) and `## GameOverScene.bas` (alphabetically between `## GameScene.bas` and `## MazeGrid.bas`), each with the real current source of `demo-src/raycaster/GameData.bas` and `demo-src/raycaster/GameOverScene.bas` in a ` ```bas ` fence.

- [ ] **Step 3: Re-sync every embedded code fence (all 7 files now) byte-for-byte**

```bash
python3 -c "
import re
with open('src/docs/demos/raycaster.md') as f:
    content = f.read()
for name in ['Main', 'TitleScene', 'MazeGrid', 'Enemy', 'GameData', 'GameOverScene', 'GameScene']:
    section = re.search(rf'## {name}\.bas\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
    doc_code = re.search(r'\`\`\`bas\n(.*?)\n\`\`\`', section.group(1), re.DOTALL).group(1) if section else None
    with open(f'demo-src/raycaster/{name}.bas') as f2:
        src_code = f2.read()
    match = (doc_code.strip(chr(10)) if doc_code else None) == src_code.strip(chr(10))
    print(name, 'MATCH' if match else 'MISMATCH', '(section found)' if section else '(SECTION MISSING)')
"
```

Expected: `MATCH` for all 7. Fix any mismatch before continuing.

- [ ] **Step 4: Update `## Required assets` and `## Controls` if needed**

No new image assets were added this feature (the exit and compass are both code-drawn) — confirm the `## Required assets` table is unchanged and accurate. `## Controls` doesn't need a new row either (no new input was added).

- [ ] **Step 5: Update `src/features/demos/demoRegistry.ts`'s `raycaster` entry**

Update the `description` to describe the endless-levels structure: reaching the exit regenerates a bigger maze with more enemies, health carries across levels, death shows a persisted best-level high score. Keep `slug`/`docsSlug`/`json` unchanged; add/adjust `tags` if genuinely warranted (e.g. nothing needs to change here necessarily — use judgment).

- [ ] **Step 6: Run the full verification suite**

```bash
npx vitest run
npx vite build
```

Expected: same pass count as before this task (no engine/compiler files touched by this whole plan) — currently 1642 passed, 1 pre-existing unrelated skip. Build succeeds.

```bash
lsof -ti:5173 2>/dev/null | xargs -r kill; sleep 1
nohup npm run dev -- --port 5173 --strictPort > /tmp/raycaster-levels-final.log 2>&1 & disown
sleep 3
npx cypress run --spec "cypress/e2e/demos.cy.ts"
```

Expected: all 4 demos pass with zero console `ERR`, including Raycaster.

```bash
lsof -ti:5173 | xargs kill 2>/dev/null
```

- [ ] **Step 7: Commit**

```bash
git add src/docs/demos/raycaster.md src/features/demos/demoRegistry.ts
git commit -m "docs: document Raycaster's endless-levels rework

raycaster.md's How It Works now covers the level/maze-size/enemy-count
formulas and their caps, the exit's code-drawn billboard (no new
asset), the compass arrow's drawLine offset-not-absolute-endpoint
quirk, health carrying across levels, and the new GameOverScene/
GameData/persisted-best-level flow. New ## GameData.bas and
## GameOverScene.bas sections added in alphabetical order among the
existing per-file sections, all 7 files' embedded source verified
byte-for-byte in sync with demo-src/raycaster/. demoRegistry.ts's
description updated to describe the endless-levels structure. Full
suite, vite build, and cypress demos.cy.ts all pass."
```
