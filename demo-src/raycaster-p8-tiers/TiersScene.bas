Class
Extends scene

' Raycaster Phase 8 -- multi-tier level-design showcase. Pure floor:/ceil:
' height variation (no upper regions): a sunken central arena, a west staircase
' up to a raised north walkway with a higher NE nook. Wall textures + a few
' fcol:/ccol: accent tiles. WASD move, QE turn, RF look up/down.

dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim lights as RcLights
dim torch
dim titleText as Text
dim fpsText as Text
dim frames
dim accum

Constructor()
  input.bind("fwd", "key", keyboard.W)
  input.bind("back", "key", keyboard.S)
  input.bind("tl", "key", keyboard.A)
  input.bind("tr", "key", keyboard.D)
  input.bind("qturnl", "key", keyboard.Q)
  input.bind("eturnr", "key", keyboard.E)
  input.bind("looku", "key", keyboard.R)
  input.bind("lookd", "key", keyboard.F)
EndConstructor

function onenter()
  self.frames = 0
  self.accum = 0

  world.setBackground(0, 0, 0)
  self.tm = new tilemapset("tiersroom.stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.ren = new RcRender(self.wld)
  self.me = new RcMover(self.wld, 6.0, 7.0, 0.3, 0.6)
  self.lights = new RcLights(self.wld)
  self.ren.bindLights(self.lights)
  self.ren.bindCamera(self.me)
  self.torch = self.lights.addPoint(6.0, 7.0, 0.5, 0.9, RcConfig.RC_LIGHT_RANGE)
  self.lights.update()

  self.ren.setWallTexture("rc_tex_concrete.png")

  self.titleText = new Text("Raycaster P8 - multi-tier showcase", 12, 10)
  self.titleText.setStyle(16, 255, 220, 120)
  hud.add(self.titleText)
  self.fpsText = new Text("WASD move  QE turn  RF look  (climb the west stairs)", 12, 30)
  self.fpsText.setStyle(14, 180, 255, 180)
  hud.add(self.fpsText)

  self.runProbes()
endfunction

function runProbes()
  dim pc as RcCast
  dim mv as RcMover
  dim ok1
  dim ok2
  dim sawFar
  dim i
  dim sc
  dim ok4
  dim ok5

  ' 1 - the west stair (row 7) climbs 0 -> 0.8 in 0.2-sized steps
  ok1 = 0
  if math.abs(self.wld.floorHeightAt(4, 7) - 0.2) < 0.001 then
    if math.abs(self.wld.floorHeightAt(1, 7) - 0.8) < 0.001 then
      ok1 = 1
    endif
  endif
  self.probe("west stair heights", ok1, 52)

  ' 2 - the sunken arena floor is below the room floor
  ok2 = 0
  if self.wld.floorHeightAt(5, 5) < 0 - 0.2 then
    ok2 = 1
  endif
  self.probe("sunken arena floor", ok2, 72)

  ' 3 - a ray across the sunken arena still reaches the far wall (the window
  '     stays open over a floor DROP)
  pc = new RcCast()
  pc.cast(self.wld, 2.0, 5.5, 1.0, 0.0)
  sc = pc.spanCount()
  sawFar = 0
  for i = 0 to sc - 1
    if pc.spanKind(i) = RcConfig.RC_SPAN_WALL then
      if pc.spanDist(i) > 6.0 then
        sawFar = 1
      endif
    endif
  next i
  self.probe("see across the pit to the far wall", sawFar, 92)

  ' 4 - fcol:/ccol: tags parsed per tile; an untagged cell reads -1
  ok4 = 0
  if self.wld.hasSurfaceColor() = 1 then
    if self.wld.floorColAt(5, 5) > 0 then
      if self.wld.ceilColAt(5, 1) > 0 then
        if self.wld.floorColAt(3, 3) = 0 - 1 then
          ok4 = 1
        endif
      endif
    endif
  endif
  self.probe("fcol/ccol tags parse per tile", ok4, 112)

  ' 5 - a mover walking west up the stair gains height (step-up climbing works
  '     without regions)
  mv = new RcMover(self.wld, 5.5, 7.5, 0.3, 0.6)
  mv.turn(math.pi())
  for i = 0 to 59
    mv.move(RcConfig.RC_MOVE_SPEED, 0)
    mv.step(50)
  next i
  ok5 = 0
  if mv.z() > 0.3 then
    ok5 = 1
  endif
  self.probe("mover climbs the west stair", ok5, 132)
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
  dim lookAxis
  dim ms

  fwd = input.axis("back", "fwd")
  strafe = input.axis("tl", "tr")
  turnAxis = input.axis("qturnl", "eturnr")
  lookAxis = input.axis("lookd", "looku")

  self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
  if turnAxis <> 0 then
    self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
  endif
  if lookAxis <> 0 then
    self.me.look(lookAxis * RcConfig.RC_LOOK_SPEED * (delta / 1000.0))
  endif
  self.me.step(delta)
  self.lights.moveLight(self.torch, self.me.x(), self.me.y())
  self.lights.update()

  self.ren.renderFrame()
  self.frames = self.frames + 1
  self.accum = self.accum + delta
  if self.frames >= 30 then
    ms = self.accum / self.frames
    self.fpsText.setText("frame avg " + string.str(math.floor(ms)) + " ms  (" + string.str(self.ren.columnCount()) + " cols)")
    self.frames = 0
    self.accum = 0
  endif
endfunction

EndClass
