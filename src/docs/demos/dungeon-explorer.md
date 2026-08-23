# Dungeon Explorer

A room-by-room dungeon crawl: fight through two branches of enemies, find the key, and defeat the boss guarding the treasure room.

---

## How it works

The whole dungeon is one tilemap, but `DungeonScene` treats it as discrete rooms rather than one continuously-scrolling level: `onupdate()` divides the player's world position by the room size (240×176, i.e. 15×11 tiles at 16px) to get a room coordinate, and whenever that coordinate changes, `camera.setPosition(roomX * 240, roomY * 176)` hard-cuts the view to the new room — classic-adventure-game style, instead of scrolling continuously.

The boss room's door is a real `collision` tile, solid until the player has the key: `Player.onupdate()` calls `collision.setTileSolid(488, 264, false)` and `collision.setTileSolid(488, 280, false)` once `self.hasKey` is true, unlocking both door tiles. The tilemap's collision layer, painted in the Tilemap Editor, is only the *starting* state — not a fixed layout.

The player moves with `setVelocity` (sliding cleanly along walls via `collision.setupTileCollision`, no hand-rolled axis checks) and attacks with a short-range melee swing in whichever direction (`facingX`/`facingY`) they last moved — `tryAttack()` builds a hit box 20px out from the player's centre in that facing direction and checks it against every living enemy and the boss with `collision.boxCollide`. The attack is also a little flourish: `tween.play()` spins the player a full 360° over the 0.4s attack window, and a separate `Sword` sprite (invisible the rest of the time) attaches to the player via `attachTo`, so it's carried around by the player's own spin — no tween of its own needed. The player can't move during that 0.4s — both of the player's own spin keyframes pin position to wherever the attack started, which is also a deliberate "committing to the attack" trade-off, not just a side effect.

`Sword.swing()` calls `attachTo(player)` and leaves the sword's own local angle fixed at 0 — the sword's sprite has its pivot at its top-left corner (the default for a plain `sprite`, unlike `animatedsprite`, which centres it), so once the sword's local position is `(0, 0)` — its pivot glued exactly to the player's own position — the *player's* spin alone carries that off-centre pivot around in a circle. An earlier version additionally tweened the sword's own local angle 0° to 360° on top of that, on the assumption the sword's own rotation was what produced the sweep; it wasn't, and since PIXI adds a child's rotation to its parent's, that extra tween made the sword complete two full orbits for every one player spin, confirmed by sampling its world position frame-by-frame rather than assumed. Removing the sword's own tween fixed it: one attach call, one fixed angle, one clean orbit, driven entirely by the player's own spin.

`Sword.onupdate()` watches `tween.isPlaying(player)` (not its own tween — it doesn't have one) to know when to hide itself and `detach()`.

Regular enemies aren't always aggressive: each one patrols a short back-and-forth leg near its spawn point until the player comes within `chaseRadius` (70px), at which point it switches to chasing via `pathfinding.navigateTo`, giving up and returning to patrol if the player gets more than `giveUpRadius` (110px) away again. Landing a hit on an enemy also knocks it back briefly (a short `setVelocity` shove away from the player), so a successful attack buys breathing room instead of guaranteeing a counter-hit from contact damage. The boss skips all of that — it's a full-time chase, with a periodic speed-boosted lunge layered on top of its base chase speed (`attackTimer` counts down to trigger a 0.6s lunge at 4x speed, then resets), which also means standing still to land a spin attack right next to the boss is a real risk, not a free action. Losing all 3 hearts switches to `GameOverScene`; defeating the boss switches straight to `WinScene`.

Enemies and the key are placed visually in the Tilemap Editor as tagged markers, not hardcoded — `DungeonScene.onenter()` calls `levelhelpers.enemiesFromMarkers(tm, "enemy", p)` to spawn every enemy from `"enemy"`-tagged markers, and reads the single `"key"`-tagged marker and `"boss"`-tagged marker directly via `tm.markersByTag(...)`. Key pickup is overlap-based: `onupdate()` checks `collision.spriteCollide(self.player, self.keyPickup)` each frame and, on contact, calls `self.keyPickup.collect()` and `self.player.setHasKey(true)`.

**Key techniques:** `tween.play`/`isPlaying` + `Keyframe` + `sprite.attachTo`/`detach` for the spin-and-swing melee attack, `collision.setTileSolid`/`isTileSolid` for a runtime-unlockable door, `camera.setPosition` for discrete room-snap transitions instead of continuous scrolling, `sprite.setVelocity` + `collision.setupTileCollision` for kinematic movement, `tileMapSet.markersByTag` for visually-placed enemies/key/boss, `pathfinding.navigateTo` for chase AI.

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

Constructor(x, y, targetRef as sprite)
  super("boss.png")
  self.transform.setPosition(x, y)
  self.hp = 150
  self.dead = false
  self.chaseTarget = targetRef
  self.damageCooldown = 0
  self.baseSpeed = 40
  self.lungeSpeed = 160
  self.attackTimer = 2.5
  self.lungeTimer = 0
EndConstructor

function onupdate(delta)
  if not self.dead then
    dim dt
    dim currentSpeed
    dt = delta / 1000

    if self.lungeTimer > 0 then
      self.lungeTimer = self.lungeTimer - dt
      currentSpeed = self.lungeSpeed
    else
      self.attackTimer = self.attackTimer - dt
      if self.attackTimer <= 0 then
        self.attackTimer = 2.5
        self.lungeTimer = 0.6
      endif
      currentSpeed = self.baseSpeed
    endif

    pathfinding.navigateTo(self, self.chaseTarget.transform.x(), self.chaseTarget.transform.y(), currentSpeed)

    if self.damageCooldown > 0 then
      self.damageCooldown = self.damageCooldown - dt
    endif

    if collision.spriteCollide(self, self.chaseTarget) then
      if self.damageCooldown <= 0 then
        self.chaseTarget.takeDamage()
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
      world.remove(self)
      scenemanager.switch("winscene")
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

  self.setupHud()
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "collision")
  return layers
endfunction

function setupHud()
  dim h1 as sprite
  h1 = new sprite("heart_full.png")
  h1.transform.setPosition(20, 20)
  hud.add(h1)
  self.heart1 = h1

  dim h2 as sprite
  h2 = new sprite("heart_full.png")
  h2.transform.setPosition(40, 20)
  hud.add(h2)
  self.heart2 = h2

  dim h3 as sprite
  h3 = new sprite("heart_full.png")
  h3.transform.setPosition(60, 20)
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
    endif
  endif

  roomX = math.floor(self.player.transform.x() / 240)
  roomY = math.floor(self.player.transform.y() / 176)

  if roomX <> self.lastRoomX or roomY <> self.lastRoomY then
    self.lastRoomX = roomX
    self.lastRoomY = roomY
    camera.setPosition(roomX * 240, roomY * 176)
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

Constructor(x, y, targetRef as sprite)
  super("enemy.png")
  self.transform.setPosition(x, y)
  self.hp = 30
  self.dead = false
  self.chaseTarget = targetRef
  self.damageCooldown = 0
  self.speed = 50
  self.state = "patrol"
  self.chaseRadius = 70
  self.giveUpRadius = 110
  self.spawnX = x
  self.spawnY = y
  self.patrolTargetX = x
  self.patrolTargetY = y
  self.patrolSpeed = 25
  self.knockbackTimer = 0
  self.knockbackX = 0
  self.knockbackY = 0
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

function onupdate(delta)
  if not self.dead then
    dim dt
    dim dist
    dt = delta / 1000

    if self.damageCooldown > 0 then
      self.damageCooldown = self.damageCooldown - dt
    endif

    if self.knockbackTimer > 0 then
      self.knockbackTimer = self.knockbackTimer - dt
      pathfinding.stopNavigating(self)
      self.setVelocity(self.knockbackX * 160, self.knockbackY * 160)
    else
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
        pathfinding.navigateTo(self, self.chaseTarget.transform.x(), self.chaseTarget.transform.y(), self.speed)
      else
        self.patrolLegTimer = self.patrolLegTimer - dt
        if self.patrolLegTimer <= 0 then
          self.pickPatrolLeg()
        endif
        pathfinding.navigateTo(self, self.patrolTargetX, self.patrolTargetY, self.patrolSpeed)
      endif

      if collision.spriteCollide(self, self.chaseTarget) then
        if self.damageCooldown <= 0 then
          self.chaseTarget.takeDamage()
          self.damageCooldown = 0.5
        endif
      endif
    endif
  endif
endfunction

function hit(damage)
  if not self.dead then
    self.hp = self.hp - damage
    if self.hp <= 0 then
      self.dead = true
      world.remove(self)
    else
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
  dim hitX
  dim hitY
  dim i
  dim e as enemy

  if self.attackCooldown <= 0 then
    self.attackCooldown = 0.4
    self.play("attack")
    self.sword.swing(self)

    dim s1 as Keyframe
    s1 = new Keyframe()
    s1.setTime(0)
    s1.setAngle(0)
    s1.setPosition(self.transform.x(), self.transform.y())

    dim s2 as Keyframe
    s2 = new Keyframe()
    s2.setTime(0.4)
    s2.setAngle(360)
    s2.setPosition(self.transform.x(), self.transform.y())

    dim spinFrames(0)
    array.push(spinFrames, s1)
    array.push(spinFrames, s2)

    tween.play(self, spinFrames, false)

    hitX = self.transform.x() + self.facingX * 20
    hitY = self.transform.y() + self.facingY * 20

    for i = 0 to array.arrLength(self.enemies) - 1
      e = self.enemies(i)
      if not e.dead then
        if collision.boxCollide(hitX, hitY, 16, 16, e.transform.x(), e.transform.y(), 16, 16) then
          e.hit(15)
        endif
      endif
    next i

    if not self.boss.dead then
      if collision.boxCollide(hitX, hitY, 16, 16, self.boss.transform.x(), self.boss.transform.y(), 32, 32) then
        self.boss.hit(15)
      endif
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

  if self.attackCooldown > 0.25 then
    ' still flashing the attack pose from a recent swing -- let it finish
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

Constructor()
  super("sword.png")
  self.setVisible(false)
  self.active = false
EndConstructor

function swing(p)
  ' Attaching alone already makes the sword sweep around the player: the
  ' sword's own anchor sits at its top-left corner (the sprite default),
  ' not its centre, so once its local position is (0,0) -- i.e. its pivot
  ' is glued to the player's own position -- the player's own spin tween
  ' carries that off-centre pivot around in a circle all by itself. The
  ' sword does NOT need its own angle tween on top of that: an earlier
  ' version gave it one, which composed additively with the player's
  ' rotation (PIXI sums a child's rotation with its parent's) and made the
  ' sword complete two full orbits for every one player spin -- confirmed
  ' by sampling world-space position, not assumed. Leaving the sword's own
  ' angle fixed at 0 makes it track the player's spin exactly once.
  '
  ' Parameter deliberately named `p`, not `playerRef` -- matching this name
  ' to the `playerRef` field triggered a real transpiler bug where the
  ' compiler resolved the assignment against the class's own field default
  ' instead of the local parameter, silently assigning undefined.
  self.playerRef = p
  self.attachTo(p)
  self.transform.setPosition(0, 0)
  self.setAngle(0)
  self.setVisible(true)
  self.active = true
endfunction

function onupdate(delta)
  if self.active then
    if not tween.isPlaying(self.playerRef) then
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
