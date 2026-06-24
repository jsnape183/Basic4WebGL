# animatedsprite

An `animatedsprite` plays frame-by-frame animations from a sprite sheet. The sprite sheet must be a grid of equal-sized frames. Extend it using `Extends animatedsprite` in your class file.

Position is controlled through `self.transform` — see [ObjectTransform](objecttransform).

## Constructor

```bas
Class
Extends animatedsprite

Constructor()
  super("character.png", 32, 32)
  world.add(self)
EndConstructor
```

| Parameter | Type   | Description |
|-----------|--------|-------------|
| imagePath | string | Filename of the sprite sheet |
| frameW    | number | Width of each frame in pixels |
| frameH    | number | Height of each frame in pixels |

## addAnim(name, startFrame, endFrame, fps, loop)

Defines a named animation from a range of frames on the sprite sheet. Frames are numbered from 0 starting at the top-left, going left to right.

| Parameter  | Type              | Description |
|------------|-------------------|-------------|
| name       | string            | A name for this animation, e.g. `"walk"`, `"jump"` |
| startFrame | number            | Index of the first frame (0 = top-left frame) |
| endFrame   | number            | Index of the last frame (inclusive) |
| fps        | number            | How many frames to show per second |
| loop       | `true` or `false` | `true` to repeat the animation, `false` to play once |

```bas
function onenter()
  self.addAnim("walk", 0, 7, 12, true)
  self.addAnim("jump", 8, 11, 10, false)
endfunction
```

## play(name)

Starts playing a named animation.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The animation to play, as defined with `addAnim` |

```bas
self.play("walk")
```

## isPlaying(name)

Checks whether a specific animation is currently playing.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The animation name to check |

**Returns:** `true` if the named animation is playing, `false` if not.

```bas
if not self.isPlaying("jump") then
  self.play("walk")
endif
```

## stop()

Stops the current animation and clears the active animation name. After calling `stop()`, `isPlaying()` returns `false` for all animations.

```bas
self.stop()
```

## setSpriteSheet(imagePath, frameW, frameH)

Swaps the sprite sheet at runtime and resets all named animations. Use this to switch a character between entirely different sprite sheets — for example, switching from a walk sheet to a larger combat sheet. After calling `setSpriteSheet`, call `addAnim` again to define animations on the new sheet.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| imagePath | string | Filename of the new sprite sheet |
| frameW    | number | Width of each frame on the new sheet |
| frameH    | number | Height of each frame on the new sheet |

```bas
function switchToCombat()
  self.setSpriteSheet("hero-combat.png", 64, 64)
  self.addAnim("attack", 0, 5, 12, false)
  self.play("attack")
endfunction
```

## setAngle(angle)

Rotates the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| angle     | number | Rotation in degrees |

```bas
self.setAngle(90)
```

## setAlpha(a)

Sets the transparency of the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | Opacity from 0 (invisible) to 1 (fully visible) |

```bas
self.setAlpha(0.8)
```

## setScale(sx, sy)

Resizes the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| sx        | number | Horizontal scale multiplier |
| sy        | number | Vertical scale multiplier |

```bas
self.setScale(2, 2)
```

## setFlip(h, v)

Mirrors the sprite.

| Parameter | Type              | Description |
|-----------|-------------------|-------------|
| h         | `true` or `false` | `true` to mirror left-to-right |
| v         | `true` or `false` | `true` to flip upside-down |

```bas
self.setFlip(true, false)
```

## setVisible(v)

Shows or hides the sprite.

| Parameter | Type              | Description |
|-----------|-------------------|-------------|
| v         | `true` or `false` | `true` to show, `false` to hide |

```bas
self.setVisible(false)
```

## width()

Returns the frame width in pixels.

**Returns:** number

```bas
dim w
w = self.width()
```

## height()

Returns the frame height in pixels.

**Returns:** number

```bas
dim h
h = self.height()
```

## setDepth(n)

Sets the draw order of the animated sprite relative to other sprites in the same container. A higher value draws in front; a lower value draws behind.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Depth value — higher values are drawn on top |

```bas
dim hero as animatedsprite("hero.png", 48, 48)
dim shadow as animatedsprite("shadow.png", 48, 48)
hero.setDepth(10)
shadow.setDepth(1)
world.add(hero)
world.add(shadow)
```
