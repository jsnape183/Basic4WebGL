# world

The `world` module manages the game world — the scrollable space that the camera moves through. Use it to add and remove display objects, clear the world between scenes, and query or set canvas properties. Objects added with `world.add` move with the camera. Use `hud.add` for screen-fixed elements like score displays. Include the **softGfx** package to use it.

---

## world.add(obj)

Adds an object to the world so it becomes visible and moves with the camera.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | A sprite, animatedsprite, text, or tilemap instance |

```bas
function onenter()
  dim enemy = new sprite("enemy.png")
  enemy.setPosition(800, 300)
  world.add(enemy)
endfunction
```

---

## world.remove(obj)

Removes an object from the world so it is no longer visible.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| obj       | object | The object to remove |

```bas
world.remove(self.enemy)
```

---

## world.clear()

Removes all world objects at once.

```bas
function onenter()
  world.clear()
endfunction
```

---

## world.width()

Returns the width of the canvas in pixels.

**Returns:** number

```bas
dim centreX
centreX = world.width() / 2
```

---

## world.height()

Returns the height of the canvas in pixels.

**Returns:** number

```bas
dim centreY
centreY = world.height() / 2
```

---

## world.setBackground(r, g, b)

Sets the background colour of the canvas using red, green, and blue values (0–255 each).

| Parameter | Type   | Description |
|-----------|--------|-------------|
| r         | number | Red component, 0–255 |
| g         | number | Green component, 0–255 |
| b         | number | Blue component, 0–255 |

```bas
function onenter()
  world.setBackground(30, 30, 50)
endfunction
```
