# collision

The `collision` module provides six functions for detecting overlaps, proximity, and line-of-sight between sprites, one for setting up automatic tilemap collision, and two for changing which tiles are solid while the game is running. Include the **softGfx** package to use it.

## spriteCollide(a, b)

Tests whether two sprites overlap using their bounding boxes. The simplest way to detect two sprites touching.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | object | First sprite |
| b         | object | Second sprite |

**Returns:** `true` if the sprites overlap, `false` if not.

```bas
if collision.spriteCollide(player, enemy) then
  gameOver()
endif
```

## boxCollide(x1, y1, w1, h1, x2, y2, w2, h2)

Tests whether two axis-aligned rectangles overlap. Use this when you want to specify the exact collision size instead of relying on the sprite bounds.

`x` and `y` are the **centre** of each rectangle (consistent with `drawing.drawRect`).

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x1        | number | Centre x of the first box |
| y1        | number | Centre y of the first box |
| w1        | number | Width of the first box |
| h1        | number | Height of the first box |
| x2        | number | Centre x of the second box |
| y2        | number | Centre y of the second box |
| w2        | number | Width of the second box |
| h2        | number | Height of the second box |

**Returns:** `true` if the boxes overlap, `false` if not.

```bas
dim px = player.transform.x()
dim py = player.transform.y()
if collision.boxCollide(px, py, 32, 48, ex, ey, 40, 40) then
  gameOver()
endif
```

## circleCollide(a, radiusA, b, radiusB)

Tests whether two circles overlap. Uses the distance between sprite centres and the sum of their radii. Good for round sprites or when you want smooth corner behaviour.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| a         | object | First sprite |
| radiusA   | number | Radius of the first circle in pixels |
| b         | object | Second sprite |
| radiusB   | number | Radius of the second circle in pixels |

**Returns:** `true` if the circles overlap, `false` if not.

```bas
if collision.circleCollide(coin, 12, player, 20) then
  collectCoin()
endif
```

## pointInBox(x, y, sprite)

Tests whether a point falls inside a sprite's bounding box. Most useful for detecting mouse clicks on sprite buttons.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | x coordinate of the point |
| y         | number | y coordinate of the point |
| sprite    | object | Sprite whose bounding box to test |

**Returns:** `true` if the point is inside the sprite, `false` if not.

```bas
if collision.pointInBox(input.mouseX(), input.mouseY(), btn) then
  onClick()
endif
```

## raycast(x, y, angle, distance, sprites)

Casts a ray from a point in a given direction and returns the **first** sprite it hits, or `false` if nothing is hit within range.

Angle is in degrees: 0 = right, 90 = down, 180 = left, 270 = up.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Ray origin x |
| y         | number | Ray origin y |
| angle     | number | Direction in degrees |
| distance  | number | Maximum ray length in pixels |
| sprites   | array  | Array of sprites to test against |

**Returns:** The first sprite hit (nearest to origin), or `false` if nothing is hit.

```bas
dim hit = collision.raycast(player.transform.x(), player.transform.y(), 270, 300, enemies)
if hit <> false then
  hit.destroy()
endif
```

## raycastAll(x, y, angle, distance, sprites)

Same as `raycast` but returns **all** sprites hit, as an array of `rayhit` objects sorted nearest first. Returns an empty array (length 0) if nothing is hit.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Ray origin x |
| y         | number | Ray origin y |
| angle     | number | Direction in degrees |
| distance  | number | Maximum ray length in pixels |
| sprites   | array  | Array of sprites to test against |

**Returns:** Array of `rayhit` objects sorted nearest first.

Each `rayhit` has two properties:

| Property | Type   | Description |
|----------|--------|-------------|
| sprite   | object | The sprite that was hit |
| distance | number | Distance in pixels from the ray origin to the hit point |

```bas
dim hits = collision.raycastAll(player.transform.x(), player.transform.y(), 45, 400, enemies)
dim i
for i = 0 to array.arrLength(hits) - 1
  dim h as rayhit
  h = hits(i)
  if h.distance < 150 then
    h.sprite.destroy()
  endif
next i
```

## setupTileCollision(tileMapSet)

Turns on automatic collision between every sprite with a velocity (set via `setVelocity`) and the solid tiles painted into the given tilemap's collision layer. Call this once — typically in a scene's `onenter()`, right after loading the tilemap — and every sprite moving with `setVelocity` will automatically stop at solid tiles from then on, until the next scene switch or the next call to `setupTileCollision`.

Only one tilemap's collision can be active at a time — calling this again replaces the previous one.

| Parameter  | Type   | Description |
|------------|--------|-------------|
| tileMapSet | object | A `TileMapSet` loaded from a `.stm` file containing at least one collision layer (painted in the Tilemap Editor) |

```bas
Class
Extends scenemanager.scene

dim level

function onenter()
  self.level = new TileMapSet("level1.stm")
  world.add(self.level)
  collision.setupTileCollision(self.level)
endfunction

EndClass
```

## setTileSolid(x, y, solid)

Changes whether the tile at a position blocks movement, while the game is running — the tilemap's collision layer only sets the *starting* state; this changes it. Use this for things like a locked door that becomes passable once the player has picked up a key.

| Parameter | Type              | Description |
|-----------|-------------------|-------------|
| x         | number            | X position, in pixels, of a point inside the tile to change |
| y         | number            | Y position, in pixels, of a point inside the tile to change |
| solid     | `true` or `false` | `true` to block movement through this tile, `false` to allow it |

A position outside the tilemap is silently ignored.

> **Note:** Throws an error if `collision.setupTileCollision` hasn't been called yet.

```bas
if player.hasKey then
  collision.setTileSolid(doorX, doorY, false)
endif
```

## isTileSolid(x, y)

Returns whether the tile at a position currently blocks movement — reflects any changes already made with `setTileSolid`, not just the tilemap's original collision layer.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | X position, in pixels, of a point inside the tile to check |
| y         | number | Y position, in pixels, of a point inside the tile to check |

**Returns:** `true` or `false`. A position outside the tilemap returns `false`.

> **Note:** Throws an error if `collision.setupTileCollision` hasn't been called yet.

```bas
if not collision.isTileSolid(doorX, doorY) then
  self.showText("The door is open.")
endif
```

## Note: gfx.boxCollide (deprecated)

`gfx.boxCollide(a, b)` is a deprecated alias for `collision.spriteCollide(a, b)`. It will not be removed, so existing code continues to work — but new code should use `collision.spriteCollide` directly.
