Class
Extends scene

dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim titleText as Text
dim fpsText as Text
dim frames
dim accum

Constructor()
  input.bind("fwd", "key", keyboard.W)
  input.bind("back", "key", keyboard.S)
  input.bind("sl", "key", keyboard.Q)
  input.bind("sr", "key", keyboard.E)
  input.bind("tl", "key", keyboard.A)
  input.bind("tr", "key", keyboard.D)
EndConstructor

function onenter()
  self.frames = 0
  self.accum = 0

  world.setBackground(0, 0, 0)
  self.tm = new tilemapset("p8broom.stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.ren = new RcRender(self.wld)
  self.me = new RcMover(self.wld, 2.0, 4.0, 0.3, 0.6)
  self.ren.bindCamera(self.me)

  self.ren.setWallTexture("rc_tex_concrete.png")
  self.ren.setFloorTexture("rc_tex_floor.png")
  self.ren.setCeilTexture("rc_tex_ceil.png")

  self.titleText = new Text("Raycaster P8b - textured room", 12, 10)
  self.titleText.setStyle(16, 255, 220, 120)
  hud.add(self.titleText)

  self.fpsText = new Text("WASD move/turn  QE strafe", 12, 30)
  self.fpsText.setStyle(14, 180, 255, 180)
  hud.add(self.fpsText)

  self.runProbes()
endfunction

function runProbes()
  dim pc as RcCast
  dim n1
  dim n2
  dim ok1
  dim ok2
  dim ok4
  dim ok5

  pc = new RcCast()

  ' 1 - a ray at a tex:-tagged north-wall cell carries the marker through to its span
  pc.cast(self.wld, 2.0, 4.0, 2.5, 0 - 3.5)
  n1 = pc.spanCount()
  ok1 = 0
  if n1 > 0 then
    if pc.spanTex(n1 - 1) = "rc_tex_brick.png" then
      ok1 = 1
    endif
  endif
  self.probe("cast at brick wall carries its tex marker", ok1, 52)

  ' 2 - an untagged wall span stays empty; the scene default is applied at render time
  pc.cast(self.wld, 2.0, 4.0, 0 - 1.0, 0.0)
  n2 = pc.spanCount()
  ok2 = 0
  if n2 > 0 then
    if pc.spanTex(n2 - 1) = "" then
      ok2 = 1
    endif
  endif
  self.probe("cast at untagged wall has empty span tex", ok2, 72)

  ' 3 - a full render frame with a default wall texture, tagged walls and a
  '     textured floor/ceiling all in view runs without throwing
  self.ren.setWallTexture("rc_tex_concrete.png")
  self.ren.renderFrame()
  self.probe("renderFrame runs with default + tagged textures", 1, 92)

  ' 4 - wallTexFor resolves a tagged cell to its marker and an untagged cell to the default
  ok4 = 0
  if self.ren.wallTexFor(4, 0) = "rc_tex_brick.png" then
    if self.ren.wallTexFor(0, 4) = "rc_tex_concrete.png" then
      ok4 = 1
    endif
  endif
  self.probe("wallTexFor resolves tag and default", ok4, 112)

  ' 5 - floorTexFor resolves an untagged cell to the scene floor default
  ok5 = 0
  if self.ren.floorTexFor(2, 4) = "rc_tex_floor.png" then
    ok5 = 1
  endif
  self.probe("floorTexFor resolves the scene default", ok5, 132)
endfunction

function probe(label, passed, y)
    dim result
    dim t as Text
    dim missing
    dim boom
    ' A failed probe must throw a caught runtimeError -- canvas text is invisible
    ' to the Cypress "no ERR" guard.
    result = "OK"
    if passed = 0 then
        result = "FAIL"
    endif
    t = new Text(label + ": " + result, 12, y)
    t.setStyle(12, 255, 255, 255)
    hud.add(t)
    if passed = 0 then
        boom = array.arrLength(missing)
    endif
endfunction

function onupdate(delta)
  dim fwd
  dim strafe
  dim turnAxis

  fwd = input.axis("back", "fwd")
  strafe = input.axis("sl", "sr")
  turnAxis = input.axis("tl", "tr")

  self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
  if turnAxis <> 0 then
    self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
  endif
  self.me.step(delta)

  self.ren.renderFrame()
  self.frames = self.frames + 1
  self.accum = self.accum + delta
  if self.frames >= 30 then
    dim ms
    ms = self.accum / self.frames
    self.fpsText.setText("frame avg " + string.str(math.floor(ms)) + " ms over " + string.str(self.frames) + " (" + string.str(self.ren.columnCount()) + " cols)")
    self.frames = 0
    self.accum = 0
  endif
endfunction

EndClass
