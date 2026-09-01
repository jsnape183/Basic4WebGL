' RcConfig -- shared constants for the raycaster library.
' Grows each phase. See docs/superpowers/specs/2026-08-31-raycaster-engine-design.md §9.4.
const
    RC_MAX_DIST = 32
    RC_SPAN_WALL = 0
    RC_SPAN_FLOORSTEP = 1
    RC_SPAN_CEILSTEP = 2
endconst
