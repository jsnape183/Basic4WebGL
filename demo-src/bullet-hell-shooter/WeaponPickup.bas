Class
Extends sprite

dim collected

Constructor(x, y)
  super("pickup.png")
  self.transform.setPosition(x, y)
  self.collected = false
EndConstructor

function collect()
  dim choice
  self.collected = true
  world.remove(self)
  choice = math.randomint(3)
  if choice = 0 then
    return "pistol"
  elseif choice = 1 then
    return "shotgun"
  else
    return "smg"
  endif
endfunction

EndClass
