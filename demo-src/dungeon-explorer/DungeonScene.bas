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
dim bossDefeated
dim winTimer

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
  self.bossDefeated = false
  self.winTimer = 0

  self.setupHud()
  particles.setup()
endfunction

function openBossDoor()
  ' Swaps the boss room's closed-door pair (tile ids 47/48 on the "walls"
  ' layer, at row 11, cols 36-37) for their open counterparts (23/24) the
  ' instant the key is collected, and clears their collision so the player
  ' can actually walk through. Runs once here, at the moment of pickup,
  ' rather than every frame from Player.onupdate() -- setTile removes and
  ' recreates a PIXI sprite each call, which would be wasteful (and pointless,
  ' since the result is identical) to repeat 60 times a second for the rest
  ' of the level.
  '
  ' The door tiles live on "walls", not "floor" -- an earlier version painted
  ' them on "floor" with a solid wall tile left in place on "walls" right on
  ' top of them, which rendered fine in the Tile Map Editor (a non-active
  ' layer draws at 35% opacity there, so the door art showed faintly through)
  ' but was fully hidden in the actual game, where every layer draws at full
  ' opacity in file order and "walls" draws over "floor". Moving the door
  ' tiles onto "walls" itself removes the overlap instead of working around
  ' it.
  dim wallsLayer as TileMapLayer
  wallsLayer = self.tilemapset.layer("walls")
  wallsLayer.setTile(576, 176, 23)
  wallsLayer.setTile(592, 176, 24)
  collision.setTileSolid(576, 176, false)
  collision.setTileSolid(592, 176, false)
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "collision")
  return layers
endfunction

function setupHud()
  ' heart_full.png/heart_empty.png are 16x16. `sprite` is centre-anchored,
  ' so each heart's setPosition must be its CENTRE (top-left + 8, 8) to keep
  ' the row sitting at the same on-screen spot as before.
  dim h1 as sprite
  h1 = new sprite("heart_full.png")
  h1.transform.setPosition(28, 28)
  hud.add(h1)
  self.heart1 = h1

  dim h2 as sprite
  h2 = new sprite("heart_full.png")
  h2.transform.setPosition(48, 28)
  hud.add(h2)
  self.heart2 = h2

  dim h3 as sprite
  h3 = new sprite("heart_full.png")
  h3.transform.setPosition(68, 28)
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

  ' Boss.hit() bursts the death particles and removes the boss from the
  ' world the instant hp hits 0, but no longer switches scenes itself --
  ' switching this same frame would clear the world (see stage.js's
  ' clear()) before that burst ever renders a single frame, the same
  ' "particle destroyed before it renders" gotcha Coins Platformer's
  ' burstLevelComplete/finishTimer already went through. Waiting here
  ' instead, the same way, gives the burst time to actually show.
  '
  ' self.boss.isDead() -- a getter -- not a bare self.boss.dead field read.
  ' Member-field type inference through a class-typed field (self.boss is
  ' `dim boss as boss`) doesn't resolve to the field's real type, so a
  ' strict type check on that read (a plain `if` condition, or an `and`)
  ' rejects it as "Expected type(s) Boolean... but got Object" -- confirmed
  ' live. Every existing self.boss.dead read elsewhere in this demo (e.g.
  ' Player.checkSwingHits) happens to sit under a bare `not`, which has no
  ' type check at all, so this gap stayed silent until this scene's own
  ' boss-death handling needed a real conditional. See Boss.isDead()'s own
  ' comment for why the method call resolves correctly where the field
  ' access doesn't.
  if not self.bossDefeated then
    if self.boss.isDead() then
      self.bossDefeated = true
    endif
  endif
  if self.bossDefeated then
    self.winTimer = self.winTimer + delta / 1000
    if self.winTimer >= 0.6 then
      scenemanager.switch("winscene")
    endif
  endif
endfunction

EndClass
