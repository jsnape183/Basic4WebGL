function oninit()
  world.setPixelPerfect(true)
endfunction

dim scn = new ActorScene()
scenemanager.register("actors", scn)
scenemanager.switch("actors")
