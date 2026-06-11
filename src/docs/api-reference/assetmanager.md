# assetmanager

The `assetmanager` module handles loading images so they can be used by sprites and tilemaps. Load your images in `onenter` before creating objects that use them.

## loadImage(name)

Loads an image asset by its filename (as it appears in your project's Assets panel).

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The filename of the image, e.g. `"player.png"` |

```bas
function onenter()
  assetmanager.loadImage("player.png")
  assetmanager.loadImage("background.png")
endfunction
```
