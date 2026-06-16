# Tutorial 12: Sound Effects and Music

Every great game has sound. In this tutorial you'll add sound effects and background music to a project using the `audio` class.

## What you'll need

Before you write any code, you need audio files in your project's **Assets panel**. softBASIC supports `.mp3`, `.wav`, and `.ogg` files.

For this tutorial, upload two files:
- `shoot.wav` — a short laser or zap sound (find free ones at freesound.org)
- `music.mp3` — a short music loop (anything loops smoothly)

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

- Play a hit sound when a collision is detected
- Lower the music volume during a game-over screen
- Check `isPlaying()` to avoid restarting music that's already running
- Use different volumes for SFX versus music (loud effects, quiet background)

## Next steps

Try adding sounds to your Dodge! project from [Tutorial 11](tutorial-11-dodge). Add a hit sound to the collision check and background music that plays from `onenter`.
