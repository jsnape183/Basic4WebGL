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
  relAngle = angleToExit - playerAngle

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

    self.playerHealth = 100
    self.damageCooldown = 0
    self.damageFlashTimer = 0
    ' setupHud() above (this call or an earlier one) always runs before this
    ' point, so self.damageFlash already exists here on every onenter().
    self.damageFlash.setAlpha(0)
    self.flashTimer = 4
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

    if self.playerHealth < 1 then
        self.gameData.levelReached = self.level
        scenemanager.switch("gameover")
        return
    endif

    self.handleInput()
    self.castRays()

    for i = 0 to self.ENEMY_COUNT - 1
      e = self.enemies(i)
      e.update(delta / 1000, self.posX, self.posY)
      if not e.dead then
        dist = math.distance(e.x, e.y, self.posX, self.posY)
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
