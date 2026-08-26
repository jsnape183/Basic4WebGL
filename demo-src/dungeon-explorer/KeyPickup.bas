Class
Extends sprite

dim collected

Constructor(x, y)
  super("key.png")
  self.transform.setPosition(x, y)
  self.collected = false
EndConstructor

function collect()
  self.collected = true
  particles.burstKeySparkle(self.transform.x(), self.transform.y())
  world.remove(self)
endfunction

EndClass
