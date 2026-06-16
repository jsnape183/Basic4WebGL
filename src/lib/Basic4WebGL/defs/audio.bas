Class
dim _handle

Constructor(soundPath)
    self._handle = call("_sb.createSound(constructor_soundPath)")
EndConstructor

function play()
    call("_sb.soundPlay(this._handle)")
endfunction

function playLoop()
    call("_sb.soundPlayLoop(this._handle)")
endfunction

function stop()
    call("_sb.soundStop(this._handle)")
endfunction

function setVolume(volume)
    call("_sb.soundSetVolume(this._handle, setvolume_volume)")
endfunction

function isPlaying()
    return call("_sb.soundIsPlaying(this._handle)")
endfunction

EndClass
