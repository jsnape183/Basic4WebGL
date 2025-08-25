export default `
function setPosition(obj, x, y)
  call("_sb.setPosition(setposition_obj, setposition_x, setposition_y)")
endfunction

function getPositionX(obj)
  return call("_sb.getPosition(getpositionx_obj).x")
endfunction

function getPositionY(obj)
  return call("_sb.getPosition(getpositiony_obj).y")
endfunction

function setAngle(obj, angle)
  call("_sb.setAngle(obj, angle);")
endfunction
`;
