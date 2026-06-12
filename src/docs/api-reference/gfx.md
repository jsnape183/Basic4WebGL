# gfx

The `gfx` module provides collision detection. Include the **softGfx** package in your project to use it.

For keyboard and mouse input, see [input](input).

## boxCollide(a, b)

Checks whether two sprites overlap. Uses a simple bounding-box test — if the rectangular areas of the two sprites touch or overlap, this returns `true`.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | object | First sprite instance |
| b         | object | Second sprite instance |

**Returns:** `true` if the sprites overlap, `false` if they do not.

```bas
if gfx.boxCollide(player, enemy) then
  player.takeDamage(10)
endif
```
