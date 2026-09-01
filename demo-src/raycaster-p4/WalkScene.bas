Class
Extends scene

dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim titleText as Text
dim hintText as Text

Constructor()
    input.bind("fwd", "key", keyboard.W)
    input.bind("back", "key", keyboard.S)
    input.bind("sl", "key", keyboard.Q)
    input.bind("sr", "key", keyboard.E)
    input.bind("tl", "key", keyboard.A)
    input.bind("tr", "key", keyboard.D)
    input.bind("lookup", "key", keyboard.UP)
    input.bind("lookdown", "key", keyboard.DOWN)
    input.bind("jump", "key", keyboard.SPACE)
EndConstructor

function onenter()
    world.setBackground(0, 0, 0)
    self.tm = new tilemapset("p4room.stm")
    self.wld = new RcWorld(self.tm, "walls")
    self.ren = new RcRender(self.wld)
    self.me = new RcMover(self.wld, 2.0, 4.0, 0.3, 0.6)
    self.ren.bindCamera(self.me)

    self.titleText = new Text("Raycaster P4 - walk", 12, 10)
    self.titleText.setStyle(16, 255, 220, 120)
    hud.add(self.titleText)
    self.hintText = new Text("WASD move/turn  QE strafe  up/down look  space jump", 12, 30)
    self.hintText.setStyle(12, 180, 200, 220)
    hud.add(self.hintText)

    self.runProbes()
endfunction

function runProbes()
    dim a as RcMover
    dim b as RcMover
    dim c as RcMover
    dim j as RcMover
    dim i
    dim okStart
    dim okWall
    dim okStep
    dim okBlock
    dim okJump

    okStart = 0
    if math.abs(self.me.z()) < 0.01 then
        okStart = 1
    endif
    self.probe("start z on floor", okStart, 52)

    a = new RcMover(self.wld, 2.0, 4.0, 0.3, 0.6)
    a.turn(math.pi())
    for i = 0 to 24
        a.move(RcConfig.RC_MOVE_SPEED, 0)
        a.step(16)
    next i
    okWall = 0
    if a.x() > 1.0 then
        okWall = 1
    endif
    self.probe("blocked by west wall", okWall, 72)

    b = new RcMover(self.wld, 3.5, 4.5, 0.3, 0.6)
    for i = 0 to 24
        b.move(RcConfig.RC_MOVE_SPEED, 0)
        b.step(16)
    next i
    okStep = 0
    if math.abs(b.z() - 0.3) < 0.02 then
        if b.x() > 4.0 then
            okStep = 1
        endif
    endif
    self.probe("stepped up onto 0.3 ledge", okStep, 92)

    c = new RcMover(self.wld, 5.5, 4.5, 0.3, 0.6)
    for i = 0 to 24
        c.move(RcConfig.RC_MOVE_SPEED, 0)
        c.step(16)
    next i
    okBlock = 0
    if c.x() < 6.0 then
        if math.abs(c.z() - 0.3) < 0.05 then
            okBlock = 1
        endif
    endif
    self.probe("blocked by the 0.9 ledge", okBlock, 112)

    j = new RcMover(self.wld, 2.0, 2.0, 0.3, 0.6)
    j.jump()
    j.step(16)
    okJump = 0
    if j.onGround() = 0 then
        if j.z() > 0.001 then
            okJump = 1
        endif
    endif
    self.probe("jump leaves the ground", okJump, 132)
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

    fwd = input.axis("back", "fwd")
    strafe = input.axis("sl", "sr")
    turnAxis = input.axis("tl", "tr")
    lookAxis = input.axis("lookdown", "lookup")

    self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
    if turnAxis <> 0 then
        self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
    endif
    if lookAxis <> 0 then
        self.me.look(lookAxis * RcConfig.RC_LOOK_SPEED * (delta / 1000.0))
    endif
    if input.pressed("jump") then
        self.me.jump()
    endif

    self.me.step(delta)
    self.ren.renderFrame()
endfunction

EndClass
