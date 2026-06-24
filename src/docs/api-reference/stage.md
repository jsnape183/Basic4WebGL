# stage (deprecated)

> **Deprecated:** Use `world` and `hud` instead. `stage.add`, `stage.remove`, and `stage.clear` continue to work but new code should use `world.add`, `world.remove`, and `world.clear`. See the [world](world) and [hud](hud) API reference pages.

The `stage` module adds objects to the game world, removes them, and queries the canvas size.

`stage.add(obj)` → use `world.add(obj)` instead  
`stage.remove(obj)` → use `world.remove(obj)` instead  
`stage.clear()` → use `world.clear()` instead

`stage.width()`, `stage.height()`, and `stage.setBackground()` are not deprecated.

---

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
