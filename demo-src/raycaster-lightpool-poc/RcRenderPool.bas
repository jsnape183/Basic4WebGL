Class
' RcRenderPool -- rough, throwaway POC renderer validating the light-pool
' redesign direction (see
' docs/superpowers/specs/2026-09-06-raycaster-lightpool-lightmap-design.md).
' NOT production code. Deliberately much smaller than the shared RcRender.bas:
' this POC's map has no floor/ceiling height variation, no diagonal tiles, no
' textures.
'
' One unified lighting model: every surface is lit by the same summed
' 3D-distance falloff from the static lights (lightAtPoint), in the same warm
' colour, over a cool dark ambient base. Walls sample lightAtPoint() per column
' at their hit point. Floor and ceiling are baked ONCE into two lightmap
' textures (bakeLightmaps) and drawn per column as perspective-correct strips
' (drawLightmapStrip) sampling those textures by absolute world position -- so
' the pools are fixed on the ground under any camera motion.
'
' Known POC simplifications: LOS occlusion is a single ray to each light's
' centre; the lightmap is baked at lmRes texels per cell (no smarter bake); the
' per-strip world->UV frame is an axis-aligned approximation that shears
' slightly on diagonal views (the POC scene is axis-aligned corridors); no
' dynamic lights.
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
dim fDirX
dim fDirY
dim fPlaneX
dim fPlaneY
dim lmRes

Constructor(w as RcWorld)
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
    self.lmRes = 2
    self.fDirX = 1
    self.fDirY = 0
    self.fPlaneX = 0
    self.fPlaneY = self.fovScale
EndConstructor

function bindCamera(mover)
    self.boundMover = mover
endfunction

function bindLights(lights)
    self.boundLights = lights
    self.bakeLightmaps()
endfunction

' Lightmap texel resolution multiplier -- texels per world cell. 2 = a 20x40
' texel grid for this 10x20 map. Bump for a smoother pool, at a one-time bake
' cost. Must be set before bindLights().
function setLightmapRes(n)
    self.lmRes = n
endfunction

' Bake a floor lightmap and a ceiling lightmap once: each texel is the summed
' warm-light contribution at that world point (lightAtPoint -- the SAME math the
' walls use), plus the cool ambient base. Uploaded via drawing.registerLightmap
' and never recomputed. This is where the pool shape and the wall occlusion are
' resolved -- render time is pure projection.
function bakeLightmaps()
    dim wc
    dim hc
    dim w
    dim h
    dim ambient
    dim ambBase
    dim tx
    dim ty
    dim wx
    dim wy
    dim fl
    dim cl
    dim idx
    dim total
    dim k
    dim floorArr(0)
    dim ceilArr(0)

    if self.boundLights = 0 then
        return
    endif

    wc = self.wld.widthCells()
    hc = self.wld.heightCells()
    w = wc * self.lmRes
    h = hc * self.lmRes

    ambient = self.boundLights.ambientLevel()
    ambBase = math.clamp(255 * ambient, 8, 30)

    total = w * h * 4
    for k = 0 to total - 1
        array.push(floorArr, 0)
        array.push(ceilArr, 0)
    next k

    for ty = 0 to h - 1
        for tx = 0 to w - 1
            wx = (tx + 0.5) / self.lmRes
            wy = (ty + 0.5) / self.lmRes
            fl = self.lightAtPoint(wx, wy, 0)
            cl = self.lightAtPoint(wx, wy, RcConfig.RC_STD_CEIL)
            idx = (ty * w + tx) * 4
            floorArr(idx) = math.clamp(ambBase * 0.5 + fl * 255, 0, 255)
            floorArr(idx + 1) = math.clamp(ambBase * 0.5 + fl * 214, 0, 255)
            floorArr(idx + 2) = math.clamp(ambBase * 0.72 + fl * 170, 0, 255)
            floorArr(idx + 3) = 255
            ceilArr(idx) = math.clamp(ambBase * 0.5 + cl * 255, 0, 255)
            ceilArr(idx + 1) = math.clamp(ambBase * 0.5 + cl * 214, 0, 255)
            ceilArr(idx + 2) = math.clamp(ambBase * 0.72 + cl * 170, 0, 255)
            ceilArr(idx + 3) = 255
        next tx
    next ty

    drawing.registerLightmap("rcpool_floor", w, h, wc, hc, floorArr)
    drawing.registerLightmap("rcpool_ceil", w, h, wc, hc, ceilArr)
endfunction

' Summed warm-light contribution (0..~N) at a world point from every static
' light: true 3D-distance falloff, wall-occluded by a single LOS ray. Used to
' light walls the SAME way the floor/ceiling pools are lit, so a wall standing
' in a pool is bright and a wall in a dark corridor is genuinely dark.
function lightAtPoint(wx, wy, wz)
    dim total
    dim i
    dim n
    dim lx
    dim ly
    dim lz
    dim dx
    dim dy
    dim dz
    dim d3
    dim hd
    dim losD
    dim t
    dim intensity
    dim radiusCells
    total = 0
    n = self.boundLights.staticLightCount()
    for i = 0 to n - 1
        lx = self.boundLights.staticLightX(i)
        ly = self.boundLights.staticLightY(i)
        lz = self.boundLights.staticLightZ(i)
        intensity = self.boundLights.staticLightIntensity(i)
        radiusCells = self.boundLights.staticLightRadius(i)
        dx = wx - lx
        dy = wy - ly
        dz = wz - lz
        d3 = math.sqrt(dx * dx + dy * dy + dz * dz)
        if d3 < radiusCells then
            hd = math.sqrt(dx * dx + dy * dy)
            losD = 0 - 1
            if hd > 0.001 then
                losD = self.rc.los(self.wld, lx, ly, dx / hd, dy / hd)
            endif
            if losD < 0 or losD >= hd - 0.1 then
                t = 1.0 - d3 / radiusCells
                total = total + t * intensity
            endif
        endif
    next i
    return total
endfunction

' Screen Y of world height h at perpendicular distance d. Identical formula to
' the shared RcRender.projectY.
function projectY(h, d)
    dim dd
    dd = d
    if dd < 0.05 then
        dd = 0.05
    endif
    return self.scy + (self.camZ + RcConfig.RC_EYE_Z - h) * (self.viewH / dd) + self.camPitch
endfunction

' Inverse of projectY: the perpendicular distance whose surface at height h
' projects to screen Y `y`. Guarded so a near-horizon row doesn't divide by ~0.
function projectYInv(h, y)
    dim denom
    dim d
    denom = y - self.scy - self.camPitch
    if h < RcConfig.RC_EYE_Z then
        if denom < 0.5 then
            denom = 0.5
        endif
    else
        if denom > 0 - 0.5 then
            denom = 0 - 0.5
        endif
    endif
    d = (self.camZ + RcConfig.RC_EYE_Z - h) * (self.viewH / denom)
    if d < 0.05 then
        d = 0.05
    endif
    if d > RcConfig.RC_MAX_DIST then
        d = RcConfig.RC_MAX_DIST
    endif
    return d
endfunction

function renderFrame()
    dim ambient
    dim baseCh
    dim rayX
    dim rayY
    dim cameraX
    dim col
    dim destX
    dim n
    dim i
    dim wallDist
    dim wallSide
    dim wallTop
    dim wallBot
    dim hitX
    dim hitY
    dim wLite
    dim faceMul
    dim wr
    dim wg
    dim wb
    dim fFarD
    dim fFarY
    dim fNearD
    dim fNearY
    dim cFarD
    dim cFarY
    dim cNearD
    dim cNearY

    if self.boundMover <> 0 then
        self.camX = self.boundMover.x()
        self.camY = self.boundMover.y()
        self.camZ = self.boundMover.z()
        self.camAngle = self.boundMover.angle()
        self.camPitch = self.boundMover.pitch()
    endif
    self.fDirX = math.cos(self.camAngle)
    self.fDirY = math.sin(self.camAngle)
    self.fPlaneX = 0 - self.fDirY * self.fovScale
    self.fPlaneY = self.fDirX * self.fovScale

    ambient = RcConfig.RC_AMBIENT
    if self.boundLights <> 0 then
        ambient = self.boundLights.ambientLevel()
    endif
    baseCh = math.clamp(255 * ambient, 8, 30)

    ' Release last frame's drawing objects back to the pool before this frame
    ' allocates any -- without this every frame leaks ~cols Graphics objects
    ' and the renderer freezes within seconds.
    drawing.clear()

    ' Flat ambient-only background -- no per-column floor/ceiling sampling at
    ' all. This is the whole point of the POC: static lights are drawn as
    ' overlay pools afterward (drawLightPools), never baked into this fill.
    pen.setLineWidth(0)
    pen.setFillColor(baseCh * 0.55, baseCh * 0.55, baseCh * 0.75)
    drawing.drawRect(self.viewW / 2, self.scy / 2, self.viewW, self.scy)
    pen.setFillColor(baseCh * 0.4, baseCh * 0.4, baseCh * 0.5)
    drawing.drawRect(self.viewW / 2, self.scy + self.scy / 2, self.viewW, self.viewH - self.scy)

    for col = 0 to self.cols - 1
        destX = col * RcConfig.RC_STRIP_W + RcConfig.RC_STRIP_W / 2
        cameraX = 2.0 * col / self.cols - 1.0
        rayX = self.fDirX + self.fPlaneX * cameraX
        rayY = self.fDirY + self.fPlaneY * cameraX
        self.rc.cast(self.wld, self.camX, self.camY, rayX, rayY)
        wallDist = RcConfig.RC_MAX_DIST
        wallSide = 0
        n = self.rc.spanCount()
        for i = 0 to n - 1
            if self.rc.spanKind(i) = RcConfig.RC_SPAN_WALL then
                wallDist = self.rc.spanDist(i)
                wallSide = self.rc.spanSide(i)
                i = n
            endif
        next i
        if wallDist < RcConfig.RC_MAX_DIST then
            wallTop = self.projectY(RcConfig.RC_STD_CEIL, wallDist)
            wallBot = self.projectY(0, wallDist)
            ' The ray's forward component is 1 by construction, so perpendicular
            ' distance IS the ray parameter -- the hit point is just this.
            hitX = self.camX + rayX * wallDist
            hitY = self.camY + rayY * wallDist
            wLite = self.lightAtPoint(hitX, hitY, RcConfig.RC_EYE_Z)
            faceMul = 1.0
            if wallSide = 1 then
                faceMul = 0.78
            endif
            wr = baseCh * 0.5 + wLite * 255 * faceMul
            wg = baseCh * 0.5 + wLite * 214 * faceMul
            wb = baseCh * 0.72 + wLite * 170 * faceMul
            pen.setFillColor(math.clamp(wr, 0, 255), math.clamp(wg, 0, 255), math.clamp(wb, 0, 255))
            drawing.drawRect(destX, (wallTop + wallBot) / 2, RcConfig.RC_STRIP_W, wallBot - wallTop)
        else
            wallTop = self.projectY(RcConfig.RC_STD_CEIL, RcConfig.RC_MAX_DIST)
            wallBot = self.projectY(0, RcConfig.RC_MAX_DIST)
            wallDist = RcConfig.RC_MAX_DIST
        endif

        if self.boundLights <> 0 then
            fFarD = wallDist
            fFarY = wallBot
            fNearY = self.viewH
            fNearD = self.projectYInv(0, fNearY)
            drawing.drawLightmapStrip("rcpool_floor", destX, fNearY, fFarY, self.camX + rayX * fNearD, self.camY + rayY * fNearD, self.camX + rayX * fFarD, self.camY + rayY * fFarD, RcConfig.RC_STRIP_W)

            cFarD = wallDist
            cFarY = wallTop
            cNearY = 0
            cNearD = self.projectYInv(RcConfig.RC_STD_CEIL, cNearY)
            drawing.drawLightmapStrip("rcpool_ceil", destX, cNearY, cFarY, self.camX + rayX * cNearD, self.camY + rayY * cNearD, self.camX + rayX * cFarD, self.camY + rayY * cFarD, RcConfig.RC_STRIP_W)
        endif
    next col
endfunction

EndClass
