# ObjectTransform

`ObjectTransform` controls the position of a sprite, animated sprite, or tilemap on the canvas. You do not create an `ObjectTransform` yourself — it is always accessed through the `.transform` property on an object that has one.

```bas
self.transform.setPosition(100, 200)
```

See [sprite](sprite), [animatedsprite](animatedsprite), and [tilemap](tilemap) for examples of how `.transform` is used.

## setPosition(x, y)

Moves the object to an exact position on the canvas.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal position in pixels from the left edge |
| y         | number | Vertical position in pixels from the top edge |

```bas
function onenter()
  self.transform.setPosition(100, 200)
endfunction
```

## x()

Returns the current horizontal position of the object.

**Returns:** number — x coordinate in pixels.

```bas
dim currentX
currentX = self.transform.x()
```

## y()

Returns the current vertical position of the object.

**Returns:** number — y coordinate in pixels.

```bas
dim currentY
currentY = self.transform.y()
```
