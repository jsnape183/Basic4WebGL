' demo-src/bullet-hell-shooter/Main.bas
function oninit()
  world.setPixelPerfect(true)
  gamedata.loadBestTime()
endfunction

dim titlescene = new TitleScene()
dim level1scene = new Level1Scene()
dim level2scene = new Level2Scene()
dim level3scene = new Level3Scene()
dim winscene = new WinScene()
dim gameoverscene = new GameOverScene()

scenemanager.register("title", titlescene)
scenemanager.register("level1", level1scene)
scenemanager.register("level2", level2scene)
scenemanager.register("level3", level3scene)
scenemanager.register("winscene", winscene)
scenemanager.register("gameover", gameoverscene)
scenemanager.switch("title")
