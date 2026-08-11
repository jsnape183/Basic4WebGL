Class
Extends scene

dim failText as text

Constructor()
EndConstructor

function onenter()
  dim t1 as text
  t1 = new text("MISSION FAILED", 280, 200)
  t1.setStyle(28, 255, 0, 0)
  hud.add(t1)
  self.failText = t1
endfunction

function onkeydown(key)
  gamedata.resetLevelTimes()
  scenemanager.switch("level1")
endfunction

EndClass
