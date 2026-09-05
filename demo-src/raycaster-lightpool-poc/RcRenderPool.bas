Class
' RcRenderPool -- rough, throwaway POC renderer validating the light-pool
' redesign direction (see
' docs/superpowers/specs/2026-09-05-raycaster-lightpool-poc-design.md).
' NOT production code. Deliberately much smaller than the shared RcRender.bas:
' this POC's map has no floor/ceiling height variation, no diagonal tiles, no
' textures, so none of that logic is needed.
'
' One unified lighting model: every surface -- wall, floor, ceiling -- is lit
' by the same summed 3D-distance falloff from the static lights, in the same
' warm colour, over a cool dark ambient base. Walls sample lightAtPoint() per
' column at their hit point. Floor/ceiling get radial-gradient "pool" overlays
' (drawLightPools()) -- the cheap stand-in for per-pixel floor casting -- drawn
' as ellipses anchored to their surface plane (near edge at depth-WR, far edge
' at depth+WR) so they lie flat on the ground instead of tracking the camera
' like a billboard. Ceiling pools are tighter than floor pools because the
' light sits near the ceiling.
'
' Known POC simplifications: occlusion is a single ray to the light's centre,
' no penumbra; no per-pixel depth test against walls, so a pool very close to
' a wall may draw over it; no handling for overlapping lights beyond draw
' order; floor/ceiling have no texture so there is no static ground reference.
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
dim poolSpread

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
    self.poolSpread = 0.6
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
endfunction

' The one "overall intensity/spread" knob: how wide each light's pool fans on
' a surface, per world-unit of vertical distance between the light and that
' surface. Bigger = bigger, softer pools. Tunable without touching render logic.
function setPoolSpread(s)
    self.poolSpread = s
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
        endif
    next col

    if self.boundLights <> 0 then
        self.drawLightPools()
    endif
endfunction

' Overlay pass: one radial-gradient "pool" per static light, on the floor and
' on the ceiling, projected to screen space with the same camera-plane
' transform the shared RcRender.bas uses for actor billboards.
function drawLightPools()
    dim n
    dim i
    dim lx
    dim ly
    dim lz
    dim intensity
    dim radiusCells
    dim relX
    dim relY
    dim invDet
    dim depth
    dim tX
    dim screenX
    dim dist2d
    dim losD
    dim ceilWR
    dim floorWR
    dim poolLite
    dim alpha
    dim pr
    dim pg
    dim pb
    dim fNearD
    dim fFarD
    dim fNearY
    dim fFarY
    dim floorCY
    dim floorRY
    dim floorRX
    dim cNearD
    dim cFarD
    dim cNearY
    dim cFarY
    dim ceilCY
    dim ceilRY
    dim ceilRX

    invDet = 1.0 / (self.fPlaneX * self.fDirY - self.fDirX * self.fPlaneY)
    n = self.boundLights.staticLightCount()
    for i = 0 to n - 1
        lx = self.boundLights.staticLightX(i)
        ly = self.boundLights.staticLightY(i)
        lz = self.boundLights.staticLightZ(i)
        intensity = self.boundLights.staticLightIntensity(i)
        radiusCells = self.boundLights.staticLightRadius(i)

        relX = lx - self.camX
        relY = ly - self.camY
        depth = invDet * (0 - self.fPlaneY * relX + self.fPlaneX * relY)
        if depth > 0.1 then
            tX = invDet * (self.fDirY * relX - self.fDirX * relY)
            screenX = (self.viewW / 2) * (1.0 + tX / depth)
            if screenX > 0 - 200 and screenX < self.viewW + 200 then
                dist2d = math.sqrt(relX * relX + relY * relY)
                losD = 0 - 1
                if dist2d > 0.001 then
                    losD = self.rc.los(self.wld, self.camX, self.camY, relX / dist2d, relY / dist2d)
                endif
                if losD < 0 or losD >= dist2d - 0.1 then
                    ' Pool world-radius on each surface: scales with that
                    ' surface's vertical distance from the light (ceiling sits
                    ' near the light -> tight pool; floor is far -> wide pool),
                    ' times the one spread knob.
                    ceilWR = self.poolSpread * math.abs(RcConfig.RC_STD_CEIL - lz) + 0.12
                    floorWR = self.poolSpread * math.abs(lz) + 0.12

                    poolLite = math.clamp(intensity * (1.0 - depth / radiusCells), 0.0, 1.0)
                    alpha = math.clamp(poolLite * 0.6, 0.04, 0.42)
                    pr = math.clamp(255 * poolLite + 40, 0, 255)
                    pg = math.clamp(214 * poolLite + 40, 0, 255)
                    pb = math.clamp(170 * poolLite + 40, 0, 255)

                    ' Anchor each pool to its surface plane so it lies flat: the
                    ' near edge is at perpendicular distance depth-WR, the far
                    ' edge at depth+WR. Because projection goes as 1/distance the
                    ' near edge sweeps far more toward the camera than the far
                    ' edge rises -- that asymmetry is what makes the pool read
                    ' as painted on the ground, not a floating billboard that
                    ' tracks the camera.
                    fNearD = depth - floorWR
                    if fNearD < 0.12 then
                        fNearD = 0.12
                    endif
                    fFarD = depth + floorWR
                    fNearY = self.projectY(0, fNearD)
                    fFarY = self.projectY(0, fFarD)
                    floorCY = (fNearY + fFarY) / 2
                    floorRY = math.clamp((fNearY - fFarY) / 2, 1, self.viewH)
                    floorRX = math.clamp(floorWR * (self.viewH / depth), 1, self.viewW)

                    cNearD = depth - ceilWR
                    if cNearD < 0.12 then
                        cNearD = 0.12
                    endif
                    cFarD = depth + ceilWR
                    cNearY = self.projectY(RcConfig.RC_STD_CEIL, cNearD)
                    cFarY = self.projectY(RcConfig.RC_STD_CEIL, cFarD)
                    ceilCY = (cNearY + cFarY) / 2
                    ceilRY = math.clamp((cFarY - cNearY) / 2, 1, self.viewH)
                    ceilRX = math.clamp(ceilWR * (self.viewH / depth), 1, self.viewW)

                    drawing.drawRadialGradientEllipse(screenX, floorCY, floorRX, floorRY, pr, pg, pb, alpha)
                    drawing.drawRadialGradientEllipse(screenX, ceilCY, ceilRX, ceilRY, pr, pg, pb, alpha)
                endif
            endif
        endif
    next i
endfunction

EndClass
