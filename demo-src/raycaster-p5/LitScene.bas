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
    self.tm = new tilemapset("p5room.stm")
    self.wld = new RcWorld(self.tm, "walls")
    self.ren = new RcRender(self.wld)
    self.me = new RcMover(self.wld, 2.0, 2.0, 0.3, 0.6)

    self.lights = new RcLights(self.wld)
    self.ren.bindLights(self.lights)
    self.torch = self.lights.addPoint(3.5, 3.5, 0.5, 0.9, RcConfig.RC_LIGHT_RANGE)
    self.lights.update()

    self.ren.bindCamera(self.me)

    self.titleText = new Text("Raycaster P5 - lit room", 12, 10)
    self.titleText.setStyle(16, 255, 220, 120)
    hud.add(self.titleText)
    self.hintText = new Text("WASD move/turn  QE strafe  space jump  (flashlight follows you)", 12, 30)
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
    dim movedVal

    ok1 = 0
    if math.abs(self.lights.sampleCell(9, 6) - RcConfig.RC_AMBIENT) < 0.02 then
        ok1 = 1
    endif
    self.probe("ambient far corner", ok1, 52)

    ok2 = 0
    if self.lights.sampleCell(4, 3) > RcConfig.RC_AMBIENT + 0.2 then
        ok2 = 1
    endif
    self.probe("lit near flashlight", ok2, 72)

    ok3 = 0
    if self.lights.sampleCell(2, 3) > RcConfig.RC_AMBIENT + 0.05 then
        ok3 = 1
    endif
    self.probe("static bake present", ok3, 92)

    ok4 = 0
    if self.lights.sampleCell(8, 3) + 0.1 < self.lights.sampleCell(4, 3) then
        ok4 = 1
    endif
    self.probe("shadow darker than lit", ok4, 112)

    ok5 = 0
    self.lights.moveLight(self.torch, 9.5, 6.5)
    self.lights.update()
    movedVal = self.lights.sampleCell(9, 6)
    if movedVal > RcConfig.RC_AMBIENT + 0.2 then
        ok5 = 1
    endif
    self.lights.moveLight(self.torch, 3.5, 3.5)
    self.lights.update()
    self.probe("flashlight moves", ok5, 132)
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
