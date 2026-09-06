Class
Extends scene

' Raycaster finale -- a capstone showcase for the softBASIC raycaster library
' (demo-src/raycaster/lib/): a 32x32 grid of six rooms joined by corridors,
' single wall texture, a 3-step staircase up to a raised dais in the Torch
' Hall (east room), and full keyboard + controller input (right-stick look on
' both axes, A/Space to jump). No new engine features -- everything here
' already ships in the library.
'
' Lighting: the player carries no light source. Instead, a static `light`
' marker sits in each room + the hub junction (finale.stm) -- baked once at
' load (RcLights.bakeStatic), not recomputed every frame like a moving torch
' was. Walking between rooms means walking through genuinely dark corridors
' into fixed pools of light, rather than a light that follows you and
' re-shades the whole view every frame as you move.

dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
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
  input.bind("strafeL", "key", keyboard.A)
  input.bind("strafeL", "axis", controller.LSTICK_LEFT)
  input.bind("strafeR", "key", keyboard.D)
  input.bind("strafeR", "axis", controller.LSTICK_RIGHT)

  ' Look -- arrow keys (keyboard), right stick both axes (controller).
  input.bind("turnL", "key", keyboard.LEFT)
  input.bind("turnL", "axis", controller.RSTICK_LEFT)
  input.bind("turnR", "key", keyboard.RIGHT)
  input.bind("turnR", "axis", controller.RSTICK_RIGHT)
  input.bind("lookD", "key", keyboard.DOWN)
  input.bind("lookD", "axis", controller.RSTICK_DOWN)
  input.bind("lookU", "key", keyboard.UP)
  input.bind("lookU", "axis", controller.RSTICK_UP)

  ' Jump -- Space (keyboard), A button (controller).
  input.bind("jump", "key", keyboard.SPACE)
  input.bind("jump", "button", controller.A)
EndConstructor

function onenter()
  world.setBackground(2, 2, 4)
  self.tm = new tilemapset("finale.stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.ren = new RcRender(self.wld)
  self.me = new RcMover(self.wld, 15.5, 5.5, 0.3, 0.6)
  self.lights = new RcLights(self.wld)
  self.lights.setAmbient(0.05)
  self.ren.bindLights(self.lights)
  self.ren.bindCamera(self.me)
  self.ren.setWallTexture("rc_tex_concrete.png")
  ' Rung 1's painter's background fill assumes floor/ceiling brightness is
  ' roughly uniform across the visible plane -- badly wrong with several
  ' short-radius static lights and genuinely dark corridors between them,
  ' where it produces a false bright/dark seam right at any fcol:/ccol:
  ' boundary. Force the accurate per-pixel path everywhere.
  self.ren.setFlatFill(0)

  ' Gradient floor/ceiling shading (POC) -- one shape per colour run,
  ' gradient-filled from the light at that run's own real near/far edge,
  ' instead of the shared library's default screen-Y light-band lattice. See
  ' docs/superpowers/specs/2026-09-04-raycaster-floor-ceiling-gradient-shading-design.md.
  self.ren.setGradientShading(1)

  ' Height-aware lighting (POC) -- floor/ceiling brightness now uses each
  ' light's real 3D distance instead of a flat 2D grid, so a floor point and
  ' a ceiling point at the same (x, y) genuinely differ. See
  ' docs/superpowers/specs/2026-09-04-raycaster-height-aware-lighting-design.md.
  self.lights.setHeightAware(1)

  ' Per-pixel floor field for the standard floor + ceiling: a true floorcast
  ' (world-space texture x baked static lightmap) instead of flat-shaded
  ' strips, so the light pools lie painted on the ground. The 3-step dais and
  ' its risers/soffit keep the per-column path (gradient shading above still
  ' governs them).
  self.ren.setFloorField(1)

  ' No dynamic lights at all -- every `light` marker in finale.stm was already
  ' baked into staticArr by the RcLights Constructor above. Nothing to update
  ' per frame.

  self.titleText = new Text("Raycaster Finale", 12, 10)
  self.titleText.setStyle(16, 255, 220, 120)
  hud.add(self.titleText)
  self.helpText = new Text("WASD/stick move   arrows/right-stick look   Space/A jump", 12, 30)
  self.helpText.setStyle(13, 180, 255, 180)
  hud.add(self.helpText)
endfunction

function onupdate(delta)
  dim fwd
  dim strafe
  dim turnAxis
  dim lookAxis

  fwd = input.axis("back", "fwd")
  strafe = input.axis("strafeL", "strafeR")
  turnAxis = input.axis("turnL", "turnR")
  lookAxis = input.axis("lookD", "lookU")

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
