# softBASIC Library Roadmap

> Living document. Updated as features are designed and built.
> Last updated: 2026-07-31 (revised same-day after pulling origin/main — local main was 15 commits behind and missing shipped scene/camera work)

---

## Current State

### How the library works

Library modules are real `.bas` source files in `src/lib/Basic4WebGL/defs/`. They are loaded via
Vite `?raw` imports into `src/constants/packageModules.ts` (a `Record<string, string>` map of
module name → source string). Modules are grouped into **packages** defined in
`src/constants/firstPartyPackages.ts` and registered in the Redux store via `packagesSlice`.

Each project stores an ordered list of package IDs (`project.packageIds`). On build,
`useProjectForBuild` reads the project's packages from the store, expands module names through
`packageModules`, and passes the resulting `ProjectFile[]` to the compiler — where they are
compiled *before* user files and become ordinary functions in the transpiled output. The
`call("JavaScript")` escape hatch bridges them to the runtime managers.

`projectLib.ts` has been removed. First-party packages are seeded into the Redux store on app
init via `App.tsx`.

A single `_sb` engine object is injected into the sandboxed iframe at runtime, composed from domain modules in `src/components/Runner/engine/`. `Sprite`, `Text`, `AnimatedSprite`, `TileMap`, and `Audio` are classes instantiated directly from user code rather than managed through named-lookup singletons.

PIXI v8 is loaded from CDN. Output is rendered in a sandboxed `<iframe>`.

### Existing modules

| Module / Class | Functions / Methods |
|---|---|
| `gfx` | `boxCollide(a, b)` |
| `math` | `abs` `sin` `cos` `tan` `asin` `acos` `atan` `atan2` `sinh` `cosh` `tanh` `asinh` `acosh` `atanh` `sqrt` `pow` `cbrt` `exp` `log` `log2` `log10` `floor` `ceil` `round` `trunc` `sign` `random(max)` `randomint(max)` `min` `max` `clamp` `lerp` `distance` `pi()` `euler()` `val(s)` |
| `string` | `len` `lcase` `ucase` `str` `substr` `split` `trim` `padstart` `padend` `replace` `contains` `indexof` `char` `asc` |
| `array` | `arrLength` `length` `join` `push` `pop` `contains` `indexOf` `remove` `clear` |
| `dict` | `keys` `values` `joinKeys` |
| `drawing` | `drawLine(x,y,x2,y2)` `drawRect(x,y,w,h)` `drawCircle(x,y,r)` `clear()` `drawImageStrip(imageName,srcX,destX,destY,destWidth,destHeight)` |
| `pen` | `setFillColor(r,g,b)` `setLineColor(r,g,b)` `setLineWidth(n)` |
| `collision` | `spriteCollide(a,b)` `boxCollide(...)` `circleCollide(a,rA,b,rB)` `pointInBox(x,y,sprite)` `raycast(x,y,angle,dist,sprites)` `raycastAll(...)` |
| `input` | `getKeyDown(keycode)` `mouseX()` `mouseY()` `mouseDown()` |
| `Sprite` *(class)* | `constructor(imagePath)` `setPosition(x,y)` `x()` `y()` `setAngle` `setAlpha` `setScale` `setFlip` `setVisible` `setTexture` `width()` `height()` `setDepth(n)` |
| `AnimatedSprite` *(class)* | `constructor(imagePath, frameW, frameH)` — slices a spritesheet image into a frame grid; `addAnim(name, startFrame, endFrame, fps, loop)` `play(name)` `isPlaying(name)` `stop()` `setSpriteSheet(imagePath, frameW, frameH)` `setAngle` `setAlpha` `setScale` `setFlip` `setVisible` `width()` `height()` `setDepth(n)` |
| `TileMap` *(class)* | `constructor(tilesetPath, tileW, tileH)` `load(jsonPath)` `tileAt(x,y)` `widthPx()` `heightPx()` `setDepth(n)` |
| `Text` *(class)* | `constructor(content,x,y)` `setText` `setPosition` `setAlpha` `setStyle(size,r,g,b)` |
| `Audio` *(class)* | `constructor(soundPath)` `play()` `playLoop()` `stop()` `setVolume(v)` `isPlaying()` |
| `ObjectTransform` *(class)* | `setPosition(x,y)` `x()` `y()` — shared transform mixin used by Sprite/AnimatedSprite/TileMap |
| `RayHit` *(class)* | fields: `sprite`, `distance` — result type for `collision.raycast*` |
| `Scene` *(base class)* | no-op `onenter()` `onupdate(delta)` `onexit()` `onkeydown(key)` `onkeyup(key)` — user scenes extend this |
| `SceneManager` | `register(name, obj)` `switch(name)` |
| `camera` | `follow(target, speed)` `setPosition(x,y)` `setBounds(width,height)` `x()` `y()` |
| `world` | `add(obj)` `remove(obj)` `clear()` `width()` `height()` `setBackground(r,g,b)` — world-space layer, moves with camera |
| `hud` | `add(obj)` `remove(obj)` `clear()` — screen-fixed layer, does not move with camera |
| `stage` *(deprecated)* | `add`→`world.add`, `remove`→`world.remove`, `clear`→clears both world+HUD. Still works, no runtime warning; docs/tutorials now use `world`/`hud` instead. |
| `assetmanager` | `loadImage(name)` |

Lifecycle hooks: `onenter()` (wired), `onupdate()` (wired — PIXI ticker fires once per frame).

---

## Fixed Bugs

### ~~Bug 1 — `onupdate()` never fires~~ **[FIXED]**
`_SoftBasicGfx._update(delta)` is now connected to the PIXI ticker in `pixiInit.js`:
```js
app.ticker.add((ticker) => _SoftBasicGfx.getInstance()._update(ticker.deltaTime));
```

### ~~Bug 2 — Missing `this.` in `softBasicGFX.js`~~ **[FIXED]**
`this.` bindings corrected for `_componentToHex`, `setFillColor`, `setLineColor`, `drawLine`,
`drawRect`, `drawCircle`, `clear()`, and the keyup handler.

---

## Priorities

Priority order agreed 2026-05-23, revised 2026-07-31 against actual shipped code (local `main` was 15 commits behind `origin/main` at the time of the first revision — P6/P7/P8 have since been corrected after pulling).

### ~~P1 — Fix `onupdate` wiring~~ **[DONE]**
Fixed. See above.

### ~~P2 — Fix `softBasicGFX.js` binding bugs~~ **[DONE]**
Fixed. See above.

### ~~P3 — Library architecture refactor~~ **[DONE]**

Key work completed:

1. **Descriptor + generator system** — TypeScript descriptor files in `src/lib/Basic4WebGL/library/descriptors/` drive a `scripts/generateLibrary.ts` CLI that regenerates `.bas` source files, eliminating hand-written `call()` string templates.

2. **`_sb` unified engine** — The three uncoordinated singletons (`_SoftBasicGfx`, `_SoftAssetManager`, `_SoftSpriteManager`) have been replaced by a single `_sb` object composed from domain modules in `src/components/Runner/engine/`.

3. **`Sprite` and `Text` as classes** — Display objects are now first-class softBASIC classes with typed methods, replacing the `spritemanager`/`text` module pattern.

4. **softGfx package bumped to v2.0.0.**

### ~~P4 — Audio system~~ **[DONE]**
Shipped as the `Audio` class (`audio.bas` + `src/components/Runner/engine/audio.js`), backed by the Web Audio API. `dim s as Audio("jump.wav")` then `s.play()` / `s.playLoop()` / `s.stop()` / `s.setVolume(v)` / `s.isPlaying()`.

### ~~P5 — Mouse input~~ **[DONE]** (touch still open)
`input.mouseX()`, `input.mouseY()`, `input.mouseDown()` shipped alongside the existing `getKeyDown`. **Not done:** touch input (`input.touchX(i)`, `input.touchY(i)`, `input.touchCount()`) — no listeners for `touchstart`/`touchmove`/`touchend` exist yet. Low priority until mobile/touch support (see Lower Priority list) is scheduled.

### ~~P6 — Scene management~~ **[DONE — shipped v0.3.0]**
Shipped as a `Scene` base class (`Scene.bas`) + `SceneManager` module (`SceneManager.bas` + `scene.js` engine). Design settled the open questions from the original entry:

- **Classes, not top-level declarations.** User scenes extend `Scene` and override only the lifecycle hooks they need (`onenter`, `onupdate(delta)`, `onexit`, `onkeydown(key)`, `onkeyup(key)`).
- **Stage clears automatically** between `onexit` and `onenter` on switch — developers don't call `world.clear()` manually; anything that should persist gets re-added in the new scene's `onenter`.
- **Switching is deferred/queued**, not immediate — `SceneManager.switch(name)` called inside `onupdate` applies at end of tick, after `onexit`/`onenter` fire in order, avoiding mid-frame corruption.
- `onupdate`/`onkeydown`/`onkeyup` route to the active scene only; other top-level classes keep receiving `_update` via the existing lifecycle path.

```basic
class MenuScene extends Scene
  function onupdate(delta)
    if input.getKeyDown(32) then SceneManager.switch("game")
  endfunction
endclass

dim menu = new MenuScene()
SceneManager.register("menu", menu)
SceneManager.switch("menu")
```

Design spec: `docs/superpowers/specs/2026-06-24-scene-management-design.md`. Tests: `tests/lib/Basic4WebGL/unit/transpiler/scene.test.ts`. Docs: `src/docs/api-reference/scene.md`, tutorial `src/docs/tutorials/13-scenes.md`.

### ~~P7 — Sprite animation / spritesheets~~ **[DONE]**
Shipped as `AnimatedSprite` (`animatedsprite.bas` + `src/components/Runner/engine/animatedSprite.js`). The constructor does grid-based spritesheet slicing — `dim a as AnimatedSprite("player.png", 32, 32)` slices the image into a `frameW`×`frameH` grid — and `addAnim(name, startFrame, endFrame, fps, loop)` / `play(name)` / `isPlaying(name)` / `stop()` define and run named animation ranges. `setSpriteSheet(imagePath, frameW, frameH)` swaps the source sheet on an existing instance (added for the raycaster demo's enemy hit/death frame swaps).

**Remaining gap:** no visual spritesheet editor/slicer in the asset panel — defining frame dimensions in code is the only option today.

### ~~P8 — Camera / viewport~~ **[DONE — shipped v0.3.0]**
Shipped as `camera` + `world` + `hud` modules (`camera.bas`, `world.bas`, `hud.bas` + `camera.js` engine). The `stage` module is deprecated in favour of the world/hud split (see module table above). Design settled the open questions from the original entry:

- **Bounds are explicit and optional.** `camera.setBounds(worldWidth, worldHeight)` enables clamping so the viewport never exposes space past the world edge; without it the camera moves freely (no clamping).
- **No culling in this milestone** — off-screen sprites still render; deferred, not addressed.
- **Follow is a lerp, not a snap-only mechanism.** `camera.follow(target, speed)` — `speed` 0 snaps instantly, 0.05–0.2 gives smooth tracking. `camera.setPosition(x,y)` cancels any active follow target.
- Container split: `worldContainer` moves with the camera, `hudContainer` never moves — replacing the single `stage` container.

```basic
camera.setBounds(2000, 1000)
camera.follow(player, 0.1)
world.add(player)
hud.add(scoreText)
```

**Known gap surfaced while reviewing this:** `docs/superpowers/specs/2026-06-26-compound-shooter-design.md` (a planned "COMPOUND" top-down-shooter demo, not yet built — only the design doc has landed) lists `camera.shake(intensity, duration)` as a prerequisite. It is **not implemented** — `camera.bas`/`camera.js` have no `shake` method. This blocks that demo from starting.

Design spec: `docs/superpowers/specs/2026-06-24-camera-design.md`. Tests: `tests/lib/Basic4WebGL/unit/transpiler/camera.test.ts`. Docs: `src/docs/api-reference/camera.md`, `world.md`, `hud.md`; tutorial `src/docs/tutorials/14-camera.md`.

### P9 — `camera.shake(intensity, duration)`
**New, next priority.** Not implemented. Named as a hard prerequisite in `docs/superpowers/specs/2026-06-26-compound-shooter-design.md` for the planned "COMPOUND" top-down-shooter demo (design doc only — no code yet, not in `demoRegistry.ts`). Small, self-contained addition to `camera.bas`/`camera.js`: temporarily offset `worldContainer` position by a decaying random jitter over `duration`, on top of the existing follow/bounds position.

## Lower Priority / Future

Re-audited 2026-07-31 — several items below were previously listed as not-yet-built but already exist.

- ~~Vector math helpers~~ **[DONE]** — `math.distance(x1,y1,x2,y2)`, `math.lerp(a,b,t)`, `math.clamp(v,min,max)` all shipped. No dedicated `Vec2` type.
- ~~Circle collision~~ **[DONE]** — `collision.circleCollide(a,radiusA,b,radiusB)` shipped, plus `raycast`/`raycastAll`/`pointInBox` (beyond original AABB-only scope).
- **Polygon collision** — still not implemented (AABB, circle, and raycast only).
- **Physics / gravity** — Rapier WASM or manual implementation. Not started.
- **Save/load (localStorage)** — expose to user programs for game state persistence. Not started.
- **Text styling** — `Text.setStyle(size,r,g,b)` covers size and colour; font family and alignment are not yet exposed.
- **Particle system** — emitter abstraction over PIXI particles. Not started.
- **Keyboard events (press/release, not just down state)** — not started.
- **Touch input** — see P5 note above.
- **Two-pass compilation** — remove file ordering constraint for class references. Not started.
- **Spritesheet editor** — visual frame slicer in the asset panel (see P7 note above).

---

## Key File Locations

| Purpose | Path |
|---|---|
| Library source files (.bas) | `src/lib/Basic4WebGL/defs/*.bas` (includes `Scene.bas`, `SceneManager.bas`, `camera.bas`, `world.bas`, `hud.bas`) |
| Module name → source map | `src/constants/packageModules.ts` |
| First-party package definitions | `src/constants/firstPartyPackages.ts` |
| Package Redux slice | `src/features/packages/packagesSlice.ts` |
| Build hook (packages → ProjectFile[]) | `src/hooks/useProjectForBuild.ts` |
| Compilation entry point | `src/lib/Basic4WebGL/index.ts` |
| Runtime iframe template | `src/components/Runner/bootstrapper.html` |
| Runtime engine (domain modules → `_sb`) | `src/components/Runner/engine/` |
| PIXI initialisation | `src/components/Runner/pixiInit.js` |
| Built-in type definitions | `src/lib/Basic4WebGL/builtInTypes/definitions/` |
| Descriptor files (TypeScript sources) | `src/lib/Basic4WebGL/library/descriptors/` |
| Generator script | `scripts/generateLibrary.ts` |
| Runner component | `src/components/Runner/index.tsx` |
