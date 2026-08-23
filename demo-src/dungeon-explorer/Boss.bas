Class
Extends sprite

dim hp
dim dead
dim chaseTarget as sprite
dim damageCooldown
dim baseSpeed
dim lungeSpeed
dim attackTimer
dim lungeTimer
dim windupTimer
dim knockbackTimer
dim knockbackX
dim knockbackY
dim lastHitSwingId
dim hitFlashTimer
dim hitFlashTickTimer
dim hitFlashOn

Constructor(x, y, targetRef as sprite)
  super("boss.png")
  self.transform.setPosition(x, y)
  self.hp = 120
  self.dead = false
  self.chaseTarget = targetRef
  self.damageCooldown = 0
  self.baseSpeed = 40
  self.lungeSpeed = 140
  self.attackTimer = 2.5
  self.lungeTimer = 0
  self.windupTimer = 0
  self.knockbackTimer = 0
  self.knockbackX = 0
  self.knockbackY = 0
  self.lastHitSwingId = -1
  self.hitFlashTimer = 0
  self.hitFlashTickTimer = 0
  self.hitFlashOn = false
EndConstructor

function beginWindup()
  ' Same telegraph pattern as the regular enemies' attack windup: pulse
  ' scale over 0.3s, standing still, before the actual lunge fires. The
  ' boss previously had zero warning before a 4x-speed lunge -- unfair
  ' by the standard the rest of this demo now holds itself to. Every
  ' keyframe sets position explicitly for the same reason Enemy.bas's
  ' equivalent does: tween applies every channel unconditionally each
  ' frame, and an unset position defaults to (0,0).
  dim px
  dim py
  dim k1 as Keyframe
  dim k2 as Keyframe
  dim k3 as Keyframe
  dim frames(0)

  px = self.transform.x()
  py = self.transform.y()

  self.windupTimer = 0.3
  self.setVelocity(0, 0)

  k1 = new Keyframe()
  k1.setTime(0)
  k1.setScaleX(1)
  k1.setScaleY(1)
  k1.setPosition(px, py)

  k2 = new Keyframe()
  k2.setTime(0.15)
  k2.setScaleX(1.25)
  k2.setScaleY(1.25)
  k2.setPosition(px, py)

  k3 = new Keyframe()
  k3.setTime(0.3)
  k3.setScaleX(1)
  k3.setScaleY(1)
  k3.setPosition(px, py)

  array.push(frames, k1)
  array.push(frames, k2)
  array.push(frames, k3)

  tween.play(self, frames, false)
endfunction

function onupdate(delta)
  if not self.dead then
    dim dt
    dim currentSpeed
    dt = delta / 1000

    if self.damageCooldown > 0 then
      self.damageCooldown = self.damageCooldown - dt
    endif

    ' Hit flash driven by hand, the same way Player's own invincibility
    ' flicker is, rather than by tween -- tween writes position every frame
    ' it's active, and a hit is exactly the moment the boss also gets
    ' knocked back via setVelocity below. A tween-driven flash here would
    ' freeze that knockback solid for the flash's duration, the same bug
    ' this attack's hit detection already went through twice with the
    ' player's own movement. A plain timer has no such conflict.
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
      self.setVelocity(self.knockbackX * 80, self.knockbackY * 80)
    elseif self.windupTimer > 0 then
      self.windupTimer = self.windupTimer - dt
      pathfinding.stopNavigating(self)
      self.setVelocity(0, 0)
      if self.windupTimer <= 0 then
        self.lungeTimer = 0.6
      endif
    else
      if self.lungeTimer > 0 then
        self.lungeTimer = self.lungeTimer - dt
        currentSpeed = self.lungeSpeed
      else
        self.attackTimer = self.attackTimer - dt
        if self.attackTimer <= 0 then
          self.attackTimer = 2.5
          self.beginWindup()
        endif
        currentSpeed = self.baseSpeed
      endif

      pathfinding.navigateTo(self, self.chaseTarget.transform.x(), self.chaseTarget.transform.y(), currentSpeed)

      if collision.spriteCollide(self, self.chaseTarget) then
        if self.damageCooldown <= 0 then
          self.chaseTarget.takeDamage()
          self.damageCooldown = 0.6
        endif
      endif
    endif
  endif
endfunction

function hit(damage, swingId)
  ' swingId guards against the same swing hitting the boss more than once
  ' now that Player checks collision every frame the sword is active (see
  ' Player.onupdate) rather than at a single instant -- without it, standing
  ' inside the hitbox for several consecutive frames of one swing would
  ' apply damage every one of those frames instead of just once.
  if not self.dead and self.lastHitSwingId <> swingId then
    self.lastHitSwingId = swingId
    self.hp = self.hp - damage
    if self.hp <= 0 then
      self.dead = true
      world.remove(self)
      scenemanager.switch("winscene")
    else
      ' Mirrors Enemy.bas: knock the boss back so a successful hit buys
      ' breathing room, and cleanly cancel an in-progress windup pulse
      ' (stop the tween, reset scale) rather than leaving it stuck
      ' mid-puff if the hit interrupts it.
      if self.windupTimer > 0 then
        tween.stop(self)
        self.setScale(1, 1)
        self.windupTimer = 0
      endif
      self.hitFlashTimer = 0.18
      self.hitFlashTickTimer = 0
      self.hitFlashOn = false
      self.knockbackX = math.normalizeX(self.transform.x() - self.chaseTarget.transform.x(), self.transform.y() - self.chaseTarget.transform.y())
      self.knockbackY = math.normalizeY(self.transform.x() - self.chaseTarget.transform.x(), self.transform.y() - self.chaseTarget.transform.y())
      self.knockbackTimer = 0.15
    endif
  endif
endfunction

EndClass
