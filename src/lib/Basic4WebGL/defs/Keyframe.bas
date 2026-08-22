Class
dim time
dim angle
dim scaleX
dim scaleY
dim alpha
dim x
dim y

Constructor()
  self.time = 0
  self.angle = 0
  self.scaleX = 1
  self.scaleY = 1
  self.alpha = 1
  self.x = 0
  self.y = 0
EndConstructor

function setTime(t)
  self.time = t
endfunction

function setAngle(a)
  self.angle = a
endfunction

function setScaleX(sx)
  self.scaleX = sx
endfunction

function setScaleY(sy)
  self.scaleY = sy
endfunction

function setAlpha(al)
  self.alpha = al
endfunction

function setPosition(px, py)
  self.x = px
  self.y = py
endfunction

EndClass
