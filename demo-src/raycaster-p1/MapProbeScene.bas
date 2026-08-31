Class
Extends scene

dim tm as tilemapset
dim wld as RcWorld
dim titleText as Text
dim l1 as Text
dim l2 as Text
dim l3 as Text
dim l4 as Text

Constructor()
EndConstructor

function onenter()
  world.setBackground(12, 12, 18)

  self.tm = new tilemapset("p1testmap.stm")
  self.wld = new RcWorld(self.tm, "walls")

  self.titleText = new Text("Raycaster P1 - map probe", 24, 20)
  self.titleText.setStyle(20, 255, 220, 120)
  hud.add(self.titleText)

  dim okSize
  okSize = "FAIL"
  if self.wld.widthCells() = 5 then
    if self.wld.heightCells() = 4 then
      okSize = "OK"
    endif
  endif
  self.l1 = new Text("size 5x4: " + okSize + " (" + string.str(self.wld.widthCells()) + "x" + string.str(self.wld.heightCells()) + ")", 24, 52)
  self.l1.setStyle(15, 255, 255, 255)
  hud.add(self.l1)

  dim okBorder
  okBorder = "FAIL"
  if self.wld.wallAt(0, 0) > 0 then
    if self.wld.wallAt(1, 1) = 0 then
      okBorder = "OK"
    endif
  endif
  self.l2 = new Text("wall border: " + okBorder, 24, 74)
  self.l2.setStyle(15, 255, 255, 255)
  hud.add(self.l2)

  dim okFloor
  okFloor = "FAIL"
  if self.wld.floorHeightAt(1, 1) = 2 then
    if self.wld.floorHeightAt(2, 2) = -3 then
      okFloor = "OK"
    endif
  endif
  self.l3 = new Text("floor tags (2 / -3): " + okFloor, 24, 96)
  self.l3.setStyle(15, 255, 255, 255)
  hud.add(self.l3)

  dim okMisc
  okMisc = "FAIL"
  if self.wld.hasUpperAt(2, 1) = 1 then
    if self.wld.flagsAt(3, 2) = 1 then
      if self.wld.flagsAt(3, 1) = 8 then
        okMisc = "OK"
      endif
    endif
  endif
  self.l4 = new Text("upper / door / sky: " + okMisc, 24, 118)
  self.l4.setStyle(15, 255, 255, 255)
  hud.add(self.l4)

  self.drawGrid()
endfunction

function drawGrid()
  dim col
  dim row
  dim ox
  dim oy
  dim s
  ox = 24
  oy = 150
  s = 30
  for row = 0 to self.wld.heightCells() - 1
    for col = 0 to self.wld.widthCells() - 1
      if self.wld.wallAt(col, row) > 0 then
        pen.setFillColor(90, 100, 140)
      else
        pen.setFillColor(30, 34, 44)
      endif
      pen.setLineWidth(1)
      pen.setLineColor(0, 0, 0)
      drawing.drawRect(ox + col * s + s / 2, oy + row * s + s / 2, s - 2, s - 2)
    next col
  next row
endfunction

EndClass
