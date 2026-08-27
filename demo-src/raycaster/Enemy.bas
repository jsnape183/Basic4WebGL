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
