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

Constructor(x, y, targetRef as sprite)
  super("enemy.png")
  self.transform.setPosition(x, y)
  self.hp = 30
  self.dead = false
  self.chaseTarget = targetRef
  self.damageCooldown = 0
  self.speed = 50
  self.state = "patrol"
  self.chaseRadius = 70
  self.giveUpRadius = 110
  self.spawnX = x
  self.spawnY = y
  self.patrolTargetX = x
  self.patrolTargetY = y
  self.patrolSpeed = 25
  self.knockbackTimer = 0
  self.knockbackX = 0
  self.knockbackY = 0
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

function onupdate(delta)
  if not self.dead then
    dim dt
    dim dist
    dt = delta / 1000

    if self.damageCooldown > 0 then
      self.damageCooldown = self.damageCooldown - dt
    endif

    if self.knockbackTimer > 0 then
      self.knockbackTimer = self.knockbackTimer - dt
      pathfinding.stopNavigating(self)
      self.setVelocity(self.knockbackX * 90, self.knockbackY * 90)
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
        pathfinding.navigateTo(self, self.chaseTarget.transform.x(), self.chaseTarget.transform.y(), self.speed)
      else
        self.patrolLegTimer = self.patrolLegTimer - dt
        if self.patrolLegTimer <= 0 then
          self.pickPatrolLeg()
        endif
        pathfinding.navigateTo(self, self.patrolTargetX, self.patrolTargetY, self.patrolSpeed)
      endif

      if collision.spriteCollide(self, self.chaseTarget) then
        if self.damageCooldown <= 0 then
          self.chaseTarget.takeDamage()
          self.damageCooldown = 0.5
        endif
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
    else
      self.state = "chase"
      self.knockbackX = math.normalizeX(self.transform.x() - self.chaseTarget.transform.x(), self.transform.y() - self.chaseTarget.transform.y())
      self.knockbackY = math.normalizeY(self.transform.x() - self.chaseTarget.transform.x(), self.transform.y() - self.chaseTarget.transform.y())
      self.knockbackTimer = 0.15
    endif
  endif
endfunction

EndClass
