Class
Extends scene

dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim lights as RcLights
dim actors as RcActors
dim npcFloor
dim npcLedge
dim npcHidden
dim torch
dim titleText as Text
dim hintText as Text
dim lastMouse

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
    self.lastMouse = 0
    self.tm = new tilemapset("p6room.stm")
    self.wld = new RcWorld(self.tm, "walls")
    self.ren = new RcRender(self.wld)
    self.me = new RcMover(self.wld, 3.0, 3.0, 0.3, 0.6)
    self.lights = new RcLights(self.wld)
    self.actors = new RcActors(self.wld)
    self.ren.bindCamera(self.me)
    self.ren.bindLights(self.lights)
    self.ren.bindActors(self.actors)
    self.torch = self.lights.addPoint(3.0, 3.0, 0.5, 0.9, RcConfig.RC_LIGHT_RANGE)
    self.npcFloor = self.actors.add("rc_enemy.png", 6.5, 3.0, 0.0, 64, 64)
    self.npcLedge = self.actors.add("rc_enemy.png", 10.5, 7.5, 0.4, 64, 64)
    self.npcHidden = self.actors.add("rc_enemy.png", 9.5, 2.5, 0.0, 64, 64)
    self.lights.update()

    self.titleText = new Text("Raycaster P6 - actors", 12, 10)
    self.titleText.setStyle(16, 255, 220, 120)
    hud.add(self.titleText)
    self.hintText = new Text("WASD move/turn  QE strafe  space jump  click to hitscan", 12, 30)
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
    dim halfW
    dim sx
    dim bx
    dim hit as RcActor
    dim hitX
    dim hitY
    dim hitK
    dim hitD
    dim n1 as RcActor
    dim n1x
    dim n2 as RcActor
    dim dw

    self.ren.setCamera(3.0, 3.0, 0, 0)
    halfW = stage.width() / 2

    sx = self.ren.worldToScreenX(6.5, 3.0)
    ok1 = 0
    if math.abs(sx - halfW) < 12 then
        ok1 = 1
    endif
    self.probe("projection sane", ok1, 52)

    bx = self.ren.worldToScreenX(1.0, 3.0)
    ok2 = 0
    if bx < 0 then
        ok2 = 1
    endif
    self.probe("behind-camera guard", ok2, 72)

    hit = self.actors.hitscan(3.0, 3.0, 1, 0, RcConfig.RC_HITSCAN_RANGE)
    hitK = self.actors.hitKind()
    hitX = 0
    hitY = 0
    if hit <> 0 then
        hitX = hit.x()
        hitY = hit.y()
    endif
    ok3 = 0
    if hit <> 0 and hitK = RcConfig.RC_HIT_ACTOR and hitX = 6.5 and hitY = 3.0 then
        ok3 = 1
    endif
    self.probe("hitscan hits floor npc", ok3, 92)

    hit = self.actors.hitscan(3.0, 2.5, 1, 0, RcConfig.RC_HITSCAN_RANGE)
    hitK = self.actors.hitKind()
    hitD = self.actors.hitDist()
    ok4 = 0
    if hit = 0 and hitK = RcConfig.RC_HIT_WALL and math.abs(hitD - 5.0) < 0.1 then
        ok4 = 1
    endif
    self.probe("wall blocks hitscan", ok4, 112)

    n1 = self.actors.near(6.5, 3.2, 2.0)
    n2 = self.actors.near(0.5, 0.5, 1.0)
    n1x = 0
    if n1 <> 0 then
        n1x = n1.x()
    endif
    ok5 = 0
    if n1 <> 0 and n1x = 6.5 and n2 = 0 then
        ok5 = 1
    endif
    self.probe("near finds closest npc", ok5, 132)

    dw = self.actors.los(3.0, 2.5, 1, 0)
    ok6 = 0
    if dw > 0 and math.abs(dw - 5.0) < 0.1 then
        ok6 = 1
    endif
    self.probe("los sees the wall", ok6, 152)
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
    dim dx
    dim dy
    dim h as RcActor

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

    if input.mouseDown() = 1 then
        if self.lastMouse = 0 then
            dx = math.cos(self.me.angle())
            dy = math.sin(self.me.angle())
            h = self.actors.hitscan(self.me.x(), self.me.y(), dx, dy, RcConfig.RC_HITSCAN_RANGE)
            if h <> 0 then
                h.setTint(255, 80, 80)
            endif
        endif
    endif
    self.lastMouse = input.mouseDown()
    self.ren.renderFrame()
endfunction

EndClass
