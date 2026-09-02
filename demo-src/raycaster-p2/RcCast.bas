Class
' RcCast -- raycaster span builder (spec docs/superpowers/specs/2026-08-31-raycaster-engine-design.md §4).
' DDA-marches the grid from a ray origin/direction and collects an ordered
' (near->far) list of surface spans. Does NOT stop at the first wall.
'
' Span kinds: RcConfig.RC_SPAN_WALL, RcConfig.RC_SPAN_FLOORSTEP, RcConfig.RC_SPAN_CEILSTEP.
' Each span carries: dist (perpendicular, no fisheye), lo/hi (world-space
' vertical extent), col/row (source cell), side (0 x-hit / 1 y-hit), u (wall
' texture coord 0..1; 0 for steps), tex (texture id string).
'
' Direction (dx,dy) need not be normalized; spanDist and los() are in world
' units regardless because deltaDist = |1/dir|.
'
' NOTE: the RcWorld parameter is named `wld`, NOT `world` -- `world` is a builtin
' module (world.setBackground etc.) and a parameter that shadows a module name is
' silently mis-transpiled (the body refs resolve to a broken class path and throw
' "rccast is not defined" at runtime, with NO compile diagnostic). Keep it `wld`.
'
' Phase 2 scope: no screen projection (Phase 3), no occlusion-window early-out
' (Phase 3), diagonal tiles: Phase 7 (diagHit).
' upper regions: Phase 8 (setRegion + RC_SPAN_PORTAL_* spans).

dim kindArr(0)
dim distArr(0)
dim loArr(0)
dim hiArr(0)
dim colArr(0)
dim rowArr(0)
dim sideArr(0)
dim uArr(0)
dim texArr(0)

' march state (set by beginMarch, advanced by stepMarch)
dim mMapX
dim mMapY
dim mDeltaX
dim mDeltaY
dim mStepX
dim mStepY
dim mSideX
dim mSideY
dim mEntryDist
dim mSide

' Which region the camera is in (0 = lower / default, 1 = upper). Set out-of-band
' by RcRender before its column loop; cast() stays a 5-arg function.
dim castRegion

Constructor()
    self.castRegion = 0
EndConstructor

function setRegion(r)
    self.castRegion = r
endfunction

function regionOf()
    return self.castRegion
endfunction

function reset()
    array.clear(self.kindArr)
    array.clear(self.distArr)
    array.clear(self.loArr)
    array.clear(self.hiArr)
    array.clear(self.colArr)
    array.clear(self.rowArr)
    array.clear(self.sideArr)
    array.clear(self.uArr)
    array.clear(self.texArr)
endfunction

function addSpan(kind, dist, lo, hi, col, row, side, u, tex)
    array.push(self.kindArr, kind)
    array.push(self.distArr, dist)
    array.push(self.loArr, lo)
    array.push(self.hiArr, hi)
    array.push(self.colArr, col)
    array.push(self.rowArr, row)
    array.push(self.sideArr, side)
    array.push(self.uArr, u)
    array.push(self.texArr, tex)
endfunction

' Initialise a DDA march from (ox,oy) heading (dx,dy). No normalization assumed:
' deltaDist = |1/dir|, so mEntryDist comes out as perpendicular (no-fisheye) distance.
function beginMarch(ox, oy, dx, dy)
    self.mMapX = math.floor(ox)
    self.mMapY = math.floor(oy)

    if math.abs(dx) < 0.0001 then
        self.mDeltaX = 1000000
    else
        self.mDeltaX = math.abs(1.0 / dx)
    endif
    if math.abs(dy) < 0.0001 then
        self.mDeltaY = 1000000
    else
        self.mDeltaY = math.abs(1.0 / dy)
    endif

    if dx < 0 then
        self.mStepX = -1
        self.mSideX = (ox - self.mMapX) * self.mDeltaX
    else
        self.mStepX = 1
        self.mSideX = (self.mMapX + 1.0 - ox) * self.mDeltaX
    endif
    if dy < 0 then
        self.mStepY = -1
        self.mSideY = (oy - self.mMapY) * self.mDeltaY
    else
        self.mStepY = 1
        self.mSideY = (self.mMapY + 1.0 - oy) * self.mDeltaY
    endif

    self.mEntryDist = 0
    self.mSide = 0
endfunction

' Advance one cell. After the call: mMapX/mMapY = the newly entered cell,
' mEntryDist = perpendicular distance to that cell's near boundary,
' mSide = 0 if an x-gridline was crossed, 1 if a y-gridline.
function stepMarch()
    if self.mSideX < self.mSideY then
        self.mEntryDist = self.mSideX
        self.mSideX = self.mSideX + self.mDeltaX
        self.mMapX = self.mMapX + self.mStepX
        self.mSide = 0
    else
        self.mEntryDist = self.mSideY
        self.mSideY = self.mSideY + self.mDeltaY
        self.mMapY = self.mMapY + self.mStepY
        self.mSide = 1
    endif
endfunction

' Marches from (ox, oy) along direction (dx, dy). Fills the span arrays.
function cast(wld as RcWorld, ox, oy, dx, dy)
    dim runFloor
    dim runCeil
    dim iters
    dim cellFloor
    dim cellCeil
    dim wallHere
    dim wallX
    dim u
    dim lo
    dim hi
    dim dg
    dim exitD
    dim dh
    dim seeOther

    self.reset()
    self.beginMarch(ox, oy, dx, dy)

    if self.castRegion = 1 then
        runFloor = wld.upperFloorAt(self.mMapX, self.mMapY)
        runCeil = wld.upperCeilAt(self.mMapX, self.mMapY)
    else
        runFloor = wld.floorHeightAt(self.mMapX, self.mMapY)
        runCeil = wld.ceilHeightAt(self.mMapX, self.mMapY)
    endif

    seeOther = 0
    iters = 0
    while iters < RcConfig.RC_MAX_MARCH_ITERS
        iters = iters + 1
        self.stepMarch()

        if self.mEntryDist > RcConfig.RC_MAX_DIST then
            return
        endif

        if self.castRegion = 1 then
            wallHere = 0
            if wld.upperKindAt(self.mMapX, self.mMapY) = 2 then
                wallHere = 1
            endif
        else
            wallHere = wld.wallAt(self.mMapX, self.mMapY)
        endif
        if wallHere > 0 then
            if self.mSide = 0 then
                wallX = oy + self.mEntryDist * dy
            else
                wallX = ox + self.mEntryDist * dx
            endif
            u = wallX - math.floor(wallX)
            self.addSpan(RcConfig.RC_SPAN_WALL, self.mEntryDist, runFloor, runCeil, self.mMapX, self.mMapY, self.mSide, u, wld.wallTexAt(self.mMapX, self.mMapY))
            return
        endif

        if self.castRegion = 0 then
            dg = wld.diagAt(self.mMapX, self.mMapY)
            if dg > 0 then
                exitD = self.mSideX
                if self.mSideY < exitD then
                    exitD = self.mSideY
                endif
                dh = self.diagHit(dg, ox, oy, dx, dy, self.mMapX, self.mMapY, self.mEntryDist, exitD)
                if dh >= 0 then
                    self.addSpan(RcConfig.RC_SPAN_WALL, dh, runFloor, runCeil, self.mMapX, self.mMapY, RcConfig.RC_SPAN_SIDE_DIAG, 0, wld.wallTexAt(self.mMapX, self.mMapY))
                    return
                endif
            endif
        endif

        ' Portal: once the ray crosses a hole, emit the OTHER region's geometry.
        if seeOther = 0 then
            if wld.upperKindAt(self.mMapX, self.mMapY) = 3 then
                seeOther = 1
            endif
        endif
        if seeOther = 1 then
            if self.castRegion = 0 then
                if wld.upperKindAt(self.mMapX, self.mMapY) = 2 then
                    self.addSpan(RcConfig.RC_SPAN_PORTAL_WALL, self.mEntryDist, wld.upperFloorAt(self.mMapX, self.mMapY), wld.upperCeilAt(self.mMapX, self.mMapY), self.mMapX, self.mMapY, 0, 0, "")
                    return
                endif
                if wld.upperKindAt(self.mMapX, self.mMapY) = 1 then
                    self.addSpan(RcConfig.RC_SPAN_PORTAL_FLOOR, self.mEntryDist, wld.upperFloorAt(self.mMapX, self.mMapY), wld.upperFloorAt(self.mMapX, self.mMapY), self.mMapX, self.mMapY, 0, 0, "")
                    self.addSpan(RcConfig.RC_SPAN_PORTAL_CEIL, self.mEntryDist, wld.upperCeilAt(self.mMapX, self.mMapY), wld.upperCeilAt(self.mMapX, self.mMapY), self.mMapX, self.mMapY, 0, 0, "")
                    return
                endif
                if wld.upperKindAt(self.mMapX, self.mMapY) = 3 then
                    self.addSpan(RcConfig.RC_SPAN_PORTAL_CEIL, self.mEntryDist, wld.upperCeilAt(self.mMapX, self.mMapY), wld.upperCeilAt(self.mMapX, self.mMapY), self.mMapX, self.mMapY, 0, 0, "")
                endif
            else
                if wld.upperKindAt(self.mMapX, self.mMapY) <> 1 then
                    self.addSpan(RcConfig.RC_SPAN_PORTAL_FLOOR, self.mEntryDist, wld.floorHeightAt(self.mMapX, self.mMapY), wld.floorHeightAt(self.mMapX, self.mMapY), self.mMapX, self.mMapY, 0, 0, "")
                    if wld.wallAt(self.mMapX, self.mMapY) > 0 then
                        self.addSpan(RcConfig.RC_SPAN_PORTAL_WALL, self.mEntryDist, wld.floorHeightAt(self.mMapX, self.mMapY), wld.ceilHeightAt(self.mMapX, self.mMapY), self.mMapX, self.mMapY, 0, 0, "")
                        return
                    endif
                endif
            endif
        endif

        if self.castRegion = 1 then
            cellFloor = wld.upperFloorAt(self.mMapX, self.mMapY)
            cellCeil = wld.upperCeilAt(self.mMapX, self.mMapY)
        else
            cellFloor = wld.floorHeightAt(self.mMapX, self.mMapY)
            cellCeil = wld.ceilHeightAt(self.mMapX, self.mMapY)
        endif

        if cellFloor <> runFloor then
            lo = math.min(runFloor, cellFloor)
            hi = math.max(runFloor, cellFloor)
            self.addSpan(RcConfig.RC_SPAN_FLOORSTEP, self.mEntryDist, lo, hi, self.mMapX, self.mMapY, self.mSide, 0, wld.floorTexAt(self.mMapX, self.mMapY))
            runFloor = cellFloor
        endif

        if cellCeil <> runCeil then
            lo = math.min(runCeil, cellCeil)
            hi = math.max(runCeil, cellCeil)
            self.addSpan(RcConfig.RC_SPAN_CEILSTEP, self.mEntryDist, lo, hi, self.mMapX, self.mMapY, self.mSide, 0, wld.ceilTexAt(self.mMapX, self.mMapY))
            runCeil = cellCeil
        endif
    endwhile
endfunction

' Line-of-sight: distance to the first opaque wall along (dx,dy), or -1 if none
' within RcConfig.RC_MAX_DIST. Shares beginMarch/stepMarch with cast().
' Does NOT touch the span arrays -- a caller that interleaves los() and cast()
' still reads the last cast()'s spans from spanCount()/spanKind(i)/...
function los(wld as RcWorld, ox, oy, dx, dy)
    dim iters
    dim dg
    dim exitD
    dim dh
    self.beginMarch(ox, oy, dx, dy)
    iters = 0
    while iters < RcConfig.RC_MAX_MARCH_ITERS
        iters = iters + 1
        self.stepMarch()
        if self.mEntryDist > RcConfig.RC_MAX_DIST then
            return -1
        endif
        if wld.wallAt(self.mMapX, self.mMapY) > 0 then
            return self.mEntryDist
        endif
        dg = wld.diagAt(self.mMapX, self.mMapY)
        if dg > 0 then
            exitD = self.mSideX
            if self.mSideY < exitD then
                exitD = self.mSideY
            endif
            dh = self.diagHit(dg, ox, oy, dx, dy, self.mMapX, self.mMapY, self.mEntryDist, exitD)
            if dh >= 0 then
                return dh
            endif
        endif
    endwhile
    return -1
endfunction

' Ray-parameter distance of a diagonal-chord hit in cell (cx,cy), or -1 for a
' miss (ray stays in the cell's open triangle). dg = RcConfig.RC_DIAG_* ;
' entryDist/exitDist = ray params where the ray enters/leaves the cell.
function diagHit(dg, ox, oy, dx, dy, cx, cy, entryDist, exitDist)
    dim eps
    dim ex0
    dim ey0
    dim f0
    dim denom
    dim solidPos
    dim s

    eps = 0.00001
    ex0 = ox + entryDist * dx
    ey0 = oy + entryDist * dy
    f0 = 0
    denom = 0
    solidPos = 0
    s = 0

    if dg = RcConfig.RC_DIAG_NW or dg = RcConfig.RC_DIAG_SE then
        f0 = (ex0 - cx) + (ey0 - cy) - 1.0
        denom = dx + dy
    else
        f0 = (ex0 - cx) - (ey0 - cy)
        denom = dx - dy
    endif

    if dg = RcConfig.RC_DIAG_SE or dg = RcConfig.RC_DIAG_NE then
        solidPos = 1
    endif

    ' entered already on / inside the solid side -> hit at the cell boundary
    if solidPos = 1 then
        if f0 >= 0 - eps then
            return entryDist
        endif
    else
        if f0 <= eps then
            return entryDist
        endif
    endif

    ' does the ray cross the chord inside this cell?
    if math.abs(denom) < eps then
        return 0 - 1
    endif
    if dg = RcConfig.RC_DIAG_NW or dg = RcConfig.RC_DIAG_SE then
        s = (cx + cy + 1.0 - ox - oy) / denom
    else
        s = (cx - cy - ox + oy) / denom
    endif
    if s < entryDist - eps then
        return 0 - 1
    endif
    if s > exitDist + eps then
        return 0 - 1
    endif
    return s
endfunction

function spanCount()
    return array.arrLength(self.kindArr)
endfunction

function spanKind(i)
    return self.kindArr(i)
endfunction

function spanDist(i)
    return self.distArr(i)
endfunction

function spanLo(i)
    return self.loArr(i)
endfunction

function spanHi(i)
    return self.hiArr(i)
endfunction

function spanCol(i)
    return self.colArr(i)
endfunction

function spanRow(i)
    return self.rowArr(i)
endfunction

function spanSide(i)
    return self.sideArr(i)
endfunction

function spanU(i)
    return self.uArr(i)
endfunction

function spanTex(i)
    return self.texArr(i)
endfunction

EndClass
