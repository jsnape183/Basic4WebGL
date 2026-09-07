function oninit()
  world.setPixelPerfect(true)
endfunction

dim state = new GameState()
dim platformScene = new PlatformScene(state)
dim tunnelScene = new TunnelScene(state)
dim stairwellScene = new StairwellScene(state)

scenemanager.register("platform", platformScene)
scenemanager.register("tunnel", tunnelScene)
scenemanager.register("stairwell", stairwellScene)
scenemanager.switch("platform")
