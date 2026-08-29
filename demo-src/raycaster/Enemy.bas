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
