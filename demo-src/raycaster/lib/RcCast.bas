Class
' RcCast -- raycaster span builder (spec docs/superpowers/specs/2026-08-31-raycaster-engine-design.md §4).
' DDA-marches the grid from a ray origin/direction and collects an ordered
' (near->far) list of surface spans. Does NOT stop at the first wall.
'
' Span kinds: RcConfig.RC_SPAN_WALL, RcConfig.RC_SPAN_FLOORSTEP, RcConfig.RC_SPAN_CEILSTEP.
' Each span carries: dist (perpendicular, no fisheye), lo/hi (world-space
' vertical extent), col/row (source cell), u (wall texture coord 0..1; 0 for
' steps), tex (texture id string).
'
' Phase 2 scope: no screen projection (Phase 3), no occlusion-window early-out
' (Phase 3), no upper regions (Phase 8), no diagonal tiles (Phase 7).

dim kindArr(0)
dim distArr(0)
dim loArr(0)
dim hiArr(0)
dim colArr(0)
dim rowArr(0)
dim uArr(0)
dim texArr(0)

Constructor()
EndConstructor

function reset()
    array.clear(self.kindArr)
    array.clear(self.distArr)
    array.clear(self.loArr)
    array.clear(self.hiArr)
    array.clear(self.colArr)
    array.clear(self.rowArr)
    array.clear(self.uArr)
    array.clear(self.texArr)
endfunction

function addSpan(kind, dist, lo, hi, col, row, u, tex)
    array.push(self.kindArr, kind)
    array.push(self.distArr, dist)
    array.push(self.loArr, lo)
    array.push(self.hiArr, hi)
    array.push(self.colArr, col)
    array.push(self.rowArr, row)
    array.push(self.uArr, u)
    array.push(self.texArr, tex)
endfunction

' Marches from (ox, oy) along direction (dx, dy). Fills the span arrays.
function cast(world as RcWorld, ox, oy, dx, dy)
    dim mapX
    dim mapY
    dim deltaDistX
    dim deltaDistY
    dim stepX
    dim stepY
    dim sideDistX
    dim sideDistY
    dim side
    dim entryDist
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

    self.reset()

    mapX = math.floor(ox)
    mapY = math.floor(oy)

    if math.abs(dx) < 0.0001 then
        deltaDistX = 1000000
    else
        deltaDistX = math.abs(1.0 / dx)
    endif
    if math.abs(dy) < 0.0001 then
        deltaDistY = 1000000
    else
        deltaDistY = math.abs(1.0 / dy)
    endif

    if dx < 0 then
        stepX = -1
        sideDistX = (ox - mapX) * deltaDistX
    else
        stepX = 1
        sideDistX = (mapX + 1.0 - ox) * deltaDistX
    endif
    if dy < 0 then
        stepY = -1
        sideDistY = (oy - mapY) * deltaDistY
    else
        stepY = 1
        sideDistY = (mapY + 1.0 - oy) * deltaDistY
    endif

    runFloor = world.floorHeightAt(mapX, mapY)
    runCeil = world.ceilHeightAt(mapX, mapY)

    iters = 0
    while iters < 512
        iters = iters + 1

        if sideDistX < sideDistY then
            entryDist = sideDistX
            sideDistX = sideDistX + deltaDistX
            mapX = mapX + stepX
            side = 0
        else
            entryDist = sideDistY
            sideDistY = sideDistY + deltaDistY
            mapY = mapY + stepY
            side = 1
        endif

        if entryDist > RcConfig.RC_MAX_DIST then
            return
        endif

        wallHere = world.wallAt(mapX, mapY)
        if wallHere > 0 then
            if side = 0 then
                wallX = oy + entryDist * dy
            else
                wallX = ox + entryDist * dx
            endif
            u = wallX - math.floor(wallX)
            self.addSpan(RcConfig.RC_SPAN_WALL, entryDist, runFloor, runCeil, mapX, mapY, u, world.wallTexAt(mapX, mapY))
            return
        endif

        cellFloor = world.floorHeightAt(mapX, mapY)
        cellCeil = world.ceilHeightAt(mapX, mapY)

        if cellFloor <> runFloor then
            lo = math.min(runFloor, cellFloor)
            hi = math.max(runFloor, cellFloor)
            self.addSpan(RcConfig.RC_SPAN_FLOORSTEP, entryDist, lo, hi, mapX, mapY, 0, world.floorTexAt(mapX, mapY))
            runFloor = cellFloor
        endif

        if cellCeil <> runCeil then
            lo = math.min(runCeil, cellCeil)
            hi = math.max(runCeil, cellCeil)
            self.addSpan(RcConfig.RC_SPAN_CEILSTEP, entryDist, lo, hi, mapX, mapY, 0, world.ceilTexAt(mapX, mapY))
            runCeil = cellCeil
        endif
    endwhile
endfunction

' Line-of-sight: distance to the first opaque wall along (dx,dy), or -1 if none
' within RcConfig.RC_MAX_DIST. Same march, no span construction.
function los(world as RcWorld, ox, oy, dx, dy)
    dim mapX
    dim mapY
    dim deltaDistX
    dim deltaDistY
    dim stepX
    dim stepY
    dim sideDistX
    dim sideDistY
    dim entryDist
    dim iters

    mapX = math.floor(ox)
    mapY = math.floor(oy)

    if math.abs(dx) < 0.0001 then
        deltaDistX = 1000000
    else
        deltaDistX = math.abs(1.0 / dx)
    endif
    if math.abs(dy) < 0.0001 then
        deltaDistY = 1000000
    else
        deltaDistY = math.abs(1.0 / dy)
    endif

    if dx < 0 then
        stepX = -1
        sideDistX = (ox - mapX) * deltaDistX
    else
        stepX = 1
        sideDistX = (mapX + 1.0 - ox) * deltaDistX
    endif
    if dy < 0 then
        stepY = -1
        sideDistY = (oy - mapY) * deltaDistY
    else
        stepY = 1
        sideDistY = (mapY + 1.0 - oy) * deltaDistY
    endif

    iters = 0
    while iters < 512
        iters = iters + 1
        if sideDistX < sideDistY then
            entryDist = sideDistX
            sideDistX = sideDistX + deltaDistX
            mapX = mapX + stepX
        else
            entryDist = sideDistY
            sideDistY = sideDistY + deltaDistY
            mapY = mapY + stepY
        endif
        if entryDist > RcConfig.RC_MAX_DIST then
            return -1
        endif
        if world.wallAt(mapX, mapY) > 0 then
            return entryDist
        endif
    endwhile
    return -1
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

function spanU(i)
    return self.uArr(i)
endfunction

function spanTex(i)
    return self.texArr(i)
endfunction

EndClass
