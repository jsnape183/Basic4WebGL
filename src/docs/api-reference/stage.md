# stage

The `stage` module controls which objects are visible on screen and provides information about the canvas size. Any sprite, text, or tilemap must be added to the stage before it will appear.

## add(obj)

Adds an object to the stage so it becomes visible.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | A sprite, animatedsprite, text, or tilemap instance |

```bas
function onenter()
  stage.add(self)
endfunction
```

## remove(obj)

Removes an object from the stage so it is no longer visible.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | The object to remove |

```bas
stage.remove(enemy)
```

## clear()

Removes all objects from the stage at once.

```bas
function onenter()
  stage.clear()
endfunction
```

## width()

Returns the width of the canvas in pixels.

**Returns:** number

```bas
dim centreX
centreX = stage.width() / 2
```

## height()

Returns the height of the canvas in pixels.

**Returns:** number

```bas
dim centreY
centreY = stage.height() / 2
```

## setBackground(r, g, b)

Sets the background colour of the canvas using red, green, and blue values (0–255 each).

| Parameter | Type   | Description |
|-----------|--------|-------------|
| r         | number | Red component, 0–255 |
| g         | number | Green component, 0–255 |
| b         | number | Blue component, 0–255 |

```bas
function onenter()
  stage.setBackground(30, 30, 50)
endfunction
```
