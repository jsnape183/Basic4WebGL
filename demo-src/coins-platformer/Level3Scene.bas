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

  self.tilemap = levelhelpers.beginLevel("level3.stm")
  self.player = levelhelpers.spawnPlayer(self.tilemap, 16, 84)

  dim e as enemy
  e = new Enemy(172, 56, 172, 216)
  array.push(self.enemies, e)
  e = new Enemy(308, 40, 308, 344)
  array.push(self.enemies, e)
  e = new Enemy(444, 72, 444, 464)
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
  c = new Coin(36, 80)
  array.push(self.coins, c)
  c = new Coin(116, 72)
  array.push(self.coins, c)
  c = new Coin(196, 56)
  array.push(self.coins, c)
  c = new Coin(260, 40)
  array.push(self.coins, c)
  c = new Coin(260, 16)
  array.push(self.coins, c)
  c = new Coin(324, 40)
  array.push(self.coins, c)
  c = new Coin(396, 56)
  array.push(self.coins, c)
  c = new Coin(452, 72)
  array.push(self.coins, c)
  c = new Coin(516, 80)
  array.push(self.coins, c)
  c = new Coin(540, 80)
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
      scenemanager.switch("winscene")
    endif
  endif
endfunction

EndClass
