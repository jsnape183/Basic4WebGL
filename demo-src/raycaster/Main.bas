function oninit()
  world.setPixelPerfect(true)
endfunction

dim titlescene = new TitleScene()
dim gamescene = new GameScene()

scenemanager.register("title", titlescene)
scenemanager.register("game", gamescene)
scenemanager.switch("title")
