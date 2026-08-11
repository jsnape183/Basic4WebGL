Class
Extends sprite

dim vx
dim vy
dim damage
dim lifetime
dim elapsed
dim level as tilemapset
dim spawnPoints() as spawnpoint
dim mobs() as mob

' Do not type levelRef/spawnPointsRef/mobsRef here -- a typed Constructor
' parameter compiles clean but emits invalid JS (this.paramName as a param
' name). The fields' own typing above is enough for dotted access below.
' Also do not add a "dim" local back into this Constructor's body (e.g. a
' shared "speed" local) -- a Constructor-scope dim used across multiple
' statements compiles clean but emits invalid JS too (a bare, undeclared
' "constructor_speed = undefined" assignment, then "constructor.speed" --
' literally the word "constructor" as an object -- on every later read),
' throwing "constructor_speed is not defined" the instant a Bullet is
' constructed. Each branch below sets self.vx/self.vy directly instead.
Constructor(x, y, angle, weaponType, levelRef, spawnPointsRef, mobsRef)
  super("bullet.png")
  self.transform.setPosition(x, y)
  self.setAngle(angle * 180 / math.pi())
  self.level = levelRef
  self.spawnPoints = spawnPointsRef
  self.mobs = mobsRef
  self.elapsed = 0

  if weaponType = "shotgun" then
    self.damage = 8
    self.lifetime = 0.6
    self.vx = math.cos(angle) * 220
    self.vy = math.sin(angle) * 220
  elseif weaponType = "smg" then
    self.damage = 5
    self.lifetime = 0.8
    self.vx = math.cos(angle) * 320
    self.vy = math.sin(angle) * 320
  else
    self.damage = 10
    self.lifetime = 1
    self.vx = math.cos(angle) * 260
    self.vy = math.sin(angle) * 260
  endif
EndConstructor

function onupdate(delta)
  dim dt
  dim x
  dim y
  dim i

  dt = delta / 1000
  x = self.transform.x() + self.vx * dt
  y = self.transform.y() + self.vy * dt
  self.transform.setPosition(x, y)

  self.elapsed = self.elapsed + dt
  if self.elapsed >= self.lifetime then
    world.remove(self)
    return
  endif

  if self.level.tileAt("walls", x, y) <> 0 then
    world.remove(self)
    return
  endif

  for i = 0 to array.arrLength(self.spawnPoints) - 1
    if not self.spawnPoints(i).destroyed then
      if collision.spriteCollide(self, self.spawnPoints(i)) then
        self.spawnPoints(i).hit(self.damage)
        world.remove(self)
        return
      endif
    endif
  next i

  for i = 0 to array.arrLength(self.mobs) - 1
    if not self.mobs(i).dead then
      if collision.spriteCollide(self, self.mobs(i)) then
        self.mobs(i).hit(self.damage)
        world.remove(self)
        return
      endif
    endif
  next i
endfunction

EndClass
