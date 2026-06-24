# camera

The `camera` module controls what part of the game world is visible on screen. Use it to follow a moving player, pan to a location, or clamp the view so the camera never shows empty space beyond the world edge. Include the **softGfx** package to use it.

By default the camera is at position (0, 0), which shows the world origin at the top-left of the screen.

---

## camera.follow(target, speed)

Tells the camera to follow a sprite or other object each frame, keeping it centred on screen.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| target    | object | The sprite, animatedsprite, or text object to track |
| speed     | number | Lerp factor 0–1. Pass `0` to snap instantly; values like `0.08` give smooth tracking |

```bas
' Inside a class that extends scene:
function onupdate(delta)
  camera.follow(self.player, 0.1)
endfunction
```

Calling `camera.setPosition()` while in follow mode cancels the follow target.

---

## camera.setPosition(x, y)

Moves the camera to a specific position in world space and cancels any active follow target.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | World x coordinate to show at the left edge of the screen |
| y         | number | World y coordinate to show at the top edge of the screen |

```bas
camera.setPosition(0, 0)
```

---

## camera.setBounds(width, height)

Enables bounds clamping so the camera never shows space outside the world rectangle. Without this call, the camera moves freely.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| width     | number | Total width of the game world in pixels |
| height    | number | Total height of the game world in pixels |

```bas
function onenter()
  camera.setBounds(3200, 1800)
endfunction
```

Clamping is applied every frame after follow tracking, so it works with both `camera.follow` and `camera.setPosition`.

---

## camera.x()

Returns the current camera x position — the world coordinate visible at the left edge of the screen.

**Returns:** number

```bas
dim spawnX
spawnX = camera.x() + stage.width()
```

---

## camera.y()

Returns the current camera y position — the world coordinate visible at the top edge of the screen.

**Returns:** number

```bas
dim spawnY
spawnY = camera.y() + stage.height()
```

---

## Full example — side-scrolling platformer camera

**GameScene class file:**

```bas
Class extends scene

dim player

function onenter()
  self.player = new sprite("player.png")
  self.player.setPosition(400, 300)
  world.add(self.player)
  camera.setBounds(6400, 600)
endfunction

function onupdate(delta)
  if input.getKeyDown(39) then
    self.player.move(4, 0)
  endif
  camera.follow(self.player, 0.08)
endfunction

EndClass
```

The player moves right with the arrow key. The camera smoothly follows and clamps so it never shows space past x = 6400.
