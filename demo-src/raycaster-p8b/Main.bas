function oninit()
  world.setPixelPerfect(true)
endfunction

dim scn = new TextureScene()
scenemanager.register("textures", scn)
scenemanager.switch("textures")
