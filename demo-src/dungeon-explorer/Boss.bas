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

Constructor(x, y, targetRef as sprite)
  super("boss.png")
  self.transform.setPosition(x, y)
  self.hp = 150
  self.dead = false
  self.chaseTarget = targetRef
  self.damageCooldown = 0
  self.baseSpeed = 40
  self.lungeSpeed = 160
  self.attackTimer = 2.5
  self.lungeTimer = 0
EndConstructor

function onupdate(delta)
  if not self.dead then
    dim dt
    dim currentSpeed
    dt = delta / 1000

    if self.lungeTimer > 0 then
      self.lungeTimer = self.lungeTimer - dt
      currentSpeed = self.lungeSpeed
    else
      self.attackTimer = self.attackTimer - dt
      if self.attackTimer <= 0 then
        self.attackTimer = 2.5
        self.lungeTimer = 0.6
      endif
      currentSpeed = self.baseSpeed
    endif

    pathfinding.navigateTo(self, self.chaseTarget.transform.x(), self.chaseTarget.transform.y(), currentSpeed)

    if self.damageCooldown > 0 then
      self.damageCooldown = self.damageCooldown - dt
    endif

    if collision.spriteCollide(self, self.chaseTarget) then
      if self.damageCooldown <= 0 then
        self.chaseTarget.takeDamage()
        self.damageCooldown = 0.5
      endif
    endif
  endif
endfunction

function hit(damage)
  if not self.dead then
    self.hp = self.hp - damage
    if self.hp <= 0 then
      self.dead = true
      world.remove(self)
      scenemanager.switch("winscene")
    endif
  endif
endfunction

EndClass
