Class
Extends scene

dim titleText as text
dim promptText as text

Constructor()
EndConstructor

function onenter()
  world.setBackground(15, 10, 20)
  dim t1 as text
  t1 = new text("DUNGEON EXPLORER", 260, 200)
  t1.setStyle(30, 255, 220, 120)
  hud.add(t1)
  self.titleText = t1

  dim t2 as text
  t2 = new text("Press any key to start", 290, 260)
  t2.setStyle(16, 200, 200, 200)
  hud.add(t2)
  self.promptText = t2
endfunction

function onkeydown(key)
  scenemanager.switch("dungeon")
endfunction

EndClass
