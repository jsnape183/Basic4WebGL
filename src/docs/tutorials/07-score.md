# Tutorial 7: Score and Text

In this tutorial you'll display a live score counter on screen. You'll create a text object using the `text` class and update it every second using the delta timer pattern.

## What you'll build

A score that counts up once per second, displayed in the top-left corner of the canvas.

## Step 1: Open your Tutorial 6 project

Continue with `Player.bas` and `Main.bas` from Tutorial 6.

## Step 2: Understand the text class

The `text` class works like `sprite` — you create a class file that `Extends text`. The constructor takes the starting text and the position:

```bas
super("Hello!", x, y)
```

To update what it shows, call `self.setText("new text")`.

## Step 3: Create the ScoreDisplay class

Create a new file called `ScoreDisplay`. Type this:

```bas
Class
Extends text

Constructor()
  super("Score: 0", 10, 10)
  self.setStyle(24, 255, 255, 100)
  stage.add(self)
EndConstructor

function setScore(s)
  self.setText("Score: " + string.str(s))
endfunction
```

- `super("Score: 0", 10, 10)` creates the text object at position (10, 10)
- `setStyle(24, 255, 255, 100)` sets font size 24, with a warm yellow colour
- `setScore(s)` is a method Main.bas will call to update the display

## Step 4: Add the score to Main.bas

Open `Main.bas`. You need three things: a score counter, a timer accumulator, and the ScoreDisplay object.

```bas
dim score
dim timer
dim scoreDisplay as ScoreDisplay

function onenter()
  stage.setBackground(10, 10, 30)
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  dim player = new Player()
endfunction
```

## Step 5: Count up every second

Add an `onupdate` to `Main.bas` that accumulates the delta time and increments the score every 1000 milliseconds:

```bas
function onupdate(delta)
  timer = timer + delta
  if timer >= 1000 then
    score = score + 1
    timer = timer - 1000
    scoreDisplay.setScore(score)
  endif
endfunction
```

`timer - 1000` (rather than `timer = 0`) keeps any leftover milliseconds so the counter stays accurate over time.

## Step 6: Run it

Click **Run**. The score in the top-left should tick up by one every second while you fly the ship around.

## Complete code

**ScoreDisplay.bas**

```bas
Class
Extends text

Constructor()
  super("Score: 0", 10, 10)
  self.setStyle(24, 255, 255, 100)
  stage.add(self)
EndConstructor

function setScore(s)
  self.setText("Score: " + string.str(s))
endfunction
```

**Main.bas**

```bas
dim score
dim timer
dim scoreDisplay as ScoreDisplay

function onenter()
  stage.setBackground(10, 10, 30)
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  dim player = new Player()
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

**Player.bas** (unchanged from Tutorial 6)

## What you've learned

- A `text` class file works like a sprite — `Extends text` and a `Constructor()`
- `super("text", x, y)` sets the initial content and position
- `self.setText(str)` updates what is displayed
- `string.str(number)` converts a number to a string so you can join it with other text
- A delta timer accumulator is the standard way to trigger something once per second

## Next up

[Tutorial 8: Functions →](tutorial-08-functions)
