' demo-src/survival-slice/Controls.bas
'
' The slice's control set, bound once and read by every scene. A plain module
' (no Class wrapper) -- it holds no state, only binds global input actions and
' reads them back. Keeps the three scene classes DRY: single-level Extends
' means they can't share a base class, so shared behaviour lives in modules.
'
' Actions:
'   fwd/back      W/S           left stick Y
'   strafeL/R     A/D           left stick X
'   turnL/R       arrows L/R    right stick X
'   lookU/lookD   arrows U/D    right stick Y   (pitch)
'   interact      E             controller A (edge-triggered via input.pressed)

function bindAll()
  input.bind("fwd", "key", keyboard.W)
  input.bind("fwd", "axis", controller.LSTICK_UP)
  input.bind("back", "key", keyboard.S)
  input.bind("back", "axis", controller.LSTICK_DOWN)
  input.bind("strafeL", "key", keyboard.A)
  input.bind("strafeL", "axis", controller.LSTICK_LEFT)
  input.bind("strafeR", "key", keyboard.D)
  input.bind("strafeR", "axis", controller.LSTICK_RIGHT)
  input.bind("turnL", "key", keyboard.LEFT)
  input.bind("turnL", "axis", controller.RSTICK_LEFT)
  input.bind("turnR", "key", keyboard.RIGHT)
  input.bind("turnR", "axis", controller.RSTICK_RIGHT)
  input.bind("lookU", "key", keyboard.UP)
  input.bind("lookU", "axis", controller.RSTICK_UP)
  input.bind("lookD", "key", keyboard.DOWN)
  input.bind("lookD", "axis", controller.RSTICK_DOWN)
  input.bind("interact", "key", keyboard.E)
  input.bind("interact", "button", controller.A)
endfunction

function readFwd()
  return input.axis("back", "fwd")
endfunction

function readStrafe()
  return input.axis("strafeL", "strafeR")
endfunction

function readTurn()
  return input.axis("turnL", "turnR")
endfunction

function readLook()
  return input.axis("lookD", "lookU")
endfunction

function interactPressed()
  return input.pressed("interact")
endfunction
