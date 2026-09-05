Class
' RcRenderPool -- rough, throwaway POC renderer validating the light-pool
' redesign direction (see
' docs/superpowers/specs/2026-09-05-raycaster-lightpool-poc-design.md).
' NOT production code. Deliberately much smaller than the shared RcRender.bas:
' this POC's map has no floor/ceiling height variation, no diagonal tiles, no
' textures, so none of that logic is needed. Floor/ceiling are flat, dim,
' ambient-only fills -- NO per-column light sampling anywhere in the base
' render. Static lights are drawn afterward as screen-space radial-gradient
' "pool" overlays (drawLightPools()) instead, using the exact camera-plane
' billboard-projection formula the shared RcRender.bas already uses for actor
' billboards (relX/relY -> invDet -> depth/tX -> screenX).
'
' Known POC simplifications (see spec's "Known POC simplifications" section):
' pools are true screen-space circles, not perspective-correct ellipses;
' occlusion is a single ray to the light's centre, no penumbra; no per-pixel
' depth test against walls, so a pool very close to a wall may draw over it;
' no handling for overlapping lights beyond draw order.
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
dim poolWorldRadius

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
    self.poolWorldRadius = 0.4
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

' World-unit radius of the drawn light pool (screen radius scales down with
' distance from this). Tunable for the POC without touching the render logic.
function setPoolRadius(r)
    self.poolWorldRadius = r
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
    dim shade

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
            shade = 150
            if wallSide = 1 then
                shade = 115
            endif
            pen.setFillColor(shade, shade, shade)
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
    dim screenR
    dim alpha
    dim ch
    dim floorY
    dim ceilY

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
                    screenR = self.poolWorldRadius * (self.viewH / depth)
                    alpha = math.clamp((1.0 - depth / radiusCells) * intensity, 0.05, 0.4)
                    ch = math.clamp(255 * intensity, 120, 255)
                    floorY = self.projectY(0, depth)
                    ceilY = self.projectY(RcConfig.RC_STD_CEIL, depth)
                    drawing.drawRadialGradientCircle(screenX, floorY, screenR, ch, ch * 0.85, ch * 0.6, alpha)
                    drawing.drawRadialGradientCircle(screenX, ceilY, screenR, ch, ch * 0.85, ch * 0.6, alpha)
                endif
            endif
        endif
    next i
endfunction

EndClass
