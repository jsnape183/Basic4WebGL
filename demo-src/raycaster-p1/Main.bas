function oninit()
  world.setPixelPerfect(true)
endfunction

dim probe = new MapProbeScene()
scenemanager.register("probe", probe)
scenemanager.switch("probe")
