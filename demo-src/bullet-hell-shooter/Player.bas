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
  dim newX
  dim newY
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

  if moveX <> 0 then
    newX = x + moveX * 150 * dt
    if self.level.tileAt("walls", newX, y) = 0 then
      x = newX
    endif
  endif
  if moveY <> 0 then
    newY = y + moveY * 150 * dt
    if self.level.tileAt("walls", x, newY) = 0 then
      y = newY
    endif
  endif

  self.transform.setPosition(x, y)

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
