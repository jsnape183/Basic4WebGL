function oninit()
  world.setPixelPerfect(true)
endfunction

dim gamedata = new GameData()
dim titlescene = new TitleScene()
dim gamescene = new GameScene(gamedata)

scenemanager.register("title", titlescene)
scenemanager.register("game", gamescene)
scenemanager.switch("title")
