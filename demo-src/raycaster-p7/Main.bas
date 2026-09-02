function oninit()
  world.setPixelPerfect(true)
endfunction

dim scn = new DiagScene()
scenemanager.register("diag", scn)
scenemanager.switch("diag")
