# The `new` Keyword

The `new` keyword creates an object instance from a class. Use it to assign objects to typed variables and typed collection slots.

## Typed variables

Declare a typed variable with `dim name as ClassName`, then assign with `new`:

```bas
dim player as Sprite
player = new Sprite("hero.png")

player.setPosition(100, 200)
```

You can also declare and initialise in one line using type inference:

```bas
dim player = new Sprite("hero.png")

player.setPosition(100, 200)   ' type is inferred — member access compiles
```

## Reassignment

A typed variable can be reassigned at any time with the same class:

```bas
dim player as Sprite
player = new Sprite("hero.png")
' later...
player = new Sprite("hero2.png")   ' OK — same class
```

Assigning the wrong class is a compile error:

```bas
dim player as Sprite
player = new Enemy("goblin.png")   ' compile error — type mismatch
```

## Typed arrays

Declare a typed array with `dim arr(N) as ClassName`. All slots start empty — assign each slot with `new`:

```bas
dim enemies(10) as Enemy
enemies(0) = new Enemy("goblin.png")
enemies(1) = new Enemy("orc.png")

enemies(0).update()   ' OK — element type is Enemy
```

Accessing a slot before assigning it stops the game with a null reference error. Assign all slots you plan to use before calling methods on them.

## Typed dictionaries

Declare a typed dictionary with `dim d[] as ClassName`. All keys start empty — assign each key with `new`:

```bas
dim players[] as Sprite
players["Alice"] = new Sprite("hero.png")
players["Bob"] = new Sprite("hero2.png")

players["Alice"].setPosition(100, 200)
```

## Typed parameters

Functions can accept typed parameters. Member access on typed parameters compiles:

```bas
function spawn(e as Enemy)
  e.update()
endfunction

spawn(new Enemy("goblin.png"))
```

Passing the wrong class is a compile error:

```bas
dim s as Sprite("hero.png")
spawn(s)   ' compile error — Sprite is not Enemy
```

## Null reference errors

Accessing a member on a typed variable or collection slot that has not yet been assigned gives a runtime error:

```
Null reference: 'enemies(5)' has not been initialised. Assign a value with 'new' before accessing members.
```

Always assign slots before calling methods on them.
