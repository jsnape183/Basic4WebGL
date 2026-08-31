Class
dim _handle

Constructor(stmPath)
    self._handle = call("_sb.createTileMapSet(constructor_stmPath)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function layer(name)
    dim result as TileMapLayer(call("_sb.getTileMapSetLayer(this._handle, layer_name)"))
    return result
endfunction

function tileAt(name, x, y)
    return call("_sb.tileAtInSet(this._handle, tileat_name, tileat_x, tileat_y)")
endfunction

function markersByTag(tag)
    return call("_sb.markersByTag(this._handle, markersbytag_tag)")
endfunction

function allMarkers()
    return call("_sb.allMarkers(this._handle)")
endfunction

function tileWidth()
    return call("_sb.tileWidth(this._handle)")
endfunction

function tileHeight()
    return call("_sb.tileHeight(this._handle)")
endfunction

EndClass
