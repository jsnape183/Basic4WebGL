Class
Extends scene

dim titleText as text
dim promptText as text

Constructor()
EndConstructor

function onenter()
  gamedata.loadBestTime()
  world.setBackground(10, 10, 20)
  dim t1 as text
  t1 = new text("BULLET HELL", 300, 200)
  t1.setStyle(32, 255, 255, 255)
  hud.add(t1)
  self.titleText = t1

  dim t2 as text
  t2 = new text("Press any key to start", 300, 260)
  t2.setStyle(16, 200, 200, 200)
  hud.add(t2)
  self.promptText = t2
endfunction

function onkeydown(key)
  scenemanager.switch("level1")
endfunction

EndClass
