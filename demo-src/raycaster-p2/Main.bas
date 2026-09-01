function oninit()
  world.setPixelPerfect(true)
endfunction

dim spanView = new SpanViewScene()
scenemanager.register("spanview", spanView)
scenemanager.switch("spanview")
