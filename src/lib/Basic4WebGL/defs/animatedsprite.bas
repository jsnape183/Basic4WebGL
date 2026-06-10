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

EndClass
