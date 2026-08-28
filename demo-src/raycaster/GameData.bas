Class
' demo-src/raycaster/GameData.bas
'
' A plain Class (no Extends) -- mirrors Coins Platformer's own
' GameData.bas exactly: a small piece of state that needs to survive a
' scene switch (constructed once in Main.bas, passed into every scene's
' constructor that needs it) rather than scenes reading each other's
' fields directly.

dim levelReached
dim bestLevel

Constructor()
  self.levelReached = 1
  self.bestLevel = 0
EndConstructor

function updateBestLevel(reached)
  ' Owns the persisted-best comparison itself, mirroring Bullet Hell
  ' Shooter's own GameData.bas -- there, WinScene/TitleScene never touch
  ' `save` directly, they call a GameData method (trySetBestTime/
  ' loadBestTime); the save.exists/save.get/save.set calls stay inside
  ' GameData either way. Returns true if this run set a new best, and
  ' leaves self.bestLevel holding the (possibly just-updated) persisted
  ' value either way, so a caller can read it without needing its own
  ' copy of the comparison logic.
  dim best
  dim isNewBest

  if save.exists("raycasterBestLevel") then
    best = save.get("raycasterBestLevel")
  else
    best = 0
  endif

  isNewBest = false
  if reached > best then
    best = reached
    save.set("raycasterBestLevel", best)
    isNewBest = true
  endif

  self.bestLevel = best
  return isNewBest
endfunction

EndClass
