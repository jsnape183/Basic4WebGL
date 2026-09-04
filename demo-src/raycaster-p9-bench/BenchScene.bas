Class
Extends scene

' Raycaster Phase 9 -- frame-cost bench. A generated stress scene (all Phase 8
' features + idle billboard enemies) with an on-screen frame-time / primitive
' readout. 1/2/3 swap stress size; P toggles the fixed-path autopilot. Frame
' time is the `delta` arg (softBASIC has no monotonic clock); path + enemy data
' come from the generated StressData class (no JSON parser in the language).

dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim lights as RcLights
dim acts as RcActors
dim sd as StressData
dim torch
dim hudA as Text
dim hudB as Text
dim frames
dim accum
dim minMs
dim maxMs
dim curSize
dim auto
dim meshOn
dim autoIdx
dim enemyN

Constructor()
  input.bind("fwd", "key", keyboard.W)
  input.bind("back", "key", keyboard.S)
  input.bind("tl", "key", keyboard.A)
  input.bind("tr", "key", keyboard.D)
  input.bind("ql", "key", keyboard.Q)
  input.bind("er", "key", keyboard.E)
  input.bind("lu", "key", keyboard.R)
  input.bind("ld", "key", keyboard.F)
  input.bind("s1", "key", keyboard.DIGIT_1)
  input.bind("s2", "key", keyboard.DIGIT_2)
  input.bind("s3", "key", keyboard.DIGIT_3)
  input.bind("autop", "key", keyboard.P)
  input.bind("meshtoggle", "key", keyboard.M)
EndConstructor

function onenter()
  self.frames = 0
  self.accum = 0
  self.minMs = 9999
  self.maxMs = 0
  self.auto = 0
  self.meshOn = 0
  self.autoIdx = 0
  self.sd = new StressData()
  self.loadSize(32)

  self.hudA = new Text("...", 12, 10)
  self.hudA.setStyle(14, 255, 220, 120)
  hud.add(self.hudA)
  self.hudB = new Text("WASD/QE/RF   1-2-3 size   P autopilot", 12, 28)
  self.hudB.setStyle(12, 180, 255, 180)
  hud.add(self.hudB)

  self.runProbes()
endfunction

function loadSize(n)
  dim i
  dim sc
  dim cap
  self.curSize = n
  sc = n / 32.0
  self.tm = new tilemapset("stress" + string.str(n) + ".stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.ren = new RcRender(self.wld)
  self.me = new RcMover(self.wld, 2.5 * sc, 2.5 * sc, 0.3, 0.6)
  self.lights = new RcLights(self.wld)
  self.acts = new RcActors(self.wld)
  self.ren.bindLights(self.lights)
  self.ren.bindCamera(self.me)
  self.ren.bindActors(self.acts)
  self.ren.setWallTexture("rc_tex_concrete.png")
  self.torch = self.lights.addPoint(2.5 * sc, 2.5 * sc, 0.5, 0.9, RcConfig.RC_LIGHT_RANGE)
  self.enemyN = self.sd.enemyCount(n)
  cap = self.acts.poolSize()
  if self.enemyN > cap then
    self.enemyN = cap
  endif
  for i = 0 to self.enemyN - 1
    self.acts.add("rc_enemy.png", self.sd.ex(n, i), self.sd.ey(n, i), 0.0, 64, 64)
  next i
  self.lights.update()
endfunction

function onupdate(delta)
  dim fwd
  dim strafe
  dim turnAxis
  dim lookAxis
  dim ms
  dim t0
  dim wpi
  dim meshLbl
  dim gpuLbl

  if input.pressed("s1") then
    self.loadSize(16)
  endif
  if input.pressed("s2") then
    self.loadSize(32)
  endif
  if input.pressed("s3") then
    self.loadSize(48)
  endif
  if input.pressed("autop") then
    self.auto = 1 - self.auto
  endif
  if input.pressed("meshtoggle") then
    self.meshOn = 1 - self.meshOn
    self.ren.setWallMesh(self.meshOn)
  endif

  if self.auto = 1 then
    wpi = self.autoIdx - math.floor(self.autoIdx / self.sd.pathCount()) * self.sd.pathCount()
    self.me.warpTo(self.sd.px(wpi) * (self.curSize / 32.0), self.sd.py(wpi) * (self.curSize / 32.0), self.sd.pa(wpi))
    self.autoIdx = self.autoIdx + 1
  else
    fwd = input.axis("back", "fwd")
    strafe = input.axis("tl", "tr")
    turnAxis = input.axis("ql", "er")
    lookAxis = input.axis("ld", "lu")
    self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
    if turnAxis <> 0 then
      self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
    endif
    if lookAxis <> 0 then
      self.me.look(lookAxis * RcConfig.RC_LOOK_SPEED * (delta / 1000.0))
    endif
    self.me.step(delta)
  endif

  self.lights.moveLight(self.torch, self.me.x(), self.me.y())
  self.lights.update()

  ' Real render cost: onupdate(delta) is the FIXED sim step (always ~16.7ms), so
  ' time it directly with the wall clock instead.
  t0 = time.now()
  self.ren.renderFrame()
  ms = time.now() - t0

  if ms < self.minMs then
    self.minMs = ms
  endif
  if ms > self.maxMs then
    self.maxMs = ms
  endif

  self.frames = self.frames + 1
  self.accum = self.accum + ms
  if self.frames >= 30 then
    meshLbl = "off"
    if self.meshOn = 1 then
      meshLbl = "on"
    endif
    gpuLbl = "n/a"
    if world.gpuFrameMs() >= 0 then
      gpuLbl = string.str(math.floor(world.gpuFrameMs() * 100) / 100) + "ms"
    endif
    self.hudA.setText("MESH " + meshLbl + "   " + string.str(world.drawCalls()) + " draws   GPU " + gpuLbl + "   " + string.str(math.floor(world.fps())) + " fps   |   " + string.str(self.ren.primitiveCount()) + " prim   renderJS " + string.str(math.floor(self.accum / self.frames * 100) / 100) + "ms   flush " + string.str(math.floor(self.ren.wallMeshMs() * 1000) / 1000) + "ms   " + string.str(self.ren.columnCount()) + " cols   " + string.str(self.enemyN) + " foes   stress" + string.str(self.curSize))
    self.frames = 0
    self.accum = 0
    self.minMs = 9999
    self.maxMs = 0
  endif
endfunction

function runProbes()
  dim ok1
  dim ok2
  dim ok3
  dim ok4
  dim ok5

  ok1 = 0
  if self.wld.widthCells() = 32 then
    ok1 = 1
  endif
  self.probe("stress32 loaded 32 wide", ok1, 52)

  ok2 = 0
  if self.wld.floorHeightAt(4, 4) > 0.3 then
    if self.wld.floorHeightAt(5, 5) < 0 - 0.4 then
      ok2 = 1
    endif
  endif
  self.probe("stress motif: raised + pit cells", ok2, 72)

  ok3 = 0
  if self.acts.activeCount() = self.enemyN then
    if self.enemyN > 4 then
      ok3 = 1
    endif
  endif
  self.probe("enemies seeded from StressData", ok3, 92)

  self.ren.renderFrame()
  ok4 = 0
  if self.ren.primitiveCount() > 0 then
    ok4 = 1
  endif
  self.probe("renderFrame ran, primitives drawn", ok4, 112)

  self.loadSize(16)
  self.ren.renderFrame()
  ok5 = 0
  if self.curSize = 16 then
    if self.ren.primitiveCount() > 0 then
      ok5 = 1
    endif
  endif
  self.probe("size swap rebuilt the render pipeline", ok5, 132)
  self.loadSize(32)
endfunction

function probe(label, passed, y)
  dim result
  dim t as Text
  dim missing
  dim boom
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

EndClass
