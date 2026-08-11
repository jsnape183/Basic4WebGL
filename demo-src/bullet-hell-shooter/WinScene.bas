Class
Extends scene

dim totalText as text
dim bestText as text

Constructor()
EndConstructor

function onenter()
  dim total
  total = gamedata.totalTime()
  gamedata.trySetBestTime(total)

  dim t1 as text
  t1 = new text("YOU SURVIVED", 280, 180)
  t1.setStyle(28, 255, 255, 0)
  hud.add(t1)
  self.totalText = t1

  dim t2 as text
  t2 = new text("Best: " + string.str(gamedata.getBestTime()), 280, 240)
  t2.setStyle(16, 255, 255, 255)
  hud.add(t2)
  self.bestText = t2
endfunction

function onkeydown(key)
  scenemanager.switch("title")
endfunction

EndClass
