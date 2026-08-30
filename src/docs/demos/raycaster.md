# Wolfenstein-Style Raycaster

Textured walls, a title screen, a generated maze that grows bigger and busier with every level you clear, and patrolling/chasing enemies — hit detection, a HUD weapon with a particle muzzle flash, hit sparks, a death burst, a health bar with a screen flash on every hit, a level counter, a HUD compass pointing toward the exit, and a persisted-best-level game-over screen. WASD to move, Q/E to strafe, spacebar to fire.

---

## How it works

A raycaster fires one ray per screen column from the player's position outward into the map. For each column it asks: *how far away did this ray hit a wall?* A nearby wall fills a tall strip; a distant wall fills a short one. That height difference creates the illusion of depth.

The stepping algorithm is **DDA** (Digital Differential Analyser) — it steps from grid cell to grid cell without wasting time on empty space. Wall textures are sampled one pixel column at a time using `drawing.drawImageStrip`.

`GameScene.startLevel()` calls `mazegrid.generate(mapSize)` at the start of every level — the very first, from `onenter()`, and every one after that from `nextLevel()` — sized by `mazeSizeForLevel()` (see below), so the maze isn't just different each playthrough, it gets bigger as a run goes on. `MazeGrid.bas` builds it with a randomized recursive backtracker — starting from one cell, it repeatedly carves a passage to a random unvisited neighbour, backtracking when it paints itself into a corner. That process always produces a "perfect maze": exactly one path between any two open cells, fully connected, with no isolated pockets — which matters here because enemy spawn points (`pickEnemySpawn()`), enemy patrol targets (`Enemy.pickPatrolTarget()`), and the exit's own placement (`pickExitPosition()`) are all chosen by picking a random open cell and trusting it's reachable.

Each enemy is a **billboard sprite**: its world position is projected onto the screen using a camera-plane transform (`GameScene.projectEnemy()`), the same transform the raycaster itself uses to turn world coordinates into screen ones. A **z-buffer**, filled in during `castRays()`, records each wall's distance per column, so an enemy is only drawn where it's closer to the camera than the wall behind it (`drawEnemy()`).

Getting the billboard's width right took an extra step: `drawEnemy()`'s `spriteH` (the sprite's on-screen height) is in real screen pixels, but `drawLeft`/`drawRight`/`texCol` are worked out in ray-column-index units — the same units `e.screenX` and `castRays()`'s own `col` use, where each column is `STRIP` (4) screen pixels wide. Using `spriteH` directly as a column-index width made every enemy four times too wide relative to its height, confirmed by simulating the algorithm against the real `enemy.png` before touching the code — dividing it by `STRIP` (`spriteWCols`) converts the pixel-scale height into the matching column-index scale for the width.

Firing, landing a hit, and killing an enemy all trigger an `Emitter` burst — the same particle module used by Coins Platformer, Bullet Hell Shooter, and Dungeon Explorer, but wired up differently here: this demo has no `world`/`camera` at all, so every emitter is added via `hud.add()` instead of `world.add()`, and positioned using the same projected screen coordinates the raycasting/billboard code already computes rather than world-space map coordinates. See [HUD layering](#hud-layering) below for why.

Enemies (`Enemy.bas`) patrol a nearby open cell until the player comes within `chaseRadius` (6 tiles), then switch to chasing, giving up back to patrol once the player is more than `giveUpRadius` (9 tiles) away. Movement is a straight-line step toward the current target each frame, checked against the maze one axis at a time (`tryMove()`) — the same wall-sliding trick `GameScene.handleInput()` uses for the player. This is deliberately simpler than the engine's real `pathfinding` module, which Dungeon Explorer's enemies use: `pathfinding` needs a genuine `TileMapSet` to navigate, and Raycaster has no visual tilemap at all — the maze only exists as `MazeGrid`'s flat array of wall/floor cells, walked by DDA and drawn as textured strips, never as tiles PIXI itself knows about. Straight-line movement plus per-axis wall collision is close enough over the short patrol/chase distances involved here, without needing a `TileMapSet` this demo has no other reason to build.

A chasing enemy doesn't walk all the way onto the player's exact position — `stopDistance` (1 tile) halts its approach a little short, so it never visually sits on top of the player in a first-person view where that would be impossible to read. `GameScene`'s own contact-damage check (`dist < 0.8`) sits just inside that stop distance, so damage now mostly comes from the player choosing to close that last bit of distance themselves rather than an enemy automatically closing it the instant it catches up. A single cooldown shared across every enemy (not one per enemy) still caps how often that damage can land regardless of how many enemies are nearby at once — with as many as 20 enemies now able to be adjacent simultaneously at the higher levels (see the enemy-count formula below), a per-enemy cooldown would let a swarm land far more hits than intended, the opposite of the point of having one.

`Enemy.bas` also uses a getter-based interface (`isDead()`, `getX()`, `getY()`, `getScreenX()`, `getTransformY()`, `isFlashing()`, `isAttacking()`, and a `setProjection()` setter) instead of letting `GameScene` read and write its fields directly. That's a workaround for a real compiler limitation: reading a field straight off an external class-typed instance (a `dim e as Enemy` local, a typed parameter, or an array element) inside a comparison or an `and`/`or` expression type-checks against the generic `Object` type rather than the field's real declared type, and fails to compile. A getter's return type is inferred correctly because it reads the field from inside its own class. The same pattern shows up in Dungeon Explorer's `Boss.isDead()` — see that file's comments for the fuller explanation.

### Level progression: bigger mazes, more enemies

Levels progress endlessly — there's no final level, no win screen, only "how many levels can you survive before you die?" `GameScene.mazeSizeForLevel(lvl)` and `enemyCountForLevel(lvl)` compute that difficulty curve as pure functions of `level`, and both are capped so a run that goes on indefinitely never asks the fixed-size arrays underneath to hold more than they were sized for:

- **Maze size** grows from a 9×9 real grid (4 logical cells) at level 1, adding one logical cell per level, capping at 16 logical cells — 33×33 real, today's original fixed size — by level 13: `mazeSizeForLevel(lvl) = 2 * math.min(4 + (lvl - 1), 16) + 1`. `MazeGrid`'s recursive backtracker works over *logical* cells sitting at odd real coordinates, which is why the formula is `2 * logicalSize + 1` rather than `logicalSize` directly.
- **Enemy count** starts at 4, adds 2 per level, and caps at 20 by level 9 — past that point, more enemies stopped meaningfully raising the difficulty and mostly just meant more per-frame bookkeeping in `renderEnemies()`'s sort and draw loops: `enemyCountForLevel(lvl) = math.min(4 + 2 * (lvl - 1), 20)`.

`startLevel()` runs both formulas, calls `mazegrid.generate(mapSize)`, respawns the player at the maze's guaranteed-open start cell `(1.5, 1.5)`, builds a fresh `Enemy` roster sized by `ENEMY_COUNT`, and picks a new exit — it's the one place all of a level's setup happens, called from `onenter()` for level 1 and from `nextLevel()` for every level after. `MazeGrid.bas`'s `cells(1089)` array and `GameScene`'s `enemies(20) as Enemy` array both stay sized for the level-13/level-9 worst case regardless of what a given level's `generate(size)`/`ENEMY_COUNT` actually use — a smaller level just uses a subset of each array, the same way the original fixed-size maze always implicitly did.

### The exit: a code-drawn billboard, no new asset

The maze exit needed no new image. `pickExitPosition()` places it with the same reroll-until-far-enough pattern `pickEnemySpawn()` already used for enemy spawns, except it rerolls until the exit lands at least 60% of the maze's diagonal away from the player's spawn corner, so reaching it is a genuine trek rather than a lucky first turn. `projectExit()` mirrors `projectEnemy()`'s camera-plane transform exactly — same formula, a single object instead of a loop over an array — and `drawExit()` mirrors `drawEnemy()`'s column-by-column, z-buffer-occluded draw loop, but calls `drawing.drawRect` with a flat gold fill colour (`pen.setFillColor(255, 215, 0)`) per visible column instead of sampling `drawing.drawImageStrip` from a texture. A billboard doesn't need to be textured to behave like one on screen; it only needs the same projection math and the same z-buffer occlusion check every other billboard in this demo already has.

`pickEnemySpawn()`'s own "far enough" distance used to be a flat 8 tiles, regardless of the current maze's actual size — reasonable at level 13's 33×33, but at level 1's 9×9 (and every small early maze after it), 8 tiles is close to the whole map's diagonal, so almost every candidate cell failed the check and the reroll loop burned all its tries without ever finding one that passed, silently falling back to whatever candidate it tried last — which could easily still be right next to the player's spawn corner. Reported live as getting hit almost the instant a level starts. It now scales the same way `pickExitPosition()`'s own distance already does — `mazegrid.getMapW() * 0.35`, a smaller fraction than the exit's 0.6 since enemies only need to not be adjacent, not be a trek away — keeping the requirement satisfiable at every maze size. Confirmed live: printed each enemy's actual spawn distance across two separate mazes at level 1 (`mapW = 9`, so `minDist = 3.15`) — every one landed between 4 and 7.2 tiles out, comfortably past the threshold.

### The compass arrow, and a `drawLine` quirk worth knowing

`drawCompass()` draws a small hand-rotated arrow near the top-right corner of the screen every frame, always pointing toward the exit's direction relative to the player's current facing — regardless of whether the exit itself is currently on screen, which matters once mazes started growing past the original 33×33, since a distant exit can sit many cells outside the player's view for most of a level. The arrow is two `drawing.drawLine` calls forming a chevron, rotated with plain `math.cos`/`math.sin` from `math.atan2(exitY - posY, exitX - posX)` relative to the player's own facing angle (`atan2(dirY, dirX)`) — no image asset, same reasoning as the exit billboard above.

The arrow's anchor point is `stage.width() - margin, margin`, matching how `weaponSprite` already positions itself a few lines above. Originally this compass instead read `self.SW - margin`, and `self.SW` was a fixed `800` constant — a canvas smaller than 800×600, which is what the editor's own Run panel produces, put the arrow entirely outside the visible canvas, so it silently never appeared during play despite compiling and running with zero console errors. That was caught only by reading back actual rendered pixel colours from the WebGL canvas and confirming none of them were the compass's gold; "no console errors" alone, the verification method used everywhere else in this plan, doesn't catch a silently-off-canvas draw. See "The raycast now matches the real canvas size" below for how `self.SW` itself stopped being a fixed constant shortly after this fix.

Worth calling out explicitly, the way the muzzle-flash offset and the billboard-width-stretch bug are already documented elsewhere in this file: `drawing.drawLine(x, y, x2, y2)` does **not** take two absolute endpoints. Reading `src/components/Runner/engine/drawing.js` confirms it builds the line from local `(0, 0)` to `(x2, y2)` and *then* positions the whole result at `(x, y)` — so `x2`/`y2` are a local offset from the start point, not a second absolute coordinate, and passing a second absolute point straight through draws a wildly wrong (usually far too long, wrongly angled) line. `drawCompass()` works out each arrow segment's absolute tip/left/right points first using trig against the arrow's centre, then subtracts the segment's own start point back out before calling `drawLine`, to turn those absolute points back into the offset the function actually expects.

The relative angle fed into that trig is offset by an extra quarter turn — `relAngle = angleToExit - playerAngle - (math.pi() / 2)`, not just `angleToExit - playerAngle`. Without it, `relAngle = 0` (exit dead ahead) drew the arrow pointing screen-*right*, since `cos(0)`/`sin(0)` is `(1, 0)` — mathematically correct for measuring an angle, but not what "dead ahead" should look like on a compass, where every convention (and every waypoint HUD) reads "straight ahead" as "up". This was confirmed live rather than just reasoned about: forcing the exit due east of spawn (dead ahead, since the player always starts facing `dirX = 1`/`dirY = 0`) and reading back the arrow's pixels showed a wide, short cluster (23px × 11px, consistent with a sideways chevron) before the fix, and a narrow, tall cluster pointing up (11px × 23px) after it.

### The raycast now matches the real canvas size

The compass fix above only moved one HUD element; it didn't touch the raycasting math itself, which still assumed a fixed 800×600 "design resolution" (`self.SW`/`self.SH` set once to literal `800`/`600` in the `Constructor`, `self.RAYS = 200` rays each `self.STRIP = 4` pixels wide, `self.SCY = 300`). On any canvas that wasn't exactly 800×600 — a smaller editor Run panel, or a much larger fullscreen window — the raycast view rendered at a fixed 800-pixel width regardless, while `weaponSprite` (and now the compass) tracked the *real* canvas width via `stage.width()`. The two visibly drifted apart the further the real canvas size was from 800×600: at a canvas wider than 800, the raycast stayed pinned to a fixed-width region on the left while the gun, centred on the real (wider) canvas, drifted off to one side of it.

The fix: `onenter()` now sets `self.SW = stage.width()`, `self.SH = stage.height()`, `self.SCY = self.SH / 2`, and `self.STRIP = self.SW / self.RAYS` every time a run starts (a fresh play, or a restart after death) — the same one-time-per-run timing already used for the other per-run resets (health, facing direction) just above. `self.RAYS` stays a fixed `200`, since it's also the size of the `zbuffer(200)` array below it, and array sizes need a compile-time literal in this language, not a runtime expression — the same reason `self.ENEMY_COUNT` stays a separate field from the `enemies(20)` array's own literal size. Deriving `STRIP` (the pixel width of one ray's column) from the real width instead keeps those 200 columns spanning exactly `self.SW` on any canvas. `castRays()`'s ceiling and floor rectangles, previously hardcoded to `drawing.drawRect(400, 150, 800, 300)` and `drawing.drawRect(400, 450, 800, 300)`, became `self.SW / 2, self.SH / 4, self.SW, self.SH / 2` and `self.SW / 2, self.SH * 3 / 4, self.SW, self.SH / 2` for the same reason.

This doesn't handle a resize that happens *mid-run* without a restart — there's no resize event in this engine to react to, so `self.SW`/etc. are only ever re-derived at the start of a run. In practice this means: go fullscreen (or resize the window) before hitting "Try again" (or before the very first "Press any key to start"), and the raycast, the gun, and the compass will all agree on the same canvas size for that run.

### Health carries across levels

`startLevel()` regenerates the maze, respawns the enemy roster, and picks a new exit on every level transition, but it never touches `playerHealth`. That's deliberate: resetting health every time the player reaches the exit would make dying from attrition nearly impossible, since death could then only ever come from damage taken within a single level — undermining the entire "how many levels before you die" premise the endless structure exists to support. A run's health total is the one thing that's meant to persist and eventually run out.

### Damage flash and the level HUD text

Taking a hit now has visual feedback beyond the health bar shrinking: `damage_flash.png` is a solid red 8×8 square, stretched via `setScale(stage.width() / 8, stage.height() / 8)` into a full-screen `Sprite`, the same "tiny image stretched into a shape" trick the health bar itself already uses. It's created once in `setupHud()` at `setAlpha(0)` (invisible), and the same block in `onupdate()` that applies melee damage also sets `damageFlashTimer = 18` — a frame counter, mirroring `flashTimer`/`damageCooldown`'s existing convention in this file rather than introducing delta-time math. Each frame it's nonzero, `onupdate()` decrements it and sets `damageFlash`'s alpha to `0.35 * damageFlashTimer / 18`, fading the flash from a low peak back to fully transparent over about 18 frames (~0.3s at 60fps) — a brief, subtle vignette rather than something that obscures enemies or walls underneath.

The HUD also now shows the current level: a `levelHudText` field, created once in `setupHud()` directly below the existing "HP" label, and updated via `Text`'s existing `setText()` method at the end of `startLevel()` — so it's current the instant a new level begins, both on the very first level and every one after.

### Death, `GameOverScene`, and the persisted best level

Death is a real scene switch now, not a frozen overlay drawn in place. `GameScene.onupdate()` still owns the death check (`playerHealth < 1`); on death it records `self.gameData.levelReached = self.level` and calls `scenemanager.switch("gameover")`, instead of adding a static "GAME OVER!" `Text` to `hud` and simply returning early forever. Because scenes in this engine are constructed once in `Main.bas` and reused across switches rather than recreated each time, `GameScene.onenter()` now has to fully reset every field that matters at the start of a run — health, facing direction, `level` — on *every* re-entry, not just the first, since it's no longer a "runs exactly once per page load" scene the way it was before endless levels existed.

`setupHud()` now runs fresh from `onenter()` on *every* entry too, not just the first — it originally stayed guarded behind a one-time `hudSetupDone` flag on the theory that the screen-fixed HUD widgets (weapon sprite, health bar, particle emitters) never need recreating. That reasoning missed something: the engine's own `_sbScene._applySwitch()` calls `stage.clear()` before `onenter()` ever runs, on *every* scene switch — wiping both the world and hud containers unconditionally, including the very switch back into `"game"` on a restart. With the guard in place, that restart re-entered `onenter()` with `hudSetupDone` already tripped from the first play-through, so `setupHud()` never ran again — the gun, health bar, and level text stayed permanently gone for the rest of that browser session, even though everything had genuinely just been cleared out from under them a moment earlier. Removing the guard (accepting that `setupHud()` recreates these every restart, which is correct now that a restart always means a genuinely empty hud) fixed it.

`GameData.bas` is the one piece of state built to survive that scene switch: a plain `Class` with no `Extends`, mirroring Coins Platformer's own `GameData.bas` — the established pattern in this project for "a small piece of state needs to outlive a scene switch." It's constructed once in `Main.bas` and passed into both `GameScene`'s and `GameOverScene`'s constructors, and it holds `levelReached` alongside the persisted `bestLevel`. `GameOverScene.onenter()` calls `self.gameData.updateBestLevel(reached)`, which owns the entire `save.exists("raycasterBestLevel")` / `save.get(...)` / compare / `save.set(...)` sequence itself — the same pattern Bullet Hell Shooter's own `GameData.bas` uses for its persisted best time — so neither scene touches `save` directly. `updateBestLevel()` returns whether this run set a new best, which `GameOverScene` uses to show either "New best!" or the previous "Best: Level N"; pressing any key on the game-over screen switches back to `"game"`, re-entering `GameScene` and running its now-idempotent `onenter()` for a genuinely fresh level-1 start.

### Zombie groan

This demo's first sound: a distance-based groan that plays while a living enemy is nearby, whether it's patrolling or actively chasing. One `Audio` instance (`zombieGroan`), not one per enemy — `audio.bas`'s `createSound()` caches sounds by filename and hands back the *same* underlying handle to every `Audio` constructed with that path, so 20 independent `new Audio(...)` calls for one file wouldn't behave independently anyway; calling `play()`/`setVolume()` on one would affect every other instance referencing that file. A single shared channel that tracks whichever enemy is currently closest is both the only thing this engine actually supports here and the more sensible design besides — 20 simultaneous overlapping groans would be noise, not atmosphere.

`onupdate()`'s existing per-enemy loop already computes `dist` for every living enemy (for contact-damage purposes); tracking a running `nearestEnemyDist` alongside that needs no extra distance calculations. Each frame:
- If `nearestEnemyDist <= ZOMBIE_GROAN_CUTOFF` (10 tiles — comfortably past `Enemy.giveUpRadius`'s 9, so the groan stays audible for a chasing enemy's entire approach): `zombieGroan.setVolume(ZOMBIE_GROAN_MAX_VOLUME * (1.0 - nearestEnemyDist / ZOMBIE_GROAN_CUTOFF) ^ 2)`. **Squared, not linear** — an initial linear falloff read live as "everything sounds close": human loudness perception is closer to logarithmic than linear, so a merely-linear volume value stays subjectively loud for most of the distance range, only dropping off sharply right at the very end. Squaring the proximity factor makes the drop-off far more pronounced in the middle of the range instead. `ZOMBIE_GROAN_MAX_VOLUME` (0.6) caps the peak — right on top of the player — well under full volume, rather than assuming distance alone should carry all the attenuation.
- Beyond the cutoff, nothing plays — a real, audible "out of range" rather than a sound that never quite goes silent.

It's deliberately *not* a true engine loop (`playLoop()`): a groan clip isn't built to repeat seamlessly, so instead of one continuous drone (or an audible seam every repeat), it replays as a one-shot — `if not zombieGroan.isPlaying() and zombieGroanCooldown <= 0 then play()` — for as long as an enemy stays in range. `zombieGroanCooldown` only ticks down while the clip is **not** playing, so it's frozen at `ZOMBIE_GROAN_COOLDOWN` (6s) for the clip's entire ~8s runtime and only starts counting down once it actually finishes, guaranteeing a real ~6s silence gap between groans (~14s full cycle). The original version ticked the cooldown down unconditionally from the moment `play()` was called; with a 2s cooldown and an ~8s clip, the cooldown had already run out well before the clip finished, so `isPlaying()` alone ended up gating the replay and a new groan started the instant the last one ended — reported live as sounding constant. Retreating out of range just stops it from retriggering; the current one-shot is left to finish naturally rather than being cut off abruptly.

Note the `if not X() and Y then` order, not `if Y and not X() then` — this language's `BoolExpression` grammar only accepts a leading `not` at the very start of a boolean expression (parsed once, up front, before its `and`/`or` loop); `and`/`or`'s own right-hand side parses as a plain `BoolTerm` that never routes back through the `Not` rule, so `not` can't appear *after* `and`/`or`. Confirmed live via the exact compile error writing it the other way around produces: `Expected String, Number, Variable but found not`.

Death explicitly calls `zombieGroan.stop()` before `scenemanager.switch("gameover")`. `stage.clear()` (triggered by that switch) wipes the `hud`/`world` display containers, but `zombieGroan` is a PIXI.sound instance, not a display object — switching scenes does nothing to it on its own, so a groan already playing at the moment of death would otherwise keep playing right over the game-over screen. Confirmed live: forced a death via a temporary probe timed to land while the groan was actively playing (`playing=true`), and the very next log line after `stop()` read `playing=false`.

### Footsteps

A short (~0.1s) `footstep_concrete_002.ogg` one-shot plays on a cadence while the player is actually walking. `onupdate()` checks `input.getKeyDown()` directly against W/S/Q/E (walk and strafe) — **not** A/D (turning in place, which doesn't move the player and shouldn't sound like it does) — rather than having `handleInput()` report back whether it moved, since a blocked move (walking straight into a wall) should still sound like footsteps: the player is walking in place against it, not standing still. `footstepTimer` counts down in real seconds (`delta / 1000`, same as `zombieGroanCooldown`) and gates each `footstepSound.play()` to once every `FOOTSTEP_INTERVAL` (0.35s) rather than every frame a movement key happens to be held.

Unlike `zombieGroan`, this uses `play()` rather than the same isPlaying()-gated pattern — each footstep is a short, independent one-shot rather than something that needs to avoid overlapping itself, and `play()` already supports overlapping instances of the same sound natively (see `src/docs/api-reference/audio.md`). Confirmed live: zero footsteps while idle, zero while turning only (A held), and roughly the expected count — 11 over a 4s hold of W, matching a ~0.35s cadence — while actually walking.

### Gunshot

`gunshotSound.play()` fires alongside `muzzleFlashEmitter.burst(18)` in `handleInput()`'s existing spacebar branch — same `flashTimer = 0` rate-limit gate as the muzzle flash and `checkHit()` already share, so the shot sound, the flash, and hit detection all stay in lockstep with the same fire rate rather than needing a separate cooldown of its own. That rate is now `FIRE_COOLDOWN_FRAMES` (20 frames, 3 shots/sec) rather than a bare `4` — the original 4 frames (15 shots/sec) played live as an automatic weapon despite `gun.png` being a handgun; 20 reads as a deliberate semi-auto pace instead. Confirmed live: holding spacebar for 100 frames logged exactly 5 shots — `100 / 20 = 5`, matching the new rate precisely.

### Zombie death cry

`zombieDeathSound.play()` fires in `checkHit()`'s existing `e.isDead()` branch, right alongside `enemyDeathEmitter.burst(24)` — the same place that already knows a kill (not just a hit) just landed. Up to 20 enemies could in principle die in close succession, but unlike `zombieGroan`'s single shared, distance-gated channel, this needs no cooldown or overlap handling of its own: `play()` already supports overlapping instances of the same sound natively (see "Footsteps" above), so simultaneous deaths just layer rather than needing to queue or cut each other off. Confirmed live: pre-damaged an enemy to 1 HP via a temporary probe call to `Enemy.hit(2)` (a real method already on the class, not a new one added for the test) so a single following shot would land the kill, then fired once and confirmed `checkHit()`'s branch actually ran by print-logging inside it — the death sprite, the burst, and the log all fired together.

### Background music

`yd_Searching.ogg` (~105s) is the one sound in this file that genuinely is meant to loop seamlessly, so `bgMusic.playLoop()` — not `play()` — is the right call here, the opposite choice from every other sound above. `onenter()` calls `bgMusic.setVolume(BG_MUSIC_VOLUME)` (0.2) then `playLoop()` right after `setupHud()`, on every run — the very first level 1, and every retry after death alike — since `playLoop()` restarts the track from the beginning if it's already looping (see `src/docs/api-reference/audio.md`), so this is a deliberate fresh start each time rather than a stale loop bleeding across runs. `BG_MUSIC_VOLUME` is kept low enough to sit under the gunshot, the groan, and the footsteps (all left at their default full volume) without muffling them, while staying clearly audible as ambience.

Death explicitly calls `bgMusic.stop()` alongside `zombieGroan.stop()`, for the same reason: `stage.clear()` only wipes the `hud`/`world` display containers, not PIXI.sound instances, so without it the music would keep playing under the game-over screen. Confirmed live: `playing=true` right after `onenter()` starts the loop, and `playing=false` immediately after `stop()` runs in the death branch on the very next frame (forced via a temporary probe setting `playerHealth = 0` in `onenter()`).

---

## Required assets

Upload ten PNG files and five sound files to your project's asset library before running:

| Filename | What it is |
|---|---|
| `wall.png` | 64×64 tileable wall texture |
| `enemy.png` | 64×64 enemy idle/walk sprite |
| `enemy_attack.png` | 64×64 enemy melee-attack frame |
| `enemy_hit.png` | 64×64 enemy hit-flash frame |
| `enemy_dead.png` | 64×64 enemy death frame |
| `gun.png` | Weapon sprite for the HUD |
| `particle.png` | Small square sprite used by every `Emitter` — muzzle flash, enemy hit spark, enemy death burst |
| `healthbar_bg.png` | 1×1 pixel, stretched via `setScale` into the health bar's background |
| `healthbar_fill.png` | 1×1 pixel, stretched via `setScale` into the health bar's fill — same pattern Bullet Hell Shooter uses |
| `damage_flash.png` | 8×8 solid red square, stretched via `setScale` into the full-screen damage vignette |
| `dragon-studio-zombie-sound-357975.mp3` | ~8s zombie groan, played while the nearest living enemy is within range (see "Zombie groan" below) |
| `footstep_concrete_002.ogg` | ~0.1s footstep, replayed on a cadence while the player is walking (see "Footsteps" below) |
| `impactPlate_heavy_004.ogg` | Gunshot one-shot, played alongside the muzzle flash every time the player fires (see "Gunshot" below) |
| `freesound_community-zombie-6851.mp3` | Death cry one-shot, played once whenever an enemy is killed (see "Zombie death cry" below) |
| `yd_Searching.ogg` | ~105s ambient background music, looped quietly for the whole run (see "Background music" below) |

The exit billboard and the compass arrow are both drawn purely with `drawing`/`pen` calls, so endless levels needed no new image assets beyond these ten PNGs — the zombie groan, the footstep, the gunshot, the death cry, and the background music are this demo's only sounds.

---

## Controls

| Key | Action |
|---|---|
| W | Walk forward |
| S | Walk backward |
| A | Turn left |
| D | Turn right |
| Q | Strafe left |
| E | Strafe right |
| Space | Fire |
| Any key (title screen) | Start the game |
| Any key (game-over screen) | Try again |

---

## Enemy.bas

```bas
Class
' demo-src/raycaster/Enemy.bas
'
' A plain Class (no Extends) -- not a sprite/animatedsprite. Raycaster has
' no `world`; every enemy is billboard-projected and drawn directly via
' drawing.drawImageStrip by GameScene, the same way the original single
' enemy always was. This class owns one enemy's position and patrol/chase
' behaviour behind a small interface (update/hit) so GameScene doesn't
' need to know how an enemy decides where to move.

dim x
dim y
dim hp
dim dead
dim state
dim speed
dim patrolSpeed
dim chaseRadius
dim giveUpRadius
dim stopDistance
dim patrolTargetX
dim patrolTargetY
dim patrolTimer
dim hitFlashTimer
dim attackFlashTimer
dim screenX
dim transformY

Constructor(startX, startY)
  self.x = startX
  self.y = startY
  self.hp = 3
  self.dead = false
  self.state = "patrol"
  ' Chase speed lowered from an earlier 1.2 -- confirmed live it read as
  ' uncomfortably fast when a chasing enemy rounded a corner unannounced,
  ' with no animation to soften the sudden close-distance approach.
  self.speed = 0.85
  self.patrolSpeed = 0.6
  self.chaseRadius = 6
  self.giveUpRadius = 9
  ' A chasing enemy stops here rather than closing the rest of the way
  ' onto the player's exact position -- without this it would walk fully
  ' on top of the player (visually indistinguishable from the player's own
  ' sprite in a first-person view). Left deliberately a bit larger than
  ' GameScene's own dist < 0.8 contact-damage threshold, so a stopped
  ' enemy waits just outside contact range; damage still lands, but only
  ' if the PLAYER chooses to close that last bit of distance themselves,
  ' not automatically the instant the enemy catches up.
  self.stopDistance = 1.0
  self.patrolTargetX = startX
  self.patrolTargetY = startY
  self.patrolTimer = 0
  self.hitFlashTimer = 0
  self.attackFlashTimer = 0
  self.screenX = -999
  self.transformY = -1
EndConstructor

function pickPatrolTarget()
  ' A random OPEN cell within a few tiles -- nearby, not maze-wide, so
  ' the straight-line walk in tryMove() below actually reaches it most
  ' of the time without full pathfinding (see the design doc for why
  ' real pathfinding wasn't used here: it requires a real TileMapSet,
  ' which this demo, having no visual tilemap at all, doesn't have).
  dim tries
  dim ox
  dim oy
  dim tx
  dim ty
  tries = 0
  while tries < 10
    ox = math.randomint(7) - 3
    oy = math.randomint(7) - 3
    tx = math.floor(self.x) + ox
    ty = math.floor(self.y) + oy
    if mazegrid.isOpen(tx, ty) then
      self.patrolTargetX = tx + 0.5
      self.patrolTargetY = ty + 0.5
      tries = 10
    endif
    tries = tries + 1
  endwhile
  self.patrolTimer = 3
endfunction

function tryMove(nx, ny)
  ' wallMargin checks a point a little further along than the actual
  ' destination -- in whichever direction this axis is moving -- rather
  ' than the bare destination cell itself. An enemy is drawn as a wide
  ' billboard (see GameScene.drawEnemy()), not a single point, so letting
  ' its CENTRE walk right up to a wall cell's edge (the old behaviour: the
  ' bare destination check with no margin at all) let its rendered width
  ' visibly overlap the neighbouring wall texture -- reported as enemies
  ' appearing to "clip through walls". Checking a point wallMargin further
  ' out keeps every enemy's centre at least that far from any wall it's
  ' walking toward, without affecting how close it can get to a wall it's
  ' NOT currently moving toward (this only touches the axis/direction
  ' actually being tested), so normal corridor navigation (this maze's
  ' corridors are always exactly 1 cell wide) is unaffected as long as
  ' wallMargin stays well under half a cell.
  dim wallMargin
  dim checkX
  dim checkY

  wallMargin = 0.3

  if nx >= self.x then
    checkX = nx + wallMargin
  else
    checkX = nx - wallMargin
  endif
  if mazegrid.getCell(math.floor(checkX), math.floor(self.y)) = 0 then
    self.x = nx
  endif

  if ny >= self.y then
    checkY = ny + wallMargin
  else
    checkY = ny - wallMargin
  endif
  if mazegrid.getCell(math.floor(self.x), math.floor(checkY)) = 0 then
    self.y = ny
  endif
endfunction

function update(dt, playerX, playerY)
  dim dist
  dim dx
  dim dy
  dim moveDist
  dim nx
  dim ny
  dim moveSpeed

  if self.dead then
    return
  endif

  if self.hitFlashTimer > 0 then
    self.hitFlashTimer = self.hitFlashTimer - dt
  endif

  if self.attackFlashTimer > 0 then
    self.attackFlashTimer = self.attackFlashTimer - dt
  endif

  dist = math.distance(self.x, self.y, playerX, playerY)

  if self.state = "patrol" then
    if dist <= self.chaseRadius then
      self.state = "chase"
    endif
  else
    if dist > self.giveUpRadius then
      self.state = "patrol"
    endif
  endif

  if self.state = "chase" then
    if dist <= self.stopDistance then
      ' Already as close as it's allowed to get -- hold position rather
      ' than continuing to close in on the player's exact coordinates.
      dx = 0
      dy = 0
    else
      dx = playerX - self.x
      dy = playerY - self.y
    endif
    moveSpeed = self.speed
  else
    self.patrolTimer = self.patrolTimer - dt
    if self.patrolTimer <= 0 or math.distance(self.x, self.y, self.patrolTargetX, self.patrolTargetY) < 0.3 then
      self.pickPatrolTarget()
    endif
    dx = self.patrolTargetX - self.x
    dy = self.patrolTargetY - self.y
    moveSpeed = self.patrolSpeed
  endif

  moveDist = math.distance(0, 0, dx, dy)
  if moveDist > 0.05 then
    nx = self.x + (dx / moveDist) * moveSpeed * dt
    ny = self.y + (dy / moveDist) * moveSpeed * dt
    self.tryMove(nx, ny)
  endif
endfunction

function hit(damage)
  if not self.dead then
    self.hp = self.hp - damage
    self.hitFlashTimer = 0.15
    if self.hp <= 0 then
      self.dead = true
    endif
  endif
endfunction

' Called by GameScene the instant this enemy lands a melee hit on the
' player -- mirrors hit()'s hitFlashTimer exactly (a plain countdown,
' decremented in update() above), just for the enemy's own attack
' animation rather than its got-hit reaction.
function attack()
  self.attackFlashTimer = 0.15
endfunction

' Setter -- GameScene's projectEnemy() computes this enemy's billboard
' screen position every frame and needs to store it back onto the enemy.
' Routing that write through a method (rather than assigning self.screenX/
' self.transformY directly from outside) keeps this class's internals
' behind its own interface, matching every other cross-instance access in
' this file (see the getters below).
function setProjection(newScreenX, newTransformY)
  self.screenX = newScreenX
  self.transformY = newTransformY
endfunction

' Getters -- GameScene reads these fields from an EXTERNAL Enemy instance
' (a local `dim e as Enemy`, a function parameter `e as Enemy`, or an array
' element) inside comparisons/if-conditions/and-or expressions. A bare
' external field read in exactly those contexts type-checks against the
' generic Object type rather than the field's real declared type and fails
' to compile ("Expected type(s) Number/Boolean but got Object") -- the same
' documented limitation Dungeon Explorer's Boss.isDead()/DungeonScene hit
' (see DungeonScene.bas's onupdate comment). A getter's return type is
' inferred correctly because the field is read from WITHIN its own class,
' so routing every such external read through one of these avoids the
' compile error. Bare external reads under a plain `not` (no other type
' check attached) are fine without a getter -- NotNode has no type check --
' which is why update()'s own internal `if self.dead then` and GameScene's
' `if not e.dead then` elsewhere don't need one.
function isDead()
  return self.dead
endfunction

function getX()
  return self.x
endfunction

function getY()
  return self.y
endfunction

function getScreenX()
  return self.screenX
endfunction

function getTransformY()
  return self.transformY
endfunction

function isFlashing()
  return self.hitFlashTimer > 0
endfunction

function isAttacking()
  return self.attackFlashTimer > 0
endfunction

EndClass
```

## GameData.bas

```bas
Class
' demo-src/raycaster/GameData.bas
'
' A plain Class (no Extends) -- mirrors Coins Platformer's own
' GameData.bas exactly: a small piece of state that needs to survive a
' scene switch (constructed once in Main.bas, passed into every scene's
' constructor that needs it) rather than scenes reading each other's
' fields directly.

dim levelReached
dim bestLevel

Constructor()
  self.levelReached = 1
  self.bestLevel = 0
EndConstructor

function updateBestLevel(reached)
  ' Owns the persisted-best comparison itself, mirroring Bullet Hell
  ' Shooter's own GameData.bas -- there, WinScene/TitleScene never touch
  ' `save` directly, they call a GameData method (trySetBestTime/
  ' loadBestTime); the save.exists/save.get/save.set calls stay inside
  ' GameData either way. Returns true if this run set a new best, and
  ' leaves self.bestLevel holding the (possibly just-updated) persisted
  ' value either way, so a caller can read it without needing its own
  ' copy of the comparison logic.
  dim best
  dim isNewBest

  if save.exists("raycasterBestLevel") then
    best = save.get("raycasterBestLevel")
  else
    best = 0
  endif

  isNewBest = false
  if reached > best then
    best = reached
    save.set("raycasterBestLevel", best)
    isNewBest = true
  endif

  self.bestLevel = best
  return isNewBest
endfunction

EndClass
```

## GameOverScene.bas

```bas
Class
Extends scene
' demo-src/raycaster/GameOverScene.bas

dim gameData as GameData
dim levelText as Text
dim bestText as Text
dim promptText as Text

Constructor(gameData as GameData)
  self.gameData = gameData
EndConstructor

function onenter()
  ' The exists/get/compare/set persisted-best sequence lives in
  ' GameData.updateBestLevel(), not here -- mirrors Bullet Hell Shooter's
  ' own GameData.bas, where WinScene/TitleScene never touch `save`
  ' directly either, only call a GameData method.
  dim reached
  dim isNewBest

  reached = self.gameData.levelReached
  isNewBest = self.gameData.updateBestLevel(reached)

  world.setBackground(0, 0, 0)

  self.levelText = new Text("You reached Level " + string.str(reached), stage.width() / 2 - 130, stage.height() / 2 - 60)
  self.levelText.setStyle(28, 255, 220, 120)
  hud.add(self.levelText)

  if isNewBest then
    self.bestText = new Text("New best!", stage.width() / 2 - 60, stage.height() / 2 - 10)
  else
    self.bestText = new Text("Best: Level " + string.str(self.gameData.bestLevel), stage.width() / 2 - 80, stage.height() / 2 - 10)
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

## GameScene.bas

```bas
Class
Extends scene

dim gameData as GameData

' Screen
dim STRIP
dim RAYS
dim SW
dim SH
dim SCY

' Texture sizes
dim TEXW
dim ENIW

' Weapon
dim weaponSprite as Sprite
dim flashTimer
' Frames between shots -- was a bare 4 (15 shots/sec, played live as an
' automatic weapon despite being a handgun); 20 (3 shots/sec) reads as a
' deliberate semi-auto pistol pace instead.
dim FIRE_COOLDOWN_FRAMES

' weaponSprite is a plain Sprite. `sprite` is now centre-anchored (matching
' animatedsprite), so weaponSprite.transform.x()/y() reports the CENTRE of
' the underlying 256x256 gun.png, not its top-left corner. The muzzle
' opening sits at roughly (122, 36) from that image's top-left, found by
' locating the dark pixel cluster at the tip of the barrel -- converted to
' an offset from the image's centre (128, 128), that's (122 - 128, 36 - 128)
' = (-6, -92), so muzzleFlashEmitter can still be positioned relative to
' weaponSprite's own transform rather than a second, independent hardcoded
' screen coordinate that has to be kept in sync with it by hand.
dim muzzleOffsetX
dim muzzleOffsetY

' Particles -- added to the HUD layer, not the world. castRays() calls
' drawing.clear() and redraws the ceiling/floor/walls into the world
' container fresh every single frame, so anything world.add()'d would get
' painted over the instant the next frame's walls go up. HUD is a
' separate container that always renders on top of the world, which is
' also why the gun sprite and health bar below stay visible -- placing
' the emitters there sidesteps the redraw entirely. There's no camera in
' this demo, so HUD/world/screen coordinates are all the same thing.
dim muzzleFlashEmitter as Emitter
dim enemyHitEmitter as Emitter
dim enemyDeathEmitter as Emitter

' Player state
dim posX
dim posY
dim dirX
dim dirY
dim planeX
dim planeY
dim playerHealth
dim damageCooldown

' Hud
' healthbar_bg.png/healthbar_fill.png are 1x1 pixel images stretched via
' setScale into a bar shape -- the same pattern Bullet Hell Shooter uses.
' `sprite` is centre-anchored, so each bar's setPosition must be its
' CENTRE, not its top-left corner.
dim hpBg as Sprite
dim hpFill as Sprite
dim hpLabel as Text
dim levelHudText as Text

' Damage flash -- a full-screen red vignette that briefly appears when the
' player takes damage, same 1x1-pixel-stretched-via-setScale pattern as the
' health bar above. damageFlashTimer counts down in frames (mirroring
' flashTimer/damageCooldown's existing frame-counter convention in this
' file), driving the sprite's alpha back down to 0 as it expires.
dim damageFlash as Sprite
dim damageFlashTimer

' Zombie groan -- one shared Audio instance, not one per enemy. audio.bas's
' createSound() caches sounds by filename and hands back the SAME
' underlying handle to every Audio instance constructed with that path, so
' 20 independent "new Audio(...)" calls for the same file wouldn't behave
' independently anyway -- calling play()/setVolume() on one would affect
' every other instance referencing that same file. A single shared channel
' that tracks whichever enemy is currently closest is both the only thing
' this engine actually supports here and the more sensible design besides:
' 20 simultaneous overlapping groans would be noise, not atmosphere.
dim zombieGroan as Audio
dim zombieGroanCooldown
dim ZOMBIE_GROAN_CUTOFF
dim ZOMBIE_GROAN_COOLDOWN
dim ZOMBIE_GROAN_MAX_VOLUME

' Footstep -- plays via play(), not playLoop(), so each step is an
' independent, possibly-overlapping one-shot rather than a single
' instance being restarted (audio.bas's playLoop() calls stop() first,
' which would cut off the tail of the previous step). At footstepTimer's
' short interval that overlap risk is theoretical, not audible in
' practice, but play() is also just the simpler, more direct match for
' "trigger a short clip repeatedly" than looping ever was.
dim footstepSound as Audio
dim footstepTimer
dim FOOTSTEP_INTERVAL

' Gunshot -- a plain play() one-shot, same reasoning as footstepSound:
' each shot is independent, and flashTimer (see handleInput()) already
' rate-limits firing to once every FIRE_COOLDOWN_FRAMES frames, so
' there's no realistic way for this to overlap itself badly enough to
' matter.
dim gunshotSound as Audio

' Zombie death cry -- a plain play() one-shot in checkHit()'s existing
' e.isDead() branch, the same place enemyDeathEmitter already bursts.
' Up to 20 enemies could die in close succession in principle, but
' play() already supports overlapping instances of the same sound (see
' footstepSound's own comment), so simultaneous deaths just layer
' naturally rather than needing a shared-channel/cooldown scheme like
' zombieGroan's.
dim zombieDeathSound as Audio

' Background music -- unlike every other sound in this file, this one
' genuinely IS meant to loop seamlessly (it's a proper ~105s ambient
' track, not a short effect), so playLoop() is the right call here where
' it wasn't for zombieGroan/footstepSound/gunshotSound/zombieDeathSound.
' Kept deliberately quiet (see BG_MUSIC_VOLUME) so it adds atmosphere
' without competing with the gunshot, the groan, or the footsteps.
dim bgMusic as Audio
dim BG_MUSIC_VOLUME

' Enemies
' ENEMY_COUNT mirrors the array size below (dim enemies(10) as Enemy) -- the
' sized-array declaration itself needs a compile-time literal (array dims
' can't take a self.* field as their size, the same reason MazeGrid.bas's
' dim stackX(256) is a literal, not a field reference), so that one
' declaration keeps the bare 10. Every LOOP BOUND that walks the array uses
' this constant instead, so the loop bound isn't a second bare literal that
' could drift out of sync with the array's actual size. This also means
' every such loop stays correct even if ENEMY_COUNT were ever smaller than
' the array's fixed 20 slots -- e.g. a future formula that decreased
' between levels -- since nothing loops over the array's raw size.
dim ENEMY_COUNT
dim enemies(20) as Enemy

' Level progression
dim level

' Exit
dim exitX
dim exitY
dim exitScreenX
dim exitTransformY

' Z-buffer
dim zbuffer(200)

' Movement speeds
dim moveSpeed
dim rotSpeed

Constructor(gameData as GameData)
  self.gameData = gameData
  ' STRIP/SW/SH/SCY are placeholders here -- onenter() overwrites all four
  ' with values derived from the actual canvas before they're ever used
  ' (see the comment there). RAYS is the one genuinely fixed constant: it
  ' matches the zbuffer(200) array's compile-time-literal size below.
  self.STRIP = 4
  self.RAYS = 200
  self.SW = 800
  self.SH = 600
  self.SCY = 300
  self.TEXW = 64
  self.ENIW = 64
  self.FIRE_COOLDOWN_FRAMES = 20
  ' Low enough to sit under the gunshot/groan/footstep effects (all at
  ' their default full volume) rather than muffling them, but still
  ' clearly audible as ambience rather than fading into silence.
  self.BG_MUSIC_VOLUME = 0.2
  self.flashTimer = self.FIRE_COOLDOWN_FRAMES
  self.muzzleOffsetX = -6
  self.muzzleOffsetY = -92
  self.dirX = 1.0
  self.dirY = 0.0
  self.planeX = 0.0
  self.planeY = 0.66
  self.playerHealth = 100
  self.damageCooldown = 0
  self.moveSpeed = 0.05
  self.rotSpeed = 0.04
  ' Tiles -- comfortably past Enemy.giveUpRadius (9), so the groan is
  ' audible for a chasing enemy's entire approach, not just its last few
  ' steps.
  self.ZOMBIE_GROAN_CUTOFF = 10
  ' Seconds of SILENCE after a groan finishes before it's allowed to play
  ' again -- not seconds between play() calls. The original 2.0 did
  ' nothing in practice: the shipped clip is ~8s long, so isPlaying()
  ' was already the binding constraint and a new groan started the
  ' instant the last one ended, reported live as sounding constant.
  ' 6 seconds of quiet after an ~8s groan gives a real off period each
  ' cycle (~14s total) rather than back-to-back replaying.
  self.ZOMBIE_GROAN_COOLDOWN = 6.0
  ' Volume at distance 0 -- capped well under 1.0 so even a zombie right
  ' on top of the player isn't jarringly loud.
  self.ZOMBIE_GROAN_MAX_VOLUME = 0.6
  ' Seconds between footstep sounds while a movement key is held.
  self.FOOTSTEP_INTERVAL = 0.35
EndConstructor

function checkHit()
    dim aimCol = self.RAYS / 2
    dim i
    dim e as Enemy
    dim bestIndex
    dim bestDist
    dim hitX
    dim spriteH
    dim spriteWCols
    dim aimTolerance

    bestIndex = -1
    bestDist = 999999

    for i = 0 to self.ENEMY_COUNT - 1
      e = self.enemies(i)
      if not e.dead and e.getTransformY() > 0 then
        ' aimTolerance used to be a flat 15 columns regardless of how big
        ' the enemy actually looks on screen -- fine at typical mid-range
        ' distances, but it made close-range shots feel unfairly finicky:
        ' a nearby enemy's billboard can span FAR more than 30 columns
        ' (see drawEnemy()'s own spriteWCols), yet a shot landing well
        ' inside that visible width, just more than 15 columns off dead
        ' centre, still missed. Basing the tolerance on half the enemy's
        ' actual rendered width instead means "the crosshair is visually
        ' over the enemy" and "it counts as aimed at" agree with each
        ' other at any distance. math.max keeps a distant, narrow enemy
        ' from becoming impossibly precise to hit as spriteWCols shrinks
        ' toward zero -- 8 columns is roughly the old flat tolerance's
        ' floor for a typical mid-to-far shot.
        spriteH = math.floor(self.SH / e.getTransformY())
        spriteWCols = spriteH / self.STRIP
        aimTolerance = math.max(spriteWCols / 2, 8)
        if math.abs(e.getScreenX() - aimCol) < aimTolerance then
          if self.zbuffer(aimCol) > e.getTransformY() then
            if e.getTransformY() < bestDist then
              bestDist = e.getTransformY()
              bestIndex = i
            endif
          endif
        endif
      endif
    next i

    if bestIndex >= 0 then
      e = self.enemies(bestIndex)
      ' e.getScreenX() is a ray/column index (0..RAYS), not a pixel --
      ' converting it the same way castRays()/drawEnemy() convert
      ' a column to its actual destX puts the burst exactly where
      ' the enemy sprite is drawn. SCY is the fixed vertical anchor
      ' every wall/enemy strip is centred on (no look up/down in
      ' this demo), so it's also the correct burst height.
      hitX = e.getScreenX() * self.STRIP + self.STRIP / 2
      e.hit(1)
      if e.isDead() then
        self.enemyDeathEmitter.transform.setPosition(hitX, self.SCY)
        self.enemyDeathEmitter.burst(24)
        self.zombieDeathSound.play()
      else
        self.enemyHitEmitter.transform.setPosition(hitX, self.SCY)
        self.enemyHitEmitter.burst(8)
      endif
    endif
endfunction

function tryMovePlayer(nx, ny)
  ' Mirrors Enemy.tryMove()'s wallMargin exactly (see that function's own
  ' comment for the full reasoning) -- checks a point wallMargin further
  ' along than the actual destination, in whichever direction that axis
  ' is moving, rather than the bare destination cell. Without it, posX/
  ' posY could walk right up to a wall cell's edge (distance zero), which
  ' let the player's camera get close enough to a wall to visually clip
  ' into it -- most noticeable as a wall's near edge appearing to poke
  ' into view at a glancing angle right at the boundary. A smaller margin
  ' than the enemies' 0.3 -- the player has no rendered billboard of its
  ' own to keep clear of a wall, just the camera itself, so it doesn't
  ' need as much clearance to look right.
  dim wallMargin
  dim checkX
  dim checkY

  wallMargin = 0.2

  if nx >= self.posX then
    checkX = nx + wallMargin
  else
    checkX = nx - wallMargin
  endif
  if mazegrid.getCell(math.floor(checkX), math.floor(self.posY)) = 0 then
    self.posX = nx
  endif

  if ny >= self.posY then
    checkY = ny + wallMargin
  else
    checkY = ny - wallMargin
  endif
  if mazegrid.getCell(math.floor(self.posX), math.floor(checkY)) = 0 then
    self.posY = ny
  endif
endfunction

function handleInput()
    dim nx
    dim ny
    dim oldDirX
    dim oldPlaneX
    dim negRot

    if input.getKeyDown(87) then
        nx = self.posX + self.dirX * self.moveSpeed
        ny = self.posY + self.dirY * self.moveSpeed
        self.tryMovePlayer(nx, ny)
    endif

    if input.getKeyDown(83) then
        nx = self.posX - self.dirX * self.moveSpeed
        ny = self.posY - self.dirY * self.moveSpeed
        self.tryMovePlayer(nx, ny)
    endif

    ' Strafe -- moves perpendicular to facing direction rather than turning.
    ' (-dirY, dirX) is dir rotated +90 degrees, which is the same direction
    ' the camera plane (planeX, planeY) already points -- confirmed from the
    ' initial dir=(1,0)/plane=(0,0.66) values, where plane is dir rotated
    ' +90 and scaled -- so E (strafe toward that side) uses it directly,
    ' and Q (the opposite side) negates it.
    if input.getKeyDown(69) then
        nx = self.posX + (0 - self.dirY) * self.moveSpeed
        ny = self.posY + self.dirX * self.moveSpeed
        self.tryMovePlayer(nx, ny)
    endif

    if input.getKeyDown(81) then
        nx = self.posX + self.dirY * self.moveSpeed
        ny = self.posY + (0 - self.dirX) * self.moveSpeed
        self.tryMovePlayer(nx, ny)
    endif

    if input.getKeyDown(68) then
        oldDirX = self.dirX
        self.dirX = self.dirX * math.cos(self.rotSpeed) - self.dirY * math.sin(self.rotSpeed)
        self.dirY = oldDirX * math.sin(self.rotSpeed) + self.dirY * math.cos(self.rotSpeed)
        oldPlaneX = self.planeX
        self.planeX = self.planeX * math.cos(self.rotSpeed) - self.planeY * math.sin(self.rotSpeed)
        self.planeY = oldPlaneX * math.sin(self.rotSpeed) + self.planeY * math.cos(self.rotSpeed)
    endif

    if input.getKeyDown(65) then
        negRot = 0 - self.rotSpeed
        oldDirX = self.dirX
        self.dirX = self.dirX * math.cos(negRot) - self.dirY * math.sin(negRot)
        self.dirY = oldDirX * math.sin(negRot) + self.dirY * math.cos(negRot)
        oldPlaneX = self.planeX
        self.planeX = self.planeX * math.cos(negRot) - self.planeY * math.sin(negRot)
        self.planeY = oldPlaneX * math.sin(negRot) + self.planeY * math.cos(negRot)
    endif

    if input.getKeyDown(32) then
        if self.flashTimer = 0 then
            self.flashTimer = self.FIRE_COOLDOWN_FRAMES
            self.muzzleFlashEmitter.transform.setPosition(self.weaponSprite.transform.x() + self.muzzleOffsetX, self.weaponSprite.transform.y() + self.muzzleOffsetY)
            self.muzzleFlashEmitter.burst(18)
            self.gunshotSound.play()
            self.checkHit()
        endif
    endif
endfunction

function castRays()
    dim col
    dim cameraX
    dim rayDirX
    dim rayDirY
    dim mapX
    dim mapY
    dim deltaDistX
    dim deltaDistY
    dim stepX
    dim stepY
    dim sideDistX
    dim sideDistY
    dim hit
    dim side
    dim perpWallDist
    dim lineHeight
    dim wallX
    dim texX
    dim destX

    drawing.clear()

    ' Ceiling
    pen.setFillColor(60, 60, 80)
    pen.setLineWidth(0)
    drawing.drawRect(self.SW / 2, self.SH / 4, self.SW, self.SH / 2)

    ' Floor
    pen.setFillColor(80, 70, 55)
    drawing.drawRect(self.SW / 2, self.SH * 3 / 4, self.SW, self.SH / 2)

    for col = 0 to self.RAYS - 1
        cameraX = (2.0 * col / self.RAYS) - 1.0
        rayDirX = self.dirX + self.planeX * cameraX
        rayDirY = self.dirY + self.planeY * cameraX

        mapX = math.floor(self.posX)
        mapY = math.floor(self.posY)

        if math.abs(rayDirX) < 0.0001 then
            deltaDistX = 1000000
        else
            deltaDistX = math.abs(1.0 / rayDirX)
        endif
        if math.abs(rayDirY) < 0.0001 then
            deltaDistY = 1000000
        else
            deltaDistY = math.abs(1.0 / rayDirY)
        endif

        if rayDirX < 0 then
            stepX = -1
            sideDistX = (self.posX - mapX) * deltaDistX
        else
            stepX = 1
            sideDistX = (mapX + 1.0 - self.posX) * deltaDistX
        endif

        if rayDirY < 0 then
            stepY = -1
            sideDistY = (self.posY - mapY) * deltaDistY
        else
            stepY = 1
            sideDistY = (mapY + 1.0 - self.posY) * deltaDistY
        endif

        hit = 0
        side = 0
        while hit = 0
            if sideDistX < sideDistY then
                sideDistX = sideDistX + deltaDistX
                mapX = mapX + stepX
                side = 0
            else
                sideDistY = sideDistY + deltaDistY
                mapY = mapY + stepY
                side = 1
            endif
            if mazegrid.getCell(mapX, mapY) > 0 then
                hit = 1
            endif
        endwhile

        if side = 0 then
            perpWallDist = sideDistX - deltaDistX
        else
            perpWallDist = sideDistY - deltaDistY
        endif

        if perpWallDist < 0.1 then
            perpWallDist = 0.1
        endif

        lineHeight = math.floor(self.SH / perpWallDist)

        if side = 0 then
            wallX = self.posY + perpWallDist * rayDirY
        else
            wallX = self.posX + perpWallDist * rayDirX
        endif
        wallX = wallX - math.floor(wallX)

        texX = math.floor(wallX * self.TEXW)
        if side = 0 and rayDirX > 0 then
            texX = self.TEXW - texX - 1
        endif
        if side = 1 and rayDirY < 0 then
            texX = self.TEXW - texX - 1
        endif

        self.zbuffer(col) = perpWallDist

        destX = col * self.STRIP + self.STRIP / 2
        drawing.drawImageStrip("wall.png", texX, destX, self.SCY, self.STRIP, lineHeight)
    next col
endfunction

function pickEnemySpawn()
  ' minDist used to be a flat 8 tiles, regardless of the current maze's
  ' actual size -- fine at level 13's 33x33, but at level 1's 9x9 (and
  ' every small early maze after it) 8 tiles is close to the whole map's
  ' diagonal, so almost every candidate cell failed the "far enough"
  ' check and the loop burned all 20 tries without ever finding one that
  ' passed, silently falling back to whatever candidate it last tried --
  ' which could easily still be right next to the player's spawn corner.
  ' Reported live as getting hit almost the instant a level starts.
  ' Scaling minDist off mazegrid.getMapW() (same pattern
  ' pickExitPosition() already uses for the exit, just a smaller
  ' fraction -- enemies only need to not be adjacent, not be a trek away
  ' like the exit) keeps the requirement satisfiable at every maze size.
  dim spawn
  dim ex
  dim ey
  dim tries
  dim minDist
  dim result(2)

  minDist = mazegrid.getMapW() * 0.35

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
  result(0) = ex
  result(1) = ey
  return result
endfunction

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

function projectEnemy(e as Enemy)
  dim spriteX
  dim spriteY
  dim invDet
  dim transformX
  dim transformY

  spriteX = e.getX() - self.posX
  spriteY = e.getY() - self.posY

  invDet = 1.0 / (self.planeX * self.dirY - self.dirX * self.planeY)
  transformX = invDet * (self.dirY * spriteX - self.dirX * spriteY)
  transformY = invDet * ((0 - self.planeY) * spriteX + self.planeX * spriteY)

  if transformY <= 0 then
    e.setProjection(-1, -1)
    return
  endif

  e.setProjection(math.floor((self.RAYS / 2) * (1.0 + transformX / transformY)), transformY)
endfunction

function drawEnemy(e as Enemy)
  ' spriteH is real screen pixels; drawLeft/drawRight/texCol below are in
  ' ray-column-index units (the same units e.screenX and the wall-casting
  ' loop's `col` use), and each column is STRIP (4) screen pixels wide.
  ' Using spriteH directly as a column-index delta made the enemy 4x too
  ' wide relative to its height at every distance -- confirmed by
  ' simulating this exact algorithm against the real enemy.png offline
  ' before touching this code. Dividing by STRIP converts the pixel-scale
  ' width into the matching column-index scale.
  dim spriteH
  dim spriteWCols
  dim drawLeft
  dim drawRight
  dim sc
  dim texCol
  dim destX

  if e.getTransformY() <= 0 then
    return
  endif

  spriteH = math.floor(self.SH / e.getTransformY())
  spriteWCols = spriteH / self.STRIP

  drawLeft = math.floor(e.getScreenX() - spriteWCols / 2)
  drawRight = math.floor(e.getScreenX() + spriteWCols / 2)

  for sc = drawLeft to drawRight - 1
    if sc >= 0 and sc < self.RAYS then
      if self.zbuffer(sc) > e.getTransformY() then
        texCol = math.floor((sc - drawLeft) * self.ENIW / spriteWCols)
        destX = sc * self.STRIP + self.STRIP / 2

        if e.isDead() then
          drawing.drawImageStrip("enemy_dead.png", texCol, destX, self.SCY, self.STRIP, spriteH)
        elseif e.isFlashing() then
          drawing.drawImageStrip("enemy_hit.png", texCol, destX, self.SCY, self.STRIP, spriteH)
        elseif e.isAttacking() then
          ' enemy_attack.png is a single still frame, not a multi-frame
          ' animation strip -- shown for the same brief 0.15s window as
          ' enemy_hit.png above (Enemy.attack()/isAttacking()), just for
          ' the enemy's own swing rather than its got-hit reaction. Takes
          ' priority over the plain idle sprite but not over isDead()/
          ' isFlashing() -- a dying or just-hit enemy shows that instead,
          ' even if it also happened to land a hit the same frame.
          drawing.drawImageStrip("enemy_attack.png", texCol, destX, self.SCY, self.STRIP, spriteH)
        else
          drawing.drawImageStrip("enemy.png", texCol, destX, self.SCY, self.STRIP, spriteH)
        endif
      endif
    endif
  next sc
endfunction

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
  dim margin
  dim arrowLen
  dim arrowHalfWidth
  dim arrowSpread

  margin = 40
  arrowLen = 15
  arrowHalfWidth = 10
  arrowSpread = 2.6

  angleToExit = math.atan2(self.exitY - self.posY, self.exitX - self.posX)
  playerAngle = math.atan2(self.dirY, self.dirX)
  ' Subtracting an extra quarter turn here makes relAngle = 0 (exit dead
  ' ahead) point straight UP on screen, not right. cos/sin(0) is (1, 0),
  ' which is "right" in screen space -- correct for measuring an angle,
  ' wrong for drawing a compass, where "dead ahead" should read as "up"
  ' (the same convention every compass/waypoint HUD uses). Confirmed live
  ' by forcing the exit due east of spawn (dead ahead, since the player
  ' always starts facing dirX=1/dirY=0): before this fix the arrow's
  ' pixels formed a wide, short cluster (23px x 11px) consistent with a
  ' sideways-pointing chevron; after it, the same setup produces a
  ' narrow, tall cluster pointing up instead.
  relAngle = angleToExit - playerAngle - (math.pi() / 2)

  ' Anchored to the ACTUAL canvas size, not self.SW/self.SH -- those are
  ' fixed 800x600 constants the raycasting math itself depends on, but
  ' the real game canvas is responsive (bootstrapper.html's PIXI
  ' Application uses resizeTo: window) and is not guaranteed to match
  ' them. A canvas smaller than 800x600 (as seen in the editor's Run
  ' panel) put this arrow's old self.SW-anchored position off the
  ' visible canvas entirely. stage.width()/height() match how
  ' weaponSprite already positions itself below, in real screen space.
  cx = stage.width() - margin
  cy = margin

  tipX = cx + math.cos(relAngle) * arrowLen
  tipY = cy + math.sin(relAngle) * arrowLen
  leftX = cx + math.cos(relAngle + arrowSpread) * arrowHalfWidth
  leftY = cy + math.sin(relAngle + arrowSpread) * arrowHalfWidth
  rightX = cx + math.cos(relAngle - arrowSpread) * arrowHalfWidth
  rightY = cy + math.sin(relAngle - arrowSpread) * arrowHalfWidth

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

function renderEnemies()
  dim i
  dim j
  dim order(20)
  dim tmp
  ' Reading a field straight off an EXTERNAL Enemy instance (whether via a
  ' self.<array>(idx) chain, a local `dim ... as Enemy`, or a typed function
  ' parameter) inside a comparison type-checks against the generic Object
  ' type instead of the field's real declared type and fails to compile
  ' ("Expected type(s) Number but got Object") -- confirmed live. A getter
  ' (Enemy.getTransformY()) resolves correctly because it reads the field
  ' from WITHIN its own class. See Enemy.bas's getters section for the full
  ' explanation and Dungeon Explorer's DungeonScene.bas onupdate comment for
  ' the same documented limitation elsewhere in this codebase.
  dim a as Enemy
  dim b as Enemy
  dim keepSorting

  for i = 0 to self.ENEMY_COUNT - 1
    self.projectEnemy(self.enemies(i))
  next i

  for i = 0 to self.ENEMY_COUNT - 1
    order(i) = i
  next i
  for i = 1 to self.ENEMY_COUNT - 1
    j = i
    keepSorting = true
    while j > 0 and keepSorting
      a = self.enemies(order(j - 1))
      b = self.enemies(order(j))
      if a.getTransformY() < b.getTransformY() then
        tmp = order(j - 1)
        order(j - 1) = order(j)
        order(j) = tmp
        j = j - 1
      else
        keepSorting = false
      endif
    endwhile
  next i

  for i = 0 to self.ENEMY_COUNT - 1
    self.drawEnemy(self.enemies(order(i)))
  next i
endfunction

function updateFlashCooldown()
    ' flashTimer now only gates fire rate (see handleInput) -- the visible
    ' flash itself is muzzleFlashEmitter's burst, fired once at the moment
    ' of the shot rather than redrawn every frame the cooldown is active.
    if self.flashTimer > 0 then
        self.flashTimer = self.flashTimer - 1
    endif
endfunction

function onenter()
    ' Derived from the ACTUAL canvas every time a run starts (fresh play or
    ' a restart after death), not fixed literals -- the game canvas is
    ' responsive (bootstrapper.html's PIXI Application uses resizeTo:
    ' window), so its real size depends on whatever the player's browser/
    ' preview panel happens to be, including a mid-session switch to
    ' fullscreen followed by hitting "try again". self.RAYS stays a fixed
    ' 200 (it's also the zbuffer(200) array's compile-time-literal size,
    ' which can't itself be a runtime expression), so STRIP -- the pixel
    ' width of one ray's screen column -- is the value derived from actual
    ' width instead, keeping RAYS columns spanning exactly self.SW either
    ' way. Without this, this raycasting math previously stayed pinned to
    ' a hardcoded 800x600 "design resolution" regardless of the real
    ' canvas size, while HUD elements positioned via stage.width()/
    ' height() (the weapon sprite, the compass) tracked the real canvas --
    ' the two would visibly drift apart on any canvas that wasn't exactly
    ' 800x600, most obviously when going fullscreen.
    self.SW = stage.width()
    self.SH = stage.height()
    self.SCY = self.SH / 2
    self.STRIP = self.SW / self.RAYS

    ' setupHud() runs on every onenter(), not just the first -- entering
    ' "game" is always a full scenemanager.switch() (the very first title
    ' screen -> game switch, and every restart from GameOverScene alike),
    ' and _sbScene._applySwitch() calls stage.clear() before onenter() ever
    ' runs, wiping both the world AND hud containers unconditionally. A
    ' one-time guard here (as this used to have) meant a restart after
    ' death re-entered onenter() with the guard already tripped, so
    ' setupHud() never ran again -- hud stayed empty (no gun, no health
    ' bar, no level text) for the rest of that browser session, even
    ' though everything had genuinely just been cleared out from under it.
    self.setupHud()

    ' playLoop() restarts the track from the beginning if it's already
    ' looping (see audio.md), so this genuinely does restart the music
    ' fresh on every run -- the very first level 1, and every retry after
    ' death alike -- rather than leaving a stale loop from a previous
    ' attempt playing under a freshly-constructed bgMusic instance.
    self.bgMusic.setVolume(self.BG_MUSIC_VOLUME)
    self.bgMusic.playLoop()

    self.playerHealth = 100
    self.damageCooldown = 0
    self.damageFlashTimer = 0
    self.zombieGroanCooldown = 0
    self.footstepTimer = 0
    ' setupHud() above (this call or an earlier one) always runs before this
    ' point, so self.damageFlash already exists here on every onenter().
    self.damageFlash.setAlpha(0)
    self.flashTimer = self.FIRE_COOLDOWN_FRAMES
    self.dirX = 1.0
    self.dirY = 0.0
    self.planeX = 0.0
    self.planeY = 0.66
    self.level = 1

    self.startLevel()
endfunction

function setupHud()
    ' Called fresh from onenter() every time the game scene is entered --
    ' the switch into "game" (first play, and every restart after death)
    ' always clears the hud container first (see onenter()'s comment), so
    ' these need recreating every time, not just once.
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

    self.levelHudText = new Text("Level 1", 20, 50)
    self.levelHudText.setStyle(12, 255, 255, 255)
    hud.add(self.levelHudText)

    ' damage_flash.png is an 8x8 solid red square -- setScale stretches it
    ' to cover the whole screen. Starts fully transparent; onupdate() drives
    ' its alpha up on a hit and back down as damageFlashTimer expires.
    self.damageFlash = new Sprite("damage_flash.png")
    self.damageFlash.transform.setPosition(stage.width() / 2, stage.height() / 2)
    self.damageFlash.setScale(stage.width() / 8, stage.height() / 8)
    self.damageFlash.setAlpha(0)
    hud.add(self.damageFlash)
    self.damageFlashTimer = 0

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

    ' Not a hud element -- audio.bas's Audio class has nothing to do with
    ' the display list, so it doesn't need hud.add() and isn't affected by
    ' stage.clear() on scene switch. Recreated here anyway just to match
    ' this function's own established "everything gets set up fresh on
    ' every onenter()" convention rather than carving out a special case.
    self.zombieGroan = new Audio("dragon-studio-zombie-sound-357975.mp3")
    self.footstepSound = new Audio("footstep_concrete_002.ogg")
    self.gunshotSound = new Audio("impactPlate_heavy_004.ogg")
    self.zombieDeathSound = new Audio("freesound_community-zombie-6851.mp3")
    self.bgMusic = new Audio("yd_Searching.ogg")
endfunction

function mazeSizeForLevel(lvl)
  ' Maze grids must be odd -- the recursive backtracker carves through
  ' even-coordinate walls between odd-coordinate logical cells (see
  ' MazeGrid.bas). Grows from 9x9 at level 1 by 2 real-grid units per
  ' level (1 logical cell), capping at 33x33 (16 logical cells, today's
  ' original fixed size) at level 13.
  return 2 * math.min(4 + (lvl - 1), 16) + 1
endfunction

function enemyCountForLevel(lvl)
  ' Grows from 4 at level 1 by 2 per level, capping at 20 by level 9 --
  ' past that point, more enemies stopped meaningfully adding to
  ' difficulty and mostly just meant more array bookkeeping.
  return math.min(4 + 2 * (lvl - 1), 20)
endfunction

function startLevel()
    ' Runs once at the start of every level (both the very first, from
    ' onenter(), and every subsequent one, from nextLevel() below) --
    ' regenerates the maze at this level's size, respawns the player and
    ' a fresh enemy roster sized for this level, and picks a new exit.
    dim mapSize
    dim i
    dim spawn

    mapSize = self.mazeSizeForLevel(self.level)
    mazegrid.generate(mapSize)
    self.posX = 1.5
    self.posY = 1.5

    self.ENEMY_COUNT = self.enemyCountForLevel(self.level)
    for i = 0 to self.ENEMY_COUNT - 1
      spawn = self.pickEnemySpawn()
      self.enemies(i) = new Enemy(spawn(0), spawn(1))
    next i

    self.pickExitPosition()
    self.levelHudText.setText("Level " + string.str(self.level))
endfunction

function nextLevel()
    self.level = self.level + 1
    self.startLevel()
endfunction

function onupdate(delta)
    dim i
    dim e as Enemy
    dim dist
    dim hpFillWidth
    dim nearestEnemyDist
    dim zombieGroanVolume
    dim isMoving

    if self.playerHealth < 1 then
        ' stage.clear() (triggered by the scenemanager.switch() below)
        ' wipes the hud/world display containers, but zombieGroan and
        ' bgMusic are PIXI.sound instances, not display objects --
        ' switching away from GameScene does nothing to them on its own,
        ' so without these explicit stop() calls both would keep right on
        ' playing over the game-over screen.
        self.zombieGroan.stop()
        self.bgMusic.stop()
        self.gameData.levelReached = self.level
        scenemanager.switch("gameover")
        return
    endif

    self.handleInput()

    ' Footsteps -- W/S/Q/E (walk or strafe) count as moving; A/D (turning
    ' in place) don't. Checked directly against the same key codes
    ' handleInput() itself checks, rather than having handleInput() report
    ' back whether it moved, since a blocked move (walking straight into a
    ' wall) should still sound like footsteps -- the player is still
    ' walking in place against it, not standing still.
    isMoving = input.getKeyDown(87) or input.getKeyDown(83) or input.getKeyDown(69) or input.getKeyDown(81)
    if self.footstepTimer > 0 then
      self.footstepTimer = self.footstepTimer - (delta / 1000)
    endif
    if isMoving and self.footstepTimer <= 0 then
      self.footstepSound.play()
      self.footstepTimer = self.FOOTSTEP_INTERVAL
    endif

    self.castRays()

    ' Starting above ZOMBIE_GROAN_CUTOFF guarantees "no living enemy found
    ' this frame" fails the cutoff check below on its own, without a
    ' separate found-anything flag.
    nearestEnemyDist = self.ZOMBIE_GROAN_CUTOFF + 1

    for i = 0 to self.ENEMY_COUNT - 1
      e = self.enemies(i)
      e.update(delta / 1000, self.posX, self.posY)
      if not e.dead then
        dist = math.distance(e.x, e.y, self.posX, self.posY)
        if dist < nearestEnemyDist then
          nearestEnemyDist = dist
        endif
        ' A single shared cooldown across every enemy, not one per enemy --
        ' with 10 enemies now able to be adjacent at once, a per-enemy
        ' cooldown would let each land its own hit independently and
        ' actually make a swarm MORE punishing, the opposite of the point.
        ' Enemy.stopDistance already keeps a chasing enemy from closing
        ' onto the player's exact position, so this now mostly fires when
        ' the player themselves closes the last bit of distance onto a
        ' waiting enemy, not automatically the instant one catches up.
        if dist < 0.8 and self.damageCooldown = 0 then
          self.playerHealth = self.playerHealth - 10
          self.damageCooldown = 90
          self.damageFlashTimer = 18
          e.attack()
        endif
      endif
    next i
    if self.damageCooldown > 0 then
      self.damageCooldown = self.damageCooldown - 1
    endif

    if self.damageFlashTimer > 0 then
      self.damageFlashTimer = self.damageFlashTimer - 1
      self.damageFlash.setAlpha(0.35 * self.damageFlashTimer / 18)
    endif

    ' Zombie groan -- one shared channel (see the field declaration
    ' comment for why), tracking whichever living enemy is currently
    ' closest rather than any one enemy in particular. It's deliberately
    ' NOT a true engine loop (playLoop()) -- a groan sound isn't built to
    ' repeat seamlessly, so instead this replays it as a one-shot,
    ' ZOMBIE_GROAN_COOLDOWN seconds of actual SILENCE apart, for as long
    ' as an enemy stays in range. Retreating out of range just stops it
    ' from retriggering -- the current one-shot is left to finish
    ' naturally rather than being cut off abruptly.
    '
    ' zombieGroanCooldown only ticks down while the clip is NOT playing --
    ' it's frozen at ZOMBIE_GROAN_COOLDOWN for the clip's entire ~8s
    ' runtime, then counts down from there once it actually ends. Ticking
    ' it down unconditionally (from the moment play() was called) was the
    ' original bug: with a 2s cooldown and an ~8s clip, the cooldown had
    ' already run out well before the clip finished, so isPlaying() alone
    ' gated the replay and a new groan started the INSTANT the last one
    ' ended -- zero silence, reported live as sounding constant.
    if not self.zombieGroan.isPlaying() and self.zombieGroanCooldown > 0 then
      self.zombieGroanCooldown = self.zombieGroanCooldown - (delta / 1000)
    endif
    if nearestEnemyDist <= self.ZOMBIE_GROAN_CUTOFF then
      ' Squared, not linear, falloff -- a linear drop from 1.0 to 0.0
      ' read as "everything sounds close" (human loudness perception is
      ' closer to logarithmic than linear, so a merely-linear volume
      ' value stays subjectively loud for most of the range), and
      ' ZOMBIE_GROAN_MAX_VOLUME caps the peak (right on top of the
      ' player) well under full volume rather than assuming distance
      ' alone should carry all the attenuation.
      zombieGroanVolume = self.ZOMBIE_GROAN_MAX_VOLUME * math.pow(1.0 - (nearestEnemyDist / self.ZOMBIE_GROAN_CUTOFF), 2)
      self.zombieGroan.setVolume(zombieGroanVolume)
      ' `not X and Y`, not `Y and not X` -- this language's grammar only
      ' accepts a leading `not` at the very start of a boolean expression
      ' (BoolExpressionRule calls the Not rule once, up front, before its
      ' and/or loop; and/or's own right-hand side parses as a plain
      ' BoolTerm that never routes back through Not), so `not` can't
      ' appear after `and`/`or` -- confirmed live via the exact compile
      ' error this line originally hit ("Expected String, Number,
      ' Variable but found not") before reordering it.
      if not self.zombieGroan.isPlaying() and self.zombieGroanCooldown <= 0 then
        self.zombieGroan.play()
        self.zombieGroanCooldown = self.ZOMBIE_GROAN_COOLDOWN
      endif
    endif

    self.renderEnemies()
    self.projectExit()
    self.drawExit()
    self.drawCompass()

    if math.distance(self.posX, self.posY, self.exitX, self.exitY) < 1.0 then
      self.nextLevel()
      ' Skips the HP bar update below for this one frame -- harmless,
      ' since playerHealth is untouched by a level transition, so the bar
      ' just keeps showing last frame's (still-correct) width.
      return
    endif

    hpFillWidth = 100 * (self.playerHealth / 100)
    if hpFillWidth < 0 then
      hpFillWidth = 0
    endif
    self.hpFill.transform.setPosition(20 + hpFillWidth / 2, 27)
    self.hpFill.setScale(hpFillWidth, 14)

    self.updateFlashCooldown()
endfunction

EndClass
```

## Main.bas

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

## MazeGrid.bas

A plain module (no `Class`) — logic shared by `GameScene` and `Enemy`.

```bas
' demo-src/raycaster/MazeGrid.bas
'
' A plain module (no Class) -- both GameScene and Enemy depend on this
' for grid state and wall lookups, rather than each keeping their own
' copy. generate() builds a "perfect maze" (a randomized recursive
' backtracker): exactly one path between any two open cells, fully
' connected, so every spawn point chosen from an open cell is guaranteed
' reachable from every other.
dim mapW = 33
dim mapH = 33
dim cells(1089)

function getCell(mx, my)
  if mx < 0 or mx >= mapW or my < 0 or my >= mapH then
    return 1
  endif
  return cells(my * mapW + mx)
endfunction

function setCell(mx, my, value)
  cells(my * mapW + mx) = value
endfunction

function isOpen(mx, my)
  return getCell(mx, my) = 0
endfunction

function generate(size)
  dim i
  dim cx
  dim cy
  dim nx
  dim ny

  mapW = size
  mapH = size
  ' Sized for a 16x16 logical-cell maze (mapW/mapH = 33 = 2*16 + 1) -- the
  ' backtracker's stack depth is bounded by the total logical cell count,
  ' so 256 is exactly enough here. If mapW/mapH ever change, this needs to
  ' grow to match: ((mapW - 1) / 2) * ((mapH - 1) / 2).
  dim stackX(256)
  dim stackY(256)
  dim stackTop
  ' 0=up 1=down 2=left 3=right -- established here, consumed by the two
  ' matching if-chains below (candidate collection, then carving).
  dim dirs(4)
  dim dirCount
  dim d

  for i = 0 to (mapW * mapH) - 1
    cells(i) = 1
  next i

  cx = 1
  cy = 1
  setCell(cx, cy, 0)
  stackTop = 0
  stackX(stackTop) = cx
  stackY(stackTop) = cy

  while stackTop >= 0
    cx = stackX(stackTop)
    cy = stackY(stackTop)

    dirCount = 0
    if cy - 2 > 0 then
      if getCell(cx, cy - 2) = 1 then
        dirs(dirCount) = 0
        dirCount = dirCount + 1
      endif
    endif
    if cy + 2 < mapH - 1 then
      if getCell(cx, cy + 2) = 1 then
        dirs(dirCount) = 1
        dirCount = dirCount + 1
      endif
    endif
    if cx - 2 > 0 then
      if getCell(cx - 2, cy) = 1 then
        dirs(dirCount) = 2
        dirCount = dirCount + 1
      endif
    endif
    if cx + 2 < mapW - 1 then
      if getCell(cx + 2, cy) = 1 then
        dirs(dirCount) = 3
        dirCount = dirCount + 1
      endif
    endif

    if dirCount = 0 then
      stackTop = stackTop - 1
    else
      d = dirs(math.randomint(dirCount))
      if d = 0 then
        ny = cy - 2
        nx = cx
        setCell(cx, cy - 1, 0)
        setCell(nx, ny, 0)
      endif
      if d = 1 then
        ny = cy + 2
        nx = cx
        setCell(cx, cy + 1, 0)
        setCell(nx, ny, 0)
      endif
      if d = 2 then
        nx = cx - 2
        ny = cy
        setCell(cx - 1, cy, 0)
        setCell(nx, ny, 0)
      endif
      if d = 3 then
        nx = cx + 2
        ny = cy
        setCell(cx + 1, cy, 0)
        setCell(nx, ny, 0)
      endif
      stackTop = stackTop + 1
      stackX(stackTop) = nx
      stackY(stackTop) = ny
    endif
  endwhile
endfunction

function randomOpenCell()
  ' Returns a 2-element array [x, y] of a random OPEN cell. Only ever
  ' samples odd (logical-cell) coordinates, since those are exactly the
  ' cells generate() guarantees are open and connected -- the even
  ' "wall" coordinates between them are open only where a corridor was
  ' carved through, not guaranteed open everywhere.
  dim result(2)
  dim x
  dim y
  x = 1 + math.randomint((mapW - 2) / 2) * 2
  y = 1 + math.randomint((mapH - 2) / 2) * 2
  while getCell(x, y) <> 0
    x = 1 + math.randomint((mapW - 2) / 2) * 2
    y = 1 + math.randomint((mapH - 2) / 2) * 2
  endwhile
  result(0) = x
  result(1) = y
  return result
endfunction

function getMapW()
  return mapW
endfunction

function getMapH()
  return mapH
endfunction
```

## TitleScene.bas

```bas
Class
Extends scene

dim titleText as Text
dim controlsText as Text
dim promptText as Text

Constructor()
EndConstructor

function onenter()
  world.setBackground(0, 0, 0)

  self.titleText = new Text("RAYCASTER", stage.width() / 2 - 140, stage.height() / 2 - 100)
  self.titleText.setStyle(48, 255, 220, 120)
  hud.add(self.titleText)

  self.controlsText = new Text("WASD to move   Q/E to strafe   Space to fire", stage.width() / 2 - 220, stage.height() / 2)
  self.controlsText.setStyle(20, 255, 255, 255)
  hud.add(self.controlsText)

  self.promptText = new Text("Press any key to start", stage.width() / 2 - 110, stage.height() / 2 + 60)
  self.promptText.setStyle(18, 200, 200, 200)
  hud.add(self.promptText)
endfunction

function onkeydown(keyCode)
  scenemanager.switch("game")
endfunction

EndClass
```

---

## Key techniques

### The maze

`MazeGrid.bas` is a plain module, not a `Class` — both `GameScene` and `Enemy` need grid state and wall lookups, so it's shared rather than duplicated. `generate(size)` sets `mapW`/`mapH` to `size` and runs a randomized recursive backtracker over that `size`×`size` cell grid (odd coordinates are the logical cells; even coordinates are the walls/passages between them), producing a fully-connected "perfect maze" fresh every level, sized by `GameScene.mazeSizeForLevel()` — from 9×9 at level 1 up to 33×33 (16×16 logical cells, today's original fixed size) once a run reaches level 13. `randomOpenCell()` samples only odd coordinates, since those are exactly the cells `generate()` guarantees are open and reachable.

### Movement and strafing

`handleInput` moves the player two ways: **W/S** walk forward/backward along the facing vector (`dirX`/`dirY`); **Q/E** strafe sideways instead, without turning. The strafe vector is `dirX`/`dirY` rotated 90 degrees — `(-dirY, dirX)` for E, `(dirY, -dirX)` for Q — which is the same direction the camera plane (`planeX`/`planeY`) already points (confirmed from the initial `dir = (1, 0)` / `plane = (0, 0.66)` values, where `plane` is `dir` rotated +90 and scaled), so E strafes toward the same side of the screen the plane vector represents. **A/D** are turning, not strafing: they rotate both `dirX`/`dirY` and `planeX`/`planeY` by `rotSpeed` using a standard 2D rotation matrix.

All four movement directions go through `tryMovePlayer(nx, ny)`, which mirrors `Enemy.tryMove()`'s own `wallMargin` (see "Enemy AI" below for the fuller reasoning): it checks a point `wallMargin` (0.2 tiles) further along than the actual destination, in whichever direction that axis is moving, rather than the bare destination cell `posX`/`posY` could otherwise walk right up to. The player has no rendered billboard of its own to keep clear of a wall the way an enemy does — the visible symptom here was a wall's near edge appearing to visually clip into view at a glancing angle right at a wall's boundary — so its margin is smaller than the enemies' 0.3.

### DDA raycasting

`castRays` loops over 200 ray columns. For each column it:

1. Calculates a ray direction by blending the player's facing direction with the camera plane.
2. Steps through the maze grid using DDA until it hits a wall.
3. Computes the **perpendicular wall distance** — not the straight-line distance — to avoid the fisheye effect.
4. Derives how tall to draw that wall strip (`lineHeight = SH / distance`).
5. Picks the correct texture column from `wall.png` using `drawing.drawImageStrip`.
6. Stores the distance in `zbuffer(col)` for use by the enemy and exit renderers.

### Enemy billboards

`projectEnemy` projects an enemy's world position onto the screen using the same camera-space transform the raycaster itself relies on, storing the result back onto the enemy via `setProjection()`. `drawEnemy` then draws that enemy column by column, but only for columns where the z-buffer says the wall is *farther away* than the enemy — this is what stops an enemy from appearing through walls. `renderEnemies` projects and depth-sorts every enemy in the current level's roster (farthest first) before drawing them, so a closer enemy correctly overlaps one standing behind it. `drawEnemy`'s billboard width is converted from screen pixels to ray-column units via `STRIP` to fix a 4x stretch bug (see "How it works"). The exit's own `projectExit`/`drawExit` reuse this exact same billboard math for a single object instead of an array (see "How it works").

### Hit detection

Firing (spacebar) calls `checkHit`, which scans every enemy in the current level's roster and picks the closest one that qualifies. A shot registers against a given enemy if:
- It's alive and facing the camera (`getTransformY() > 0`).
- The centre ray column is within `aimTolerance` columns of its `getScreenX()`.
- The z-buffer at the centre column is deeper than the enemy (it isn't hidden behind a wall).

`aimTolerance` used to be a flat 15 columns regardless of how big the enemy actually looks on screen — fine at typical mid-range distances, but unfairly finicky up close: a nearby enemy's billboard can span far more than 30 columns (the same `spriteWCols` `drawEnemy` computes for its own width), yet a shot landing well inside that visible width, just more than 15 columns off dead centre, still missed. `aimTolerance` is now `math.max(spriteWCols / 2, 8)` computed per enemy — half its actual rendered width, so "the crosshair is visually over the enemy" and "it counts as aimed at" agree with each other at any distance, with `math.max`'s `8` floor keeping a distant, narrow enemy from becoming impossibly precise to hit as `spriteWCols` shrinks toward zero.

Each hit does 1 damage; an enemy has 3 hit points, so it takes 3 hits to kill. Landing a hit briefly shows `enemy_hit.png` (`Enemy.hitFlashTimer`/`isFlashing()`); the enemy itself does the mirror-image thing back at the player — see "Enemy AI" below.

### Enemy AI

Each `Enemy` patrols a randomly-chosen nearby open cell (`pickPatrolTarget`), picked within a small radius rather than maze-wide so the straight-line walk in `tryMove` actually reaches it without full pathfinding. When the player comes within `chaseRadius` (6 tiles) it switches to chasing, giving up back to patrol once the player is more than `giveUpRadius` (9 tiles) away. Movement steps straight toward the current target and checks each axis separately for wall collisions (`tryMove`) — the same wall-sliding trick used for player movement — rather than using the engine's real `pathfinding` module, which needs a genuine `TileMapSet` this demo (having no visual tilemap at all) doesn't have.

`tryMove`'s wall check tests a point `wallMargin` (0.3 tiles) further along than the actual destination, in whichever direction that axis is moving, rather than the bare destination cell. An enemy is drawn as a wide billboard (see "Enemy billboards" above), not a single point — letting its centre walk right up to a wall cell's edge (the original behaviour) let its rendered width visibly overlap the neighbouring wall texture, reported as enemies appearing to clip through walls. `wallMargin` only affects the axis/direction actually being tested, so it doesn't change how close an enemy can get to a wall it *isn't* currently moving toward, and normal corridor navigation is unaffected as long as it stays well under half a tile (this maze's corridors are always exactly 1 tile wide).

The instant an enemy lands its own melee hit on the player, `GameScene.onupdate()` calls `Enemy.attack()`, which briefly shows `enemy_attack.png` (`attackFlashTimer`/`isAttacking()`) the same way `hit()` shows `enemy_hit.png` for the enemy's own got-hit reaction — a single still frame, not a multi-frame animation strip. In `drawEnemy`, `isAttacking()` is checked after `isDead()`/`isFlashing()`, so a dying or just-hit enemy still shows that instead, even if it also happened to land a hit the same frame.

### Level progression, the exit, and the compass

`GameScene.onenter()` derives `SW`/`SH`/`SCY`/`STRIP` from the real canvas (`stage.width()`/`stage.height()`) at the start of every run, so the raycast, the gun, and the compass all agree on the same canvas size — see "The raycast now matches the real canvas size" above for why that wasn't always true. `startLevel()` regenerates the maze, respawns the enemy roster, repositions the exit, and updates the HUD's level text at the start of every level — level 1 from `onenter()`, every level after from `nextLevel()`, triggered by `onupdate()` noticing the player is within 1 tile of `exitX`/`exitY`. `mazeSizeForLevel()` and `enemyCountForLevel()` both scale with `level` and both cap (33×33/16 logical cells by level 13, 20 enemies by level 9). The exit itself is a code-drawn billboard (`projectExit`/`drawExit`, no image asset), and a HUD compass (`drawCompass`, two `drawing.drawLine` calls forming a hand-rotated chevron) always points toward it. Taking damage briefly fades in a full-screen red `Sprite` (`damageFlash`) via a frame-counter timer, the same convention `flashTimer`/`damageCooldown` already use in this file. Player health is never reset between levels — only a real death (`playerHealth < 1`) ends a run. See "How it works" above for the full formulas, the `drawLine` offset gotcha, the responsive-canvas fix, and the `GameOverScene`/`GameData`/persisted-best-level flow.

### HUD layering

The weapon sprite, the health bar (background, fill, and label), and all three particle emitters are added to `hud`, not `world`. This keeps them always on top of the 3D view, which is drawn each frame via `drawing.drawImageStrip` into the world layer.

For the emitters specifically, this isn't just a visual preference — it's required. `castRays` calls `drawing.clear()` and redraws the ceiling, floor, and every wall strip into the world container from scratch every single frame. Anything added to `world` (the normal place an `Emitter` goes in the other particle-enabled demos) would get painted over the instant the next frame's walls went up, since the freshly-redrawn strips are added after it every time. `hud` is a separate container that always renders on top of `world` regardless of what's redrawn there, which is also why the gun sprite and health bar stay visible — routing the emitters through it sidesteps the redraw entirely. There's no `camera` anywhere in this demo, so `hud`, `world`, and screen coordinates are all the same thing here, unlike in a scrolling demo where they'd diverge.

### Muzzle flash and hit particles

Three `Emitter`s are set up in `setupHud()` (called fresh on every `onenter()` — see "Death, `GameOverScene`, and the persisted best level" above for why that's every restart, not just the first): `muzzleFlashEmitter`, `enemyHitEmitter`, and `enemyDeathEmitter`. `muzzleFlashEmitter.burst(18)` fires once, at the moment of the shot, positioned relative to `weaponSprite.transform` rather than an independent hardcoded screen coordinate. `Sprite` is centre-anchored, so `weaponSprite.transform.x()`/`y()` reports the centre of the underlying 256×256 `gun.png` — the muzzle opening sits at roughly (122, 36) from that image's top-left, found by locating the dark pixel cluster at the tip of the barrel, which converts to `muzzleOffsetX`/`muzzleOffsetY` of (-6, -92) from the image's centre. Tying the flash to the gun's own transform means the two can't drift out of sync if the gun's position ever changes.

`checkHit`'s hit and death bursts need a screen position, not a world one, since this demo has no camera to convert one into the other. An enemy's `getScreenX()` is a ray/column index (0 to `RAYS`), not a pixel — converting it with the same `getScreenX() * STRIP + STRIP / 2` expression `castRays`/`drawEnemy` already use for their own `destX` puts the burst exactly where the enemy sprite is actually drawn. `SCY`, the fixed vertical anchor every wall and enemy strip is centred on (there's no vertical look in this demo), is the correct burst height for the same reason.

### Getter/setter workaround for cross-instance field access

`Enemy.bas`'s `isDead()`/`getX()`/`getY()`/`getScreenX()`/`getTransformY()`/`isFlashing()`/`isAttacking()`/`setProjection()` methods work around a compiler type-inference limitation on external class-typed field reads, per Dungeon Explorer's `Boss.isDead()` precedent (see "How it works"). `GameScene`'s own `exitX`/`exitY`/`exitScreenX`/`exitTransformY` fields don't need this treatment — they're plain `self.*` fields read from within `GameScene` itself, never stored in an array or passed around as a typed parameter, so they never hit the external-instance case the workaround exists for.
