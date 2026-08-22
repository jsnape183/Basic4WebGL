Class
Extends scene

dim failText as text

Constructor()
EndConstructor

function onenter()
  dim t1 as text
  t1 = new text("YOU DIED", 320, 200)
  t1.setStyle(28, 255, 60, 60)
  hud.add(t1)
  self.failText = t1
endfunction

function onkeydown(key)
  scenemanager.switch("dungeon")
endfunction

EndClass
