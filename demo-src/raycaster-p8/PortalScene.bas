Class
Extends scene

' Raycaster Phase 8 -- upper regions. One optional stacked space per cell, read
' from a second `.stm` tile layer named "upper" (id 1 plank / 2 wall / 3 hole).
' The room has a 4-step staircase (floor: markers) climbing the west side up to a
' walkway (upper id-1 planks at ceilH 1.4) that runs east across the room with a
' railing (id-2) along its long edges and one missing plank (id-3 hole) at col 8.
' Spawn is in the lower room (region 0); climb the stairs onto the walkway
' (region 1); walk into the hole to drop back down.

dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim lights as RcLights
dim torch
dim titleText as Text
dim hintText as Text

Constructor()
    input.bind("fwd", "key", keyboard.W)
    input.bind("back", "key", keyboard.S)
    input.bind("sl", "key", keyboard.Q)
    input.bind("sr", "key", keyboard.E)
    input.bind("tl", "key", keyboard.A)
    input.bind("tr", "key", keyboard.D)
    input.bind("jump", "key", keyboard.SPACE)
EndConstructor

function onenter()
    world.setBackground(0, 0, 0)
    self.tm = new tilemapset("p8room.stm")
    self.wld = new RcWorld(self.tm, "walls")
    self.ren = new RcRender(self.wld)
    self.me = new RcMover(self.wld, 7.5, 6.5, 0.3, 0.6)
    self.lights = new RcLights(self.wld)
    self.ren.bindLights(self.lights)
    self.ren.bindCamera(self.me)
    self.torch = self.lights.addPoint(7.5, 6.5, 0.5, 0.9, RcConfig.RC_LIGHT_RANGE)
    self.lights.update()

    self.titleText = new Text("Raycaster P8 - upper regions", 12, 10)
    self.titleText.setStyle(16, 255, 220, 120)
    hud.add(self.titleText)
    self.hintText = new Text("WASD move/turn  QE strafe  (climb the west stairs onto the walkway; the hole drops you back)", 12, 30)
    self.hintText.setStyle(12, 180, 200, 220)
    hud.add(self.hintText)

    self.runProbes()
endfunction

function runProbes()
    dim ok1
    dim ok2
    dim ok4
    dim ok5
    dim ok6
    dim sawPortal
    dim pc as RcCast
    dim mv as RcMover
    dim i
    dim sc
    dim k
    dim uf
    dim ucl

    ' 1 - the upper layer parsed to the right tile ids
    ok1 = 0
    if self.wld.upperKindAt(6, 2) = 1 then
        if self.wld.upperKindAt(8, 3) = 3 then
            if self.wld.upperKindAt(6, 8) = 0 then
                ok1 = 1
            endif
        endif
    endif
    self.probe("upper layer ids", ok1, 52)

    ' 2 - walkway floor sits at the host cell ceilH; uceil: sets the upper ceiling
    ok2 = 0
    uf = self.wld.upperFloorAt(6, 2)
    ucl = self.wld.upperCeilAt(6, 2)
    if math.abs(uf - 1.4) < 0.01 then
        if math.abs(ucl - 3.0) < 0.01 then
            ok2 = 1
        endif
    endif
    self.probe("upper heights", ok2, 72)

    ' 3 - a ray from the lower room up through the hole emits a portal span
    pc = new RcCast()
    pc.setRegion(0)
    pc.cast(self.wld, 8.5, 8.5, 0, 0 - 1)
    sc = pc.spanCount()
    sawPortal = 0
    for i = 0 to sc - 1
        k = pc.spanKind(i)
        if k = RcConfig.RC_SPAN_PORTAL_WALL then
            sawPortal = 1
        endif
        if k = RcConfig.RC_SPAN_PORTAL_CEIL then
            sawPortal = 1
        endif
        if k = RcConfig.RC_SPAN_PORTAL_FLOOR then
            sawPortal = 1
        endif
    next i
    self.probe("cast sees a portal span through the hole", sawPortal, 92)

    ' 4 - control: the same cast under a solid plank column emits no portal span
    pc.cast(self.wld, 6.5, 8.5, 0, 0 - 1)
    sc = pc.spanCount()
    ok4 = 1
    for i = 0 to sc - 1
        k = pc.spanKind(i)
        if k = RcConfig.RC_SPAN_PORTAL_WALL then
            ok4 = 0
        endif
        if k = RcConfig.RC_SPAN_PORTAL_CEIL then
            ok4 = 0
        endif
        if k = RcConfig.RC_SPAN_PORTAL_FLOOR then
            ok4 = 0
        endif
    next i
    self.probe("solid plank column caps the upward view", ok4, 112)

    ' 5 - drive up the west staircase and end on the walkway in the upper region
    mv = new RcMover(self.wld, 1.5, 2.5, 0.3, 0.6)
    mv.turn(0)
    for i = 0 to 39
        mv.move(RcConfig.RC_MOVE_SPEED, 0)
        mv.step(50)
    next i
    ok5 = 0
    if mv.regionId() = 1 then
        if math.abs(mv.z() - 1.4) < 0.2 then
            ok5 = 1
        endif
    endif
    self.probe("mover climbs the stairs into the upper region", ok5, 132)

    ' 6 - from the walkway, walk into the hole and fall back to the room floor
    mv = new RcMover(self.wld, 6.5, 3.5, 0.3, 0.6)
    mv.enterRegion(1)
    mv.turn(0)
    for i = 0 to 39
        mv.move(RcConfig.RC_MOVE_SPEED, 0)
        mv.step(50)
    next i
    ok6 = 0
    if mv.regionId() = 0 then
        if math.abs(mv.z()) < 0.2 then
            ok6 = 1
        endif
    endif
    self.probe("mover drops through the hole to the lower region", ok6, 152)
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
    if input.pressed("jump") then
        self.me.jump()
    endif

    self.me.step(delta)
    self.lights.moveLight(self.torch, self.me.x(), self.me.y())
    self.lights.update()
    self.ren.renderFrame()
endfunction

EndClass
