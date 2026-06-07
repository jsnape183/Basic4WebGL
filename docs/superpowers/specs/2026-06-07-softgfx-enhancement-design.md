# softGfx Enhancement Design

> Living spec — approved 2026-06-07.

---

## Goal

Extend the softGfx layer so that all four showcase game types (platformer, side-scroller shooter, top-down, arcade) are buildable without workarounds. Add 15 methods across 5 modules and document 2 existing lifecycle hooks.

---

## Architecture

No compiler changes. All additions follow the existing two-layer pattern:

1. **Engine layer** (`src/components/Runner/engine/`) — JavaScript functions that call PixiJS directly. Additions go into existing files: `sprites.js`, `input.js`, `stage.js`, `drawing.js`.

2. **BASIC def layer** (`src/lib/Basic4WebGL/defs/`) — `.bas` files that expose engine functions via `call()`. Existing files: `sprite.bas`, `gfx.bas`, `stage.bas`, `text.bas`, `pen.bas`.

3. **Documentation** — `docs/language/softbasic-concepts.md`.

No new files. No parser or transpiler work.

---

## API Surface

### `Sprite` — 6 new methods

| Method | Signature | Description |
|---|---|---|
| `setScale` | `(s, sx, sy)` | Sets scale on both axes. `1` is natural size. |
| `setFlip` | `(s, h, v)` | Flips horizontally and/or vertically. Preserves scale magnitude. |
| `setVisible` | `(s, visible)` | Shows or hides the sprite without removing it from the stage. |
| `setTexture` | `(s, path)` | Swaps the sprite's image. `path` must be a pre-loaded asset. |
| `width` | `(s)` | Returns the sprite's current width in pixels (after scale). |
| `height` | `(s)` | Returns the sprite's current height in pixels (after scale). |

**`setFlip` implementation note:** PixiJS flips by negating `scale.x`/`scale.y`. The engine preserves scale magnitude — `setFlip(s, true, false)` sets `s._handle.scale.x = -Math.abs(s._handle.scale.x)`. Calling `setScale` after `setFlip` will reset the sign; call `setFlip` last if both are used.

**`setTexture` constraint:** Only images that have been declared as a `Sprite` asset elsewhere in the program are pre-loaded. Passing an unloaded path produces a blank sprite (PixiJS silently substitutes an empty texture). The docs will note this.

**softBASIC usage:**
```basic
dim player as Sprite("player_right.png")
dim playerLeft as Sprite("player_left.png")

player.setScale(2, 2)
player.setFlip(true, false)
player.setVisible(false)
player.setTexture("player_left.png")
dim w
w = player.width()
```

---

### `gfx` — 3 new methods

| Method | Signature | Description |
|---|---|---|
| `mouseX` | `()` | Returns the pointer's current X position, canvas-relative. |
| `mouseY` | `()` | Returns the pointer's current Y position, canvas-relative. |
| `mouseDown` | `()` | Returns true if any mouse button is currently held. |

**Implementation:** Three module-level variables (`_mouseX`, `_mouseY`, `_mouseDown`) in `input.js`, set by `pointermove`, `pointerdown`, and `pointerup` listeners attached to the canvas element during engine initialisation.

**Coordinate system:** Coordinates are relative to the game canvas (top-left = 0,0), matching how PixiJS reports pointer events. Not browser-window relative.

**softBASIC usage:**
```basic
function onupdate()
    if gfx.mouseDown()
        drawing.drawCircle(gfx.mouseX(), gfx.mouseY(), 10)
    endif
endfunction
```

---

### `stage` — 3 new methods

| Method | Signature | Description |
|---|---|---|
| `width` | `()` | Returns the canvas width in pixels. |
| `height` | `()` | Returns the canvas height in pixels. |
| `setBackground` | `(r, g, b)` | Sets the canvas background colour (0–255 per channel). |

**`setBackground` implementation:** Converts RGB to a hex integer and sets `app.renderer.background.color` (PixiJS v7 API).

**softBASIC usage:**
```basic
function onenter()
    stage.setBackground(20, 20, 40)
    dim cx
    cx = stage.width() / 2
endfunction
```

---

### `Text` — 1 new method

| Method | Signature | Description |
|---|---|---|
| `setStyle` | `(t, size, r, g, b)` | Sets font size and fill colour in one call. |

**Implementation:** Updates `t._handle.style.fontSize` and `t._handle.style.fill` (PixiJS TextStyle properties). Colour is supplied as separate r/g/b channels (0–255); the engine converts to hex.

**Design rationale:** One combined call rather than separate `setFontSize`/`setColor` — consistent with the "fewer, higher-level methods" principle.

**softBASIC usage:**
```basic
dim label as Text("Score: 0", 10, 10)
label.setStyle(24, 255, 255, 0)
```

---

### `pen` — 1 new method

| Method | Signature | Description |
|---|---|---|
| `setLineWidth` | `(n)` | Sets the stroke width for subsequent draw calls. Default is 2. |

**Implementation:** Add `_lineWidth` to the pen state object in `drawing.js` alongside `_fillColor` and `_lineColor`. The existing `drawLine`/`drawRect`/`drawCircle` functions read this value instead of the hardcoded `2`.

**softBASIC usage:**
```basic
pen.setLineWidth(4)
pen.setLineColor(255, 0, 0)
drawing.drawRect(10, 10, 100, 50)
```

---

### Lifecycle hooks — documentation only

`onkeydown(keyCode)` and `onkeyup(keyCode)` are already wired in the engine (`softBasicEngine.js` registers global `keydown`/`keyup` listeners and dispatches to any module that defines these functions). They need no engine changes — only documentation added to `softbasic-concepts.md`.

**softBASIC usage:**
```basic
function onkeydown(k)
    if k == 32
        jump()
    endif
endfunction

function onkeyup(k)
    ' key released
endfunction
```

Key codes are standard browser `keyCode` values (e.g. 32 = Space, 37–40 = arrow keys).

---

## Testing

All new methods get compile-pass tests following the existing pattern in `tests/lib/Basic4WebGL/unit/transpiler/`. Each test verifies:

1. The snippet compiles without diagnostics.
2. The emitted JS contains the expected token (e.g. `scale.set`, `_mouseX`, `background.color`).

No runtime/canvas tests — those require a browser environment and are out of scope for the unit test suite.

Test file: `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts` (new).

---

## Out of Scope

- Spritesheet / frame animation — separate future project
- Tile mapping — separate future project
- Drawing layer persistence / clear-per-frame refactor — deferred
- Touch input — deferred
- Sound — deferred
