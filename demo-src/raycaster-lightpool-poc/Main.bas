function oninit()
  world.setPixelPerfect(true)
endfunction

dim pool = new PoolScene()
scenemanager.register("pool", pool)
scenemanager.switch("pool")
