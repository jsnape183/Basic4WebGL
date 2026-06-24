# Tutorial 10: How Classes Work

You've been writing class files since Tutorial 3. This tutorial explains what they actually are and why they work the way they do. No new game features — just understanding what you've already built.

## What is a class?

A **class** is a blueprint for creating objects. When you write:

```bas
dim player = new Player()
```

softBASIC uses the `Player.bas` class file as a blueprint to build a new Player object. You can create as many objects from the same blueprint as you like — each is independent.

In Tutorial 9 you created five Enemy objects from one `Enemy.bas` file. They each have their own position and move independently, but they all follow the same rules.

## The parts of a class file

```bas
Class           ' marks this file as a class
Extends sprite  ' this class inherits everything a sprite can do

dim speed       ' instance variable — each object gets its own copy

Constructor(startX, startY)   ' runs when a new object is created
  super("enemy.png")          ' call the parent class constructor
  self.speed = 120
  self.transform.setPosition(startX, startY)
  world.add(self)
EndConstructor

function onupdate(delta)       ' a method — a function that belongs to the object
  dim y                        ' local variable — exists only during this call
  y = self.transform.y() + self.speed * delta / 1000
  self.transform.setPosition(self.transform.x(), y)
endfunction
```

### `Class` and `Extends`

Every class file begins with `Class`. The `Extends` line says which parent class this inherits from — in this case `sprite`. Inheritance means the Enemy automatically has everything a sprite can do: `transform`, `width()`, `height()`, and so on.

### Instance variables (`dim` outside functions)

`dim speed` at the top level of the class creates an **instance variable**. Every Enemy object gets its own `speed` value. Change one enemy's speed and the others are not affected.

You access instance variables using `self.` — `self.speed`, `self.transform.x()`, etc. `self` always refers to the specific object whose method is running.

### The Constructor

The constructor runs once when the object is created — when you write `new Enemy(...)`. It sets up the object: loading the image, setting the starting position, adding to the stage. Arguments to `new Enemy(80, 0)` are passed to the constructor's parameters.

### Methods

A method is a function defined inside a class. `onupdate` is a method. So is `setScore` in ScoreDisplay. You call a method on a specific object:

```bas
scoreDisplay.setScore(5)
```

This calls `setScore` on the `scoreDisplay` object. Inside that function, `self` refers to `scoreDisplay`.

### Local variables (`dim` inside functions)

`dim y` inside `onupdate` is a **local variable**. It is created fresh each time `onupdate` runs and disappears when the function returns. Local variables cannot be accessed with `self.`.

## Instance vs local — a summary

| Where declared | Access | Lifetime |
|---|---|---|
| Top of class (outside functions) | `self.name` | Lives as long as the object |
| Inside a function | `name` (no self.) | Lives only during that function call |

## What `self` means

`self` is how an object refers to itself. When `enemy1.onupdate(delta)` runs, `self` is `enemy1`. When `enemy2.onupdate(delta)` runs, `self` is `enemy2`. Same code, different object.

## Why this matters

Understanding classes means you can now:
- Design new types of game objects with their own behaviour
- Give each object private state (instance variables) that nobody else can accidentally change
- Add new methods to your classes at any time

In the next tutorial you'll put all of this together into a complete game.

## Next up

[Tutorial 11: Dodge! →](tutorial-11-dodge)
