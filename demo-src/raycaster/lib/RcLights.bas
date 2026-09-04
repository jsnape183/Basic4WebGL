Class
' RcLights -- a per-cell light grid for a raycaster scene (spec §6).
' Ambient + baked static lights (from `light:` tags) + up to RC_LIGHT_CAP dynamic
' point lights, each wall-occluded via RcCast.los. As of the renderer rework,
' RcRender uses sampleAt() (bilinear) for floor/ceiling surfaces and sampleCell()
' (per-cell) for walls, multiplying the base shade.
'
' The RcWorld field is `wld`, NEVER `world`.
'
' Deferred (spec): coloured light (only a scalar 0..1 per cell here), spot cones,
' per-(cell,light) static caching (§6.4).
' - the dynamic-light cap is global first-RC_LIGHT_CAP by slot order, NOT spec
'   §6.1's per-cell nearest-N (fine at demo scale).
' - wall cells receive no splat (self-occluded); sampleCell on a wall cell
'   borrows its brightest open neighbour instead of reading back near-ambient
'   (see sampleCell / brightestOpenNeighbor) -- keeps sampleAt's bilinear
'   blend from bleeding a false dark wedge onto open floor next to a wall.
'   RcRender additionally samples the open cell in front of a wall FACE
'   directly, rather than the wall cell itself (Task 6).
' - addPoint's `z` is stored (lzArr) but not yet read -- reserved for vertical
'   falloff / spot cones.
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
dim lFalloffArr(0)

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

' Splat every `light:` cell into dynArr (used here as scratch), then copy the
' result into staticArr element-wise and zero dynArr. Called once from the
' Constructor, before any dynamic lights exist.
function bakeStatic()
    dim lc
    dim lr
    dim i
    dim n
    for lr = 0 to self.rows - 1
        for lc = 0 to self.cols - 1
            if self.wld.lightAt(lc, lr) > 0 then
                self.splat(lc + 0.5, lr + 0.5, RcConfig.RC_STATIC_INTENSITY, RcConfig.RC_LIGHT_RANGE, RcConfig.RC_FALLOFF_LINEAR)
            endif
        next lc
    next lr
    n = self.cols * self.rows
    for i = 0 to n - 1
        self.staticArr(i) = self.dynArr(i)
        self.dynArr(i) = 0
    next i
endfunction

' Falloff defaults to RcConfig.RC_FALLOFF_LINEAR (unchanged behaviour) --
' call setLightFalloff() after adding the light to switch it.
function addPoint(x, y, z, intensity, radiusCells)
    array.push(self.lxArr, x)
    array.push(self.lyArr, y)
    array.push(self.lzArr, z)
    array.push(self.liArr, intensity)
    array.push(self.lrArr, radiusCells)
    array.push(self.lActive, 1)
    array.push(self.lFalloffArr, RcConfig.RC_FALLOFF_LINEAR)
    return array.arrLength(self.lActive) - 1
endfunction

function moveLight(handle, x, y)
    self.lxArr(handle) = x
    self.lyArr(handle) = y
endfunction

function setLightIntensity(handle, intensity)
    self.liArr(handle) = intensity
endfunction

function setLightRadius(handle, radiusCells)
    self.lrArr(handle) = radiusCells
endfunction

' kind is RcConfig.RC_FALLOFF_LINEAR or RC_FALLOFF_QUADRATIC -- see RcConfig.bas
' header for what each curve looks like.
function setLightFalloff(handle, kind)
    self.lFalloffArr(handle) = kind
endfunction

function removeLight(handle)
    self.lActive(handle) = 0
endfunction

' Splat one light's contribution into dynArr, LOS-occluded by walls. Always
' writes dynArr -- bakeStatic copies the result into staticArr afterwards.
' falloff is RcConfig.RC_FALLOFF_LINEAR or RC_FALLOFF_QUADRATIC.
function splat(wx, wy, intensity, radiusCells, falloff)
    dim col
    dim row
    dim c0
    dim c1
    dim r0
    dim r1
    c0 = math.floor(wx - radiusCells)
    c1 = math.floor(wx + radiusCells)
    r0 = math.floor(wy - radiusCells)
    r1 = math.floor(wy + radiusCells)
    for row = r0 to r1
        for col = c0 to c1
            if col >= 0 and row >= 0 and col < self.cols and row < self.rows then
                self.splatCell(wx, wy, intensity, radiusCells, col, row, falloff)
            endif
        next col
    next row
endfunction

' One cell's contribution from a light at (wx, wy). Early-returns when the cell
' is out of range or occluded by a wall. The light's own cell gets full
' intensity -- it must be the brightest cell, not dark: a wall face whose
' RcRender lighting sample steps back onto the light cell would otherwise read
' only ambient (this is exactly the "dark wall right next to the lamp" bug).
' LINEAR ramps intensity down evenly across the whole radius (the falloff every
' light used before RC_FALLOFF existed). QUADRATIC squares the (1 - dist/radius)
' term, concentrating brightness near the source and dropping away faster --
' a small bright pool that dies off quickly rather than a wide, gradual gradient.
function splatCell(wx, wy, intensity, radiusCells, col, row, falloff)
    dim cx
    dim cy
    dim dx
    dim dy
    dim dist
    dim losD
    dim t
    dim add
    cx = col + 0.5
    cy = row + 0.5
    dx = cx - wx
    dy = cy - wy
    dist = math.sqrt(dx * dx + dy * dy)
    if dist <= 0.001 then
        self.addGrid(col, row, intensity)
        return
    endif
    if dist >= radiusCells then
        return
    endif
    losD = self.rc.los(self.wld, wx, wy, dx / dist, dy / dist)
    if losD >= 0 and losD < dist - 0.05 then
        return
    endif
    t = 1.0 - dist / radiusCells
    if falloff = RcConfig.RC_FALLOFF_QUADRATIC then
        add = intensity * t * t
    else
        add = intensity * t
    endif
    self.addGrid(col, row, add)
endfunction

function addGrid(col, row, v)
    dim idx
    idx = row * self.cols + col
    self.dynArr(idx) = self.dynArr(idx) + v
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
                self.splat(self.lxArr(i), self.lyArr(i), self.liArr(i), self.lrArr(i), self.lFalloffArr(i))
                count = count + 1
            endif
        endif
    next i
endfunction

' Total light at a cell, clamped 0..1. A wall cell is never splatted (its own
' centre is self-occluded -- see header), so it borrows the brightest OPEN
' neighbour instead of reading back near-zero. Without this, sampleAt's
' bilinear blend below would pull a wall corner's near-ambient value into any
' nearby floor/ceiling sample, showing up as a false dark wedge on open floor
' right next to a wall -- most visible exactly where floor/ceiling height
' changes (a step, a raised area), since that's the geometry most often
' authored right against a wall.
function sampleCell(col, row)
    dim idx
    if col < 0 or row < 0 or col >= self.cols or row >= self.rows then
        return self.ambient
    endif
    if self.wld.wallAt(col, row) > 0 then
        return self.brightestOpenNeighbor(col, row)
    endif
    idx = row * self.cols + col
    return math.clamp(self.ambient + self.staticArr(idx) + self.dynArr(idx), 0, 1)
endfunction

' The brightest of a wall cell's eight neighbours (orthogonal + diagonal) that
' is itself open (never recurses into another wall cell), or plain ambient if
' every neighbour is out of bounds or a wall too (a wall thicker than one
' cell, or a solid corner). Diagonals matter here, not just orthogonals: a
' corner wall cell (e.g. the outer corner of a room) can have two wall
' orthogonal neighbours and no open one, while its diagonal neighbour is the
' actual open floor cell sampleAt's bilinear blend is trying to reach.
function brightestOpenNeighbor(col, row)
    dim best
    dim v
    best = self.ambient
    if col - 1 >= 0 then
        if self.wld.wallAt(col - 1, row) = 0 then
            v = self.sampleCell(col - 1, row)
            if v > best then
                best = v
            endif
        endif
    endif
    if col + 1 < self.cols then
        if self.wld.wallAt(col + 1, row) = 0 then
            v = self.sampleCell(col + 1, row)
            if v > best then
                best = v
            endif
        endif
    endif
    if row - 1 >= 0 then
        if self.wld.wallAt(col, row - 1) = 0 then
            v = self.sampleCell(col, row - 1)
            if v > best then
                best = v
            endif
        endif
    endif
    if row + 1 < self.rows then
        if self.wld.wallAt(col, row + 1) = 0 then
            v = self.sampleCell(col, row + 1)
            if v > best then
                best = v
            endif
        endif
    endif
    if col - 1 >= 0 and row - 1 >= 0 then
        if self.wld.wallAt(col - 1, row - 1) = 0 then
            v = self.sampleCell(col - 1, row - 1)
            if v > best then
                best = v
            endif
        endif
    endif
    if col + 1 < self.cols and row - 1 >= 0 then
        if self.wld.wallAt(col + 1, row - 1) = 0 then
            v = self.sampleCell(col + 1, row - 1)
            if v > best then
                best = v
            endif
        endif
    endif
    if col - 1 >= 0 and row + 1 < self.rows then
        if self.wld.wallAt(col - 1, row + 1) = 0 then
            v = self.sampleCell(col - 1, row + 1)
            if v > best then
                best = v
            endif
        endif
    endif
    if col + 1 < self.cols and row + 1 < self.rows then
        if self.wld.wallAt(col + 1, row + 1) = 0 then
            v = self.sampleCell(col + 1, row + 1)
            if v > best then
                best = v
            endif
        endif
    endif
    return best
endfunction

' Bilinear light at a world point (cell centres are at integer + 0.5).
function sampleAt(worldX, worldY)
    dim fx
    dim fy
    dim c0
    dim r0
    dim tx
    dim ty
    dim a
    dim b
    dim c
    dim e
    fx = worldX - 0.5
    fy = worldY - 0.5
    c0 = math.floor(fx)
    r0 = math.floor(fy)
    tx = fx - c0
    ty = fy - r0
    a = self.sampleCell(c0, r0)
    b = self.sampleCell(c0 + 1, r0)
    c = self.sampleCell(c0, r0 + 1)
    e = self.sampleCell(c0 + 1, r0 + 1)
    return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + e * tx * ty
endfunction

EndClass
