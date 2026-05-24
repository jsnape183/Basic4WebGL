Class
dim _handle

Constructor(imagePath)
    _handle = call("_sb.createSprite(constructor_imagepath)")
EndConstructor

function setPosition(x, y)
    call("_sb.setPosition(this._handle, setposition_x, setposition_y)")
endfunction

function getX()
    return call("_sb.getPositionX(this._handle)")
endfunction

function getY()
    return call("_sb.getPositionY(this._handle)")
endfunction

function setAngle(angle)
    call("_sb.setAngle(this._handle, setangle_angle)")
endfunction

function setAlpha(a)
    call("_sb.setAlpha(this._handle, setalpha_a)")
endfunction

EndClass