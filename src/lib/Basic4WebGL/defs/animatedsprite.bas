Class
dim _handle

Constructor(imagePath, frameW, frameH)
    self._handle = call("_sb.createAnimatedSprite(constructor_imagePath, constructor_frameW, constructor_frameH)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function addAnim(name, startFrame, endFrame, fps, loop)
    call("_sb.addAnim(this._handle, addanim_name, addanim_startFrame, addanim_endFrame, addanim_fps, addanim_loop)")
endfunction

function play(name)
    call("_sb.playAnim(this._handle, play_name)")
endfunction

function isPlaying(name)
    return call("_sb.isPlayingAnim(this._handle, isplaying_name)")
endfunction

function stop()
    call("_sb.stopAnim(this._handle)")
endfunction

function setSpriteSheet(imagePath, frameW, frameH)
    call("_sb.setAnimSpriteSheet(this._handle, setspritesheet_imagePath, setspritesheet_frameW, setspritesheet_frameH)")
endfunction

function setAngle(angle)
    call("_sb.setAnimAngle(this._handle, setangle_angle)")
endfunction

function setAlpha(a)
    call("_sb.setAnimAlpha(this._handle, setalpha_a)")
endfunction

function setScale(sx, sy)
    call("_sb.setAnimScale(this._handle, setscale_sx, setscale_sy)")
endfunction

function setFlip(h, v)
    call("_sb.setAnimFlip(this._handle, setflip_h, setflip_v)")
endfunction

function setVisible(v)
    call("_sb.setAnimVisible(this._handle, setvisible_v)")
endfunction

function width()
    return call("_sb.getAnimWidth(this._handle)")
endfunction

function height()
    return call("_sb.getAnimHeight(this._handle)")
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

EndClass
