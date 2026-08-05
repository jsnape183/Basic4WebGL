Class
Extends sprite

dim minX
dim maxX
dim dir
dim speed

Constructor(x, y, minX, maxX)
  super("enemy.png")
  self.transform.setPosition(x, y)
  self.minX = minX
  self.maxX = maxX
  self.dir = 1
  self.speed = 20
  world.add(self)
EndConstructor

function onupdate(delta)
  dim dt
  dim x
  dt = delta / 1000
  x = self.transform.x()
  x = x + self.dir * self.speed * dt
  if x > self.maxX then
    x = self.maxX
    self.dir = -1
  endif
  if x < self.minX then
    x = self.minX
    self.dir = 1
  endif
  self.transform.setPosition(x, self.transform.y())
endfunction

EndClass
