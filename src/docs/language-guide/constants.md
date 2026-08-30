# Constants

A **constant** is a name for a fixed value that never changes while your game
runs. Use one wherever a "magic number" would otherwise appear — a key code, a
starting score, a speed limit, a title string.

## Declaring constants

Use a `const … endconst` block for a group of related values:

```basic
const
    MAX_HEALTH = 100
    START_LIVES = 3
    GAME_TITLE = "Space Blaster"
    DEBUG_MODE = false
endconst
```

For a single value, write it on one line:

```basic
const GRAVITY = 9
```

Constants must be declared at the **top level of a file** — not inside a
function, a class, or an `if`/`while`/`for` block.

## What can be a constant value

Only a plain literal: a number (including negatives like `-9`), a piece of text
in quotes, or `true` / `false`. You cannot use a calculation, another
constant, or a function call:

```basic
const TAU = PI * 2      ' ERROR - not a plain value
const SPEED = getSpeed() ' ERROR - not a plain value
```

## Using constants

Inside the file that declares them, use the bare name:

```basic
function onupdate(delta)
    if score >= MAX_HEALTH then
        ' ...
    endif
endfunction
```

From another file, put the file's name in front, just like calling a function
from another module:

```basic
' in Main.bas, where the constants live in Config.bas
if lives <= 0 then
    lives = Config.START_LIVES
endif
```

Library modules provide constants the same way. The `keyboard` module is all
constants:

```basic
if input.getKeyDown(keyboard.SPACE) then
    fireBullet()
endif
```

## Rules

- A constant **cannot be assigned to** — `MAX_HEALTH = 200` is an error.
- A constant **cannot be redeclared**, and a `dim` variable **cannot reuse a
  constant's name** (not even a local one inside a function). The same applies
  to `for`-loop variables and function parameters.
- Constant names are written in `UPPER_SNAKE_CASE` **by convention**. softBASIC
  treats names as case-insensitive, so `keyboard.SPACE` and `keyboard.space`
  are the same constant — the capitals are just a signal to whoever reads your
  code that the value is fixed.
