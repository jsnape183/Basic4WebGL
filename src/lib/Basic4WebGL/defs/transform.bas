Class
dim _handle

Constructor(handle)
    _handle = call("constructor_handle")
EndConstructor

function setPosition(x, y)
    call("_sb.setPosition(this._handle, setposition_x, setposition_y)")
endfunction

function x()
    return call("_sb.getPositionX(this._handle)")
endfunction

function y()
    return call("_sb.getPositionY(this._handle)")
endfunction

EndClass
