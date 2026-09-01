Class
Extends scene

dim tm as tilemapset
dim wld as RcWorld
dim rc as RcCast
dim titleText as Text

Constructor()
EndConstructor

function onenter()
  dim eastOk
  dim westOk
  dim losOk
  dim losEast
  dim losWest

  world.setBackground(10, 12, 16)

  self.tm = new tilemapset("p2map.stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.rc = new RcCast()

  self.titleText = new Text("Raycaster P2 - span cast", 24, 20)
  self.titleText.setStyle(20, 255, 220, 120)
  hud.add(self.titleText)

  self.rc.cast(self.wld, 1.5, 1.5, 1, 0)

  eastOk = 0
  if self.rc.spanCount() = 5 then
    if self.rc.spanKind(0) = RcConfig.RC_SPAN_FLOORSTEP then
      if self.rc.spanKind(4) = RcConfig.RC_SPAN_WALL then
        if math.abs(self.rc.spanDist(4) - 5.5) < 0.05 then
          if self.rc.spanLo(0) = 0 and self.rc.spanHi(0) = 2 then
            eastOk = 1
          endif
        endif
      endif
    endif
  endif
  self.probe("east ray: 5 spans, wall at ~5.5", eastOk, 52)

  self.rc.cast(self.wld, 1.5, 1.5, -1, 0)
  westOk = 0
  if self.rc.spanCount() = 1 then
    if self.rc.spanKind(0) = RcConfig.RC_SPAN_WALL then
      if math.abs(self.rc.spanDist(0) - 0.5) < 0.05 then
        westOk = 1
      endif
    endif
  endif
  self.probe("west ray: 1 wall at ~0.5", westOk, 74)

  losOk = 0
  losEast = self.rc.los(self.wld, 1.5, 1.5, 1, 0)
  losWest = self.rc.los(self.wld, 1.5, 1.5, -1, 0)
  if math.abs(losEast - 5.5) < 0.05 then
    if math.abs(losWest - 0.5) < 0.05 then
      losOk = 1
    endif
  endif
  self.probe("los east ~5.5 / west ~0.5", losOk, 96)

  self.drawTopDown()
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
  t.setStyle(14, 255, 255, 255)
  hud.add(t)
  if passed = 0 then
    ' Force a runtime error so the Cypress "no ERR" assertion catches a failed
    ' probe -- canvas text is invisible to that test. array.arrLength reads the
    ' .length of `missing` (unassigned / undefined), which throws a caught
    ' runtimeError that surfaces as ERR in the console panel.
    boom = array.arrLength(missing)
  endif
endfunction

function drawTopDown()
  dim col
  dim row
  dim ox
  dim oy
  dim s
  dim i
  dim n
  dim px
  dim py
  dim d
  dim mx
  drawing.clear()
  ox = 24
  oy = 140
  s = 34

  for row = 0 to self.wld.heightCells() - 1
    for col = 0 to self.wld.widthCells() - 1
      if self.wld.wallAt(col, row) > 0 then
        pen.setFillColor(70, 80, 110)
      else
        pen.setFillColor(24, 28, 38)
      endif
      pen.setLineWidth(1)
      pen.setLineColor(0, 0, 0)
      drawing.drawRect(ox + col * s + s / 2, oy + row * s + s / 2, s - 2, s - 2)
    next col
  next row

  self.rc.cast(self.wld, 1.5, 1.5, 1, 0)
  px = ox + 1.5 * s
  py = oy + 1.5 * s
  pen.setLineColor(255, 230, 120)
  pen.setLineWidth(2)
  drawing.drawLine(px, py, px + 7 * s, py)

  n = self.rc.spanCount()
  for i = 0 to n - 1
    d = self.rc.spanDist(i)
    mx = px + d * s
    if self.rc.spanKind(i) = RcConfig.RC_SPAN_WALL then
      pen.setFillColor(255, 90, 90)
    else
      if self.rc.spanKind(i) = RcConfig.RC_SPAN_FLOORSTEP then
        pen.setFillColor(90, 200, 120)
      else
        pen.setFillColor(120, 160, 255)
      endif
    endif
    pen.setLineWidth(0)
    drawing.drawCircle(mx, py, 5)
  next i
endfunction

EndClass
