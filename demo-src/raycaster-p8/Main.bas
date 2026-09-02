function oninit()
  world.setPixelPerfect(true)
endfunction

dim scn = new PortalScene()
scenemanager.register("portal", scn)
scenemanager.switch("portal")
