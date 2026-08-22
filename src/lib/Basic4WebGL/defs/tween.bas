function play(sprite, frames, loop)
    call("_sb.tweenPlay(play_sprite, play_frames, play_loop)")
endfunction

function stop(sprite)
    call("_sb.tweenStop(stop_sprite)")
endfunction

function isPlaying(sprite)
    return call("_sb.tweenIsPlaying(isplaying_sprite)")
endfunction
