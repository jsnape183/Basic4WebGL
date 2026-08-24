# tilemaplayer

A `tilemaplayer` is one layer from a loaded [tilemapset](tilemapset) — a background, a foreground, a collision layer, or any other named layer in a `.stm` file. You never create a `tilemaplayer` yourself; you get one back from `tilemapset.layer(name)`.

A `tilemaplayer` works exactly like a [tilemap](tilemap): same tile lookups, same position control, same draw-order control.

## Constructor

There is no constructor — a `tilemaplayer` is only ever obtained from `tilemapset.layer(name)`:

```bas
dim level as tilemapset("level1.stm")
dim solidGround as tilemaplayer

function onenter()
  world.add(level)
  solidGround = level.layer("collision")
endfunction
```

## tileAt(x, y)

Returns the tile ID at a given world position on this layer. Useful for checking what the player is standing on.

| Parameter | Type   | Description |
|-----------|--------|--------------|
| x         | number | Horizontal world position in pixels |
| y         | number | Vertical world position in pixels |

**Returns:** number — the tile ID at that position, or 0 if the position is empty.

```bas
dim tile
tile = solidGround.tileAt(player.transform.x(), player.transform.y())
if tile > 0 then
  print "standing on solid ground"
endif
```

## setTile(x, y, tileId)

Changes which tile is drawn at a given world position on this layer — useful for a door that changes appearance once the player has a key, a switch that flips a floor tile, or breaking a wall open at runtime.

| Parameter | Type   | Description |
|-----------|--------|--------------|
| x         | number | Horizontal world position in pixels |
| y         | number | Vertical world position in pixels |
| tileId    | number | The tile ID to place there. `0` clears the tile (leaves it empty). |

```bas
' A locked door made of two tiles, swapped to their open versions once the
' player picks up the key.
dim floorLayer as tilemaplayer

function onenter()
  floorLayer = level.layer("floor")
endfunction

function onKeyCollected()
  floorLayer.setTile(576, 176, 23)
  floorLayer.setTile(592, 176, 24)
  collision.setTileSolid(576, 176, false)
  collision.setTileSolid(592, 176, false)
endfunction
```

> **Note:** `setTile` only changes what's drawn — it doesn't touch collision. Pair it with `collision.setTileSolid` (see [collision](collision)) if the tile you're changing should also stop blocking or start blocking movement.

## widthPx()

Returns the total width of this layer in pixels.

**Returns:** number

```bas
dim mapW
mapW = solidGround.widthPx()
```

## heightPx()

Returns the total height of this layer in pixels.

**Returns:** number

```bas
dim mapH
mapH = solidGround.heightPx()
```

## setDepth(n)

Sets this layer's draw order relative to sprites and other layers in the same container. A higher value draws in front; a lower value draws behind.

| Parameter | Type   | Description |
|-----------|--------|--------------|
| n         | number | Depth value — higher values are drawn on top |

```bas
dim background as tilemaplayer
dim foreground as tilemaplayer

function onenter()
  background = level.layer("background")
  foreground = level.layer("foreground")
  background.setDepth(0)
  foreground.setDepth(1)
endfunction
```

## transform

Position is controlled through `.transform` — see [ObjectTransform](objecttransform). Useful for scrolling one layer independently for a parallax effect:

```bas
dim background as tilemaplayer

function onenter()
  background = level.layer("background")
endfunction

function onupdate()
  background.transform.setPosition(-cameraX / 2, 0)
endfunction
```
