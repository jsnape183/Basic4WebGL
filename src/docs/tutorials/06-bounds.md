# Tutorial 6: Staying on Screen

In this tutorial you'll stop the ship from flying off the edges. You'll use `if` to clamp the position within the canvas.

## What you'll build

A player ship that moves freely but bounces off — or stops at — the edges of the screen.

## Step 1: Open your Tutorial 5 project

Continue with `Player.bas` and `Main.bas` from Tutorial 5.

## Step 2: Know the canvas size

The canvas is always 640 pixels wide and 360 pixels tall. `stage.width()` and `stage.height()` return these values so you don't have to hardcode them.

```bas
print stage.width()   ' prints 640
print stage.height()  ' prints 360
```

## Step 3: Clamp the x position

After calculating the new position, check whether it has gone past an edge and correct it:

```bas
if x < 0 then
  x = 0
endif
if x > stage.width() then
  x = stage.width()
endif
```

Add these checks to `onupdate` after the keyboard input but before `setPosition`. Run it — the ship now stops at the left and right edges.

## Step 4: Account for the ship's size

The ship's position is its centre point. If you stop at `x = 0`, half the ship disappears off the left edge. A better boundary is half the ship's width:

```bas
dim halfW
dim halfH
halfW = self.width() / 2
halfH = self.height() / 2

if x < halfW then
  x = halfW
endif
if x > stage.width() - halfW then
  x = stage.width() - halfW
endif
if y < halfH then
  y = halfH
endif
if y > stage.height() - halfH then
  y = stage.height() - halfH
endif
```

`self.width()` and `self.height()` return the pixel dimensions of the sprite image.

## Step 5: Put it all together

The full `onupdate` function:

```bas
function onupdate(delta)
  dim x
  dim y
  dim move
  dim halfW
  dim halfH
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000

  if input.getKeyDown(39) then
    x = x + move
  endif
  if input.getKeyDown(37) then
    x = x - move
  endif
  if input.getKeyDown(40) then
    y = y + move
  endif
  if input.getKeyDown(38) then
    y = y - move
  endif

  halfW = self.width() / 2
  halfH = self.height() / 2

  if x < halfW then
    x = halfW
  endif
  if x > stage.width() - halfW then
    x = stage.width() - halfW
  endif
  if y < halfH then
    y = halfH
  endif
  if y > stage.height() - halfH then
    y = stage.height() - halfH
  endif

  self.transform.setPosition(x, y)
endfunction
```

## Complete code

**Player.bas**

```bas
Class
Extends sprite

dim speed

Constructor()
  super("ship.png")
  self.speed = 250
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor

function onupdate(delta)
  dim x
  dim y
  dim move
  dim halfW
  dim halfH
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000

  if input.getKeyDown(39) then
    x = x + move
  endif
  if input.getKeyDown(37) then
    x = x - move
  endif
  if input.getKeyDown(40) then
    y = y + move
  endif
  if input.getKeyDown(38) then
    y = y - move
  endif

  halfW = self.width() / 2
  halfH = self.height() / 2

  if x < halfW then
    x = halfW
  endif
  if x > stage.width() - halfW then
    x = stage.width() - halfW
  endif
  if y < halfH then
    y = halfH
  endif
  if y > stage.height() - halfH then
    y = stage.height() - halfH
  endif

  self.transform.setPosition(x, y)
endfunction
```

**Main.bas** (unchanged)

```bas
function onenter()
  stage.setBackground(10, 10, 30)
  dim player = new Player()
endfunction
```

## What you've learned

- `stage.width()` and `stage.height()` return the canvas dimensions (640 × 360)
- `self.width()` and `self.height()` return the sprite's image dimensions
- Clamping a position means checking both the minimum and maximum and correcting if out of range
- Accounting for half the sprite size keeps the whole image on screen

## Next up

[Tutorial 7: Score and Text →](tutorial-07-score)
