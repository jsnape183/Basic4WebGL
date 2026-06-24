# drawing

The `drawing` module lets you draw shapes directly onto the canvas. Shapes are drawn immediately when the function is called. Use the [pen](pen) module to set fill colour, line colour, and line width before drawing.

## drawLine(x, y, x2, y2)

Draws a straight line between two points.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal start position in pixels |
| y         | number | Vertical start position in pixels |
| x2        | number | Horizontal end position in pixels |
| y2        | number | Vertical end position in pixels |

```bas
pen.setLineColor(255, 0, 0)
pen.setLineWidth(2)
drawing.drawLine(0, 0, 100, 100)
```

## drawRect(x, y, width, height)

Draws a filled rectangle.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal position of the centre of the rectangle |
| y         | number | Vertical position of the centre of the rectangle |
| width     | number | Width of the rectangle in pixels |
| height    | number | Height of the rectangle in pixels |

```bas
pen.setFillColor(0, 128, 255)
drawing.drawRect(50, 50, 200, 100)
```

## drawCircle(x, y, radius)

Draws a filled circle.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal position of the centre |
| y         | number | Vertical position of the centre |
| radius    | number | Radius of the circle in pixels |

```bas
pen.setFillColor(255, 200, 0)
drawing.drawCircle(world.width() / 2, world.height() / 2, 40)
```

## clear()

Removes all shapes that were drawn with the `drawing` module. Call this at the start of `onupdate` to redraw the canvas each frame.

```bas
function onupdate(delta)
  drawing.clear()
  pen.setFillColor(255, 100, 0)
  drawing.drawCircle(self.x, self.y, 20)
endfunction
```

## drawImageStrip(imageName, srcX, destX, destY, destWidth, destHeight)

Draws a single vertical column of pixels from an image to the screen. This is the building block for column-based renderers such as raycasters — call it once per screen column to build up a scene one vertical strip at a time.

The source column is always 1 pixel wide, taken from `srcX` and stretched to `destWidth` at the destination.

| Parameter  | Type   | Description |
|------------|--------|-------------|
| imageName  | string | Name of a pre-loaded image asset |
| srcX       | number | X position of the source column in the image |
| destX      | number | Horizontal centre of the destination strip on screen |
| destY      | number | Vertical centre of the destination strip on screen |
| destWidth  | number | Width of the strip on screen in pixels |
| destHeight | number | Height of the strip on screen in pixels |

```bas
function onupdate(delta)
  drawing.clear()
  dim col
  for col = 0 to 199
    dim srcX
    srcX = col * 2
    drawing.drawImageStrip("wall.png", srcX, col, world.height() / 2, 2, 200)
  next col
endfunction
```
