Class
dim time
dim angle
dim scaleX
dim scaleY
dim alpha
dim x
dim y
dim hasAngle
dim hasScaleX
dim hasScaleY
dim hasAlpha
dim hasPosition

Constructor()
  self.time = 0
  self.angle = 0
  self.scaleX = 1
  self.scaleY = 1
  self.alpha = 1
  self.x = 0
  self.y = 0
  self.hasAngle = false
  self.hasScaleX = false
  self.hasScaleY = false
  self.hasAlpha = false
  self.hasPosition = false
EndConstructor

function setTime(t)
  self.time = t
endfunction

function setAngle(a)
  self.angle = a
  self.hasAngle = true
endfunction

function setScaleX(sx)
  self.scaleX = sx
  self.hasScaleX = true
endfunction

function setScaleY(sy)
  self.scaleY = sy
  self.hasScaleY = true
endfunction

function setAlpha(al)
  self.alpha = al
  self.hasAlpha = true
endfunction

function setPosition(px, py)
  self.x = px
  self.y = py
  self.hasPosition = true
endfunction

EndClass
