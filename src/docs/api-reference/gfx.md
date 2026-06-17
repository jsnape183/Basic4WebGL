# gfx

The `gfx` module provides legacy collision detection. Include the **softGfx** package in your project to use it.

For keyboard and mouse input, see [input](input).

For collision detection, use the [collision](collision) module — it provides `spriteCollide`, `circleCollide`, `raycast`, and more.

## boxCollide(a, b)

> **Deprecated.** Use [`collision.spriteCollide(a, b)`](collision) instead. `gfx.boxCollide` is kept for backward compatibility and will not be removed, but new code should use the `collision` module.

Checks whether two sprites overlap using their bounding boxes.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | object | First sprite instance |
| b         | object | Second sprite instance |

**Returns:** `true` if the sprites overlap, `false` if they do not.

```bas
' Preferred
if collision.spriteCollide(player, enemy) then
  player.takeDamage(10)
endif

' Also works (deprecated)
if gfx.boxCollide(player, enemy) then
  player.takeDamage(10)
endif
```
