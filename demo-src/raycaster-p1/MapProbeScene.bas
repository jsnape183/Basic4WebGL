Class
Extends scene

dim tm as tilemapset
dim wld as RcWorld
dim titleText as Text

Constructor()
EndConstructor

function onenter()
  dim okSize
  dim okBorder
  dim okFloor
  dim okMisc

  world.setBackground(12, 12, 18)

  self.tm = new tilemapset("p1testmap.stm")
  self.wld = new RcWorld(self.tm, "walls")

  self.titleText = new Text("Raycaster P1 - map probe", 24, 20)
  self.titleText.setStyle(20, 255, 220, 120)
  hud.add(self.titleText)

  okSize = 0
  if self.wld.widthCells() = 5 and self.wld.heightCells() = 4 then
    okSize = 1
  endif
  self.probe("size 5x4", okSize, 52)

  okBorder = 0
  if self.wld.wallAt(0, 0) > 0 and self.wld.wallAt(1, 1) = 0 then
    okBorder = 1
  endif
  self.probe("wall border", okBorder, 74)

  okFloor = 0
  if self.wld.floorHeightAt(1, 1) = 2 and self.wld.floorHeightAt(2, 2) = -3 then
    okFloor = 1
  endif
  self.probe("floor tags", okFloor, 96)

  okMisc = 0
  if self.wld.hasUpperAt(2, 1) = 1 and self.wld.upperKindAt(2, 1) = 1 and self.wld.flagsAt(3, 2) = 1 and self.wld.flagsAt(3, 1) = 8 then
    okMisc = 1
  endif
  self.probe("upper/door/sky", okMisc, 118)

  self.drawGrid()
endfunction

function probe(label, passed, y)
  dim result
  dim t as Text
  dim missing
  dim boom

  result = "OK"
  if passed = 0 then
    result = "FAIL"
  endif

  t = new Text(label + ": " + result, 24, y)
  t.setStyle(15, 255, 255, 255)
  hud.add(t)

  if passed = 0 then
    ' Force a runtime error so the Cypress "no ERR" assertion catches a failed
    ' probe -- canvas text is invisible to that test. array.arrLength reads the
    ' .length of `missing` (unassigned / undefined), which throws a caught
    ' runtimeError that surfaces as ERR in the console panel.
    boom = array.arrLength(missing)
  endif
endfunction

function drawGrid()
  dim col
  dim row
  dim ox
  dim oy
  dim s
  drawing.clear()
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
