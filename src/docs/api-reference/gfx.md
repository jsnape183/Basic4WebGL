# gfx

The `gfx` module gives you access to keyboard input, mouse input, and collision detection. Include the **softGfx** package in your project to use it.

## getKeyDown(keycode)

Checks whether a specific key on the keyboard is currently held down.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| keycode   | string | The key to check, e.g. `"ArrowLeft"`, `"Space"`, `"KeyA"` |

**Returns:** `true` if the key is held down, `false` if it is not.

```bas
function onupdate(delta)
  if getKeyDown("ArrowLeft") then
    self.transform.setPosition(self.transform.x() - 5, self.transform.y())
  endif
endfunction
```

## mouseX()

Returns the current horizontal position of the mouse cursor on the canvas.

**Returns:** number — the x coordinate in pixels from the left edge.

```bas
dim cursorX
cursorX = mouseX()
```

## mouseY()

Returns the current vertical position of the mouse cursor on the canvas.

**Returns:** number — the y coordinate in pixels from the top edge.

```bas
dim cursorY
cursorY = mouseY()
```

## mouseDown()

Checks whether the primary mouse button is currently held down.

**Returns:** `true` if the mouse button is pressed, `false` if not.

```bas
function onupdate(delta)
  if mouseDown() then
    fireProjectile()
  endif
endfunction
```

## boxCollide(a, b)

Checks whether two sprites overlap. Uses a simple bounding-box test — if the rectangular areas of the two sprites touch or overlap, this returns `true`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | object | First sprite instance |
| b         | object | Second sprite instance |

**Returns:** `true` if the sprites overlap, `false` if they do not.

```bas
if boxCollide(player, enemy) then
  player.takeDamage(10)
endif
```
