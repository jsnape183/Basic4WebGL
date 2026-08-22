' demo-src/dungeon-explorer/LevelHelpers.bas
function enemiesFromMarkers(tileMapSet as tilemapset, tag, chaseTarget)
  dim markers
  markers = tileMapSet.markersByTag(tag)
  dim result(0)
  dim i
  dim m as Marker
  dim e as enemy
  for i = 0 to array.arrLength(markers) - 1
    m = markers(i)
    e = new Enemy(m.x, m.y, chaseTarget)
    world.add(e)
    array.push(result, e)
  next i
  return result
endfunction
