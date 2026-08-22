' demo-src/dungeon-explorer/Main.bas
function oninit()
  world.setPixelPerfect(true)
endfunction

dim titlescene = new TitleScene()
dim dungeonscene = new DungeonScene()
dim winscene = new WinScene()
dim gameoverscene = new GameOverScene()

scenemanager.register("title", titlescene)
scenemanager.register("dungeon", dungeonscene)
scenemanager.register("winscene", winscene)
scenemanager.register("gameover", gameoverscene)
scenemanager.switch("title")
