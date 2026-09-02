Class
' RcRender -- first-person renderer for RcWorld (spec §5). Owns the camera
' (spec §7.3 -- the `camera` module is inert in a raycast scene). Call
' renderFrame() from the scene's onupdate(delta).
'
' FLAT-SHADED strips (drawing.drawRect, shaded by distance + surface kind, and
' by RcLights per strip when bindLights() is set -- Phase 5). No wall textures /
' atlas / vertical texture-clip yet. The occlusion model handles floor/ceiling
' RISES + flat sky/floor fill. Phase 6b: floor/ceiling step *risers* AND the
' horizontal surfaces between them (step tops, pit floors, ceiling undersides,
' soffits) are drawn as flat per-column strips. Floor/ceiling *textures* are
' still not sampled.
'
' Phase 7: a diagonal-tile wall arrives as a span with side RC_SPAN_SIDE_DIAG;
' it is drawn with the y-face wall shade and its light is sampled from the
' (half-open) diagonal cell itself.
'
' Phase 8: the camera's region (0 lower / 1 upper) is derived each frame and
' pushed to RcCast via setRegion(). RcCast then emits the OTHER region's geometry
' as RC_SPAN_PORTAL_WALL/CEIL/FLOOR spans once a ray crosses a hole; the span walk
' below draws them and eats the screen window from the TOP (camera lower, looking
' up) or the BOTTOM (camera upper, looking down). Portal-span lighting is
' region-blind (sampled from the lower-region light grid) -- a documented v1 limit.
'
' Phase 6: depthArr holds the nearest wall's perpendicular distance per screen
' column; drawActors() (when bindActors() is set) projects RcActors billboards
' and clips them column-by-column against it. Billboards are NOT lit yet -- that
' waits on a tint parameter for drawImageStrip (spec §5.3 rung 3 / §6.3).
'
' The RcWorld parameter is `wld`, NEVER `world` (builtin module -> silent
' mis-transpile -> runtime ReferenceError).
dim wld as RcWorld
dim rc as RcCast
dim camX
dim camY
dim camAngle
dim camPitch
dim fovScale
dim viewW
dim viewH
dim scy
dim cols
dim camZ
dim boundMover
dim boundLights
dim boundActors
dim fDirX
dim fDirY
dim fPlaneX
dim fPlaneY
dim depthArr(0)
dim actorOrderIdx(0)
dim actorOrderDepth(0)
dim surfCountLast

Constructor(w as RcWorld)
    dim di
    self.wld = w
    self.rc = new RcCast()
    self.camX = 2.0
    self.camY = 2.0
    self.camAngle = 0
    self.camPitch = 0
    self.fovScale = 0.66
    self.viewW = stage.width()
    self.viewH = stage.height()
    self.scy = self.viewH / 2
    self.cols = math.floor(self.viewW / RcConfig.RC_STRIP_W)
    self.camZ = 0
    self.boundMover = 0
    self.boundLights = 0
    self.boundActors = 0
    self.surfCountLast = 0
    self.fDirX = 1
    self.fDirY = 0
    self.fPlaneX = 0
    self.fPlaneY = self.fovScale
    for di = 0 to self.cols - 1
        array.push(self.depthArr, RcConfig.RC_MAX_DIST)
    next di
EndConstructor

function bindCamera(mover)
    self.boundMover = mover
endfunction

function bindActors(actors)
    self.boundActors = actors
endfunction

' Perpendicular wall distance for screen column col. Out-of-range columns return
' 0 (nearer than any wall) so a billboard clipped against them never draws
' off-screen; an in-range column with no wall hit returns RcConfig.RC_MAX_DIST.
function depthAt(col)
    if col < 0 then
        return 0
    endif
    if col >= self.cols then
        return 0
    endif
    return self.depthArr(col)
endfunction

' Screen pixel X of world point (wx, wy) along the current camera basis, or -1
' if the point is behind the camera plane. Uses last renderFrame()'s basis.
function worldToScreenX(wx, wy)
    dim relX
    dim relY
    dim invDet
    dim depth
    dim tX
    relX = wx - self.camX
    relY = wy - self.camY
    invDet = 1.0 / (self.fPlaneX * self.fDirY - self.fDirX * self.fPlaneY)
    depth = invDet * (0 - self.fPlaneY * relX + self.fPlaneX * relY)
    if depth <= 0.05 then
        return -1
    endif
    tX = invDet * (self.fDirY * relX - self.fDirX * relY)
    return (self.viewW / 2) * (1.0 + tX / depth)
endfunction

' Billboard pass -- project every visible RcActor, sort far->near, and draw each
' as depth-clipped vertical strips against depthArr (spec §5.4 / §8). One source
' frame is a horizontal slice frameW px wide at (frame index * frameW); the
' sprite is drawn RC_ACTOR_HEIGHT world-units tall, width scaled by frameW/frameH.
' No per-actor tint yet -- drawImageStrip has no tint param (spec §5.3 rung 3).
function drawActors()
    dim n
    dim i
    dim j
    dim m
    dim a as RcActor
    dim relX
    dim relY
    dim invDet
    dim depth
    dim tX
    dim cx
    dim feetY
    dim headY
    dim hPx
    dim wPx
    dim fw
    dim fh
    dim leftPx
    dim c0
    dim c1
    dim c
    dim centerPx
    dim frac
    dim srcX
    dim tmpI
    dim tmpD

    invDet = 1.0 / (self.fPlaneX * self.fDirY - self.fDirX * self.fPlaneY)
    n = self.boundActors.poolSize()

    ' collect visible, in-front actors with their forward depth
    array.clear(self.actorOrderIdx)
    array.clear(self.actorOrderDepth)
    for i = 0 to n - 1
        a = self.boundActors.actorAt(i)
        if a.visible() = 1 then
            relX = a.x() - self.camX
            relY = a.y() - self.camY
            depth = invDet * (0 - self.fPlaneY * relX + self.fPlaneX * relY)
            if depth > 0.05 then
                array.push(self.actorOrderIdx, i)
                array.push(self.actorOrderDepth, depth)
            endif
        endif
    next i

    ' insertion sort by depth descending (far first) -- pool is small (<= 32)
    m = array.arrLength(self.actorOrderIdx)
    for i = 1 to m - 1
        tmpI = self.actorOrderIdx(i)
        tmpD = self.actorOrderDepth(i)
        j = i - 1
        while j >= 0 and self.actorOrderDepth(j) < tmpD
            self.actorOrderIdx(j + 1) = self.actorOrderIdx(j)
            self.actorOrderDepth(j + 1) = self.actorOrderDepth(j)
            j = j - 1
        endwhile
        self.actorOrderIdx(j + 1) = tmpI
        self.actorOrderDepth(j + 1) = tmpD
    next i

    for i = 0 to m - 1
        a = self.boundActors.actorAt(self.actorOrderIdx(i))
        depth = self.actorOrderDepth(i)
        fw = a.frameW()
        fh = a.frameH()
        if fh <= 0 then
            fh = 1
        endif

        relX = a.x() - self.camX
        relY = a.y() - self.camY
        tX = invDet * (self.fDirY * relX - self.fDirX * relY)
        cx = (self.viewW / 2) * (1.0 + tX / depth)

        feetY = self.projectY(a.z(), depth)
        headY = self.projectY(a.z() + RcConfig.RC_ACTOR_HEIGHT, depth)
        hPx = feetY - headY
        wPx = hPx * (fw / fh)

        leftPx = cx - wPx / 2
        c0 = math.floor(leftPx / RcConfig.RC_STRIP_W)
        c1 = math.floor((cx + wPx / 2) / RcConfig.RC_STRIP_W)
        if c0 < 0 then
            c0 = 0
        endif
        if c1 > self.cols - 1 then
            c1 = self.cols - 1
        endif

        for c = c0 to c1
            if depth < self.depthAt(c) then
                centerPx = c * RcConfig.RC_STRIP_W + RcConfig.RC_STRIP_W / 2
                frac = (centerPx - leftPx) / wPx
                if frac >= 0 and frac <= 1 then
                    srcX = math.floor(a.frame() * fw + frac * fw)
                    drawing.drawImageStrip(a.image(), srcX, centerPx, (feetY + headY) / 2, RcConfig.RC_STRIP_W, hPx)
                endif
            endif
        next c
    next i
endfunction

function bindLights(lights)
    self.boundLights = lights
endfunction

function setCamera(x, y, angle, pitch)
    self.camX = x
    self.camY = y
    self.camAngle = angle
    self.camPitch = math.clamp(pitch, 0 - RcConfig.RC_MAX_PITCH, RcConfig.RC_MAX_PITCH)
endfunction

function setFov(degrees)
    self.fovScale = math.tan(degrees * 0.5 * math.pi() / 180.0)
endfunction

function columnCount()
    return self.cols
endfunction

' Debug/probe hook: number of horizontal-surface strips drawn during the last
' renderFrame(). A billboard/probe uses it to confirm the surface pass ran; a
' small over-count from window-clipped strips is fine.
function surfaceCount()
    return self.surfCountLast
endfunction

' Screen Y of world height h at perpendicular distance d.
function projectY(h, d)
    dim dd
    dd = d
    if dd < 0.05 then
        dd = 0.05
    endif
    return self.scy + (self.camZ + RcConfig.RC_EYE_Z - h) * (self.viewH / dd) + self.camPitch
endfunction

' Draws a vertical strip [sTop..sBot] clipped to [winTop..winBot], flat-shaded.
' shadeKind: 0 wall x-side, 1 wall y-side, 2 floor-step, 3 ceil-step.
function drawStrip(destX, sTop, sBot, winTop, winBot, shadeKind, lightLevel)
    dim t
    dim b
    dim g
    dim rr
    dim gg
    dim bb
    t = sTop
    b = sBot
    if t < winTop then
        t = winTop
    endif
    if b > winBot then
        b = winBot
    endif
    if b <= t then
        return 0
    endif
    g = 150
    if shadeKind = 1 then
        g = 115
    endif
    if shadeKind = 2 then
        g = 90
    endif
    if shadeKind = 3 then
        g = 65
    endif
    if shadeKind = 4 then
        g = 105
    endif
    if shadeKind = 5 then
        g = 60
    endif
    if shadeKind = 6 then
        g = 80
    endif
    if shadeKind = 7 then
        g = 50
    endif
    if shadeKind = 8 then
        g = 70
    endif
    rr = math.clamp(g * lightLevel, 0, 255)
    gg = math.clamp(g * lightLevel, 0, 255)
    bb = math.clamp((g + 25) * lightLevel, 0, 255)
    pen.setLineWidth(0)
    pen.setFillColor(rr, gg, bb)
    drawing.drawRect(destX, (t + b) / 2, RcConfig.RC_STRIP_W, b - t)
    return 1
endfunction

' Draw one flat horizontal surface at world height hh, from depth dNear to dFar,
' as a per-column strip. Orders the two projected Ys so drawStrip always gets
' top < bottom (a floor below eye and a ceiling above it project inverted).
' Bumps surfCountLast only when a strip is actually painted.
function drawSurface(destX, hh, dNear, dFar, winTop, winBot, kind, lite)
    dim ya
    dim yb
    ya = self.projectY(hh, dNear)
    yb = self.projectY(hh, dFar)
    if ya <= yb then
        self.surfCountLast = self.surfCountLast + self.drawStrip(destX, ya, yb, winTop, winBot, kind, lite)
    else
        self.surfCountLast = self.surfCountLast + self.drawStrip(destX, yb, ya, winTop, winBot, kind, lite)
    endif
endfunction

function renderFrame()
    dim dirX
    dim dirY
    dim planeX
    dim planeY
    dim col
    dim cameraX
    dim rayX
    dim rayY
    dim i
    dim n
    dim winTop
    dim winBot
    dim runFloorH
    dim runCeilH
    dim kind
    dim d
    dim sTop
    dim sBot
    dim destX
    dim newH
    dim newY
    dim camCol
    dim camRow
    dim horizon
    dim fh
    dim lite
    dim bgLite
    dim hitWall
    dim sfH
    dim sfD
    dim sfKind
    dim sfLite
    dim scH
    dim scD
    dim scKind
    dim scLite
    dim wshade
    dim camRegion
    dim pShade

    if self.boundMover <> 0 then
        self.camX = self.boundMover.x()
        self.camY = self.boundMover.y()
        self.camAngle = self.boundMover.angle()
        self.camPitch = self.boundMover.pitch()
        self.camZ = self.boundMover.z()
    endif

    bgLite = 1.0
    self.surfCountLast = 0
    if self.boundLights <> 0 then
        bgLite = self.boundLights.sampleCell(math.floor(self.camX), math.floor(self.camY))
    endif

    horizon = self.scy + self.camPitch
    fh = self.viewH - horizon
    if fh < 0 then
        fh = 0
    endif

    drawing.clear()

    pen.setLineWidth(0)
    pen.setFillColor(28 * bgLite, 32 * bgLite, 46 * bgLite)
    drawing.drawRect(self.viewW / 2, self.viewH / 2, self.viewW, self.viewH)
    if fh > 0 then
        pen.setFillColor(20 * bgLite, 18 * bgLite, 16 * bgLite)
        drawing.drawRect(self.viewW / 2, horizon + fh / 2, self.viewW, fh)
    endif

    dirX = math.cos(self.camAngle)
    dirY = math.sin(self.camAngle)
    planeX = 0 - dirY * self.fovScale
    planeY = dirX * self.fovScale
    self.fDirX = dirX
    self.fDirY = dirY
    self.fPlaneX = planeX
    self.fPlaneY = planeY

    camCol = math.floor(self.camX)
    camRow = math.floor(self.camY)

    ' Camera region. Height-based fallback for now.
    ' Phase 8 / Task 6: switch to self.boundMover.regionId() once RcMover carries it.
    camRegion = 0
    if self.wld.upperKindAt(camCol, camRow) > 0 then
        if self.camZ >= self.wld.upperFloorAt(camCol, camRow) then
            camRegion = 1
        endif
    endif
    self.rc.setRegion(camRegion)

    for col = 0 to self.cols - 1
        cameraX = (2.0 * col / self.cols) - 1.0
        rayX = dirX + planeX * cameraX
        rayY = dirY + planeY * cameraX

        self.rc.cast(self.wld, self.camX, self.camY, rayX, rayY)

        winTop = 0
        winBot = self.viewH
        if camRegion = 1 then
            runFloorH = self.wld.upperFloorAt(camCol, camRow)
            runCeilH = self.wld.upperCeilAt(camCol, camRow)
        else
            runFloorH = self.wld.floorHeightAt(camCol, camRow)
            runCeilH = self.wld.ceilHeightAt(camCol, camRow)
        endif
        destX = col * RcConfig.RC_STRIP_W + RcConfig.RC_STRIP_W / 2
        self.depthArr(col) = RcConfig.RC_MAX_DIST

        ' pending floor/ceiling surface: world-height, near-depth, shade kind, light
        hitWall = 0
        sfH = runFloorH
        sfD = 0
        sfKind = RcConfig.RC_SHADE_FLOOR_TOP
        scH = runCeilH
        scD = 0
        scKind = RcConfig.RC_SHADE_CEIL_UNDER
        sfLite = 1.0
        scLite = 1.0
        if self.boundLights <> 0 then
            sfLite = self.boundLights.sampleCell(camCol, camRow)
            scLite = sfLite
        endif

        n = self.rc.spanCount()
        i = 0
        while i < n
            kind = self.rc.spanKind(i)
            d = self.rc.spanDist(i)
            sTop = self.projectY(self.rc.spanHi(i), d)
            sBot = self.projectY(self.rc.spanLo(i), d)

            lite = 1.0
            if self.boundLights <> 0 then
                if kind = RcConfig.RC_SPAN_WALL then
                    if self.rc.spanSide(i) = RcConfig.RC_SPAN_SIDE_DIAG then
                        lite = self.boundLights.sampleCell(self.rc.spanCol(i), self.rc.spanRow(i))
                    else
                        if self.rc.spanSide(i) = 0 then
                            lite = self.boundLights.sampleCell(self.rc.spanCol(i) - math.sign(rayX), self.rc.spanRow(i))
                        else
                            lite = self.boundLights.sampleCell(self.rc.spanCol(i), self.rc.spanRow(i) - math.sign(rayY))
                        endif
                    endif
                else
                    lite = self.boundLights.sampleCell(self.rc.spanCol(i), self.rc.spanRow(i))
                endif
            endif

            if kind = RcConfig.RC_SPAN_PORTAL_WALL or kind = RcConfig.RC_SPAN_PORTAL_CEIL or kind = RcConfig.RC_SPAN_PORTAL_FLOOR then
                pShade = 1
                if kind = RcConfig.RC_SPAN_PORTAL_CEIL then
                    pShade = 3
                endif
                if kind = RcConfig.RC_SPAN_PORTAL_FLOOR then
                    pShade = RcConfig.RC_SHADE_UPPER_FLOOR
                endif
                if camRegion = 0 then
                    ' the other region is ABOVE -> fill from the current window top
                    ' down to the portal plane, then eat the window from the top
                    self.drawStrip(destX, winTop, sBot, winTop, winBot, pShade, lite)
                    if sBot > winTop then
                        winTop = sBot
                    endif
                else
                    ' the other region is BELOW -> fill from the portal plane down
                    ' to the current window bottom, then eat from the bottom
                    self.drawStrip(destX, sTop, winBot, winTop, winBot, pShade, lite)
                    if sTop < winBot then
                        winBot = sTop
                    endif
                endif
                i = i + 1
            else
            if kind = RcConfig.RC_SPAN_WALL then
                self.drawSurface(destX, sfH, sfD, d, winTop, winBot, sfKind, sfLite)
                self.drawSurface(destX, scH, scD, d, winTop, winBot, scKind, scLite)
                hitWall = 1
                wshade = self.rc.spanSide(i)
                if wshade = RcConfig.RC_SPAN_SIDE_DIAG then
                    wshade = 1
                endif
                self.drawStrip(destX, sTop, sBot, winTop, winBot, wshade, lite)
                self.depthArr(col) = d
                i = n
            else
                ' Floor and ceiling steps are mirror images: a floor RISE clamps winBot from
                ' below (can't see under a raised floor); a ceiling DROP clamps winTop from
                ' above (can't see above a lowered ceiling). A floor DROP / ceiling RISE leaves
                ' the window open -- farther geometry shows through (documented header gap).
                if kind = RcConfig.RC_SPAN_FLOORSTEP then
                    newH = self.wld.floorHeightAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    self.drawSurface(destX, sfH, sfD, d, winTop, winBot, sfKind, sfLite)
                    self.drawStrip(destX, sTop, sBot, winTop, winBot, 2, lite)
                    if newH > runFloorH then
                        newY = self.projectY(newH, d)
                        if newY < winBot then
                            winBot = newY
                        endif
                    endif
                    sfD = d
                    if newH < runFloorH then
                        sfKind = RcConfig.RC_SHADE_PIT_FLOOR
                    else
                        sfKind = RcConfig.RC_SHADE_FLOOR_TOP
                    endif
                    sfH = newH
                    ' RcCast records the cell just ENTERED (its floor = newH, the first cell
                    ' of this segment), so `lite` here is that segment's own light -- correct.
                    sfLite = lite
                    runFloorH = newH
                else
                    newH = self.wld.ceilHeightAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    self.drawSurface(destX, scH, scD, d, winTop, winBot, scKind, scLite)
                    self.drawStrip(destX, sTop, sBot, winTop, winBot, 3, lite)
                    if newH < runCeilH then
                        newY = self.projectY(newH, d)
                        if newY > winTop then
                            winTop = newY
                        endif
                    endif
                    scD = d
                    if newH < runCeilH then
                        scKind = RcConfig.RC_SHADE_SOFFIT
                    else
                        scKind = RcConfig.RC_SHADE_CEIL_UNDER
                    endif
                    scH = newH
                    scLite = lite
                    runCeilH = newH
                endif
                i = i + 1
            endif
            endif

            if winTop >= winBot then
                i = n
            endif
        endwhile

        if hitWall = 0 then
            self.drawSurface(destX, sfH, sfD, RcConfig.RC_MAX_DIST, winTop, winBot, sfKind, sfLite)
            self.drawSurface(destX, scH, scD, RcConfig.RC_MAX_DIST, winTop, winBot, scKind, scLite)
        endif
    next col

    if self.boundActors <> 0 then
        self.drawActors()
    endif
endfunction

EndClass
