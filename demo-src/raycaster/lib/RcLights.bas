Class
' RcLights -- a per-cell light grid for a raycaster scene (spec §6).
' Ambient + baked static lights (from `light:` tags) + up to RC_LIGHT_CAP dynamic
' point lights, each wall-occluded via RcCast.los. RcRender samples sampleCell()
' per strip and multiplies its base shade.
'
' The RcWorld field is `wld`, NEVER `world`.
'
' Deferred (spec): coloured light (only a scalar 0..1 per cell here), spot cones,
' per-(cell,light) static caching (§6.4).
dim wld as RcWorld
dim rc as RcCast
dim cols
dim rows
dim ambient
dim staticArr(0)
dim dynArr(0)
dim lxArr(0)
dim lyArr(0)
dim lzArr(0)
dim liArr(0)
dim lrArr(0)
dim lActive(0)

Constructor(w as RcWorld)
    self.wld = w
    self.rc = new RcCast()
    self.cols = w.widthCells()
    self.rows = w.heightCells()
    self.ambient = RcConfig.RC_AMBIENT
    dim n
    dim i
    n = self.cols * self.rows
    for i = 0 to n - 1
        array.push(self.staticArr, 0)
        array.push(self.dynArr, 0)
    next i
    self.bakeStatic()
EndConstructor

function setAmbient(level)
    self.ambient = level
endfunction

function bakeStatic()
    dim lc
    dim lr
    for lr = 0 to self.rows - 1
        for lc = 0 to self.cols - 1
            if self.wld.lightAt(lc, lr) > 0 then
                self.splat(0, lc + 0.5, lr + 0.5, 0.9, RcConfig.RC_LIGHT_RANGE)
            endif
        next lc
    next lr
endfunction

function addPoint(x, y, z, intensity, radiusCells)
    array.push(self.lxArr, x)
    array.push(self.lyArr, y)
    array.push(self.lzArr, z)
    array.push(self.liArr, intensity)
    array.push(self.lrArr, radiusCells)
    array.push(self.lActive, 1)
    return array.arrLength(self.lActive) - 1
endfunction

function moveLight(handle, x, y)
    self.lxArr(handle) = x
    self.lyArr(handle) = y
endfunction

function setLightIntensity(handle, intensity)
    self.liArr(handle) = intensity
endfunction

function removeLight(handle)
    self.lActive(handle) = 0
endfunction

' whichGrid: 0 = staticArr (bake), 1 = dynArr (per-frame). Splat one light's
' contribution, LOS-occluded by walls.
function splat(whichGrid, wx, wy, intensity, radiusCells)
    dim col
    dim row
    dim c0
    dim c1
    dim r0
    dim r1
    dim cx
    dim cy
    dim dx
    dim dy
    dim dist
    dim losD
    dim add
    c0 = math.floor(wx - radiusCells)
    c1 = math.floor(wx + radiusCells)
    r0 = math.floor(wy - radiusCells)
    r1 = math.floor(wy + radiusCells)
    for row = r0 to r1
        for col = c0 to c1
            if col >= 0 and row >= 0 and col < self.cols and row < self.rows then
                cx = col + 0.5
                cy = row + 0.5
                dx = cx - wx
                dy = cy - wy
                dist = math.sqrt(dx * dx + dy * dy)
                if dist > 0.001 and dist < radiusCells then
                    losD = self.rc.los(self.wld, wx, wy, dx / dist, dy / dist)
                    if losD < 0 or losD >= dist - 0.05 then
                        add = intensity * (1.0 - dist / radiusCells)
                        self.addGrid(whichGrid, col, row, add)
                    endif
                endif
            endif
        next col
    next row
endfunction

function addGrid(whichGrid, col, row, v)
    dim idx
    idx = row * self.cols + col
    if whichGrid = 0 then
        self.staticArr(idx) = self.staticArr(idx) + v
    else
        self.dynArr(idx) = self.dynArr(idx) + v
    endif
endfunction

' Recompute the dynamic grid. Call once per frame before RcRender.renderFrame().
function update()
    dim i
    dim n
    dim count
    n = self.cols * self.rows
    for i = 0 to n - 1
        self.dynArr(i) = 0
    next i
    count = 0
    for i = 0 to array.arrLength(self.lActive) - 1
        if self.lActive(i) = 1 then
            if count < RcConfig.RC_LIGHT_CAP then
                self.splat(1, self.lxArr(i), self.lyArr(i), self.liArr(i), self.lrArr(i))
                count = count + 1
            endif
        endif
    next i
endfunction

' Total light at a cell, clamped 0..1.
function sampleCell(col, row)
    dim idx
    if col < 0 or row < 0 or col >= self.cols or row >= self.rows then
        return self.ambient
    endif
    idx = row * self.cols + col
    return math.clamp(self.ambient + self.staticArr(idx) + self.dynArr(idx), 0, 1)
endfunction

EndClass
