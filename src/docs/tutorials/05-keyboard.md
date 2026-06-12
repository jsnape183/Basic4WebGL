# Tutorial 5: Keyboard Control

In this tutorial you'll read keyboard input and use it to move your ship. The player will be in control.

## What you'll build

A spaceship that moves left, right, up, and down in response to the arrow keys.

## Step 1: Open your Tutorial 4 project

Continue with `Player.bas` and `Main.bas` from Tutorial 4.

## Step 2: Check a key with getKeyDown

`getKeyDown("key")` returns `true` while a key is held down. The most common key names are `"ArrowLeft"`, `"ArrowRight"`, `"ArrowUp"`, `"ArrowDown"`, and `"Space"`.

Replace the auto-movement in `onupdate` with a keyboard check:

```bas
function onupdate(delta)
  if getKeyDown("ArrowRight") then
    dim x
    x = self.transform.x() + self.speed * delta / 1000
    self.transform.setPosition(x, self.transform.y())
  endif
endfunction
```

Run it. The ship only moves right when you hold the right arrow key.

## Step 3: Add left movement

Add a second check for the left arrow:

```bas
function onupdate(delta)
  dim x
  x = self.transform.x()

  if getKeyDown("ArrowRight") then
    x = x + self.speed * delta / 1000
  endif

  if getKeyDown("ArrowLeft") then
    x = x - self.speed * delta / 1000
  endif

  self.transform.setPosition(x, self.transform.y())
endfunction
```

Notice `dim x` is now declared once before the checks, not inside each `if`. This is cleaner — you calculate the final position first, then move the ship once at the end.

## Step 4: Add up and down movement

Add Y movement the same way:

```bas
function onupdate(delta)
  dim x
  dim y
  dim move
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000

  if getKeyDown("ArrowRight") then
    x = x + move
  endif
  if getKeyDown("ArrowLeft") then
    x = x - move
  endif
  if getKeyDown("ArrowDown") then
    y = y + move
  endif
  if getKeyDown("ArrowUp") then
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
  stage.add(self)
EndConstructor

function onupdate(delta)
  dim x
  dim y
  dim move
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000

  if getKeyDown("ArrowRight") then
    x = x + move
  endif
  if getKeyDown("ArrowLeft") then
    x = x - move
  endif
  if getKeyDown("ArrowDown") then
    y = y + move
  endif
  if getKeyDown("ArrowUp") then
    y = y - move
  endif

  self.transform.setPosition(x, y)
endfunction
```

**Main.bas**

```bas
function onenter()
  stage.setBackground(10, 10, 30)
  dim player = new Player()
endfunction
```

## What you've learned

- `getKeyDown("key")` returns `true` while the key is held
- Common key names: `"ArrowLeft"`, `"ArrowRight"`, `"ArrowUp"`, `"ArrowDown"`, `"Space"`
- Multiple `if` checks can each adjust the same variable before acting on it
- Storing a computed value in a local variable avoids repeating the formula

## Next up

[Tutorial 6: Staying on Screen →](tutorial-06-bounds)
