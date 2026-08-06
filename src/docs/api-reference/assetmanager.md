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

## defineRegion(newName, sourceName, x, y, width, height)

Creates a new named image from a rectangular region of an already-loaded image, without changing the original file. Use this when several different things — a background tileset, a set of character animation frames, a single icon — are packed together into one combined image file, so you can treat each piece as its own image.

The new name can be used anywhere an image filename is expected — for example in a `sprite`, `tilemap`, or `animatedsprite` constructor — exactly like a real filename from your Assets panel.

| Parameter  | Type   | Description |
|------------|--------|-------------|
| newName    | string | The name to give the new region. Must not already be used by another asset or region. |
| sourceName | string | The filename of the image to crop from, or the name of a region you defined earlier with `defineRegion`. |
| x          | number | The left edge of the region, in pixels, measured from the source's own top-left corner. |
| y          | number | The top edge of the region, in pixels, measured from the source's own top-left corner. |
| width      | number | The width of the region, in pixels. |
| height     | number | The height of the region, in pixels. |

> **Note:** `defineRegion` reads from an image that must already be loaded, so call it in `onenter()` (or later) — not in `oninit()`, which runs before your project's images finish loading.

> **Note:** If `sourceName` is itself a region you created with `defineRegion`, `x` and `y` are measured from that region's own top-left corner, not the original file's — so cropping a region out of a region works the way you'd expect.

```bas
' A single sheet.png contains a tileset in the top-left and four
' character animation frames further down the same image.
assetmanager.defineRegion("tiles", "sheet.png", 0, 0, 128, 64)
assetmanager.defineRegion("playerFrames", "sheet.png", 0, 64, 64, 16)

dim level as tilemap("tiles", 16, 16)
dim player as animatedsprite("playerFrames", 16, 16)
```
