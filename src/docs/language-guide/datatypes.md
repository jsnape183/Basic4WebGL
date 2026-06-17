# Data Types

softBASIC works with four kinds of values.

## Numbers

All numeric values — integers and decimals — are the same type.

```bas
dim score
score = 0

dim speed
speed = 2.5

dim total
total = score + speed
```

## Strings

Text values use double quotes.

```bas
dim name
name = "Player One"
print "Hello, " + name
```

Use `string.str(number)` to convert a number to a string when building messages:

```bas
print "Score: " + string.str(score)
```

## true and false

Some functions return `true` or `false` to indicate yes/no results — for example, whether a key is held down or two sprites are overlapping. You can use these directly in `if` conditions:

```bas
if input.getKeyDown(32) then
  shoot.play()
endif

if collision.spriteCollide(player, enemy) then
  gameOver()
endif
```

You can also store them in variables and compare explicitly:

```bas
dim colliding
colliding = collision.spriteCollide(player, enemy)

if colliding = true then
  gameOver()
endif
```

When passing `true` or `false` as a parameter, write the word directly:

```bas
self.setFlip(true, false)
self.addAnim("walk", 0, 7, 12, true)
```

## Objects

Variables that hold class instances (sprites, audio, text, etc.) are objects. See [The new Keyword](new-keyword) and [Classes](classes) for how to create and use them.

## Related Topics

- [Operators](operators)
- [Control Flow](control-flow)
- [The new Keyword](new-keyword)
