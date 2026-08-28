Class
Extends scene
' demo-src/raycaster/GameOverScene.bas

dim gameData as GameData
dim levelText as Text
dim bestText as Text
dim promptText as Text

Constructor(gameData as GameData)
  self.gameData = gameData
EndConstructor

function onenter()
  ' The exists/get/compare/set persisted-best sequence lives in
  ' GameData.updateBestLevel(), not here -- mirrors Bullet Hell Shooter's
  ' own GameData.bas, where WinScene/TitleScene never touch `save`
  ' directly either, only call a GameData method.
  dim reached
  dim isNewBest

  reached = self.gameData.levelReached
  isNewBest = self.gameData.updateBestLevel(reached)

  world.setBackground(0, 0, 0)

  self.levelText = new Text("You reached Level " + string.str(reached), stage.width() / 2 - 130, stage.height() / 2 - 60)
  self.levelText.setStyle(28, 255, 220, 120)
  hud.add(self.levelText)

  if isNewBest then
    self.bestText = new Text("New best!", stage.width() / 2 - 60, stage.height() / 2 - 10)
  else
    self.bestText = new Text("Best: Level " + string.str(self.gameData.bestLevel), stage.width() / 2 - 80, stage.height() / 2 - 10)
  endif
  self.bestText.setStyle(20, 255, 255, 255)
  hud.add(self.bestText)

  self.promptText = new Text("Press any key to try again", stage.width() / 2 - 130, stage.height() / 2 + 50)
  self.promptText.setStyle(18, 200, 200, 200)
  hud.add(self.promptText)
endfunction

function onkeydown(keyCode)
  scenemanager.switch("game")
endfunction

EndClass
