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
' Per-column visible screen-Y interval list (renderer rework). Parallel arrays,
' top < bot. occTop/occBot are reused scratch (no per-frame alloc). iDestX is the
' current column's strip centre X -- set by renderFrame (Task 3); drawInto reads it.
dim intvTop(0)
dim intvBot(0)
dim occTop(0)
dim occBot(0)
dim iDestX
dim fRayX
dim fRayY
' Scene-level texture defaults (Phase texturing). "" = untextured (flat grey
' path). Per-cell tex:/ftex:/ctex: markers via wld.*TexAt override these.
dim defWallTex
dim defFloorTex
dim defCeilTex

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
    self.iDestX = 0
    self.fRayX = 0
    self.fRayY = 0
    self.defWallTex = ""
    self.defFloorTex = ""
    self.defCeilTex = ""
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

' Inverse of projectY: the perpendicular distance at which a horizontal surface
' at world height hh projects to screen Y `y`. Guards the horizon singularity
' (returns RC_MAX_DIST). For a ceiling (hh above eye) the numerator is negative,
' so the sign of `denom` flips too -- the identity holds for both.
function distAtScreenY(hh, y)
    dim denom
    dim horizon
    horizon = self.scy + self.camPitch
    denom = y - horizon
    if math.abs(denom) < 0.0001 then
        return RcConfig.RC_MAX_DIST
    endif
    return (self.camZ + RcConfig.RC_EYE_Z - hh) * self.viewH / denom
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
' clipped into every visible interval, then occlude its own projected band.
' Orders the two projected Ys so the band always has top <= bottom (a floor below
' eye and a ceiling above it project inverted). Bumps surfCountLast per strip.
' texName "" -> the flat drawRect path (unchanged); non-empty -> a perspective
' drawFloorStrip per visible interval, tinted by the sampled light.
function drawSurfaceInto(hh, dNear, dFar, kind, lite, texName)
    dim ya
    dim yb
    dim yTop
    dim yBot
    dim useLite
    dim dMid
    dim k
    dim n
    dim cTop
    dim cBot
    dim ynScr
    dim yfScr
    dim cdNear
    dim cdFar
    dim wnx
    dim wny
    dim wfx
    dim wfy
    dim ft
    dim eyeZ
    useLite = lite
    if self.boundLights <> 0 then
        dMid = (dNear + dFar) / 2
        useLite = self.boundLights.sampleAt(self.camX + self.fRayX * dMid, self.camY + self.fRayY * dMid)
    endif
    ya = self.projectY(hh, dNear)
    yb = self.projectY(hh, dFar)
    if ya <= yb then
        yTop = ya
        yBot = yb
    else
        yTop = yb
        yBot = ya
    endif
    if string.len(texName) = 0 then
        self.surfCountLast = self.surfCountLast + self.drawInto(yTop, yBot, kind, useLite)
    else
        ' Textured: blit one perspective-correct strip per visible interval, with
        ' the world near/far re-derived from the CLIPPED screen span so the
        ' texture stays pinned when an interval cuts the band.
        eyeZ = self.camZ + RcConfig.RC_EYE_Z
        ft = self.packTint(255 * useLite, 255 * useLite, 255 * useLite)
        n = array.arrLength(self.intvTop)
        for k = 0 to n - 1
            cTop = yTop
            cBot = yBot
            if cTop < self.intvTop(k) then
                cTop = self.intvTop(k)
            endif
            if cBot > self.intvBot(k) then
                cBot = self.intvBot(k)
            endif
            if cBot > cTop then
                ' Near edge: for a floor (below eye) it is the LOWER edge on
                ' screen (bigger Y); for a ceiling (above eye) the upper edge.
                if hh < eyeZ then
                    ynScr = cBot
                    yfScr = cTop
                else
                    ynScr = cTop
                    yfScr = cBot
                endif
                cdNear = self.distAtScreenY(hh, ynScr)
                cdFar = self.distAtScreenY(hh, yfScr)
                wnx = self.camX + self.fRayX * cdNear
                wny = self.camY + self.fRayY * cdNear
                wfx = self.camX + self.fRayX * cdFar
                wfy = self.camY + self.fRayY * cdFar
                drawing.drawFloorStrip(texName, self.iDestX, ynScr, yfScr, wnx, wny, wfx, wfy, RcConfig.RC_STRIP_W, ft)
                self.surfCountLast = self.surfCountLast + 1
            endif
        next k
    endif
    self.occlude(yTop, yBot)
endfunction

' --- Interval-list occlusion primitives (renderer rework) -------------------
' Not yet wired into renderFrame (that is Task 3). See the design spec §1.

' Reset the column to one full-height visible interval [0, viewH].
function resetIntervals()
    array.clear(self.intvTop)
    array.clear(self.intvBot)
    array.push(self.intvTop, 0)
    array.push(self.intvBot, self.viewH)
endfunction

' Number of visible intervals still open in this column.
function intervalCount()
    return array.arrLength(self.intvTop)
endfunction

' Find the shortest interval and rebuild the list without it. occTop/occBot are
' reused as scratch here -- safe, occlude() has finished reading them by the time
' it calls this.
function dropThinnest()
    dim k
    dim n
    dim minIdx
    dim minH
    dim h
    n = array.arrLength(self.intvTop)
    if n <= 1 then
        return
    endif
    minIdx = 0
    minH = self.intvBot(0) - self.intvTop(0)
    for k = 1 to n - 1
        h = self.intvBot(k) - self.intvTop(k)
        if h < minH then
            minH = h
            minIdx = k
        endif
    next k
    array.clear(self.occTop)
    array.clear(self.occBot)
    for k = 0 to n - 1
        if k <> minIdx then
            array.push(self.occTop, self.intvTop(k))
            array.push(self.occBot, self.intvBot(k))
        endif
    next k
    array.clear(self.intvTop)
    array.clear(self.intvBot)
    for k = 0 to array.arrLength(self.occTop) - 1
        array.push(self.intvTop, self.occTop(k))
        array.push(self.intvBot, self.occBot(k))
    next k
endfunction

' Subtract the opaque screen band [oTop, oBot] from every visible interval,
' splitting an interval when the band lands in its middle. Then enforce the cap
' by repeatedly dropping the thinnest interval.
function occlude(oTop, oBot)
    dim k
    dim t
    dim b
    dim cnt
    if oBot <= oTop then
        return
    endif
    array.clear(self.occTop)
    array.clear(self.occBot)
    cnt = array.arrLength(self.intvTop)
    for k = 0 to cnt - 1
        t = self.intvTop(k)
        b = self.intvBot(k)
        if oBot <= t or oTop >= b then
            array.push(self.occTop, t)
            array.push(self.occBot, b)
        else
            if oTop > t then
                array.push(self.occTop, t)
                array.push(self.occBot, oTop)
            endif
            if oBot < b then
                array.push(self.occTop, oBot)
                array.push(self.occBot, b)
            endif
        endif
    next k
    array.clear(self.intvTop)
    array.clear(self.intvBot)
    cnt = array.arrLength(self.occTop)
    for k = 0 to cnt - 1
        array.push(self.intvTop, self.occTop(k))
        array.push(self.intvBot, self.occBot(k))
    next k
    while array.arrLength(self.intvTop) > RcConfig.RC_MAX_INTERVALS
        self.dropThinnest()
    endwhile
endfunction

' Draw the surface strip [sTop, sBot] clipped into each visible interval. Returns
' the total number of strips actually painted.
function drawInto(sTop, sBot, shadeKind, lite)
    dim k
    dim total
    dim n
    total = 0
    n = array.arrLength(self.intvTop)
    for k = 0 to n - 1
        total = total + self.drawStrip(self.iDestX, sTop, sBot, self.intvTop(k), self.intvBot(k), shadeKind, lite)
    next k
    return total
endfunction

' --- Textures ------------------------------------------------------------------

function setWallTexture(name)
    self.defWallTex = name
endfunction

function setFloorTexture(name)
    self.defFloorTex = name
endfunction

function setCeilTexture(name)
    self.defCeilTex = name
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

function floorTexFor(col, row)
    dim t
    t = self.wld.floorTexAt(col, row)
    if string.len(t) > 0 then
        return t
    endif
    return self.defFloorTex
endfunction

function ceilTexFor(col, row)
    dim t
    t = self.wld.ceilTexAt(col, row)
    if string.len(t) > 0 then
        return t
    endif
    return self.defCeilTex
endfunction

' Textured mirror of drawInto for a wall face: blit source column srcX of `tex`
' into each visible interval, clipping the source-V window to the clipped screen
' span so a wall behind a floor-step shows the right vertical slice (not
' stretched). sideKind: 0 x-face / 1 y-face / RC_SPAN_SIDE_DIAG diagonal.
' Returns the number of strips drawn.
function drawWallInto(wTop, wBot, tex, u, lite, sideKind)
    dim k
    dim n
    dim total
    dim cTop
    dim cBot
    dim svTop
    dim svBot
    dim srcX
    dim dim2
    dim sideDim
    dim tint
    total = 0
    sideDim = 1.0
    if sideKind = 1 then
        sideDim = 0.8
    endif
    if sideKind = RcConfig.RC_SPAN_SIDE_DIAG then
        sideDim = 0.9
    endif
    srcX = math.floor(u * RcConfig.RC_TEX_SIZE)
    if srcX < 0 then
        srcX = 0
    endif
    if srcX >= RcConfig.RC_TEX_SIZE then
        srcX = RcConfig.RC_TEX_SIZE - 1
    endif
    dim2 = 255 * lite * sideDim
    tint = self.packTint(dim2, dim2, dim2 + 25)
    if wBot <= wTop then
        return 0
    endif
    n = array.arrLength(self.intvTop)
    for k = 0 to n - 1
        cTop = wTop
        cBot = wBot
        if cTop < self.intvTop(k) then
            cTop = self.intvTop(k)
        endif
        if cBot > self.intvBot(k) then
            cBot = self.intvBot(k)
        endif
        if cBot > cTop then
            svTop = (cTop - wTop) / (wBot - wTop)
            svBot = (cBot - wTop) / (wBot - wTop)
            drawing.drawImageStrip(tex, srcX, self.iDestX, (cTop + cBot) / 2, RcConfig.RC_STRIP_W, cBot - cTop, tint, svTop, svBot)
            total = total + 1
        endif
    next k
    return total
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
    dim runFloorH
    dim runCeilH
    dim kind
    dim d
    dim sTop
    dim sBot
    dim destX
    dim newH
    dim camCol
    dim camRow
    dim horizon
    dim fh
    dim lite
    dim bgLite
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
    dim wtex
    dim sfTex
    dim scTex

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

    ' Camera region: the bound mover carries it authoritatively; with no mover
    ' bound, derive it from the camera height against this cell's upper floor.
    camRegion = 0
    if self.boundMover <> 0 then
        camRegion = self.boundMover.regionId()
    else
        if self.wld.upperKindAt(camCol, camRow) > 0 then
            if self.camZ >= self.wld.upperFloorAt(camCol, camRow) then
                camRegion = 1
            endif
        endif
    endif
    self.rc.setRegion(camRegion)

    for col = 0 to self.cols - 1
        cameraX = (2.0 * col / self.cols) - 1.0
        rayX = dirX + planeX * cameraX
        rayY = dirY + planeY * cameraX

        self.rc.cast(self.wld, self.camX, self.camY, rayX, rayY)

        destX = col * RcConfig.RC_STRIP_W + RcConfig.RC_STRIP_W / 2
        self.iDestX = destX
        self.fRayX = rayX
        self.fRayY = rayY
        self.resetIntervals()
        self.depthArr(col) = RcConfig.RC_MAX_DIST

        if camRegion = 1 then
            runFloorH = self.wld.upperFloorAt(camCol, camRow)
            runCeilH = self.wld.upperCeilAt(camCol, camRow)
        else
            runFloorH = self.wld.floorHeightAt(camCol, camRow)
            runCeilH = self.wld.ceilHeightAt(camCol, camRow)
        endif

        ' pending floor/ceiling surface: world-height, near-depth, shade kind, light
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
        ' Surface textures for this column's run: the camera cell's marker or the
        ' scene default. A per-cell floor tex that varies mid-run is a v2 nicety.
        sfTex = self.floorTexFor(camCol, camRow)
        scTex = self.ceilTexFor(camCol, camRow)

        n = self.rc.spanCount()
        i = 0
        while i < n
            if self.intervalCount() = 0 then
                i = n
            else
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

                ' Span-kind ladder (softBASIC has no elseif -- nested if is deliberate).
                if kind = RcConfig.RC_SPAN_PORTAL_WALL then
                    ' Opaque mid-air band (the OTHER region's wall through a hole).
                    wtex = self.wallTexFor(self.rc.spanCol(i), self.rc.spanRow(i))
                    if string.len(wtex) > 0 then
                        self.surfCountLast = self.surfCountLast + self.drawWallInto(sTop, sBot, wtex, self.rc.spanU(i), lite, self.rc.spanSide(i))
                    else
                        self.drawInto(sTop, sBot, 1, lite)
                    endif
                    self.occlude(sTop, sBot)
                    i = i + 1
                else
                    if kind = RcConfig.RC_SPAN_PORTAL_CEIL then
                        ' Upper ceiling seen up through a hole -- flat fill above the plane.
                        self.drawInto(0, sBot, 3, lite)
                        self.occlude(0, sBot)
                        i = i + 1
                    else
                        if kind = RcConfig.RC_SPAN_PORTAL_FLOOR then
                            if camRegion = 0 then
                                ' plank underside overhead -> fill above the plane
                                self.drawInto(0, sBot, RcConfig.RC_SHADE_UPPER_FLOOR, lite)
                                self.occlude(0, sBot)
                            else
                                ' lower room floor down through a hole -> fill below the plane
                                self.drawInto(sTop, self.viewH, RcConfig.RC_SHADE_UPPER_FLOOR, lite)
                                self.occlude(sTop, self.viewH)
                            endif
                            i = i + 1
                        else
                            if kind = RcConfig.RC_SPAN_WALL then
                                ' Full opaque blocker: flush both pending surfaces, draw
                                ' the face, clear the interval list, end the column.
                                self.drawSurfaceInto(sfH, sfD, d, sfKind, sfLite, sfTex)
                                self.drawSurfaceInto(scH, scD, d, scKind, scLite, scTex)
                                wtex = self.wallTexFor(self.rc.spanCol(i), self.rc.spanRow(i))
                                if string.len(wtex) > 0 then
                                    self.surfCountLast = self.surfCountLast + self.drawWallInto(sTop, sBot, wtex, self.rc.spanU(i), lite, self.rc.spanSide(i))
                                else
                                    wshade = self.rc.spanSide(i)
                                    if wshade = RcConfig.RC_SPAN_SIDE_DIAG then
                                        wshade = 1
                                    endif
                                    self.drawInto(sTop, sBot, wshade, lite)
                                endif
                                self.depthArr(col) = d
                                array.clear(self.intvTop)
                                array.clear(self.intvBot)
                                i = n
                            else
                                ' FLOORSTEP / CEILSTEP -- riser occludes only its own band.
                                if kind = RcConfig.RC_SPAN_FLOORSTEP then
                                    if self.rc.spanLo(i) = runFloorH then
                                        newH = self.rc.spanHi(i)
                                    else
                                        newH = self.rc.spanLo(i)
                                    endif
                                    self.drawSurfaceInto(sfH, sfD, d, sfKind, sfLite, sfTex)
                                    self.drawInto(sTop, sBot, 2, lite)
                                    self.occlude(sTop, sBot)
                                    sfD = d
                                    if newH < runFloorH then
                                        sfKind = RcConfig.RC_SHADE_PIT_FLOOR
                                    else
                                        sfKind = RcConfig.RC_SHADE_FLOOR_TOP
                                    endif
                                    sfH = newH
                                    ' RcCast records the cell just ENTERED (its floor = newH),
                                    ' so `lite` here is that segment's own light -- correct.
                                    sfLite = lite
                                    runFloorH = newH
                                else
                                    if self.rc.spanLo(i) = runCeilH then
                                        newH = self.rc.spanHi(i)
                                    else
                                        newH = self.rc.spanLo(i)
                                    endif
                                    self.drawSurfaceInto(scH, scD, d, scKind, scLite, scTex)
                                    self.drawInto(sTop, sBot, 3, lite)
                                    self.occlude(sTop, sBot)
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
                    endif
                endif
            endif
        endwhile

        if self.intervalCount() > 0 then
            self.drawSurfaceInto(sfH, sfD, RcConfig.RC_MAX_DIST, sfKind, sfLite, sfTex)
            self.drawSurfaceInto(scH, scD, RcConfig.RC_MAX_DIST, scKind, scLite, scTex)
        endif
    next col

    if self.boundActors <> 0 then
        self.drawActors()
    endif
endfunction

EndClass
