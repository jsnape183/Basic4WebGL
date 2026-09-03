function oninit()
  world.setPixelPerfect(true)
endfunction

dim scn = new TiersScene()
scenemanager.register("tiers", scn)
scenemanager.switch("tiers")
