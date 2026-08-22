Class
Extends scene

dim winText as text

Constructor()
EndConstructor

function onenter()
  dim t1 as text
  t1 = new text("THE DUNGEON IS CLEAR", 240, 200)
  t1.setStyle(26, 255, 255, 100)
  hud.add(t1)
  self.winText = t1
endfunction

function onkeydown(key)
  scenemanager.switch("title")
endfunction

EndClass
