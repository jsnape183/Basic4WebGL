# Tutorial 5: Keyboard Control

In this tutorial you'll read keyboard input and use it to move your ship. The player will be in control.

## What you'll build

A spaceship that moves left, right, up, and down in response to the arrow keys.

## Step 1: Open your Tutorial 4 project

Continue with `Player.bas` and `Main.bas` from Tutorial 4.

## Step 2: Check a key with input.getKeyDown

`input.getKeyDown(keycode)` returns `true` while a key is held down. Keys are identified by a numeric key code — the arrow keys are 37 (left), 38 (up), 39 (right), 40 (down).

Replace the auto-movement in `onupdate` with a keyboard check:

```bas
function onupdate(delta)
  if input.getKeyDown(39) then
    dim x
    x = self.transform.x() + self.speed * delta / 1000
    self.transform.setPosition(x, self.transform.y())
  endif
endfunction
```

Run it. The ship only moves right when you hold the right arrow key.

## Step 3: Add left movement

Add a second check for the left arrow (key code 37):

```bas
function onupdate(delta)
  dim x
  x = self.transform.x()

  if input.getKeyDown(39) then
    x = x + self.speed * delta / 1000
  endif

  if input.getKeyDown(37) then
    x = x - self.speed * delta / 1000
  endif

  self.transform.setPosition(x, self.transform.y())
endfunction
```

Notice `dim x` is now declared once before the checks, not inside each `if`. This is cleaner — you calculate the final position first, then move the ship once at the end.

## Step 4: Add up and down movement

Add Y movement using key codes 38 (up) and 40 (down):

```bas
function onupdate(delta)
  dim x
  dim y
  dim move
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000

  if input.getKeyDown(39) then
    x = x + move
  endif
  if input.getKeyDown(37) then
    x = x - move
  endif
  if input.getKeyDown(40) then
    y = y + move
  endif
  if input.getKeyDown(38) then
    y = y - move
  endif

  self.transform.setPosition(x, y)
endfunction
```

`move` is calculated once and reused — no need to repeat the same formula four times.

## Step 5: Try different speeds

Change `self.speed` in the constructor to see the difference:

```bas
self.speed = 100   ' slow
self.speed = 400   ' fast
self.speed = 250   ' a good starting point
```

## Complete code

**Player.bas**

```bas
Class
Extends sprite

dim speed

Constructor()
  super("ship.png")
  self.speed = 250
  self.transform.setPosition(320, 180)
  world.add(self)
EndConstructor

function onupdate(delta)
  dim x
  dim y
  dim move
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000

  if input.getKeyDown(39) then
    x = x + move
  endif
  if input.getKeyDown(37) then
    x = x - move
  endif
  if input.getKeyDown(40) then
    y = y + move
  endif
  if input.getKeyDown(38) then
    y = y - move
  endif

  self.transform.setPosition(x, y)
endfunction
```

**Main.bas**

```bas
function onenter()
  world.setBackground(10, 10, 30)
  dim player = new Player()
endfunction
```

## Key code reference

| Key | Code |
|-----|------|
| Left arrow | 37 |
| Up arrow | 38 |
| Right arrow | 39 |
| Down arrow | 40 |
| Space | 32 |
| Enter | 13 |
| Escape | 27 |

For a full list, see the [input](../api-reference/input) API reference.

## What you've learned

- `input.getKeyDown(keycode)` returns `true` while the key is held
- Keys are identified by numeric key codes, not names
- Multiple `if` checks can each adjust the same variable before acting on it
- Storing a computed value in a local variable avoids repeating the formula

## Next up

[Tutorial 6: Staying on Screen →](tutorial-06-bounds)
