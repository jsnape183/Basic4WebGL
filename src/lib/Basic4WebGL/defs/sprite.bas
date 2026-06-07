Class
dim _handle

Constructor(imagePath)
    _handle = call("_sb.createSprite(constructor_imagePath)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function setAngle(angle)
    call("_sb.setAngle(this._handle, setangle_angle)")
endfunction

function setAlpha(a)
    call("_sb.setAlpha(this._handle, setalpha_a)")
endfunction

function setScale(sx, sy)
    call("_sb.setScale(this._handle, setscale_sx, setscale_sy)")
endfunction

function setFlip(h, v)
    call("_sb.setFlip(this._handle, setflip_h, setflip_v)")
endfunction

function setVisible(v)
    call("_sb.setVisible(this._handle, setvisible_v)")
endfunction

function setTexture(path)
    call("_sb.setTexture(this._handle, settexture_path)")
endfunction

function width()
    return call("_sb.getSpriteWidth(this._handle)")
endfunction

function height()
    return call("_sb.getSpriteHeight(this._handle)")
endfunction

EndClass
