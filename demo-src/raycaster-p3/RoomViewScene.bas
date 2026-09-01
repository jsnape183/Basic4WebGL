Class
Extends scene

dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim titleText as Text
dim fpsText as Text
dim frames
dim accum

Constructor()
EndConstructor

function onenter()
  self.frames = 0
  self.accum = 0

  world.setBackground(0, 0, 0)
  self.tm = new tilemapset("p3room.stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.ren = new RcRender(self.wld)
  self.ren.setCamera(2.0, 4.0, 0, 0)

  self.titleText = new Text("Raycaster P3 - room view", 12, 10)
  self.titleText.setStyle(16, 255, 220, 120)
  hud.add(self.titleText)

  self.fpsText = new Text("...", 12, 30)
  self.fpsText.setStyle(14, 180, 255, 180)
  hud.add(self.fpsText)

  dim eyeOnHorizon
  dim floorAtBottom
  dim ceilAtTop
  dim h
  h = self.ren.projectY(RcConfig.RC_EYE_Z, 5.0)
  eyeOnHorizon = 0
  if math.abs(h - self.ren.projectY(RcConfig.RC_EYE_Z, 1.0)) < 0.001 then
    eyeOnHorizon = 1
  endif
  self.probe("eye height maps to horizon at any distance", eyeOnHorizon, 52)

  floorAtBottom = 0
  if math.abs(self.ren.projectY(0, 1.0) - stage.height()) < 0.001 then
    floorAtBottom = 1
  endif
  self.probe("floor at d=1 maps to screen bottom", floorAtBottom, 72)

  ceilAtTop = 0
  if math.abs(self.ren.projectY(1.0, 1.0)) < 0.001 then
    ceilAtTop = 1
  endif
  self.probe("ceiling at d=1 maps to screen top", ceilAtTop, 92)
endfunction

function probe(label, passed, y)
  dim result
  dim t as Text
  dim missing
  dim boom
  ' A failed probe must throw a caught runtimeError -- canvas text is invisible
  ' to the Cypress "no ERR" guard, so a plain "FAIL" string would pass CI.
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
  self.ren.renderFrame()
  self.frames = self.frames + 1
  ' delta arrives in MILLISECONDS (matches every other onupdate(delta) usage in
  ' this codebase, e.g. demo-src/raycaster/GameScene.bas's `delta / 1000` to
  ' get seconds) -- so accum is already an accumulation of milliseconds and
  ' the average below needs no further *1000 scaling.
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
