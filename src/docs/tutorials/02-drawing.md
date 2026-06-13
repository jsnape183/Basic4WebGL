# Tutorial 2: Drawing on Screen

In this tutorial you'll draw shapes directly onto the canvas and learn how the coordinate system works.

## What you'll build

A simple space scene — a dark background with a planet and some stars — drawn entirely with shapes.

## Step 1: Set the background colour

Start a new project called `Drawing`. In `Main.bas`, add an `onenter` function. This runs once when your program starts:

```bas
function onenter()
  stage.setBackground(10, 10, 30)
endfunction
```

`stage.setBackground(r, g, b)` sets the canvas colour using red, green, and blue values from 0 to 255. `10, 10, 30` is a deep dark blue — like space.

Click **Run** and you should see a dark canvas.

## Step 2: Understand the coordinate system

The canvas is 640 pixels wide and 360 pixels tall. The top-left corner is `(0, 0)`. X increases to the right, Y increases downward.

```
(0,0) ─────────────────────── (640,0)
  │                               │
  │                               │
  │           canvas              │
  │                               │
(0,360) ──────────────────── (640,360)
```

## Step 3: Draw a planet

`pen.setFillColor(r, g, b)` sets the colour for filled shapes. `drawing.drawCircle(x, y, radius)` draws a filled circle — `x` and `y` are the centre point.

Add these lines inside `onenter`:

```bas
function onenter()
  stage.setBackground(10, 10, 30)

  pen.setFillColor(80, 140, 200)
  drawing.drawCircle(480, 200, 80)
endfunction
```

Run it. A blue planet appears near the right side of the screen.

## Step 4: Add an atmosphere ring

Draw a slightly larger, slightly transparent circle behind the planet to suggest an atmosphere. Put it before the planet so the planet draws on top:

```bas
function onenter()
  stage.setBackground(10, 10, 30)

  pen.setFillColor(100, 160, 220)
  drawing.drawCircle(480, 200, 95)

  pen.setFillColor(80, 140, 200)
  drawing.drawCircle(480, 200, 80)
endfunction
```

## Step 5: Draw some stars

`drawing.drawRect(x, y, width, height)` draws a filled rectangle — `x` and `y` are its centre point. Tiny white squares make convincing stars:

```bas
pen.setFillColor(255, 255, 255)
drawing.drawRect(50, 60, 3, 3)
drawing.drawRect(120, 30, 2, 2)
drawing.drawRect(200, 140, 3, 3)
drawing.drawRect(300, 80, 2, 2)
drawing.drawRect(380, 50, 3, 3)
```

Add these before the planet code (stars should appear behind it).

## Step 6: Draw a spaceship

Two rectangles and a triangle shape built from a narrower rectangle make a quick spaceship:

```bas
pen.setFillColor(180, 180, 200)
drawing.drawRect(100, 180, 60, 20)
drawing.drawRect(100, 170, 20, 10)
```

## Complete code

```bas
function onenter()
  stage.setBackground(10, 10, 30)

  ' Stars
  pen.setFillColor(255, 255, 255)
  drawing.drawRect(50, 60, 3, 3)
  drawing.drawRect(120, 30, 2, 2)
  drawing.drawRect(200, 140, 3, 3)
  drawing.drawRect(300, 80, 2, 2)
  drawing.drawRect(380, 50, 3, 3)

  ' Planet atmosphere
  pen.setFillColor(100, 160, 220)
  drawing.drawCircle(480, 200, 95)

  ' Planet
  pen.setFillColor(80, 140, 200)
  drawing.drawCircle(480, 200, 80)

  ' Spaceship
  pen.setFillColor(180, 180, 200)
  drawing.drawRect(100, 180, 60, 20)
  drawing.drawRect(100, 170, 20, 10)
endfunction
```

## What you've learned

- `onenter()` runs once when the program starts
- `stage.setBackground(r, g, b)` sets the canvas background
- `pen.setFillColor(r, g, b)` sets the colour for the next shape
- `drawing.drawRect(x, y, w, h)` and `drawing.drawCircle(x, y, r)` draw shapes — `x, y` is the centre
- Shapes drawn later appear on top of shapes drawn earlier
- Comments start with `'`

## Next up

[Tutorial 3: Your First Sprite →](tutorial-03-sprite)
