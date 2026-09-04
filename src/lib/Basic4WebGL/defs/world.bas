function add(obj)
    call("_sb.addToWorld(add_obj)")
endfunction

function remove(obj)
    call("_sb.removeFromWorld(remove_obj)")
endfunction

function clear()
    call("_sb.clearWorld()")
endfunction

function width()
    return call("_sb.getStageWidth()")
endfunction

function height()
    return call("_sb.getStageHeight()")
endfunction

' fps() -- PIXI's measured frames-per-second (a smoothed rolling average of
' the real render rate). 60 on a healthy vsync-locked frame; drops when a
' frame runs long. Read it in onupdate to show a live performance figure.
function fps()
    return call("_sb.getWorldFps()")
endfunction

' drawCalls() -- GPU draw calls issued for the last rendered frame. A locked
' 60fps hides how much headroom is left; this doesn't. A few dozen is roomy,
' several hundred is near the batching ceiling.
function drawCalls()
    return call("_sb.getWorldDrawCalls()")
endfunction

' gpuFrameMs() -- measured GPU time (ms) for the last rendered frame. Subtract
' from 16.7 for the headroom at 60fps. Returns -1 where the browser has no GPU
' timer (Firefox, Safari) or no result is ready yet.
function gpuFrameMs()
    return call("_sb.getWorldGpuMs()")
endfunction

function setBackground(r, g, b)
    call("_sb.setBackground(setbackground_r, setbackground_g, setbackground_b)")
endfunction

function setPixelPerfect(v)
    call("_sb.setPixelPerfect(setpixelperfect_v)")
endfunction
