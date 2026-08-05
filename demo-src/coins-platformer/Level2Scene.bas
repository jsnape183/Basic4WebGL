Class extends scene

dim tilemap
dim player
dim enemies(0)
dim coins(0)
dim coinCounter
dim game
dim finished

Constructor(gameData)
  self.game = gameData
EndConstructor

function onenter()
  self.finished = false

  self.tilemap = levelhelpers.beginLevel("level2.json")
  self.player = levelhelpers.spawnPlayer(self.tilemap, 16, 68)

  dim e as enemy
  e = new Enemy(254, 40, 254, 286)
  array.push(self.enemies, e)
  e = new Enemy(326, 56, 326, 378)
  array.push(self.enemies, e)

  self.spawnCoins()

  self.coinCounter = levelhelpers.spawnCoinCounter(self.game)
endfunction

function spawnCoins()
  dim c as coin
  c = new Coin(44, 64)
  array.push(self.coins, c)
  c = new Coin(124, 56)
  array.push(self.coins, c)
  c = new Coin(188, 40)
  array.push(self.coins, c)
  c = new Coin(212, 16)
  array.push(self.coins, c)
  c = new Coin(268, 40)
  array.push(self.coins, c)
  c = new Coin(348, 56)
  array.push(self.coins, c)
  c = new Coin(420, 64)
  array.push(self.coins, c)
  c = new Coin(460, 64)
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
      scenemanager.switch("level3")
    endif
  endif
endfunction

EndClass
