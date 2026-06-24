# Tutorial 13: Scenes, World, and HUD

Most games aren't a single screen. A title menu leads to gameplay, gameplay leads to a game-over screen. In this tutorial you'll split a project into multiple scenes and learn the difference between the world layer and the HUD.

This is a multi-file project. You'll create three files:
- `Main.bas` — the main file that wires everything together
- `MenuScene.bas` — a class file for the title screen
- `GameScene.bas` — a class file for the game

## World vs HUD

Everything drawn on screen belongs to one of two layers:

- **world** — the scrollable game space. When a camera is active (see Tutorial 14), world objects scroll with it.
- **HUD** (Heads-Up Display) — objects pinned to the screen. Score counters, health bars, and menus go here because they must always appear at the same screen position, regardless of where the camera is pointing.

Use `world.add(obj)` and `hud.add(obj)` to choose the layer.

## What you'll build

A two-scene app: a title screen and a simple game where pressing Space collects a coin. The score counter sits in the HUD, pinned to the corner. The player character moves freely in the world.

## Step 1: Main.bas — wire the scenes

In `Main.bas`, create one instance of each scene, register them with the scene manager, and start on the menu:

```bas
dim menu = new menuscene()
dim game = new gamescene()

scenemanager.register("menu", menu)
scenemanager.register("game", game)

scenemanager.switch("menu")
```

`scenemanager.register` gives a scene a name. `scenemanager.switch` activates one by name.

## Step 2: MenuScene.bas — the title screen

Create a class file named `MenuScene`. This scene shows the title and waits for Space:

```bas
Class extends scene

function onenter()
  world.setBackground(20, 20, 50)

  dim title = new text()
  title.setText("Coin Rush")
  title.setPosition(400, 260)
  world.add(title)

  dim prompt = new text()
  prompt.setText("Press SPACE to play")
  prompt.setPosition(400, 330)
  world.add(prompt)
endfunction

function onkeydown(key)
  if key = 32 then
    scenemanager.switch("game")
  endif
endfunction

EndClass
```

`onkeydown(key)` is called once per key press. Key 32 is Space. Using `onkeydown` here — rather than polling in `onupdate` — means the switch triggers exactly once per press.

## Step 3: GameScene.bas — the game

Create a class file named `GameScene`. The player (a text character ●) goes in the world. The score label goes in the HUD.

```bas
Class extends scene

dim player
dim playerX
dim playerY
dim score
dim scoreLabel

function onenter()
  world.setBackground(10, 40, 10)

  self.playerX = 400
  self.playerY = 300
  self.score = 0

  self.player = new text()
  self.player.setText("●")
  self.player.setPosition(self.playerX, self.playerY)
  world.add(self.player)

  self.scoreLabel = new text()
  self.scoreLabel.setText("Coins: 0")
  self.scoreLabel.setPosition(80, 30)
  hud.add(self.scoreLabel)
endfunction

function onupdate(delta)
  dim speed
  speed = 200

  if input.getKeyDown(37) then
    self.playerX = self.playerX - speed * delta / 1000
  endif
  if input.getKeyDown(39) then
    self.playerX = self.playerX + speed * delta / 1000
  endif
  if input.getKeyDown(38) then
    self.playerY = self.playerY - speed * delta / 1000
  endif
  if input.getKeyDown(40) then
    self.playerY = self.playerY + speed * delta / 1000
  endif

  self.player.setPosition(self.playerX, self.playerY)
endfunction

function onkeydown(key)
  if key = 32 then
    self.score = self.score + 1
    self.scoreLabel.setText("Coins: " + string.str(self.score))
  endif

  if key = 27 then
    scenemanager.switch("menu")
  endif
endfunction

EndClass
```

Arrow keys move the player. Space collects a coin (score goes up). Escape returns to the menu.

Notice that the score label used `hud.add` — it stays pinned to the top-left corner no matter where the player moves. In Tutorial 14 you'll add a camera that scrolls the world, and the difference becomes very clear.

When a scene exits, the world and HUD are both cleared automatically. You don't need to remove objects manually.

## Step 4: Run it

Click **Run**. The title screen appears. Press Space to start the game. Move the player with the arrow keys and collect coins with Space. Press Escape to return to the menu.

## Complete code

**Main.bas**

```bas
dim menu = new menuscene()
dim game = new gamescene()

scenemanager.register("menu", menu)
scenemanager.register("game", game)

scenemanager.switch("menu")
```

**MenuScene.bas**

```bas
Class extends scene

function onenter()
  world.setBackground(20, 20, 50)

  dim title = new text()
  title.setText("Coin Rush")
  title.setPosition(400, 260)
  world.add(title)

  dim prompt = new text()
  prompt.setText("Press SPACE to play")
  prompt.setPosition(400, 330)
  world.add(prompt)
endfunction

function onkeydown(key)
  if key = 32 then
    scenemanager.switch("game")
  endif
endfunction

EndClass
```

**GameScene.bas**

```bas
Class extends scene

dim player
dim playerX
dim playerY
dim score
dim scoreLabel

function onenter()
  world.setBackground(10, 40, 10)

  self.playerX = 400
  self.playerY = 300
  self.score = 0

  self.player = new text()
  self.player.setText("●")
  self.player.setPosition(self.playerX, self.playerY)
  world.add(self.player)

  self.scoreLabel = new text()
  self.scoreLabel.setText("Coins: 0")
  self.scoreLabel.setPosition(80, 30)
  hud.add(self.scoreLabel)
endfunction

function onupdate(delta)
  dim speed
  speed = 200

  if input.getKeyDown(37) then
    self.playerX = self.playerX - speed * delta / 1000
  endif
  if input.getKeyDown(39) then
    self.playerX = self.playerX + speed * delta / 1000
  endif
  if input.getKeyDown(38) then
    self.playerY = self.playerY - speed * delta / 1000
  endif
  if input.getKeyDown(40) then
    self.playerY = self.playerY + speed * delta / 1000
  endif

  self.player.setPosition(self.playerX, self.playerY)
endfunction

function onkeydown(key)
  if key = 32 then
    self.score = self.score + 1
    self.scoreLabel.setText("Coins: " + string.str(self.score))
  endif

  if key = 27 then
    scenemanager.switch("menu")
  endif
endfunction

EndClass
```

## What you've learned

- A scene is a class file starting with `Class extends scene`
- `scenemanager.register(name, obj)` adds a scene; `scenemanager.switch(name)` activates it
- `onenter()` runs once when a scene starts; `onexit()` runs once when it ends
- `onkeydown(key)` handles key presses in the active scene — only the active scene receives events
- The world and HUD are both cleared automatically when scenes switch
- `world.add(obj)` places objects in the scrollable game world; `hud.add(obj)` pins them to the screen

## Next up

[Tutorial 14: Camera and Scrolling →](tutorial-14-camera)
