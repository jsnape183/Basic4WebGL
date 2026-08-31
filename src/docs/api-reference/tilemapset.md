# tilemapset

A `tilemapset` loads a `.stm` file — a multi-layer tile-based level, with a background layer, a foreground layer, a collision layer, or any other named layers you want. All layers render together as one unit, in the order the layers were saved in the file (first layer at the back, last layer at the front). Use [tilemap](tilemap) instead if your level only needs one layer.

For pathfinding around a `TileMapSet`'s obstacle layers, see [pathfinding](pathfinding).

## Constructor

```bas
dim level as tilemapset("level1.stm")
world.add(level)
```

| Parameter | Type   | Description |
|-----------|--------|--------------|
| stmPath   | string | Filename of the `.stm` file in your project assets |

Like [sprite](sprite) and [tilemap](tilemap), a `tilemapset` doesn't draw itself — call `world.add(level)` to show it, and `world.remove(level)` to take it off screen. Removing it removes every layer at once.

## layer(name)

Returns one named layer from the loaded `.stm` file, so you can position it, scroll it, or check tiles on it. See [tilemaplayer](tilemaplayer) for its full method list — it has the same `tileAt`, `widthPx`, `heightPx`, `transform`, and `setDepth` you already know from [tilemap](tilemap).

| Parameter | Type   | Description |
|-----------|--------|--------------|
| name      | string | The layer's name, as it was saved in the `.stm` file |

**Returns:** a [tilemaplayer](tilemaplayer). Store it in a variable declared `as tilemaplayer` — you need the type so you can call methods on it afterwards.

```bas
dim level as tilemapset("level1.stm")
dim solidGround as tilemaplayer

function onenter()
  world.add(level)
  solidGround = level.layer("collision")
endfunction

function onupdate()
  dim tile
  tile = solidGround.tileAt(player.transform.x(), player.transform.y())
  if tile > 0 then
    print "standing on solid ground"
  endif
endfunction
```

## tileAt(name, x, y)

Returns the tile ID at a given world position on the named layer — a shortcut for calling `layer(name)` and then `tileAt(x, y)` on the result, when you just want a quick lookup and don't need to keep the layer around.

| Parameter | Type   | Description |
|-----------|--------|--------------|
| name      | string | The layer's name, as it was saved in the `.stm` file |
| x         | number | Horizontal world position in pixels |
| y         | number | Vertical world position in pixels |

**Returns:** number — the tile ID at that position, or 0 if the position is empty.

Correctly accounts for the `tilemapset`'s own `.transform` (see below) as well as the layer's — if you've moved the whole map, this still checks the right tile.

```bas
dim level as tilemapset("level1.stm")

function onenter()
  world.add(level)
endfunction

function onupdate()
  dim tile
  tile = level.tileAt("collision", player.transform.x(), player.transform.y())
  if tile > 0 then
    print "standing on solid ground"
  endif
endfunction
```

## markersByTag(tag)

Finds every marker with the given tag, painted anywhere in this tilemap using the Tilemap Editor's marker tool. Useful for placing things like enemy spawn points or item pickups visually while designing a level, instead of hardcoding their positions in code.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| tag       | string | The tag to search for |

**Returns:** Array of `Marker` objects. Returns an empty array (length 0) if no marker has that tag.

Each `Marker` has two properties:

| Property | Type   | Description |
|----------|--------|-------------|
| x        | number | World x position of the marker |
| y        | number | World y position of the marker |

```bas
dim spawnPoints = level.markersByTag("spawn")
dim i
for i = 0 to array.arrLength(spawnPoints) - 1
  dim point as Marker
  point = spawnPoints(i)
  dim enemy = new Enemy(point.x, point.y)
  world.add(enemy)
next i
```

## allMarkers()

Every marker in the map, each with its grid column, grid row, and its full tag text. Use this when you need to read the tag yourself (for example to parse `floor:2 door` into separate values) or build a table from all markers at once.

**Returns:** array of objects, each with `col`, `row`, and `tag`.

| Property | Type   | Description |
|----------|--------|-------------|
| col      | number | Grid column of the marker |
| row      | number | Grid row of the marker |
| tag      | string | The marker's full tag text |

```bas
dim level as tilemapset("level1.stm")

function onenter()
  world.add(level)
  dim all
  all = level.allMarkers()
  dim i
  for i = 0 to array.arrLength(all) - 1
    dim m
    m = all(i)
    print "marker at column " + string.str(m.col) + ", row " + string.str(m.row) + ": " + m.tag
  next i
endfunction
```

## tileWidth()

The width of one tile in the map, in pixels.

**Returns:** number.

```bas
dim level as tilemapset("level1.stm")

function onenter()
  world.add(level)
  print "each tile is " + string.str(level.tileWidth()) + " pixels wide"
endfunction
```

## tileHeight()

The height of one tile in the map, in pixels.

**Returns:** number.

```bas
dim level as tilemapset("level1.stm")

function onenter()
  world.add(level)
  print "each tile is " + string.str(level.tileHeight()) + " pixels tall"
endfunction
```

## transform

Position is controlled through `.transform` — see [ObjectTransform](objecttransform). This moves **every layer together**, useful for placing the whole map at a world position, or scrolling it as one piece. `tileAt` — both `tilemapset.tileAt(name, x, y)` above and `tilemaplayer.tileAt(x, y)` on a layer from `layer(name)` — always accounts for this offset, so tile lookups stay correct after moving the map.

```bas
dim level as tilemapset("level1.stm")

function onenter()
  world.add(level)
  level.transform.setPosition(-cameraX, 0)
endfunction
```

To scroll layers at *different* speeds instead (a parallax effect), move an individual layer's own transform rather than the `tilemapset`'s:

```bas
dim background as tilemaplayer

function onenter()
  background = level.layer("background")
endfunction

function onupdate()
  background.transform.setPosition(-cameraX / 2, 0)
endfunction
```
