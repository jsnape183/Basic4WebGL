# Tutorial 4: Making Things Move

In this tutorial you'll make your sprite move automatically every frame. This is the foundation of every game — the engine calls your code 60 times per second, and each time you move things a little.

## What you'll build

A spaceship that drifts across the screen on its own.

## Step 1: Open your Tutorial 3 project

Continue from the project you built in Tutorial 3, with `Player.bas` and `Main.bas`.

## Step 2: Understand onupdate

The engine calls `onupdate` on every class instance, every frame. Add it to `Player.bas`:

```bas
function onupdate(delta)

endfunction
```

`delta` is the time in milliseconds since the last frame — usually around 16ms at 60 frames per second. You'll use it in a moment.

## Step 3: Read the current position

To move the ship, you first need to know where it is. `self.transform.x()` and `self.transform.y()` return the current position:

```bas
function onupdate(delta)
  dim x
  x = self.transform.x()
  print x
endfunction
```

Run it. Numbers stream into the console — the ship's x position, printed 60 times a second. Delete the `print` line once you've seen it working.

## Step 4: Move by a fixed amount

Update the position each frame by adding a small number:

```bas
function onupdate(delta)
  dim x
  x = self.transform.x() + 3
  self.transform.setPosition(x, self.transform.y())
endfunction
```

Run it. The ship drifts to the right and eventually disappears off screen.

## Step 5: Use delta time for smooth movement

Adding 3 pixels per frame works, but it ties the game speed to the frame rate — on a faster computer the ship would move faster. The fix is to think in **pixels per second** instead:

```bas
function onupdate(delta)
  dim x
  x = self.transform.x() + self.speed * delta / 1000
  self.transform.setPosition(x, self.transform.y())
endfunction
```

`self.speed * delta / 1000` converts milliseconds to seconds, so `speed = 200` means 200 pixels per second regardless of frame rate.

## Step 6: Store speed as a class variable

`self.speed` needs to be declared at the class level (outside any function) and set in the constructor. Update `Player.bas`:

```bas
Class
Extends sprite

dim speed

Constructor()
  super("ship.png")
  self.speed = 200
  self.transform.setPosition(320, 180)
  world.add(self)
EndConstructor

function onupdate(delta)
  dim x
  x = self.transform.x() + self.speed * delta / 1000
  self.transform.setPosition(x, self.transform.y())
endfunction
```

Variables declared with `dim` outside any function — like `dim speed` here — belong to the object and are accessed with `self.`. Variables declared inside a function are local to that function call and cannot be accessed anywhere else.

## Complete code

**Player.bas**

```bas
Class
Extends sprite

dim speed

Constructor()
  super("ship.png")
  self.speed = 200
  self.transform.setPosition(320, 180)
  world.add(self)
EndConstructor

function onupdate(delta)
  dim x
  x = self.transform.x() + self.speed * delta / 1000
  self.transform.setPosition(x, self.transform.y())
endfunction
```

**Main.bas**

```bas
function onenter()
  world.setBackground(10, 10, 30)
  dim player = new Player()
endfunction
```

## What you've learned

- `onupdate(delta)` is called every frame
- `self.transform.x()` and `self.transform.y()` read the current position
- `self.transform.setPosition(x, y)` updates it
- `delta` is the time in milliseconds since the last frame
- Using `speed * delta / 1000` ties movement to real time, not frame rate
- `dim` outside functions creates instance variables; `dim` inside creates local variables

## Next up

[Tutorial 5: Keyboard Control →](tutorial-05-keyboard)
