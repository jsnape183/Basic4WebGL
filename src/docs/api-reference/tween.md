# tween

The `tween` module animates a sprite's angle, scale, alpha, and position over time, using a sequence of `Keyframe` objects you build yourself. A keyframe sequence is just a list of points in time, each one saying what the sprite's angle/scale/alpha/position should be at that moment — `tween` smoothly blends between them as time passes, so you don't have to update those values by hand every frame. Include the **softGfx** package to use it.

## Keyframe

A `Keyframe` is a plain data object — one point in a `tween` animation. You build an array of them and hand the array to `tween.play`.

### Constructor

```bas
dim k as Keyframe
k = new Keyframe()
```

A new `Keyframe` starts with neutral values: `angle = 0`, `scaleX = 1`, `scaleY = 1`, `alpha = 1`, and position `(0, 0)`. Use the setters below to change the ones you care about.

### setTime(t)

Sets when this keyframe happens, in seconds since the animation started playing.

| Parameter | Type   | Description |
|-----------|--------|--------------|
| t         | number | Time in seconds since the animation started |

```bas
dim k as Keyframe
k = new Keyframe()
k.setTime(0.5)
```

### setAngle(a)

Sets the rotation angle, in degrees, at this keyframe.

| Parameter | Type   | Description |
|-----------|--------|--------------|
| a         | number | Rotation in degrees at this keyframe |

```bas
dim k as Keyframe
k = new Keyframe()
k.setAngle(-100)
```

### setScaleX(sx)

Sets the horizontal scale at this keyframe.

| Parameter | Type   | Description |
|-----------|--------|--------------|
| sx        | number | Horizontal scale at this keyframe (1 = normal size) |

```bas
dim k as Keyframe
k = new Keyframe()
k.setScaleX(1.5)
```

### setScaleY(sy)

Sets the vertical scale at this keyframe.

| Parameter | Type   | Description |
|-----------|--------|--------------|
| sy        | number | Vertical scale at this keyframe (1 = normal size) |

```bas
dim k as Keyframe
k = new Keyframe()
k.setScaleY(1.5)
```

### setAlpha(al)

Sets the transparency at this keyframe.

| Parameter | Type   | Description |
|-----------|--------|--------------|
| al        | number | Transparency at this keyframe (0 = invisible, 1 = fully opaque) |

```bas
dim k as Keyframe
k = new Keyframe()
k.setAlpha(0.5)
```

### setPosition(px, py)

Sets the world position at this keyframe.

| Parameter | Type   | Description |
|-----------|--------|--------------|
| px        | number | World x position at this keyframe |
| py        | number | World y position at this keyframe |

```bas
dim k as Keyframe
k = new Keyframe()
k.setPosition(100, 200)
```

## play(sprite, frames, loop)

Starts playing a keyframe animation on a sprite.

| Parameter | Type   | Description |
|-----------|--------|--------------|
| sprite    | object | The sprite (or `animatedsprite`) to animate |
| frames    | array  | Array of `Keyframe` objects. They don't need to be in time order — `tween` sorts them for you. |
| loop      | `true` or `false` | `true` to repeat the animation forever, `false` to play it once and hold the last keyframe |

Calling `play` again on a sprite that's already animating restarts it cleanly with the new `frames` — useful for switching between different animations from your game logic, like swapping an idle bob for an attack swing.

```bas
' A treasure chest lid swinging open: it stays shut, then tilts back.
dim lidClosed as Keyframe
lidClosed = new Keyframe()
lidClosed.setTime(0)
lidClosed.setAngle(0)

dim lidOpen as Keyframe
lidOpen = new Keyframe()
lidOpen.setTime(0.5)
lidOpen.setAngle(-100)

dim frames(0)
array.push(frames, lidClosed)
array.push(frames, lidOpen)

tween.play(chestLid, frames, false)
```

## stop(sprite)

Immediately stops a sprite's keyframe animation, holding whatever angle, scale, alpha, and position it had at that instant.

| Parameter | Type   | Description |
|-----------|--------|--------------|
| sprite    | object | The sprite to stop animating |

```bas
tween.stop(chestLid)
```

## isPlaying(sprite)

Checks whether a sprite is currently animating.

| Parameter | Type   | Description |
|-----------|--------|--------------|
| sprite    | object | The sprite to check |

**Returns:** `true` if the sprite's keyframe animation is still running, `false` if it has finished (only possible when `loop` was `false`), was stopped, or was never started.

```bas
if tween.isPlaying(player) = false then
  canAttackAgain = true
endif
```

> **Note:** If any keyframe in a sequence uses `setPosition`, every keyframe in that same sequence needs its own `setPosition` call — there's no safe default to fall back to for position. A keyframe that skips it snaps the sprite to `(0, 0)` at that point in the animation, not to wherever it currently is.

> **Note:** Playback jumps straight to the first keyframe's values the moment `play` is called — there's no automatic frame that eases in from the sprite's current state. If a smooth start matters, add your own keyframe at `setTime(0)` matching the sprite's current angle, scale, alpha, and position.
