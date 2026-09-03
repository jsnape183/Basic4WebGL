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

## drawImageStrip(imageName, srcX, destX, destY, destWidth, destHeight, tint, srcVTop, srcVBot)

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
| tint       | number | Optional. Colour to multiply the strip by, as a packed `red * 65536 + green * 256 + blue` number (0–255 per channel). Defaults to white (no tint). |
| srcVTop    | number | Optional. Top of the vertical slice to read from the source, as a fraction 0–1. Defaults to 0. |
| srcVBot    | number | Optional. Bottom of the vertical slice to read from the source, as a fraction 0–1. Defaults to 1. Use `srcVTop`/`srcVBot` to draw only a vertical slice of the source — for a strip that is partly hidden behind something closer. |

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

## drawFloorStrip(imageName, destX, yNear, yFar, wNearX, wNearY, wFarX, wFarY, stripW, tint)

Draws one column of a floor or ceiling texture, corrected for perspective so it does not warp with distance. Like `drawImageStrip`, this is a building block for column-based renderers: call it once per screen column for each horizontal surface band you want to paint. The strip covers the screen from `yNear` (the edge closest to the camera) to `yFar` (the edge nearest the horizon), and the image tiles once per world unit along the ground between the near world point and the far world point.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| imageName | string | Name of a pre-loaded image asset. Should be a texture that tiles seamlessly. |
| destX     | number | Horizontal centre of the strip on screen |
| yNear     | number | Screen Y of the strip edge closest to the camera |
| yFar      | number | Screen Y of the strip edge nearest the horizon |
| wNearX    | number | World X of the point under the near edge |
| wNearY    | number | World Y of the point under the near edge |
| wFarX     | number | World X of the point under the far edge |
| wFarY     | number | World Y of the point under the far edge |
| stripW    | number | Width of the strip on screen in pixels |
| tint      | number | Optional. Colour to multiply the strip by, as a packed `red * 65536 + green * 256 + blue` number (0–255 per channel). Defaults to white (no tint). Use it to shade the surface by distance or light level. |

**Returns:** nothing.

```bas
function onupdate(delta)
  drawing.clear()
  dim col
  for col = 0 to 199
    ' near edge of the floor band is lower on screen than the far edge
    drawing.drawFloorStrip("floor.png", col, 380, 240, 2, 1, 8, 1, 2, 0xffffff)
  next col
endfunction
```
