function oninit()
  world.setPixelPerfect(true)
endfunction

dim walk = new WalkScene()
scenemanager.register("walk", walk)
scenemanager.switch("walk")
