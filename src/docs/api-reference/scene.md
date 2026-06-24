# scene and scenemanager

The `scene` base class and `scenemanager` module let you divide your game into named states — a menu, a gameplay screen, a game-over screen — and switch between them cleanly. Include the **softGfx** package to use them.

## How scenes work

You create a class file for each game state. That file starts with `Class extends scene` and overrides only the lifecycle hooks it needs. The `scenemanager` module holds a registry of named scene instances and controls which one is active.

When you switch scenes, the stage is cleared automatically. The old scene's `onexit` runs first, then the stage clears, then the new scene's `onenter` runs.

### Defining a scene

Create a new class file (for example `MenuScene`) starting with `Class extends scene`:

```bas
Class extends scene

function onenter()
  ' runs once when this scene becomes active
  dim title = new text()
  title.setText("Press SPACE to start")
  title.setPosition(400, 300)
  world.add(title)
endfunction

function onupdate(delta)
  ' runs every frame while this scene is active
  if input.keyDown(32) then
    scenemanager.switch("game")
  endif
endfunction

function onexit()
  ' runs once when leaving this scene (stage clears automatically after this)
endfunction

EndClass
```

### Wiring scenes in your main file

```bas
dim menu = new menuscene()
dim game = new gamescene()

scenemanager.register("menu", menu)
scenemanager.register("game", game)

scenemanager.switch("menu")
```

---

## scene lifecycle hooks

All five hooks are optional — override only the ones you need.

### onenter()

Called once when this scene becomes the active scene. Use it to add sprites and text to the stage.

```bas
function onenter()
  dim bg = new sprite("background.png")
  bg.setPosition(400, 300)
  world.add(bg)
endfunction
```

### onupdate(delta)

Called every frame while this scene is active.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| delta     | number | Time since last frame in milliseconds |

```bas
function onupdate(delta)
  self.timer = self.timer + delta
  if self.timer > 3000 then
    scenemanager.switch("game")
  endif
endfunction
```

### onexit()

Called once when leaving this scene. The stage is cleared automatically after `onexit` returns — you do not need to call `stage.clear()` manually.

```bas
function onexit()
  ' any cleanup before the stage clears
endfunction
```

### onkeydown(key)

Called when a key is pressed while this scene is active. Only the active scene receives key events.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| key       | number | Key code of the pressed key |

```bas
function onkeydown(key)
  if key = 32 then
    scenemanager.switch("game")
  endif
endfunction
```

### onkeyup(key)

Called when a key is released while this scene is active.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| key       | number | Key code of the released key |

```bas
function onkeyup(key)
  ' handle key release
endfunction
```

---

## scenemanager.register(name, obj)

Registers a scene instance under a name so it can be switched to later. Call this in your main file before starting any scene.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The name you will use to switch to this scene |
| obj       | object | An instance of a class that extends `scene` |

```bas
dim menu = new menuscene()
scenemanager.register("menu", menu)
```

## scenemanager.switch(name)

Switches to the named scene. The switch is deferred to the end of the current frame, so calling it from inside `onupdate` is safe.

Sequence on switch:
1. Current scene's `onexit()` is called
2. Stage is cleared
3. New scene's `onenter()` is called

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The name passed to `scenemanager.register` earlier |

```bas
scenemanager.switch("game-over")
```

---

## Full example — three-scene game

**MenuScene class file:**

```bas
Class extends scene

function onenter()
  dim title = new text()
  title.setText("My Game")
  title.setPosition(400, 250)
  world.add(title)

  dim prompt = new text()
  prompt.setText("Press SPACE to play")
  prompt.setPosition(400, 320)
  world.add(prompt)
endfunction

function onkeydown(key)
  if key = 32 then
    scenemanager.switch("game")
  endif
endfunction

EndClass
```

**GameScene class file:**

```bas
Class extends scene

dim player

function onenter()
  self.player = new sprite("player.png")
  self.player.setPosition(400, 300)
  world.add(self.player)
endfunction

function onupdate(delta)
  if input.keyDown(37) then self.player.move(-3, 0) endif
  if input.keyDown(39) then self.player.move(3, 0) endif
endfunction

EndClass
```

**GameOverScene class file:**

```bas
Class extends scene

function onenter()
  dim msg = new text()
  msg.setText("Game Over — press R to restart")
  msg.setPosition(400, 300)
  world.add(msg)
endfunction

function onkeydown(key)
  if key = 82 then
    scenemanager.switch("game")
  endif
endfunction

EndClass
```

**Main file:**

```bas
dim menu = new menuscene()
dim game = new gamescene()
dim gameover = new gameoverscene()

scenemanager.register("menu", menu)
scenemanager.register("game", game)
scenemanager.register("game-over", gameover)

scenemanager.switch("menu")
```
