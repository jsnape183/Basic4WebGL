Class
' RcWorld -- raycaster world model (spec docs/superpowers/specs/2026-08-31-raycaster-engine-design.md §3).
' Reads a tagged .stm tilemap into parallel per-cell arrays. Pure softBASIC.
'
' Cell index = row * cols + col. Heights are in world units; 0 = standard floor,
' 1.0 = standard ceiling (RC_STD_CEIL). Negative floor = pit.
' flags bitset: 1 door, 2 lift, 4 water, 8 sky.

dim cols
dim rows

dim wallArr(0)
dim floorHArr(0)
dim ceilHArr(0)
dim wallTexArr(0)
dim floorTexArr(0)
dim ceilTexArr(0)
dim upperArr(0)
dim lightArr(0)
dim flagsArr(0)

dim upNames(0)
dim upFloorHArr(0)
dim upCeilHArr(0)

Constructor(tm as tilemapset, wallsLayerName)
    self.build(tm, wallsLayerName)
EndConstructor

function build(tm as tilemapset, wallsLayerName)
    dim tw
    dim th
    tw = tm.tileWidth()
    th = tm.tileHeight()

    dim wallsLayer as tilemaplayer
    wallsLayer = tm.layer(wallsLayerName)
    self.cols = math.floor(wallsLayer.widthPx() / tw)
    self.rows = math.floor(wallsLayer.heightPx() / th)

    dim total
    total = self.cols * self.rows

    dim i
    for i = 0 to total - 1
        array.push(self.wallArr, 0)
        array.push(self.floorHArr, 0)
        array.push(self.ceilHArr, 1.0)
        array.push(self.wallTexArr, "")
        array.push(self.floorTexArr, "")
        array.push(self.ceilTexArr, "")
        array.push(self.upperArr, -1)
        array.push(self.lightArr, 0)
        array.push(self.flagsArr, 0)
    next i

    dim col
    dim row
    dim id
    for row = 0 to self.rows - 1
        for col = 0 to self.cols - 1
            id = wallsLayer.tileAt(col * tw + tw / 2, row * th + th / 2)
            if id > 0 then
                self.wallArr(row * self.cols + col) = id
            endif
        next col
    next row

    dim markers
    markers = tm.allMarkers()
    dim mi
    dim mk as Marker
    for mi = 0 to array.arrLength(markers) - 1
        mk = markers(mi)
        if mk.col >= 0 then
            if mk.row >= 0 then
                if mk.col < self.cols then
                    if mk.row < self.rows then
                        self.applyTag(mk.row * self.cols + mk.col, mk.tag)
                    endif
                endif
            endif
        endif
    next mi
endfunction

function applyTag(idx, tagStr)
    dim tokens
    tokens = string.split(string.trim(tagStr), " ")
    dim pass
    dim ti
    dim tok
    dim ci
    dim k
    dim isUpper
    for pass = 0 to 1
        for ti = 0 to array.arrLength(tokens) - 1
            tok = tokens(ti)
            if string.len(tok) > 0 then
                ci = string.indexof(tok, ":")
                if ci < 0 then
                    if pass = 0 then
                        self.applyFlag(idx, tok)
                    endif
                else
                    k = string.substr(tok, 0, ci)
                    isUpper = 0
                    if k = "upper" then
                        isUpper = 1
                    endif
                    if pass = 0 then
                        if isUpper = 0 then
                            self.applyKv(idx, k, string.substr(tok, ci + 1, string.len(tok)))
                        endif
                    else
                        if isUpper = 1 then
                            self.applyKv(idx, k, string.substr(tok, ci + 1, string.len(tok)))
                        endif
                    endif
                endif
            endif
        next ti
    next pass
endfunction

' Idempotent bit-set: only adds `bit` to the cell's flag bitset if not already set.
' softBASIC has no bitwise operators and no modulo, so oddness of flags/bit is
' computed as q - math.floor(q / 2) * 2.
function setFlag(idx, bit)
    dim q
    q = math.floor(self.flagsArr(idx) / bit)
    if q - math.floor(q / 2) * 2 < 1 then
        self.flagsArr(idx) = self.flagsArr(idx) + bit
    endif
endfunction

function applyFlag(idx, name)
    if name = "door" then
        self.setFlag(idx, 1)
    endif
    if name = "lift" then
        self.setFlag(idx, 2)
    endif
    if name = "water" then
        self.setFlag(idx, 4)
    endif
    if name = "sky" then
        self.setFlag(idx, 8)
    endif
endfunction

function applyKv(idx, key, v)
    if key = "tex" then
        self.wallTexArr(idx) = v
    endif
    if key = "ftex" then
        self.floorTexArr(idx) = v
    endif
    if key = "ctex" then
        self.ceilTexArr(idx) = v
    endif
    if key = "floor" then
        self.floorHArr(idx) = math.val(v)
    endif
    if key = "ceil" then
        self.ceilHArr(idx) = math.val(v)
    endif
    if key = "light" then
        self.lightArr(idx) = 1
    endif
    if key = "upper" then
        self.upperArr(idx) = self.upperRegion(v, self.ceilHArr(idx))
    endif
endfunction

' Returns the index of the upper-region entry named `name`, creating it on first
' use. baseCeil is the host cell's ceiling -- the upper region floor sits on it.
function upperRegion(name, baseCeil)
    dim i
    for i = 0 to array.arrLength(self.upNames) - 1
        if self.upNames(i) = name then
            return i
        endif
    next i
    array.push(self.upNames, name)
    array.push(self.upFloorHArr, baseCeil)
    array.push(self.upCeilHArr, baseCeil + 1.0)
    return array.arrLength(self.upNames) - 1
endfunction

' -- read accessors (col, row are integer cell coords) --

function inBounds(col, row)
    if col < 0 then
        return 0
    endif
    if row < 0 then
        return 0
    endif
    if col >= self.cols then
        return 0
    endif
    if row >= self.rows then
        return 0
    endif
    return 1
endfunction

function wallAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 1
    endif
    return self.wallArr(row * self.cols + col)
endfunction

function floorHeightAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    return self.floorHArr(row * self.cols + col)
endfunction

function ceilHeightAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    return self.ceilHArr(row * self.cols + col)
endfunction

function flagsAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    return self.flagsArr(row * self.cols + col)
endfunction

function hasUpperAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    if self.upperArr(row * self.cols + col) >= 0 then
        return 1
    endif
    return 0
endfunction

function wallTexAt(col, row)
    if self.inBounds(col, row) = 0 then
        return ""
    endif
    return self.wallTexArr(row * self.cols + col)
endfunction

function widthCells()
    return self.cols
endfunction

function heightCells()
    return self.rows
endfunction

EndClass
