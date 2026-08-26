# Collect the Coins: A Platformer

A three-level scrolling platformer: run, jump, dodge patrolling enemies, and collect coins across three increasingly tall levels. Your total coin count is saved to a persistent leaderboard when you win.

---

## How it works

Each level is its own `Class extends scene` (`Level1Scene`, `Level2Scene`, `Level3Scene`), built from a `tilemapset` loaded from a `.stm` file — a "ground" layer for tile art plus a "collision" layer for physics in this demo, though `.stm` supports any number of named layers. The player is a `Class extends animatedsprite` with four animations (idle, run, jump, land) driven by simple polling of `input.getKeyDown()` and `input.keyPressed()` each frame.

softBASIC's `Extends` only supports single-level inheritance — a class that already extends `scene` can't itself be extended again — so the three level scenes can't share a common base class. Instead, the logic that's identical across all three (building the tilemap and camera, spawning the player and coin counter, checking coin pickups, resetting on enemy contact, the fall-through deadzone, and the level-end check) lives in **`LevelHelpers.bas`**, a plain module (no `Class` keyword) called from each scene as `levelhelpers.someFunction(...)`. Each scene keeps only what's genuinely level-specific: its `.stm` level file, spawn point, enemy patrol routes, and coin layout.

**Movement and collision** use the engine's built-in kinematics: `self.setVelocity(vx, vy)` sets a stored velocity that the engine automatically applies and resolves against the level's tile grid once per frame, right after `onupdate()` returns — no manual position math needed. `collision.setupTileCollision(tm)` (called once in `levelhelpers.beginLevel`) reads the `.stm`'s "collision" layer to build that grid. Gravity is simulated by adding to a stored `vy` every frame before calling `setVelocity`; `self.isBlockedDown()` reports whether the *previous* frame's downward movement was stopped by solid ground, which is exactly "am I standing on something right now" — the basis for jump-eligibility, the landing puff's edge-detection, and the run/idle animation state. `self.isBlockedUp()` similarly stops upward velocity dead against a ceiling. Horizontal wall-blocking needs no extra code at all — the same automatic resolution that stops downward movement at the ground also stops horizontal movement at a wall.

**A deadzone** (`levelhelpers.applyDeadzone`) resets the player to the level's start if they fall more than 100px below the map — otherwise a missed jump over a gap just falls forever.

Reaching the right edge of a level calls `scenemanager.switch(...)` to the next one. `GameData` is a single shared object, constructed once in `Main.bas` and passed to every scene's constructor, so the coin count survives every scene switch. On reaching the final `WinScene`, the run's total is inserted into a small in-memory leaderboard (capped at the top 5, newest ties keeping their place) and persisted with `save.set("leaderboard", self.scores)` — so it survives a page reload. (Insertion is done by hand rather than with `array.sort()`, since that function sorts alphanumerically — correct for strings, but "20" would sort before "9".)

Particle effects (built on the `Emitter` class) fire at three moments — jumping (a small dust puff), landing (a bigger one), and reaching the end of a level (a gold burst) — via a small shared-emitter module, **`Particles.bas`**, following the same pattern as Bullet Hell Shooter's own particle integration. Each level's `onenter()` calls `particles.setup()` as its very last statement, after every other `world.add()` call — PIXI renders a container's children in the order they were added, and there's no explicit z-index anywhere in this engine, so particles created before the tilemap would render underneath it and never be seen. Reaching a level's end also needs a short delay (`finishTimer`) before the actual `scenemanager.switch(...)` — switching scenes clears the world immediately, so bursting a particle effect and switching scenes in the very same frame would destroy the burst before it ever renders a single frame.

---

## Required assets

| Filename | What it is |
|---|---|
| `player.png` | 8×8 animated sprite, 4 frames left-to-right (idle, run, jump, land) |
| `enemy.png` | 8×8 static sprite |
| `coin.png` | 8×8 static sprite |
| `tilemap_trimmed.png` | 8×8 tileset — tile ID `3` is solid ground |
| `particle.png` | 16×16 soft-edged white dot, tinted per-effect via `setColorOverLife` |
| `level1.stm` / `level2.stm` / `level3.stm` | Multi-layer tilemap data for each level — a "ground" layer for tile art and a "collision" layer for physics — loaded by `tilemapset`'s constructor |

---

## Controls

| Key | Action |
|---|---|
| Left Arrow / A | Move left |
| Right Arrow / D | Move right |
| Space / Up Arrow / W | Jump |

---

## GameData.bas

```bas
Class

dim score

Constructor()
  self.score = 0
EndConstructor

function addCoin()
  self.score = self.score + 1
endfunction

EndClass
```

## Coin.bas

```bas
Class
Extends sprite

dim collected

Constructor(x, y)
  super("coin.png")
  self.transform.setPosition(x, y)
  self.collected = false
  world.add(self)
EndConstructor

function collect()
  self.collected = true
  world.remove(self)
endfunction

EndClass
```

## CoinCounter.bas

```bas
Class
Extends text

Constructor()
  super("Coins: 0", 10, 10)
  self.setStyle(16, 255, 255, 255)
EndConstructor

function setScore(n)
  self.setText("Coins: " + string.str(n))
endfunction

EndClass
```

## Enemy.bas

```bas
Class
Extends sprite

dim minX
dim maxX
dim dir
dim speed

Constructor(x, y, minX, maxX)
  super("enemy.png")
  self.transform.setPosition(x, y)
  self.minX = minX
  self.maxX = maxX
  self.dir = 1
  self.speed = 20
  world.add(self)
EndConstructor

function onupdate(delta)
  dim dt
  dim x
  dt = delta / 1000
  x = self.transform.x()
  x = x + self.dir * self.speed * dt
  if x > self.maxX then
    x = self.maxX
    self.dir = -1
  endif
  if x < self.minX then
    x = self.minX
    self.dir = 1
  endif
  self.transform.setPosition(x, self.transform.y())
endfunction

EndClass
```

## Player.bas

```bas
Class
Extends animatedsprite

dim vy
dim wasGrounded
dim startX
dim startY

Constructor(x, y)
  super("player.png", 8, 8)
  self.addAnim("idle", 0, 0, 4, true)
  self.addAnim("run", 0, 1, 8, true)
  self.addAnim("jump", 2, 2, 4, false)
  self.addAnim("land", 3, 3, 4, false)
  self.vy = 0
  ' Starts true, not false — the player spawns standing on the ground, and
  ' this must not read as a landing transition on the very first frame.
  self.wasGrounded = true
  self.startX = x
  self.startY = y
  self.transform.setPosition(x, y)
  self.play("idle")
  world.add(self)
EndConstructor

function resetToStart()
  self.transform.setPosition(self.startX, self.startY)
  self.vy = 0
  self.setVelocity(0, 0)
endfunction

function onupdate(delta)
  dim dt
  dim dir
  dim moving
  dim grounded

  dt = delta / 1000
  moving = false
  dir = 0

  if input.getKeyDown(37) or input.getKeyDown(65) then
    dir = -1
    moving = true
    self.setFlip(true, false)
  endif
  if input.getKeyDown(39) or input.getKeyDown(68) then
    dir = 1
    moving = true
    self.setFlip(false, false)
  endif

  ' isBlockedDown()/isBlockedUp() reflect the *previous* frame's kinematics
  ' resolve (setVelocity's movement is applied automatically after onupdate
  ' returns — see collision.js's _applyKinematics) — i.e. "was I resting on
  ' something as of last frame," which is exactly "am I grounded right now."
  grounded = self.isBlockedDown()

  self.vy = self.vy + 400 * dt
  if grounded and self.vy > 0 then
    self.vy = 0
  endif
  if self.isBlockedUp() and self.vy < 0 then
    self.vy = 0
  endif

  if input.keyPressed(32) or input.keyPressed(38) or input.keyPressed(87) then
    if grounded then
      self.vy = -140
      self.play("jump")
      particles.burstJumpPuff(self.transform.x(), self.transform.y() + 4)
    endif
  endif

  self.setVelocity(dir * 50, self.vy)

  if not self.wasGrounded and grounded then
    particles.burstLandPuff(self.transform.x(), self.transform.y() + 4)
  endif
  self.wasGrounded = grounded

  if grounded then
    if moving then
      if not self.isPlaying("run") then
        self.play("run")
      endif
    else
      if not self.isPlaying("idle") then
        self.play("idle")
      endif
    endif
  endif
endfunction

EndClass

```

## LevelHelpers.bas

A plain module (no `Class` keyword) — logic shared by all three level scenes.

```bas
function beginLevel(stmFile)
  world.setBackground(20, 20, 40)
  camera.setZoom(4)

  dim tm as tilemapset
  tm = new tilemapset(stmFile)
  world.add(tm)
  collision.setupTileCollision(tm)

  dim ground as tilemaplayer
  ground = tm.layer("ground")
  camera.setBounds(ground.widthPx(), ground.heightPx())
  return ground
endfunction

function spawnPlayer(spawnX, spawnY)
  dim p as player
  p = new Player(spawnX, spawnY)
  return p
endfunction

function spawnCoinCounter(game as gamedata)
  dim counter as coincounter
  counter = new CoinCounter()
  counter.setScore(game.score)
  hud.add(counter)
  return counter
endfunction

function checkCoin(c as coin, player as player)
  if not c.collected then
    if collision.spriteCollide(player, c) then
      c.collect()
      return true
    endif
  endif
  return false
endfunction

function collectCoins(coins() as coin, player as player, game as gamedata, coinCounter as coincounter)
  dim i
  dim gotCoin
  for i = 0 to array.arrLength(coins) - 1
    gotCoin = checkCoin(coins(i), player)
    if gotCoin then
      game.addCoin()
      coinCounter.setScore(game.score)
    endif
  next i
endfunction

function resetOnEnemyCollision(player as player, enemies() as enemy)
  dim i
  for i = 0 to array.arrLength(enemies) - 1
    if collision.spriteCollide(player, enemies(i)) then
      player.resetToStart()
    endif
  next i
endfunction

function applyDeadzone(player as player, tm as tilemaplayer)
  if player.transform.y() > tm.heightPx() + 100 then
    player.resetToStart()
  endif
endfunction

function reachedLevelEnd(player as player, tm as tilemaplayer)
  return player.transform.x() > tm.widthPx() - 16
endfunction

```

## Particles.bas

```bas
' demo-src/coins-platformer/Particles.bas
dim jumpPuffEmitter as Emitter
dim landPuffEmitter as Emitter
dim levelCompleteEmitter as Emitter

function setup()
  jumpPuffEmitter = new Emitter("particle.png")
  jumpPuffEmitter.setLifetime(0.25, 0.35)
  jumpPuffEmitter.setSpeed(20, 40)
  jumpPuffEmitter.setDirection(0, 360)
  jumpPuffEmitter.setGravity(0, 40)
  jumpPuffEmitter.setScaleOverLife(0.6, 0.1)
  jumpPuffEmitter.setAlphaOverLife(0.8, 0)
  jumpPuffEmitter.setColorOverLife(13811350, 9205850)
  jumpPuffEmitter.setMaxParticles(40)
  world.add(jumpPuffEmitter)

  landPuffEmitter = new Emitter("particle.png")
  landPuffEmitter.setLifetime(0.3, 0.45)
  landPuffEmitter.setSpeed(30, 70)
  landPuffEmitter.setDirection(0, 360)
  landPuffEmitter.setGravity(0, 60)
  landPuffEmitter.setScaleOverLife(0.9, 0.1)
  landPuffEmitter.setAlphaOverLife(0.9, 0)
  landPuffEmitter.setColorOverLife(13811350, 9205850)
  landPuffEmitter.setMaxParticles(60)
  world.add(landPuffEmitter)

  levelCompleteEmitter = new Emitter("particle.png")
  levelCompleteEmitter.setLifetime(0.6, 1)
  levelCompleteEmitter.setSpeed(60, 160)
  levelCompleteEmitter.setDirection(0, 360)
  levelCompleteEmitter.setGravity(0, 150)
  levelCompleteEmitter.setScaleOverLife(1.2, 0.1)
  levelCompleteEmitter.setAlphaOverLife(1, 0)
  levelCompleteEmitter.setColorOverLife(16766720, 16747520)
  levelCompleteEmitter.setMaxParticles(100)
  world.add(levelCompleteEmitter)
endfunction

function burstJumpPuff(x, y)
  jumpPuffEmitter.transform.setPosition(x, y)
  jumpPuffEmitter.burst(4)
endfunction

function burstLandPuff(x, y)
  landPuffEmitter.transform.setPosition(x, y)
  landPuffEmitter.burst(10)
endfunction

function burstLevelComplete(x, y)
  levelCompleteEmitter.transform.setPosition(x, y)
  levelCompleteEmitter.burst(20)
endfunction
```

---

## Level1Scene.bas

```bas
Class extends scene

dim tilemap
dim player
dim enemies(0)
dim coins(0)
dim coinCounter
dim game
dim finished
dim finishTimer

Constructor(gameData)
  self.game = gameData
EndConstructor

function onenter()
  self.finished = false
  self.finishTimer = 0

  self.tilemap = levelhelpers.beginLevel("level1.stm")
  self.player = levelhelpers.spawnPlayer(16, 52)

  dim e as enemy
  e = new Enemy(150, 48, 130, 190)
  array.push(self.enemies, e)

  self.spawnCoins()

  self.coinCounter = levelhelpers.spawnCoinCounter(self.game)

  ' Added after every other world.add() call above so particle bursts render
  ' on top of the tilemap, player, enemies, and coins (see Bullet Hell
  ' Shooter's Particles.bas for why this ordering matters).
  particles.setup()
endfunction

function spawnCoins()
  dim c as coin
  c = new Coin(40, 48)
  array.push(self.coins, c)
  c = new Coin(80, 48)
  array.push(self.coins, c)
  c = new Coin(110, 48)
  array.push(self.coins, c)
  c = new Coin(136, 48)
  array.push(self.coins, c)
  c = new Coin(184, 32)
  array.push(self.coins, c)
  c = new Coin(220, 48)
  array.push(self.coins, c)
  c = new Coin(300, 48)
  array.push(self.coins, c)
endfunction

function onupdate(delta)
  camera.follow(self.player, 0.1)

  levelhelpers.resetOnEnemyCollision(self.player, self.enemies)
  levelhelpers.applyDeadzone(self.player, self.tilemap)
  levelhelpers.collectCoins(self.coins, self.player, self.game, self.coinCounter)

  if not self.finished then
    if levelhelpers.reachedLevelEnd(self.player, self.tilemap) then
      self.finished = true
      particles.burstLevelComplete(self.player.transform.x(), self.player.transform.y())
    endif
  else
    self.finishTimer = self.finishTimer + delta / 1000
    if self.finishTimer >= 0.6 then
      scenemanager.switch("level2")
    endif
  endif
endfunction

EndClass

```

## Level2Scene.bas

```bas
Class extends scene

dim tilemap
dim player
dim enemies(0)
dim coins(0)
dim coinCounter
dim game
dim finished
dim finishTimer

Constructor(gameData)
  self.game = gameData
EndConstructor

function onenter()
  self.finished = false
  self.finishTimer = 0

  self.tilemap = levelhelpers.beginLevel("level2.stm")
  self.player = levelhelpers.spawnPlayer(16, 68)

  dim e as enemy
  e = new Enemy(254, 40, 254, 286)
  array.push(self.enemies, e)
  e = new Enemy(326, 56, 326, 378)
  array.push(self.enemies, e)

  self.spawnCoins()

  self.coinCounter = levelhelpers.spawnCoinCounter(self.game)

  ' Added after every other world.add() call above so particle bursts render
  ' on top of the tilemap, player, enemies, and coins (see Bullet Hell
  ' Shooter's Particles.bas for why this ordering matters).
  particles.setup()
endfunction

function spawnCoins()
  dim c as coin
  c = new Coin(44, 64)
  array.push(self.coins, c)
  c = new Coin(124, 56)
  array.push(self.coins, c)
  c = new Coin(188, 40)
  array.push(self.coins, c)
  c = new Coin(212, 16)
  array.push(self.coins, c)
  c = new Coin(268, 40)
  array.push(self.coins, c)
  c = new Coin(348, 56)
  array.push(self.coins, c)
  c = new Coin(420, 64)
  array.push(self.coins, c)
  c = new Coin(460, 64)
  array.push(self.coins, c)
endfunction

function onupdate(delta)
  camera.follow(self.player, 0.1)

  levelhelpers.resetOnEnemyCollision(self.player, self.enemies)
  levelhelpers.applyDeadzone(self.player, self.tilemap)
  levelhelpers.collectCoins(self.coins, self.player, self.game, self.coinCounter)

  if not self.finished then
    if levelhelpers.reachedLevelEnd(self.player, self.tilemap) then
      self.finished = true
      particles.burstLevelComplete(self.player.transform.x(), self.player.transform.y())
    endif
  else
    self.finishTimer = self.finishTimer + delta / 1000
    if self.finishTimer >= 0.6 then
      scenemanager.switch("level3")
    endif
  endif
endfunction

EndClass

```

## Level3Scene.bas

```bas
Class extends scene

dim tilemap
dim player
dim enemies(0)
dim coins(0)
dim coinCounter
dim game
dim finished
dim finishTimer

Constructor(gameData)
  self.game = gameData
EndConstructor

function onenter()
  self.finished = false
  self.finishTimer = 0

  self.tilemap = levelhelpers.beginLevel("level3.stm")
  self.player = levelhelpers.spawnPlayer(16, 84)

  dim e as enemy
  e = new Enemy(172, 56, 172, 216)
  array.push(self.enemies, e)
  e = new Enemy(308, 40, 308, 344)
  array.push(self.enemies, e)
  e = new Enemy(444, 72, 444, 464)
  array.push(self.enemies, e)

  self.spawnCoins()

  self.coinCounter = levelhelpers.spawnCoinCounter(self.game)

  ' Added after every other world.add() call above so particle bursts render
  ' on top of the tilemap, player, enemies, and coins (see Bullet Hell
  ' Shooter's Particles.bas for why this ordering matters).
  particles.setup()
endfunction

function spawnCoins()
  dim c as coin
  c = new Coin(36, 80)
  array.push(self.coins, c)
  c = new Coin(116, 72)
  array.push(self.coins, c)
  c = new Coin(196, 56)
  array.push(self.coins, c)
  c = new Coin(260, 40)
  array.push(self.coins, c)
  c = new Coin(260, 16)
  array.push(self.coins, c)
  c = new Coin(324, 40)
  array.push(self.coins, c)
  c = new Coin(396, 56)
  array.push(self.coins, c)
  c = new Coin(452, 72)
  array.push(self.coins, c)
  c = new Coin(516, 80)
  array.push(self.coins, c)
  c = new Coin(540, 80)
  array.push(self.coins, c)
endfunction

function onupdate(delta)
  camera.follow(self.player, 0.1)

  levelhelpers.resetOnEnemyCollision(self.player, self.enemies)
  levelhelpers.applyDeadzone(self.player, self.tilemap)
  levelhelpers.collectCoins(self.coins, self.player, self.game, self.coinCounter)

  if not self.finished then
    if levelhelpers.reachedLevelEnd(self.player, self.tilemap) then
      self.finished = true
      particles.burstLevelComplete(self.player.transform.x(), self.player.transform.y())
    endif
  else
    self.finishTimer = self.finishTimer + delta / 1000
    if self.finishTimer >= 0.6 then
      scenemanager.switch("winscene")
    endif
  endif
endfunction

EndClass

```

## WinScene.bas

```bas
Class extends scene

dim game
dim scores(0)

Constructor(gameData)
  self.game = gameData
EndConstructor

function onenter()
  world.setBackground(20, 20, 40)
  camera.setZoom(1)

  dim finalScore
  finalScore = self.game.score

  self.loadScores()
  self.insertScore(finalScore)
  self.trimScores()
  save.set("leaderboard", self.scores)

  self.showResults(finalScore)
endfunction

function loadScores()
  if save.exists("leaderboard") then
    self.scores = save.get("leaderboard")
  else
    dim empty(0)
    self.scores = empty
  endif
endfunction

function insertScore(score)
  dim result(0)
  dim i
  dim inserted
  inserted = false
  for i = 0 to array.arrLength(self.scores) - 1
    if not inserted and score >= self.scores(i) then
      array.push(result, score)
      inserted = true
    endif
    array.push(result, self.scores(i))
  next i
  if not inserted then
    array.push(result, score)
  endif
  self.scores = result
endfunction

function trimScores()
  dim top(0)
  dim i
  dim limit
  limit = array.arrLength(self.scores)
  if limit > 5 then
    limit = 5
  endif
  for i = 0 to limit - 1
    array.push(top, self.scores(i))
  next i
  self.scores = top
endfunction

function showResults(finalScore)
  dim title as text
  title = new text("You Win!", 220, 60)
  title.setStyle(28, 255, 215, 0)
  hud.add(title)

  dim scoreLine as text
  scoreLine = new text("Coins collected: " + string.str(finalScore), 220, 110)
  scoreLine.setStyle(18, 255, 255, 255)
  hud.add(scoreLine)

  dim heading as text
  heading = new text("Leaderboard", 220, 150)
  heading.setStyle(18, 255, 255, 255)
  hud.add(heading)

  dim i
  dim y
  dim line as text
  y = 180
  for i = 0 to array.arrLength(self.scores) - 1
    line = new text(string.str(i + 1) + ". " + string.str(self.scores(i)), 220, y)
    line.setStyle(14, 255, 255, 255)
    hud.add(line)
    y = y + 22
  next i
endfunction

EndClass
```

## Main.bas

```bas
function oninit()
  world.setPixelPerfect(true)
endfunction

dim game = new GameData()
dim level1 = new Level1Scene(game)
dim level2 = new Level2Scene(game)
dim level3 = new Level3Scene(game)
dim winscene = new WinScene(game)

scenemanager.register("level1", level1)
scenemanager.register("level2", level2)
scenemanager.register("level3", level3)
scenemanager.register("winscene", winscene)
scenemanager.switch("level1")
```
