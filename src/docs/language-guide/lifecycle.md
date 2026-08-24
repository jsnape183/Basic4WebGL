# Lifecycle Functions

The softBASIC engine calls specific functions on every active module and class instance during each frame. These are the lifecycle hooks available to your code.

## oninit()

Called once, before anything else in your game happens — including before your images and sounds have finished loading. Use it for settings that have to be in place before the game's pictures are prepared.

This is the very first thing that runs, so it is the only place where you can change how the engine itself is set up.

```bas
function oninit()
  print "Starting up"
endfunction
```

`oninit` is optional. If a module does not define it, the engine skips that module.

### What you can do in oninit()

Anything that does not need a picture or a sound. Calculations, `print`, and reading previously saved data all work:

```bas
function oninit()
  dim lastLevel = save.get("level")
  print "Resuming from level " + string.str(lastLevel)
endfunction
```

### What you cannot do in oninit()

**You cannot use your images or sounds yet.** They have not loaded at this point, so creating a `sprite`, `animatedsprite` or `tilemap` here will stop the game with an error telling you to move that code into `onenter()`. Set your game's pieces up in `onenter()` — that is what it is for.

**Your module's variables are not set up yet either.** A `dim` written at the top of a file has not run when `oninit` is called, so reading it prints `null` instead of the value you expect:

```bas
dim score = 100

function oninit()
  print score      ' prints "null" — the line above has not run yet
endfunction

function onenter()
  print score      ' 100 — this is where your values are ready
endfunction
```

### oninit() is for modules, not classes

`oninit` runs on modules — your `.bas` files that are not classes. It cannot run on a class instance, because nothing has been created yet when it fires: at that moment not a single line of your ordinary code has run, so no objects exist. Put your `oninit` in a module such as `Main.bas`.

## onenter()

Called once when the scene starts. Use it to initialise state.

```bas
function onenter()
  score = 0
  lives = 3
endfunction
```

## onupdate(delta)

Called every simulation step — a steady 60 steps per second — with `delta` as the elapsed time in milliseconds for that step.

```bas
function onupdate(delta)
  x = x + speed * delta
endfunction
```

Keep writing movement in terms of `delta` exactly as before. The game runs its simulation at a steady rate no matter how fast or slow the screen happens to be drawing, and draws moving objects at a blended in-between position, so motion stays smooth even when a frame takes longer than usual.

Because the simulation and the screen are independent, `onupdate` may occasionally run twice before one frame is drawn, or not at all. Over any stretch of real time the totals still match, which is why scaling by `delta` remains the right way to move things.

## onkeydown(key) — optional

Called when a key is pressed. `key` is the numeric key code (e.g. `32` for Space, `39` for right arrow). If this function is not defined, the engine skips it for that module/class.

```bas
function onkeydown(key)
  if key = 32 then
    fireProjectile()
  endif
endfunction
```

## onkeyup(key) — optional

Called when a key is released. Same `key` values as `onkeydown`. Optional.

```bas
function onkeyup(key)
  if key = 37 then
    stopMoving()
  endif
endfunction
```

## Class Instances

Lifecycle functions work the same way inside classes. Instance methods with these names will be called by the engine on every active instance. The one exception is `oninit`, which only runs on modules — see above.

An object becomes active when you add it with `world.add(obj)` or `hud.add(obj)`, and stops being active when you remove it with `world.remove(obj)`, `world.clear()`, `hud.remove(obj)`, `hud.clear()`, or when the scene changes. Every object that is active at the start of a frame gets exactly one `onupdate` that frame, so it is always safe to add or remove objects from inside an `onupdate` — a common thing to do when an enemy dies or a new one spawns. An object added during a frame starts updating on the *next* frame. If one object removes a different object earlier in the same frame, that removed object may still receive one last `onupdate` before it stops being active.

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
