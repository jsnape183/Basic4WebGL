# controller

The `controller` module is a set of named numbers for game controller buttons and sticks. Use them with `input.bind` so your bindings read clearly:

```bas
input.bind("jump", "button", controller.A)
input.bind("aim_right", "axis", controller.RSTICK_RIGHT)
```

There are no functions here — just constants. Include the **softGfx** package to use it.

## Standard mapping

These values follow the standard controller layout that browsers apply to Xbox, PlayStation, and most modern controllers. A controller the browser does not recognise may not match these positions — bindings simply will not respond. There is no way to remap an unrecognised controller yet.

## Button constants

Use these with `input.bind(action, "button", code)`.

| Constant | Button | Constant | Button |
|----------|--------|----------|--------|
| `controller.A` | A / cross | `controller.BACK` | Back / Select |
| `controller.B` | B / circle | `controller.START` | Start |
| `controller.X` | X / square | `controller.LSTICK` | Left stick click |
| `controller.Y` | Y / triangle | `controller.RSTICK` | Right stick click |
| `controller.LB` | Left shoulder | `controller.DPAD_UP` | D-pad up |
| `controller.RB` | Right shoulder | `controller.DPAD_DOWN` | D-pad down |
| `controller.LT` | Left trigger | `controller.DPAD_LEFT` | D-pad left |
| `controller.RT` | Right trigger | `controller.DPAD_RIGHT` | D-pad right |
| | | `controller.GUIDE` | Guide / Home |

The triggers (`controller.LT`, `controller.RT`) are half buttons, half analog. Bound to an action you can read them with `input.held` and `input.pressed` like any button, or with `input.strength` to get how far they are pulled, `0` to `1`.

## Stick direction constants

Use these with `input.bind(action, "axis", code)`. Each one is a single push direction of a stick — a value from `0` (centred) to `1` (pushed all the way that way).

| Constant | Direction | Constant | Direction |
|----------|-----------|----------|-----------|
| `controller.LSTICK_LEFT` | Left stick, left | `controller.RSTICK_LEFT` | Right stick, left |
| `controller.LSTICK_RIGHT` | Left stick, right | `controller.RSTICK_RIGHT` | Right stick, right |
| `controller.LSTICK_UP` | Left stick, up | `controller.RSTICK_UP` | Right stick, up |
| `controller.LSTICK_DOWN` | Left stick, down | `controller.RSTICK_DOWN` | Right stick, down |

Pair opposite directions with `input.axis` to get a `-1` to `1` value:

```bas
function onenter()
  input.bind("left",  "axis", controller.LSTICK_LEFT)
  input.bind("right", "axis", controller.LSTICK_RIGHT)
  input.bind("left",  "key", keyboard.LEFT)
  input.bind("right", "key", keyboard.RIGHT)
endfunction

function onupdate(delta)
  dim move
  move = input.axis("left", "right")
  self.transform.setPosition(self.transform.x() + move * 4, self.transform.y())
endfunction
```

## Limitations

- One controller at a time. If several are connected, the game reads the first one.
- No rumble / vibration yet.
- No "press any button" capture helper for rebind screens yet.
