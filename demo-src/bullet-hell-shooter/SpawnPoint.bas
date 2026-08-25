Class
Extends sprite

dim hp
dim destroyed
dim spawnInterval
dim elapsed
dim mobs
dim chaseTarget

Constructor(x, y, interval, mobsArray, targetRef)
  super("spawnpoint.png")
  self.transform.setPosition(x, y)
  self.hp = 20
  self.destroyed = false
  self.spawnInterval = interval
  self.elapsed = 0
  self.mobs = mobsArray
  self.chaseTarget = targetRef
EndConstructor

function onupdate(delta)
  dim dt
  dim m as mob
  if not self.destroyed then
    dt = delta / 1000
    self.elapsed = self.elapsed + dt
    if self.elapsed >= self.spawnInterval then
      self.elapsed = 0
      m = new Mob(self.transform.x(), self.transform.y(), self.chaseTarget)
      world.add(m)
      array.push(self.mobs, m)
    endif
  endif
endfunction

function hit(damage)
  if not self.destroyed and self.hp > 0 then
    self.hp = self.hp - damage
    if self.hp <= 0 then
      self.destroyed = true
      self.setTexture("spawnpoint_destroyed.png")
      particles.burstSpawnDestroyed(self.transform.x(), self.transform.y())
    endif
  endif
endfunction

EndClass
