function oninit()
  world.setPixelPerfect(true)
endfunction

dim scn = new BenchScene()
scenemanager.register("bench", scn)
scenemanager.switch("bench")
