Class
' RcRenderPool -- rough, throwaway POC renderer validating the floor-field
' redesign direction (see
' docs/superpowers/specs/2026-09-06-raycaster-floor-field-poc.md).
' NOT production code.
'
' Floor and ceiling are now drawn by a true per-pixel floorcaster: at
' bindLights() two static lightmaps are baked (one per plane) from
' lightAtPoint(); every frame drawing.drawPlaneField() resolves the world
' point each screen pixel looks at, samples a procedural world-tiled tile
' pattern, and multiplies by max(ambient, bakedLight(worldPos)). Because the
' sample is a world-space lookup, the lit pools stay painted on the ground
' under rotation and strafe -- the failure the ellipse-overlay version had.
'
' The two field sprites are drawn BEFORE the wall loop, so the flat-shaded
' wall strips paint over them (the POC map has no floor/ceiling height
' variation, so there is nothing to see past a wall -- no per-pixel wall
' depth test needed). Walls are still lit per column by lightAtPoint() at
' their hit point, the same summed 3D-distance falloff the lightmaps bake.
'
' Known POC simplifications: lightmap LOS occlusion is a single ray to each
' light's centre, no penumbra; one flat floor plane + one flat ceiling plane
' only; procedural tile pattern, not a real texture image.
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
dim floorTex
dim ceilTex

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
    self.fDirX = 1
    self.fDirY = 0
    self.fPlaneX = 0
    self.fPlaneY = self.fovScale
    self.floorTex = ""
    self.ceilTex = ""
EndConstructor

' World-tiled texture names (one tile per world unit) for the floor/ceiling
' fields. "" = the engine's procedural checker.
function setFieldTextures(floorName, ceilName)
    self.floorTex = floorName
    self.ceilTex = ceilName
endfunction

function bindCamera(mover)
    self.boundMover = mover
endfunction

function bindLights(lights)
    self.boundLights = lights
    self.bakeLightmaps()
endfunction

' Bake the two static lightmaps ONCE. Grid is RES texels per world cell; each
' texel stores clamp(ambient + lightAtPoint(centre), 0, 1) in every channel.
' The floor map samples just above the floor, the ceiling map just below the
' ceiling, so a floor point and a ceiling point at the same (x, y) differ.
function bakeLightmaps()
    dim res
    dim mc
    dim mr
    dim gw
    dim gh
    dim tx
    dim ty
    dim wx
    dim wy
    dim vF
    dim vC
    dim amb
    dim fbytes(0)
    dim cbytes(0)
    res = 4
    mc = self.wld.widthCells()
    mr = self.wld.heightCells()
    gw = mc * res
    gh = mr * res
    amb = self.boundLights.ambientLevel()
    for ty = 0 to gh - 1
        for tx = 0 to gw - 1
            wx = (tx + 0.5) / res
            wy = (ty + 0.5) / res
            vF = math.clamp(amb + self.lightAtPoint(wx, wy, 0.05), 0, 1)
            vC = math.clamp(amb + self.lightAtPoint(wx, wy, RcConfig.RC_STD_CEIL - 0.05), 0, 1)
            array.push(fbytes, math.floor(vF * 255))
            array.push(fbytes, math.floor(vF * 255))
            array.push(fbytes, math.floor(vF * 255))
            array.push(fbytes, 255)
            array.push(cbytes, math.floor(vC * 255))
            array.push(cbytes, math.floor(vC * 255))
            array.push(cbytes, math.floor(vC * 255))
            array.push(cbytes, 255)
        next tx
    next ty
    drawing.registerLightmap("rcpoc_floor", gw, gh, mc, mr, fbytes)
    drawing.registerLightmap("rcpoc_ceil", gw, gh, mc, mr, cbytes)
endfunction

' Summed warm-light contribution (0..~N) at a world point from every static
' light: true 3D-distance falloff, wall-occluded by a single LOS ray.
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

function drawFloorField()
    drawing.drawPlaneField("rcpoc_floor", self.floorTex, 0, self.camX, self.camY, self.camZ, self.fDirX, self.fDirY, self.fPlaneX, self.fPlaneY, self.camPitch, self.viewW, self.viewH, self.scy, RcConfig.RC_EYE_Z, "rcpoc_floor", self.boundLights.ambientLevel(), 150, 140, 125)
endfunction

function drawCeilField()
    drawing.drawPlaneField("rcpoc_ceil", self.ceilTex, RcConfig.RC_STD_CEIL, self.camX, self.camY, self.camZ, self.fDirX, self.fDirY, self.fPlaneX, self.fPlaneY, self.camPitch, self.viewW, self.viewH, self.scy, RcConfig.RC_EYE_Z, "rcpoc_ceil", self.boundLights.ambientLevel(), 120, 120, 140)
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

    ' Ambient-only fallback fill, in case a field sprite has a transparent gap.
    pen.setLineWidth(0)
    pen.setFillColor(baseCh * 0.55, baseCh * 0.55, baseCh * 0.75)
    drawing.drawRect(self.viewW / 2, self.scy / 2, self.viewW, self.scy)
    pen.setFillColor(baseCh * 0.4, baseCh * 0.4, baseCh * 0.5)
    drawing.drawRect(self.viewW / 2, self.scy + self.scy / 2, self.viewW, self.viewH - self.scy)

    ' Floor + ceiling: true per-pixel floorcast, drawn BEFORE the walls so the
    ' wall strips paint over them.
    if self.boundLights <> 0 then
        self.drawFloorField()
        self.drawCeilField()
    endif

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
endfunction

EndClass
