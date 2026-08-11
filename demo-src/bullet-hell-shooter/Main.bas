' demo-src/bullet-hell-shooter/Main.bas
' Do not call gamedata.loadBestTime() from here -- oninit() runs before
' every module's own deferred top-level statements (see bootstrapper.html),
' so GameData.bas's own "dim bestTime" initializer would run right after
' this and silently reset gamedata.bestTime back to undefined, clobbering
' whatever loadBestTime() just set. It's called from TitleScene.onenter()
' instead, which is guaranteed to run after that deferred init completes.
function oninit()
  world.setPixelPerfect(true)
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
