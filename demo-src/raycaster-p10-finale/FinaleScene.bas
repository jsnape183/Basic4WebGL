Class
Extends scene

' Raycaster finale -- a capstone showcase for the softBASIC raycaster library
' (demo-src/raycaster/lib/): a 32x32 grid of six rooms joined by corridors,
' single wall texture, a 3-step staircase up to a raised dais in the Torch
' Hall (east room), low ambient light with a player-carried torch, and full
' keyboard + controller input (right-stick look on both axes, A/Space to jump).
' No new engine features -- everything here already ships in the library.

dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim lights as RcLights
dim torch
dim titleText as Text
dim helpText as Text

Constructor()
  ' Move -- WASD (keyboard), left stick (controller).
  input.bind("fwd", "key", keyboard.W)
  input.bind("fwd", "axis", controller.LSTICK_UP)
  input.bind("back", "key", keyboard.S)
  input.bind("back", "axis", controller.LSTICK_DOWN)
  input.bind("strafeL", "key", keyboard.A)
  input.bind("strafeL", "axis", controller.LSTICK_LEFT)
  input.bind("strafeR", "key", keyboard.D)
  input.bind("strafeR", "axis", controller.LSTICK_RIGHT)

  ' Look -- arrow keys (keyboard), right stick both axes (controller).
  input.bind("turnL", "key", keyboard.LEFT)
  input.bind("turnL", "axis", controller.RSTICK_LEFT)
  input.bind("turnR", "key", keyboard.RIGHT)
  input.bind("turnR", "axis", controller.RSTICK_RIGHT)
  input.bind("lookD", "key", keyboard.DOWN)
  input.bind("lookD", "axis", controller.RSTICK_DOWN)
  input.bind("lookU", "key", keyboard.UP)
  input.bind("lookU", "axis", controller.RSTICK_UP)

  ' Jump -- Space (keyboard), A button (controller).
  input.bind("jump", "key", keyboard.SPACE)
  input.bind("jump", "button", controller.A)
EndConstructor

function onenter()
  world.setBackground(2, 2, 4)
  self.tm = new tilemapset("finale.stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.ren = new RcRender(self.wld)
  self.me = new RcMover(self.wld, 15.5, 5.5, 0.3, 0.6)
  self.lights = new RcLights(self.wld)
  self.lights.setAmbient(0.05)
  self.ren.bindLights(self.lights)
  self.ren.bindCamera(self.me)
  self.ren.setWallTexture("rc_tex_concrete.png")

  self.torch = self.lights.addPoint(self.me.x(), self.me.y(), 0.5, 0.95, RcConfig.RC_LIGHT_RANGE)
  self.lights.update()

  self.titleText = new Text("Raycaster Finale", 12, 10)
  self.titleText.setStyle(16, 255, 220, 120)
  hud.add(self.titleText)
  self.helpText = new Text("WASD/stick move   arrows/right-stick look   Space/A jump", 12, 30)
  self.helpText.setStyle(13, 180, 255, 180)
  hud.add(self.helpText)
endfunction

function onupdate(delta)
  dim fwd
  dim strafe
  dim turnAxis
  dim lookAxis

  fwd = input.axis("back", "fwd")
  strafe = input.axis("strafeL", "strafeR")
  turnAxis = input.axis("turnL", "turnR")
  lookAxis = input.axis("lookD", "lookU")

  self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
  if turnAxis <> 0 then
    self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
  endif
  if lookAxis <> 0 then
    self.me.look(lookAxis * RcConfig.RC_LOOK_SPEED * (delta / 1000.0))
  endif
  if input.pressed("jump") then
    self.me.jump()
  endif
  self.me.step(delta)

  self.lights.moveLight(self.torch, self.me.x(), self.me.y())
  self.lights.update()

  self.ren.renderFrame()
endfunction

EndClass
