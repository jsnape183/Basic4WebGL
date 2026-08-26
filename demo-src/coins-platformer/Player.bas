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
