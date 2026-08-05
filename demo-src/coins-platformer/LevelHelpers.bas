function beginLevel(stmFile)
  world.setBackground(20, 20, 40)
  camera.setZoom(4)

  dim tm as tilemapset
  tm = new tilemapset(stmFile)
  world.add(tm)

  dim ground as tilemaplayer
  ground = tm.layer("ground")
  camera.setBounds(ground.widthPx(), ground.heightPx())
  return ground
endfunction

function spawnPlayer(tm as tilemaplayer, spawnX, spawnY)
  dim p as player
  p = new Player(spawnX, spawnY)
  p.setLevel(tm)
  return p
endfunction

function spawnCoinCounter(game as gamedata)
  dim counter as coincounter
  counter = new CoinCounter()
  counter.setScore(game.score)
  hud.add(counter)
  return counter
endfunction

function checkCoin(c as coin, player as player)
  if not c.collected then
    if collision.spriteCollide(player, c) then
      c.collect()
      return true
    endif
  endif
  return false
endfunction

function collectCoins(coins() as coin, player as player, game as gamedata, coinCounter as coincounter)
  dim i
  dim gotCoin
  for i = 0 to array.arrLength(coins) - 1
    gotCoin = checkCoin(coins(i), player)
    if gotCoin then
      game.addCoin()
      coinCounter.setScore(game.score)
    endif
  next i
endfunction

function resetOnEnemyCollision(player as player, enemies() as enemy)
  dim i
  for i = 0 to array.arrLength(enemies) - 1
    if collision.spriteCollide(player, enemies(i)) then
      player.resetToStart()
    endif
  next i
endfunction

function applyDeadzone(player as player, tm as tilemaplayer)
  if player.transform.y() > tm.heightPx() + 100 then
    player.resetToStart()
  endif
endfunction

function reachedLevelEnd(player as player, tm as tilemaplayer)
  return player.transform.x() > tm.widthPx() - 16
endfunction
