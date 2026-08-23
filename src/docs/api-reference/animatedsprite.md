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

## setVelocity(vx, vy)

Sets the sprite's speed, in pixels per second, along each axis. Once set, the engine moves the sprite automatically every frame — you don't need to update its position yourself. If `collision.setupTileCollision` has been called for the current tilemap, the sprite automatically stops at solid tiles instead of passing through them.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| vx        | number | Horizontal speed in pixels per second. Positive moves right, negative moves left |
| vy        | number | Vertical speed in pixels per second. Positive moves down, negative moves up |

```bas
' Move right at 150 pixels per second
self.setVelocity(150, 0)
```

## velocityX()

Returns the sprite's current horizontal speed, as set by `setVelocity`.

**Returns:** number

```bas
dim vx
vx = self.velocityX()
```

## velocityY()

Returns the sprite's current vertical speed, as set by `setVelocity`.

**Returns:** number

```bas
dim vy
vy = self.velocityY()
```

## isBlockedUp()

Returns `true` if the sprite's movement was stopped by a solid tile above it on the most recent frame. Only meaningful after `collision.setupTileCollision` has been called and the sprite has a non-zero velocity.

**Returns:** `true` or `false`

```bas
if self.isBlockedUp() then
  self.setVelocity(self.velocityX(), 0)
endif
```

## isBlockedDown()

Returns `true` if the sprite's movement was stopped by a solid tile below it on the most recent frame — useful for detecting "standing on the ground" in a platformer.

**Returns:** `true` or `false`

```bas
if self.isBlockedDown() then
  isGrounded = true
endif
```

## isBlockedLeft()

Returns `true` if the sprite's movement was stopped by a solid tile to its left on the most recent frame.

**Returns:** `true` or `false`

```bas
if self.isBlockedLeft() then
  self.setVelocity(0, self.velocityY())
endif
```

## isBlockedRight()

Returns `true` if the sprite's movement was stopped by a solid tile to its right on the most recent frame.

**Returns:** `true` or `false`

```bas
if self.isBlockedRight() then
  self.setVelocity(0, self.velocityY())
endif
```

## attachTo(parent)

Makes this sprite follow another sprite's position and rotation automatically, like a weapon glued to a character's hand. Once attached, calling `setPosition` and `setAngle` on this sprite sets its offset and rotation **relative to the parent** — as the parent moves or spins, this sprite moves and spins along with it.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| parent    | object | The sprite (or `animatedsprite`) to attach to. |

```bas
hat.attachTo(hero)
hat.transform.setPosition(0, -12)  ' held above the hero's head
```

A few things to know:

- **Position and angle become relative to the parent.** While attached, this sprite's `transform.x()`, `transform.y()`, and angle no longer describe a position on screen — they describe an offset from the parent.
- **Depth ordering becomes relative to the parent too.** `setDepth` while attached only affects ordering among the parent's other attached sprites, not the whole game world.
- **Chains work.** If sprite `B` is attached to sprite `A`, and sprite `C` is attached to `B`, then `C` follows both of them — moving or rotating `A` moves everything in the chain. Just don't attach a sprite back onto one of its own descendants — that creates a loop.
- Attaching a sprite that's already attached to something else simply switches it to the new parent — no need to call `detach()` first.
- If you remove an attached sprite from the world with `world.remove()`, call `detach()` first — otherwise it stops updating but stays visually attached to its (still-alive) parent instead of being cleaned up.

## detach()

Stops this sprite from following whatever it was attached to with `attachTo`. It stays exactly where it was on screen at that moment; nothing resets. Calling `detach()` when the sprite isn't attached to anything does nothing.

```bas
hat.detach()
```
