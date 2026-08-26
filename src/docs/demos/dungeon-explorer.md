# Dungeon Explorer

A room-by-room dungeon crawl: fight through two branches of enemies, find the key, and defeat the boss guarding the treasure room.

---

## How it works

The whole dungeon is one tilemap, but `DungeonScene` treats it as discrete rooms rather than one continuously-scrolling level: `onupdate()` divides the player's world position by the room size (240×176, i.e. 15×11 tiles at 16px) to get a room coordinate, and whenever that coordinate changes, `camera.setPosition(roomX * 240, roomY * 176)` hard-cuts the view to the new room — classic-adventure-game style, instead of scrolling continuously.

The boss room's door is two tiles (row 11, columns 36-37 in `dungeon.stm`) that both look *and* behave solid until the player has the key. `DungeonScene.onupdate()` runs `openBossDoor()` once, right when the key pickup is collected — not every frame — since it does two things at once: `wallsLayer.setTile(576, 176, 23)` / `setTile(592, 176, 24)` swaps the closed-door tile art (ids 47/48) for the open-door art (23/24) on the `"walls"` layer via `tilemaplayer.setTile`, and `collision.setTileSolid(576, 176, false)` / `(592, 176, false)` clears the matching collision cells so the player can actually walk through. `setTile` only changes what's drawn, not collision — the two calls are deliberately paired, one for each half of "the door is now open." The door tiles live on `"walls"`, not `"floor"` — an earlier version painted them on `"floor"` while leaving a solid wall tile in place on `"walls"` directly on top, which looked fine in the Tile Map Editor (a non-active layer renders at 35% opacity there, so the door art showed faintly through) but was completely hidden in the actual game, where every layer draws at full opacity in file order and `"walls"` draws over `"floor"`. Painting the door tiles onto `"walls"` itself removes the overlap rather than working around it. The tilemap's collision layer, painted in the Tilemap Editor, is only the *starting* state — not a fixed layout.

The player moves with `setVelocity` (sliding cleanly along walls via `collision.setupTileCollision`, no hand-rolled axis checks) and attacks with a 360° spin — `Player.checkSwingHits()` checks a hit box centred directly *on* the player against every living enemy and the boss with `collision.boxCollide`, no facing direction involved. It wasn't always centred: an earlier version offset the hit box 20px out in the facing direction, which left a real dead zone close to the player — an enemy standing right next to the player (well within the range where *it* can already hit back) fell outside that offset band and took zero damage no matter how many swings landed, confirmed by sweeping actual distances against a real chasing enemy. A directional offset never made sense for a full 360° spin anyway; centering the box on the player fixed the dead zone and matches the visual. `Enemy`/`Boss` positions can be fed straight into `boxCollide` with no correction — both extend `sprite`, which (like the player's `animatedsprite`) is centre-anchored, so `transform.x()`/`y()` already reports each target's centre.

The player's own attack box is 44×44 (±22px from its centre); the box checked against the boss matches its real 32×32 size (±16px), giving a combined reach of 38px. Regular enemies are checked against a 28×28 box, padded well past their real 16×16 size (±8px) — without the padding their reach would only be 30px, and since a target's own half-size is what it contributes to the combined reach, the bigger boss would end up feeling generous purely because it's a bigger target, while small enemies felt tight for the same reason in reverse. Padding brings enemies to a 36px reach, close to parity with the boss.

More fundamentally, the hit check no longer runs once, at the instant the attack button is pressed — `Player.onupdate()` calls `checkSwingHits()` every frame for as long as `attackCooldown > 0` (the whole 0.4s swing), not just on the frame `tryAttack()` fires. Every hit-detection complaint this attack went through traced back to some variant of the same problem: something had to be in exactly the right place on exactly the one frame the check ran, whether that was a facing-offset box that missed anything close, a correctly-sized box checked against a player who couldn't get back into range after a knockback, or a swing that looked like it got cancelled because its visible pose ended right when the movement lock did. Checking continuously fixes the whole class at once: a target that wanders into the box at any point during the swing gets hit, not only one that already happened to be there the instant the button went down — much closer to how a swinging sword actually behaves, and no longer dependent on split-second timing. A `swingId` counter on `Player`, bumped once per swing in `tryAttack()`, stops one swing from hitting the same target on more than one of the ~24 frames it's checked over — `Enemy.hit(damage, swingId)`/`Boss.hit(damage, swingId)` only apply damage the first time a given `swingId` reaches them, tracked in each target's own `lastHitSwingId`.

The attack is also a little flourish: `Player.onupdate()` spins the player a full 360° over the whole 0.4s `attackCooldown` window by setting `self.setAngle((0.4 - self.attackCooldown) / 0.4 * 360)` directly each frame, and a separate `Sword` sprite (invisible the rest of the time) attaches to the player via `attachTo`, so it's carried around by the player's own spin. This wasn't always hand-rolled — an earlier version used `tween.play()` for the rotation, which pinned the player's position to a fixed keyframe value for the tween's whole duration (`tween` writes every channel, position included, unconditionally each frame — there's no way to tween just the angle). That made attacking a real "can't move while swinging" lock; a first attempt shortened the lock to 0.15s (independent of the 0.4s cooldown) so the player wasn't frozen the *entire* cooldown window, which fixed a boss-chase problem — a fully-locked player couldn't close distance on a boss that had just been knocked back out of range — but then made the attack pose feel like it was getting cut off by movement input, since the visual pose and the lock both ended together well before the cooldown did. Driving rotation directly with `setAngle` instead of `tween` sidesteps the tradeoff entirely: `setVelocity` already runs unconditionally every frame, so with nothing else fighting it for control of position, attacking costs no mobility at all, and the spin can run the full, satisfying 0.4s without needing to lock anything.

`Sword.swing(player, facingX, facingY, duration)` calls `attachTo(player)` and sets a fixed local position/angle held out to the player's side, derived from the player's current facing direction rather than hardcoded — an earlier version fixed the offset at a single tuned pose (matching only the "facing right" case), which visually pointed the sword somewhere unrelated to the real hit box (`Player.tryAttack()`'s `facingX`/`facingY * 20`) for every other facing direction; combat still worked mechanically in all directions the whole time, but it *looked* broken in three of the four. The sword's own angle is never animated — an earlier version additionally tweened it 0° to 360° on the assumption the sword's own rotation was what produced the sweep-around-the-player effect; it wasn't. Since the sword is attached and its local position is offset (not `(0, 0)`), the *player's* own spin alone carries it around in a circle — animating the sword's own rotation on top composed additively with the player's (PIXI sums a child's rotation with its parent's), making it complete two full orbits per one player spin, confirmed by sampling its world position frame-by-frame rather than assumed. Leaving the sword's own angle fixed, position derived from facing, both bugs fixed together.

`Sword.onupdate()` counts down its own `swingTimer`, set from the `duration` passed into `swing()`, to know when to hide itself and `detach()` — it used to watch `tween.isPlaying(player)` instead, back when the player's spin was itself tween-driven; once that moved to `setAngle`, there was no tween state left to poll, so the sword tracks its own clock, kept in sync with the player's spin by always being handed the same duration the caller used.

Regular enemies aren't always aggressive: each one patrols a short back-and-forth leg near its spawn point until the player comes within `chaseRadius` (70px), at which point it switches to chasing via `pathfinding.navigateTo`, giving up and returning to patrol if the player gets more than `giveUpRadius` (110px) away again. Once within `attackRange` (18px) of the player, an enemy stops and telegraphs its attack instead of dealing contact damage instantly: a `tween` scale pulse (1x → 1.4x → 1x over 0.35s) while standing still, checking fresh whether the player is still in range only once the pulse finishes — back away during the puff-up and the hit never lands. Landing a hit *on* an enemy also knocks it back briefly (a short `setVelocity` shove away from the player) and flashes it — a plain `hitFlashTimer` toggling `setAlpha` between 1 and 0.3 every 0.06s, driven by hand in `onupdate()` rather than by `tween`. `tween` writes position every frame it's active, and a hit is exactly the moment this same object is also being knocked back via `setVelocity` — a tween-driven flash here would freeze that knockback solid for the flash's duration, the same conflict this attack's hit detection already ran into twice with the player's own movement (see above). The player already flashes the same way on taking damage — a `flickerTimer` toggling its own alpha for the duration of its post-hit invincibility — so enemies and the boss now match it using the identical technique. The boss never patrols — it's a full-time chase — but its lunge gets the same telegraph treatment as regular enemies now: `attackTimer` counts down to trigger a 0.3s windup (the same scale-pulse-while-standing-still pattern), *then* a 0.6s lunge at 3.5x its base speed. A successful hit on the boss also knocks it back and cancels an in-progress windup outright, mirroring `Enemy.hit()`. Standing still to land a spin attack right next to the boss is still a real risk — its contact damage doesn't stop just because it's mid-chase — just no longer an *unwarned* one. Losing all 3 hearts switches to `GameOverScene`; defeating the boss switches straight to `WinScene`.

Enemies and the key are placed visually in the Tilemap Editor as tagged markers, not hardcoded — `DungeonScene.onenter()` calls `levelhelpers.enemiesFromMarkers(tm, "enemy", p)` to spawn every enemy from `"enemy"`-tagged markers, and reads the single `"key"`-tagged marker and `"boss"`-tagged marker directly via `tm.markersByTag(...)`. Key pickup is overlap-based: `onupdate()` checks `collision.spriteCollide(self.player, self.keyPickup)` each frame and, on contact, calls `self.keyPickup.collect()` and `self.player.setHasKey(true)`.

Combat and pickups get particle feedback via a small shared-emitter module, `Particles.bas` (the same pattern as Coins Platformer's and Bullet Hell Shooter's own particle integration): every landed hit fires a small `burstHitSpark`, a dying enemy adds a `burstEnemyDeath` poof, the boss's death fires a bigger `burstBossDeath`, and collecting the key fires `burstKeySparkle`. The boss-death burst needed one extra step beyond just calling it from `Boss.hit()`: `Boss.hit()` used to call `scenemanager.switch("winscene")` directly the instant hp hit 0, which would clear the world the same frame — before that burst ever rendered a single frame, the exact "particle destroyed before it renders" gotcha Coins Platformer's `burstLevelComplete`/`finishTimer` already went through. The fix is the same: `Boss.hit()` now only bursts the particles and removes the boss from the world; `DungeonScene.onupdate()` polls `self.boss.isDead()` and waits 0.6s (a `winTimer`, mirroring `finishTimer`) before actually switching, giving the burst time to show. That poll uses a real getter, `Boss.isDead()`, rather than a bare `self.boss.dead` field read — member-field type inference through a class-typed field (`self.boss` is `dim boss as boss`) doesn't resolve the field's real type, so a strict type check on that read (a plain `if`, or an `and`) rejects it as "Expected type(s) Boolean... but got Object," confirmed live. Every *existing* `self.boss.dead` read in this demo (e.g. `Player.checkSwingHits`) happens to sit under a bare `not`, which performs no type check at all, so the gap stayed silent until this scene's own boss-death handling needed a real conditional.

**Key techniques:** `sprite.setAngle` + `sprite.attachTo`/`detach` for the spin-and-swing melee attack, `tween.play`/`Keyframe` for telegraphing enemy/boss attacks with a scale pulse, `tilemaplayer.setTile` + `collision.setTileSolid`/`isTileSolid` for a runtime-unlockable door (visual and collision, changed together), `camera.setPosition` for discrete room-snap transitions instead of continuous scrolling, `sprite.setVelocity` + `collision.setupTileCollision` for kinematic movement, `tileMapSet.markersByTag` for visually-placed enemies/key/boss, `pathfinding.navigateTo` for chase AI, particle effects via a shared `Emitter` module.

---

## Required assets

| Filename | What it is |
|---|---|
| `player.png` | Kenney sprite, 16×16 per frame, 4 frames horizontal (64×16 total) — all 4 frames identical (Tiny Dungeon's characters are single-pose, no walk cycle) |
| `enemy.png` | Kenney sprite, 16×16, single frame |
| `boss.png` | Kenney sprite scaled 2x, 32×32, single frame |
| `key.png` | Kenney sprite (gem/amulet icon, standing in for a literal key), 16×16, single frame |
| `heart_full.png` | Kenney sprite (potion icon, standing in for a heart), 16×16, single frame — HUD icon, filled |
| `heart_empty.png` | Same Kenney sprite as `heart_full.png`, desaturated and dimmed — HUD icon, empty |
| `sword.png` | Kenney sprite, 16×16, single frame — the separate swinging-sword sprite used only during the attack |
| `tilesheet.png` | Kenney tileset ("Tiny Dungeon") used for the dungeon's floor/wall tiles |
| `dungeon.stm` | Tilemap data with `floor`/`walls` tile layers, a `collision` layer, and `enemy`/`key`/`boss` marker layers |
| `particle.png` | Small square sprite used by every `Emitter` in `Particles.bas` — hit sparks, enemy/boss death bursts, and the key pickup sparkle |

---

## Controls

| Key | Action |
|---|---|
| W / A / S / D | Move |
| J | Attack |

---

## Boss.bas

```bas
Class
Extends sprite

dim hp
dim dead
dim chaseTarget as sprite
dim damageCooldown
dim baseSpeed
dim lungeSpeed
dim attackTimer
dim lungeTimer
dim windupTimer
dim knockbackTimer
dim knockbackX
dim knockbackY
dim lastHitSwingId
dim hitFlashTimer
dim hitFlashTickTimer
dim hitFlashOn

Constructor(x, y, targetRef as sprite)
  super("boss.png")
  self.transform.setPosition(x, y)
  self.hp = 120
  self.dead = false
  self.chaseTarget = targetRef
  self.damageCooldown = 0
  self.baseSpeed = 40
  self.lungeSpeed = 140
  self.attackTimer = 2.5
  self.lungeTimer = 0
  self.windupTimer = 0
  self.knockbackTimer = 0
  self.knockbackX = 0
  self.knockbackY = 0
  self.lastHitSwingId = -1
  self.hitFlashTimer = 0
  self.hitFlashTickTimer = 0
  self.hitFlashOn = false
EndConstructor

function isDead()
  ' A getter, not a bare `self.boss.dead` field read from DungeonScene --
  ' member-field type inference through a class-typed field (self.boss is
  ' `dim boss as boss`) doesn't resolve, so any *strict* type check on the
  ' read comes back "Expected type(s) Boolean... but got Object" (confirmed
  ' live). `not self.boss.dead` alone never surfaced this because NotNode
  ' has no validate() at all, unlike a plain `if` condition or an `and`.
  ' A method's declared return type inference works correctly where the
  ' equivalent field access doesn't, same as self.player.getHearts() below.
  return self.dead
endfunction

function beginWindup()
  ' Same telegraph pattern as the regular enemies' attack windup: pulse
  ' scale over 0.3s, standing still, before the actual lunge fires. The
  ' boss previously had zero warning before a 4x-speed lunge -- unfair
  ' by the standard the rest of this demo now holds itself to. Every
  ' keyframe sets position explicitly for the same reason Enemy.bas's
  ' equivalent does: tween applies every channel unconditionally each
  ' frame, and an unset position defaults to (0,0).
  dim px
  dim py
  dim k1 as Keyframe
  dim k2 as Keyframe
  dim k3 as Keyframe
  dim frames(0)

  px = self.transform.x()
  py = self.transform.y()

  self.windupTimer = 0.3
  self.setVelocity(0, 0)

  k1 = new Keyframe()
  k1.setTime(0)
  k1.setScaleX(1)
  k1.setScaleY(1)
  k1.setPosition(px, py)

  k2 = new Keyframe()
  k2.setTime(0.15)
  k2.setScaleX(1.25)
  k2.setScaleY(1.25)
  k2.setPosition(px, py)

  k3 = new Keyframe()
  k3.setTime(0.3)
  k3.setScaleX(1)
  k3.setScaleY(1)
  k3.setPosition(px, py)

  array.push(frames, k1)
  array.push(frames, k2)
  array.push(frames, k3)

  tween.play(self, frames, false)
endfunction

function onupdate(delta)
  if not self.dead then
    dim dt
    dim currentSpeed
    dt = delta / 1000

    if self.damageCooldown > 0 then
      self.damageCooldown = self.damageCooldown - dt
    endif

    ' Hit flash driven by hand, the same way Player's own invincibility
    ' flicker is, rather than by tween -- tween writes position every frame
    ' it's active, and a hit is exactly the moment the boss also gets
    ' knocked back via setVelocity below. A tween-driven flash here would
    ' freeze that knockback solid for the flash's duration, the same bug
    ' this attack's hit detection already went through twice with the
    ' player's own movement. A plain timer has no such conflict.
    if self.hitFlashTimer > 0 then
      self.hitFlashTimer = self.hitFlashTimer - dt
      self.hitFlashTickTimer = self.hitFlashTickTimer - dt
      if self.hitFlashTimer <= 0 then
        self.hitFlashOn = false
        self.setAlpha(1)
      elseif self.hitFlashTickTimer <= 0 then
        self.hitFlashTickTimer = 0.06
        if self.hitFlashOn then
          self.hitFlashOn = false
          self.setAlpha(1)
        else
          self.hitFlashOn = true
          self.setAlpha(0.3)
        endif
      endif
    endif

    if self.knockbackTimer > 0 then
      self.knockbackTimer = self.knockbackTimer - dt
      pathfinding.stopNavigating(self)
      self.setVelocity(self.knockbackX * 80, self.knockbackY * 80)
    elseif self.windupTimer > 0 then
      self.windupTimer = self.windupTimer - dt
      pathfinding.stopNavigating(self)
      self.setVelocity(0, 0)
      if self.windupTimer <= 0 then
        self.lungeTimer = 0.6
      endif
    else
      if self.lungeTimer > 0 then
        self.lungeTimer = self.lungeTimer - dt
        currentSpeed = self.lungeSpeed
      else
        self.attackTimer = self.attackTimer - dt
        if self.attackTimer <= 0 then
          self.attackTimer = 2.5
          self.beginWindup()
        endif
        currentSpeed = self.baseSpeed
      endif

      pathfinding.navigateTo(self, self.chaseTarget.transform.x(), self.chaseTarget.transform.y(), currentSpeed)

      if collision.spriteCollide(self, self.chaseTarget) then
        if self.damageCooldown <= 0 then
          self.chaseTarget.takeDamage()
          self.damageCooldown = 0.6
        endif
      endif
    endif
  endif
endfunction

function hit(damage, swingId)
  ' swingId guards against the same swing hitting the boss more than once
  ' now that Player checks collision every frame the sword is active (see
  ' Player.onupdate) rather than at a single instant -- without it, standing
  ' inside the hitbox for several consecutive frames of one swing would
  ' apply damage every one of those frames instead of just once.
  if not self.dead and self.lastHitSwingId <> swingId then
    self.lastHitSwingId = swingId
    self.hp = self.hp - damage
    particles.burstHitSpark(self.transform.x(), self.transform.y())
    if self.hp <= 0 then
      self.dead = true
      particles.burstBossDeath(self.transform.x(), self.transform.y())
      world.remove(self)
    else
      ' Mirrors Enemy.bas: knock the boss back so a successful hit buys
      ' breathing room, and cleanly cancel an in-progress windup pulse
      ' (stop the tween, reset scale) rather than leaving it stuck
      ' mid-puff if the hit interrupts it.
      if self.windupTimer > 0 then
        tween.stop(self)
        self.setScale(1, 1)
        self.windupTimer = 0
      endif
      self.hitFlashTimer = 0.18
      self.hitFlashTickTimer = 0
      self.hitFlashOn = false
      self.knockbackX = math.normalizeX(self.transform.x() - self.chaseTarget.transform.x(), self.transform.y() - self.chaseTarget.transform.y())
      self.knockbackY = math.normalizeY(self.transform.x() - self.chaseTarget.transform.x(), self.transform.y() - self.chaseTarget.transform.y())
      self.knockbackTimer = 0.15
    endif
  endif
endfunction

EndClass
```

## DungeonScene.bas

```bas
Class
Extends scene

dim tilemapset as tilemapset
dim player as player
dim enemies
dim keyPickup as keypickup
dim boss as boss
dim lastRoomX
dim lastRoomY
dim heart1 as sprite
dim heart2 as sprite
dim heart3 as sprite
dim bossDefeated
dim winTimer

Constructor()
EndConstructor

function onenter()
  dim tm as tilemapset
  tm = new tilemapset("dungeon.stm")
  world.add(tm)
  self.tilemapset = tm

  collision.setupTileCollision(tm)
  pathfinding.setup(tm, self.wallLayers())
  camera.setZoom(2)

  dim p as player
  p = new Player(40, 40)
  world.add(p)
  self.player = p

  dim sw as sword
  sw = new Sword()
  world.add(sw)
  p.setSword(sw)

  self.enemies = levelhelpers.enemiesFromMarkers(tm, "enemy", p)
  p.setEnemies(self.enemies)

  dim keyMarkers
  keyMarkers = tm.markersByTag("key")
  dim km as Marker
  km = keyMarkers(0)
  dim k as keypickup
  k = new KeyPickup(km.x, km.y)
  world.add(k)
  self.keyPickup = k

  dim bossMarkers
  bossMarkers = tm.markersByTag("boss")
  dim bm as Marker
  bm = bossMarkers(0)
  dim b as boss
  b = new Boss(bm.x, bm.y, p)
  world.add(b)
  self.boss = b
  p.setBoss(b)

  self.lastRoomX = -1
  self.lastRoomY = -1
  self.bossDefeated = false
  self.winTimer = 0

  self.setupHud()
  particles.setup()
endfunction

function openBossDoor()
  ' Swaps the boss room's closed-door pair (tile ids 47/48 on the "walls"
  ' layer, at row 11, cols 36-37) for their open counterparts (23/24) the
  ' instant the key is collected, and clears their collision so the player
  ' can actually walk through. Runs once here, at the moment of pickup,
  ' rather than every frame from Player.onupdate() -- setTile removes and
  ' recreates a PIXI sprite each call, which would be wasteful (and pointless,
  ' since the result is identical) to repeat 60 times a second for the rest
  ' of the level.
  '
  ' The door tiles live on "walls", not "floor" -- an earlier version painted
  ' them on "floor" with a solid wall tile left in place on "walls" right on
  ' top of them, which rendered fine in the Tile Map Editor (a non-active
  ' layer draws at 35% opacity there, so the door art showed faintly through)
  ' but was fully hidden in the actual game, where every layer draws at full
  ' opacity in file order and "walls" draws over "floor". Moving the door
  ' tiles onto "walls" itself removes the overlap instead of working around
  ' it.
  dim wallsLayer as TileMapLayer
  wallsLayer = self.tilemapset.layer("walls")
  wallsLayer.setTile(576, 176, 23)
  wallsLayer.setTile(592, 176, 24)
  collision.setTileSolid(576, 176, false)
  collision.setTileSolid(592, 176, false)
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "collision")
  return layers
endfunction

function setupHud()
  ' heart_full.png/heart_empty.png are 16x16. `sprite` is centre-anchored,
  ' so each heart's setPosition must be its CENTRE (top-left + 8, 8) to keep
  ' the row sitting at the same on-screen spot as before.
  dim h1 as sprite
  h1 = new sprite("heart_full.png")
  h1.transform.setPosition(28, 28)
  hud.add(h1)
  self.heart1 = h1

  dim h2 as sprite
  h2 = new sprite("heart_full.png")
  h2.transform.setPosition(48, 28)
  hud.add(h2)
  self.heart2 = h2

  dim h3 as sprite
  h3 = new sprite("heart_full.png")
  h3.transform.setPosition(68, 28)
  hud.add(h3)
  self.heart3 = h3
endfunction

function updateHud()
  dim hearts
  hearts = self.player.getHearts()

  if hearts >= 1 then
    self.heart1.setTexture("heart_full.png")
  else
    self.heart1.setTexture("heart_empty.png")
  endif

  if hearts >= 2 then
    self.heart2.setTexture("heart_full.png")
  else
    self.heart2.setTexture("heart_empty.png")
  endif

  if hearts >= 3 then
    self.heart3.setTexture("heart_full.png")
  else
    self.heart3.setTexture("heart_empty.png")
  endif
endfunction

function onupdate(delta)
  dim roomX
  dim roomY

  self.updateHud()

  if not self.keyPickup.collected then
    if collision.spriteCollide(self.player, self.keyPickup) then
      self.keyPickup.collect()
      self.player.setHasKey(true)
      self.openBossDoor()
    endif
  endif

  roomX = math.floor(self.player.transform.x() / 240)
  roomY = math.floor(self.player.transform.y() / 176)

  if roomX <> self.lastRoomX or roomY <> self.lastRoomY then
    self.lastRoomX = roomX
    self.lastRoomY = roomY
    camera.setPosition(roomX * 240, roomY * 176)
  endif

  ' Boss.hit() bursts the death particles and removes the boss from the
  ' world the instant hp hits 0, but no longer switches scenes itself --
  ' switching this same frame would clear the world (see stage.js's
  ' clear()) before that burst ever renders a single frame, the same
  ' "particle destroyed before it renders" gotcha Coins Platformer's
  ' burstLevelComplete/finishTimer already went through. Waiting here
  ' instead, the same way, gives the burst time to actually show.
  '
  ' self.boss.isDead() -- a getter -- not a bare self.boss.dead field read.
  ' Member-field type inference through a class-typed field (self.boss is
  ' `dim boss as boss`) doesn't resolve to the field's real type, so a
  ' strict type check on that read (a plain `if` condition, or an `and`)
  ' rejects it as "Expected type(s) Boolean... but got Object" -- confirmed
  ' live. Every existing self.boss.dead read elsewhere in this demo (e.g.
  ' Player.checkSwingHits) happens to sit under a bare `not`, which has no
  ' type check at all, so this gap stayed silent until this scene's own
  ' boss-death handling needed a real conditional. See Boss.isDead()'s own
  ' comment for why the method call resolves correctly where the field
  ' access doesn't.
  if not self.bossDefeated then
    if self.boss.isDead() then
      self.bossDefeated = true
    endif
  endif
  if self.bossDefeated then
    self.winTimer = self.winTimer + delta / 1000
    if self.winTimer >= 0.6 then
      scenemanager.switch("winscene")
    endif
  endif
endfunction

EndClass
```

## Enemy.bas

```bas
Class
Extends sprite

dim hp
dim dead
dim chaseTarget as sprite
dim damageCooldown
dim speed
dim state
dim chaseRadius
dim giveUpRadius
dim spawnX
dim spawnY
dim patrolTargetX
dim patrolTargetY
dim patrolSpeed
dim patrolLegTimer
dim knockbackTimer
dim knockbackX
dim knockbackY
dim attackRange
dim attackWindupTimer
dim lastHitSwingId
dim hitFlashTimer
dim hitFlashTickTimer
dim hitFlashOn

Constructor(x, y, targetRef as sprite)
  super("enemy.png")
  self.transform.setPosition(x, y)
  self.hp = 30
  self.dead = false
  self.chaseTarget = targetRef
  self.damageCooldown = 0
  self.speed = 40
  self.state = "patrol"
  self.chaseRadius = 70
  self.giveUpRadius = 110
  self.spawnX = x
  self.spawnY = y
  self.patrolTargetX = x
  self.patrolTargetY = y
  self.patrolSpeed = 20
  self.knockbackTimer = 0
  self.knockbackX = 0
  self.knockbackY = 0
  self.attackRange = 18
  self.attackWindupTimer = 0
  self.lastHitSwingId = -1
  self.hitFlashTimer = 0
  self.hitFlashTickTimer = 0
  self.hitFlashOn = false
  self.pickPatrolLeg()
EndConstructor

function pickPatrolLeg()
  dim dir
  dim offsetX
  dim offsetY
  dir = math.randomint(4)
  offsetX = 0
  offsetY = 0
  if dir = 0 then : offsetX = 32 : endif
  if dir = 1 then : offsetX = -32 : endif
  if dir = 2 then : offsetY = 32 : endif
  if dir = 3 then : offsetY = -32 : endif

  if self.patrolTargetX = self.spawnX and self.patrolTargetY = self.spawnY then
    self.patrolTargetX = self.spawnX + offsetX
    self.patrolTargetY = self.spawnY + offsetY
  else
    self.patrolTargetX = self.spawnX
    self.patrolTargetY = self.spawnY
  endif
  self.patrolLegTimer = 1.5
endfunction

function beginAttack()
  ' Telegraphs the hit instead of dealing contact damage the instant the
  ' enemy touches the player: puff up over 0.35s (a tween scale pulse,
  ' 1x -> 1.4x -> 1x), standing still the whole time, and only actually
  ' land the hit -- checked fresh, not assumed -- once the windup ends.
  ' Gives the player a real, visible window to back off in response,
  ' rather than being punished for contact they had no warning about.
  '
  ' Every keyframe below sets position explicitly, even though this
  ' sequence is only ever meant to animate scale -- tween.js applies
  ' every channel unconditionally each frame, and Keyframe's x/y default
  ' to (0,0), so skipping setPosition here snaps the enemy straight to
  ' the world origin the instant the windup starts. Hit this exact bug
  ' live (confirmed by direct position logging, not assumed) before
  ' fixing it -- the same mistake Player.bas's own spin tween made and
  ' had already been fixed for, just repeated here in a new tween.
  dim px
  dim py
  dim k1 as Keyframe
  dim k2 as Keyframe
  dim k3 as Keyframe
  dim frames(0)

  px = self.transform.x()
  py = self.transform.y()

  self.state = "attack"
  self.attackWindupTimer = 0.35
  self.setVelocity(0, 0)

  k1 = new Keyframe()
  k1.setTime(0)
  k1.setScaleX(1)
  k1.setScaleY(1)
  k1.setPosition(px, py)

  k2 = new Keyframe()
  k2.setTime(0.2)
  k2.setScaleX(1.4)
  k2.setScaleY(1.4)
  k2.setPosition(px, py)

  k3 = new Keyframe()
  k3.setTime(0.35)
  k3.setPosition(px, py)
  k3.setScaleX(1)
  k3.setScaleY(1)

  array.push(frames, k1)
  array.push(frames, k2)
  array.push(frames, k3)

  tween.play(self, frames, false)
endfunction

function onupdate(delta)
  if not self.dead then
    dim dt
    dim dist
    dt = delta / 1000

    if self.damageCooldown > 0 then
      self.damageCooldown = self.damageCooldown - dt
    endif

    ' Hit flash driven by hand, the same way Player's own invincibility
    ' flicker is, rather than by tween -- tween writes position every frame
    ' it's active (see the comments throughout this file's tween usage), and
    ' a hit is exactly the moment this enemy also gets knocked back via
    ' setVelocity below. A tween-driven flash here would freeze that
    ' knockback solid for the flash's duration, the same bug this attack's
    ' hit detection already went through twice with the player's own
    ' movement. A plain timer has no such conflict.
    if self.hitFlashTimer > 0 then
      self.hitFlashTimer = self.hitFlashTimer - dt
      self.hitFlashTickTimer = self.hitFlashTickTimer - dt
      if self.hitFlashTimer <= 0 then
        self.hitFlashOn = false
        self.setAlpha(1)
      elseif self.hitFlashTickTimer <= 0 then
        self.hitFlashTickTimer = 0.06
        if self.hitFlashOn then
          self.hitFlashOn = false
          self.setAlpha(1)
        else
          self.hitFlashOn = true
          self.setAlpha(0.3)
        endif
      endif
    endif

    if self.knockbackTimer > 0 then
      self.knockbackTimer = self.knockbackTimer - dt
      pathfinding.stopNavigating(self)
      self.setVelocity(self.knockbackX * 130, self.knockbackY * 130)
    elseif self.state = "attack" then
      self.attackWindupTimer = self.attackWindupTimer - dt
      if self.attackWindupTimer <= 0 then
        ' Re-checked fresh, not assumed still true from when the windup
        ' started -- backing away during the telegraph avoids the hit.
        if collision.spriteCollide(self, self.chaseTarget) then
          self.chaseTarget.takeDamage()
          self.damageCooldown = 0.5
        endif
        self.state = "chase"
      endif
    else
      ' pathfinding.navigateTo moves the sprite directly (it doesn't use
      ' setVelocity), so nothing else ever clears the knockback velocity
      ' set above once the timer expires -- without this, the kinematic
      ' collision system (which DOES read setVelocity, independently of
      ' pathfinding) kept applying that last knockback push every frame
      ' forever, pinning the enemy against whatever wall it reached
      ' instead of actually stopping. Confirmed live: velocity was still
      ' exactly the knockback value dozens of frames after the timer hit
      ' zero.
      self.setVelocity(0, 0)

      dist = math.distance(self.transform.x(), self.transform.y(), self.chaseTarget.transform.x(), self.chaseTarget.transform.y())

      if self.state = "patrol" then
        if dist <= self.chaseRadius then
          self.state = "chase"
        endif
      else
        if dist > self.giveUpRadius then
          self.state = "patrol"
          self.pickPatrolLeg()
        endif
      endif

      if self.state = "chase" then
        if dist <= self.attackRange and self.damageCooldown <= 0 then
          self.beginAttack()
        else
          pathfinding.navigateTo(self, self.chaseTarget.transform.x(), self.chaseTarget.transform.y(), self.speed)
        endif
      else
        self.patrolLegTimer = self.patrolLegTimer - dt
        if self.patrolLegTimer <= 0 then
          self.pickPatrolLeg()
        endif
        pathfinding.navigateTo(self, self.patrolTargetX, self.patrolTargetY, self.patrolSpeed)
      endif
    endif
  endif
endfunction

function hit(damage, swingId)
  ' swingId guards against the same swing hitting this enemy more than once
  ' now that Player checks collision every frame the sword is active (see
  ' Player.onupdate) rather than at a single instant -- without it, standing
  ' inside the hitbox for several consecutive frames of one swing would
  ' apply damage every one of those frames instead of just once.
  if not self.dead and self.lastHitSwingId <> swingId then
    self.lastHitSwingId = swingId
    self.hp = self.hp - damage
    particles.burstHitSpark(self.transform.x(), self.transform.y())
    if self.hp <= 0 then
      self.dead = true
      particles.burstEnemyDeath(self.transform.x(), self.transform.y())
      world.remove(self)
    else
      ' A hit lands while mid-windup, knockback takes over next frame
      ' (checked first in onupdate) and interrupts the attack -- stop the
      ' pulse tween and reset scale explicitly, or a hit landed partway
      ' through the puff-up would leave the enemy stuck oversized.
      if self.state = "attack" then
        tween.stop(self)
        self.setScale(1, 1)
      endif
      self.hitFlashTimer = 0.18
      self.hitFlashTickTimer = 0
      self.hitFlashOn = false
      self.state = "chase"
      self.knockbackX = math.normalizeX(self.transform.x() - self.chaseTarget.transform.x(), self.transform.y() - self.chaseTarget.transform.y())
      self.knockbackY = math.normalizeY(self.transform.x() - self.chaseTarget.transform.x(), self.transform.y() - self.chaseTarget.transform.y())
      self.knockbackTimer = 0.15
    endif
  endif
endfunction

EndClass
```

## GameOverScene.bas

```bas
Class
Extends scene

dim failText as text

Constructor()
EndConstructor

function onenter()
  dim t1 as text
  t1 = new text("YOU DIED", 320, 200)
  t1.setStyle(28, 255, 60, 60)
  hud.add(t1)
  self.failText = t1
endfunction

function onkeydown(key)
  scenemanager.switch("dungeon")
endfunction

EndClass
```

## KeyPickup.bas

```bas
Class
Extends sprite

dim collected

Constructor(x, y)
  super("key.png")
  self.transform.setPosition(x, y)
  self.collected = false
EndConstructor

function collect()
  self.collected = true
  particles.burstKeySparkle(self.transform.x(), self.transform.y())
  world.remove(self)
endfunction

EndClass
```

## LevelHelpers.bas

A plain module (no `Class` keyword) — logic shared by the dungeon scene.

```bas
' demo-src/dungeon-explorer/LevelHelpers.bas
function enemiesFromMarkers(tileMapSet as tilemapset, tag, chaseTarget)
  dim markers
  markers = tileMapSet.markersByTag(tag)
  dim result(0)
  dim i
  dim m as Marker
  dim e as enemy
  for i = 0 to array.arrLength(markers) - 1
    m = markers(i)
    e = new Enemy(m.x, m.y, chaseTarget)
    world.add(e)
    array.push(result, e)
  next i
  return result
endfunction
```

## Main.bas

```bas
' demo-src/dungeon-explorer/Main.bas
function oninit()
  world.setPixelPerfect(true)
endfunction

dim titlescene = new TitleScene()
dim dungeonscene = new DungeonScene()
dim winscene = new WinScene()
dim gameoverscene = new GameOverScene()

scenemanager.register("title", titlescene)
scenemanager.register("dungeon", dungeonscene)
scenemanager.register("winscene", winscene)
scenemanager.register("gameover", gameoverscene)
scenemanager.switch("title")
```

## Particles.bas

A small shared-emitter module, following the same pattern as Coins Platformer's and Bullet Hell Shooter's own `Particles.bas`: one `Emitter` per distinct effect, all configured once in `setup()` (called as the very last statement of `DungeonScene.onenter()`, after every other `world.add()` call — PIXI renders a container's children in the order they were added, and there's no explicit z-index, so an emitter created before the tilemap would render underneath it), and a `burstXxx(x, y)` helper per effect that repositions the shared emitter and fires it.

```bas
' demo-src/dungeon-explorer/Particles.bas
dim hitSparkEmitter as Emitter
dim enemyDeathEmitter as Emitter
dim bossDeathEmitter as Emitter
dim keySparkleEmitter as Emitter

function setup()
  hitSparkEmitter = new Emitter("particle.png")
  hitSparkEmitter.setLifetime(0.15, 0.25)
  hitSparkEmitter.setSpeed(40, 90)
  hitSparkEmitter.setDirection(0, 360)
  hitSparkEmitter.setScaleOverLife(0.35, 0.05)
  hitSparkEmitter.setAlphaOverLife(1, 0)
  hitSparkEmitter.setColorOverLife(16777215, 16755200)
  hitSparkEmitter.setMaxParticles(60)
  world.add(hitSparkEmitter)

  enemyDeathEmitter = new Emitter("particle.png")
  enemyDeathEmitter.setLifetime(0.35, 0.5)
  enemyDeathEmitter.setSpeed(30, 80)
  enemyDeathEmitter.setDirection(0, 360)
  enemyDeathEmitter.setGravity(0, 80)
  enemyDeathEmitter.setScaleOverLife(0.5, 0.1)
  enemyDeathEmitter.setAlphaOverLife(1, 0)
  enemyDeathEmitter.setColorOverLife(16729156, 9109504)
  enemyDeathEmitter.setMaxParticles(80)
  world.add(enemyDeathEmitter)

  bossDeathEmitter = new Emitter("particle.png")
  bossDeathEmitter.setLifetime(0.6, 1)
  bossDeathEmitter.setSpeed(60, 160)
  bossDeathEmitter.setDirection(0, 360)
  bossDeathEmitter.setGravity(0, 100)
  bossDeathEmitter.setScaleOverLife(0.7, 0.1)
  bossDeathEmitter.setAlphaOverLife(1, 0)
  bossDeathEmitter.setColorOverLife(16766720, 16747520)
  bossDeathEmitter.setMaxParticles(120)
  world.add(bossDeathEmitter)

  keySparkleEmitter = new Emitter("particle.png")
  keySparkleEmitter.setLifetime(0.3, 0.45)
  keySparkleEmitter.setSpeed(15, 40)
  keySparkleEmitter.setDirection(0, 360)
  keySparkleEmitter.setScaleOverLife(0.3, 0.05)
  keySparkleEmitter.setAlphaOverLife(1, 0)
  keySparkleEmitter.setColorOverLife(16766720, 16777215)
  keySparkleEmitter.setMaxParticles(40)
  world.add(keySparkleEmitter)
endfunction

function burstHitSpark(x, y)
  hitSparkEmitter.transform.setPosition(x, y)
  hitSparkEmitter.burst(6)
endfunction

function burstEnemyDeath(x, y)
  enemyDeathEmitter.transform.setPosition(x, y)
  enemyDeathEmitter.burst(12)
endfunction

function burstBossDeath(x, y)
  bossDeathEmitter.transform.setPosition(x, y)
  bossDeathEmitter.burst(30)
endfunction

function burstKeySparkle(x, y)
  keySparkleEmitter.transform.setPosition(x, y)
  keySparkleEmitter.burst(10)
endfunction
```

## Player.bas

```bas
Class
Extends animatedsprite

dim hearts
dim maxHearts
dim facingX
dim facingY
dim hasKey
dim attackCooldown
dim invincibleTime
dim flickerTimer
dim visibleFlag
dim enemies() as enemy
dim boss as boss
dim sword as sword
dim swingId

Constructor(x, y)
  super("player.png", 16, 16)
  self.transform.setPosition(x, y)
  self.addAnim("idle", 0, 0, 1, true)
  self.addAnim("walk", 1, 2, 6, true)
  self.addAnim("attack", 3, 3, 1, false)
  self.play("idle")
  self.maxHearts = 3
  self.hearts = 3
  self.facingX = 0
  self.facingY = 1
  self.hasKey = false
  self.attackCooldown = 0
  self.invincibleTime = 0
  self.flickerTimer = 0
  self.visibleFlag = true
  self.swingId = 0
EndConstructor

function setEnemies(enemiesRef)
  self.enemies = enemiesRef
endfunction

function setBoss(bossRef as boss)
  self.boss = bossRef
endfunction

function setSword(swordRef as sword)
  self.sword = swordRef
endfunction

function setHasKey(value)
  self.hasKey = value
endfunction

function getHearts()
  return self.hearts
endfunction

function takeDamage()
  if self.invincibleTime <= 0 then
    self.hearts = self.hearts - 1
    self.invincibleTime = 1
  endif
endfunction

function tryAttack()
  if self.attackCooldown <= 0 then
    self.attackCooldown = 0.4
    self.swingId = self.swingId + 1
    self.play("attack")
    self.sword.swing(self, self.facingX, self.facingY, 0.4)
  endif
endfunction

function checkSwingHits()
  ' Checked every frame the swing is active (see onupdate, gated on
  ' attackCooldown > 0), not once at the instant the attack button was
  ' pressed. An instant-only check requires the target to already be in
  ' exactly the right place at exactly that one frame -- every hit-detection
  ' complaint in this attack's history traces back to some version of that:
  ' a facing-offset box that missed anything close, a hitbox that was fine
  ' but a frozen player that couldn't get back into range after a knockback,
  ' an animation that looked cancelled because the lock and the pose ended
  ' together. Checking continuously for the whole swing means a target that
  ' wanders into the box at ANY point during the 0.4s swing gets hit, not
  ' just one that happened to already be there the instant the button was
  ' pressed -- closer to how a swinging sword actually works, and removes
  ' the whole class of "was it in range on the right frame" bugs at once.
  ' self.swingId (bumped once per swing in tryAttack) stops this from
  ' hitting the same target more than once while it sits in the box for
  ' several consecutive frames -- see Enemy.hit/Boss.hit.
  '
  ' Hitbox is centered on the player, not offset in the facing direction --
  ' matches the spin-attack visual (a full 360 turn has no single "front").
  ' e.transform.x()/y() and self.boss.transform.x()/y() are each target's
  ' center -- `sprite` (like `animatedsprite`) is centre-anchored, so no
  ' correction is needed to feed these straight into boxCollide.
  '
  ' The box checked against each enemy is padded out to 28x28, well past
  ' its real 16x16 size: with the player's own box at 44x44 (half 22), a
  ' target's OWN half-size is what it contributes to the combined reach
  ' (22 + target's own half), so a small 16x16 enemy (half 8) only reached
  ' 30px center-to-center while the bigger 32x32 boss (half 16) reached
  ' 38px -- the boss felt generous and regular enemies felt tight purely
  ' because they're smaller, not from any difference in how forgiving the
  ' check itself was. Padding enemies to 28x28 (half 14) brings their
  ' reach to 36px, close to the boss's, without touching the boss's own
  ' box or the player's.
  dim hitX
  dim hitY
  dim i
  dim e as enemy

  hitX = self.transform.x()
  hitY = self.transform.y()

  for i = 0 to array.arrLength(self.enemies) - 1
    e = self.enemies(i)
    if not e.dead then
      if collision.boxCollide(hitX, hitY, 44, 44, e.transform.x(), e.transform.y(), 28, 28) then
        e.hit(15, self.swingId)
      endif
    endif
  next i

  if not self.boss.dead then
    if collision.boxCollide(hitX, hitY, 44, 44, self.boss.transform.x(), self.boss.transform.y(), 32, 32) then
      self.boss.hit(15, self.swingId)
    endif
  endif
endfunction

function onupdate(delta)
  dim dt
  dim moveX
  dim moveY
  dim nx
  dim ny

  dt = delta / 1000

  moveX = 0
  moveY = 0
  if input.getKeyDown(87) then : moveY = -1 : endif
  if input.getKeyDown(83) then : moveY = 1 : endif
  if input.getKeyDown(65) then : moveX = -1 : endif
  if input.getKeyDown(68) then : moveX = 1 : endif

  nx = math.normalizeX(moveX, moveY)
  ny = math.normalizeY(moveX, moveY)
  self.setVelocity(nx * 100, ny * 100)

  if moveX <> 0 or moveY <> 0 then
    self.facingX = nx
    self.facingY = ny
  endif

  if input.keyPressed(74) then
    self.tryAttack()
  endif

  if self.attackCooldown > 0 then
    self.attackCooldown = self.attackCooldown - dt
  endif

  ' Rotation is driven directly by setAngle here, not by tween.play -- tween
  ' writes every channel (including position) unconditionally each frame,
  ' so a tween spin controlling rotation would also have to control position
  ' every frame, freezing the player solid for the swing's whole duration.
  ' That's exactly what caused the boss to feel un-hittable: chaining attacks
  ' the instant cooldown allowed left the player unable to chase a boss that
  ' had just been knocked back out of range, confirmed live. Setting the
  ' angle by hand here means attacking costs no mobility at all: setVelocity
  ' above already runs unconditionally, so the player can move and spin at
  ' the same time. The 360 turn now spans the whole attackCooldown window
  ' (0.4s) rather than a shortened slice of it, since there's no longer a
  ' tradeoff between "long enough to read as a real spin" and "short enough
  ' the player isn't stuck standing still" -- a shorter, tween-locked version
  ' of this spin (0.15s) shipped briefly and read as the attack getting cut
  ' off/cancelled by movement input, because pose and lock ended together
  ' well before the cooldown did.
  if self.attackCooldown > 0 then
    self.setAngle((0.4 - self.attackCooldown) / 0.4 * 360)
    self.checkSwingHits()
  else
    self.setAngle(0)
  endif

  if self.hasKey then
    collision.setTileSolid(488, 264, false)
    collision.setTileSolid(488, 280, false)
  endif

  if self.invincibleTime > 0 then
    self.invincibleTime = self.invincibleTime - dt
    self.flickerTimer = self.flickerTimer - dt
    if self.flickerTimer <= 0 then
      self.flickerTimer = 0.08
      if self.visibleFlag then
        self.visibleFlag = false
        self.setAlpha(0.2)
      else
        self.visibleFlag = true
        self.setAlpha(1)
      endif
    endif
  else
    self.setAlpha(1)
  endif

  if self.attackCooldown > 0 then
    ' still flashing the attack pose for the whole spin -- let it finish
    ' showing before switching back to walk/idle, rather than depending on
    ' the animation engine's own "is it done playing" state
  elseif moveX <> 0 or moveY <> 0 then
    if not self.isPlaying("walk") then
      self.play("walk")
    endif
  else
    if not self.isPlaying("idle") then
      self.play("idle")
    endif
  endif

  if self.hearts <= 0 then
    scenemanager.switch("gameover")
  endif
endfunction

EndClass
```

## Sword.bas

```bas
Class
Extends sprite

dim active
dim playerRef as sprite
dim swingTimer

Constructor()
  super("sword.png")
  self.setVisible(false)
  self.active = false
  self.swingTimer = 0
EndConstructor

function swing(p, facingX, facingY, duration)
  ' Attaching makes the sword sweep around the player: its local position
  ' (set below, relative to the player) is carried around in a circle by
  ' the player's own spin (driven by setAngle in Player.onupdate), since
  ' PIXI rotates a child's position along with its parent's. The sword does
  ' NOT need its own angle animation on top of that: an earlier version
  ' gave it one, which composed additively with the player's rotation and
  ' made the sword complete two full orbits for every one player spin --
  ' confirmed by sampling world-space position, not assumed. Leaving the
  ' sword's own angle fixed makes it track the player's spin exactly once.
  '
  ' Position/angle are derived from the player's current facing, not
  ' hardcoded. alongDist/perpDist place the sword's own CENTRE (`sprite`
  ' is centre-anchored) relative to the player, tuned by eye so the blade
  ' reads as an outstretched sword rather than overlapping the player.
  dim alongDist
  dim perpDist
  dim perpX
  dim perpY

  alongDist = 26
  perpDist = -5
  perpX = -facingY
  perpY = facingX

  self.playerRef = p
  self.attachTo(p)
  self.transform.setPosition(facingX * alongDist + perpX * perpDist, facingY * alongDist + perpY * perpDist)
  self.setAngle(90 + math.atan2(facingY, facingX) * 180 / math.pi())
  self.setVisible(true)
  self.active = true
  self.swingTimer = duration
endfunction

function onupdate(delta)
  ' Tracks its own timer rather than polling tween.isPlaying(playerRef) --
  ' the player no longer uses tween for its spin at all (see Player.bas), so
  ' there's no longer any tween state to poll. duration is passed in from
  ' the caller (Player.tryAttack) so the sword's visible lifetime always
  ' matches however long the player's own spin actually takes, without the
  ' two having to agree on a hardcoded number independently.
  if self.active then
    self.swingTimer = self.swingTimer - delta / 1000
    if self.swingTimer <= 0 then
      self.active = false
      self.setVisible(false)
      self.detach()
    endif
  endif
endfunction

EndClass
```

## TitleScene.bas

```bas
Class
Extends scene

dim titleText as text
dim promptText as text

Constructor()
EndConstructor

function onenter()
  world.setBackground(15, 10, 20)
  dim t1 as text
  t1 = new text("DUNGEON EXPLORER", 260, 200)
  t1.setStyle(30, 255, 220, 120)
  hud.add(t1)
  self.titleText = t1

  dim t2 as text
  t2 = new text("Press any key to start", 290, 260)
  t2.setStyle(16, 200, 200, 200)
  hud.add(t2)
  self.promptText = t2
endfunction

function onkeydown(key)
  scenemanager.switch("dungeon")
endfunction

EndClass
```

## WinScene.bas

```bas
Class
Extends scene

dim winText as text

Constructor()
EndConstructor

function onenter()
  dim t1 as text
  t1 = new text("THE DUNGEON IS CLEAR", 240, 200)
  t1.setStyle(26, 255, 255, 100)
  hud.add(t1)
  self.winText = t1
endfunction

function onkeydown(key)
  scenemanager.switch("title")
endfunction

EndClass
```
