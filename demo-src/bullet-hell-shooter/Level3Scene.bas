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
  gamedata.setLevelTime(2, 0)

  dim tm as tilemapset
  tm = new tilemapset("map3.stm")
  world.add(tm)
  self.tilemapset = tm

  collision.setupTileCollision(tm)

  pathfinding.setup(tm, self.wallLayers())

  dim p as player
  p = new Player(64, 64)
  world.add(p)
  self.player = p

  dim empty(0)
  self.mobs = empty

  self.spawnPoints = levelhelpers.spawnPointsFromMarkers(tm, "spawn", 3, self.mobs, p)
  self.pickups = levelhelpers.pickupsFromMarkers(tm, "pickup")

  p.setLevel(tm, self.spawnPoints, self.mobs)

  camera.setZoom(2)
  camera.follow(p, 0.1)

  self.setupHud()

  ' Added after every other world.add() call above so particle bursts render
  ' on top of the tilemap, player, and mobs — PIXI draws worldContainer's
  ' children in insertion order (no zIndex is set anywhere), so anything
  ' added earlier renders underneath what's added later.
  particles.setup()
endfunction

function wallLayers()
  dim layers(0)
  array.push(layers, "collision")
  return layers
endfunction

function setupHud()
  ' healthbar_bg.png/healthbar_fill.png are 1x1 pixel images stretched via
  ' setScale into a bar shape. `sprite` is centre-anchored, so each bar's
  ' setPosition must be its CENTRE, not its top-left corner: a 100x14 bar
  ' whose top-left should sit at (20, 20) is centred at (20 + 100/2, 20 + 14/2).
  dim bg as sprite
  bg = new sprite("healthbar_bg.png")
  bg.transform.setPosition(70, 27)
  bg.setScale(100, 14)
  hud.add(bg)
  self.hpBg = bg

  dim fill as sprite
  fill = new sprite("healthbar_fill.png")
  fill.transform.setPosition(70, 27)
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
  t = gamedata.getLevelTime(2) + dt
  gamedata.setLevelTime(2, t)

  ' Re-centre the fill bar as it shrinks so its LEFT edge stays pinned at
  ' x=20 (draining right-to-left) instead of shrinking symmetrically about
  ' the bar's centre, which is what a naive setScale-only shrink would do
  ' now that `sprite` is centre-anchored.
  dim hpFillWidth
  hpFillWidth = 100 * (self.player.getHp() / 100)
  self.hpFill.transform.setPosition(20 + hpFillWidth / 2, 27)
  self.hpFill.setScale(hpFillWidth, 14)
  self.weaponLabel.setText(self.player.getCurrentWeapon())
  self.spawnLabel.setText("Spawns: " + string.str(levelhelpers.spawnPointsRemaining(self.spawnPoints)))
  self.timerLabel.setText(levelhelpers.formatTime(t))

  levelhelpers.checkPickupCollisions(self.player, self.pickups)

  if not self.cleared then
    if levelhelpers.allSpawnPointsDestroyed(self.spawnPoints) then
      self.cleared = true
    endif
  else
    self.clearTimer = self.clearTimer + dt
    if self.clearTimer >= 2 then
      scenemanager.switch("winscene")
    endif
  endif

  if self.player.getHp() <= 0 then
    scenemanager.switch("gameover")
  endif
endfunction

EndClass
