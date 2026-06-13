# Tutorial 8: Functions

In this tutorial you'll extract repeated code into your own functions. Functions let you name a pattern, reuse it in multiple places, and make your code easier to read.

## What you'll build

A cleaner version of the Player movement from Tutorial 6, with the boundary clamping extracted into a reusable `clamp` function.

## Step 1: Open your Tutorial 7 project

Continue with `Player.bas` and `Main.bas` from Tutorial 7.

## Step 2: Spot the repetition

Look at the bounds-checking code in `Player.bas`:

```bas
if x < halfW then
  x = halfW
endif
if x > stage.width() - halfW then
  x = stage.width() - halfW
endif
if y < halfH then
  y = halfH
endif
if y > stage.height() - halfH then
  y = stage.height() - halfH
endif
```

The same pattern appears twice — once for x, once for y. Any time you copy and paste logic, that's a good sign it belongs in a function.

## Step 3: Write a clamp function

A **clamp** keeps a value between a minimum and a maximum. Add this function to `Player.bas`, outside of `onupdate`:

```bas
function clamp(value, minVal, maxVal)
  if value < minVal then
    value = minVal
  endif
  if value > maxVal then
    value = maxVal
  endif
  return value
endfunction
```

`return value` sends the result back to whoever called the function.

## Step 4: Use the function

Replace all four bounds checks in `onupdate` with two `clamp` calls:

```bas
x = self.clamp(x, halfW, stage.width() - halfW)
y = self.clamp(y, halfH, stage.height() - halfH)
```

The same logic, but now each check is a single readable line. If you ever need to change how clamping works, you change it in one place.

> **Did you know?** The `math` module already provides `math.clamp(value, min, max)` that does exactly this. Writing your own version here is the teaching point — in real projects you'd use `math.clamp` directly and skip this function.

## Step 5: Run it

Click **Run**. The ship should behave exactly as before — still stops at the edges — but the code is shorter and cleaner.

## How functions work

A function has three parts:

```bas
function name(param1, param2)
  ' body
  return result
endfunction
```

- **Parameters** — values passed in when you call the function (`value`, `minVal`, `maxVal`)
- **Body** — code that runs each time the function is called
- **Return** — the result sent back to the caller (leave it out for functions that don't produce a value)

When you write `x = clamp(x, halfW, limit)`, softBASIC calls the function, runs its body with those arguments, and replaces the call with whatever was returned.

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

function clamp(value, minVal, maxVal)
  if value < minVal then
    value = minVal
  endif
  if value > maxVal then
    value = maxVal
  endif
  return value
endfunction

function onupdate(delta)
  dim x
  dim y
  dim move
  dim halfW
  dim halfH
  x = self.transform.x()
  y = self.transform.y()
  move = self.speed * delta / 1000
  halfW = self.width() / 2
  halfH = self.height() / 2

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

  x = self.clamp(x, halfW, stage.width() - halfW)
  y = self.clamp(y, halfH, stage.height() - halfH)

  self.transform.setPosition(x, y)
endfunction
```

**Main.bas** (unchanged from Tutorial 7)

## What you've learned

- Functions let you name and reuse a pattern
- Parameters are the inputs; `return` sends the result back
- Calling a function: `result = functionName(arg1, arg2)`
- If repeated code has the same shape, it probably belongs in a function

## Next up

[Tutorial 9: Multiple Enemies →](tutorial-09-enemies)
