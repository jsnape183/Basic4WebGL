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
