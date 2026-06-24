# tilemap

A `tilemap` renders a tile-based level on the canvas. It takes a tile sheet (a grid of equally-sized tiles) and a JSON file describing where each tile goes. Extend it using `Extends tilemap` in your class file.

Position is controlled through `self.transform` — see [ObjectTransform](objecttransform).

## Constructor

```bas
Class
Extends tilemap

Constructor()
  super("tiles.png", 32, 32)
  world.add(self)
EndConstructor
```

| Parameter   | Type   | Description |
|-------------|--------|-------------|
| tilesetPath | string | Filename of the tile sheet image |
| tileW       | number | Width of each tile in pixels |
| tileH       | number | Height of each tile in pixels |

## load(jsonPath)

Loads a tilemap layout from a JSON file in your project assets.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| jsonPath  | string | Filename of the JSON layout file |

```bas
function onenter()
  self.load("level1.json")
endfunction
```

## tileAt(x, y)

Returns the tile ID at a given world position. Useful for checking what the player is standing on.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| x         | number | Horizontal world position in pixels |
| y         | number | Vertical world position in pixels |

**Returns:** number — the tile ID at that position, or 0 if the position is empty.

```bas
dim tile
tile = self.tileAt(player.transform.x(), player.transform.y())
if tile = 1 then
  print "standing on grass"
endif
```

## widthPx()

Returns the total width of the tilemap in pixels.

**Returns:** number

```bas
dim mapW
mapW = self.widthPx()
```

## heightPx()

Returns the total height of the tilemap in pixels.

**Returns:** number

```bas
dim mapH
mapH = self.heightPx()
```

## setDepth(n)

Sets the draw order of the tilemap relative to sprites and other tilemaps in the same container. A higher value draws in front; a lower value draws behind.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| n         | number | Depth value — higher values are drawn on top |

```bas
dim floor as tilemap("tileset.png", 32, 32)
dim walls as tilemap("tileset.png", 32, 32)
floor.setDepth(0)
walls.setDepth(1)
world.add(floor)
world.add(walls)
```
