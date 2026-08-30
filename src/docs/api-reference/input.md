# input

The `input` module reads the keyboard, the mouse, and game controllers. Include the **softGfx** package to use it.

## The action map

Instead of checking physical keys and buttons directly, you give each thing the player can do a name — an *action* like `"jump"` or `"move_left"` — and bind one or more physical inputs to it. Then you only ever ask about actions. A keyboard player and a controller player run the exact same game code.

Set your bindings once, in a starting scene's `onenter`. They stay set for the whole game, across scene switches.

```bas
function onenter()
  input.bind("move_left",  "key", keyboard.LEFT)
  input.bind("move_left",  "axis", controller.LSTICK_LEFT)
  input.bind("move_right", "key", keyboard.RIGHT)
  input.bind("move_right", "axis", controller.LSTICK_RIGHT)
  input.bind("jump", "key", keyboard.SPACE)
  input.bind("jump", "button", controller.A)
  input.bind("fire", "button", controller.RT)
endfunction

function onupdate(delta)
  dim move
  move = input.axis("move_left", "move_right")   ' -1..1, stick or keys
  self.transform.setPosition(self.transform.x() + move * 5, self.transform.y())

  if input.pressed("jump") then self.jump() endif
  if input.held("fire") then self.shoot(input.strength("fire")) endif
endfunction
```

See the [keyboard](keyboard) page for `"key"` codes and the [controller](controller) page for `"button"` and `"axis"` codes.

## bind(action, device, code)

Adds one physical input to a named action. Call it more than once with the same action to bind several inputs at once (for example a key *and* a controller button).

| Parameter | Type   | Description |
|-----------|--------|-------------|
| action    | string | The action name you choose, such as `"jump"` |
| device    | string | `"key"`, `"button"`, or `"axis"` |
| code      | number | A `keyboard.*` value for `"key"`, a `controller.*` button for `"button"`, or a `controller.*` stick direction for `"axis"`. A raw number works too. |

```bas
input.bind("jump", "key", keyboard.SPACE)
input.bind("jump", "button", controller.A)
```

## clearBindings(action)

Removes every binding for an action. Useful for a "rebind controls" menu — clear the action, then `bind` the player's new choice.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| action    | string | The action to clear |

```bas
input.clearBindings("jump")
input.bind("jump", "key", keyboard.ENTER)
```

## held(action)

Checks whether an action is active right now.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| action    | string | The action to check |

**Returns:** `true` every frame the action is active, `false` otherwise.

```bas
if input.held("fire") then
  self.shoot()
endif
```

## pressed(action)

Checks whether an action became active on this exact frame. Returns `true` only once per press — use it for one-shot actions like jumping.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| action    | string | The action to check |

**Returns:** `true` on the frame the action activates, `false` otherwise.

```bas
if input.pressed("jump") then
  self.jump()
endif
```

## released(action)

Checks whether an action stopped being active on this exact frame.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| action    | string | The action to check |

**Returns:** `true` on the frame the action releases, `false` otherwise.

```bas
if input.released("charge") then
  self.fireChargedShot()
endif
```

## strength(action)

Reads how hard an action is being pushed, for analog inputs like a stick or a trigger. Keys and ordinary buttons report `0` or `1`. If an action has several bindings, you get the largest value.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| action    | string | The action to check |

**Returns:** number — `0` to `1`.

```bas
dim throttle
throttle = input.strength("accelerate")
self.setSpeed(throttle * self.maxSpeed)
```

## axis(negAction, posAction)

Combines two opposing actions into one number — handy for left/right or up/down movement. It is `strength(posAction)` minus `strength(negAction)`.

| Parameter  | Type   | Description |
|------------|--------|-------------|
| negAction  | string | The action that pushes toward `-1` (for example `"move_left"`) |
| posAction  | string | The action that pushes toward `1` (for example `"move_right"`) |

**Returns:** number — `-1` to `1`.

```bas
dim move
move = input.axis("move_left", "move_right")
self.transform.setPosition(self.transform.x() + move * 5, self.transform.y())
```

## padConnected()

Checks whether at least one game controller is connected.

**Returns:** `true` if a controller is present, `false` otherwise.

```bas
if input.padConnected() then
  hint.setText("Press A to start")
else
  hint.setText("Press Space to start")
endif
```

## setDeadzone(value)

Sets how far a stick must move before it counts as pushed. Small drift below this amount is ignored. The default is `0.15`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| value     | number | `0` to `0.9` |

```bas
input.setDeadzone(0.2)
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

## Deprecated

These functions still work, but new games should use the action map above — it handles controllers for free and keeps game code free of device checks.

### getKeyDown(keycode)

Checks whether a specific key is currently held down. **Replace with:** `input.bind("action", "key", keycode)` then `input.held("action")`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| keycode   | number | The numeric key code (or a `keyboard.*` value) |

**Returns:** `true` if the key is held down, `false` if not.

```bas
' Old:
if input.getKeyDown(39) then self.moveRight() endif

' New:
input.bind("move_right", "key", keyboard.RIGHT)   ' once, in onenter
if input.held("move_right") then self.moveRight() endif
```

### keyPressed(keycode)

Checks whether a key was pressed on this exact frame. **Replace with:** `input.pressed("action")`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| keycode   | number | The numeric key code (or a `keyboard.*` value) |

**Returns:** `true` on the frame the key was pressed, `false` otherwise.

```bas
' Old:
if input.keyPressed(32) then self.jump() endif

' New:
input.bind("jump", "key", keyboard.SPACE)
if input.pressed("jump") then self.jump() endif
```

### keyReleased(keycode)

Checks whether a key was released on this exact frame. **Replace with:** `input.released("action")`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| keycode   | number | The numeric key code (or a `keyboard.*` value) |

**Returns:** `true` on the frame the key was released, `false` otherwise.

```bas
' Old:
if input.keyReleased(32) then self.stopCharging() endif

' New:
input.bind("charge", "key", keyboard.SPACE)
if input.released("charge") then self.stopCharging() endif
```
