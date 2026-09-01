Class
' RcRender -- first-person renderer for RcWorld (spec §5). Owns the camera
' (spec §7.3 -- the `camera` module is inert in a raycast scene). Call
' renderFrame() from the scene's onupdate(delta).
'
' Phase 3 v1: FLAT-SHADED strips (drawing.drawRect, shaded by distance + surface
' kind). No wall textures / atlas / vertical texture-clip yet. The occlusion
' model handles floor/ceiling RISES + flat sky/floor fill; seeing INTO a pit or
' UNDER a ledge (floor drop / ceiling rise revealing farther geometry) is a
' later refinement -- the window is left open there so farther spans show
' through, but the pit floor / under-ledge surface is not specially drawn.
'
' Also not yet implemented: a per-span depth buffer for sprite occlusion (§5.4)
' and any lighting model (§6) -- strips are shaded by surface kind/side only.
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
EndConstructor

function bindCamera(mover)
    self.boundMover = mover
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
        return
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
    rr = math.clamp(g * lightLevel, 0, 255)
    gg = math.clamp(g * lightLevel, 0, 255)
    bb = math.clamp((g + 25) * lightLevel, 0, 255)
    pen.setLineWidth(0)
    pen.setFillColor(rr, gg, bb)
    drawing.drawRect(destX, (t + b) / 2, RcConfig.RC_STRIP_W, b - t)
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
    dim sx
    dim sy
    dim bgLite

    if self.boundMover <> 0 then
        self.camX = self.boundMover.x()
        self.camY = self.boundMover.y()
        self.camAngle = self.boundMover.angle()
        self.camPitch = self.boundMover.pitch()
        self.camZ = self.boundMover.z()
    endif

    bgLite = 1.0
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
                    sx = self.camX + rayX * d * 0.98
                    sy = self.camY + rayY * d * 0.98
                    lite = self.boundLights.sampleCell(math.floor(sx), math.floor(sy))
                else
                    lite = self.boundLights.sampleCell(self.rc.spanCol(i), self.rc.spanRow(i))
                endif
            endif

            if kind = RcConfig.RC_SPAN_WALL then
                self.drawStrip(destX, sTop, sBot, winTop, winBot, self.rc.spanSide(i), lite)
                i = n
            else
                ' Floor and ceiling steps are mirror images: a floor RISE clamps winBot from
                ' below (can't see under a raised floor); a ceiling DROP clamps winTop from
                ' above (can't see above a lowered ceiling). A floor DROP / ceiling RISE leaves
                ' the window open -- farther geometry shows through (documented header gap).
                if kind = RcConfig.RC_SPAN_FLOORSTEP then
                    newH = self.wld.floorHeightAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    self.drawStrip(destX, sTop, sBot, winTop, winBot, 2, lite)
                    if newH > runFloorH then
                        newY = self.projectY(newH, d)
                        if newY < winBot then
                            winBot = newY
                        endif
                    endif
                    runFloorH = newH
                else
                    newH = self.wld.ceilHeightAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    self.drawStrip(destX, sTop, sBot, winTop, winBot, 3, lite)
                    if newH < runCeilH then
                        newY = self.projectY(newH, d)
                        if newY > winTop then
                            winTop = newY
                        endif
                    endif
                    runCeilH = newH
                endif
                i = i + 1
            endif

            if winTop >= winBot then
                i = n
            endif
        endwhile
    next col
endfunction

EndClass
