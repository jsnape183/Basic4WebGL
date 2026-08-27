' demo-src/raycaster/MazeGrid.bas
'
' A plain module (no Class) -- both GameScene and Enemy depend on this
' for grid state and wall lookups, rather than each keeping their own
' copy. generate() builds a "perfect maze" (a randomized recursive
' backtracker): exactly one path between any two open cells, fully
' connected, so every spawn point chosen from an open cell is guaranteed
' reachable from every other.
dim mapW = 33
dim mapH = 33
dim cells(1089)

function getCell(mx, my)
  if mx < 0 or mx >= mapW or my < 0 or my >= mapH then
    return 1
  endif
  return cells(my * mapW + mx)
endfunction

function setCell(mx, my, value)
  cells(my * mapW + mx) = value
endfunction

function isOpen(mx, my)
  return getCell(mx, my) = 0
endfunction

function generate()
  dim i
  dim cx
  dim cy
  dim nx
  dim ny
  dim stackX(256)
  dim stackY(256)
  dim stackTop
  dim dirs(4)
  dim dirCount
  dim d

  for i = 0 to (mapW * mapH) - 1
    cells(i) = 1
  next i

  cx = 1
  cy = 1
  setCell(cx, cy, 0)
  stackTop = 0
  stackX(stackTop) = cx
  stackY(stackTop) = cy

  while stackTop >= 0
    cx = stackX(stackTop)
    cy = stackY(stackTop)

    dirCount = 0
    if cy - 2 > 0 then
      if getCell(cx, cy - 2) = 1 then
        dirs(dirCount) = 0
        dirCount = dirCount + 1
      endif
    endif
    if cy + 2 < mapH - 1 then
      if getCell(cx, cy + 2) = 1 then
        dirs(dirCount) = 1
        dirCount = dirCount + 1
      endif
    endif
    if cx - 2 > 0 then
      if getCell(cx - 2, cy) = 1 then
        dirs(dirCount) = 2
        dirCount = dirCount + 1
      endif
    endif
    if cx + 2 < mapW - 1 then
      if getCell(cx + 2, cy) = 1 then
        dirs(dirCount) = 3
        dirCount = dirCount + 1
      endif
    endif

    if dirCount = 0 then
      stackTop = stackTop - 1
    else
      d = dirs(math.randomint(dirCount))
      if d = 0 then
        ny = cy - 2
        nx = cx
        setCell(cx, cy - 1, 0)
        setCell(nx, ny, 0)
      endif
      if d = 1 then
        ny = cy + 2
        nx = cx
        setCell(cx, cy + 1, 0)
        setCell(nx, ny, 0)
      endif
      if d = 2 then
        nx = cx - 2
        ny = cy
        setCell(cx - 1, cy, 0)
        setCell(nx, ny, 0)
      endif
      if d = 3 then
        nx = cx + 2
        ny = cy
        setCell(cx + 1, cy, 0)
        setCell(nx, ny, 0)
      endif
      stackTop = stackTop + 1
      stackX(stackTop) = nx
      stackY(stackTop) = ny
    endif
  endwhile
endfunction

function randomOpenCell()
  ' Returns a 2-element array [x, y] of a random OPEN cell. Only ever
  ' samples odd (logical-cell) coordinates, since those are exactly the
  ' cells generate() guarantees are open and connected -- the even
  ' "wall" coordinates between them are open only where a corridor was
  ' carved through, not guaranteed open everywhere.
  dim result(2)
  dim x
  dim y
  x = 1 + math.randomint((mapW - 2) / 2) * 2
  y = 1 + math.randomint((mapH - 2) / 2) * 2
  while getCell(x, y) <> 0
    x = 1 + math.randomint((mapW - 2) / 2) * 2
    y = 1 + math.randomint((mapH - 2) / 2) * 2
  endwhile
  result(0) = x
  result(1) = y
  return result
endfunction
