# assetmanager

The `assetmanager` module lets you retrieve images from your project's asset library by name. Images are loaded automatically when your project starts — you only need this module when you want to pass an image reference to your own code rather than a filename string.

## loadImage(name)

Retrieves a loaded image from your project assets by its filename.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The filename of the image, as it appears in your project's Assets panel, e.g. `"player.png"` |

**Returns:** object — the image asset, ready to use.

> **Note:** If the filename doesn't match an image in your Assets panel exactly, this will throw an error. Sprites and tilemaps find their images automatically from the filename you pass to their constructor — you usually don't need to call `loadImage` directly.

```bas
dim playerImage
playerImage = assetmanager.loadImage("player.png")
```
