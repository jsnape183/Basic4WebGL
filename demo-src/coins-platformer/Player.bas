Class
Extends animatedsprite

dim vy
dim grounded
dim wasGrounded
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
  ' Starts true, not false — the player spawns standing on the ground, and
  ' this must not read as a landing transition on the very first frame.
  self.wasGrounded = true
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
      particles.burstJumpPuff(x, y + 4)
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

  if not self.wasGrounded and self.grounded then
    particles.burstLandPuff(x, y + 4)
  endif
  self.wasGrounded = self.grounded

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
