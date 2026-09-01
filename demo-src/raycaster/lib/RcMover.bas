Class
' RcMover -- one height-aware movable body for a raycaster scene (spec §7).
' ALL actor-vs-static-scene collision lives here: circle-vs-wall slide, step-up
' onto low ledges, head-clearance blocking, gravity + landing + pit falls.
'
' Usage each frame: set intent (move/turn/look/jump), then step(dt). Read back
' with x()/y()/z()/angle()/pitch()/onGround(). RcRender.bindCamera(mover) makes
' the view follow it.
'
' The RcWorld field is `wld`, NEVER `world` (builtin module -> silent
' mis-transpile -> runtime ReferenceError).
'
' Deferred (spec): actor-vs-actor collision (§7.1), animated lifts, region
' resolution main-vs-upper (Phase 8).
dim wld as RcWorld
dim px
dim py
dim pz
dim vz
dim ang
dim pit
dim rad
dim ht
dim grounded
dim mvFwd
dim mvStrafe
dim wantJump

Constructor(w as RcWorld, x, y, radius, bodyHeight)
    self.wld = w
    self.px = x
    self.py = y
    self.pz = w.floorHeightAt(math.floor(x), math.floor(y))
    self.vz = 0
    self.ang = 0
    self.pit = 0
    self.rad = radius
    self.ht = bodyHeight
    self.grounded = 1
    self.mvFwd = 0
    self.mvStrafe = 0
    self.wantJump = 0
EndConstructor

function move(fwd, strafe)
    self.mvFwd = fwd
    self.mvStrafe = strafe
endfunction

function turn(dAngle)
    self.ang = self.ang + dAngle
endfunction

function look(dPitch)
    self.pit = math.clamp(self.pit + dPitch, 0 - RcConfig.RC_MAX_PITCH, RcConfig.RC_MAX_PITCH)
endfunction

function jump()
    self.wantJump = 1
endfunction

' A cell blocks the body at the current feet height if it's a wall, its floor is
' too high to step onto, or its ceiling leaves less than body-height of headroom.
function blocked(cx, cy)
    if self.wld.wallAt(cx, cy) > 0 then
        return 1
    endif
    if self.wld.floorHeightAt(cx, cy) - self.pz > RcConfig.RC_STEP_UP then
        return 1
    endif
    if self.wld.ceilHeightAt(cx, cy) - self.pz < self.ht then
        return 1
    endif
    return 0
endfunction

function step(dt)
    dim dsec
    dim dirX
    dim dirY
    dim strX
    dim strY
    dim moveX
    dim moveY
    dim nx
    dim ny
    dim cx
    dim cy
    dim groundH

    dsec = dt / 1000.0
    if dsec > 0.1 then
        dsec = 0.1
    endif

    dirX = math.cos(self.ang)
    dirY = math.sin(self.ang)
    strX = 0 - dirY
    strY = dirX

    moveX = (dirX * self.mvFwd + strX * self.mvStrafe) * dsec
    moveY = (dirY * self.mvFwd + strY * self.mvStrafe) * dsec

    ' Horizontal: per-axis slide. The skin offset points the cell check in the
    ' travel direction. blocked() rejects cells that are walls, too-high to step
    ' onto, or too-low-ceilinged; the vertical resolver below does the step-up
    ' snap once, authoritatively, from the cell actually occupied after the move.
    if moveX <> 0 then
        nx = self.px + moveX
        if moveX > 0 then
            cx = math.floor(nx + self.rad)
        else
            cx = math.floor(nx - self.rad)
        endif
        if self.blocked(cx, math.floor(self.py)) = 0 then
            self.px = nx
        endif
    endif

    if moveY <> 0 then
        ny = self.py + moveY
        if moveY > 0 then
            cy = math.floor(ny + self.rad)
        else
            cy = math.floor(ny - self.rad)
        endif
        if self.blocked(math.floor(self.px), cy) = 0 then
            self.py = ny
        endif
    endif

    if self.wantJump = 1 then
        if self.grounded = 1 then
            self.vz = RcConfig.RC_JUMP_VEL
            self.grounded = 0
        endif
    endif
    self.wantJump = 0

    ' Vertical: one authoritative resolution against the floor of the cell now
    ' occupied. groundH below current feet + within step-up -> snap up (walking
    ' onto a low ledge). Otherwise integrate gravity and land when feet reach it
    ' (walking off a ledge / into a pit / descending a jump).
    groundH = self.wld.floorHeightAt(math.floor(self.px), math.floor(self.py))
    if self.grounded = 1 and groundH > self.pz and groundH - self.pz <= RcConfig.RC_STEP_UP then
        self.pz = groundH
        self.vz = 0
    else
        self.vz = self.vz - RcConfig.RC_GRAVITY * dsec
        self.pz = self.pz + self.vz * dsec
        if self.pz <= groundH then
            self.pz = groundH
            self.vz = 0
            self.grounded = 1
        else
            self.grounded = 0
        endif
    endif

    self.mvFwd = 0
    self.mvStrafe = 0
endfunction

function x()
    return self.px
endfunction
function y()
    return self.py
endfunction
function z()
    return self.pz
endfunction
function angle()
    return self.ang
endfunction
function pitch()
    return self.pit
endfunction
function onGround()
    return self.grounded
endfunction

EndClass
