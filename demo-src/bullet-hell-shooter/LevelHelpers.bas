' demo-src/bullet-hell-shooter/LevelHelpers.bas
function spawnPointsFromMarkers(tileMapSet as tilemapset, tag, spawnInterval, mobs, chaseTarget)
  dim markers
  markers = tileMapSet.markersByTag(tag)
  dim result(0)
  dim i
  dim m as Marker
  dim sp as spawnpoint
  for i = 0 to array.arrLength(markers) - 1
    m = markers(i)
    sp = new SpawnPoint(m.x, m.y, spawnInterval, mobs, chaseTarget)
    world.add(sp)
    array.push(result, sp)
  next i
  return result
endfunction

function pickupsFromMarkers(tileMapSet as tilemapset, tag)
  dim markers
  markers = tileMapSet.markersByTag(tag)
  dim result(0)
  dim i
  dim m as Marker
  dim p as weaponpickup
  for i = 0 to array.arrLength(markers) - 1
    m = markers(i)
    p = new WeaponPickup(m.x, m.y)
    world.add(p)
    array.push(result, p)
  next i
  return result
endfunction

function allSpawnPointsDestroyed(spawnPoints() as spawnpoint)
  dim i
  for i = 0 to array.arrLength(spawnPoints) - 1
    if not spawnPoints(i).destroyed then
      return false
    endif
  next i
  return true
endfunction

function checkPickupCollisions(player as player, pickups() as weaponpickup)
  dim i
  dim weaponType
  for i = 0 to array.arrLength(pickups) - 1
    if not pickups(i).collected then
      if collision.spriteCollide(player, pickups(i)) then
        weaponType = pickups(i).collect()
        player.currentWeapon = weaponType
      endif
    endif
  next i
endfunction

function spawnPointsRemaining(spawnPoints() as spawnpoint)
  dim i
  dim count
  count = 0
  for i = 0 to array.arrLength(spawnPoints) - 1
    if not spawnPoints(i).destroyed then
      count = count + 1
    endif
  next i
  return count
endfunction

function formatTime(totalSeconds)
  dim minutes
  dim secs
  dim minStr
  dim secStr
  minutes = math.floor(totalSeconds / 60)
  secs = math.floor(totalSeconds - minutes * 60)
  minStr = string.padstart(string.str(minutes), 2, "0")
  secStr = string.padstart(string.str(secs), 2, "0")
  return minStr + ":" + secStr
endfunction
