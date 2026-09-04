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
dim primCount
' Scene-level texture defaults (Phase texturing). "" = untextured (flat grey
' path). Per-cell tex:/ftex:/ctex: markers via wld.*TexAt override these.
dim defWallTex

' Per-instance override for RcConfig.RC_FLAT_FILL (rung 1's painter's
' background fill). Defaults to the global constant; setFlatFill(0) forces
' every column through the accurate per-pixel floor/ceiling path instead.
' Needed by any scene where floor/ceiling brightness varies sharply across
' the visible plane (e.g. a short-radius torch): the flat fill paints the
' WHOLE floor/ceiling at one brightness sampled from the camera's own cell,
' skipped per-column only when that column's sightline crosses a fcol:/ccol:
' tile boundary (hasSurfaceColor()'s per-column "clean" check) -- so a
' colour-tagged column renders correctly dimmed by distance while its
' plain neighbour still shows the flat, too-bright fill, producing a hard
' seam exactly at the colour boundary. Harmless (and worth keeping on) when
' floor/ceiling light is roughly uniform across what's on screen.
dim flatFillOn

' How many flat light steps a floor/ceiling surface is allowed across half the
' screen, recomputed once per renderFrame() from the bound lights' dynamic range
' (peakLevel() - ambientLevel()) and capped at RcConfig.RC_SURF_SEG_MAX. It is
' deliberately a FRAME-global number, not a per-band or per-column one -- see
' drawFlatSeg. 1 = no subdivision (a uniformly lit scene pays nothing).
dim surfSegN

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
    self.primCount = 0
    self.defWallTex = ""
    self.flatFillOn = RcConfig.RC_FLAT_FILL
    self.surfSegN = 1
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

' Override rung 1's painter's background fill for this instance -- 0 forces
' every column through the accurate per-pixel floor/ceiling path (see the
' flatFillOn field comment above); 1 restores the default (RcConfig.RC_FLAT_FILL).
function setFlatFill(v)
    self.flatFillOn = v
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
                    self.primCount = self.primCount + 1
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

' Total draw primitives (drawRect + drawImageStrip) issued during the last
' renderFrame(), excluding the 2 sky/ground background rects. Read by the Phase 9
' benchmark harness and the p9-bench HUD.
function primitiveCount()
    return self.primCount
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
    self.primCount = self.primCount + 1
    return 1
endfunction

' Full-viewport-width flat fill for the painter's background floor/ceiling
' (rung 1). shadeKind 4 = floor top, 6 = ceiling under -- the only two the
' background ever uses.
function drawFill(yTop, yBot, shadeKind, lite)
    dim g
    dim rr
    dim gg
    dim bb
    if yBot <= yTop then
        return
    endif
    g = 105
    if shadeKind = 6 then
        g = 80
    endif
    rr = math.clamp(g * lite, 0, 255)
    gg = math.clamp(g * lite, 0, 255)
    bb = math.clamp((g + 25) * lite, 0, 255)
    pen.setLineWidth(0)
    pen.setFillColor(rr, gg, bb)
    drawing.drawRect(self.viewW / 2, (yTop + yBot) / 2, self.viewW, yBot - yTop)
    self.primCount = self.primCount + 1
endfunction

' 1 if no cell this column's floor band crosses between dNear and dFar carries an
' fcol: override -- lets the background fill cover the column. Only called when
' wld.hasSurfaceColor() = 1.
function floorBandClean(dNear, dFar, rayX, rayY)
    dim a
    dim b
    dim mx
    dim my
    dim guard
    a = dNear
    guard = 0
    while a < dFar - 0.0001 and guard < 128
        guard = guard + 1
        b = self.surfaceRunEnd(a, dFar, rayX, rayY)
        mx = self.camX + rayX * ((a + b) / 2)
        my = self.camY + rayY * ((a + b) / 2)
        if self.wld.floorColAt(math.floor(mx), math.floor(my)) >= 0 then
            return 0
        endif
        a = b
    endwhile
    return 1
endfunction

' Ceiling mirror of floorBandClean (ccol: overrides).
function ceilBandClean(dNear, dFar, rayX, rayY)
    dim a
    dim b
    dim mx
    dim my
    dim guard
    a = dNear
    guard = 0
    while a < dFar - 0.0001 and guard < 128
        guard = guard + 1
        b = self.surfaceRunEnd(a, dFar, rayX, rayY)
        mx = self.camX + rayX * ((a + b) / 2)
        my = self.camY + rayY * ((a + b) / 2)
        if self.wld.ceilColAt(math.floor(mx), math.floor(my)) >= 0 then
            return 0
        endif
        a = b
    endwhile
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

' Perpendicular distance of the horizontal surface at world height hh that
' projects to screen row y -- the inverse of projectY(). Used to slice a
' surface band into sub-bands by SCREEN position (which is uniform in 1/d, so
' the slices are naturally fine near the camera and coarse toward the horizon).
' Rows at/behind the horizon return RC_MAX_DIST.
function depthAtScreenY(hh, y)
    dim k
    dim dy
    dim d
    k = (self.camZ + RcConfig.RC_EYE_Z - hh) * self.viewH
    dy = y - (self.scy + self.camPitch)
    if dy < 0.0001 and dy > 0 - 0.0001 then
        return RcConfig.RC_MAX_DIST
    endif
    d = k / dy
    if d < 0.05 then
        d = 0.05
    endif
    if d > RcConfig.RC_MAX_DIST then
        d = RcConfig.RC_MAX_DIST
    endif
    return d
endfunction

' Paint one already-clipped flat band [yTop..yBot] at light level `lite`.
' packed < 0 -> the default `kind` grey shade; packed >= 0 -> that RGB
' (r*65536 + g*256 + b).
function emitFlatBand(destX, yTop, yBot, kind, packed, lite)
    dim rr
    dim gg
    dim bb
    if yBot <= yTop then
        return
    endif
    if packed < 0 then
        self.surfCountLast = self.surfCountLast + self.drawStrip(destX, yTop, yBot, yTop, yBot, kind, lite)
    else
        rr = math.floor(packed / 65536)
        gg = math.floor(packed / 256) - rr * 256
        bb = packed - rr * 65536 - gg * 256
        pen.setLineWidth(0)
        pen.setFillColor(math.clamp(rr * lite, 0, 255), math.clamp(gg * lite, 0, 255), math.clamp(bb * lite, 0, 255))
        drawing.drawRect(destX, (yTop + yBot) / 2, RcConfig.RC_STRIP_W, yBot - yTop)
        self.surfCountLast = self.surfCountLast + 1
        self.primCount = self.primCount + 1
    endif
endfunction

' Draw one flat horizontal sub-band at world height hh from dNear to dFar,
' clipped to [winTop, winBot]. packed < 0 -> the default `kind` grey shade;
' packed >= 0 -> that RGB (r*65536 + g*256 + b).
'
' A band can span a LOT of depth -- drawSurface coalesces every contiguous cell
' of the same fcol:/ccol: colour into one band, and with no colours at all the
' whole run from the camera to the far wall is a single band. Shading all of
' that from one light sample is what produced the "black hallway" bug: down a
' 24-cell corridor lit only by a 6-cell carried torch, the one sample landed
' outside the torch radius and the entire visible floor and ceiling were painted
' at plain ambient. So a band is split into sub-bands, one light sample each.
'
' WHERE those sub-bands start and end is the subtle part. Slicing the band's own
' screen extent into N equal pieces (what this did first) makes every band edge
' a light step -- and drawSurface calls this once per fcol:/ccol: colour run, so
' every colour-tile boundary became a hard light step, up to RC_SURF_LIGHT_STEP
' darker on the far side. Neighbouring columns split at a different depth (or
' not at all) and stepped somewhere else, so the step traced the projected tile
' edge: a hard, diagonal, wall-shadow-like seam sitting exactly on a floor
' colour boundary, which is nothing to do with walls or occlusion.
'
' Instead the sub-band edges live on a FRAME-GLOBAL lattice in screen Y: pitch
' `step` measured from the horizon (self.scy + camPitch, the same for every
' column), self.surfSegN cells across half the screen, and each cell's light
' sampled at the FULL cell's midpoint -- not the midpoint of whatever piece of
' it this band happens to cover. Two columns, or two colour runs, that cross the
' same lattice cell therefore get byte-identical shading, so a colour boundary
' is a pure colour change with no light step. Screen Y is the right axis for the
' lattice because a horizontal surface's depth goes as 1/(y - horizon), so
' uniform screen spacing is naturally fine near the camera (where the light
' gradient is steep) and coarse toward the horizon.
'
' Adjacent lattice cells that sample the same light are coalesced into one
' strip, so flat-lit stretches -- the whole far field, once everything has
' clamped to ambient -- still cost exactly one draw call, and surfSegN is 1 for
' a scene whose lights have no dynamic range at all.
function drawFlatSeg(destX, hh, dNear, dFar, winTop, winBot, kind, packed, lite, rayX, rayY)
    dim ya
    dim yb
    dim yTop
    dim yBot
    dim horizon
    dim latA
    dim latB
    dim n
    dim step
    dim k
    dim cellTop
    dim cellBot
    dim smid
    dim useLite
    dim segStart
    dim segLite
    dim done
    dim guard
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
    if self.boundLights = 0 then
        self.emitFlatBand(destX, yTop, yBot, kind, packed, lite)
        return
    endif
    ' A horizontal surface projects entirely to one side of the horizon (below
    ' if it is under the eye, above if over it), so one of the two half-screen
    ' lattices always contains the whole band.
    horizon = self.scy + self.camPitch
    latA = 0
    latB = horizon
    if (yTop + yBot) / 2 >= horizon then
        latA = horizon
        latB = self.viewH
    endif
    n = self.surfSegN
    ' never slice finer than 2 screen pixels -- sub-pixel bands cost a draw call
    ' each and show nothing
    if latB - latA < 2 then
        n = 1
    else
        if n > (latB - latA) / 2 then
            n = math.floor((latB - latA) / 2)
        endif
    endif
    if n < 1 then
        n = 1
    endif
    if n = 1 then
        smid = self.depthAtScreenY(hh, (yTop + yBot) / 2)
        self.emitFlatBand(destX, yTop, yBot, kind, packed, self.boundLights.sampleAt(self.camX + rayX * smid, self.camY + rayY * smid))
        return
    endif
    step = (latB - latA) / n
    k = math.floor((yTop - latA) / step)
    segStart = yTop
    segLite = 0 - 1
    done = 0
    guard = 0
    while done = 0 and guard < 256
        guard = guard + 1
        cellTop = latA + k * step
        cellBot = cellTop + step
        smid = self.depthAtScreenY(hh, (cellTop + cellBot) / 2)
        useLite = self.boundLights.sampleAt(self.camX + rayX * smid, self.camY + rayY * smid)
        if segLite < 0 then
            segLite = useLite
        endif
        if useLite <> segLite then
            self.emitFlatBand(destX, segStart, cellTop, kind, packed, segLite)
            segStart = cellTop
            segLite = useLite
        endif
        if cellBot >= yBot then
            done = 1
        endif
        k = k + 1
    endwhile
    self.emitFlatBand(destX, segStart, yBot, kind, packed, segLite)
endfunction

' Draw a floor/ceiling surface at world height hh from dNear to dFar, clipped to
' [winTop, winBot]. No fcol:/ccol: anywhere -> one strip. Otherwise march the
' grid cells the band crosses and emit one sub-band per contiguous run of the
' same resolved colour (default shade counts as a colour for coalescing).
' `lite` is only used when no lights are bound; drawFlatSeg re-samples otherwise.
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
    if winBot <= winTop then
        return
    endif
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
    self.primCount = self.primCount + 1
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
    dim fillOn
    dim fillLite

    if self.boundMover <> 0 then
        self.camX = self.boundMover.x()
        self.camY = self.boundMover.y()
        self.camAngle = self.boundMover.angle()
        self.camPitch = self.boundMover.pitch()
        self.camZ = self.boundMover.z()
    endif

    ' The full-screen backdrop below represents the unlit far distance (what
    ' shows through if an open sightline's floor/ceiling coverage doesn't quite
    ' reach the vanishing point), NOT wherever the camera happens to be
    ' standing right now. It must be a genuinely fixed value -- ambientLevel()
    ' depends only on RcLights.setAmbient(), never on camera position -- or the
    ' backdrop visibly brightens/dims as the player walks between differently
    ' lit cells even though nothing "in front of them" has actually changed.
    bgLite = 1.0
    self.surfCountLast = 0
    self.primCount = 0
    self.surfSegN = 1
    if self.boundLights <> 0 then
        bgLite = self.boundLights.ambientLevel()
        ' One number for the whole frame -- drawFlatSeg's light lattice has to be
        ' identical for every column, so this cannot be derived per band.
        self.surfSegN = math.ceil((self.boundLights.peakLevel() - self.boundLights.ambientLevel()) / RcConfig.RC_SURF_LIGHT_STEP)
        if self.surfSegN < 1 then
            self.surfSegN = 1
        endif
        if self.surfSegN > RcConfig.RC_SURF_SEG_MAX then
            self.surfSegN = RcConfig.RC_SURF_SEG_MAX
        endif
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

    ' Rung 1: paint the standard floor and ceiling once, full-width, and let the
    ' opaque wall strips paint over the over-draw. Only valid when the camera is
    ' grounded on a standard-height cell -- otherwise the fill's single-height
    ' assumption breaks and every column takes the per-column path.
    fillLite = 1.0
    if self.boundLights <> 0 then
        fillLite = self.boundLights.sampleCell(camCol, camRow)
    endif
    fillOn = 0
    if self.flatFillOn = 1 then
        if self.wld.floorHeightAt(camCol, camRow) = 0 then
            if self.wld.ceilHeightAt(camCol, camRow) = RcConfig.RC_STD_CEIL then
                fillOn = 1
            endif
        endif
    endif
    if fillOn = 1 then
        self.drawFill(horizon, self.viewH, RcConfig.RC_SHADE_FLOOR_TOP, fillLite)
        self.drawFill(0, horizon, RcConfig.RC_SHADE_CEIL_UNDER, fillLite)
    endif

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
                ' Rung 1 skip guard (used verbatim at all three flush points):
                ' draw the pending surface UNLESS it is the pristine standard
                ' floor/ceiling running from the camera (sfD = 0 and sfH = 0 /
                ' scD = 0 and scH = RC_STD_CEIL) and colour-clean -- exactly what
                ' the background fill already painted. One FLOORSTEP makes
                ' sfD > 0 (and/or sfH <> 0), so a stepped column resumes the full
                ' per-column path from that point on.
                if fillOn = 0 or sfD <> 0 or sfH <> 0 or (self.wld.hasSurfaceColor() = 1 and self.floorBandClean(0, d, rayX, rayY) = 0) then
                    self.drawSurface(destX, sfH, sfD, d, winTop, winBot, sfKind, sfLite, rayX, rayY)
                endif
                if fillOn = 0 or scD <> 0 or scH <> RcConfig.RC_STD_CEIL or (self.wld.hasSurfaceColor() = 1 and self.ceilBandClean(0, d, rayX, rayY) = 0) then
                    self.drawSurface(destX, scH, scD, d, winTop, winBot, scKind, scLite, rayX, rayY)
                endif
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
                    ' Skip only the pristine standard floor from the camera --
                    ' exactly what the background fill already covers.
                    if fillOn = 0 or sfD <> 0 or sfH <> 0 or (self.wld.hasSurfaceColor() = 1 and self.floorBandClean(0, d, rayX, rayY) = 0) then
                        self.drawSurface(destX, sfH, sfD, d, winTop, winBot, sfKind, sfLite, rayX, rayY)
                    endif
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
                    if fillOn = 0 or scD <> 0 or scH <> RcConfig.RC_STD_CEIL or (self.wld.hasSurfaceColor() = 1 and self.ceilBandClean(0, d, rayX, rayY) = 0) then
                        self.drawSurface(destX, scH, scD, d, winTop, winBot, scKind, scLite, rayX, rayY)
                    endif
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
            if fillOn = 0 or sfD <> 0 or sfH <> 0 or (self.wld.hasSurfaceColor() = 1 and self.floorBandClean(0, RcConfig.RC_MAX_DIST, rayX, rayY) = 0) then
                self.drawSurface(destX, sfH, sfD, RcConfig.RC_MAX_DIST, winTop, winBot, sfKind, sfLite, rayX, rayY)
            endif
            if fillOn = 0 or scD <> 0 or scH <> RcConfig.RC_STD_CEIL or (self.wld.hasSurfaceColor() = 1 and self.ceilBandClean(0, RcConfig.RC_MAX_DIST, rayX, rayY) = 0) then
                self.drawSurface(destX, scH, scD, RcConfig.RC_MAX_DIST, winTop, winBot, scKind, scLite, rayX, rayY)
            endif
        endif
    next col

    if self.boundActors <> 0 then
        self.drawActors()
    endif
endfunction

EndClass
