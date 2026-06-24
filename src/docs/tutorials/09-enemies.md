# Tutorial 9: Multiple Enemies

In this tutorial you'll add falling enemy ships to the game. You'll use an array to track all of them and spawn them at random positions along the top of the screen.

An array is a collection of variables - each entry in the collection can be accessed by it's numeric position starting from 0 as the first element.

## What you'll build

A wave of enemy ships that drift down from the top and loop back when they reach the bottom.

## What you'll need

An image for the enemy ship — call it `enemy.png`. Any small image will do; you can even reuse `ship.png` for now.

You can use this one:

![enemy.png](/alien.png)

## Step 1: Open your Tutorial 8 project

Continue with `Player.bas`, `ScoreDisplay.bas`, and `Main.bas` from Tutorial 8.

## Step 2: Create the Enemy class

Create a new file called `Enemy`. Each enemy moves downward every frame and loops back to the top when it falls off the bottom:

```bas
Class
Extends sprite

dim speed

Constructor(startX)
  super("enemy.png")
  self.speed = 120
  self.transform.setPosition(startX, 0)
  world.add(self)
EndConstructor

function onupdate(delta)
  dim y
  y = self.transform.y() + self.speed * delta / 1000
  if y > world.height() then
    y = 0
  endif
  self.transform.setPosition(self.transform.x(), y)
endfunction
```

`Constructor(startX)` takes a starting x position so each enemy can be placed at a different spot.

## Step 3: Spawn several enemies in Main.bas

Open `Main.bas`. Create an array and fill it with Enemy objects spread across the screen:

```bas
dim score
dim timer
dim scoreDisplay as ScoreDisplay
dim enemies(0)

function onenter()
  world.setBackground(10, 10, 30)
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  dim player = new Player()

  dim e1 = new Enemy(80)
  dim e2 = new Enemy(220)
  dim e3 = new Enemy(360)
  dim e4 = new Enemy(500)
  dim e5 = new Enemy(620)
  array.push(enemies, e1)
  array.push(enemies, e2)
  array.push(enemies, e3)
  array.push(enemies, e4)
  array.push(enemies, e5)
endfunction
```

Each enemy starts at a fixed x position spread evenly across the 640-pixel canvas.

## Step 4: Stagger the starting heights

Right now all five enemies start at y = 0 and move in lock-step, which looks like a single enemy. Give them different starting y positions (negative values place them off-screen above the canvas):

```bas
  dim e1 = new Enemy(80,  0)
  dim e2 = new Enemy(220, -72)
  dim e3 = new Enemy(360, -144)
  dim e4 = new Enemy(500, -216)
  dim e5 = new Enemy(620, -288)
```

Update `Enemy.bas` to accept a second parameter:

```bas
Constructor(startX, startY)
  super("enemy.png")
  self.speed = 120
  self.transform.setPosition(startX, startY)
  world.add(self)
EndConstructor
```

Now they arrive spaced out rather than all at once.

## Step 5: Run it

Click **Run**. Five enemy ships should drift down the screen, each looping back to the top when they disappear off the bottom. Your player ship still moves with the arrow keys.

## Complete code

**Enemy.bas**

```bas
Class
Extends sprite

dim speed

Constructor(startX, startY)
  super("enemy.png")
  self.speed = 120
  self.transform.setPosition(startX, startY)
  world.add(self)
EndConstructor

function onupdate(delta)
  dim y
  y = self.transform.y() + self.speed * delta / 1000
  if y > world.height() then
    y = 0
  endif
  self.transform.setPosition(self.transform.x(), y)
endfunction
```

**Main.bas**

```bas
dim score
dim timer
dim scoreDisplay as ScoreDisplay
dim enemies(0)

function onenter()
  world.setBackground(10, 10, 30)
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  dim player = new Player()

  dim e1 = new Enemy(80,  0)
  dim e2 = new Enemy(220, -72)
  dim e3 = new Enemy(360, -144)
  dim e4 = new Enemy(500, -216)
  dim e5 = new Enemy(620, -288)
  array.push(enemies, e1)
  array.push(enemies, e2)
  array.push(enemies, e3)
  array.push(enemies, e4)
  array.push(enemies, e5)
endfunction

function onupdate(delta)
  timer = timer + delta
  if timer >= 1000 then
    score = score + 1
    timer = timer - 1000
    scoreDisplay.setScore(score)
  endif
endfunction
```

## What you've learned

- Classes can take constructor parameters to customise each instance
- `dim enemies(0)` creates an empty array; `array.push(arr, item)` adds to it
- Each object's `onupdate` runs automatically — the engine calls it on every active instance
- Staggering start positions with negative y values spaces enemies out naturally

## Next up

[Tutorial 10: How Classes Work →](tutorial-10-classes)
