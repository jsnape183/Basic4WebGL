Class
Extends sprite

dim collected

Constructor(x, y)
  super("coin.png")
  self.transform.setPosition(x, y)
  self.collected = false
  world.add(self)
EndConstructor

function collect()
  self.collected = true
  world.remove(self)
endfunction

EndClass
