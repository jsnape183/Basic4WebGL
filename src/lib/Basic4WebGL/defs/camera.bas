function follow(target, speed)
    call("_sb.cameraFollow(follow_target, follow_speed)")
endfunction

function setPosition(x, y)
    call("_sb.cameraSetPosition(setposition_x, setposition_y)")
endfunction

function setBounds(width, height)
    call("_sb.cameraSetBounds(setbounds_width, setbounds_height)")
endfunction

function x()
    return call("_sb.cameraX()")
endfunction

function y()
    return call("_sb.cameraY()")
endfunction

function shake(intensity, duration)
    call("_sb.cameraShake(shake_intensity, shake_duration)")
endfunction
