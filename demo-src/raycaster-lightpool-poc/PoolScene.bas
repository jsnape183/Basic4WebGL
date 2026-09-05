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
    input.bind("fwd", "key", keyboard.W)
    input.bind("back", "key", keyboard.S)
    input.bind("sl", "key", keyboard.Q)
    input.bind("sr", "key", keyboard.E)
    input.bind("tl", "key", keyboard.A)
    input.bind("tr", "key", keyboard.D)
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

    self.titleText = new Text("Raycaster Light-Pool POC", 12, 10)
    self.titleText.setStyle(16, 255, 220, 120)
    hud.add(self.titleText)
    self.helpText = new Text("WASD move  QE strafe  AD turn -- validating round pools, not final quality", 12, 30)
    self.helpText.setStyle(12, 180, 200, 220)
    hud.add(self.helpText)
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
    self.me.step(delta)
    self.ren.renderFrame()
endfunction

EndClass
