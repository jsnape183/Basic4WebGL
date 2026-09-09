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

> **Note:** This primitive is not yet used by the raycaster library — perspective-correct floor/ceiling texturing is reserved for a future pass. `drawImageStrip` (walls) is the supported textured-surface call today.

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

## registerLightmap(id, width, height, worldCols, worldRows, bytes)

Stores a pre-computed grid of brightness values under a name, so a renderer can look up "how lit is this spot on the ground?" without recalculating it every frame. This is an advanced building block for custom first-person renderers — a normal 2D game never needs it.

`bytes` is a flat list of colour values, four per grid cell (red, green, blue, then 255), read left-to-right then top-to-bottom. Brightness is taken from the red value (0–255). `worldCols` and `worldRows` are how many world units the whole grid covers, so a lookup can turn a world position into a grid position.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| id        | string | Name to store this grid under, reused when drawing |
| width     | number | Grid cells across |
| height    | number | Grid cells down |
| worldCols | number | World units the grid spans horizontally |
| worldRows | number | World units the grid spans vertically |
| bytes     | array  | Flat list of colour values, `width * height * 4` long |

**Returns:** nothing.

## registerFieldTiles(atlasId, cols, rows, cellNames, cellColors, cellHeights)

Stores a per-cell surface grid for a floor or ceiling, so different tiles of the map can show different images, flat colours, or heights. All three lists are flat, one entry per grid cell (left-to-right then top-to-bottom). `cellNames` holds pre-loaded image names (`""` for none); `cellColors` holds packed colours as `red * 65536 + green * 256 + blue`, or `-1` for none; `cellHeights` holds each cell's floor (or ceiling) height. When `cellHeights` is given, a `drawPlaneField` pass paints only the cells whose height matches its `planeZ` — so a renderer runs one pass per distinct height to texture stepped floors. `drawPlaneField` picks each pixel's look by which cell it lands in: the cell's image, then the cell's flat colour, then the surface's default texture, then the checker. Advanced renderers only.

| Parameter  | Type   | Description |
|------------|--------|-------------|
| atlasId    | string | Name to store this grid under, passed back to `drawPlaneField` |
| cols       | number | Grid cells across |
| rows       | number | Grid cells down |
| cellNames  | array  | Flat list of image names, `cols * rows` long, `""` for none |
| cellColors | array  | Flat list of packed colours, `cols * rows` long, `-1` for none |
| cellHeights | array | Flat list of per-cell heights, `cols * rows` long. Pass an all-zero list for a single flat plane |

**Returns:** nothing.

## drawPlaneField(fieldId, texName, tilesId, planeZ, camX, camY, camZ, dirX, dirY, planeX, planeY, pitch, viewW, viewH, scy, eyeZ, lightmapId, ambient, baseR, baseG, baseB)

Fills the screen with one flat floor or ceiling surface, drawn in true perspective: for every pixel it works out the exact spot on the ground that pixel is looking at, paints the texture there (one full copy of the image per world unit), and dims it by the brightness stored in a registered lightmap (never darker than `ambient`). Because the lookup is by world position, both the texture and the lit patches stay locked to the ground as the camera turns. Each pixel picks its texture in order: the per-cell grid from `tilesId` (if that cell has one), then `texName`, then a built-in checker tinted by `baseR/baseG/baseB`. Advanced renderers only — call it once per surface, before drawing the walls that sit in front of it.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| fieldId   | string | Name for this surface's reusable pixel buffer |
| texName   | string | Default image to tile across the surface, or `""` for the built-in checker |
| tilesId   | string | A grid registered with `registerFieldTiles` for per-cell textures, or `""` |
| planeZ    | number | Height of the surface (0 = floor, 1 = standard ceiling) |
| camX, camY, camZ | number | Camera position |
| dirX, dirY | number | Direction the camera faces |
| planeX, planeY | number | Camera view-plane vector (sets the field of view) |
| pitch     | number | Vertical look offset in pixels |
| viewW, viewH | number | Size of the view in pixels |
| scy       | number | Screen Y of the horizon before pitch |
| eyeZ      | number | Eye height above the camera position |
| lightmapId | string | Name of a grid registered with `registerLightmap` |
| ambient   | number | Lowest brightness, 0–1 |
| baseR, baseG, baseB | number | Base tile colour, 0–255 per channel |

**Returns:** nothing.
