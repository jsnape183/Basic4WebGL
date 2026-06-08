# AnimatedSprite Design

**Date:** 2026-06-08
**Status:** Approved

## Goal

Add an `AnimatedSprite` class to softBASIC that enables platformer-style games with walking, jumping, idle, and other frame-based animations driven by a uniform-grid spritesheet.

## Background

The existing `Sprite` class supports static images with texture swapping. It has no concept of frame sequences, animation timing, or playback state. `AnimatedSprite` is a new, independent class — no inheritance from `Sprite` — that adds these capabilities while keeping the same transform/visual API surface.

---

## BASIC API

### Construction

```basic
dim hero as new AnimatedSprite("hero.png", 48, 48)
' imagePath: path to spritesheet image (same asset system as Sprite)
' frameW:    width of each frame in pixels
' frameH:    height of each frame in pixels
```

Frame numbers are zero-based, counted left-to-right then top-to-bottom across the uniform grid.

### Defining Animations

```basic
hero.addAnim("idle",  0,  3,  8, true)
hero.addAnim("run",   4, 11, 12, true)
hero.addAnim("jump", 12, 15, 10, false)
hero.addAnim("land", 16, 18, 12, false)
' Parameters: name, startFrame, endFrame, fps, loop
' loop = true:  animation cycles forever
' loop = false: animation plays once and stops on the last frame
```

All `addAnim` calls must be made before calling `play`.

### Playback

```basic
hero.play("run")

if hero.isPlaying("jump") == false
    hero.play("idle")
endif
' isPlaying returns true if that animation is current AND still running.
' Returns false when a one-shot (loop=false) animation has completed.
```

### Transform & Visual Methods

Duplicated from `Sprite` — no inheritance, identical behaviour:

```basic
hero.setScale(2)
hero.setFlip(true, false)   ' flipX, flipY
hero.setVisible(true)
hero.setAlpha(1)
hero.setAngle(0)
hero.transform.x = 100
hero.transform.y = 200
dim w = hero.width()
dim h = hero.height()
```

---

## Engine Implementation

### New engine file: `src/components/Runner/engine/animatedSprite.js`

Provides the `_sbAnimatedSprites` mixin spread into `_sb` in `softBasicEngine.js`.

**`createAnimatedSprite(imagePath, frameW, frameH)`**
- Loads base texture via `PIXI.Texture.from(imagePath)` (same as Sprite — uses preloaded cache).
- Slices all frames: iterates rows and columns, creating `PIXI.Texture` instances with source rectangles `new PIXI.Rectangle(col*frameW, row*frameH, frameW, frameH)`.
- Creates a `PIXI.AnimatedSprite(frames)`.
- Adds to `app.stage`.
- Returns a handle: `{ pixi, animations: new Map(), currentAnim: null, playing: false, frameW, frameH }`.

**`addAnim(handle, name, startFrame, endFrame, fps, loop)`**
- Stores `{ startFrame, endFrame, fps, loop }` in `handle.animations.set(name, ...)`.
- No PIXI call at this stage.

**`playAnim(handle, name)`**
- Looks up animation definition; throws if not found.
- Extracts sub-array of textures `[startFrame..endFrame]` from the full frame array on `handle`.
- Sets `pixi.textures = subArray`.
- Sets `pixi.animationSpeed = fps / 60`.
- Sets `pixi.loop = loop`.
- Calls `pixi.gotoAndPlay(0)`.
- Sets `handle.currentAnim = name`, `handle.playing = true`.
- If `loop === false`, registers a one-shot `pixi.onComplete = () => { handle.playing = false; }`.

**`isPlayingAnim(handle, name)`**
- Returns `handle.currentAnim === name && handle.playing`.

**Shared visual methods** (duplicated from sprites.js, acting on `handle.pixi`):
`setAnimScale`, `setAnimFlip`, `setAnimVisible`, `setAnimAlpha`, `setAnimAngle`, `animWidth`, `animHeight`.

The `transform` object (`{ x, y }`) is synced to `pixi.x`/`pixi.y` via the ticker in the same pattern as existing sprites.

### `softBasicEngine.js`

```javascript
const _sb = {
  ..._sbLifecycle,
  ..._sbInput,
  ..._sbAssets,
  ..._sbDrawing,
  ..._sbStage,
  ..._sbSprites,
  ..._sbAnimatedSprites,   // new
};
```

---

## BASIC Definition File

**New file: `src/lib/Basic4WebGL/defs/animatedsprite.bas`**

A `class AnimatedSprite` that wraps engine calls via `call()`:

- Constructor: `call("_sb.createAnimatedSprite(animatedsprite_imagepath, animatedsprite_framew, animatedsprite_frameh)")`
- `addAnim(name, startFrame, endFrame, fps, loop)`: delegates to `_sb.addAnim(_handle, ...)`
- `play(name)`: delegates to `_sb.playAnim(_handle, name)`
- `isPlaying(name)`: delegates to `_sb.isPlayingAnim(_handle, name)` and returns result
- Transform/visual methods: same `call()` pattern as `Sprite`

---

## Package Integration

`animatedsprite.bas` is added to the `softgfx` package in `src/lib/Basic4WebGL/packageModules.ts`, alongside `sprite.bas`. Any project using `softgfx` automatically gets `AnimatedSprite` — no new import needed.

---

## Testing

**Test file:** `tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts`

Uses same `transpileGame` helper as `stage-clear.test.ts` — loads all standard libs including softgfx.

Tests:
1. `new AnimatedSprite(path, fw, fh)` compiles without diagnostics
2. `addAnim(name, start, end, fps, loop)` compiles without diagnostics
3. `play(name)` compiles without diagnostics
4. `isPlaying(name)` return value usable in an `if` condition
5. All visual/transform methods compile: `setScale`, `setFlip`, `setVisible`, `setAlpha`, `setAngle`, `width`, `height`
6. Full end-to-end program: construct → addAnim × 2 → play → isPlaying check in `onupdate` → zero diagnostics

---

## Constraints & Non-Goals

- Uniform grid only — no sprite atlas / JSON descriptor support
- No z-ordering API (existing stage layer model applies)
- No `AnimatedSprite` → `Sprite` inheritance
- Frame dimensions are fixed at construction time; cannot change after creation
- `addAnim` calls before first `play` only (no mid-game animation redefinition)
