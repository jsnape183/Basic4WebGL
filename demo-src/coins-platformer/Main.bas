function oninit()
  world.setPixelPerfect(true)
endfunction

dim game = new GameData()
dim level1 = new Level1Scene(game)
dim level2 = new Level2Scene(game)
dim level3 = new Level3Scene(game)
dim winscene = new WinScene(game)

scenemanager.register("level1", level1)
scenemanager.register("level2", level2)
scenemanager.register("level3", level3)
scenemanager.register("winscene", winscene)
scenemanager.switch("level1")
