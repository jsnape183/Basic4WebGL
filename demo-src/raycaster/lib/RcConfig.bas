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
endconst
