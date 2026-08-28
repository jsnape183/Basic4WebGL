Class
' demo-src/raycaster/GameData.bas
'
' A plain Class (no Extends) -- mirrors Coins Platformer's own
' GameData.bas exactly: a small piece of state that needs to survive a
' scene switch (constructed once in Main.bas, passed into every scene's
' constructor that needs it) rather than scenes reading each other's
' fields directly.

dim levelReached

Constructor()
  self.levelReached = 1
EndConstructor

EndClass
