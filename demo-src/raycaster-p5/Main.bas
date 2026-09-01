function oninit()
  world.setPixelPerfect(true)
endfunction

dim lit = new LitScene()
scenemanager.register("lit", lit)
scenemanager.switch("lit")
