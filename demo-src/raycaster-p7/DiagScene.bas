Class
Extends scene

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
    self.tm = new tilemapset("p7room.stm")
    self.wld = new RcWorld(self.tm, "walls")
    self.ren = new RcRender(self.wld)
    self.me = new RcMover(self.wld, 5.5, 4.5, 0.3, 0.6)
    self.lights = new RcLights(self.wld)
    self.ren.bindLights(self.lights)
    self.ren.bindCamera(self.me)
    self.torch = self.lights.addPoint(5.5, 4.5, 0.5, 0.9, RcConfig.RC_LIGHT_RANGE)
    self.lights.update()

    self.titleText = new Text("Raycaster P7 - diagonal tiles", 12, 10)
    self.titleText.setStyle(16, 255, 220, 120)
    hud.add(self.titleText)
    self.hintText = new Text("WASD move/turn  QE strafe  (octagon room + canted passage east)", 12, 30)
    self.hintText.setStyle(12, 180, 200, 220)
    hud.add(self.hintText)

    self.runProbes()
endfunction

function runProbes()
    dim ok1
    dim ok2
    dim ok3
    dim ok4
    dim ok5
    dim ok6
    dim probeCast as RcCast
    dim sc
    dim mv as RcMover
    dim i
    dim dlos
    dim ddiag

    ' 1 - diag: markers parsed to the right corner codes
    ok1 = 0
    if self.wld.diagAt(3, 1) = RcConfig.RC_DIAG_NW then
        if self.wld.diagAt(8, 8) = RcConfig.RC_DIAG_SE then
            ok1 = 1
        endif
    endif
    self.probe("diag tags loaded", ok1, 52)

    probeCast = new RcCast()

    ' 2 - a ray from room centre at the NW corner tile terminates on a diagonal wall
    probeCast.cast(self.wld, 5.5, 4.5, 0 - 2.2, 0 - 3.2)
    sc = probeCast.spanCount()
    ok2 = 0
    if sc > 0 then
        if probeCast.spanSide(sc - 1) = RcConfig.RC_SPAN_SIDE_DIAG then
            ok2 = 1
        endif
    endif
    self.probe("cast hits a diagonal", ok2, 72)

    ' 3 - control: straight up an open column hits a NORMAL wall (not diagonal)
    probeCast.cast(self.wld, 5.5, 4.5, 0, 0 - 1)
    sc = probeCast.spanCount()
    ok3 = 0
    if sc > 0 then
        if probeCast.spanSide(sc - 1) <> RcConfig.RC_SPAN_SIDE_DIAG then
            ok3 = 1
        endif
    endif
    self.probe("open ray hits plain wall", ok3, 92)

    ' 4 - a body driven into the NW corner wedge never crosses to the solid side
    '     (world chord x + y = 5; solid side x + y < 5)
    mv = new RcMover(self.wld, 3.9, 1.6, 0.3, 0.6)
    mv.turn(0 - 2.356)
    for i = 0 to 39
        mv.move(RcConfig.RC_MOVE_SPEED, 0)
        mv.step(50)
    next i
    ok4 = 0
    if mv.x() + mv.y() > 4.9 then
        if mv.x() < 3.9 then
            ok4 = 1
        endif
    endif
    self.probe("mover slides on diagonal", ok4, 112)

    ' 5 - a body walks freely from room centre out through the doorway into the passage
    mv = new RcMover(self.wld, 5.5, 4.5, 0.3, 0.6)
    mv.turn(0)
    for i = 0 to 39
        mv.move(RcConfig.RC_MOVE_SPEED, 0)
        mv.step(50)
    next i
    ok5 = 0
    if mv.x() > 9.0 then
        ok5 = 1
    endif
    self.probe("mover crosses open room", ok5, 132)

    ' 6 - cast + los agree on the canted dead-end chevron (ray passes through one
    '     diagonal's open half and hits the next)
    probeCast.cast(self.wld, 5.5, 4.5, 7.0, 0.5)
    sc = probeCast.spanCount()
    dlos = probeCast.los(self.wld, 5.5, 4.5, 7.0, 0.5)
    ok6 = 0
    if sc > 0 then
        if probeCast.spanSide(sc - 1) = RcConfig.RC_SPAN_SIDE_DIAG then
            if dlos > 0 then
                ddiag = probeCast.spanDist(sc - 1)
                if math.abs(dlos - ddiag) < 0.05 then
                    ok6 = 1
                endif
            endif
        endif
    endif
    self.probe("cast and los agree on diagonal", ok6, 152)
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
