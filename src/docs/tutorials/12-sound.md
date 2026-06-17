# Tutorial 12: Sound Effects and Music

Every great game has sound. In this tutorial you'll add sound effects and background music to a project using the `audio` class.

## What you'll need

Before you write any code, you need audio files in your project's **Assets panel**. softBASIC supports `.mp3`, `.wav`, and `.ogg` files.

For this tutorial, upload two files:
- `shoot.wav` — a short laser or zap sound
- `music.mp3` — a short music loop (anything loops smoothly)

You can use these sample files — right-click and save:

- [shoot.wav](/shoot.wav)
- [music.mp3](/music.mp3)

To upload: open the Assets panel, click **+**, and choose your files.

## Step 1: Declare your audio objects

Audio files are accessed through the `audio` class. Declare one variable per file at the top of your `Main` file, outside any function:

```bas
dim shoot as audio("shoot.wav")
dim music  as audio("music.mp3")
```

The filename must match exactly what appears in your Assets panel.

## Step 2: Start the background music

In `onenter`, set the volume and start the music looping:

```bas
function onenter()
  music.setVolume(0.4)
  music.playLoop()
endfunction
```

`playLoop()` starts a continuous loop. Calling it again restarts from the beginning. `setVolume` takes a number from `0.0` (silent) to `1.0` (full volume).

## Step 3: Play a sound effect on keypress

Add an `onupdate` that plays the laser sound when the spacebar is pressed:

```bas
function onupdate(delta)
  if input.getKeyDown(32) then
    shoot.play()
  endif
endfunction
```

`play()` plays the sound once. If you press space rapidly, each press plays a new overlapping instance — this is the right behaviour for fast SFX.

## Step 4: Stopping and checking

You can stop a sound at any point:

```bas
music.stop()
```

And check whether it's still playing:

```bas
if not music.isPlaying() then
  music.playLoop()
endif
```

This is useful for restarting music that finishes, or stopping SFX before playing a new one.

## Step 5: Run it

Click **Run**. You should hear the music looping immediately. Press the spacebar — the laser fires each time. Try `setVolume(0.1)` for quiet background music and `setVolume(0.8)` for loud SFX.

## Complete code

**Main.bas**

```bas
dim shoot as audio("shoot.wav")
dim music  as audio("music.mp3")

function onenter()
  music.setVolume(0.4)
  music.playLoop()
endfunction

function onupdate(delta)
  if input.getKeyDown(32) then
    shoot.play()
  endif
endfunction
```

## What you've learned

- Declare audio with `dim name as audio("filename")`
- `play()` plays a sound once; multiple calls overlap (good for SFX)
- `playLoop()` loops continuously; `stop()` halts it
- `setVolume(0.0–1.0)` controls how loud
- `isPlaying()` returns `true` if the sound is running

## Ideas for taking it further

- Increase enemy speed over time: update `self.speed` in each enemy's `onupdate` based on score
- Add more enemies as the score increases: push new Enemy objects into the `enemies` array from `onupdate`
- Display a "Press Space to restart" message and restart on `onkeydown` key code 32
- Add a high score that persists across runs using a module-level variable
- Stop the music on game over: call `music.stop()` in `checkCollisions` after `running = 0`
- Lower the music volume during a game-over screen instead of stopping it: `music.setVolume(0.1)`
- Use `isPlaying()` to avoid restarting music that is already running
- Give SFX and music different volumes — loud effects, quiet background

## You've completed the tutorial series!

You now know how to build a complete softBASIC game with graphics, collision, score, classes, and sound. Explore the [API Reference](../api-reference/gfx) to discover more of what softGfx can do.
