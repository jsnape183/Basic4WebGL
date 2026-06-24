# Tutorial 11: Dodge!

This is the final tutorial. You'll combine everything from the series into a complete game: a player ship that dodges falling enemies, a score that counts up while you survive, and a game-over screen when you get hit.

## What you'll build

**Dodge!** — avoid the enemies as long as you can. Your score is how many seconds you survived.

## Step 1: Start from Tutorial 9

Open your Tutorial 9 project. You should have:

- `Player.bas` — moves with arrow keys, stays within bounds
- `Enemy.bas` — falls from the top, loops back
- `ScoreDisplay.bas` — shows the score
- `Main.bas` — wires it all together

Make sure all four files are present before continuing.

## Step 2: Add a game-over display

Create a new file called `GameOverDisplay`. It shows a message when the player is hit and stays hidden until then:

```bas
Class
Extends text

Constructor()
  super("GAME OVER", world.width() / 2 - 100, world.height() / 2 - 20)
  self.setStyle(40, 255, 80, 80)
  self.setAlpha(0)
  world.add(self)
EndConstructor

function show()
  self.setAlpha(1)
endfunction
```

`setAlpha(0)` makes it invisible at the start. `show()` reveals it.

## Step 3: Add a running flag to Main.bas

Open `Main.bas`. Add a `running` variable and the `GameOverDisplay` object. When `running` is 0, the game is over and `onupdate` stops doing anything:

```bas
dim score
dim timer
dim scoreDisplay as ScoreDisplay
dim gameOverDisplay as GameOverDisplay
dim enemies(0)
dim running

function onenter()
  world.setBackground(10, 10, 30)
  running = 1
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  gameOverDisplay = new GameOverDisplay()
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
  if running = 0 then
    return
  endif

  timer = timer + delta
  if timer >= 1000 then
    score = score + 1
    timer = timer - 1000
    scoreDisplay.setScore(score)
  endif
endfunction
```

## Step 4: Pass the player and enemies list into Player.bas

The collision check needs to happen somewhere that has access to both the player and the enemies. `Main.bas` is the right place — but the player needs to tell Main when it's been hit.

Add a `checkCollisions` function to `Main.bas` that loops over the enemies array:

```bas
function checkCollisions(player)
  dim i
  for i = 0 to array.arrLength(enemies) - 1
    if collision.spriteCollide(player, enemies(i)) then
      running = 0
      gameOverDisplay.show()
    endif
  next i
endfunction
```

`collision.spriteCollide(a, b)` returns `true` if the two sprites overlap. The `for` loop checks every enemy in one pass.

## Step 5: Call checkCollisions from Player.bas

The player doesn't know about Main.bas directly, but Main.bas _owns_ the player — it calls `new Player()`. The simplest approach is to give the Player a reference to Main's check function.

However, for a small game like this, the cleanest solution is to do the collision check in `Main.bas`'s `onupdate` by passing the `player` object up. Update `onenter` in Main.bas to keep a reference to the player:

```bas
dim score
dim timer
dim scoreDisplay as ScoreDisplay
dim gameOverDisplay as GameOverDisplay
dim enemies(0)
dim running
dim player as Player
```

Remove the `dim` from the player creation line so it uses the module-level variable:

```bas
  player = new Player()
```

Then update `onupdate` to call `checkCollisions`:

```bas
function onupdate(delta)
  if running = 0 then
    return
  endif

  checkCollisions(player)

  timer = timer + delta
  if timer >= 1000 then
    score = score + 1
    timer = timer - 1000
    scoreDisplay.setScore(score)
  endif
endfunction
```

## Step 6: Add background music

Upload a music file (`.mp3` or `.wav`) to your project's Assets panel. Then declare it in `Main.bas` alongside the other module-level variables:

```bas
dim music as audio("music.mp3")
```

In `onenter`, start it looping after the other setup:

```bas
music.setVolume(0.4)
music.playLoop()
```

## Step 7: Add a hit sound

Upload a short impact sound (e.g. `hit.wav`) to your Assets panel. Declare it in `Main.bas`:

```bas
dim hitSound as audio("hit.wav")
```

In `checkCollisions`, play it when a collision is detected:

```bas
function checkCollisions(p)
  dim i
  for i = 0 to array.arrLength(enemies) - 1
    if collision.spriteCollide(p, enemies(i)) then
      running = 0
      hitSound.play()
      gameOverDisplay.show()
    endif
  next i
endfunction
```

## Step 8: Run it

Click **Run**. Dodge the falling enemy ships with the arrow keys. When one hits you, the GAME OVER message appears and the score freezes. How long can you survive?

## Complete code

**GameOverDisplay.bas**

```bas
Class
Extends text

Constructor()
  super("GAME OVER", world.width() / 2 - 100, world.height() / 2 - 20)
  self.setStyle(40, 255, 80, 80)
  self.setAlpha(0)
  world.add(self)
EndConstructor

function show()
  self.setAlpha(1)
endfunction
```

**Main.bas**

```bas
dim score
dim timer
dim scoreDisplay as ScoreDisplay
dim gameOverDisplay as GameOverDisplay
dim enemies(0)
dim running
dim player as Player
dim music as audio("music.mp3")
dim hitSound as audio("hit.wav")

function onenter()
  world.setBackground(10, 10, 30)
  running = 1
  score = 0
  timer = 0
  scoreDisplay = new ScoreDisplay()
  gameOverDisplay = new GameOverDisplay()
  player = new Player()
  music.setVolume(0.4)
  music.playLoop()

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

function checkCollisions(p)
  dim i
  for i = 0 to array.arrLength(enemies) - 1
    if collision.spriteCollide(p, enemies(i)) then
      running = 0
      hitSound.play()
      gameOverDisplay.show()
    endif
  next i
endfunction

function onupdate(delta)
  if running = 0 then
    return
  endif

  checkCollisions(player)

  timer = timer + delta
  if timer >= 1000 then
    score = score + 1
    timer = timer - 1000
    scoreDisplay.setScore(score)
  endif
endfunction
```

**Player.bas** (from Tutorial 8)

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

  x = self.clamp(x, halfW, world.width() - halfW)
  y = self.clamp(y, halfH, world.height() - halfH)

  self.transform.setPosition(x, y)
endfunction
```

**Enemy.bas** (from Tutorial 9)

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

**ScoreDisplay.bas** (from Tutorial 7)

```bas
Class
Extends text

Constructor()
  super("Score: 0", 10, 10)
  self.setStyle(24, 255, 255, 100)
  world.add(self)
EndConstructor

function setScore(s)
  self.setText("Score: " + string.str(s))
endfunction
```

## What you've learned

- `collision.spriteCollide(a, b)` checks whether two sprites overlap
- A `for` loop over an array checks every element in one pass
- A `running` flag is a simple and reliable way to pause or stop a game
- `setAlpha(0)` hides an object; `setAlpha(1)` reveals it
- Module-level `dim` variables in `Main.bas` act as shared game state
- `dim music as audio("file")` declares an audio object at module level
- `playLoop()` starts background music; `play()` fires a one-shot sound effect

## Next steps

Continue to [Tutorial 12: Sound Effects and Music](tutorial-12-sound) to learn how audio works in more detail and get ideas for taking your Dodge! game further.
