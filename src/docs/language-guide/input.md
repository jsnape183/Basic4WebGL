# Input

Games react to the player. In softBASIC you read input through the `input` module — and the modern way to do that is the **action map**.

## Why an action map

Without one, your code checks physical keys directly:

```bas
if input.getKeyDown(37) then self.moveLeft() endif
```

That works for a keyboard, but the moment you want controller support you end up writing `if keyboard... else if gamepad...` everywhere. The action map fixes this. You name the things the player can *do*, bind physical inputs to those names once, and everywhere else you ask about the name.

## Binding

Do this once, in your first scene's `onenter`. Bindings last for the whole game.

```bas
function onenter()
  input.bind("move_left",  "key",  keyboard.LEFT)
  input.bind("move_left",  "axis", controller.LSTICK_LEFT)
  input.bind("move_right", "key",  keyboard.RIGHT)
  input.bind("move_right", "axis", controller.LSTICK_RIGHT)
  input.bind("jump", "key",    keyboard.SPACE)
  input.bind("jump", "button", controller.A)
endfunction
```

Each `bind` takes an action name, a device (`"key"`, `"button"`, or `"axis"`), and a code. Codes come from the [keyboard](../api-reference/keyboard) and [controller](../api-reference/controller) constant modules. Binding the same action twice just adds another input — `"jump"` above answers to the space bar *or* the A button.

## Querying

| Function | Use it for |
|----------|------------|
| `input.held("run")` | something that happens every frame while active |
| `input.pressed("jump")` | one-shot actions — fires once per press |
| `input.released("charge")` | the moment the player lets go |
| `input.strength("accelerate")` | how hard a stick or trigger is pushed, `0` to `1` |
| `input.axis("left", "right")` | two opposing actions as one `-1` to `1` number |

```bas
function onupdate(delta)
  dim move
  move = input.axis("move_left", "move_right")
  self.transform.setPosition(self.transform.x() + move * self.speed * delta / 1000, self.transform.y())

  if input.pressed("jump") then self.jump() endif
endfunction
```

## Controllers

If you bind controller inputs, they just work when a controller is plugged in — no extra code. Check `input.padConnected()` if you want to show different on-screen hints. Adjust stick sensitivity with `input.setDeadzone(value)`.

Controller support uses the browser's standard controller layout (Xbox, PlayStation, and most modern pads). See the [controller](../api-reference/controller) reference for the full list of buttons and stick directions, and its limitations.

## The older functions

`input.getKeyDown`, `input.keyPressed`, and `input.keyReleased` still work and older tutorials still use them. They are keyboard-only. New games should prefer the action map. `input.mouseX`, `input.mouseY`, and `input.mouseDown` are unchanged — the mouse is read directly.
