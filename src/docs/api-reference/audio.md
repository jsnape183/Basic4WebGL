# audio

The `audio` class plays sound effects and background music. Include the **softGfx** package to use it.

Audio files must be uploaded to your project's Assets panel (`.mp3`, `.wav`, or `.ogg`). They load automatically when the game starts.

## Constructor

Declare one `audio` variable per sound file you want to use. Typically done at the top of your `Main` file, outside any function.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| soundPath | string | Filename of the audio asset, e.g. `"shoot.wav"` |

```bas
dim shoot as audio("shoot.wav")
dim music  as audio("music.mp3")
```

## play()

Plays the sound once. If called multiple times rapidly, each call plays a new overlapping instance — useful for SFX like laser fire or explosions.

```bas
shoot.play()
```

## playLoop()

Plays the sound on a continuous loop. If the sound is already looping, it restarts from the beginning.

```bas
music.playLoop()
```

## stop()

Stops playback immediately.

```bas
music.stop()
```

## setVolume(volume)

Sets the playback volume.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| volume    | number | `0.0` = silent, `1.0` = full volume |

```bas
music.setVolume(0.3)
shoot.setVolume(0.8)
```

## isPlaying()

Returns `true` if the sound is currently playing, `false` if not.

**Returns:** `true` or `false`

```bas
if not music.isPlaying() then
  music.playLoop()
endif
```

## Example

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
