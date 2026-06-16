# Packages

Packages are pre-built libraries included in your project to provide additional functionality.

## Adding a Package

Packages are added via the project settings in the softBASIC IDE. Once added, their modules are available by name.

## softGfx

The main first-party package. Provides graphics, animation, and asset management.

**Modules:**

| Module | Description |
|--------|-------------|
| `gfx` | Canvas setup and frame management |
| `drawing` | Primitive drawing (lines, rectangles, circles) |
| `stage` | Scene/entity management |
| `pen` | Drawing state (colour, line width) |
| `assetmanager` | Asset loading and management |
| `ObjectTransform` | Position, scale, rotation for sprites |
| `sprite` | Static image sprites |
| `animatedsprite` | Frame-animated sprites |
| `text` | Text rendering |
| `tilemap` | Tile-based map rendering |
| `audio` | Sound effects and background music |

## Sprite

Renders a static image. Position, scale and rotation are managed via `self.transform`.

```bas
Class
Extends sprite

Constructor()
  super("bunny.png")
EndConstructor

function onenter()
  self.transform.setPosition(100, 200)
endfunction
```

## AnimatedSprite

Like `Sprite` but plays through animation frames.

```bas
Class
Extends animatedsprite

Constructor()
  super("walk.png", frameWidth, frameHeight, frameCount, fps)
EndConstructor

function onenter()
  self.transform.setPosition(50, 50)
  self.play()
endfunction
```

## ObjectTransform

Holds position, scale, and rotation. Accessed via `.transform` on sprite/animatedsprite/tilemap instances.

```bas
self.transform.setPosition(x, y)
self.transform.x()      ' get x position
self.transform.y()      ' get y position
```

## TileMap

Renders a tile-based map.

```bas
Class
Extends tilemap

Constructor()
  super("tileset.png", tileWidth, tileHeight)
EndConstructor
```

## Audio

Plays sound effects and background music from assets in your project.

```bas
dim shoot as audio("shoot.wav")
dim music  as audio("music.mp3")

function onenter()
  music.setVolume(0.4)
  music.playLoop()
endfunction

function onupdate(delta)
  if input.getKeyDown(32) then
    shoot.play()
  endif
endfunction
```

## assetmanager

Loads and caches assets.

```bas
assetmanager.load("player.png")
```

## Related Topics

- [Classes](classes)
- [Constructors](constructors)
- [Class Composition](class-composition)
