Class
Extends animatedsprite

dim vy
dim wasGrounded
dim firstUpdate
dim startX
dim startY

Constructor(x, y)
  super("player.png", 8, 8)
  self.addAnim("idle", 0, 0, 4, true)
  self.addAnim("run", 0, 1, 8, true)
  self.addAnim("jump", 2, 2, 4, false)
  self.addAnim("land", 3, 3, 4, false)
  self.vy = 0
  self.wasGrounded = true
  ' isBlockedDown() is unconditionally false on an instance's very first
  ' onupdate — nothing has resolved its kinematics yet, since that runs
  ' immediately AFTER onupdate each frame (see lifecycle.js). That makes a
  ' one-time false-then-true transition inherent to every freshly-spawned
  ' grounded object: frame 1 reads not-grounded (unconfirmed), frame 2 reads
  ' grounded (now resolved) — a transition indistinguishable from a real
  ' landing unless it's explicitly skipped once, here.
  self.firstUpdate = true
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
  if grounded then
    ' A small constant downward "stick" velocity, not zero — _applyKinematics
    ' skips collision resolution entirely for an axis whose delta is exactly
    ' 0 (see collision.js), so a real zero here made isBlockedDown() flicker
    ' false the instant vx also became nonzero (i.e. while walking), which
    ' read as a fresh landing every couple of frames. A small nonzero value
    ' keeps that resolve running — and isBlockedDown() reliably true — every
    ' single frame at rest.
    self.vy = 10
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

  if self.firstUpdate then
    self.firstUpdate = false
  else
    if not self.wasGrounded and grounded then
      particles.burstLandPuff(self.transform.x(), self.transform.y() + 4)
    endif
    self.wasGrounded = grounded
  endif

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
