# Bullet-Hell Shooter

A three-level top-down shooter: destroy every spawn point in a level as fast as you can, before its mobs overwhelm you.

---

## How it works

Each level (`Level1Scene`, `Level2Scene`, `Level3Scene`) loads its own `.stm` tilemap, spawns the player, and builds its spawn points and weapon pickups from **tagged markers** placed visually in the Tilemap Editor — `tileMapSet.markersByTag("spawn")` and `tileMapSet.markersByTag("pickup")` — instead of hardcoding coordinates in the scene's own `.bas` file. That marker-lookup logic, along with checking pickup collisions, counting remaining spawn points, and formatting the level timer, lives in **`LevelHelpers.bas`**, a plain module (no `Class` keyword) called from each scene as `levelhelpers.someFunction(...)`. softBASIC's `Extends` only supports single-level inheritance, so the three level scenes can't share a common base class — each scene still keeps its own `setupHud()` (building the health bar, weapon label, spawn counter, and timer) and its own `onupdate()` game-over check (switching to `GameOverScene` when HP reaches zero), rather than those living in `LevelHelpers.bas`.

Mobs are **pathfinding-driven**: each level calls `pathfinding.setup(tilemapset, wallLayers)` once in `onenter()`, and every `Mob` then calls `pathfinding.navigateTo(self, targetX, targetY, speed)` every frame, so mobs route around walls to chase the player instead of walking straight through them. Spawn points periodically create new mobs until destroyed; each hit from a bullet reduces a spawn point's HP, and at zero it swaps its texture to `spawnpoint_destroyed.png` and stops spawning.

The player aims with the mouse — `math.atan2` between the player's world position and the mouse's world position (`input.mouseX() / camera.zoom() + camera.x()`, accounting for both camera scroll and zoom) gives the aim angle, which also drives the sprite's rotation via `setAngle()`. Firing (left click or spacebar) is gated by a per-weapon cooldown. There are three weapons, picked up via `WeaponPickup` markers: **pistol** (moderate rate, single shot), **shotgun** (slow rate, five-bullet spread fired in a fan), and **SMG** (fast rate, single shot). Each spawned `Bullet` carries its own damage, speed, and lifetime based on which weapon fired it, and despawns on hitting a wall, a spawn point, a mob, or timing out.

Particle effects (built on the `Emitter` class) fire at four moments — a mob dying, a spawn point being destroyed, a bullet hitting something, and the player taking damage — via a small shared-emitter module, **`Particles.bas`**, called from each level's `onenter()` and from the relevant hit/death/damage branch in `Mob`, `SpawnPoint`, `Bullet`, and `Player`. Each effect reuses one persistent `Emitter` per type rather than creating a new one per event, since `Emitter` has no destroy method and mob deaths happen constantly over a play session.

The HUD (health bar, current weapon, spawns remaining, level timer) is built from `sprite` and `text` instances added with `hud.add()` — deliberately not `drawing`, which draws into camera-relative world space and would scroll off screen as the player moves. Each level tracks its own clear time in a shared `GameData` module; on reaching `WinScene`, the three times are summed and compared against a **personal best** persisted with `save.set(...)`, so it survives a page reload. Taking damage down to zero HP at any point switches to `GameOverScene`, which resets the level times and sends the player back to level 1.

A couple of engine quirks were found during development and have since been fixed at the source rather than worked around: typed Constructor parameters and Constructor-scope locals now compile to correct JavaScript, and `Main.bas`/`TitleScene.bas` show the right way to set module-level state from `oninit()` — see the code comments in `Main.bas`/`TitleScene.bas` below for that last one.

**Key techniques:** `pathfinding.navigateTo` for obstacle-avoiding enemy movement, `tileMapSet.markersByTag` for visually-authored spawn/pickup placement, per-weapon `Bullet` parameterization, HUD built from `sprite`/`text` instances added via `hud.add()`, shared/reused `Emitter` instances for hit/death particle effects.

---

## Required assets

| Filename | What it is |
|---|---|
| `player.png` | 64×16 sprite sheet, 4 frames (stand, pistol, machinegun, shotgun poses) |
| `mob.png` | 16×16 sprite |
| `spawnpoint.png` | 16×16 sprite |
| `spawnpoint_destroyed.png` | 16×16 sprite |
| `pickup.png` | 16×8 sprite |
| `bullet.png` | 4×4 sprite |
| `particle.png` | 16×16 soft-edged white dot, tinted per-effect via `setColorOverLife` |
| `healthbar_bg.png` | HUD health bar background |
| `healthbar_fill.png` | HUD health bar fill (scaled by current HP) |
| `tilesheet.png` | Kenney tileset used for level geometry |
| `map1.stm` / `map2.stm` / `map3.stm` | Tilemap data per level, with `floor`/`walls` tile layers and `spawns`/`pickups` marker layers |

---

## Controls

| Key | Action |
|---|---|
| W / A / S / D | Move |
| Mouse | Aim |
| Left Click / Space | Fire |

---

## GameData.bas

```bas
' demo-src/bullet-hell-shooter/GameData.bas
dim levelTimes(3)
dim bestTime

function resetLevelTimes()
  dim i
  for i = 0 to 2
    levelTimes(i) = 0
  next i
endfunction

function setLevelTime(index, seconds)
  levelTimes(index) = seconds
endfunction

function getLevelTime(index)
  return levelTimes(index)
endfunction

function totalTime()
  return levelTimes(0) + levelTimes(1) + levelTimes(2)
endfunction

function loadBestTime()
  if save.exists("bestTime") then
    bestTime = save.get("bestTime")
  else
    bestTime = -1
  endif
endfunction

function getBestTime()
  return bestTime
endfunction

function trySetBestTime(total)
  if bestTime = -1 or total < bestTime then
    bestTime = total
    save.set("bestTime", total)
    return true
  endif
  return false
endfunction
```

## WeaponPickup.bas

```bas
Class
Extends sprite

dim collected

Constructor(x, y)
  super("pickup.png")
  self.transform.setPosition(x, y)
  self.collected = false
EndConstructor

function collect()
  dim choice
  self.collected = true
  world.remove(self)
  choice = math.randomint(3)
  if choice = 0 then
    return "pistol"
  elseif choice = 1 then
    return "shotgun"
  else
    return "smg"
  endif
endfunction

EndClass
```

## Player.bas

```bas
Class
Extends animatedsprite

dim hp
dim level
dim spawnPoints
dim mobs
dim currentWeapon
dim fireCooldown
dim invincibleTime
dim flickerTimer
dim visibleFlag

Constructor(x, y)
  super("player.png", 16, 16)
  self.transform.setPosition(x, y)
  self.addAnim("stand", 0, 0, 1, true)
  self.addAnim("pistol", 1, 1, 1, true)
  self.addAnim("machinegun", 2, 2, 1, true)
  self.addAnim("shotgun", 3, 3, 1, true)
  self.play("stand")
  self.hp = 100
  self.currentWeapon = "pistol"
  self.fireCooldown = 0
  self.invincibleTime = 0
  self.flickerTimer = 0
  self.visibleFlag = true
EndConstructor

function setLevel(levelRef as tilemapset, spawnPointsRef, mobsRef)
  self.level = levelRef
  self.spawnPoints = spawnPointsRef
  self.mobs = mobsRef
endfunction

function getHp()
  return self.hp
endfunction

function getCurrentWeapon()
  return self.currentWeapon
endfunction

function takeDamage(amount)
  if self.invincibleTime <= 0 then
    self.hp = self.hp - amount
    self.invincibleTime = 0.5
    particles.burstPlayerHit(self.transform.x(), self.transform.y())
  endif
endfunction

function fireCooldownFor(weaponType)
  if weaponType = "shotgun" then
    return 0.8
  elseif weaponType = "smg" then
    return 0.1
  else
    return 0.3
  endif
endfunction

function spawnBullet(angle)
  dim b as bullet
  b = new Bullet(self.transform.x(), self.transform.y(), angle, self.currentWeapon, self.level, self.spawnPoints, self.mobs)
  world.add(b)
endfunction

function doFire(angle)
  dim i
  dim spreadAngle
  dim count
  dim step
  dim start
  if self.currentWeapon = "shotgun" then
    count = 5
    step = (30 * math.pi() / 180) / (count - 1)
    start = angle - (15 * math.pi() / 180)
    for i = 0 to count - 1
      spreadAngle = start + step * i
      self.spawnBullet(spreadAngle)
    next i
  else
    self.spawnBullet(angle)
  endif
endfunction

function onupdate(delta)
  dim dt
  dim x
  dim y
  dim moveX
  dim moveY
  dim nx
  dim ny
  dim mouseWorldX
  dim mouseWorldY
  dim aimAngle
  dim firing
  dim moving
  dim animName

  dt = delta / 1000
  x = self.transform.x()
  y = self.transform.y()

  moveX = 0
  moveY = 0
  if input.getKeyDown(87) then
    moveY = -1
  endif
  if input.getKeyDown(83) then
    moveY = 1
  endif
  if input.getKeyDown(65) then
    moveX = -1
  endif
  if input.getKeyDown(68) then
    moveX = 1
  endif

  nx = math.normalizeX(moveX, moveY)
  ny = math.normalizeY(moveX, moveY)
  self.setVelocity(nx * 150, ny * 150)

  mouseWorldX = input.mouseX() / camera.zoom() + camera.x()
  mouseWorldY = input.mouseY() / camera.zoom() + camera.y()
  aimAngle = math.atan2(mouseWorldY - y, mouseWorldX - x)
  self.setAngle(aimAngle * 180 / math.pi())

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

  if self.fireCooldown > 0 then
    self.fireCooldown = self.fireCooldown - dt
  endif

  firing = input.getKeyDown(32) or input.mouseDown()
  if firing and self.fireCooldown <= 0 then
    self.doFire(aimAngle)
    self.fireCooldown = self.fireCooldownFor(self.currentWeapon)
  endif

  moving = (moveX <> 0) or (moveY <> 0)

  if moving or firing then
    if self.currentWeapon = "shotgun" then
      animName = "shotgun"
    elseif self.currentWeapon = "smg" then
      animName = "machinegun"
    else
      animName = "pistol"
    endif
  else
    animName = "stand"
  endif

  if not self.isPlaying(animName) then
    self.play(animName)
  endif
endfunction

EndClass
```

## Mob.bas

```bas
Class
Extends sprite

dim hp
dim dead
dim chaseTarget as sprite
dim damageCooldown
dim speed

Constructor(x, y, targetRef as sprite)
  super("mob.png")
  self.transform.setPosition(x, y)
  self.hp = 20
  self.dead = false
  self.chaseTarget = targetRef
  self.damageCooldown = 0
  self.speed = 60
EndConstructor

function onupdate(delta)
  if not self.dead then
    dim dt
    dt = delta / 1000
    pathfinding.navigateTo(self, self.chaseTarget.transform.x(), self.chaseTarget.transform.y(), self.speed)

    if self.damageCooldown > 0 then
      self.damageCooldown = self.damageCooldown - dt
    endif

    if collision.spriteCollide(self, self.chaseTarget) then
      if self.damageCooldown <= 0 then
        self.chaseTarget.takeDamage(10)
        self.damageCooldown = 0.5
      endif
    endif
  endif
endfunction

function hit(damage)
  if not self.dead then
    self.hp = self.hp - damage
    if self.hp <= 0 then
      self.dead = true
      particles.burstMobDeath(self.transform.x(), self.transform.y())
      world.remove(self)
    endif
  endif
endfunction

EndClass
```

## SpawnPoint.bas

```bas
Class
Extends sprite

dim hp
dim destroyed
dim spawnInterval
dim elapsed
dim mobs
dim chaseTarget

Constructor(x, y, interval, mobsArray, targetRef)
  super("spawnpoint.png")
  self.transform.setPosition(x, y)
  self.hp = 20
  self.destroyed = false
  self.spawnInterval = interval
  self.elapsed = 0
  self.mobs = mobsArray
  self.chaseTarget = targetRef
EndConstructor

function onupdate(delta)
  dim dt
  dim m as mob
  if not self.destroyed then
    dt = delta / 1000
    self.elapsed = self.elapsed + dt
    if self.elapsed >= self.spawnInterval then
      self.elapsed = 0
      m = new Mob(self.transform.x(), self.transform.y(), self.chaseTarget)
      world.add(m)
      array.push(self.mobs, m)
    endif
  endif
endfunction

function hit(damage)
  if not self.destroyed and self.hp > 0 then
    self.hp = self.hp - damage
    if self.hp <= 0 then
      self.destroyed = true
      self.setTexture("spawnpoint_destroyed.png")
      particles.burstSpawnDestroyed(self.transform.x(), self.transform.y())
    endif
  endif
endfunction

EndClass
```

## Bullet.bas

```bas
Class
Extends sprite

dim vx
dim vy
dim damage
dim lifetime
dim elapsed
dim level as tilemapset
dim spawnPoints() as spawnpoint
dim mobs() as mob

Constructor(x, y, angle, weaponType, levelRef as tilemapset, spawnPointsRef() as spawnpoint, mobsRef() as mob)
  dim speed
  super("bullet.png")
  self.transform.setPosition(x, y)
  self.setAngle(angle * 180 / math.pi())
  self.level = levelRef
  self.spawnPoints = spawnPointsRef
  self.mobs = mobsRef
  self.elapsed = 0

  if weaponType = "shotgun" then
    self.damage = 8
    self.lifetime = 0.6
    speed = 220
  elseif weaponType = "smg" then
    self.damage = 5
    self.lifetime = 0.8
    speed = 320
  else
    self.damage = 10
    self.lifetime = 1
    speed = 260
  endif

  self.vx = math.cos(angle) * speed
  self.vy = math.sin(angle) * speed
EndConstructor

function onupdate(delta)
  dim dt
  dim x
  dim y
  dim i

  dt = delta / 1000
  x = self.transform.x() + self.vx * dt
  y = self.transform.y() + self.vy * dt
  self.transform.setPosition(x, y)

  self.elapsed = self.elapsed + dt
  if self.elapsed >= self.lifetime then
    world.remove(self)
    return
  endif

  if self.level.tileAt("walls", x, y) <> 0 then
    particles.burstBulletImpact(x, y)
    world.remove(self)
    return
  endif

  for i = 0 to array.arrLength(self.spawnPoints) - 1
    if not self.spawnPoints(i).destroyed then
      if collision.spriteCollide(self, self.spawnPoints(i)) then
        self.spawnPoints(i).hit(self.damage)
        particles.burstBulletImpact(x, y)
        world.remove(self)
        return
      endif
    endif
  next i

  for i = 0 to array.arrLength(self.mobs) - 1
    if not self.mobs(i).dead then
      if collision.spriteCollide(self, self.mobs(i)) then
        self.mobs(i).hit(self.damage)
        particles.burstBulletImpact(x, y)
        world.remove(self)
        return
      endif
    endif
  next i
endfunction

EndClass
```

## LevelHelpers.bas

A plain module (no `Class` keyword) — logic shared by every level scene.

```bas
' demo-src/bullet-hell-shooter/LevelHelpers.bas
function spawnPointsFromMarkers(tileMapSet as tilemapset, tag, spawnInterval, mobs, chaseTarget)
  dim markers
  markers = tileMapSet.markersByTag(tag)
  dim result(0)
  dim i
  dim m as Marker
  dim sp as spawnpoint
  for i = 0 to array.arrLength(markers) - 1
    m = markers(i)
    sp = new SpawnPoint(m.x, m.y, spawnInterval, mobs, chaseTarget)
    world.add(sp)
    array.push(result, sp)
  next i
  return result
endfunction

function pickupsFromMarkers(tileMapSet as tilemapset, tag)
  dim markers
  markers = tileMapSet.markersByTag(tag)
  dim result(0)
  dim i
  dim m as Marker
  dim p as weaponpickup
  for i = 0 to array.arrLength(markers) - 1
    m = markers(i)
    p = new WeaponPickup(m.x, m.y)
    world.add(p)
    array.push(result, p)
  next i
  return result
endfunction

function allSpawnPointsDestroyed(spawnPoints() as spawnpoint)
  dim i
  for i = 0 to array.arrLength(spawnPoints) - 1
    if not spawnPoints(i).destroyed then
      return false
    endif
  next i
  return true
endfunction

function checkPickupCollisions(player as player, pickups() as weaponpickup)
  dim i
  dim weaponType
  for i = 0 to array.arrLength(pickups) - 1
    if not pickups(i).collected then
      if collision.spriteCollide(player, pickups(i)) then
        weaponType = pickups(i).collect()
        player.currentWeapon = weaponType
      endif
    endif
  next i
endfunction

function spawnPointsRemaining(spawnPoints() as spawnpoint)
  dim i
  dim count
  count = 0
  for i = 0 to array.arrLength(spawnPoints) - 1
    if not spawnPoints(i).destroyed then
      count = count + 1
    endif
  next i
  return count
endfunction

function formatTime(totalSeconds)
  dim minutes
  dim secs
  dim minStr
  dim secStr
  minutes = math.floor(totalSeconds / 60)
  secs = math.floor(totalSeconds - minutes * 60)
  minStr = string.padstart(string.str(minutes), 2, "0")
  secStr = string.padstart(string.str(secs), 2, "0")
  return minStr + ":" + secStr
endfunction
```

## Particles.bas

```bas
' demo-src/bullet-hell-shooter/Particles.bas
dim mobDeathEmitter as Emitter
dim spawnDestroyedEmitter as Emitter
dim bulletImpactEmitter as Emitter
dim playerHitEmitter as Emitter

function setup()
  mobDeathEmitter = new Emitter("particle.png")
  mobDeathEmitter.setLifetime(0.4, 0.4)
  mobDeathEmitter.setSpeed(40, 90)
  mobDeathEmitter.setDirection(0, 360)
  mobDeathEmitter.setGravity(0, 120)
  mobDeathEmitter.setScaleOverLife(1, 0.2)
  mobDeathEmitter.setAlphaOverLife(1, 0)
  mobDeathEmitter.setColorOverLife(16729156, 9109504)
  mobDeathEmitter.setMaxParticles(80)
  world.add(mobDeathEmitter)

  spawnDestroyedEmitter = new Emitter("particle.png")
  spawnDestroyedEmitter.setLifetime(0.6, 0.6)
  spawnDestroyedEmitter.setSpeed(60, 140)
  spawnDestroyedEmitter.setDirection(0, 360)
  spawnDestroyedEmitter.setGravity(0, 100)
  spawnDestroyedEmitter.setScaleOverLife(1.4, 0.2)
  spawnDestroyedEmitter.setAlphaOverLife(1, 0)
  spawnDestroyedEmitter.setColorOverLife(16770650, 15093780)
  spawnDestroyedEmitter.setMaxParticles(60)
  world.add(spawnDestroyedEmitter)

  bulletImpactEmitter = new Emitter("particle.png")
  bulletImpactEmitter.setLifetime(0.2, 0.2)
  bulletImpactEmitter.setSpeed(20, 50)
  bulletImpactEmitter.setDirection(0, 360)
  bulletImpactEmitter.setScaleOverLife(0.8, 0.1)
  bulletImpactEmitter.setAlphaOverLife(1, 0)
  bulletImpactEmitter.setColorOverLife(16777215, 9868950)
  bulletImpactEmitter.setMaxParticles(150)
  world.add(bulletImpactEmitter)

  playerHitEmitter = new Emitter("particle.png")
  playerHitEmitter.setLifetime(0.3, 0.3)
  playerHitEmitter.setSpeed(30, 70)
  playerHitEmitter.setDirection(0, 360)
  playerHitEmitter.setScaleOverLife(1, 0.2)
  playerHitEmitter.setAlphaOverLife(1, 0)
  playerHitEmitter.setColorOverLife(16729156, 16729156)
  playerHitEmitter.setMaxParticles(50)
  world.add(playerHitEmitter)
endfunction

function burstMobDeath(x, y)
  mobDeathEmitter.transform.setPosition(x, y)
  mobDeathEmitter.burst(8)
endfunction

function burstSpawnDestroyed(x, y)
  spawnDestroyedEmitter.transform.setPosition(x, y)
  spawnDestroyedEmitter.burst(18)
endfunction

function burstBulletImpact(x, y)
  bulletImpactEmitter.transform.setPosition(x, y)
  bulletImpactEmitter.burst(4)
endfunction

function burstPlayerHit(x, y)
  playerHitEmitter.transform.setPosition(x, y)
  playerHitEmitter.burst(6)
endfunction
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
  gamedata.loadBestTime()
  world.setBackground(10, 10, 20)
  dim t1 as text
  t1 = new text("BULLET HELL", 300, 200)
  t1.setStyle(32, 255, 255, 255)
  hud.add(t1)
  self.titleText = t1

  dim t2 as text
  t2 = new text("Press any key to start", 300, 260)
  t2.setStyle(16, 200, 200, 200)
  hud.add(t2)
  self.promptText = t2
endfunction

function onkeydown(key)
  scenemanager.switch("level1")
endfunction

EndClass
```

## Level1Scene.bas

```bas
Class
Extends scene

dim tilemapset as tilemapset
dim player as player
dim spawnPoints
dim mobs
dim pickups
dim cleared
dim clearTimer
dim hpLabel as text
dim hpBg as sprite
dim hpFill as sprite
dim weaponLabel as text
dim spawnLabel as text
dim timerLabel as text

Constructor()
EndConstructor

function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(0, 0)
  particles.setup()

  dim tm as tilemapset
  tm = new tilemapset("map1.stm")
  world.add(tm)
  self.tilemapset = tm

  collision.setupTileCollision(tm)

  pathfinding.setup(tm, self.wallLayers())

  dim p as player
  p = new Player(64, 64)
  world.add(p)
  self.player = p

  dim empty(0)
  self.mobs = empty

  self.spawnPoints = levelhelpers.spawnPointsFromMarkers(tm, "spawn", 6, self.mobs, p)
  self.pickups = levelhelpers.pickupsFromMarkers(tm, "pickup")

  p.setLevel(tm, self.spawnPoints, self.mobs)

  camera.setZoom(2)
  camera.follow(p, 0.1)

  self.setupHud()
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "collision")
  return layers
endfunction

function setupHud()
  dim bg as sprite
  bg = new sprite("healthbar_bg.png")
  bg.transform.setPosition(20, 20)
  bg.setScale(100, 14)
  hud.add(bg)
  self.hpBg = bg

  dim fill as sprite
  fill = new sprite("healthbar_fill.png")
  fill.transform.setPosition(20, 20)
  fill.setScale(100, 14)
  hud.add(fill)
  self.hpFill = fill

  dim hpl as text
  hpl = new text("HP", 20, 36)
  hpl.setStyle(12, 255, 255, 255)
  hud.add(hpl)
  self.hpLabel = hpl

  dim wl as text
  wl = new text("Pistol", 600, 20)
  wl.setStyle(14, 255, 255, 255)
  hud.add(wl)
  self.weaponLabel = wl

  dim sl as text
  sl = new text("Spawns: 0", 600, 40)
  sl.setStyle(14, 255, 255, 255)
  hud.add(sl)
  self.spawnLabel = sl

  dim tl as text
  tl = new text("00:00", 360, 20)
  tl.setStyle(16, 255, 255, 0)
  hud.add(tl)
  self.timerLabel = tl
endfunction

function onupdate(delta)
  dim dt
  dim t
  dt = delta / 1000
  t = gamedata.getLevelTime(0) + dt
  gamedata.setLevelTime(0, t)

  self.hpFill.setScale(100 * (self.player.getHp() / 100), 14)
  self.weaponLabel.setText(self.player.getCurrentWeapon())
  self.spawnLabel.setText("Spawns: " + string.str(levelhelpers.spawnPointsRemaining(self.spawnPoints)))
  self.timerLabel.setText(levelhelpers.formatTime(t))

  levelhelpers.checkPickupCollisions(self.player, self.pickups)

  if not self.cleared then
    if levelhelpers.allSpawnPointsDestroyed(self.spawnPoints) then
      self.cleared = true
    endif
  else
    self.clearTimer = self.clearTimer + dt
    if self.clearTimer >= 2 then
      scenemanager.switch("level2")
    endif
  endif

  if self.player.getHp() <= 0 then
    scenemanager.switch("gameover")
  endif
endfunction

EndClass
```

## Level2Scene.bas

```bas
Class
Extends scene

dim tilemapset as tilemapset
dim player as player
dim spawnPoints
dim mobs
dim pickups
dim cleared
dim clearTimer
dim hpLabel as text
dim hpBg as sprite
dim hpFill as sprite
dim weaponLabel as text
dim spawnLabel as text
dim timerLabel as text

Constructor()
EndConstructor

function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(1, 0)
  particles.setup()

  dim tm as tilemapset
  tm = new tilemapset("map2.stm")
  world.add(tm)
  self.tilemapset = tm

  collision.setupTileCollision(tm)

  pathfinding.setup(tm, self.wallLayers())

  dim p as player
  p = new Player(64, 64)
  world.add(p)
  self.player = p

  dim empty(0)
  self.mobs = empty

  self.spawnPoints = levelhelpers.spawnPointsFromMarkers(tm, "spawn", 4.5, self.mobs, p)
  self.pickups = levelhelpers.pickupsFromMarkers(tm, "pickup")

  p.setLevel(tm, self.spawnPoints, self.mobs)

  camera.setZoom(2)
  camera.follow(p, 0.1)

  self.setupHud()
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "collision")
  return layers
endfunction

function setupHud()
  dim bg as sprite
  bg = new sprite("healthbar_bg.png")
  bg.transform.setPosition(20, 20)
  bg.setScale(100, 14)
  hud.add(bg)
  self.hpBg = bg

  dim fill as sprite
  fill = new sprite("healthbar_fill.png")
  fill.transform.setPosition(20, 20)
  fill.setScale(100, 14)
  hud.add(fill)
  self.hpFill = fill

  dim hpl as text
  hpl = new text("HP", 20, 36)
  hpl.setStyle(12, 255, 255, 255)
  hud.add(hpl)
  self.hpLabel = hpl

  dim wl as text
  wl = new text("Pistol", 600, 20)
  wl.setStyle(14, 255, 255, 255)
  hud.add(wl)
  self.weaponLabel = wl

  dim sl as text
  sl = new text("Spawns: 0", 600, 40)
  sl.setStyle(14, 255, 255, 255)
  hud.add(sl)
  self.spawnLabel = sl

  dim tl as text
  tl = new text("00:00", 360, 20)
  tl.setStyle(16, 255, 255, 0)
  hud.add(tl)
  self.timerLabel = tl
endfunction

function onupdate(delta)
  dim dt
  dim t
  dt = delta / 1000
  t = gamedata.getLevelTime(1) + dt
  gamedata.setLevelTime(1, t)

  self.hpFill.setScale(100 * (self.player.getHp() / 100), 14)
  self.weaponLabel.setText(self.player.getCurrentWeapon())
  self.spawnLabel.setText("Spawns: " + string.str(levelhelpers.spawnPointsRemaining(self.spawnPoints)))
  self.timerLabel.setText(levelhelpers.formatTime(t))

  levelhelpers.checkPickupCollisions(self.player, self.pickups)

  if not self.cleared then
    if levelhelpers.allSpawnPointsDestroyed(self.spawnPoints) then
      self.cleared = true
    endif
  else
    self.clearTimer = self.clearTimer + dt
    if self.clearTimer >= 2 then
      scenemanager.switch("level3")
    endif
  endif

  if self.player.getHp() <= 0 then
    scenemanager.switch("gameover")
  endif
endfunction

EndClass
```

## Level3Scene.bas

```bas
Class
Extends scene

dim tilemapset as tilemapset
dim player as player
dim spawnPoints
dim mobs
dim pickups
dim cleared
dim clearTimer
dim hpLabel as text
dim hpBg as sprite
dim hpFill as sprite
dim weaponLabel as text
dim spawnLabel as text
dim timerLabel as text

Constructor()
EndConstructor

function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(2, 0)
  particles.setup()

  dim tm as tilemapset
  tm = new tilemapset("map3.stm")
  world.add(tm)
  self.tilemapset = tm

  collision.setupTileCollision(tm)

  pathfinding.setup(tm, self.wallLayers())

  dim p as player
  p = new Player(64, 64)
  world.add(p)
  self.player = p

  dim empty(0)
  self.mobs = empty

  self.spawnPoints = levelhelpers.spawnPointsFromMarkers(tm, "spawn", 3, self.mobs, p)
  self.pickups = levelhelpers.pickupsFromMarkers(tm, "pickup")

  p.setLevel(tm, self.spawnPoints, self.mobs)

  camera.setZoom(2)
  camera.follow(p, 0.1)

  self.setupHud()
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "collision")
  return layers
endfunction

function setupHud()
  dim bg as sprite
  bg = new sprite("healthbar_bg.png")
  bg.transform.setPosition(20, 20)
  bg.setScale(100, 14)
  hud.add(bg)
  self.hpBg = bg

  dim fill as sprite
  fill = new sprite("healthbar_fill.png")
  fill.transform.setPosition(20, 20)
  fill.setScale(100, 14)
  hud.add(fill)
  self.hpFill = fill

  dim hpl as text
  hpl = new text("HP", 20, 36)
  hpl.setStyle(12, 255, 255, 255)
  hud.add(hpl)
  self.hpLabel = hpl

  dim wl as text
  wl = new text("Pistol", 600, 20)
  wl.setStyle(14, 255, 255, 255)
  hud.add(wl)
  self.weaponLabel = wl

  dim sl as text
  sl = new text("Spawns: 0", 600, 40)
  sl.setStyle(14, 255, 255, 255)
  hud.add(sl)
  self.spawnLabel = sl

  dim tl as text
  tl = new text("00:00", 360, 20)
  tl.setStyle(16, 255, 255, 0)
  hud.add(tl)
  self.timerLabel = tl
endfunction

function onupdate(delta)
  dim dt
  dim t
  dt = delta / 1000
  t = gamedata.getLevelTime(2) + dt
  gamedata.setLevelTime(2, t)

  self.hpFill.setScale(100 * (self.player.getHp() / 100), 14)
  self.weaponLabel.setText(self.player.getCurrentWeapon())
  self.spawnLabel.setText("Spawns: " + string.str(levelhelpers.spawnPointsRemaining(self.spawnPoints)))
  self.timerLabel.setText(levelhelpers.formatTime(t))

  levelhelpers.checkPickupCollisions(self.player, self.pickups)

  if not self.cleared then
    if levelhelpers.allSpawnPointsDestroyed(self.spawnPoints) then
      self.cleared = true
    endif
  else
    self.clearTimer = self.clearTimer + dt
    if self.clearTimer >= 2 then
      scenemanager.switch("winscene")
    endif
  endif

  if self.player.getHp() <= 0 then
    scenemanager.switch("gameover")
  endif
endfunction

EndClass
```

## WinScene.bas

```bas
Class
Extends scene

dim totalText as text
dim bestText as text

Constructor()
EndConstructor

function onenter()
  dim total
  total = gamedata.totalTime()
  gamedata.trySetBestTime(total)

  dim t1 as text
  t1 = new text("YOU SURVIVED", 280, 180)
  t1.setStyle(28, 255, 255, 0)
  hud.add(t1)
  self.totalText = t1

  dim t2 as text
  t2 = new text("Best: " + string.str(gamedata.getBestTime()), 280, 240)
  t2.setStyle(16, 255, 255, 255)
  hud.add(t2)
  self.bestText = t2
endfunction

function onkeydown(key)
  scenemanager.switch("title")
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
  t1 = new text("MISSION FAILED", 280, 200)
  t1.setStyle(28, 255, 0, 0)
  hud.add(t1)
  self.failText = t1
endfunction

function onkeydown(key)
  gamedata.resetLevelTimes()
  scenemanager.switch("level1")
endfunction

EndClass
```

## Main.bas

```bas
' demo-src/bullet-hell-shooter/Main.bas
' Do not call gamedata.loadBestTime() from here -- oninit() runs before
' every module's own deferred top-level statements (see bootstrapper.html),
' so GameData.bas's own "dim bestTime" initializer would run right after
' this and silently reset gamedata.bestTime back to undefined, clobbering
' whatever loadBestTime() just set. It's called from TitleScene.onenter()
' instead, which is guaranteed to run after that deferred init completes.
function oninit()
  world.setPixelPerfect(true)
endfunction

dim titlescene = new TitleScene()
dim level1scene = new Level1Scene()
dim level2scene = new Level2Scene()
dim level3scene = new Level3Scene()
dim winscene = new WinScene()
dim gameoverscene = new GameOverScene()

scenemanager.register("title", titlescene)
scenemanager.register("level1", level1scene)
scenemanager.register("level2", level2scene)
scenemanager.register("level3", level3scene)
scenemanager.register("winscene", winscene)
scenemanager.register("gameover", gameoverscene)
scenemanager.switch("title")
```
