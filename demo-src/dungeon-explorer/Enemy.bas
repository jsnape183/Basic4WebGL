Class
Extends sprite

dim hp
dim dead
dim chaseTarget as sprite
dim damageCooldown
dim speed
dim state
dim chaseRadius
dim giveUpRadius
dim spawnX
dim spawnY
dim patrolTargetX
dim patrolTargetY
dim patrolSpeed
dim patrolLegTimer
dim knockbackTimer
dim knockbackX
dim knockbackY
dim attackRange
dim attackWindupTimer
dim lastHitSwingId
dim hitFlashTimer
dim hitFlashTickTimer
dim hitFlashOn

Constructor(x, y, targetRef as sprite)
  super("enemy.png")
  self.transform.setPosition(x, y)
  self.hp = 30
  self.dead = false
  self.chaseTarget = targetRef
  self.damageCooldown = 0
  self.speed = 40
  self.state = "patrol"
  self.chaseRadius = 70
  self.giveUpRadius = 110
  self.spawnX = x
  self.spawnY = y
  self.patrolTargetX = x
  self.patrolTargetY = y
  self.patrolSpeed = 20
  self.knockbackTimer = 0
  self.knockbackX = 0
  self.knockbackY = 0
  self.attackRange = 18
  self.attackWindupTimer = 0
  self.lastHitSwingId = -1
  self.hitFlashTimer = 0
  self.hitFlashTickTimer = 0
  self.hitFlashOn = false
  self.pickPatrolLeg()
EndConstructor

function pickPatrolLeg()
  dim dir
  dim offsetX
  dim offsetY
  dir = math.randomint(4)
  offsetX = 0
  offsetY = 0
  if dir = 0 then : offsetX = 32 : endif
  if dir = 1 then : offsetX = -32 : endif
  if dir = 2 then : offsetY = 32 : endif
  if dir = 3 then : offsetY = -32 : endif

  if self.patrolTargetX = self.spawnX and self.patrolTargetY = self.spawnY then
    self.patrolTargetX = self.spawnX + offsetX
    self.patrolTargetY = self.spawnY + offsetY
  else
    self.patrolTargetX = self.spawnX
    self.patrolTargetY = self.spawnY
  endif
  self.patrolLegTimer = 1.5
endfunction

function beginAttack()
  ' Telegraphs the hit instead of dealing contact damage the instant the
  ' enemy touches the player: puff up over 0.35s (a tween scale pulse,
  ' 1x -> 1.4x -> 1x), standing still the whole time, and only actually
  ' land the hit -- checked fresh, not assumed -- once the windup ends.
  ' Gives the player a real, visible window to back off in response,
  ' rather than being punished for contact they had no warning about.
  '
  ' Every keyframe below sets position explicitly, even though this
  ' sequence is only ever meant to animate scale -- tween.js applies
  ' every channel unconditionally each frame, and Keyframe's x/y default
  ' to (0,0), so skipping setPosition here snaps the enemy straight to
  ' the world origin the instant the windup starts. Hit this exact bug
  ' live (confirmed by direct position logging, not assumed) before
  ' fixing it -- the same mistake Player.bas's own spin tween made and
  ' had already been fixed for, just repeated here in a new tween.
  dim px
  dim py
  dim k1 as Keyframe
  dim k2 as Keyframe
  dim k3 as Keyframe
  dim frames(0)

  px = self.transform.x()
  py = self.transform.y()

  self.state = "attack"
  self.attackWindupTimer = 0.35
  self.setVelocity(0, 0)

  k1 = new Keyframe()
  k1.setTime(0)
  k1.setScaleX(1)
  k1.setScaleY(1)
  k1.setPosition(px, py)

  k2 = new Keyframe()
  k2.setTime(0.2)
  k2.setScaleX(1.4)
  k2.setScaleY(1.4)
  k2.setPosition(px, py)

  k3 = new Keyframe()
  k3.setTime(0.35)
  k3.setPosition(px, py)
  k3.setScaleX(1)
  k3.setScaleY(1)

  array.push(frames, k1)
  array.push(frames, k2)
  array.push(frames, k3)

  tween.play(self, frames, false)
endfunction

function onupdate(delta)
  if not self.dead then
    dim dt
    dim dist
    dt = delta / 1000

    if self.damageCooldown > 0 then
      self.damageCooldown = self.damageCooldown - dt
    endif

    ' Hit flash driven by hand, the same way Player's own invincibility
    ' flicker is, rather than by tween -- tween writes position every frame
    ' it's active (see the comments throughout this file's tween usage), and
    ' a hit is exactly the moment this enemy also gets knocked back via
    ' setVelocity below. A tween-driven flash here would freeze that
    ' knockback solid for the flash's duration, the same bug this attack's
    ' hit detection already went through twice with the player's own
    ' movement. A plain timer has no such conflict.
    if self.hitFlashTimer > 0 then
      self.hitFlashTimer = self.hitFlashTimer - dt
      self.hitFlashTickTimer = self.hitFlashTickTimer - dt
      if self.hitFlashTimer <= 0 then
        self.hitFlashOn = false
        self.setAlpha(1)
      elseif self.hitFlashTickTimer <= 0 then
        self.hitFlashTickTimer = 0.06
        if self.hitFlashOn then
          self.hitFlashOn = false
          self.setAlpha(1)
        else
          self.hitFlashOn = true
          self.setAlpha(0.3)
        endif
      endif
    endif

    if self.knockbackTimer > 0 then
      self.knockbackTimer = self.knockbackTimer - dt
      pathfinding.stopNavigating(self)
      self.setVelocity(self.knockbackX * 130, self.knockbackY * 130)
    elseif self.state = "attack" then
      self.attackWindupTimer = self.attackWindupTimer - dt
      if self.attackWindupTimer <= 0 then
        ' Re-checked fresh, not assumed still true from when the windup
        ' started -- backing away during the telegraph avoids the hit.
        if collision.spriteCollide(self, self.chaseTarget) then
          self.chaseTarget.takeDamage()
          self.damageCooldown = 0.5
        endif
        self.state = "chase"
      endif
    else
      ' pathfinding.navigateTo moves the sprite directly (it doesn't use
      ' setVelocity), so nothing else ever clears the knockback velocity
      ' set above once the timer expires -- without this, the kinematic
      ' collision system (which DOES read setVelocity, independently of
      ' pathfinding) kept applying that last knockback push every frame
      ' forever, pinning the enemy against whatever wall it reached
      ' instead of actually stopping. Confirmed live: velocity was still
      ' exactly the knockback value dozens of frames after the timer hit
      ' zero.
      self.setVelocity(0, 0)

      dist = math.distance(self.transform.x(), self.transform.y(), self.chaseTarget.transform.x(), self.chaseTarget.transform.y())

      if self.state = "patrol" then
        if dist <= self.chaseRadius then
          self.state = "chase"
        endif
      else
        if dist > self.giveUpRadius then
          self.state = "patrol"
          self.pickPatrolLeg()
        endif
      endif

      if self.state = "chase" then
        if dist <= self.attackRange and self.damageCooldown <= 0 then
          self.beginAttack()
        else
          pathfinding.navigateTo(self, self.chaseTarget.transform.x(), self.chaseTarget.transform.y(), self.speed)
        endif
      else
        self.patrolLegTimer = self.patrolLegTimer - dt
        if self.patrolLegTimer <= 0 then
          self.pickPatrolLeg()
        endif
        pathfinding.navigateTo(self, self.patrolTargetX, self.patrolTargetY, self.patrolSpeed)
      endif
    endif
  endif
endfunction

function hit(damage, swingId)
  ' swingId guards against the same swing hitting this enemy more than once
  ' now that Player checks collision every frame the sword is active (see
  ' Player.onupdate) rather than at a single instant -- without it, standing
  ' inside the hitbox for several consecutive frames of one swing would
  ' apply damage every one of those frames instead of just once.
  if not self.dead and self.lastHitSwingId <> swingId then
    self.lastHitSwingId = swingId
    self.hp = self.hp - damage
    particles.burstHitSpark(self.transform.x() + 8, self.transform.y() + 8)
    if self.hp <= 0 then
      self.dead = true
      particles.burstEnemyDeath(self.transform.x() + 8, self.transform.y() + 8)
      world.remove(self)
    else
      ' A hit lands while mid-windup, knockback takes over next frame
      ' (checked first in onupdate) and interrupts the attack -- stop the
      ' pulse tween and reset scale explicitly, or a hit landed partway
      ' through the puff-up would leave the enemy stuck oversized.
      if self.state = "attack" then
        tween.stop(self)
        self.setScale(1, 1)
      endif
      self.hitFlashTimer = 0.18
      self.hitFlashTickTimer = 0
      self.hitFlashOn = false
      self.state = "chase"
      self.knockbackX = math.normalizeX(self.transform.x() - self.chaseTarget.transform.x(), self.transform.y() - self.chaseTarget.transform.y())
      self.knockbackY = math.normalizeY(self.transform.x() - self.chaseTarget.transform.x(), self.transform.y() - self.chaseTarget.transform.y())
      self.knockbackTimer = 0.15
    endif
  endif
endfunction

EndClass
