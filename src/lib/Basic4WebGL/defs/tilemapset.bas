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

EndClass
