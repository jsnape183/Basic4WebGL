Class
Extends scene

dim tilemapset as tilemapset
dim player as player
dim spawnPoints
dim mobs
dim pickups
dim cleared
dim clearTimer
dim hpLabel as text
dim hpBg as sprite
dim hpFill as sprite
dim weaponLabel as text
dim spawnLabel as text
dim timerLabel as text

Constructor()
EndConstructor

function onenter()
  self.cleared = false
  self.clearTimer = 0
  gamedata.setLevelTime(0, 0)

  dim tm as tilemapset
  tm = new tilemapset("map1.stm")
  world.add(tm)
  self.tilemapset = tm

  pathfinding.setup(tm, self.wallLayers())

  dim p as player
  p = new Player(64, 64)
  world.add(p)
  self.player = p

  dim empty(0)
  self.mobs = empty

  self.spawnPoints = levelhelpers.spawnPointsFromMarkers(tm, "spawn", 6, self.mobs, p)
  self.pickups = levelhelpers.pickupsFromMarkers(tm, "pickup")

  p.setLevel(tm, self.spawnPoints, self.mobs)

  camera.follow(p, 0.1)

  self.setupHud()
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "walls")
  return layers
endfunction

function setupHud()
  dim bg as sprite
  bg = new sprite("healthbar_bg.png")
  bg.setPosition(20, 20)
  bg.setScale(100, 14)
  hud.add(bg)
  self.hpBg = bg

  dim fill as sprite
  fill = new sprite("healthbar_fill.png")
  fill.setPosition(20, 20)
  fill.setScale(100, 14)
  hud.add(fill)
  self.hpFill = fill

  dim hpl as text
  hpl = new text("HP", 20, 36)
  hpl.setStyle(12, 255, 255, 255)
  hud.add(hpl)
  self.hpLabel = hpl

  dim wl as text
  wl = new text("Pistol", 600, 20)
  wl.setStyle(14, 255, 255, 255)
  hud.add(wl)
  self.weaponLabel = wl

  dim sl as text
  sl = new text("Spawns: 0", 600, 40)
  sl.setStyle(14, 255, 255, 255)
  hud.add(sl)
  self.spawnLabel = sl

  dim tl as text
  tl = new text("00:00", 360, 20)
  tl.setStyle(16, 255, 255, 0)
  hud.add(tl)
  self.timerLabel = tl
endfunction

function onupdate(delta)
  dim dt
  dim t
  dt = delta / 1000
  t = gamedata.getLevelTime(0) + dt
  gamedata.setLevelTime(0, t)

  self.hpFill.setScale(100 * (self.player.getHp() / 100), 14)

  levelhelpers.checkPickupCollisions(self.player, self.pickups)

  if not self.cleared then
    if levelhelpers.allSpawnPointsDestroyed(self.spawnPoints) then
      self.cleared = true
    endif
  else
    self.clearTimer = self.clearTimer + dt
    if self.clearTimer >= 2 then
      scenemanager.switch("level2")
    endif
  endif

  if self.player.getHp() <= 0 then
    scenemanager.switch("gameover")
  endif
endfunction

EndClass
