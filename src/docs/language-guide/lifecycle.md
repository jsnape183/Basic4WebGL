# Lifecycle Functions

The softBASIC engine calls specific functions on every active module and class instance during each frame. These are the lifecycle hooks available to your code.

## onenter()

Called once when the scene starts. Use it to initialise state.

```bas
function onenter()
  score = 0
  lives = 3
endfunction
```

## onupdate(delta)

Called every frame. `delta` is the elapsed time in milliseconds since the last frame.

```bas
function onupdate(delta)
  x = x + speed * delta
endfunction
```

## onkeydown(key) — optional

Called when a key is pressed. `key` is the key identifier string (e.g. `"ArrowLeft"`, `"Space"`). If this function is not defined, the engine skips it for that module/class.

```bas
function onkeydown(key)
  if key = "Space" then
    fireProjectile()
  endif
endfunction
```

## onkeyup(key) — optional

Called when a key is released. Same `key` values as `onkeydown`. Optional.

```bas
function onkeyup(key)
  if key = "ArrowLeft" then
    stopMoving()
  endif
endfunction
```

## Class Instances

Lifecycle functions work the same way inside classes. Instance methods with these names will be called by the engine on every active instance.

```bas
Class
dim x

function onupdate(delta)
  self.x = self.x + 100 * delta
endfunction
```

## Related Topics

- [Modules](modules)
- [Classes](classes)
