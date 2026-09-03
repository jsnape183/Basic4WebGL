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
' Occlusion is a single per-column window [winTop, winBot]: a floor RISE clamps
' winBot up from the ground, a ceiling DROP clamps winTop down; a floor DROP or
' ceiling RISE leaves the window open so farther geometry shows through. Wall
' faces blit textured (drawWallStrip) when a wall texture resolves, else flat.
' Floor/ceiling surfaces are flat-shaded, coloured per tile by fcol:/ccol: tags,
' and lit by RcLights.sampleAt (bilinear). Floor/ceiling TEXTURES are not drawn.
'
' Phase 6: depthArr holds the nearest wall's perpendicular distance per screen
' column; drawActors() (when bindActors() is set) projects RcActors billboards
' and clips them column-by-column against it. Billboards are tinted by the
' actor's sampled light via drawImageStrip's tint parameter (spec §5.3 rung 3 / §6.3).
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
' Scene-level texture defaults (Phase texturing). "" = untextured (flat grey
' path). Per-cell tex:/ftex:/ctex: markers via wld.*TexAt override these.
dim defWallTex

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
    self.defWallTex = ""
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
' Each billboard is tinted by its cell's sampled light (spec §5.3 rung 3).
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
    dim aLite
    dim aCh
    dim aTint

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
                    aLite = 1.0
                    if self.boundLights <> 0 then
                        aLite = self.boundLights.sampleAt(a.x(), a.y())
                    endif
                    aCh = 255 * aLite
                    aTint = self.packTint(aCh, aCh, aCh)
                    drawing.drawImageStrip(a.image(), srcX, centerPx, (feetY + headY) / 2, RcConfig.RC_STRIP_W, hPx, aTint, 0, 1)
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

' Pack three 0..255 colour channels into a single tint number (no bitwise ops in
' softBASIC -- multiply by the channel place values). Used for billboard and
' textured-wall tints.
function packTint(r, g, b)
    return math.floor(math.clamp(r, 0, 255)) * 65536 + math.floor(math.clamp(g, 0, 255)) * 256 + math.floor(math.clamp(b, 0, 255))
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
    rr = math.clamp(g * lightLevel, 0, 255)
    gg = math.clamp(g * lightLevel, 0, 255)
    bb = math.clamp((g + 25) * lightLevel, 0, 255)
    pen.setLineWidth(0)
    pen.setFillColor(rr, gg, bb)
    drawing.drawRect(destX, (t + b) / 2, RcConfig.RC_STRIP_W, b - t)
    return 1
endfunction

' The perpendicular distance at which this column's ray (rayX, rayY) leaves the
' grid cell it occupies at tStart, clamped to tMax. One DDA step (nearest x/y
' crossing). Used only for the per-tile colour march.
function surfaceRunEnd(tStart, tMax, rayX, rayY)
    dim px
    dim py
    dim cx
    dim cy
    dim tx
    dim ty
    dim t
    px = self.camX + rayX * (tStart + 0.0001)
    py = self.camY + rayY * (tStart + 0.0001)
    cx = math.floor(px)
    cy = math.floor(py)
    tx = tMax
    ty = tMax
    if rayX > 0.00001 then
        tx = (cx + 1 - self.camX) / rayX
    endif
    if rayX < 0 - 0.00001 then
        tx = (cx - self.camX) / rayX
    endif
    if rayY > 0.00001 then
        ty = (cy + 1 - self.camY) / rayY
    endif
    if rayY < 0 - 0.00001 then
        ty = (cy - self.camY) / rayY
    endif
    t = tx
    if ty < t then
        t = ty
    endif
    if t > tMax then
        t = tMax
    endif
    if t <= tStart then
        t = tMax
    endif
    return t
endfunction

' Draw one flat horizontal sub-band at world height hh from dNear to dFar,
' clipped to [winTop, winBot]. packed < 0 -> the default `kind` grey shade;
' packed >= 0 -> that RGB (r*65536 + g*256 + b). Lit by sampleAt at the band
' midpoint when lights are bound, else by `lite`.
function drawFlatSeg(destX, hh, dNear, dFar, winTop, winBot, kind, packed, lite, rayX, rayY)
    dim ya
    dim yb
    dim yTop
    dim yBot
    dim useLite
    dim rr
    dim gg
    dim bb
    ya = self.projectY(hh, dNear)
    yb = self.projectY(hh, dFar)
    if ya <= yb then
        yTop = ya
        yBot = yb
    else
        yTop = yb
        yBot = ya
    endif
    if yTop < winTop then
        yTop = winTop
    endif
    if yBot > winBot then
        yBot = winBot
    endif
    if yBot <= yTop then
        return
    endif
    useLite = lite
    if self.boundLights <> 0 then
        useLite = self.boundLights.sampleAt(self.camX + rayX * ((dNear + dFar) / 2), self.camY + rayY * ((dNear + dFar) / 2))
    endif
    if packed < 0 then
        self.surfCountLast = self.surfCountLast + self.drawStrip(destX, yTop, yBot, winTop, winBot, kind, useLite)
    else
        rr = math.floor(packed / 65536)
        gg = math.floor(packed / 256) - rr * 256
        bb = packed - rr * 65536 - gg * 256
        pen.setLineWidth(0)
        pen.setFillColor(math.clamp(rr * useLite, 0, 255), math.clamp(gg * useLite, 0, 255), math.clamp(bb * useLite, 0, 255))
        drawing.drawRect(destX, (yTop + yBot) / 2, RcConfig.RC_STRIP_W, yBot - yTop)
        self.surfCountLast = self.surfCountLast + 1
    endif
endfunction

' Draw a floor/ceiling surface at world height hh from dNear to dFar, clipped to
' [winTop, winBot]. No fcol:/ccol: anywhere -> one strip. Otherwise march the
' grid cells the band crosses and emit one sub-band per contiguous run of the
' same resolved colour (default shade counts as a colour for coalescing).
function drawSurface(destX, hh, dNear, dFar, winTop, winBot, kind, lite, rayX, rayY)
    dim eyeZ
    dim isFloor
    dim a
    dim b
    dim runStart
    dim runCol
    dim segCol
    dim mx
    dim my
    dim guard
    if self.wld.hasSurfaceColor() = 0 then
        self.drawFlatSeg(destX, hh, dNear, dFar, winTop, winBot, kind, 0 - 1, lite, rayX, rayY)
        return
    endif
    eyeZ = self.camZ + RcConfig.RC_EYE_Z
    isFloor = 0
    if hh < eyeZ then
        isFloor = 1
    endif
    a = dNear
    runStart = dNear
    runCol = 0 - 2
    guard = 0
    while a < dFar - 0.0001 and guard < 128
        guard = guard + 1
        b = self.surfaceRunEnd(a, dFar, rayX, rayY)
        mx = self.camX + rayX * ((a + b) / 2)
        my = self.camY + rayY * ((a + b) / 2)
        if isFloor = 1 then
            segCol = self.wld.floorColAt(math.floor(mx), math.floor(my))
        else
            segCol = self.wld.ceilColAt(math.floor(mx), math.floor(my))
        endif
        if runCol = 0 - 2 then
            runCol = segCol
        endif
        if segCol <> runCol then
            self.drawFlatSeg(destX, hh, runStart, a, winTop, winBot, kind, runCol, lite, rayX, rayY)
            runStart = a
            runCol = segCol
        endif
        a = b
    endwhile
    if runCol = 0 - 2 then
        runCol = 0 - 1
    endif
    self.drawFlatSeg(destX, hh, runStart, dFar, winTop, winBot, kind, runCol, lite, rayX, rayY)
endfunction

' Textured wall face: blit source column srcX of `tex` into [winTop, winBot],
' with the source-V window clipped to the visible span so a wall behind a
' floor-step shows the right vertical slice. sideKind: 0 x-face / 1 y-face /
' RC_SPAN_SIDE_DIAG diagonal. Returns 1 if a strip was drawn, else 0.
function drawWallStrip(destX, wTop, wBot, winTop, winBot, tex, u, lite, sideKind)
    dim cTop
    dim cBot
    dim svTop
    dim svBot
    dim srcX
    dim chan
    dim sideDim
    dim tint
    sideDim = 1.0
    if sideKind = 1 then
        sideDim = 0.8
    endif
    if sideKind = RcConfig.RC_SPAN_SIDE_DIAG then
        sideDim = 0.9
    endif
    if wBot <= wTop then
        return 0
    endif
    cTop = wTop
    cBot = wBot
    if cTop < winTop then
        cTop = winTop
    endif
    if cBot > winBot then
        cBot = winBot
    endif
    if cBot <= cTop then
        return 0
    endif
    srcX = math.floor(u * RcConfig.RC_TEX_SIZE)
    if srcX < 0 then
        srcX = 0
    endif
    if srcX >= RcConfig.RC_TEX_SIZE then
        srcX = RcConfig.RC_TEX_SIZE - 1
    endif
    chan = 255 * lite * sideDim
    tint = self.packTint(chan, chan, chan + 25)
    svTop = (cTop - wTop) / (wBot - wTop)
    svBot = (cBot - wTop) / (wBot - wTop)
    drawing.drawImageStrip(tex, srcX, destX, (cTop + cBot) / 2, RcConfig.RC_STRIP_W, cBot - cTop, tint, svTop, svBot)
    return 1
endfunction

' --- Textures ------------------------------------------------------------------

function setWallTexture(name)
    self.defWallTex = name
endfunction

' Resolve the texture for a wall cell: its own tex: marker if set, else the
' scene default (which may itself be "" = untextured).
function wallTexFor(col, row)
    dim t
    t = self.wld.wallTexAt(col, row)
    if string.len(t) > 0 then
        return t
    endif
    return self.defWallTex
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
    dim wtex

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

    for col = 0 to self.cols - 1
        cameraX = (2.0 * col / self.cols) - 1.0
        rayX = dirX + planeX * cameraX
        rayY = dirY + planeY * cameraX

        self.rc.cast(self.wld, self.camX, self.camY, rayX, rayY)

        winTop = 0
        winBot = self.viewH
        runFloorH = self.wld.floorHeightAt(camCol, camRow)
        runCeilH = self.wld.ceilHeightAt(camCol, camRow)
        destX = col * RcConfig.RC_STRIP_W + RcConfig.RC_STRIP_W / 2
        self.depthArr(col) = RcConfig.RC_MAX_DIST

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
            sfLite = self.boundLights.sampleAt(self.camX, self.camY)
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
                    lite = self.boundLights.sampleAt(self.camX + rayX * d, self.camY + rayY * d)
                endif
            endif

            if kind = RcConfig.RC_SPAN_WALL then
                self.drawSurface(destX, sfH, sfD, d, winTop, winBot, sfKind, sfLite, rayX, rayY)
                self.drawSurface(destX, scH, scD, d, winTop, winBot, scKind, scLite, rayX, rayY)
                hitWall = 1
                wtex = self.wallTexFor(self.rc.spanCol(i), self.rc.spanRow(i))
                if string.len(wtex) > 0 then
                    self.surfCountLast = self.surfCountLast + self.drawWallStrip(destX, sTop, sBot, winTop, winBot, wtex, self.rc.spanU(i), lite, self.rc.spanSide(i))
                else
                    wshade = self.rc.spanSide(i)
                    if wshade = RcConfig.RC_SPAN_SIDE_DIAG then
                        wshade = 1
                    endif
                    self.drawStrip(destX, sTop, sBot, winTop, winBot, wshade, lite)
                endif
                self.depthArr(col) = d
                i = n
            else
                if kind = RcConfig.RC_SPAN_FLOORSTEP then
                    newH = self.wld.floorHeightAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    self.drawSurface(destX, sfH, sfD, d, winTop, winBot, sfKind, sfLite, rayX, rayY)
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
                    sfLite = lite
                    runFloorH = newH
                else
                    newH = self.wld.ceilHeightAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    self.drawSurface(destX, scH, scD, d, winTop, winBot, scKind, scLite, rayX, rayY)
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

            if winTop >= winBot then
                i = n
            endif
        endwhile

        if hitWall = 0 then
            self.drawSurface(destX, sfH, sfD, RcConfig.RC_MAX_DIST, winTop, winBot, sfKind, sfLite, rayX, rayY)
            self.drawSurface(destX, scH, scD, RcConfig.RC_MAX_DIST, winTop, winBot, scKind, scLite, rayX, rayY)
        endif
    next col

    if self.boundActors <> 0 then
        self.drawActors()
    endif
endfunction

EndClass
