# Dungeon Explorer Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Dungeon Explorer" — a new demo (slug `dungeon-explorer`, `.b4wgl.json` name `DungeonExplorer`) showcasing discrete room-to-room exploration on a single tilemap, melee combat, a key-and-locked-door puzzle using `collision.setTileSolid`, and a boss fight.

**Architecture:** One overworld `.stm` tilemap (3 rooms × 2 rooms, each room 15×11 tiles at 16px). "Current room" is `floor(player position / room size)`; the scene hard-cuts the camera with `camera.setPosition(...)` when it changes — no panning, no new engine code. Enemies, the key, and the boss are placed via tagged markers in the Tilemap Editor (`tileMapSet.markersByTag`, the exact same mechanism Bullet-Hell Shooter already uses for spawn points and pickups) and spawned once at level start — no continuous spawner, unlike Bullet-Hell's `SpawnPoint`. The locked door is two collision-layer tiles, solid by default, opened at runtime with `collision.setTileSolid` once the player has the key — this demo exists specifically to prove that feature out in a real game. Player movement reuses the kinematic `setVelocity` pattern from Bullet-Hell Shooter's already-refactored `Player.bas`.

**Tech Stack:** softBASIC, `demo-src/dungeon-explorer/` (Path B: hand-write `.bas` + `scripts/buildDemo.ts`), Tilemap Editor, Cypress.

---

## Prerequisite reading (context, not a task)

- Design doc: `docs/superpowers/specs/2026-08-15-zelda-adventure-demo-design.md` — read this first, this plan implements it exactly.
- `docs/demo-authoring-guide.md` — the process this plan follows (Path B, production checklist).
- `demo-src/bullet-hell-shooter/` — read `Player.bas`, `Mob.bas`, `SpawnPoint.bas`, `WeaponPickup.bas`, `Main.bas`, `TitleScene.bas`, `GameOverScene.bas`, `WinScene.bas`, `LevelHelpers.bas` in full. Every class in this plan adapts an established pattern from these files — none of this is invented from scratch.
- `docs/superpowers/plans/2026-08-15-collision-runtime-toggle-plan.md` — already shipped (`collision.setTileSolid`/`isTileSolid`), the feature this demo exists to showcase.

## Game design constants (locked in, referenced throughout this plan)

- Tile size: 16px (reusing Bullet-Hell Shooter's `tilesheet.png` directly — same tile size, same tile IDs, no new tile art needed: tile `1` = floor, tile `45` = wall).
- Room size: 15 cols × 11 rows = 240×176px.
- Overworld grid: 3 rooms wide × 2 rooms tall = 45 cols × 22 rows total.
- Room layout (`(col, row)`, pixel origin `= (col*240, row*176)`):
  - `(0,0)` **Start** — player spawns here.
  - `(1,0)` **EnemyRoom1** — 1 enemy.
  - `(2,0)` **KeyRoom** — 1 enemy guarding the key, 1 key pickup.
  - `(0,1)` **EnemyRoom2** — 2 enemies.
  - `(1,1)` **DoorRoom** — no enemies; its right edge is the locked door.
  - `(2,1)` **BossRoom** — 1 boss.
- Connections (open gaps to paint in the shared walls between rooms): Start↔EnemyRoom1 (their shared vertical border), EnemyRoom1↔KeyRoom (shared vertical border), Start↔EnemyRoom2 (shared horizontal border), EnemyRoom2↔DoorRoom (shared vertical border). **DoorRoom↔BossRoom is the locked door** — see below, not a plain gap.
- Locked door: two collision-layer tiles, solid by default, at the DoorRoom/BossRoom shared border (world x = 480, the border between column 29 and column 30), centered vertically in the room. Exact world positions used by code: `DOOR_X = 488`, `DOOR_Y1 = 264`, `DOOR_Y2 = 280` (two vertically-stacked tiles, tall enough for the player to walk through comfortably — a single 16px-wide gap exactly matching the player's own width risks visible edge-clipping jitter).
- Player: starts at `(40, 40)` (inside Start room, inset from the walls), speed 100px/s, 3 hearts, 1s invincibility after taking damage, melee damage 15, attack cooldown 0.4s, attack reach 20px in the facing direction.
- Regular enemy: 30 hp, chase speed 50px/s, contact damage 1 heart, 0.5s damage cooldown (mirrors `Mob.bas`'s existing pattern).
- Boss: 150 hp, chase speed 40px/s, contact damage 1 heart, lunges toward the player every 2.5s (speed boosted to 160px/s for 0.6s, then reverts).

---

### Task 1: Scaffold + shell scenes (`Main.bas`, `TitleScene.bas`, `GameOverScene.bas`, `WinScene.bas`)

**Files:**
- Create: `demo-src/dungeon-explorer/Main.bas`
- Create: `demo-src/dungeon-explorer/TitleScene.bas`
- Create: `demo-src/dungeon-explorer/GameOverScene.bas`
- Create: `demo-src/dungeon-explorer/WinScene.bas`

No automated test — per `docs/demo-authoring-guide.md`, demo `.bas` code is verified by running it in the app with zero console `ERR`, not unit tests (this project's established convention, confirmed in the collision-runtime-toggle and kinematic-movement plans' own testing sections).

- [ ] **Step 1: Create `demo-src/dungeon-explorer/TitleScene.bas`**

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

- [ ] **Step 2: Create `demo-src/dungeon-explorer/GameOverScene.bas`**

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

- [ ] **Step 3: Create `demo-src/dungeon-explorer/WinScene.bas`**

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

- [ ] **Step 4: Create `demo-src/dungeon-explorer/Main.bas`**

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

`DungeonScene` doesn't exist yet — that's Task 6. This file won't compile cleanly until then; that's expected and fine mid-plan (the same sequencing bullet-hell-shooter's own plan used — scenes registered in `Main.bas` before every class they reference exists yet).

- [ ] **Step 5: Commit**

```bash
git add demo-src/dungeon-explorer/Main.bas demo-src/dungeon-explorer/TitleScene.bas demo-src/dungeon-explorer/GameOverScene.bas demo-src/dungeon-explorer/WinScene.bas
git commit -m "feat: scaffold Dungeon Explorer demo shell scenes"
```

---

### Task 2: `KeyPickup.bas`

**Files:**
- Create: `demo-src/dungeon-explorer/KeyPickup.bas`

- [ ] **Step 1: Create the file**

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

(Adapted from `demo-src/bullet-hell-shooter/WeaponPickup.bas` — same shape, simpler `collect()` since there's only one key, not a random weapon choice.)

- [ ] **Step 2: Commit**

```bash
git add demo-src/dungeon-explorer/KeyPickup.bas
git commit -m "feat: add Dungeon Explorer KeyPickup class"
```

---

### Task 3: `Enemy.bas`

**Files:**
- Create: `demo-src/dungeon-explorer/Enemy.bas`

- [ ] **Step 1: Create the file**

```bas
Class
Extends sprite

dim hp
dim dead
dim chaseTarget as sprite
dim damageCooldown
dim speed

Constructor(x, y, targetRef as sprite)
  super("enemy.png")
  self.transform.setPosition(x, y)
  self.hp = 30
  self.dead = false
  self.chaseTarget = targetRef
  self.damageCooldown = 0
  self.speed = 50
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
    endif
  endif
endfunction

EndClass
```

(Directly adapted from `demo-src/bullet-hell-shooter/Mob.bas` — same chase/contact-damage pattern via `pathfinding.navigateTo` and `collision.spriteCollide`. `takeDamage()` takes no argument here — see Task 5, `Player.takeDamage()` always removes exactly one heart, unlike Bullet-Hell's numeric-HP `takeDamage(amount)`.)

- [ ] **Step 2: Commit**

```bash
git add demo-src/dungeon-explorer/Enemy.bas
git commit -m "feat: add Dungeon Explorer Enemy class"
```

---

### Task 4: `Boss.bas`

**Files:**
- Create: `demo-src/dungeon-explorer/Boss.bas`

- [ ] **Step 1: Create the file**

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

(Same chase/contact-damage shape as `Enemy.bas`, plus a periodic lunge: `attackTimer` counts down to trigger a 0.6s `lungeTimer` window at 4x base speed, then reverts — `pathfinding.navigateTo`'s `speed` argument is just read fresh every frame, so swapping it between `baseSpeed`/`lungeSpeed` needs no extra machinery. Defeating the boss directly triggers the win scene from `hit()` — the one intentional asymmetry versus `Enemy.bas`, since there's only one boss and no separate "level clear" check needed.)

- [ ] **Step 2: Commit**

```bash
git add demo-src/dungeon-explorer/Boss.bas
git commit -m "feat: add Dungeon Explorer Boss class"
```

---

### Task 5: `Player.bas`

**Files:**
- Create: `demo-src/dungeon-explorer/Player.bas`

- [ ] **Step 1: Create the file**

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
dim enemies
dim boss as boss

Constructor(x, y)
  super("player.png", 16, 16)
  self.transform.setPosition(x, y)
  self.addAnim("idle", 0, 0, 1, true)
  self.addAnim("walk", 1, 2, 6, true)
  self.addAnim("attack", 3, 3, 1, true)
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

  if moveX <> 0 or moveY <> 0 then
    if not self.isPlaying("walk") and not self.isPlaying("attack") then
      self.play("walk")
    endif
  elseif not self.isPlaying("attack") then
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

Notes on deliberate choices, so the implementer doesn't second-guess them:
- Movement is the exact kinematic pattern from `demo-src/bullet-hell-shooter/Player.bas` (already shipped, already proven — `math.normalizeX`/`normalizeY` + `setVelocity`, no manual `tileAt` collision).
- `facingX`/`facingY` only update while actually moving, so the last direction faced persists while standing still (matches how melee attacks work in every game this genre — you can face a direction and swing without moving).
- Attack key is `J` (keycode 74) via `input.keyPressed`, deliberately NOT the same key as Bullet-Hell's mouse-based firing, since this demo has no mouse-aim — confirm this doesn't collide with anything else `input` reads in this demo (it doesn't; only WASD + J are used).
- The door-unlock call (`collision.setTileSolid` for both door tiles) runs every frame once `hasKey` is true — deliberately not gated by proximity or a one-shot flag, since calling it repeatedly is harmless and idempotent (this is the simplest correct implementation, not a shortcut).
- `tryAttack()` calls `self.boss.hit(...)` with no "is boss set yet" guard. This is safe, not an oversight: `DungeonScene.onenter()` (Task 6) always constructs the `Player` and calls `p.setBoss(b)` synchronously, before `onenter()` returns — and `onupdate`/`tryAttack` can never run until the next frame, after `onenter()` has fully finished. So `self.boss` is guaranteed assigned before the first possible call to `tryAttack()`. (An earlier draft of this file guarded with `if self.boss <> false then` — removed because an unset typed field transpiles to `undefined`, not `false`, so that comparison would never have worked as intended; the guard was unnecessary anyway given the guaranteed construction order, so the fix is to delete it, not correct the comparison.)

- [ ] **Step 2: Commit**

```bash
git add demo-src/dungeon-explorer/Player.bas
git commit -m "feat: add Dungeon Explorer Player class"
```

---

### Task 6: `LevelHelpers.bas` + `DungeonScene.bas`

**Files:**
- Create: `demo-src/dungeon-explorer/LevelHelpers.bas`
- Create: `demo-src/dungeon-explorer/DungeonScene.bas`

This is the integration task — the scene that owns the tilemap, spawns everything from markers, drives room-transition camera snapping, and renders the hearts HUD.

- [ ] **Step 1: Create `demo-src/dungeon-explorer/LevelHelpers.bas`**

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

(Adapted from `demo-src/bullet-hell-shooter/LevelHelpers.bas`'s `spawnPointsFromMarkers` — same shape, but spawns the enemy directly instead of a spawner object, since this demo's enemies exist once at level start, not continuously respawned.)

- [ ] **Step 2: Create `demo-src/dungeon-explorer/DungeonScene.bas`**

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

  dim p as player
  p = new Player(40, 40)
  world.add(p)
  self.player = p

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

Notes on deliberate choices:
- `wallLayers()` points `pathfinding.setup` at the `"collision"` layer, mirroring the already-shipped fix in Bullet-Hell Shooter (`Level1Scene.bas` etc.) — one shared authoritative solidity source, not a second `"walls"`-named layer.
- The key and boss are each assumed to have exactly one marker (`keyMarkers(0)`, `bossMarkers(0)`) — this is a hard assumption this task's code makes; Task 8 (tilemap authoring) MUST place exactly one `"key"` marker and exactly one `"boss"` marker, or this will throw an array-index error at runtime. Flag this clearly to whoever does Task 8.
- `camera.setBounds` is deliberately NOT called — per the design, each room is a fixed, self-contained screen the camera hard-cuts to, not a continuously panning world with edge clamping. `camera.setZoom` is also not set (stays at the default `1`), so a 240×176px room fills whatever the actual preview/fullscreen viewport is at its native scale — confirm during Task 9's manual verification that this reads clearly at normal preview size; if rooms feel too small on screen, revisit `camera.setZoom` then, don't guess a value now.
- `updateHud()` runs every frame rather than only on damage — simple and correct at this scale (3 sprites, 3 comparisons), matching this project's general preference for simple correct code over premature optimization for a demo of this size.

- [ ] **Step 3: Commit**

```bash
git add demo-src/dungeon-explorer/LevelHelpers.bas demo-src/dungeon-explorer/DungeonScene.bas
git commit -m "feat: add Dungeon Explorer LevelHelpers and DungeonScene"
```

---

### Task 7: [CHECKPOINT] Assets

**This task requires the user's involvement** — image assets can't be generated by an implementer subagent; this task specifies exactly what's needed and hands off to the user (or an image-generation tool the user directs) to produce them, matching `docs/demo-authoring-guide.md`'s pre-production brief item 2 and the precedent of Bullet-Hell Shooter's own asset checkpoint.

**Files:**
- Create: `demo-src/dungeon-explorer/assets/player.png`
- Create: `demo-src/dungeon-explorer/assets/enemy.png`
- Create: `demo-src/dungeon-explorer/assets/boss.png`
- Create: `demo-src/dungeon-explorer/assets/key.png`
- Create: `demo-src/dungeon-explorer/assets/heart_full.png`
- Create: `demo-src/dungeon-explorer/assets/heart_empty.png`
- Copy: `demo-src/bullet-hell-shooter/assets/tilesheet.png` → `demo-src/dungeon-explorer/assets/tilesheet.png` (reused as-is, same tile size and tile IDs — no new tile art needed, per this plan's "Game design constants" section)

- [ ] **Step 1: Obtain/produce each asset to spec**

| Asset | Dimensions | Notes |
|---|---|---|
| `player.png` | 16×16 per frame, 4 frames horizontal (64×16 total) | Frame 0: idle. Frames 1–2: walk cycle (used at 6fps, looping). Frame 3: attack pose. Top-down character, no directional variants (facing is tracked internally, not shown visually — a deliberate scope cut per the design doc, not an oversight). |
| `enemy.png` | 16×16, single frame | Static sprite, no animation (matches `Mob.bas`'s existing precedent). |
| `boss.png` | 32×32, single frame | Visually larger than `enemy.png` to read as a boss at a glance. |
| `key.png` | 16×16, single frame | A simple key icon. |
| `heart_full.png` | 16×16, single frame | HUD heart icon, filled. |
| `heart_empty.png` | 16×16, single frame | HUD heart icon, outline/empty — same silhouette as `heart_full.png` so swapping between them at a fixed HUD position doesn't visibly shift. |
| `tilesheet.png` | (unchanged) | Direct copy from `demo-src/bullet-hell-shooter/assets/tilesheet.png` — do not regenerate, the exact byte-for-byte file must carry over so tile ID `1` (floor) and `45` (wall) keep the same meaning this plan's tilemap-authoring task (Task 8) depends on. |

- [ ] **Step 2: Verify**

Confirm each file exists at the correct path with the correct pixel dimensions (`file <path>` or opening each in an image viewer). `player.png` in particular must be exactly 64×16 (4 frames × 16px) — `self.addAnim(...)` calls in `Player.bas` (Task 5) assume frame indices 0–3 exist at that exact slicing.

- [ ] **Step 3: Commit**

```bash
git add demo-src/dungeon-explorer/assets/
git commit -m "feat: add Dungeon Explorer art assets"
```

---

### Task 8: [CHECKPOINT] Author the tilemap

**This task requires the user's involvement** — building `dungeon.stm` in the running app's Tilemap Editor, the same tool and workflow already used for every other demo's tilemaps.

**Files:**
- Create: `demo-src/dungeon-explorer/assets/dungeon.stm`

- [ ] **Step 1: Build the tilemap in the Tilemap Editor**

Grid: 45 columns × 22 rows, tile size 16×16, tileset image `tilesheet.png` (from Task 7 — the same file Bullet-Hell Shooter uses, so tile `1` = floor and tile `45` = wall are already the correct IDs to paint with).

1. **`floor` layer** (tile-art): fill every room's interior with tile `1`.
2. **`walls` layer** (tile-art, purely visual — matches the established pattern from Bullet-Hell Shooter, where `walls` renders the art and a separate `collision` layer defines solidity): paint tile `45` around the outer border of the whole 45×22 map, and around each room's border, EXCEPT for the connection gaps listed below (leave those cells empty/`0` on this layer so they render as open floor).
3. **`collision` layer** (kind `collision`, per `docs/superpowers/plans/2026-08-12-tilemap-collision-layer-plan.md`): paint solid exactly where `walls` has tile `45` — same footprint, mirrored — **except** the two door tiles, which must be solid on `collision` even though they render as open floor (no wall art) on `walls`. The door needs to visually look like an open doorway that's nonetheless blocked until unlocked — consider painting a distinct door-frame tile if the tileset has one, or leave it visually open as floor and rely on the collision layer alone; either is fine, use your judgment on what reads best.

**Room borders and connection gaps** (all coordinates in tiles, `(col, row)`, 0-indexed across the full 45×22 map — room `(rc, rr)`'s top-left tile is at `(rc*15, rr*11)`):

- Start `(0,0)` spans tiles `col 0–14, row 0–10`. EnemyRoom1 `(1,0)` spans `col 15–29, row 0–10`. Their shared border is column 15 (Start's right wall / EnemyRoom1's left wall) — leave a 2-tile gap around row 5 (e.g. rows 5–6) in that shared column on both `walls` and `collision`.
- KeyRoom `(2,0)` spans `col 30–44, row 0–10`. EnemyRoom1↔KeyRoom shared border is column 30 — same 2-tile gap around row 5.
- EnemyRoom2 `(0,1)` spans `col 0–14, row 11–21`. Start↔EnemyRoom2 shared border is row 11 (Start's bottom wall / EnemyRoom2's top wall) — leave a 2-tile gap around column 7 (e.g. columns 7–8).
- DoorRoom `(1,1)` spans `col 15–29, row 11–21`. EnemyRoom2↔DoorRoom shared border is column 15 — same 2-tile gap around row 16.
- BossRoom `(2,1)` spans `col 30–44, row 11–21`. **DoorRoom↔BossRoom shared border is column 30 — this is the locked door**, at rows 16–17 specifically (world pixel positions `(488, 264)` and `(488, 280)`, matching `Player.bas`'s hardcoded `collision.setTileSolid` calls from Task 5 exactly — do not use a different row pair, the code won't unlock the right tiles otherwise). This gap must be **solid on the `collision` layer** (unlike every other connection gap above), and open (no `45`) on `walls`.

- [ ] **Step 2: Place markers**

Add a `spawns`-equivalent marker layer (kind `markers`, any layer name — e.g. `markers`) with:
- Exactly **one** marker tagged `"enemy"` roughly centered in EnemyRoom1's open floor.
- Exactly **two** markers tagged `"enemy"` roughly centered in EnemyRoom2's open floor (spread apart a little so they don't spawn overlapping).
- Exactly **one** marker tagged `"enemy"` in KeyRoom, positioned so it's roughly between the entrance and the key (guarding it).
- Exactly **one** marker tagged `"key"` in KeyRoom's open floor.
- Exactly **one** marker tagged `"boss"` roughly centered in BossRoom's open floor.

`DungeonScene.bas` (Task 6) hard-assumes exactly one `"key"` marker and exactly one `"boss"` marker exist (it reads `keyMarkers(0)`/`bossMarkers(0)` directly) — placing zero or more than one of either will not crash at authoring time but WILL throw an array-index error the moment the scene runs, so double-check the count before moving on.

- [ ] **Step 3: Export**

Use the Tilemap Editor's Export feature (per `docs/demo-authoring-guide.md` Step 3.1's Path A pattern, reused here even though the rest of this demo is Path B) to produce `dungeon.stm`, and place it at `demo-src/dungeon-explorer/assets/dungeon.stm`.

- [ ] **Step 4: Commit**

```bash
git add demo-src/dungeon-explorer/assets/dungeon.stm
git commit -m "feat: add Dungeon Explorer tilemap"
```

---

### Task 9: Package and verify

**Files:**
- Create: `src/docs/demos/DungeonExplorer.b4wgl.json` (generated, not hand-edited)

- [ ] **Step 1: Compile check**

```bash
npm run check:demo -- demo-src/dungeon-explorer
```

Expected: `OK — N file(s) compiled with zero diagnostics.` If there are diagnostics, fix them before proceeding — do not move on with a broken build.

- [ ] **Step 2: Package**

```bash
npm run build:demo -- demo-src/dungeon-explorer DungeonExplorer
```

Expected: reports the file/asset counts and writes `src/docs/demos/DungeonExplorer.b4wgl.json`.

- [ ] **Step 3: Run it and verify manually**

Per `docs/demo-authoring-guide.md` Step 3, Path B's step 3 — "still required, exactly like Path A's last step": load the result into the running app (Demos page isn't wired up yet — Task 10 does that — so import the JSON directly via the app's project import, or temporarily use the Demos page flow once Task 10 lands and circle back to re-verify) and click Run. Confirm:
- Zero console `ERR` entries.
- Title screen shows, any key advances to the dungeon.
- Player can move (WASD) and attack (J) in the Start room.
- Walking through each connection gap snaps the camera to the correct next room (no visible scrolling, no black gaps or misalignment).
- Enemies chase and can be killed; taking contact damage flickers the player and reduces a heart.
- The key can be picked up; before pickup, the boss room door is impassable; after pickup, walking to the door area, the player passes through.
- The boss chases, periodically lunges, can be damaged, and defeating it switches to the win scene.
- Losing all 3 hearts switches to the game-over scene; both scenes' "press any key" returns correctly (`gameover` → `dungeon` restart, `winscene` → `title`).

If any of this doesn't work as described, this is the point to fix it — go back to the relevant earlier task's file, fix it directly (not a new task), re-run this verification from the top.

- [ ] **Step 4: Commit**

```bash
git add src/docs/demos/DungeonExplorer.b4wgl.json
git commit -m "chore: package Dungeon Explorer demo export"
```

---

### Task 10: Docs write-up + registry + nav entries

**Files:**
- Create: `src/docs/demos/dungeon-explorer.md`
- Modify: `src/features/demos/demoRegistry.ts`
- Modify: `src/docs/manifest.ts`

- [ ] **Step 1: Write `src/docs/demos/dungeon-explorer.md`**

Follow the template in `src/docs/demos/raycaster.md` exactly (required-assets table, controls, how-it-works explanation, full source of every file). Write this after Tasks 1–9 are complete and the actual shipped code/assets are final, so the write-up describes what's really there — don't write this from the plan's intentions, write it from the finished `demo-src/dungeon-explorer/` files, copying their real final content into the "full source" section.

- [ ] **Step 2: Add the `demoRegistry.ts` entry**

Read `src/features/demos/demoRegistry.ts` in full first to match its existing `DemoEntry` shape and markdown-description style exactly (see the Bullet-Hell Shooter entry, updated earlier this session, as the closest reference for tone). Add a new entry:

```ts
{
  slug: 'dungeon-explorer',
  name: 'Dungeon Explorer',
  tags: ['Scenes', 'Kinematic Movement', 'Runtime Collision', 'Tilemap Markers', 'Pathfinding'],
  description: `A room-by-room dungeon crawl: fight through two branches of enemies, find the key, and defeat the boss guarding the treasure room.

The whole dungeon is one tilemap, but the camera treats it as discrete rooms — walking off one room's edge hard-cuts the view to the next, classic-adventure-game style, instead of scrolling continuously. The boss room's door is a real \`collision\` tile, solid until \`collision.setTileSolid(x, y, false)\` opens it once the player has the key — the tilemap's collision layer is only the *starting* state, not a fixed layout.

The player moves with \`setVelocity\` (sliding cleanly along walls, automatic tile collision, no hand-rolled checks) and attacks with a short-range melee swing in whichever direction they last moved. Enemies and the boss both chase via \`pathfinding.navigateTo\`; the boss adds a periodic speed-boosted lunge on top of that. Losing all 3 hearts ends the run; defeating the boss wins it.

**Key techniques:** \`collision.setTileSolid\`/\`isTileSolid\` for a runtime-unlockable door, \`camera.setPosition\` for discrete room-snap transitions instead of continuous scrolling, \`sprite.setVelocity\` + \`collision.setupTileCollision\` for kinematic movement, \`tileMapSet.markersByTag\` for visually-placed enemies/key/boss, \`pathfinding.navigateTo\` for chase AI.

**Assets required:** \`player.png\`, \`enemy.png\`, \`boss.png\`, \`key.png\`, \`heart_full.png\`, \`heart_empty.png\`, a tileset image, one tilemap — **Controls:** WASD to move, J to attack`,
  docsSlug: 'dungeon-explorer',
  json: dungeonExplorerJson as ProjectExportJson,
},
```

Add the matching import near the top of the file (following the existing import pattern for `bulletHellShooterJson` etc.):

```ts
import dungeonExplorerJson from '../../docs/demos/DungeonExplorer.b4wgl.json';
```

- [ ] **Step 3: Add the `docs/manifest.ts` nav entry**

Read `src/docs/manifest.ts` in full first to find the `Demos` group and match the existing entry shape exactly (see the `bullet-hell-shooter` entry as the closest reference). Add:

```ts
{ slug: 'dungeon-explorer', title: 'Dungeon Explorer', file: 'demos/dungeon-explorer.md' },
```

- [ ] **Step 4: Build check**

```bash
npx vite build
```

Expected: builds cleanly — this will catch a mismatched import path or a malformed `DemoEntry` immediately.

- [ ] **Step 5: Commit**

```bash
git add src/docs/demos/dungeon-explorer.md src/features/demos/demoRegistry.ts src/docs/manifest.ts
git commit -m "docs: add Dungeon Explorer demo write-up and nav entries"
```

---

### Task 11: Cypress spec

**Files:**
- Modify: `cypress/e2e/demos.cy.ts`

Mandatory per `docs/demo-authoring-guide.md`'s production checklist — "a demo isn't done without this."

- [ ] **Step 1: Add the describe block**

Read `cypress/e2e/demos.cy.ts` in full first to confirm its current `runDemo(projectId, jsonPath, waitMs)` helper and the exact shape of an existing `describe` block (e.g. the Bullet-Hell Shooter one). Add, following that exact pattern:

```ts
describe('Demo: Dungeon Explorer', () => {
  it('runs without runtime errors', () => {
    runDemo('demo-dungeon-explorer', 'src/docs/demos/DungeonExplorer.b4wgl.json', 4000);
  });
});
```

- [ ] **Step 2: Run it**

Start the dev server (`npm run dev` in one terminal; Cypress does not start it itself), then:

```bash
npx cypress run --spec cypress/e2e/demos.cy.ts
```

Expected: all `describe` blocks in the file pass, including the new one — no `ERR` console entries when Dungeon Explorer runs. Stop the dev server after.

- [ ] **Step 3: Commit**

```bash
git add cypress/e2e/demos.cy.ts
git commit -m "test: add Cypress e2e spec for Dungeon Explorer demo"
```

---

### Task 12: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Full Vitest suite**

```bash
npx vitest run
```

Expected: all tests pass — this demo touches no engine code, so no regressions are expected anywhere, but confirm directly.

- [ ] **Step 2: Build**

```bash
npx vite build
```

Expected: builds cleanly.

- [ ] **Step 3: Full Cypress suite**

Start the dev server, then:

```bash
npx cypress run
```

Expected: every spec passes, not just `demos.cy.ts`.

- [ ] **Step 4: Manual playthrough via the Demos page**

Now that Task 10 wired it up, go through the real end-user flow: `/demos` → "Try Demo" on Dungeon Explorer → "Open in Editor" → Run. Play a full session start to finish (explore both branches, get the key, open the door, beat the boss, confirm the win scene) at least once, and separately let the player die once to confirm the game-over scene. This is the same bar `docs/demo-authoring-guide.md` sets for every demo — a passing Cypress spec proves "no crash," not "the game is actually fun/correct to play."

- [ ] **Step 5: Report and stop**

Report full results. Do not push — per `CLAUDE.md`, this needs a release-notes entry and version bump when the user asks to push (a new demo is editor/runtime-visible content, not exempt), and per this session's established pattern, confirm with the user whether anything else should land in the same push before doing so.
