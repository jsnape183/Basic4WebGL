' RcConfig -- shared constants for the raycaster library.
' Grows each phase. See docs/superpowers/specs/2026-08-31-raycaster-engine-design.md §9.4.
'
' RC_MAX_MARCH_ITERS: a ray crosses at most ~2*RC_MAX_DIST cell boundaries before
' the RC_MAX_DIST cutoff fires, so 512 is a deliberately generous safety cap that
' only bites on a degenerate / NaN direction vector.
'
' RC_SURF_LIGHT_STEP / RC_SURF_SEG_MAX: a floor/ceiling band is flat-shaded from a
' single light sample, so a band that spans a big light gradient (a long corridor
' under a short-radius torch) reads as one hard slab. RcRender.drawFlatSeg splits
' a band into enough sub-bands that no one of them spans more than
' RC_SURF_LIGHT_STEP of light, capped at RC_SURF_SEG_MAX sub-bands (and never
' finer than 2 screen pixels). A band with uniform light still costs exactly one
' strip, so lit-flat scenes pay nothing.
'
' RC_FALLOFF_LINEAR / RC_FALLOFF_QUADRATIC: per-light falloff curve, set via
' RcLights.setLightFalloff(handle, kind) -- see RcLights.bas. LINEAR (the default
' for every light, unchanged from before this existed) ramps intensity down evenly
' across the whole radius. QUADRATIC concentrates brightness near the source and
' falls away faster, closer to how a real torch/lamp reads: a small bright pool
' that dies off quickly rather than a wide, gradual gradient.
'
' RC_LIGHT_DEFAULT_Z: default world height for a bare `light` marker (no
' `:height` suffix) in RcWorld -- just under RC_STD_CEIL (1.0), approximating
' a ceiling-mounted fixture rather than a light embedded in the ceiling
' surface itself. See RcWorld.applyFlag/applyKv and RcLights.sampleAtZ.
'
' RcConfig is now DEFAULTS + STRUCTURAL CONSTANTS. Behavioural knobs (movement,
' physics, static-light bake, render distance, standard ceiling, surface-light
' banding, actor height) are seeded from here into RcSettings, which a scene can
' mutate and bind per-object -- see RcSettings.bas. The enum-style constants
' (RC_SPAN_*, RC_DIAG_*, RC_SHADE_*, RC_HIT_*, RC_FALLOFF_*), RC_STRIP_W,
' RC_TEX_SIZE, RC_MAX_MARCH_ITERS, RC_ACTOR_POOL, RC_FLAT_FILL and RC_UNTAGGED
' are structural and stay fixed at runtime.
'
' RC_MAX_MARCH_ITERS caps ray-march steps at ~2x RcSettings.maxDist boundary
' crossings; a scene that raises maxDist past ~250 must raise this too (it is
' not an RcSettings knob).
const
    RC_MAX_DIST = 32
    RC_MAX_MARCH_ITERS = 512
    RC_SPAN_WALL = 0
    RC_SPAN_FLOORSTEP = 1
    RC_SPAN_CEILSTEP = 2
    RC_STRIP_W = 4
    RC_EYE_Z = 0.5
    RC_MAX_PITCH = 220
    RC_STEP_UP = 0.35
    RC_GRAVITY = 14.0
    RC_JUMP_VEL = 5.0
    RC_MOVE_SPEED = 2.6
    RC_TURN_SPEED = 2.4
    RC_LOOK_SPEED = 400.0
    RC_MAX_STEP_DT = 0.1
    RC_LIGHT_RANGE = 6
    RC_LIGHT_CAP = 4
    RC_AMBIENT = 0.12
    RC_STATIC_INTENSITY = 0.9
    RC_LIGHT_DEFAULT_Z = 0.85
    RC_ACTOR_POOL = 32
    RC_ACTOR_HEIGHT = 1.0
    RC_HITSCAN_RANGE = 24.0
    RC_HIT_NONE = 0
    RC_HIT_WALL = 1
    RC_HIT_ACTOR = 2
    RC_SHADE_FLOOR_TOP = 4
    RC_SHADE_PIT_FLOOR = 5
    RC_SHADE_CEIL_UNDER = 6
    RC_SHADE_SOFFIT = 7
    RC_DIAG_NW = 1
    RC_DIAG_NE = 2
    RC_DIAG_SE = 3
    RC_DIAG_SW = 4
    RC_SPAN_SIDE_DIAG = 2
    RC_STD_CEIL = 1.0
    RC_UNTAGGED = 999999
    RC_TEX_SIZE = 64
    RC_FLAT_FILL = 1
    RC_SURF_LIGHT_STEP = 0.12
    RC_SURF_SEG_MAX = 6
    RC_FALLOFF_LINEAR = 0
    RC_FALLOFF_QUADRATIC = 1
endconst
