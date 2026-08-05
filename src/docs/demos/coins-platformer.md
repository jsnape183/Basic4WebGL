# Collect the Coins: A Platformer

A three-level scrolling platformer: run, jump, dodge patrolling enemies, and collect coins across three increasingly tall levels. Your total coin count is saved to a persistent leaderboard when you win.

---

## How it works

Each level is its own `Class extends scene` (`Level1Scene`, `Level2Scene`, `Level3Scene`), built from a `tilemapset` loaded from a `.stm` file — a single "ground" layer per level in this demo, though `.stm` supports any number of named layers. The player is a `Class extends animatedsprite` with four animations (idle, run, jump, land) driven by simple polling of `input.getKeyDown()` and `input.keyPressed()` each frame.

softBASIC's `Extends` only supports single-level inheritance — a class that already extends `scene` can't itself be extended again — so the three level scenes can't share a common base class. Instead, the logic that's identical across all three (building the tilemap and camera, spawning the player and coin counter, checking coin pickups, resetting on enemy contact, the fall-through deadzone, and the level-end check) lives in **`LevelHelpers.bas`**, a plain module (no `Class` keyword) called from each scene as `levelhelpers.someFunction(...)`. Each scene keeps only what's genuinely level-specific: its `.stm` level file, spawn point, enemy patrol routes, and coin layout.

**Collision** is hand-rolled from the ground layer's `tileAt(x, y)` point-sampling — the vertical (ground) check samples just below the player's feet and snaps to the tile's top surface; the horizontal (wall) check samples the leading edge at two heights before applying movement, blocking the player rather than letting them clip into a solid block from the side.

**A deadzone** (`levelhelpers.applyDeadzone`) resets the player to the level's start if they fall more than 100px below the map — otherwise a missed jump over a gap just falls forever.

Reaching the right edge of a level calls `scenemanager.switch(...)` to the next one. `GameData` is a single shared object, constructed once in `Main.bas` and passed to every scene's constructor, so the coin count survives every scene switch. On reaching the final `WinScene`, the run's total is inserted into a small in-memory leaderboard (capped at the top 5, newest ties keeping their place) and persisted with `save.set("leaderboard", self.scores)` — so it survives a page reload. (Insertion is done by hand rather than with `array.sort()`, since that function sorts alphanumerically — correct for strings, but "20" would sort before "9".)

---

## Required assets

| Filename | What it is |
|---|---|
| `player.png` | 8×8 animated sprite, 4 frames left-to-right (idle, run, jump, land) |
| `enemy.png` | 8×8 static sprite |
| `coin.png` | 8×8 static sprite |
| `tilemap_trimmed.png` | 8×8 tileset — tile ID `3` is solid ground |
| `level1.stm` / `level2.stm` / `level3.stm` | Multi-layer tilemap data for each level (a single "ground" layer here), loaded by `tilemapset`'s constructor |

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
dim grounded
dim level
dim startX
dim startY

Constructor(x, y)
  super("player.png", 8, 8)
  self.addAnim("idle", 0, 0, 4, true)
  self.addAnim("run", 0, 1, 8, true)
  self.addAnim("jump", 2, 2, 4, false)
  self.addAnim("land", 3, 3, 4, false)
  self.vy = 0
  self.grounded = false
  self.startX = x
  self.startY = y
  self.transform.setPosition(x, y)
  self.play("idle")
  world.add(self)
EndConstructor

function setLevel(lvl)
  self.level = lvl
endfunction

function resetToStart()
  self.transform.setPosition(self.startX, self.startY)
  self.vy = 0
endfunction

function onupdate(delta)
  dim dt
  dim x
  dim y
  dim newX
  dim dir
  dim edgeX
  dim topY
  dim bottomY
  dim moving
  dim feetY
  dim tileId
  dim tileTop

  dt = delta / 1000
  x = self.transform.x()
  y = self.transform.y()
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

  if dir <> 0 then
    newX = x + dir * 50 * dt
    edgeX = newX + dir * 4
    topY = y - 3
    bottomY = y + 3
    if self.level.tileAt(edgeX, topY) = 0 and self.level.tileAt(edgeX, bottomY) = 0 then
      x = newX
    endif
  endif

  self.vy = self.vy + 400 * dt

  if input.keyPressed(32) or input.keyPressed(38) or input.keyPressed(87) then
    if self.grounded then
      self.vy = -140
      self.play("jump")
    endif
  endif

  y = y + self.vy * dt

  feetY = y + 4
  tileId = self.level.tileAt(x, feetY)
  self.grounded = false
  if tileId > 0 and self.vy >= 0 then
    tileTop = math.floor(feetY / 8) * 8
    y = tileTop - 4
    self.vy = 0
    self.grounded = true
  endif

  self.transform.setPosition(x, y)

  if self.grounded then
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

  dim ground as tilemaplayer
  ground = tm.layer("ground")
  camera.setBounds(ground.widthPx(), ground.heightPx())
  return ground
endfunction

function spawnPlayer(tm as tilemaplayer, spawnX, spawnY)
  dim p as player
  p = new Player(spawnX, spawnY)
  p.setLevel(tm)
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

Constructor(gameData)
  self.game = gameData
EndConstructor

function onenter()
  self.finished = false

  self.tilemap = levelhelpers.beginLevel("level1.stm")
  self.player = levelhelpers.spawnPlayer(self.tilemap, 16, 52)

  dim e as enemy
  e = new Enemy(150, 48, 130, 190)
  array.push(self.enemies, e)

  self.spawnCoins()

  self.coinCounter = levelhelpers.spawnCoinCounter(self.game)
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

Constructor(gameData)
  self.game = gameData
EndConstructor

function onenter()
  self.finished = false

  self.tilemap = levelhelpers.beginLevel("level2.stm")
  self.player = levelhelpers.spawnPlayer(self.tilemap, 16, 68)

  dim e as enemy
  e = new Enemy(254, 40, 254, 286)
  array.push(self.enemies, e)
  e = new Enemy(326, 56, 326, 378)
  array.push(self.enemies, e)

  self.spawnCoins()

  self.coinCounter = levelhelpers.spawnCoinCounter(self.game)
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

Constructor(gameData)
  self.game = gameData
EndConstructor

function onenter()
  self.finished = false

  self.tilemap = levelhelpers.beginLevel("level3.stm")
  self.player = levelhelpers.spawnPlayer(self.tilemap, 16, 84)

  dim e as enemy
  e = new Enemy(172, 56, 172, 216)
  array.push(self.enemies, e)
  e = new Enemy(308, 40, 308, 344)
  array.push(self.enemies, e)
  e = new Enemy(444, 72, 444, 464)
  array.push(self.enemies, e)

  self.spawnCoins()

  self.coinCounter = levelhelpers.spawnCoinCounter(self.game)
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
