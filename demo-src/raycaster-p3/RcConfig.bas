' RcConfig -- shared constants for the raycaster library.
' Grows each phase. See docs/superpowers/specs/2026-08-31-raycaster-engine-design.md §9.4.
'
' RC_MAX_MARCH_ITERS: a ray crosses at most ~2*RC_MAX_DIST cell boundaries before
' the RC_MAX_DIST cutoff fires, so 512 is a deliberately generous safety cap that
' only bites on a degenerate / NaN direction vector.
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
    RC_SPAN_PORTAL_WALL = 3
    RC_SPAN_PORTAL_CEIL = 4
    RC_SPAN_PORTAL_FLOOR = 5
    RC_SHADE_UPPER_FLOOR = 8
    RC_MAX_INTERVALS = 6
endconst
