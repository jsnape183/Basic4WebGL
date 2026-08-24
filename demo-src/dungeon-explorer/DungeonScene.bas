Class
Extends scene

dim tilemapset as tilemapset
dim player as player
dim enemies
dim keyPickup as keypickup
dim boss as boss
dim lastRoomX
dim lastRoomY
dim heart1 as sprite
dim heart2 as sprite
dim heart3 as sprite

Constructor()
EndConstructor

function onenter()
  dim tm as tilemapset
  tm = new tilemapset("dungeon.stm")
  world.add(tm)
  self.tilemapset = tm

  collision.setupTileCollision(tm)
  pathfinding.setup(tm, self.wallLayers())
  camera.setZoom(2)

  dim p as player
  p = new Player(40, 40)
  world.add(p)
  self.player = p

  dim sw as sword
  sw = new Sword()
  world.add(sw)
  p.setSword(sw)

  self.enemies = levelhelpers.enemiesFromMarkers(tm, "enemy", p)
  p.setEnemies(self.enemies)

  dim keyMarkers
  keyMarkers = tm.markersByTag("key")
  dim km as Marker
  km = keyMarkers(0)
  dim k as keypickup
  k = new KeyPickup(km.x, km.y)
  world.add(k)
  self.keyPickup = k

  dim bossMarkers
  bossMarkers = tm.markersByTag("boss")
  dim bm as Marker
  bm = bossMarkers(0)
  dim b as boss
  b = new Boss(bm.x, bm.y, p)
  world.add(b)
  self.boss = b
  p.setBoss(b)

  self.lastRoomX = -1
  self.lastRoomY = -1

  self.setupHud()
endfunction

function openBossDoor()
  ' Swaps the boss room's closed-door pair (tile ids 47/48 on the "floor"
  ' layer, at row 11, cols 36-37) for their open counterparts (23/24) the
  ' instant the key is collected, and clears their collision so the player
  ' can actually walk through. Runs once here, at the moment of pickup,
  ' rather than every frame from Player.onupdate() -- setTile removes and
  ' recreates a PIXI sprite each call, which would be wasteful (and pointless,
  ' since the result is identical) to repeat 60 times a second for the rest
  ' of the level.
  dim floorLayer as TileMapLayer
  floorLayer = self.tilemapset.layer("floor")
  floorLayer.setTile(576, 176, 23)
  floorLayer.setTile(592, 176, 24)
  collision.setTileSolid(576, 176, false)
  collision.setTileSolid(592, 176, false)
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "collision")
  return layers
endfunction

function setupHud()
  dim h1 as sprite
  h1 = new sprite("heart_full.png")
  h1.transform.setPosition(20, 20)
  hud.add(h1)
  self.heart1 = h1

  dim h2 as sprite
  h2 = new sprite("heart_full.png")
  h2.transform.setPosition(40, 20)
  hud.add(h2)
  self.heart2 = h2

  dim h3 as sprite
  h3 = new sprite("heart_full.png")
  h3.transform.setPosition(60, 20)
  hud.add(h3)
  self.heart3 = h3
endfunction

function updateHud()
  dim hearts
  hearts = self.player.getHearts()

  if hearts >= 1 then
    self.heart1.setTexture("heart_full.png")
  else
    self.heart1.setTexture("heart_empty.png")
  endif

  if hearts >= 2 then
    self.heart2.setTexture("heart_full.png")
  else
    self.heart2.setTexture("heart_empty.png")
  endif

  if hearts >= 3 then
    self.heart3.setTexture("heart_full.png")
  else
    self.heart3.setTexture("heart_empty.png")
  endif
endfunction

function onupdate(delta)
  dim roomX
  dim roomY

  self.updateHud()

  if not self.keyPickup.collected then
    if collision.spriteCollide(self.player, self.keyPickup) then
      self.keyPickup.collect()
      self.player.setHasKey(true)
      self.openBossDoor()
    endif
  endif

  roomX = math.floor(self.player.transform.x() / 240)
  roomY = math.floor(self.player.transform.y() / 176)

  if roomX <> self.lastRoomX or roomY <> self.lastRoomY then
    self.lastRoomX = roomX
    self.lastRoomY = roomY
    camera.setPosition(roomX * 240, roomY * 176)
  endif
endfunction

EndClass
