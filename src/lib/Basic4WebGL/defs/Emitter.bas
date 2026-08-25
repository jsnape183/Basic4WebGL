Class
dim _handle

Constructor(texturePath)
    self._handle = call("_sb.createEmitter(constructor_texturePath)")
    dim transform as ObjectTransform(call("this._handle"))
EndConstructor

function setLifetime(minSeconds, maxSeconds)
    call("_sb.setEmitterLifetime(this._handle, setlifetime_minSeconds, setlifetime_maxSeconds)")
endfunction

function setSpawnRate(perSecond)
    call("_sb.setEmitterSpawnRate(this._handle, setspawnrate_perSecond)")
endfunction

function setMaxParticles(n)
    call("_sb.setEmitterMaxParticles(this._handle, setmaxparticles_n)")
endfunction

function setSpeed(minSpeed, maxSpeed)
    call("_sb.setEmitterSpeed(this._handle, setspeed_minSpeed, setspeed_maxSpeed)")
endfunction

function setDirection(angleMin, angleMax)
    call("_sb.setEmitterDirection(this._handle, setdirection_angleMin, setdirection_angleMax)")
endfunction

function setGravity(x, y)
    call("_sb.setEmitterGravity(this._handle, setgravity_x, setgravity_y)")
endfunction

function setScaleOverLife(startScale, endScale)
    call("_sb.setEmitterScaleOverLife(this._handle, setscaleoverlife_startScale, setscaleoverlife_endScale)")
endfunction

function setAlphaOverLife(startAlpha, endAlpha)
    call("_sb.setEmitterAlphaOverLife(this._handle, setalphaoverlife_startAlpha, setalphaoverlife_endAlpha)")
endfunction

function setColorOverLife(startColor, endColor)
    call("_sb.setEmitterColorOverLife(this._handle, setcoloroverlife_startColor, setcoloroverlife_endColor)")
endfunction

function setSpawnPoint()
    call("_sb.setEmitterSpawnPoint(this._handle)")
endfunction

function setSpawnCircle(radius)
    call("_sb.setEmitterSpawnCircle(this._handle, setspawncircle_radius)")
endfunction

function setSpawnBoxShape(width, height)
    call("_sb.setEmitterSpawnBoxShape(this._handle, setspawnboxshape_width, setspawnboxshape_height)")
endfunction

function start()
    call("_sb.emitterStart(this._handle)")
endfunction

function stop()
    call("_sb.emitterStop(this._handle)")
endfunction

function burst(count)
    call("_sb.emitterBurst(this._handle, burst_count)")
endfunction

function attachTo(parent)
    call("_sb.attachSprite(this._handle, attachto_parent)")
endfunction

function detach()
    call("_sb.detachSprite(this._handle)")
endfunction

EndClass
