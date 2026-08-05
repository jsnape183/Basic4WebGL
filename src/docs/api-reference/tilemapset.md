# tilemapset

A `tilemapset` loads a `.stm` file — a multi-layer tile-based level, with a background layer, a foreground layer, a collision layer, or any other named layers you want. Each layer renders automatically as soon as the `tilemapset` is created, in the order the layers were saved in the file (first layer at the back, last layer at the front). Use [tilemap](tilemap) instead if your level only needs one layer.

## Constructor

```bas
dim level as tilemapset("level1.stm")
```

| Parameter | Type   | Description |
|-----------|--------|--------------|
| stmPath   | string | Filename of the `.stm` file in your project assets |

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

Scrolling a single layer for a parallax effect:

```bas
dim background as tilemaplayer

function onenter()
  background = level.layer("background")
endfunction

function onupdate()
  background.transform.setPosition(-cameraX / 2, 0)
endfunction
```
