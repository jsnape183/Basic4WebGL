Class
' RcActor -- one billboard in a raycast scene (spec §8). Pure data: an image
' name, its source frame size in pixels (frameW x frameH -- one horizontal frame
' of the sprite strip), a world position (x, y) + feet height z, a frame index,
' an RGB tint (stored but NOT yet applied -- drawImageStrip has no tint
' parameter; see RcActors.bas header), and a visible flag. RcActors owns a fixed
' pool of these; the game never `new`s one directly.
'
' Never name anything here `world` / `math` / etc. (builtin-module shadow -> a
' clean transpile that ReferenceErrors at runtime).
dim img
dim fw
dim fh
dim ax
dim ay
dim az
dim frm
dim tr
dim tg
dim tb
dim vis

Constructor()
    self.img = ""
    self.fw = 1
    self.fh = 1
    self.ax = 0
    self.ay = 0
    self.az = 0
    self.frm = 0
    self.tr = 255
    self.tg = 255
    self.tb = 255
    self.vis = 0
EndConstructor

function reset(imageName, x, y, z, frameW, frameH)
    self.img = imageName
    self.fw = frameW
    self.fh = frameH
    self.ax = x
    self.ay = y
    self.az = z
    self.frm = 0
    self.tr = 255
    self.tg = 255
    self.tb = 255
    self.vis = 1
endfunction

function setPosition(x, y)
    self.ax = x
    self.ay = y
endfunction

function setHeight(z)
    self.az = z
endfunction

function setFrame(i)
    self.frm = i
endfunction

function setTint(r, g, b)
    self.tr = r
    self.tg = g
    self.tb = b
endfunction

function setVisible(v)
    self.vis = v
endfunction

function image()
    return self.img
endfunction

function frameW()
    return self.fw
endfunction

function frameH()
    return self.fh
endfunction

function x()
    return self.ax
endfunction

function y()
    return self.ay
endfunction

function z()
    return self.az
endfunction

function frame()
    return self.frm
endfunction

function visible()
    return self.vis
endfunction

function tintR()
    return self.tr
endfunction

function tintG()
    return self.tg
endfunction

function tintB()
    return self.tb
endfunction

' Straight-line distance from this actor to a world point.
function distanceTo(px, py)
    dim dx
    dim dy
    dx = self.ax - px
    dy = self.ay - py
    return math.sqrt(dx * dx + dy * dy)
endfunction

EndClass
