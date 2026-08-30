function bind(action, device, code)
    call("_sb.bind(bind_action, bind_device, bind_code)")
endfunction

function clearBindings(action)
    call("_sb.clearBindings(clearbindings_action)")
endfunction

function held(action)
    return call("_sb.held(held_action)")
endfunction

function pressed(action)
    return call("_sb.pressed(pressed_action)")
endfunction

function released(action)
    return call("_sb.released(released_action)")
endfunction

function strength(action)
    return call("_sb.strength(strength_action)")
endfunction

function axis(negaction, posaction)
    return call("_sb.axis(axis_negaction, axis_posaction)")
endfunction

function padConnected()
    return call("_sb.padConnected()")
endfunction

function setDeadzone(value)
    call("_sb.setDeadzone(setdeadzone_value)")
endfunction

function getKeyDown(keycode)
    return call("_sb.getKeyDown(getkeydown_keycode)")
endfunction

function keyPressed(keycode)
    return call("_sb.keyPressed(keypressed_keycode)")
endfunction

function keyReleased(keycode)
    return call("_sb.keyReleased(keyreleased_keycode)")
endfunction

function mouseX()
    return call("_sb.getMouseX()")
endfunction

function mouseY()
    return call("_sb.getMouseY()")
endfunction

function mouseDown()
    return call("_sb.getMouseDown()")
endfunction
