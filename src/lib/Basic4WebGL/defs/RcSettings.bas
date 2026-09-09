Class
' RcSettings -- per-scene tunables for the raycaster (softRaycaster package).
'
' RcConfig holds the DEFAULTS (plus structural enums that never change).
' RcSettings is a mutable value object: a scene builds one, adjusts the knobs
' it cares about, and binds it to the Rc* objects it constructs --
'   self.cfg = new RcSettings()
'   self.cfg.setStdCeil(3.0)
'   self.wld.bindSettings(self.cfg)   ' + ren / me / lights
' Every Rc* class defaults its own `cfg` to `new RcSettings()`, so a scene that
' never calls bindSettings behaves exactly as before this module existed.
'
' Bind EARLY -- right after `new`, before the first step()/renderFrame()/
' bake. RcLights re-bakes its static lights on bindSettings; RcWorld resolves
' stdCeil / lightDefaultZ at query time.
'
' moveSpeed / turnSpeed / lookSpeed are read only by scene code
' (self.me.move(fwd * self.cfg.moveSpeed(), ...)); they live here so every
' movement knob has one home.

' Backing fields are abbreviated so none collides with its same-named getter
' method (softBASIC forbids a field and method sharing a name). Do NOT rename
' a field to match its getter -- it will not transpile.
' No validation here: defaults are trusted, callers own sanity (ranges are
' documented in the raycaster guide).
dim mvSpeed
dim tnSpeed
dim lkSpeed
dim grav
dim jump
dim stepUpH
dim maxDt
dim pitchCap
dim eye
dim dist
dim slRange
dim lCap
dim slIntensity
dim lDefZ
dim ceilStd
dim surfStep
dim surfSeg
dim actorH

Constructor()
    self.mvSpeed = RcConfig.RC_MOVE_SPEED
    self.tnSpeed = RcConfig.RC_TURN_SPEED
    self.lkSpeed = RcConfig.RC_LOOK_SPEED
    self.grav = RcConfig.RC_GRAVITY
    self.jump = RcConfig.RC_JUMP_VEL
    self.stepUpH = RcConfig.RC_STEP_UP
    self.maxDt = RcConfig.RC_MAX_STEP_DT
    self.pitchCap = RcConfig.RC_MAX_PITCH
    self.eye = RcConfig.RC_EYE_Z
    self.dist = RcConfig.RC_MAX_DIST
    self.slRange = RcConfig.RC_LIGHT_RANGE
    self.lCap = RcConfig.RC_LIGHT_CAP
    self.slIntensity = RcConfig.RC_STATIC_INTENSITY
    self.lDefZ = RcConfig.RC_LIGHT_DEFAULT_Z
    self.ceilStd = RcConfig.RC_STD_CEIL
    self.surfStep = RcConfig.RC_SURF_LIGHT_STEP
    self.surfSeg = RcConfig.RC_SURF_SEG_MAX
    self.actorH = RcConfig.RC_ACTOR_HEIGHT
EndConstructor

function moveSpeed()
    return self.mvSpeed
endfunction
function setMoveSpeed(v)
    self.mvSpeed = v
endfunction

function turnSpeed()
    return self.tnSpeed
endfunction
function setTurnSpeed(v)
    self.tnSpeed = v
endfunction

function lookSpeed()
    return self.lkSpeed
endfunction
function setLookSpeed(v)
    self.lkSpeed = v
endfunction

function gravity()
    return self.grav
endfunction
function setGravity(v)
    self.grav = v
endfunction

function jumpVel()
    return self.jump
endfunction
function setJumpVel(v)
    self.jump = v
endfunction

function stepUp()
    return self.stepUpH
endfunction
function setStepUp(v)
    self.stepUpH = v
endfunction

function maxStepDt()
    return self.maxDt
endfunction
function setMaxStepDt(v)
    self.maxDt = v
endfunction

function maxPitch()
    return self.pitchCap
endfunction
function setMaxPitch(v)
    self.pitchCap = v
endfunction

function eyeZ()
    return self.eye
endfunction
function setEyeZ(v)
    self.eye = v
endfunction

function maxDist()
    return self.dist
endfunction
function setMaxDist(v)
    self.dist = v
endfunction

function staticLightRange()
    return self.slRange
endfunction
function setStaticLightRange(v)
    self.slRange = v
endfunction

function lightCap()
    return self.lCap
endfunction
function setLightCap(v)
    self.lCap = v
endfunction

function staticLightIntensity()
    return self.slIntensity
endfunction
function setStaticLightIntensity(v)
    self.slIntensity = v
endfunction

function lightDefaultZ()
    return self.lDefZ
endfunction
function setLightDefaultZ(v)
    self.lDefZ = v
endfunction

function stdCeil()
    return self.ceilStd
endfunction
function setStdCeil(v)
    self.ceilStd = v
endfunction

function surfLightStep()
    return self.surfStep
endfunction
function setSurfLightStep(v)
    self.surfStep = v
endfunction

function surfSegMax()
    return self.surfSeg
endfunction
function setSurfSegMax(v)
    self.surfSeg = v
endfunction

function actorHeight()
    return self.actorH
endfunction
function setActorHeight(v)
    self.actorH = v
endfunction

EndClass
