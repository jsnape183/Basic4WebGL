' Start of PIXI drawing functions
function drawLine(x,y,x2,y2)
  return call("_sb.drawLine(x,y,x2,y2)")
endfunction

function drawRect(x,y,width,height)
  return call("_sb.drawRect(x,y,width,height);")
endfunction

function drawCircle(x,y,radius)
  return call("_sb.drawCircle(x, y, radius);")
endfunction
' End of PIXI drawing functions
