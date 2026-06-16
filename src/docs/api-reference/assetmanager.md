# assetmanager

The `assetmanager` module lets you retrieve images from your project's asset library by name. Images and audio files are loaded automatically when your project starts — you only need this module when you want to pass an image reference to your own code rather than a filename string.

Audio files (`.mp3`, `.wav`, `.ogg`) are also auto-loaded, but are accessed through the `audio` class, not through `assetmanager`.

## loadImage(name)

Retrieves a loaded image from your project assets by its filename.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The filename of the image, as it appears in your project's Assets panel, e.g. `"player.png"` |

**Returns:** object — the loaded image. Sprites and tilemaps accept a filename string directly in their constructors, so you usually do not need to use this return value.

> **Note:** If the filename doesn't match an image in your Assets panel exactly, this will throw an error.

```bas
dim playerImage
playerImage = assetmanager.loadImage("player.png")
```
