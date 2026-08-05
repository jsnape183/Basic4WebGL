# softBASIC Library Roadmap

> Living document. Updated as features are designed and built.
> Last updated: 2026-08-04 (P11 `oninit` hook shipped; P12 pixel-art filtering opened)

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
| `TileMapSet` *(class)* | `constructor(stmPath)` — loads a multi-layer `.stm` file (does not render on its own — call `world.add(tm)`, same as `Sprite`/`TileMap`); `layer(name)` returns the named layer as a `TileMapLayer`; `transform` moves every layer together as one unit |
| `TileMapLayer` *(class)* | `tileAt(x,y)` `widthPx()` `heightPx()` `setDepth(n)` — same shape as `TileMap`, returned from `TileMapSet.layer(name)` rather than constructed directly |
| `Text` *(class)* | `constructor(content,x,y)` `setText` `setPosition` `setAlpha` `setStyle(size,r,g,b)` `setFont(fontFamily)` `setAlign(align)` |
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
**Note:** this fix picked the wrong one of PIXI's two delta properties, which is the direct
cause of Bug 4 below. The live wiring now reads `ticker.deltaMS`; the snippet above is kept
as the historical record of what was originally shipped.

### ~~Bug 2 — Missing `this.` in `softBasicGFX.js`~~ **[FIXED]**
`this.` bindings corrected for `_componentToHex`, `setFillColor`, `setLineColor`, `drawLine`,
`drawRect`, `drawCircle`, `clear()`, and the keyup handler.

### ~~Bug 3 — instance `onupdate()` stops firing after any remove/clear/scene switch~~ **[FIXED, 2026-08-04]**
A distant relative of Bug 1 (and of Bug 2's `this.` theme): per-object `onupdate` was wired
up correctly, but the frame loop lost track of *which* objects to dispatch to. `_sb` is built
by spreading all 14 engine modules once, which gives `_sbInstances` a second property slot on
`_sb` aliasing `_sbLifecycle`'s array. `stage.js` **reassigned** the module's slot in five
places (`removeFromWorld`, `clearWorld`, `removeFromHud`, `clearHud`, `clear`), detaching the
two — so the loop, which reads `_sb`'s slot, iterated an orphaned array forever. Objects added
afterwards never updated; objects removed never *stopped* updating. Both symptoms silent.

Fixed by having `stage.js` reach the registry through `this` like every other module, and by
mutating it in place only (`_retainInstances()` in `lifecycle.js`), so the two slots can never
diverge. Instance dispatch now iterates a per-frame snapshot, which in-place mutation requires:
otherwise an object calling `world.remove(self)` from its own `onupdate` makes a sibling skip
that frame. Gated by `tests/components/Runner/stage.test.ts` and
`cypress/e2e/instanceUpdateRegistry.cy.ts`. Design:
`docs/superpowers/specs/2026-08-04-instance-update-registry-aliasing-design.md`.

### ~~Bug 4 — `onupdate(delta)` received frame-normalised units, not milliseconds~~ **[FIXED, 2026-08-04]**
The direct descendant of Bug 1: that fix connected `_update` to the ticker correctly but took
the wrong one of its two delta properties. PIXI's `deltaTime` is normalised so 1.0 means "one
60fps frame"; `deltaMS` is the same quantity in milliseconds. `bootstrapper.html` used
`deltaTime`, so every `onupdate(delta)` — module and instance alike — got ~1.0 per frame while
the Language Guide, `scene.md`, and every tutorial's `speed * delta / 1000` all assume
milliseconds. Result: **every game ran ~16.67x slower than its documented contract**, and
tutorial 7's `if timer >= 1000` "one point per second" branch never fired at all inside the
e2e suite's window.

Confirmed by instrumenting the live frame loop: 859 real frames spanning 14318.3 ms of wall
clock summed to a delta total of 858.99. On a fresh `PIXI.Ticker`, `deltaMS / deltaTime` was
exactly `1000/60` on every frame — so `deltaMS` carries the identical `ticker.speed` scaling
and `minFPS` clamp and the swap is a pure unit conversion. (`elapsedMS` was rejected: it is
the raw unclamped measurement and would drop both.)

Fixed in two places. `bootstrapper.html` now reads `ticker.deltaMS`. `camera.js`'s
`_shakeElapsed += (delta || 0) / 60` became `/ 1000` — `camera.shake`'s `duration` is
documented in seconds, and `/ 60` only produced seconds while delta was frame-normalised, so
without this a 0.5s shake would have finished in 2 frames. `animatedSprite.js`'s
`animationSpeed = fps / 60` was checked and is **not** affected: PIXI's `AnimatedSprite`
self-drives from `PIXI.Ticker.shared`, a different ticker object from `app.ticker`.

Gated by `cypress/e2e/deltaUnits.cy.ts` (4 specs, including accumulated delta compared against
real `performance.now()` elapsed time), `tests/components/Runner/camera.test.ts`, and static
guards in `tests/components/Runner/bootstrapper.test.ts`. Design:
`docs/superpowers/specs/2026-08-04-delta-units-fix-design.md`.

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

Design spec: `docs/superpowers/specs/2026-06-24-camera-design.md`. Tests: `tests/lib/Basic4WebGL/unit/transpiler/camera.test.ts`. Docs: `src/docs/api-reference/camera.md`, `world.md`, `hud.md`; tutorial `src/docs/tutorials/14-camera.md`.

### ~~P9 — `camera.shake(intensity, duration)`~~ **[DONE]**
Shipped in `camera.bas`/`camera.js`. `camera.shake(intensity, duration)` offsets `worldContainer` by a decaying random jitter — magnitude `intensity * (1 - elapsed/duration)`, elapsed tracked in seconds off the PIXI ticker delta passed into `_cameraUpdate(delta)` — layered on top of the existing follow/bounds position each tick. A new `shake()` call restarts the effect from full intensity rather than stacking with one in progress. State resets on scene switch alongside the rest of camera state (`_cameraReset()`). This unblocks the planned "COMPOUND" top-down-shooter demo (`docs/superpowers/specs/2026-06-26-compound-shooter-design.md`), which is still design-only — no code yet, not in `demoRegistry.ts`.

Tests: `tests/lib/Basic4WebGL/unit/transpiler/camera.test.ts`. Docs: `src/docs/api-reference/camera.md`.

### ~~P10 — Keyboard press/release events~~ **[DONE]**
Re-audited 2026-07-31: this was listed as "not started" below, but `onkeydown(key)`/`onkeyup(key)` scene lifecycle hooks already existed, shipped alongside scene management in v0.3.0 — dispatched from `bootstrapper.html` to the active scene, every `_sbClass`, and every `_sbInstance`. The real gap was a bug, not a missing feature: the native browser `keydown` event auto-repeats while a key is held, and the listener never checked `event.repeat`, so `onkeydown` fired repeatedly during a sustained hold instead of once per physical press as documented. Fixed with a one-line `if (e.repeat) return;` guard in `bootstrapper.html`.

Also added `input.keyPressed(keycode)`/`input.keyReleased(keycode)` — frame-synced, edge-triggered polling functions for use inside `onupdate`, complementing the existing level-triggered `input.getKeyDown(keycode)`. Edge detection lives in `_sbInput.registerKey()` (`src/components/Runner/engine/input.js`), comparing the new `down` state against the previous `_keys` value before updating it; the `_justPressed`/`_justReleased` maps are cleared each frame via `_sbInput._resetFrameInput()`, called at the end of `_sbScene._update()` (`src/components/Runner/engine/scene.js`) after all `onupdate` calls for that frame have run.

Tests: `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`. Docs: `src/docs/api-reference/input.md`, `src/docs/api-reference/scene.md`.

### ~~P11 — `oninit` pre-load lifecycle hook~~ **[DONE — 2026-08-04]**
Every lifecycle hook (`onenter`, `onupdate`, `onexit`, `onkeydown`, `onkeyup`) fired *after* asset preloading, so there was no point at which softBASIC could configure the runtime before textures were created. Surfaced while briefing the "collect the coins" platformer demo, which needs nearest-neighbour texture filtering — PIXI applies the scale mode at texture-creation time, so setting it after preload is too late.

Shipped as `oninit`, a module-level hook fired on every module before preloading begins. The enabling change is **two-phase module initialisation** in the transpiler: `RootRule` now partitions each root's children into inert declarations (function/method assignments, which stay inline) and executable top-level statements (wrapped in `_sb._deferModuleBody(() => {...})`). That makes the whole transpiled block declaration-only, so `bootstrapper.html` can run it — and `_sb._fireInit()` — ahead of `preloadFromLocalStorage`, then replay module bodies in file order via `_sb._runModuleBodies()` once assets exist.

Resolved design questions: fires on **every module**, mirroring the existing `onenter` loop over `_sbClasses`; **not** on class instances (none exist yet at that point — `_sbInstances` is necessarily empty, and `Scene` deliberately gets no `oninit` stub); asset misuse is caught by a **runtime** guard in `_sbAssets.get()` rather than a compile-time ban, since the compiler has no way to know which library calls touch assets. Design: `docs/superpowers/specs/2026-08-04-oninit-lifecycle-hook-design.md`.

Tests: `tests/lib/Basic4WebGL/unit/transpiler/oninit.test.ts`, `tests/components/Runner/lifecycle.test.ts`, `tests/components/Runner/assets.test.ts`, `tests/components/Runner/bootstrapper.test.ts`, and `cypress/e2e/oninit.cy.ts` (the only layer that can prove firing order across the real async boot sequence). Docs: `src/docs/language-guide/lifecycle.md`.

### ~~P12 — Pixel-art texture filtering~~ **[DONE, 2026-08-04]**
Shipped as `world.setPixelPerfect(v)` — sets `PIXI.TextureStyle.defaultOptions.scaleMode` to `'nearest'`/`'linear'`. Called from `oninit`, before any texture loads, this is the whole implementation — no retroactive per-texture cache-walk needed, since PIXI's default only affects textures created *after* the call, and `oninit` now guarantees nothing has loaded yet. That simplicity is a direct payoff of shipping P11 (`oninit`) as a real mechanism rather than working around the timing problem.

Shipped alongside it: `camera.setZoom(z)` / `camera.zoom()` — the companion feature needed to actually make small pixel-art tiles/sprites visible on a full-size canvas. Zooms `worldContainer` as a whole (matching Godot's `Camera2D.zoom` — verified against Godot's own docs before implementing), so every world object (tilemap, sprites, enemies) magnifies together with no per-object scale bookkeeping; `tileAt()`, `transform.x()`/`y()`, and all other position/collision math are completely unaffected, since they operate in the same shared logical coordinate space regardless of how that space is rendered. `camera.follow`/`setBounds`'s existing pan math was made zoom-aware (visible world width/height divides by zoom); default zoom is `1`, so every existing project is unaffected. Tests: `tests/lib/Basic4WebGL/unit/transpiler/camera.test.ts`. Docs: `src/docs/api-reference/camera.md`, `src/docs/api-reference/world.md`.

## Lower Priority / Future

Re-audited 2026-07-31 — several items below were previously listed as not-yet-built but already exist.

- ~~Vector math helpers~~ **[DONE]** — `math.distance(x1,y1,x2,y2)`, `math.lerp(a,b,t)`, `math.clamp(v,min,max)` all shipped. No dedicated `Vec2` type.
- ~~Circle collision~~ **[DONE]** — `collision.circleCollide(a,radiusA,b,radiusB)` shipped, plus `raycast`/`raycastAll`/`pointInBox` (beyond original AABB-only scope).
- **Polygon collision** — still not implemented (AABB, circle, and raycast only).
- **Physics / gravity** — Rapier WASM or manual implementation. Not started.
- ~~Save/load (localStorage)~~ **[PROMOTED]** — moved to `docs/roadmap.md` Milestone 3 (Public beta readiness), 2026-08-02. This had sat here unscheduled despite being the actual gate on shippable games (persistent high scores, "continue" saves, roguelike/RPG progression) — a capability gap, not a nice-to-have polish item like the others in this list.
- ~~Text styling~~ **[DONE]** — `Text.setStyle(size,r,g,b)` covers size and colour; `setFont(fontFamily)` and `setAlign(align)` shipped 2026-07-31, exposing font family and left/center/right alignment.
- **Particle system** — emitter abstraction over PIXI particles. Not started.
- **Touch input** — see P5 note above.
- ~~Two-pass compilation~~ **[DONE]** — resolved by `sortByDependencies.ts` (topological sort of project files by `new`/`as`/`extends`/method references, wired into `useProjectForBuild.ts`), shipped 2026-06-17/18, before v0.3.0. No file-ordering constraint remains for class references.
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
