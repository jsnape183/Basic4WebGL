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
' also why the gun sprite and health text below stay visible -- placing
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
dim healthText as Text
dim gameOverText as Text

' Enemies
dim enemies(4) as Enemy

' Z-buffer
dim zbuffer(200)

' Movement speeds
dim moveSpeed
dim rotSpeed

Constructor()
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

    for i = 0 to 3
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
    e.transformY = -1
    return
  endif

  e.screenX = math.floor((self.RAYS / 2) * (1.0 + transformX / transformY))
  e.transformY = transformY
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
  dim order(4)
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

  for i = 0 to 3
    self.projectEnemy(self.enemies(i))
  next i

  order(0) = 0
  order(1) = 1
  order(2) = 2
  order(3) = 3
  for i = 1 to 3
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

  for i = 0 to 3
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
    for i = 0 to 3
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
    self.healthText = new Text("Health: 100",10,10)
    hud.add(self.healthText)
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

    if self.playerHealth < 1
        hud.add(self.gameOverText)
        return
    endif

    self.handleInput()
    self.castRays()

    for i = 0 to 3
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
    self.healthText.setText("Health: " + string.str(self.playerHealth))
    self.updateFlashCooldown()
endfunction

EndClass
