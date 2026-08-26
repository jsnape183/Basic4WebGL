Class extends scene

dim emitter as Emitter
dim wasMouseDown

function onenter()
  stage.setBackground(18, 18, 26)

  dim e as Emitter
  e = new Emitter("particle.png")
  e.setLifetime(0.6, 1)
  e.setSpeed(60, 180)
  e.setDirection(0, 360)
  e.setGravity(0, 200)
  e.setScaleOverLife(1.5, 0.1)
  e.setAlphaOverLife(1, 0)
  e.setColorOverLife(16768120, 11801600)
  e.setMaxParticles(300)
  world.add(e)
  self.emitter = e

  self.wasMouseDown = false

  dim label as text
  label = new text("Click anywhere to burst fire particles", 20, 20)
  label.setStyle(16, 255, 255, 255)
  hud.add(label)
endfunction

function onupdate(delta)
  dim down
  down = input.mouseDown()
  if not self.wasMouseDown and down then
    self.emitter.transform.setPosition(input.mouseX(), input.mouseY())
    self.emitter.burst(30)
  endif
  self.wasMouseDown = down
endfunction

EndClass
