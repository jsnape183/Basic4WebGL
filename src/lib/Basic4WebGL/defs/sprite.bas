Class
dim _handle

Constructor(imagePath)
    self._handle = call("_sb.createSprite(constructor_imagePath)")
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

function setDepth(n)
    call("_sb.setDepth(this._handle, setdepth_n)")
endfunction

function setVelocity(vx, vy)
    call("_sb.setVelocity(this._handle, setvelocity_vx, setvelocity_vy)")
endfunction

function velocityX()
    return call("_sb.getVelocityX(this._handle)")
endfunction

function velocityY()
    return call("_sb.getVelocityY(this._handle)")
endfunction

function isBlockedUp()
    return call("_sb.isBlockedUp(this._handle)")
endfunction

function isBlockedDown()
    return call("_sb.isBlockedDown(this._handle)")
endfunction

function isBlockedLeft()
    return call("_sb.isBlockedLeft(this._handle)")
endfunction

function isBlockedRight()
    return call("_sb.isBlockedRight(this._handle)")
endfunction

function attachTo(parent)
    call("_sb.attachSprite(this._handle, attachto_parent)")
endfunction

function detach()
    call("_sb.detachSprite(this._handle)")
endfunction

EndClass