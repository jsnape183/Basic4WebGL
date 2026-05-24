function setPosition(obj, x, y)
  call("_SoftBasicGfx.getInstance().setPosition(setposition_obj, setposition_x, setposition_y)")
endfunction

function getPositionX(obj)
  return call("_SoftBasicGfx.getInstance().getPosition(getpositionx_obj).x")
endfunction

function getPositionY(obj)
  return call("_SoftBasicGfx.getInstance().getPosition(getpositiony_obj).y")
endfunction

function setAngle(obj, angle)
  call("_SoftBasicGfx.getInstance().setAngle(setangle_obj, setangle_angle);")
endfunction
