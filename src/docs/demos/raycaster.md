# Wolfenstein-Style Raycaster

Textured walls, a title screen, a generated maze, and ten patrolling/chasing enemies — hit detection, a HUD weapon with a particle muzzle flash, hit sparks, a death burst, a health bar, and a game-over screen. WASD to move, spacebar to fire.

---

## How it works

A raycaster fires one ray per screen column from the player's position outward into the map. For each column it asks: *how far away did this ray hit a wall?* A nearby wall fills a tall strip; a distant wall fills a short one. That height difference creates the illusion of depth.

The stepping algorithm is **DDA** (Digital Differential Analyser) — it steps from grid cell to grid cell without wasting time on empty space. Wall textures are sampled one pixel column at a time using `drawing.drawImageStrip`.

`GameScene.onenter()` calls `mazegrid.generate()` every time the game scene is entered, so the maze is different each playthrough. `MazeGrid.bas` builds it with a randomized recursive backtracker — starting from one cell, it repeatedly carves a passage to a random unvisited neighbour, backtracking when it paints itself into a corner. That process always produces a "perfect maze": exactly one path between any two open cells, fully connected, with no isolated pockets — which matters here because both enemy spawn points (`pickEnemySpawn()`) and enemy patrol targets (`Enemy.pickPatrolTarget()`) are chosen by picking a random open cell and trusting it's reachable.

Each enemy is a **billboard sprite**: its world position is projected onto the screen using a camera-plane transform (`GameScene.projectEnemy()`), the same transform the raycaster itself uses to turn world coordinates into screen ones. A **z-buffer**, filled in during `castRays()`, records each wall's distance per column, so an enemy is only drawn where it's closer to the camera than the wall behind it (`drawEnemy()`).

Getting the billboard's width right took an extra step: `drawEnemy()`'s `spriteH` (the sprite's on-screen height) is in real screen pixels, but `drawLeft`/`drawRight`/`texCol` are worked out in ray-column-index units — the same units `e.screenX` and `castRays()`'s own `col` use, where each column is `STRIP` (4) screen pixels wide. Using `spriteH` directly as a column-index width made every enemy four times too wide relative to its height, confirmed by simulating the algorithm against the real `enemy.png` before touching the code — dividing it by `STRIP` (`spriteWCols`) converts the pixel-scale height into the matching column-index scale for the width.

Firing, landing a hit, and killing an enemy all trigger an `Emitter` burst — the same particle module used by Coins Platformer, Bullet Hell Shooter, and Dungeon Explorer, but wired up differently here: this demo has no `world`/`camera` at all, so every emitter is added via `hud.add()` instead of `world.add()`, and positioned using the same projected screen coordinates the raycasting/billboard code already computes rather than world-space map coordinates. See [HUD layering](#hud-layering) below for why.

Enemies (`Enemy.bas`) patrol a nearby open cell until the player comes within `chaseRadius` (6 tiles), then switch to chasing, giving up back to patrol once the player is more than `giveUpRadius` (9 tiles) away. Movement is a straight-line step toward the current target each frame, checked against the maze one axis at a time (`tryMove()`) — the same wall-sliding trick `GameScene.handleInput()` uses for the player. This is deliberately simpler than the engine's real `pathfinding` module, which Dungeon Explorer's enemies use: `pathfinding` needs a genuine `TileMapSet` to navigate, and Raycaster has no visual tilemap at all — the maze only exists as `MazeGrid`'s flat array of wall/floor cells, walked by DDA and drawn as textured strips, never as tiles PIXI itself knows about. Straight-line movement plus per-axis wall collision is close enough over the short patrol/chase distances involved here, without needing a `TileMapSet` this demo has no other reason to build.

`Enemy.bas` also uses a getter-based interface (`isDead()`, `getX()`, `getY()`, `getScreenX()`, `getTransformY()`, `isFlashing()`, and a `setProjection()` setter) instead of letting `GameScene` read and write its fields directly. That's a workaround for a real compiler limitation: reading a field straight off an external class-typed instance (a `dim e as Enemy` local, a typed parameter, or an array element) inside a comparison or an `and`/`or` expression type-checks against the generic `Object` type rather than the field's real declared type, and fails to compile. A getter's return type is inferred correctly because it reads the field from inside its own class. The same pattern shows up in Dungeon Explorer's `Boss.isDead()` — see that file's comments for the fuller explanation.

---

## Required assets

Upload eight PNG files to your project's asset library before running:

| Filename | What it is |
|---|---|
| `wall.png` | 64×64 tileable wall texture |
| `enemy.png` | 64×64 enemy idle/walk sprite |
| `enemy_hit.png` | 64×64 enemy hit-flash frame |
| `enemy_dead.png` | 64×64 enemy death frame |
| `gun.png` | Weapon sprite for the HUD |
| `particle.png` | Small square sprite used by every `Emitter` — muzzle flash, enemy hit spark, enemy death burst |
| `healthbar_bg.png` | 1×1 pixel, stretched via `setScale` into the health bar's background |
| `healthbar_fill.png` | 1×1 pixel, stretched via `setScale` into the health bar's fill — same pattern Bullet Hell Shooter uses |

---

## Controls

| Key | Action |
|---|---|
| W | Walk forward |
| S | Walk backward |
| A | Turn left |
| D | Turn right |
| Space | Fire |
| Any key (title screen) | Start the game |

---

## Main.bas

```bas
function oninit()
  world.setPixelPerfect(true)
endfunction

dim titlescene = new TitleScene()
dim gamescene = new GameScene()

scenemanager.register("title", titlescene)
scenemanager.register("game", gamescene)
scenemanager.switch("title")
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

  self.controlsText = new Text("WASD to move   Space to fire", stage.width() / 2 - 150, stage.height() / 2)
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

function generate()
  dim i
  dim cx
  dim cy
  dim nx
  dim ny
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
```

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
dim patrolTargetX
dim patrolTargetY
dim patrolTimer
dim hitFlashTimer
dim screenX
dim transformY

Constructor(startX, startY)
  self.x = startX
  self.y = startY
  self.hp = 3
  self.dead = false
  self.state = "patrol"
  self.speed = 1.2
  self.patrolSpeed = 0.6
  self.chaseRadius = 6
  self.giveUpRadius = 9
  self.patrolTargetX = startX
  self.patrolTargetY = startY
  self.patrolTimer = 0
  self.hitFlashTimer = 0
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
  if mazegrid.getCell(math.floor(nx), math.floor(self.y)) = 0 then
    self.x = nx
  endif
  if mazegrid.getCell(math.floor(self.x), math.floor(ny)) = 0 then
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
    dx = playerX - self.x
    dy = playerY - self.y
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

EndClass
```

## GameScene.bas

```bas
Class
Extends scene

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
dim gameOverText as Text

' Enemies
' ENEMY_COUNT mirrors the array size below (dim enemies(10) as Enemy) -- the
' sized-array declaration itself needs a compile-time literal (array dims
' can't take a self.* field as their size, the same reason MazeGrid.bas's
' dim stackX(256) is a literal, not a field reference), so that one
' declaration keeps the bare 10. Every LOOP BOUND that walks the array uses
' this constant instead, so the loop bound isn't a second bare literal that
' could drift out of sync with the array's actual size.
dim ENEMY_COUNT
dim enemies(10) as Enemy

' Z-buffer
dim zbuffer(200)

' Movement speeds
dim moveSpeed
dim rotSpeed

Constructor()
  self.ENEMY_COUNT = 10
  self.STRIP = 4
  self.RAYS = 200
  self.SW = 800
  self.SH = 600
  self.SCY = 300
  self.TEXW = 64
  self.ENIW = 64
  self.flashTimer = 4
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
EndConstructor

function checkHit()
    dim aimCol = self.RAYS / 2
    dim i
    dim e as Enemy
    dim bestIndex
    dim bestDist
    dim hitX

    bestIndex = -1
    bestDist = 999999

    for i = 0 to self.ENEMY_COUNT - 1
      e = self.enemies(i)
      if not e.dead and e.getTransformY() > 0 then
        if math.abs(e.getScreenX() - aimCol) < 15 then
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
      else
        self.enemyHitEmitter.transform.setPosition(hitX, self.SCY)
        self.enemyHitEmitter.burst(8)
      endif
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
        if mazegrid.getCell(math.floor(nx), math.floor(self.posY)) = 0 then
            self.posX = nx
        endif
        if mazegrid.getCell(math.floor(self.posX), math.floor(ny)) = 0 then
            self.posY = ny
        endif
    endif

    if input.getKeyDown(83) then
        nx = self.posX - self.dirX * self.moveSpeed
        ny = self.posY - self.dirY * self.moveSpeed
        if mazegrid.getCell(math.floor(nx), math.floor(self.posY)) = 0 then
            self.posX = nx
        endif
        if mazegrid.getCell(math.floor(self.posX), math.floor(ny)) = 0 then
            self.posY = ny
        endif
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
            self.flashTimer = 4
            self.muzzleFlashEmitter.transform.setPosition(self.weaponSprite.transform.x() + self.muzzleOffsetX, self.weaponSprite.transform.y() + self.muzzleOffsetY)
            self.muzzleFlashEmitter.burst(18)
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
    drawing.drawRect(400, 150, 800, 300)

    ' Floor
    pen.setFillColor(80, 70, 55)
    drawing.drawRect(400, 450, 800, 300)

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
  dim spawn
  dim ex
  dim ey
  dim tries
  dim result(2)
  tries = 0
  spawn = mazegrid.randomOpenCell()
  ex = spawn(0) + 0.5
  ey = spawn(1) + 0.5
  while math.distance(ex, ey, self.posX, self.posY) < 8 and tries < 20
    spawn = mazegrid.randomOpenCell()
    ex = spawn(0) + 0.5
    ey = spawn(1) + 0.5
    tries = tries + 1
  endwhile
  result(0) = ex
  result(1) = ey
  return result
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
        else
          drawing.drawImageStrip("enemy.png", texCol, destX, self.SCY, self.STRIP, spriteH)
        endif
      endif
    endif
  next sc
endfunction

function renderEnemies()
  dim i
  dim j
  dim order(10)
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
    mazegrid.generate()
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
    self.muzzleFlashEmitter.setScaleOverLife(0.6, 0.08)
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

function onupdate(delta)
    dim i
    dim e as Enemy
    dim dist
    dim hpFillWidth

    if self.playerHealth < 1
        hud.add(self.gameOverText)
        return
    endif

    self.handleInput()
    self.castRays()

    for i = 0 to self.ENEMY_COUNT - 1
      e = self.enemies(i)
      e.update(delta / 1000, self.posX, self.posY)
      if not e.dead then
        dist = math.distance(e.x, e.y, self.posX, self.posY)
        if dist < 0.8 and self.damageCooldown = 0 then
          self.playerHealth = self.playerHealth - 10
          self.damageCooldown = 60
        endif
      endif
    next i
    if self.damageCooldown > 0 then
      self.damageCooldown = self.damageCooldown - 1
    endif

    self.renderEnemies()

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

---

## Key techniques

### The maze

`MazeGrid.bas` is a plain module, not a `Class` — both `GameScene` and `Enemy` need grid state and wall lookups, so it's shared rather than duplicated. `generate()` runs a randomized recursive backtracker over a 33×33 cell grid (odd coordinates are the 16×16 logical cells; even coordinates are the walls/passages between them), producing a fully-connected "perfect maze" fresh every time `GameScene.onenter()` runs. `randomOpenCell()` samples only odd coordinates, since those are exactly the cells `generate()` guarantees are open and reachable.

### DDA raycasting

`castRays` loops over 200 ray columns. For each column it:

1. Calculates a ray direction by blending the player's facing direction with the camera plane.
2. Steps through the maze grid using DDA until it hits a wall.
3. Computes the **perpendicular wall distance** — not the straight-line distance — to avoid the fisheye effect.
4. Derives how tall to draw that wall strip (`lineHeight = SH / distance`).
5. Picks the correct texture column from `wall.png` using `drawing.drawImageStrip`.
6. Stores the distance in `zbuffer(col)` for use by the enemy renderer.

### Enemy billboards

`projectEnemy` projects an enemy's world position onto the screen using the same camera-space transform the raycaster itself relies on, storing the result back onto the enemy via `setProjection()`. `drawEnemy` then draws that enemy column by column, but only for columns where the z-buffer says the wall is *farther away* than the enemy — this is what stops an enemy from appearing through walls. `renderEnemies` projects and depth-sorts all ten enemies (farthest first) before drawing them, so a closer enemy correctly overlaps one standing behind it. `drawEnemy`'s billboard width is converted from screen pixels to ray-column units via `STRIP` to fix a 4x stretch bug (see "How it works").

### Hit detection

Firing (spacebar) calls `checkHit`, which scans all ten enemies and picks the closest one that qualifies. A shot registers against a given enemy if:
- It's alive and facing the camera (`getTransformY() > 0`).
- The centre ray column is within 15 columns of its `getScreenX()`.
- The z-buffer at the centre column is deeper than the enemy (it isn't hidden behind a wall).

Each hit does 1 damage; an enemy has 3 hit points, so it takes 3 hits to kill.

### Enemy AI

Each `Enemy` patrols a randomly-chosen nearby open cell (`pickPatrolTarget`), picked within a small radius rather than maze-wide so the straight-line walk in `tryMove` actually reaches it without full pathfinding. When the player comes within `chaseRadius` (6 tiles) it switches to chasing, giving up back to patrol once the player is more than `giveUpRadius` (9 tiles) away. Movement steps straight toward the current target and checks each axis separately for wall collisions (`tryMove`) — the same wall-sliding trick used for player movement — rather than using the engine's real `pathfinding` module, which needs a genuine `TileMapSet` this demo (having no visual tilemap at all) doesn't have.

### HUD layering

The weapon sprite, the health bar (background, fill, and label), and all three particle emitters are added to `hud`, not `world`. This keeps them always on top of the 3D view, which is drawn each frame via `drawing.drawImageStrip` into the world layer.

For the emitters specifically, this isn't just a visual preference — it's required. `castRays` calls `drawing.clear()` and redraws the ceiling, floor, and every wall strip into the world container from scratch every single frame. Anything added to `world` (the normal place an `Emitter` goes in the other particle-enabled demos) would get painted over the instant the next frame's walls went up, since the freshly-redrawn strips are added after it every time. `hud` is a separate container that always renders on top of `world` regardless of what's redrawn there, which is also why the gun sprite and health bar stay visible — routing the emitters through it sidesteps the redraw entirely. There's no `camera` anywhere in this demo, so `hud`, `world`, and screen coordinates are all the same thing here, unlike in a scrolling demo where they'd diverge.

### Muzzle flash and hit particles

Three `Emitter`s are set up once in `onenter()`: `muzzleFlashEmitter`, `enemyHitEmitter`, and `enemyDeathEmitter`. `muzzleFlashEmitter.burst(18)` fires once, at the moment of the shot, positioned relative to `weaponSprite.transform` rather than an independent hardcoded screen coordinate. `Sprite` is centre-anchored, so `weaponSprite.transform.x()`/`y()` reports the centre of the underlying 256×256 `gun.png` — the muzzle opening sits at roughly (122, 36) from that image's top-left, found by locating the dark pixel cluster at the tip of the barrel, which converts to `muzzleOffsetX`/`muzzleOffsetY` of (-6, -92) from the image's centre. Tying the flash to the gun's own transform means the two can't drift out of sync if the gun's position ever changes.

`checkHit`'s hit and death bursts need a screen position, not a world one, since this demo has no camera to convert one into the other. An enemy's `getScreenX()` is a ray/column index (0 to `RAYS`), not a pixel — converting it with the same `getScreenX() * STRIP + STRIP / 2` expression `castRays`/`drawEnemy` already use for their own `destX` puts the burst exactly where the enemy sprite is actually drawn. `SCY`, the fixed vertical anchor every wall and enemy strip is centred on (there's no vertical look in this demo), is the correct burst height for the same reason.

### Getter/setter workaround for cross-instance field access

`Enemy.bas`'s `isDead()`/`getX()`/`getY()`/`getScreenX()`/`getTransformY()`/`isFlashing()`/`setProjection()` methods work around a compiler type-inference limitation on external class-typed field reads, per Dungeon Explorer's `Boss.isDead()` precedent (see "How it works").
