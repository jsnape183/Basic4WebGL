Class
Extends scene
' demo-src/survival-slice/TunnelScene.bas
'
' The Disused Tunnel -- the "down" spoke. Phase 1: a navigable space with one
' doorway back to the platform. Later phases: a story terminal, shamblers,
' permanently `infested`.

dim state as GameState
dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim titleText as Text
dim promptText as Text
dim doorReach

Constructor(gs as GameState)
  self.state = gs
  self.doorReach = 1.2
  controls.bindAll()
EndConstructor

function onenter()
  world.setBackground(2, 2, 3)
  self.tm = new tilemapset("tunnel.stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.ren = new RcRender(self.wld)
  self.me = new RcMover(self.wld, 1.5, 1.5, 0.3, 0.6)
  self.ren.bindCamera(self.me)
  self.ren.setWallTexture("rc_tex_concrete.png")

  areahelpers.spawnAtEntry(self.me, self.tm, self.state.takePendingEntry())

  self.titleText = new Text("DISUSED TUNNEL", 12, 10)
  self.titleText.setStyle(16, 200, 180, 120)
  hud.add(self.titleText)
  self.promptText = new Text("", stage.width() / 2 - 90, stage.height() - 60)
  self.promptText.setStyle(16, 255, 255, 255)
  hud.add(self.promptText)
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
