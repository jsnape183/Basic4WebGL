# Camera System Implementation Design

## Goal

Add a `camera` module, a `world` module, and a `hud` module to softBASIC. The camera lets developers scroll a game world larger than the screen, with follow-target and free-position modes, optional bounds clamping, and smooth tracking. The `world` and `hud` modules replace the deprecated `stage` module: world objects move with the camera; HUD objects stay fixed on screen.

---

## API

### `camera` module

```bas
camera.follow(target, speed)    ' follow a sprite/text each frame; speed 0=snap, e.g. 0.1=smooth
camera.setPosition(x, y)        ' move to world position; detaches any follow target
camera.setBounds(width, height) ' enable clamping so camera never exposes space past the world edge
camera.x()                      ' return current camera x in world space
camera.y()                      ' return current camera y in world space
```

`camera.follow(target, speed)` centres `target` on screen. `speed` is a lerp factor 0–1: 0 snaps instantly, values like 0.05–0.2 produce smooth tracking. Calling `camera.setPosition()` while in follow mode cancels the follow target. `camera.setBounds()` is optional — without it the camera moves freely.

### `world` module

```bas
world.add(obj)    ' add sprite/text/tilemap to world space (moves with camera)
world.remove(obj) ' remove from world
world.clear()     ' remove all world objects
```

### `hud` module

```bas
hud.add(obj)    ' add sprite/text to the HUD layer (stays fixed on screen)
hud.remove(obj) ' remove from HUD
hud.clear()     ' remove all HUD objects
```

### `stage` (deprecated)

`stage.add` → `world.add`, `stage.remove` → `world.remove`, `stage.clear` → clears both world and HUD. All three remain in the engine and continue to work; they emit no runtime warning (BASIC has no console for that). The docs and tutorials are updated to use `world.*` instead.

---

## Behaviour

### Coordinate convention

Camera position `(camX, camY)` represents the **world position visible at the top-left corner of the screen** — consistent with the engine's existing coordinate system where (0,0) is top-left. `worldContainer.position.set(-camX, -camY)` places the world correctly.

### Follow mode

When `camera.follow(target, speed)` is called, the camera's desired position centres the target on screen:

```
desiredX = target.position.x - screenWidth / 2
desiredY = target.position.y - screenHeight / 2
```

If `speed = 0`, the camera snaps immediately. Otherwise:

```
camX = camX + (desiredX - camX) * speed
camY = camY + (desiredY - camY) * speed
```

`target` is a PIXI display object — sprite, text, animatedsprite, etc. — and `target.position.x/y` is read directly. This works for any object the engine returns.

### Free camera

`camera.setPosition(x, y)` sets `camX/camY` directly and clears `_followTarget`. `(0, 0)` shows the world origin at the top-left of the screen. The camera holds that position until another `follow` or `setPosition` call.

### Bounds clamping

`camera.setBounds(worldWidth, worldHeight)` stores the bounds. Each frame, after computing `camX/camY`, the camera clamps so the viewport never exposes space outside the world:

```
camX = clamp(camX, 0, worldWidth - screenWidth)
camY = clamp(camY, 0, worldHeight - screenHeight)
```

Without `setBounds`, no clamping is applied. Clamping is re-applied each frame after lerp so it works with both follow and free modes.

### Camera position in world space

`camera.x()` returns `camX`, `camera.y()` returns `camY`. These are the world coordinates visible at the **top-left** of the screen. Developers use these to position effects relative to the viewport (e.g., spawn enemies at `camera.x() + screenWidth`).

### Container layout

```
app.stage
├── worldContainer   (position: -camX + screenW/2, -camY + screenH/2)
│   └── all world objects
└── hudContainer     (position: 0, 0 — never moves)
    └── all HUD objects
```

The camera applies its position by setting `worldContainer.position.set(screenW/2 - camX, screenH/2 - camY)` each tick.

### Scene switch

`scenemanager` internally calls `_sb.clear()` (via `this.clear()` in `scene.js`). After this change, `_sb.clear` is the former `stage.clear` — it clears both `worldContainer` and `hudContainer` and resets `_sbInstances`. The camera state (`camX`, `camY`, `_followTarget`, `_bounds`) is also reset on clear so a new scene starts with a default camera at (0, 0).

---

## Architecture

### New files

| File | Purpose |
|------|---------|
| `src/lib/Basic4WebGL/defs/camera.bas` | Module def — follow, setPosition, setBounds, x, y |
| `src/lib/Basic4WebGL/defs/world.bas` | Module def — add, remove, clear |
| `src/lib/Basic4WebGL/defs/hud.bas` | Module def — add, remove, clear |
| `src/components/Runner/engine/camera.js` | `_sbCamera` engine object |

### Modified files

| File | Change |
|------|--------|
| `src/components/Runner/engine/stage.js` | Add `worldContainer`, `hudContainer`; change `addToStage` to add to worldContainer; add `addToWorld`, `addToHud`, `removeFromWorld`, `removeFromHud`, `clearWorld`, `clearHud`; `clear()` clears both containers + resets camera state |
| `src/components/Runner/softBasicEngine.js` | Add `..._sbCamera` |
| `src/components/Runner/index.tsx` | Import `camera.js` |
| `src/constants/packageModules.ts` | Add `camera`, `world`, `hud` |
| `src/constants/firstPartyPackages.ts` | Add `'camera'`, `'world'`, `'hud'` to softGfx |
| `src/lib/Basic4WebGL/keywords.ts` | No changes needed |
| `src/docs/api-reference/stage.md` | Mark deprecated, redirect to world/hud |
| `src/docs/api-reference/world.md` | New — world module reference |
| `src/docs/api-reference/hud.md` | New — hud module reference |
| `src/docs/api-reference/camera.md` | New — camera module reference |
| `src/docs/api-reference/scene.md` | Replace all `stage.add` with `world.add` |
| `src/docs/api-reference/sprite.md` | Replace `stage.add` with `world.add` in constructor example |
| `src/docs/api-reference/animatedsprite.md` | Same |
| `src/docs/api-reference/text.md` | Same |
| `src/docs/api-reference/tilemap.md` | Same |
| `src/docs/tutorials/*.md` | Replace all `stage.add` with `world.add` (11 tutorial files) |
| `src/docs/manifest.ts` | Add world, hud, camera entries; update stage entry |

### `_sbCamera` engine object sketch

```js
const _sbCamera = {
  _camX: 0, _camY: 0,
  _followTarget: null, _followSpeed: 0,
  _boundsW: null, _boundsH: null,

  cameraFollow(target, speed) {
    this._followTarget = target;
    this._followSpeed = speed;
  },
  cameraSetPosition(x, y) {
    this._followTarget = null;
    this._camX = x;
    this._camY = y;
  },
  cameraSetBounds(w, h) {
    this._boundsW = w;
    this._boundsH = h;
  },
  cameraX() { return this._camX; },
  cameraY() { return this._camY; },

  _cameraUpdate() {
    if (this._followTarget) {
      const sw = app.renderer.width, sh = app.renderer.height;
      const desiredX = this._followTarget.position.x - sw / 2;
      const desiredY = this._followTarget.position.y - sh / 2;
      if (this._followSpeed === 0) {
        this._camX = desiredX; this._camY = desiredY;
      } else {
        this._camX += (desiredX - this._camX) * this._followSpeed;
        this._camY += (desiredY - this._camY) * this._followSpeed;
      }
    }
    if (this._boundsW !== null) {
      const sw = app.renderer.width, sh = app.renderer.height;
      this._camX = Math.max(0, Math.min(this._boundsW - sw, this._camX));
      this._camY = Math.max(0, Math.min(this._boundsH - sh, this._camY));
    }
    worldContainer.position.set(-this._camX, -this._camY);
  },

  _cameraReset() {
    this._camX = 0; this._camY = 0;
    this._followTarget = null; this._followSpeed = 0;
    this._boundsW = null; this._boundsH = null;
    worldContainer.position.set(0, 0);
  },
};
```

`_cameraUpdate()` is called from `_sbScene._update` (or `_sbLifecycle._update`) each tick, after lifecycle updates. `_cameraReset()` is called by `_sbStage.clear()` on scene switch.

`worldContainer` and `hudContainer` are declared at engine scope in `stage.js` so they are accessible to the camera module.

### `.bas` def files

**`camera.bas`:**
```bas
function follow(target, speed)
    call("_sb.cameraFollow(follow_target, follow_speed)")
endfunction

function setPosition(x, y)
    call("_sb.cameraSetPosition(setposition_x, setposition_y)")
endfunction

function setBounds(width, height)
    call("_sb.cameraSetBounds(setbounds_width, setbounds_height)")
endfunction

function x()
    return call("_sb.cameraX()")
endfunction

function y()
    return call("_sb.cameraY()")
endfunction
```

**`world.bas`:**
```bas
function add(obj)
    call("_sb.addToWorld(add_obj)")
endfunction

function remove(obj)
    call("_sb.removeFromWorld(remove_obj)")
endfunction

function clear()
    call("_sb.clearWorld()")
endfunction
```

**`hud.bas`:**
```bas
function add(obj)
    call("_sb.addToHud(add_obj)")
endfunction

function remove(obj)
    call("_sb.removeFromHud(remove_obj)")
endfunction

function clear()
    call("_sb.clearHud()")
endfunction
```

---

## Tests

Transpiler tests (`tests/lib/Basic4WebGL/unit/transpiler/camera.test.ts`) verify:

- `camera.follow(sprite, 0)` transpiles without error and emits `_sb.cameraFollow(`
- `camera.follow(sprite, 0.1)` transpiles without error
- `camera.setPosition(100, 200)` transpiles without error and emits `_sb.cameraSetPosition(`
- `camera.setBounds(2000, 1000)` transpiles without error
- `camera.x()` and `camera.y()` transpile and emit `_sb.cameraX()` / `_sb.cameraY()`
- `world.add(obj)` transpiles without error and emits `_sb.addToWorld(`
- `world.remove(obj)` transpiles without error
- `world.clear()` transpiles without error
- `hud.add(obj)` transpiles without error and emits `_sb.addToHud(`

---

## Docs

Three new API reference pages added to the softGfx group in `src/docs/manifest.ts`:
- `camera` — follow, setPosition, setBounds, x, y with worked example (platformer camera)
- `world` — add, remove, clear
- `hud` — add, remove, clear

`stage.md` updated to note deprecation and point to `world` and `hud`.

All 15 existing doc/tutorial files with `stage.add` references updated to `world.add`.
