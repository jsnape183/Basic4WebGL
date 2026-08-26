# sprite

A `sprite` displays a single image on the canvas. Extend it using `Extends sprite` in your class file, then call `super("image.png")` in your constructor.

Position is controlled through `self.transform` — see [ObjectTransform](objecttransform). The position you set is the **centre** of the sprite's image, not its top-left corner.

## Constructor

```bas
Class
Extends sprite

Constructor()
  super("player.png")
  world.add(self)
EndConstructor
```

| Parameter | Type   | Description |
|-----------|--------|-------------|
| imagePath | string | Filename of the image to display, e.g. `"player.png"` |

## setAngle(angle)

Rotates the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| angle     | number | Rotation in degrees. 0 is no rotation, 90 is a quarter turn clockwise. |

```bas
self.setAngle(45)
```

## setAlpha(a)

Sets how transparent the sprite is.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | number | Opacity from 0 (fully invisible) to 1 (fully visible) |

```bas
self.setAlpha(0.5)
```

## setScale(sx, sy)

Resizes the sprite by a multiplier.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| sx        | number | Horizontal scale. 1 is normal size, 2 is double width, 0.5 is half width. |
| sy        | number | Vertical scale. 1 is normal size, 2 is double height. |

```bas
self.setScale(2, 2)
```

## setFlip(h, v)

Mirrors the sprite horizontally or vertically.

| Parameter | Type              | Description |
|-----------|-------------------|-------------|
| h         | `true` or `false` | Pass `true` to mirror left-to-right |
| v         | `true` or `false` | Pass `true` to flip upside-down |

```bas
self.setFlip(true, false)
```

## setVisible(v)

Shows or hides the sprite without removing it from the stage.

| Parameter | Type              | Description |
|-----------|-------------------|-------------|
| v         | `true` or `false` | `true` to show, `false` to hide |

```bas
self.setVisible(false)
```

## setTexture(path)

Swaps the image displayed by the sprite.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| path      | string | Filename of the new image |

```bas
self.setTexture("player_hurt.png")
```

## width()

Returns the width of the sprite in pixels.

**Returns:** number

```bas
dim w
w = self.width()
```

## height()

Returns the height of the sprite in pixels.

**Returns:** number

```bas
dim h
h = self.height()
```

## setDepth(n)

Sets the draw order of the sprite relative to other sprites in the same container. A higher value draws in front; a lower value draws behind.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Depth value — higher values are drawn on top |

```bas
dim player as sprite("player.png")
dim enemy as sprite("enemy.png")
player.setDepth(10)
enemy.setDepth(5)
world.add(player)
world.add(enemy)
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
sword.attachTo(player)
sword.transform.setPosition(0, 0)  ' centred on the player
sword.setAngle(90)                 ' held out to the side, rotates with the player
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
sword.detach()
```
