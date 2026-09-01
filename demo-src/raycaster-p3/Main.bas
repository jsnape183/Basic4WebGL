function oninit()
  world.setPixelPerfect(true)
endfunction

dim roomView = new RoomViewScene()
scenemanager.register("roomview", roomView)
scenemanager.switch("roomview")
