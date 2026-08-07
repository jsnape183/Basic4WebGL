# pathfinding

The `pathfinding` module lets sprites navigate around obstacles defined by a `TileMapSet`'s layers, using pathfinding to route around walls instead of moving in a straight line. Include the **softGfx** package to use it.

Call `setup` once before using `navigateTo`, `isNavigating`, or `stopNavigating` — calling any of those first gives a runtime error.

## setup(tileMapSet, blockingLayers)

Builds the navigation grid from a `TileMapSet`, using the named layers as obstacles. Call this once, typically when a scene starts. Calling it again (for example on a scene change) replaces the previous grid.

Any layer not listed in `blockingLayers` is ignored for navigation — a good fit for decorative "floor" or "background" layers that shouldn't block movement.

| Parameter      | Type   | Description |
|----------------|--------|-------------|
| tileMapSet     | object | The TileMapSet to build the navigation grid from |
| blockingLayers | array  | Names of the layers whose tiles block movement |

```bas
dim layers(0)
array.push(layers, "walls")
array.push(layers, "obstacles")
pathfinding.setup(tileMapSet, layers)
```

## setRecomputeInterval(ms)

Sets the minimum time, in milliseconds, between path recalculations for a single sprite. Optional — defaults to `200`. Calling `navigateTo` every frame with a moving target (like a chasing enemy) is designed to be cheap: a new path is only calculated when the target has moved to a different tile **and** this interval has passed since the last calculation.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| ms        | number | Minimum milliseconds between path recalculations |

```bas
pathfinding.setRecomputeInterval(300)
```

## navigateTo(sprite, x, y, speed)

Moves a sprite toward `(x, y)`, routing around any blocking tiles. Call this every frame — for example from an enemy's `onupdate` — passing the target's current position; it's safe and cheap to call repeatedly even while already navigating.

If `(x, y)` lands on a blocked or off-grid tile, the sprite paths to the nearest walkable tile instead.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| sprite    | object | The sprite to move |
| x         | number | Target x position |
| y         | number | Target y position |
| speed     | number | Movement speed in pixels per second |

```bas
class Enemy
  dim sprite

  function onupdate(delta)
    pathfinding.navigateTo(self.sprite, player.x(), player.y(), 120)
  endfunction
endclass
```

## isNavigating(sprite)

Checks whether a sprite is currently following a path.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| sprite    | object | The sprite to check |

**Returns:** `true` if the sprite is still moving toward its target, `false` if it has arrived, was never given a target, or no path could be found.

```bas
if pathfinding.isNavigating(enemy.sprite) = false then
  playAttackAnimation()
endif
```

## stopNavigating(sprite)

Immediately stops a sprite's navigation. The sprite stops where it is — call `navigateTo` again to resume.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| sprite    | object | The sprite to stop |

```bas
pathfinding.stopNavigating(enemy.sprite)
```
