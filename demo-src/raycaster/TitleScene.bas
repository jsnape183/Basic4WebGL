Class
Extends scene

dim titleText as Text
dim controlsText as Text
dim promptText as Text

Constructor()
EndConstructor

function onenter()
  world.setBackground(0, 0, 0)

  self.titleText = new Text("RAYCASTER", stage.width() / 2 - 140, stage.height() / 2 - 100)
  self.titleText.setStyle(48, 255, 220, 120)
  hud.add(self.titleText)

  self.controlsText = new Text("WASD to move   Q/E to strafe   Space to fire", stage.width() / 2 - 220, stage.height() / 2)
  self.controlsText.setStyle(20, 255, 255, 255)
  hud.add(self.controlsText)

  self.promptText = new Text("Press any key to start", stage.width() / 2 - 110, stage.height() / 2 + 60)
  self.promptText.setStyle(18, 200, 200, 200)
  hud.add(self.promptText)
endfunction

function onkeydown(keyCode)
  scenemanager.switch("game")
endfunction

EndClass
