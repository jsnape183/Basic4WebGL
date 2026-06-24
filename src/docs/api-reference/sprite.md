# sprite

A `sprite` displays a single image on the canvas. Extend it using `Extends sprite` in your class file, then call `super("image.png")` in your constructor.

Position is controlled through `self.transform` — see [ObjectTransform](objecttransform).

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
