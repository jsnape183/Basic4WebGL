# Tutorial 15: Animated Sprites

A sprite sheet is a single image containing multiple animation frames laid out in a grid. softBASIC slices it into frames and plays them back in sequences you define. In this tutorial you'll set up a character with three animations that switch based on player input.

## What you'll need

A sprite sheet image named `character.png`. The sheet must be a regular grid of equal-sized frames. A simple layout to start with:

- **Frame size:** 48 × 48 pixels
- **Grid:** 4 columns × 3 rows = 12 frames total
- **Row 0** (frames 0–3): idle animation
- **Row 1** (frames 4–7): walk animation
- **Row 2** (frames 8–11): jump animation

If you don't have a sheet yet, search for "free character sprite sheet 48x48" — many are available under open licences. You can also use a sheet with different dimensions; just adjust the numbers in the code to match. Upload it in the **Assets panel** and name it `character.png`.

## What you'll build

A character that idles when standing still, walks when arrow keys are held, and plays a one-shot jump animation when Up is pressed. The sprite flips horizontally when walking left.

This is a two-file project:
- `Main.bas` — sets up the background and controls
- `Character.bas` — the animated character class

## Step 1: How frame numbering works

Before writing code, it helps to know how frames are numbered. They go left to right, top to bottom, starting from 0:

```
Row 0:  [ 0 ] [ 1 ] [ 2 ] [ 3 ]   ← idle
Row 1:  [ 4 ] [ 5 ] [ 6 ] [ 7 ]   ← walk
Row 2:  [ 8 ] [ 9 ] [10 ] [11 ]   ← jump
```

`addAnim("walk", 4, 7, 12, true)` plays frames 4 through 7 at 12 fps, looping.

## Step 2: Character.bas — the animated character

Create a class file named `Character`. The constructor slices the sheet and defines the three clips. An instance variable `anim` tracks the current animation name so we can avoid restarting a clip that's already playing.

```bas
Class extends animatedsprite

dim anim

Constructor()
  super("character.png", 48, 48)
  self.transform.setPosition(400, 300)

  self.addAnim("idle", 0, 3, 8, true)
  self.addAnim("walk", 4, 7, 12, true)
  self.addAnim("jump", 8, 11, 10, false)

  self.anim = "idle"
  self.play("idle")
  world.add(self)
EndConstructor

function onupdate(delta)
  dim speed
  speed = 180
  dim moving
  moving = 0

  if input.getKeyDown(37) then
    self.transform.setPosition(self.transform.x() - speed * delta / 1000, self.transform.y())
    self.setFlip(true, false)
    moving = 1
  endif

  if input.getKeyDown(39) then
    self.transform.setPosition(self.transform.x() + speed * delta / 1000, self.transform.y())
    self.setFlip(false, false)
    moving = 1
  endif

  if moving = 1 then
    if self.anim <> "walk" then
      self.anim = "walk"
      self.play("walk")
    endif
  else
    if self.anim = "jump" then
      if not self.isPlaying("jump") then
        self.anim = "idle"
        self.play("idle")
      endif
    else
      if self.anim <> "idle" then
        self.anim = "idle"
        self.play("idle")
      endif
    endif
  endif
endfunction

function onkeydown(key)
  if key = 38 then
    self.anim = "jump"
    self.play("jump")
  endif
endfunction

EndClass
```

A few things to note:

- The jump animation is **non-looping** (`false` as the last argument to `addAnim`). After the last frame plays, `isPlaying("jump")` returns `false`. The `onupdate` logic uses this to automatically transition back to idle when the jump finishes.
- Checking `self.anim <> "walk"` before calling `self.play("walk")` prevents restarting the walk animation from frame 0 on every tick while the key is held.
- `setFlip(true, false)` mirrors the sprite horizontally, facing it left. `setFlip(false, false)` restores the original facing.

## Step 3: Main.bas — set the scene

```bas
dim character

function onenter()
  world.setBackground(50, 50, 80)

  character = new Character()

  dim hint = new text()
  hint.setText("← → to walk   ↑ to jump")
  hint.setPosition(400, 30)
  hud.add(hint)
endfunction
```

## Step 4: Run it

Click **Run**. Your character should appear playing the idle animation. Hold left or right to walk — the sprite flips to face the correct direction. Press Up to jump — the jump animation plays once and the character returns to idle automatically.

If the animations look wrong, check that your sheet matches the expected frame size (48 × 48) and row order. If frames are arranged differently, adjust the `startFrame` and `endFrame` values in the `addAnim` calls.

## Using a different sheet layout

If your sheet uses larger frames, pass those dimensions to the constructor:

```bas
super("hero.png", 64, 64)
```

If your animations span different frame ranges, adjust accordingly:

```bas
self.addAnim("idle", 0, 1, 4, true)   ' 2-frame idle at 4 fps
self.addAnim("walk", 2, 9, 15, true)  ' 8-frame walk at 15 fps
```

## Swapping sheets at runtime

If a character needs completely different sheets for different states — a walk sheet and a larger combat sheet, for example — use `setSpriteSheet`:

```bas
self.setSpriteSheet("hero-combat.png", 96, 96)
self.addAnim("attack", 0, 7, 18, false)
self.play("attack")
```

`setSpriteSheet` clears all previously defined animations, so call `addAnim` again after switching.

## Complete code

**Character.bas**

```bas
Class extends animatedsprite

dim anim

Constructor()
  super("character.png", 48, 48)
  self.transform.setPosition(400, 300)

  self.addAnim("idle", 0, 3, 8, true)
  self.addAnim("walk", 4, 7, 12, true)
  self.addAnim("jump", 8, 11, 10, false)

  self.anim = "idle"
  self.play("idle")
  world.add(self)
EndConstructor

function onupdate(delta)
  dim speed
  speed = 180
  dim moving
  moving = 0

  if input.getKeyDown(37) then
    self.transform.setPosition(self.transform.x() - speed * delta / 1000, self.transform.y())
    self.setFlip(true, false)
    moving = 1
  endif

  if input.getKeyDown(39) then
    self.transform.setPosition(self.transform.x() + speed * delta / 1000, self.transform.y())
    self.setFlip(false, false)
    moving = 1
  endif

  if moving = 1 then
    if self.anim <> "walk" then
      self.anim = "walk"
      self.play("walk")
    endif
  else
    if self.anim = "jump" then
      if not self.isPlaying("jump") then
        self.anim = "idle"
        self.play("idle")
      endif
    else
      if self.anim <> "idle" then
        self.anim = "idle"
        self.play("idle")
      endif
    endif
  endif
endfunction

function onkeydown(key)
  if key = 38 then
    self.anim = "jump"
    self.play("jump")
  endif
endfunction

EndClass
```

**Main.bas**

```bas
dim character

function onenter()
  world.setBackground(50, 50, 80)

  character = new Character()

  dim hint = new text()
  hint.setText("← → to walk   ↑ to jump")
  hint.setPosition(400, 30)
  hud.add(hint)
endfunction
```

## What you've learned

- `super("sheet.png", frameW, frameH)` slices the image into a flat list of frames
- Frames are numbered left to right, top to bottom, starting from 0
- `addAnim(name, startFrame, endFrame, fps, loop)` defines a named clip
- `play(name)` starts a clip; `isPlaying(name)` returns `true` while it plays
- Non-looping animations (`false` for loop) stop automatically — poll `isPlaying` to detect when they end
- Track the current animation in an instance variable so you don't restart it every frame
- `setFlip(h, v)` mirrors the sprite — use it to face a character left or right
- `stop()` halts playback; `setSpriteSheet(path, w, h)` swaps to a different sheet and clears all animations
