Class
dim _handle

Constructor(tilesetPath, tileW, tileH)
    self._handle = call("_sb.createTileMap(constructor_tilesetPath, constructor_tileW, constructor_tileH)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function load(jsonPath)
    call("_sb.loadTileMap(this._handle, load_jsonPath)")
endfunction

function tileAt(x, y)
    return call("_sb.tileAt(this._handle, tileat_x, tileat_y)")
endfunction

function widthPx()
    return call("_sb.tileMapWidthPx(this._handle)")
endfunction

function heightPx()
    return call("_sb.tileMapHeightPx(this._handle)")
endfunction

EndClass
