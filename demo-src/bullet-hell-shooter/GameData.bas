' demo-src/bullet-hell-shooter/GameData.bas
dim levelTimes(3)
dim bestTime

function resetLevelTimes()
  dim i
  for i = 0 to 2
    levelTimes(i) = 0
  next i
endfunction

function setLevelTime(index, seconds)
  levelTimes(index) = seconds
endfunction

function getLevelTime(index)
  return levelTimes(index)
endfunction

function totalTime()
  return levelTimes(0) + levelTimes(1) + levelTimes(2)
endfunction

function loadBestTime()
  if save.exists("bestTime") then
    bestTime = save.get("bestTime")
  else
    bestTime = -1
  endif
endfunction

function getBestTime()
  return bestTime
endfunction

function trySetBestTime(total)
  if bestTime = -1 or total < bestTime then
    bestTime = total
    save.set("bestTime", total)
    return true
  endif
  return false
endfunction
