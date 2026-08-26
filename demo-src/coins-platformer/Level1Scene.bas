Class extends scene

dim tilemap
dim player
dim enemies(0)
dim coins(0)
dim coinCounter
dim game
dim finished
dim finishTimer

Constructor(gameData)
  self.game = gameData
EndConstructor

function onenter()
  self.finished = false
  self.finishTimer = 0

  self.tilemap = levelhelpers.beginLevel("level1.stm")
  self.player = levelhelpers.spawnPlayer(16, 52)

  dim e as enemy
  e = new Enemy(150, 48, 130, 190)
  array.push(self.enemies, e)

  self.spawnCoins()

  self.coinCounter = levelhelpers.spawnCoinCounter(self.game)

  ' Added after every other world.add() call above so particle bursts render
  ' on top of the tilemap, player, enemies, and coins (see Bullet Hell
  ' Shooter's Particles.bas for why this ordering matters).
  particles.setup()
endfunction

function spawnCoins()
  dim c as coin
  c = new Coin(40, 48)
  array.push(self.coins, c)
  c = new Coin(80, 48)
  array.push(self.coins, c)
  c = new Coin(110, 48)
  array.push(self.coins, c)
  c = new Coin(136, 48)
  array.push(self.coins, c)
  c = new Coin(184, 32)
  array.push(self.coins, c)
  c = new Coin(220, 48)
  array.push(self.coins, c)
  c = new Coin(300, 48)
  array.push(self.coins, c)
endfunction

function onupdate(delta)
  camera.follow(self.player, 0.1)

  levelhelpers.resetOnEnemyCollision(self.player, self.enemies)
  levelhelpers.applyDeadzone(self.player, self.tilemap)
  levelhelpers.collectCoins(self.coins, self.player, self.game, self.coinCounter)

  if not self.finished then
    if levelhelpers.reachedLevelEnd(self.player, self.tilemap) then
      self.finished = true
      particles.burstLevelComplete(self.player.transform.x(), self.player.transform.y())
    endif
  else
    self.finishTimer = self.finishTimer + delta / 1000
    if self.finishTimer >= 0.6 then
      scenemanager.switch("level2")
    endif
  endif
endfunction

EndClass
