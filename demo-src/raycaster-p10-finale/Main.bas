function oninit()
  world.setPixelPerfect(true)
endfunction

dim scn = new FinaleScene()
scenemanager.register("finale", scn)
scenemanager.switch("finale")
