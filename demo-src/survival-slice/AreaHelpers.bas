' demo-src/survival-slice/AreaHelpers.bas
'
' Shared scene-build helpers, used as a module (`areahelpers.spawnAtEntry(...)`).
' A plain module (no Class wrapper). Single-level Extends means the three scene
' classes can't share a base class, so the parts they have in common live here.
'
' Marker conventions (see the plan doc):
'   entry:<name> face:<n|e|s|w>   -- a named spawn point + facing
'   door:<scene>:<entry> [label:<Text_with_underscores>]
'                                -- a doorway cell; Interact in reach -> switch
'
' A cell centre in world coords is (col + 0.5, row + 0.5).

' --- facing letter -> angle in radians -------------------------------------
' Engine convention: 0 = +x (east), pi/2 = +y (south / increasing row),
' pi = west, 3*pi/2 = north.
function faceAngle(dir)
  if dir = "e" then
    return 0.0
  endif
  if dir = "s" then
    return math.pi() / 2.0
  endif
  if dir = "w" then
    return math.pi()
  endif
  if dir = "n" then
    return math.pi() * 1.5
  endif
  return 0.0
endfunction

' --- token extraction ------------------------------------------------------
' Return the value part of the first `key:value` token in tagStr, or "" .
function tagValue(tagStr, key)
  dim tokens
  dim ti
  dim tok
  dim ci
  dim k
  tokens = string.split(string.trim(tagStr), " ")
  for ti = 0 to array.arrLength(tokens) - 1
    tok = tokens(ti)
    ci = string.indexof(tok, ":")
    if ci >= 0 then
      k = string.substr(tok, 0, ci)
      if k = key then
        return string.substr(tok, ci + 1, string.len(tok))
      endif
    endif
  next ti
  return ""
endfunction

' --- door tag parsing ----------------------------------------------------
' `door:<scene>:<entry>` -- doorScene() returns <scene>, doorEntry() <entry>.
function doorScene(tagStr)
  dim v
  dim ci
  v = tagValue(tagStr, "door")
  ci = string.indexof(v, ":")
  if ci < 0 then
    return v
  endif
  return string.substr(v, 0, ci)
endfunction

function doorEntry(tagStr)
  dim v
  dim ci
  v = tagValue(tagStr, "door")
  ci = string.indexof(v, ":")
  if ci < 0 then
    return ""
  endif
  return string.substr(v, ci + 1, string.len(v))
endfunction

function doorPrompt(tagStr)
  dim raw
  raw = tagValue(tagStr, "label")
  if string.len(raw) = 0 then
    return "Use door  [E]"
  endif
  return string.replace(raw, "_", " ") + "  [E]"
endfunction

' --- spawn the mover at the wanted entry --------------------------------
' Looks for an `entry:` marker whose `entry:` value = wantName. Falls back to
' `entry:start`, then to cell (1.5, 1.5). Sets position AND facing.
function spawnAtEntry(mover as RcMover, tm as tilemapset, wantName)
  dim markers
  dim mi
  dim mk as Marker
  dim name
  dim foundX
  dim foundY
  dim foundAngle
  dim haveWanted
  dim haveStart
  dim startX
  dim startY
  dim startAngle

  foundX = 1.5
  foundY = 1.5
  foundAngle = 0.0
  haveWanted = 0
  haveStart = 0
  startX = 1.5
  startY = 1.5
  startAngle = 0.0

  markers = tm.markersByTag("entry")
  for mi = 0 to array.arrLength(markers) - 1
    mk = markers(mi)
    name = tagValue(mk.tag, "entry")
    if name = "start" then
      haveStart = 1
      startX = mk.col + 0.5
      startY = mk.row + 0.5
      startAngle = faceAngle(tagValue(mk.tag, "face"))
    endif
    if name = wantName then
      haveWanted = 1
      foundX = mk.col + 0.5
      foundY = mk.row + 0.5
      foundAngle = faceAngle(tagValue(mk.tag, "face"))
    endif
  next mi

  if haveWanted = 0 then
    if haveStart = 1 then
      foundX = startX
      foundY = startY
      foundAngle = startAngle
    endif
  endif

  mover.warpTo(foundX, foundY, foundAngle)
endfunction

' --- find the nearest door marker within `reach` cells of (px, py) ------
' Returns the Marker, or 0 if none in reach. Straight-line distance -- fine
' for a doorway you're standing next to.
function findDoorInReach(tm as tilemapset, px, py, reach)
  dim markers
  dim mi
  dim mk as Marker
  dim cx
  dim cy
  dim d
  dim best as Marker
  dim bestD
  dim haveBest

  haveBest = 0
  bestD = 0.0
  markers = tm.markersByTag("door")
  for mi = 0 to array.arrLength(markers) - 1
    mk = markers(mi)
    cx = mk.col + 0.5
    cy = mk.row + 0.5
    d = math.sqrt((cx - px) * (cx - px) + (cy - py) * (cy - py))
    if d <= reach then
      if haveBest = 0 then
        haveBest = 1
        best = mk
        bestD = d
      else
        if d < bestD then
          best = mk
          bestD = d
        endif
      endif
    endif
  next mi

  if haveBest = 0 then
    return 0
  endif
  return best
endfunction
