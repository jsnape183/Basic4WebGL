function boxCollide(a, b)
    return call("_sb.boxCollide(boxcollide_a, boxcollide_b)")
endfunction

function getKeyDown(keycode)
    return call("_sb.getKeyDown(getkeydown_keycode)")
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
