Class
' RcWorld -- raycaster world model (spec docs/superpowers/specs/2026-08-31-raycaster-engine-design.md §3).
' Reads a tagged .stm tilemap into parallel per-cell arrays. Pure softBASIC.
'
' Cell index = row * cols + col. Heights are in world units; 0 = standard floor,
' 1.0 = standard ceiling (RC_STD_CEIL). Negative floor = pit.
' flags bitset: 1 door, 2 lift, 4 water, 8 sky.
' diagArr: 0 = not diagonal, else a corner code 1=nw 2=ne 3=se 4=sw (a
' corner-solid 45-degree tile; mirrors RcConfig.RC_DIAG_* -- kept as bare
' literals here, predating this file's RcConfig dependency).
'
' A `light` tag (bare, or `light:<height>`) sets lightArr(idx) to a 0/1 flag;
' RcLights.bakeStatic reads it as a static light source at RC_STATIC_INTENSITY.
' The tag's optional height (`light:1.8`) is parsed into lightHArr, defaulting
' to RcConfig.RC_LIGHT_DEFAULT_Z for a bare `light` -- see lightHeightAt.

dim cols
dim rows

dim wallArr(0)
dim floorHArr(0)
dim ceilHArr(0)
dim wallTexArr(0)
dim floorTexArr(0)
dim ceilTexArr(0)
dim lightArr(0)
dim lightHArr(0)
dim flagsArr(0)
dim diagArr(0)

' Per-cell flat floor/ceiling colour overrides, from `fcol:RRGGBB` / `ccol:RRGGBB`
' tags (6 hex digits). -1 = no override (use the renderer's default shade).
' surfColSeen is a fast-path flag: 0 = no cell carries a colour, skip the march.
dim floorColArr(0)
dim ceilColArr(0)
dim surfColSeen

' Fast-path flag: 1 if any cell carries a non-standard floor: / ceil: height
' (a step, dais, pit or soffit). The renderer's flat floor/ceiling fill
' assumes a single height across the visible plane, which a step breaks, so
' RcRender skips that optimisation when this is set.
dim heightVarSeen

dim cfg as RcSettings

Constructor(tm as tilemapset, wallsLayerName)
    self.cfg = new RcSettings()
    self.build(tm, wallsLayerName)
EndConstructor

function bindSettings(s as RcSettings)
    self.cfg = s
endfunction

function build(tm as tilemapset, wallsLayerName)
    dim tw
    dim th
    self.surfColSeen = 0
    self.heightVarSeen = 0
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
        array.push(self.ceilHArr, RcConfig.RC_UNTAGGED)
        array.push(self.wallTexArr, "")
        array.push(self.floorTexArr, "")
        array.push(self.ceilTexArr, "")
        array.push(self.floorColArr, 0 - 1)
        array.push(self.ceilColArr, 0 - 1)
        array.push(self.lightArr, 0)
        array.push(self.lightHArr, RcConfig.RC_UNTAGGED)
        array.push(self.flagsArr, 0)
        array.push(self.diagArr, 0)
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
    dim ti
    dim tok
    dim ci
    dim k
    for ti = 0 to array.arrLength(tokens) - 1
        tok = tokens(ti)
        if string.len(tok) > 0 then
            ci = string.indexof(tok, ":")
            if ci < 0 then
                self.applyFlag(idx, tok)
            else
                k = string.substr(tok, 0, ci)
                self.applyKv(idx, k, string.substr(tok, ci + 1, string.len(tok)))
            endif
        endif
    next ti
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
    if name = "light" then
        self.lightArr(idx) = 1
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
        if math.val(v) <> 0 then
            self.heightVarSeen = 1
        endif
    endif
    if key = "ceil" then
        self.ceilHArr(idx) = math.val(v)
        ' NB: compared to the compiled default, not cfg.stdCeil() -- bindSettings
        ' comes after parse. A scene that sets stdCeil AND tags cells to match will
        ' trip heightVarSeen (a small render cost, never wrong). See RcSettings docs.
        if math.val(v) <> RcConfig.RC_STD_CEIL then
            self.heightVarSeen = 1
        endif
    endif
    if key = "light" then
        self.lightArr(idx) = 1
        self.lightHArr(idx) = math.val(v)
    endif
    if key = "diag" then
        if v = "nw" then
            self.diagArr(idx) = 1
        endif
        if v = "ne" then
            self.diagArr(idx) = 2
        endif
        if v = "se" then
            self.diagArr(idx) = 3
        endif
        if v = "sw" then
            self.diagArr(idx) = 4
        endif
    endif
    if key = "fcol" then
        self.floorColArr(idx) = self.parseHex(v)
        self.surfColSeen = 1
    endif
    if key = "ccol" then
        self.ceilColArr(idx) = self.parseHex(v)
        self.surfColSeen = 1
    endif
endfunction

' Parse a 6-hex-digit RRGGBB string to a packed integer r*65536 + g*256 + b.
' softBASIC has no hex literal support, so digits are looked up by position.
function parseHex(s)
    dim digits
    dim r
    dim i
    dim c
    dim d
    digits = "0123456789abcdef"
    r = 0
    for i = 0 to string.len(s) - 1
        c = string.lcase(string.substr(s, i, i + 1))
        d = string.indexof(digits, c)
        if d < 0 then
            d = 0
        endif
        r = r * 16 + d
    next i
    return r
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
    ' OOB cells are solid walls, so this OOB value is informational only.
    ' 0 is the standard floor.
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    return self.floorHArr(row * self.cols + col)
endfunction

function ceilHeightAt(col, row)
    ' OOB cells are solid walls, so this OOB value is informational only.
    ' 1.0 matches the standard ceiling.
    dim v
    if self.inBounds(col, row) = 0 then
        return self.cfg.stdCeil()
    endif
    v = self.ceilHArr(row * self.cols + col)
    if v = RcConfig.RC_UNTAGGED then
        return self.cfg.stdCeil()
    endif
    return v
endfunction

function flagsAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    return self.flagsArr(row * self.cols + col)
endfunction

function diagAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    return self.diagArr(row * self.cols + col)
endfunction

function wallTexAt(col, row)
    if self.inBounds(col, row) = 0 then
        return ""
    endif
    return self.wallTexArr(row * self.cols + col)
endfunction

function lightAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    return self.lightArr(row * self.cols + col)
endfunction

function lightHeightAt(col, row)
    dim v
    if self.inBounds(col, row) = 0 then
        return self.cfg.lightDefaultZ()
    endif
    v = self.lightHArr(row * self.cols + col)
    if v = RcConfig.RC_UNTAGGED then
        return self.cfg.lightDefaultZ()
    endif
    return v
endfunction

function floorTexAt(col, row)
    if self.inBounds(col, row) = 0 then
        return ""
    endif
    return self.floorTexArr(row * self.cols + col)
endfunction

function ceilTexAt(col, row)
    if self.inBounds(col, row) = 0 then
        return ""
    endif
    return self.ceilTexArr(row * self.cols + col)
endfunction

' 1 if any cell carries an fcol:/ccol: override -- lets the renderer skip the
' per-cell surface march entirely when no level uses the feature.
function hasSurfaceColor()
    return self.surfColSeen
endfunction

' 1 if any cell carries a non-standard floor:/ceil: height. RcRender uses this
' to skip its flat single-height floor/ceiling fill (invalid once a step is in
' view -- the step then renders at its true local light while the flat fill
' around it stays at the camera cell's, reading as a glowing step).
function hasHeightVariation()
    return self.heightVarSeen
endfunction

function floorColAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0 - 1
    endif
    return self.floorColArr(row * self.cols + col)
endfunction

function ceilColAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0 - 1
    endif
    return self.ceilColArr(row * self.cols + col)
endfunction

function widthCells()
    return self.cols
endfunction

function heightCells()
    return self.rows
endfunction

EndClass
