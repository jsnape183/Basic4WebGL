Class
Extends scene

' Light-pool POC scene: spawns in Room A facing south down the 2-cell corridor
' toward Room B's light -- the exact "shaft not pool" case from the finale.
dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRenderPool
dim me as RcMover
dim lights as RcLights
dim titleText as Text
dim helpText as Text

Constructor()
    ' Move -- WASD (keyboard), left stick (controller).
    input.bind("fwd", "key", keyboard.W)
    input.bind("fwd", "axis", controller.LSTICK_UP)
    input.bind("back", "key", keyboard.S)
    input.bind("back", "axis", controller.LSTICK_DOWN)
    input.bind("sl", "key", keyboard.Q)
    input.bind("sl", "axis", controller.LSTICK_LEFT)
    input.bind("sr", "key", keyboard.E)
    input.bind("sr", "axis", controller.LSTICK_RIGHT)

    ' Look -- A/D + arrow up/down (keyboard), right stick both axes (controller).
    input.bind("tl", "key", keyboard.A)
    input.bind("tl", "axis", controller.RSTICK_LEFT)
    input.bind("tr", "key", keyboard.D)
    input.bind("tr", "axis", controller.RSTICK_RIGHT)
    input.bind("lookD", "key", keyboard.DOWN)
    input.bind("lookD", "axis", controller.RSTICK_DOWN)
    input.bind("lookU", "key", keyboard.UP)
    input.bind("lookU", "axis", controller.RSTICK_UP)
EndConstructor

function onenter()
    world.setBackground(0, 0, 0)
    self.tm = new tilemapset("lightpool.stm")
    self.wld = new RcWorld(self.tm, "walls")
    self.ren = new RcRenderPool(self.wld)
    self.me = new RcMover(self.wld, 4.5, 3.5, 0.3, 0.6)
    self.me.warpTo(4.5, 3.5, math.pi() / 2)
    self.lights = new RcLights(self.wld)
    self.lights.setAmbient(0.08)
    self.ren.bindLights(self.lights)
    self.ren.bindCamera(self.me)
    ' Swap the procedural checker for a real world-tiled texture on the floor.
    self.ren.setFieldTextures("rc_placeholder_tiles.png", "")

    self.titleText = new Text("Raycaster Light-Pool POC", 12, 10)
    self.titleText.setStyle(16, 255, 220, 120)
    hud.add(self.titleText)
    self.helpText = new Text("WASD/L-stick move  QE strafe  AD/R-stick turn  Up/Down/R-stick look -- testing controller smoothness", 12, 30)
    self.helpText.setStyle(12, 180, 200, 220)
    hud.add(self.helpText)
endfunction

function onupdate(delta)
    dim fwd
    dim strafe
    dim turnAxis
    dim lookAxis

    fwd = input.axis("back", "fwd")
    strafe = input.axis("sl", "sr")
    turnAxis = input.axis("tl", "tr")
    lookAxis = input.axis("lookD", "lookU")

    self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
    if turnAxis <> 0 then
        self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
    endif
    if lookAxis <> 0 then
        self.me.look(lookAxis * RcConfig.RC_LOOK_SPEED * (delta / 1000.0))
    endif
    self.me.step(delta)
    self.ren.renderFrame()
endfunction

EndClass
