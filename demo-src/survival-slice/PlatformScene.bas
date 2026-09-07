Class
Extends scene
' demo-src/survival-slice/PlatformScene.bas
'
' The Old Platform -- where the player starts, and (later phases) the
' safe-zone hub. Phase 1: a navigable room with two doorways (to the tunnel,
' to the stairwell) and the AreaHelpers probe suite.

dim state as GameState
dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim titleText as Text
dim hintText as Text
dim promptText as Text
dim doorReach

Constructor(gs as GameState)
  self.state = gs
  self.doorReach = 1.2
  controls.bindAll()
EndConstructor

function onenter()
  world.setBackground(3, 3, 6)
  self.tm = new tilemapset("platform.stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.ren = new RcRender(self.wld)
  self.me = new RcMover(self.wld, 1.5, 1.5, 0.3, 0.6)
  self.ren.bindCamera(self.me)
  self.ren.setWallTexture("rc_tex_concrete.png")

  areahelpers.spawnAtEntry(self.me, self.tm, self.state.takePendingEntry())

  self.titleText = new Text("OLD PLATFORM", 12, 10)
  self.titleText.setStyle(16, 255, 220, 120)
  hud.add(self.titleText)
  self.hintText = new Text("WASD move/turn   E interact", 12, 30)
  self.hintText.setStyle(12, 180, 200, 220)
  hud.add(self.hintText)
  self.promptText = new Text("", stage.width() / 2 - 90, stage.height() - 60)
  self.promptText.setStyle(16, 255, 255, 255)
  hud.add(self.promptText)

  self.runProbes()
endfunction

function runProbes()
  dim okAngleS
  dim okDoorScene
  dim okDoorEntry
  dim okEntrySpawn
  dim okDoorReach
  dim m as RcMover
  dim d as Marker
  dim far as Marker

  okAngleS = 0
  if math.abs(areahelpers.faceAngle("s") - math.pi() / 2.0) < 0.001 then
    okAngleS = 1
  endif
  self.probe("faceAngle s", okAngleS, 52)

  okDoorScene = 0
  if areahelpers.doorScene("door:tunnel:from_platform label:Enter_tunnel") = "tunnel" then
    okDoorScene = 1
  endif
  self.probe("doorScene parse", okDoorScene, 72)

  okDoorEntry = 0
  if areahelpers.doorEntry("door:tunnel:from_platform label:Enter_tunnel") = "from_platform" then
    okDoorEntry = 1
  endif
  self.probe("doorEntry parse", okDoorEntry, 92)

  ' entry:from_stairwell is at row 2, col 8 -> world (8.5, 2.5)
  m = new RcMover(self.wld, 1.5, 1.5, 0.3, 0.6)
  areahelpers.spawnAtEntry(m, self.tm, "from_stairwell")
  okEntrySpawn = 0
  if math.abs(m.x() - 8.5) < 0.01 then
    if math.abs(m.y() - 2.5) < 0.01 then
      okEntrySpawn = 1
    endif
  endif
  self.probe("spawnAtEntry positions mover", okEntrySpawn, 112)

  ' door tunnel is at row 8, col 3 -> world (3.5, 8.5). Stand at (3.5, 7.8).
  d = areahelpers.findDoorInReach(self.tm, 3.5, 7.8, 1.2)
  far = areahelpers.findDoorInReach(self.tm, 6.0, 4.0, 1.2)
  okDoorReach = 0
  if d <> 0 then
    if far = 0 then
      if areahelpers.doorScene(d.tag) = "tunnel" then
        okDoorReach = 1
      endif
    endif
  endif
  self.probe("findDoorInReach near/far", okDoorReach, 132)
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

function onupdate(delta)
  dim fwd
  dim strafe
  dim turnAxis
  dim door as Marker

  fwd = controls.readFwd()
  strafe = controls.readStrafe()
  turnAxis = controls.readTurn()

  self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
  if turnAxis <> 0 then
    self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
  endif
  self.me.step(delta)

  door = areahelpers.findDoorInReach(self.tm, self.me.x(), self.me.y(), self.doorReach)
  if door = 0 then
    self.promptText.setText("")
  else
    self.promptText.setText(areahelpers.doorPrompt(door.tag))
    if controls.interactPressed() then
      self.state.setPendingEntry(areahelpers.doorEntry(door.tag))
      scenemanager.switch(areahelpers.doorScene(door.tag))
    endif
  endif

  self.ren.renderFrame()
endfunction

EndClass
