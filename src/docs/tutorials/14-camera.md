# Tutorial 14: Camera and Scrolling

Most games are bigger than the screen. A platformer world might stretch thousands of pixels wide. A camera lets you move the view through that space, following the player automatically.

In this tutorial you'll build a wide scrolling world and set up a camera that smoothly tracks a moving player.

## What you'll need

Upload a small image for the player character — anything works. Name it `player.png`.

## What you'll build

A world 3200 pixels wide (four screen-widths). Landmarks are placed at different positions across it. A player sprite moves with the arrow keys. The camera follows the player and clamps so it never shows empty space beyond the world edges.

This is a two-file project:
- `Main.bas` — sets up the world, landmarks, and camera
- `Player.bas` — a class for the player sprite

## Step 1: Player.bas — a sprite that moves

Create a class file named `Player`. It extends `sprite`, positions itself, and moves left and right:

```bas
Class extends sprite

Constructor(startX, startY)
  super("player.png")
  self.transform.setPosition(startX, startY)
  world.add(self)
EndConstructor

function onupdate(delta)
  dim speed
  speed = 250

  if input.getKeyDown(37) then
    self.transform.setPosition(self.transform.x() - speed * delta / 1000, self.transform.y())
    self.setFlip(true, false)
  endif

  if input.getKeyDown(39) then
    self.transform.setPosition(self.transform.x() + speed * delta / 1000, self.transform.y())
    self.setFlip(false, false)
  endif
endfunction

EndClass
```

`setFlip(true, false)` mirrors the sprite horizontally when walking left.

## Step 2: Main.bas — the world and camera

In `Main.bas`, set up the world, place landmarks at spread-out positions, and start the camera following the player:

```bas
dim hero

function onenter()
  world.setBackground(20, 20, 30)

  hero = new Player(400, 300)

  ' Landmarks placed across the 3200-pixel-wide world
  dim m1 = new text()
  m1.setText("← Start")
  m1.setPosition(100, 180)
  world.add(m1)

  dim m2 = new text()
  m2.setText("Midpoint")
  m2.setPosition(1600, 180)
  world.add(m2)

  dim m3 = new text()
  m3.setText("Far end →")
  m3.setPosition(3050, 180)
  world.add(m3)

  ' HUD label — stays on screen while the world scrolls
  dim hint = new text()
  hint.setText("← → to move")
  hint.setPosition(400, 30)
  hud.add(hint)

  ' Clamp the camera so it never shows space outside the world
  camera.setBounds(3200, 600)

  ' Follow the player — 0.1 means smooth tracking (10% of the gap per frame)
  camera.follow(hero, 0.1)
endfunction
```

## Step 3: Run it

Click **Run**. Move the player right with the arrow key. The world scrolls — the "Midpoint" and "Far end" labels come into view as you travel. The "← → to move" hint stays pinned to the top of the screen (it's in the HUD).

Try walking all the way to the right. The camera stops at the world edge — it never shows empty space past x = 3200, because of `camera.setBounds`.

## How the camera works

`camera.follow(target, speed)` tells the camera to keep `target` centred on screen every frame. The `speed` is a lerp factor: `0` snaps instantly, `0.1` means the camera closes 10% of the remaining gap each frame, giving smooth tracking. Try `0` for instant snapping or `0.05` for very slow drift.

`camera.setBounds(width, height)` sets the edges of the world. The camera never pans past these limits. Without bounds, the camera follows freely — which means you'd see empty space at the edges of a finite world.

## Variations to try

**Different follow speeds:** Change `0.1` to `1` for instant snapping, or `0.03` for sluggish tracking that lags behind the player.

**Vertical scrolling:** Add up/down key movement and increase the bounds height to make the world tall as well as wide.

**Temporary camera override:** Call `camera.setPosition(x, y)` to jump the camera to a specific position — useful for cutscenes or zoom-out effects. Calling `camera.follow` afterwards resumes tracking.

**Show camera coordinates:** Add a HUD text that displays `camera.x()` and `camera.y()` each frame to see exactly what's happening.

## Complete code

**Player.bas**

```bas
Class extends sprite

Constructor(startX, startY)
  super("player.png")
  self.transform.setPosition(startX, startY)
  world.add(self)
EndConstructor

function onupdate(delta)
  dim speed
  speed = 250

  if input.getKeyDown(37) then
    self.transform.setPosition(self.transform.x() - speed * delta / 1000, self.transform.y())
    self.setFlip(true, false)
  endif

  if input.getKeyDown(39) then
    self.transform.setPosition(self.transform.x() + speed * delta / 1000, self.transform.y())
    self.setFlip(false, false)
  endif
endfunction

EndClass
```

**Main.bas**

```bas
dim hero

function onenter()
  world.setBackground(20, 20, 30)

  hero = new Player(400, 300)

  dim m1 = new text()
  m1.setText("← Start")
  m1.setPosition(100, 180)
  world.add(m1)

  dim m2 = new text()
  m2.setText("Midpoint")
  m2.setPosition(1600, 180)
  world.add(m2)

  dim m3 = new text()
  m3.setText("Far end →")
  m3.setPosition(3050, 180)
  world.add(m3)

  dim hint = new text()
  hint.setText("← → to move")
  hint.setPosition(400, 30)
  hud.add(hint)

  camera.setBounds(3200, 600)
  camera.follow(hero, 0.1)
endfunction
```

## What you've learned

- `camera.follow(target, speed)` keeps an object centred on screen every frame
- The `speed` parameter is a lerp factor: `0` = instant snap, `0.1` = smooth tracking
- `camera.setBounds(width, height)` prevents the camera from showing space outside the world
- Objects in `world.add()` scroll with the camera; objects in `hud.add()` stay fixed to the screen
- `camera.x()` and `camera.y()` return the current camera position in world coordinates

## Next up

[Tutorial 15: Animated Sprites →](tutorial-15-animated-sprites)
