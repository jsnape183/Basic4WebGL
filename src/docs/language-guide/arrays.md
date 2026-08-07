# Arrays

Arrays store ordered collections of values.

## Declaration

```bas
dim scores(10)   ' array of 10 elements, indices 0–9
```

## Array Literals

You can also build an array directly with a literal — a comma-separated list of values wrapped in curly braces — instead of declaring a sized array and pushing values in one at a time:

```bas
dim enemyTypes = {"goblin", "orc", "troll"}
print enemyTypes(0)   ' goblin
```

Literals can hold numbers, strings, `true`/`false`, or other literals nested inside them:

```bas
dim grid = {{0, 0}, {1, 0}, {0, 1}}
print grid(1, 0)   ' 1
```

An empty literal `{}` creates an array with no elements — the same as `dim arr(0)`.

Array literals work anywhere an expression is allowed, including as a function argument, so you don't need to declare a temporary array just to pass one in:

```bas
setupLevel({"walls", "obstacles"})
```

## Access

```bas
scores(0) = 100
scores(1) = 200
print scores(0)   ' 100
```

## Iteration

```bas
dim i
for i = 0 to 9
  print scores(i)
next i
```

## Typed arrays

A typed array holds elements of a specific class. Declare it with `dim arr(N) as ClassName` and assign each slot individually with `new`:

```bas
dim enemies(3) as Enemy
enemies(0) = new Enemy("goblin.png")
enemies(1) = new Enemy("orc.png")
enemies(2) = new Enemy("troll.png")

enemies(0).update()
```

All slots start empty. Accessing an unassigned slot stops the game with a null reference error.

See [The new Keyword](new-keyword) for the full reference.

## Related Topics

- [Variable Scoping](variable-scoping)
- [Control Flow](control-flow)
