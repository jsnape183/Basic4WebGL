export default `

' Start of PIXI text function
function text(s, x, y)
  return call("_sb.text(s,x,y);")
endfunction

function setText(obj, text)
  call("_sb.setText(obj,text)")
endfunction 

' End of PIXI text functions

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

' Start of PIXI manipulation functions

function setFillColor(r,g,b)
  call("_sb.setFillColor(r,g,b);")
endfunction

function setLineColor(r,g,b)
  call("_sb.setLineColor(r,g,b);")
endfunction

function setAlpha(obj,a)
  call("_sb.setAlpha(obj, a);")
endfunction

function setPosition(obj, x, y)
  call("_sb.setPosition(obj, x, y)")
endfunction

function getPositionX(obj)
  return call("_sb.getPosition(obj).x")
endfunction

function getPositionY(obj)
  return call("_sb.getPosition(obj).y")
endfunction

function setAngle(obj, angle)
  call("_sb.setAngle(obj, angle);")
endfunction

function boxCollide(a,b)
  return call("_sb.boxCollide(a,b);")
endfunction

' End of PIXI manipulation functions

'Start of PIXI keyboard functions
function getKeyDown(keycode)
  return call("_sb.getKeyDown(keycode)")
endfunction`;
