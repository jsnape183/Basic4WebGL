function setup(tileMapSet, blockingLayers)
    call("_sb.setupNavGrid(setup_tileMapSet, setup_blockingLayers)")
endfunction

function setRecomputeInterval(ms)
    call("_sb.setRecomputeInterval(setrecomputeinterval_ms)")
endfunction

function navigateTo(sprite, x, y, speed)
    call("_sb.navigateTo(navigateto_sprite, navigateto_x, navigateto_y, navigateto_speed)")
endfunction

function isNavigating(sprite)
    return call("_sb.isNavigating(isnavigating_sprite)")
endfunction

function stopNavigating(sprite)
    call("_sb.stopNavigating(stopnavigating_sprite)")
endfunction
