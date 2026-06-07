function add(obj)
    call("_sb.addToStage(add_obj)")
endfunction

function remove(obj)
    call("_sb.removeFromStage(remove_obj)")
endfunction

function clear()
    call("_sb.clear()")
endfunction

function width()
    return call("_sb.getStageWidth()")
endfunction

function height()
    return call("_sb.getStageHeight()")
endfunction

function setBackground(r, g, b)
    call("_sb.setBackground(setbackground_r, setbackground_g, setbackground_b)")
endfunction
