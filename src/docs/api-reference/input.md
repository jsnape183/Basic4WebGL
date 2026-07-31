# input

The `input` module handles keyboard and mouse input. Include the **softGfx** package in your project to use it.

Key codes are numeric values that identify keyboard keys. Common key codes:

| Key | Code |
|-----|------|
| Left arrow | 37 |
| Up arrow | 38 |
| Right arrow | 39 |
| Down arrow | 40 |
| Space | 32 |
| Enter | 13 |
| Escape | 27 |
| A–Z | 65–90 |
| 0–9 | 48–57 |

## getKeyDown(keycode)

Checks whether a specific key is currently held down.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| keycode   | number | The numeric key code to check |

**Returns:** `true` if the key is held down, `false` if it is not.

```bas
function onupdate(delta)
  if input.getKeyDown(39) then
    self.transform.setPosition(self.transform.x() + 5, self.transform.y())
  endif
endfunction
```

## keyPressed(keycode)

Checks whether a specific key was pressed on this exact frame. Unlike `getKeyDown()`, this only returns `true` once — on the frame the key transitions from up to down — even if the key is held for many frames afterward. Use it for actions that should happen once per press, like jumping or firing a single shot.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| keycode   | number | The numeric key code to check |

**Returns:** `true` on the frame the key was pressed, `false` otherwise.

```bas
function onupdate(delta)
  if input.keyPressed(32) then
    self.jump()
  endif
endfunction
```

Compare this to `getKeyDown(32)`, which would return `true` on every frame the key is held — fine for continuous movement, but it would call `self.jump()` dozens of times a second while the key is down.

## keyReleased(keycode)

Checks whether a specific key was released on this exact frame — the down-to-up counterpart to `keyPressed()`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| keycode   | number | The numeric key code to check |

**Returns:** `true` on the frame the key was released, `false` otherwise.

```bas
function onupdate(delta)
  if input.keyReleased(32) then
    self.stopCharging()
  endif
endfunction
```

## mouseX()

Returns the current horizontal position of the mouse cursor on the canvas.

**Returns:** number — the x coordinate in pixels from the left edge.

```bas
dim cursorX
cursorX = input.mouseX()
```

## mouseY()

Returns the current vertical position of the mouse cursor on the canvas.

**Returns:** number — the y coordinate in pixels from the top edge.

```bas
dim cursorY
cursorY = input.mouseY()
```

## mouseDown()

Checks whether the primary mouse button is currently held down.

**Returns:** `true` if the mouse button is pressed, `false` if not.

```bas
function onupdate(delta)
  if input.mouseDown() then
    fireProjectile()
  endif
endfunction
```
