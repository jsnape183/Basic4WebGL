# softBASIC Library Roadmap

> Living document. Updated as features are designed and built.
> Last updated: 2026-09-01 (raycaster library Phase 3 shipped — `RcRender` flat-shaded first-person renderer)

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
| `pathfinding` | `setup(tileMapSet,blockingLayers)` `setRecomputeInterval(ms)` `navigateTo(sprite,x,y,speed)` `isNavigating(sprite)` `stopNavigating(sprite)` |
| `input` | action map: `bind` `clearBindings` `held` `pressed` `released` `strength` `axis` `padConnected` `setDeadzone`; deprecated: `getKeyDown` `keyPressed` `keyReleased`; `mouseX()` `mouseY()` `mouseDown()` |
| `keyboard` | 51 key-code constants — `keyboard.LEFT` `keyboard.SPACE` `keyboard.ENTER` … `keyboard.A`–`keyboard.Z` `keyboard.DIGIT_0`–`keyboard.DIGIT_9`. Pure `const … endconst` block; DOM legacy `keyCode` integers. |
| `controller` | constants only — gamepad button + stick-direction values for `input.bind` |
| `Sprite` *(class)* | `constructor(imagePath)` `setPosition(x,y)` `x()` `y()` `setAngle` `setAlpha` `setScale` `setFlip` `setVisible` `setTexture` `width()` `height()` `setDepth(n)` |
| `AnimatedSprite` *(class)* | `constructor(imagePath, frameW, frameH)` — slices a spritesheet image into a frame grid; `addAnim(name, startFrame, endFrame, fps, loop)` `play(name)` `isPlaying(name)` `stop()` `setSpriteSheet(imagePath, frameW, frameH)` `setAngle` `setAlpha` `setScale` `setFlip` `setVisible` `width()` `height()` `setDepth(n)` |
| `TileMap` *(class)* | `constructor(tilesetPath, tileW, tileH)` `load(jsonPath)` `tileAt(x,y)` `widthPx()` `heightPx()` `setDepth(n)` |
| `TileMapSet` *(class)* | `constructor(stmPath)` — loads a multi-layer `.stm` file (does not render on its own — call `world.add(tm)`, same as `Sprite`/`TileMap`); `layer(name)` returns the named layer as a `TileMapLayer`; `tileAt(name,x,y)` looks up a layer and queries it in one call; `markersByTag(tag)` returns every `Marker` painted with that tag anywhere in the set, as an array of `{x,y}` positions; `transform` moves every layer together as one unit and is correctly accounted for by `tileAt`/`markersByTag` on either the set or an individual layer |
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

### ~~P13 — Pathfinding~~ **[DONE]**
Shipped as the `pathfinding` module (`pathfinding.bas` + `src/components/Runner/engine/pathfinding.js`). Built to unblock the upcoming bullet-hell shooter demo's enemy AI. A* over a flat precomputed walkability grid built from a `TileMapSet`'s named layers (`pathfinding.setup(tileMapSet, blockingLayers)` — any non-zero tile in a listed layer blocks that cell; unlisted layers, like decorative floors, are ignored), 8-directional with corner-cut prevention, octile-distance heuristic.

`navigateTo(sprite, x, y, speed)` is designed to be called every frame with the target's current position (e.g. `player.transform.x()`, `player.transform.y()` from an enemy's `onupdate`) — cheap to call repeatedly, since a fresh path is only computed when the target has moved to a new grid cell **and** `setRecomputeInterval`'s cooldown (default 200ms) has elapsed since the last computation. A target on a blocked or off-grid tile snaps to the nearest walkable tile rather than failing.

Movement itself is driven by a hardcoded per-frame call from `scene.js`'s `_update` (`this._pathfindingUpdate(delta)`, alongside the existing `this._cameraUpdate(delta)`) — **not** the generic `_sbClasses`/`onupdate` auto-dispatch mechanism, which only ever receives entries from transpiled user-authored softBASIC modules/classes, never from built-in engine JS files. This was discovered during implementation planning: the original design spec assumed collision/world-style modules got an automatic per-frame hook "the same mechanism `collision`/`world` already rely on" — neither of those actually has one, so the assumption was wrong. `camera.follow`'s existing hardcoded-call pattern turned out to be the real precedent to follow instead.

Nav state resets alongside camera state in `stage.js`'s `clear()` (`this._pathfindingReset()`), so a scene switch can't leave a stale grid from the previous scene silently active.

**Not built:** shared flow-field/Dijkstra-map optimization for many-agents-to-one-target (every sprite computes its own path independently, bounded by the recompute cooldown); dynamic obstacle avoidance (other sprites don't block computed paths, only the tilemap does); per-tile-ID blocking within a flagged layer (whole-layer only).

Design spec: `docs/superpowers/specs/2026-08-07-pathfinding-design.md`. Tests: `tests/components/Runner/pathfinding.test.ts`, `tests/components/Runner/scene.test.ts`, `tests/components/Runner/stage.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/pathfinding.test.ts`. Docs: `src/docs/api-reference/pathfinding.md`.

### ~~P14 — Tilemap markers~~ **[DONE]**
Shipped as a new `.stm` layer kind (`{ type: "markers", markers: [{row, col, tag}] }`, additive and fully backward-compatible with every existing bare-array tile layer) plus a new `TileMapSet.markersByTag(tag)` query and `Marker` class (`marker.bas`, mirroring `rayhit`'s existing bare-data-class pattern). Built to unblock the upcoming bullet-hell shooter demo's mob-spawn-point and weapon-pickup-point level authoring — the whole point is that a level designer places these visually in the Tilemap Editor rather than scanning tile IDs by convention or hardcoding coordinates in `.bas` files.

A marker layer never renders (`createTileMapSet` skips it entirely in the sprite-placement loop) and isn't wrapped in a `TileMapLayer`-style class, since markers aren't tile-lookup-shaped — `markersByTag` searches across every marker layer in the set at once, not scoped to one named layer, keeping the softBASIC-facing API to a single new method. Marker positions correctly account for the `TileMapSet`'s own `.transform` offset, reusing the same ancestor-walk `tileAt` already uses.

The Tilemap Editor's `EditorLayer` type became a discriminated union (`kind: 'tile' | 'marker'`) so marker layers show up in the existing Layers panel — same add/rename/remove/reorder UI, no new panel built from scratch. A new `MarkerCanvas`/`TagPicker` component pair swaps in for the tile `Canvas`/`Palette` when a marker layer is active (full-cell colour tint per tag, chip-list tag picker with a free-text new-tag input); both canvases now share a `usePaintDrag` hook rather than duplicating the drag-paint interaction.

This is a deliberate, scoped re-opening of the tile-metadata non-goal recorded when `TileMapSet` and the Tilemap Editor originally shipped (Milestone 12) — "`.stm` stores tile IDs only" / "no tile-property metadata" — not a silent scope change.

**Not built:** per-marker structured data beyond the tag string (no key/value payloads); marker-layer-scoped queries (`markersByTag` always searches the whole set); runtime marker mutation (markers are level-authoring-time data baked into the `.stm` file, not a live game-state concept — a game tracking "this spawn point is destroyed" does so in its own game logic).

Design spec: `docs/superpowers/specs/2026-08-10-tilemap-markers-design.md`. Tests: `tests/components/Runner/tilemap.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/tilemapset.test.ts`, `tests/ui/components/TileMapEditor/` (`stmCodec`, `usePaintDrag`, `tagColor`, `MarkerCanvas`, `TagPicker`, `LayersPanel`, `TileMapEditor`). Docs: `src/docs/api-reference/tilemapset.md`.

### ~~P15 — Named constants + `keyboard` module~~ **[DONE, 2026-08-30]**

**Shipped:** named constants — `const … endconst` blocks and single-line `const NAME = value`, module-namespaced (referenced as `module.NAME`, or bare within the declaring file), literals only (number / string / `true` / `false`). Each declaring module emits one hoisted `Object.freeze` holder (`const _const_<module> = Object.freeze({ … })`); reference sites compile to `_const_<module>.<name>`. Constants are immutable across every binding form — assignment, redeclare, `dim`, `for`-loop variable, and function parameter are all rejected. Editor completion and hover (showing `NAME = value`) are wired through the existing dynamic-symbol-snapshot path. `const` is a top-level-only declaration (rejected inside a function, class, or block).

Design: `docs/superpowers/specs/2026-08-30-softbasic-constants-design.md`. Plan: `docs/superpowers/plans/2026-08-30-softbasic-constants.md`.

**Shipped — first consumer:** the `keyboard` def module — **51** key-code constants (15 named keys + 26 letters + 10 digits), DOM legacy `keyCode` integers, authored as a single `const … endconst` block. Registered in the **softGfx** package alongside `input`; softGfx `version` bumped 2.7.0 → 2.8.0.

**Shipped — second consumer:** the `controller` constants module plus the `input` gamepad / action-map API (`input.bind(...)`), consuming `keyboard.*` / `controller.*` through the constants mechanism shipped here. See the **Controller / gamepad support** delivered section below.

**Still open (new tracked item):** extract a dedicated **`softInput`** package (`input` + `keyboard` + `controller`) out of softGfx. A breaking migration — existing projects reference `softgfx` — so it needs its own spec covering the project-package migration path. Deferred; not part of the controller work.

**Still open (new tracked item):** descriptor-generated `.bas` modules (`sprite`, `stage`, `gfx`, …) can't declare constants — the `.descriptor.ts` schema and `npm run generate:library` would need a `constants` field. Add only when a generated module actually needs constants.

### ~~Controller / gamepad support~~ **[DONE]**

Shipped as an **action map** on `input` plus a new `controller` constant module (and building on the named-constants mechanism + `keyboard` module, `docs/superpowers/specs/2026-08-30-softbasic-constants-design.md`).

Game code calls `input.bind(action, device, code)` (`device`: `"key"` | `"button"` | `"axis"`) once at startup, then queries actions — never physical inputs: `input.held`, `input.pressed`, `input.released` (digital, OR across sources), `input.strength` (0..1, max across sources), `input.axis(neg, pos)` (−1..1). Plus `input.clearBindings(action)`, `input.padConnected()`, `input.setDeadzone(value)` (default 0.15). Keyboard and controller are interchangeable in game logic with zero branching.

Engine: `_sbInput._pollGamepads()` runs at the top of `_sbScene._fixedStep` (`engine/scene.js`), reads `navigator.getGamepads()`, folds the first standard-mapping pad into the existing just-pressed/just-released model in a separate `"b#"`/`"h#"` key namespace, and derives 8 deadzone-rescaled 0..1 stick half-strengths. `_resetFrameInput` rolls `_padButtons`/`_padAxisHalves` into their `*Prev` counterparts. `bootstrapper.html` adds `gamepadconnected`/`gamepaddisconnected` listeners as a connectivity hint before the first poll. Releases are flushed on pad disconnect.

`input.getKeyDown` / `keyPressed` / `keyReleased` are kept working, marked deprecated in the docs with migration examples.

Design spec: `docs/superpowers/specs/2026-08-30-controller-support-design.md`. Plan: `docs/superpowers/plans/2026-08-30-controller-support.md`. Tests: `tests/lib/Basic4WebGL/unit/transpiler/input.test.ts`, `tests/components/Runner/engine/input.test.ts`, `tests/components/Runner/scene.test.ts`, `tests/components/Runner/bootstrapper.test.ts`, `cypress/e2e/tutorials.cy.ts` (keyboard path). Docs: `src/docs/api-reference/input.md`, `src/docs/api-reference/controller.md`, `src/docs/language-guide/input.md`.

**Tracked follow-ups (deferred):**

- **Local multiplayer** — a player-index parameter on `bind` and the query functions. The API was designed so this can be added as an optional trailing argument without breaking the current surface. `_pollGamepads` currently reads only the first connected pad.
- **Rumble / haptics** — `gamepad.vibrationActuator` (Chromium-only). Not started.
- **Runtime rebind UI helpers** — a "press any input" capture so settings screens can let players remap. `clearBindings` + `bind` already cover applying a new binding; the missing piece is detecting what the player just pressed.
- **Extract a dedicated `softInput` package** — see the P15 follow-up above (`input` + `keyboard` + `controller` out of softGfx; breaking migration, needs its own design spec). Deferred.

### Raycaster library **[IN PROGRESS]**

A "DOOM plus a bit" first-person raycaster built in softBASIC as reusable `.bas`
modules (not an engine `_sb` module) under `demo-src/raycaster/lib/`.

Phase 1 shipped: `RcWorld` (a height-aware per-cell world model parsed from a
tagged `.stm` tilemap + marker tags — walls, floor/ceiling heights, textures,
door/lift/water/sky flags, upper regions), plus the generic `tilemapset`
accessors it needed — `allMarkers()`, `tileWidth()`, `tileHeight()` — and
`Marker` gaining `col` / `row` / `tag`. Verified by JS unit tests and an unlisted
Cypress phase demo (`devDemoRegistry`).

Phase 2 shipped: `RcCast` — a DDA span builder. `cast(world, ox, oy, dx, dy)`
marches a straight line across the grid and collects an ordered near→far list of
surface spans (walls, floor steps, ceiling steps), each carrying perpendicular
distance, low/high world height, source cell, hit side, wall texture coord, and
texture id; it does **not** stop at the first wall. `los(world, ox, oy, dx, dy)`
shares the same march to return the distance to the first wall (or `-1`) for
line-of-sight checks, without disturbing the last `cast`'s spans. Span kinds and
march limits live in the `RcConfig` constants module. Verified by JS unit tests.

Phase 3 shipped: `RcRender` — the flat-shaded first-person renderer. It owns
the camera (the `camera` module is inert in a raycast scene) and, on
`renderFrame()`, casts one ray per screen column via `RcCast`, walks the
returned spans near→far under a per-column occlusion window, projects each
span's world heights to a screen Y, and draws flat-shaded vertical strips
(`drawing.drawRect`, shaded by distance + surface kind — no wall textures /
atlas / vertical texture-clip yet). The occlusion window handles floor/ceiling
*rises* and flat sky/floor fill; a floor drop or ceiling rise leaves the window
open so farther spans show through, but the pit floor / under-ledge surface
itself isn't specially drawn (documented gap, revisited in a later phase).
Verified by an unlisted `raycaster-p3` Cypress demo (static camera, a
stepped/pitted/windowed room) that also carries a frame-time readout — the
spec §5.3 throughput checkpoint.

**Frame-time checkpoint (spec §5.3):** measured **16ms average over 127
columns**, flat-shaded (no lighting, no textures). This lands in the
"marginal" band (14–20ms per the spec's decision table) — no `drawing.js`
change needed yet, but flagged: Phase 5 (lighting, a tint per strip) and
textured walls will both add real per-strip cost on top of an already-marginal
budget at only 127 columns with nothing else in the scene. Recommendation
carried into Phase 4/5 planning: do the generic `drawing.js` sprite/graphics
pooling fix (rung 1 of the §5.3 ladder) proactively before or alongside
Phase 5, rather than waiting for a "fails 60fps" measurement that lighting
will likely produce anyway.

Phase 4 shipped: `RcMover` — a height-aware movable body (circle-shaped,
radius and bodyHeight configurable) that slides along walls, steps up onto
low ledges, falls into pits, and jumps. Every frame: set intent via `move(forward, strafe)`
(move speed in units/sec), `turn(deltaAngle)` / `look(deltaPitch)` (immediate,
accumulate rotation/pitch), and `jump()` (if grounded). Call `step(delta)` to
resolve collision — a single per-axis slide check against walls and adjacent
floor heights, plus vertical gravity + landing. Query position/rotation with
`x()` / `y()` / `z()` / `angle()` / `pitch()` / `onGround()`. `RcRender.bindCamera(mover)`
binds the camera so the view follows; otherwise call `RcRender.setCamera(x, y, angle, pitch)`
manually. Verified by Cypress (dev-registry raycaster demo, playable level).

Phases 5–10 (lighting, actors, diagonal tiles, upper regions, optimisation)
remain, tracked in
`docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`. Phase 1 plan:
`docs/superpowers/plans/2026-08-31-raycaster-engine-phase-1.md`. Phase 2 plan:
`docs/superpowers/plans/2026-09-01-raycaster-engine-phase-2.md`. Phase 3 plan:
`docs/superpowers/plans/2026-09-01-raycaster-engine-phase-3.md`. Phase 4 plan:
`docs/superpowers/plans/2026-09-01-raycaster-engine-phase-4.md`. Guide:
`src/docs/guides/raycaster-library.md`.

Known limits: `light:` tags set a 0/1 flag only (a baked light *level* comes with
the lighting phase); upper regions have a fixed height and no per-region
textures; `RcCast` stops at the first wall (no see-through windows yet), ignores
upper regions, and treats diagonal-wall tiles as empty; `RcRender` is
flat-shaded only (no wall textures/atlas), has no per-span depth buffer for
sprite occlusion yet, and doesn't draw a pit floor or under-ledge surface when
the occlusion window is left open.

---

## Lower Priority / Future

Re-audited 2026-07-31 — several items below were previously listed as not-yet-built but already exist.

- ~~Vector math helpers~~ **[DONE]** — `math.distance(x1,y1,x2,y2)`, `math.lerp(a,b,t)`, `math.clamp(v,min,max)` all shipped. No dedicated `Vec2` type.
- ~~Circle collision~~ **[DONE]** — `collision.circleCollide(a,radiusA,b,radiusB)` shipped, plus `raycast`/`raycastAll`/`pointInBox` (beyond original AABB-only scope).
- ~~Keyframe (tween) animation~~ **[DONE]** — `Keyframe` class + `tween` module (`tween.play`/`stop`/`isPlaying`) shipped, animating a sprite's angle/scale/alpha/position over a sequence of keyframes, linearly interpolated. Built to unblock Dungeon Explorer's melee attack (player spin + sword swing), but scoped as a general-purpose reusable capability, not demo-specific. A free module rather than sprite instance methods — deliberately, since `animatedsprite` doesn't actually inherit from `sprite` in this codebase, so instance methods would've needed hand-duplicating onto both classes; a free module (mirroring `pathfinding.navigateTo`'s existing shape) sidesteps that entirely. Originally shipped with position having no safe default (unlike angle/scale/alpha, which default to neutral values) — a keyframe sequence using position had to set it on every keyframe or the ones that skipped it snapped to `(0, 0)`. That was found to be a real footgun, not just a documented gotcha: it was hit and hand-fixed three separate times building Dungeon Explorer's combat (the player's own spin, the sword, and twice for enemy/boss attack telegraphs), and even once fixed per-instance it meant a tween controlling one channel (e.g. rotation) always had to also pin position, permanently locking out any other system (like `setVelocity`-driven movement) from touching it for the tween's duration — which is what caused the player to go fully immobile for the length of its own spin attack. Reworked so each channel (angle, scale X, scale Y, alpha, position) is only written to the sprite at all if some keyframe in the played sequence explicitly set it via that channel's setter (tracked per-`Keyframe` via `has*` fields, flipped by the setters) — a sequence that never calls `setPosition` never touches position, leaving it free for anything else to control at the same time. Design spec: `docs/superpowers/specs/2026-08-22-keyframe-animation-design.md`. Tests: `tests/lib/Basic4WebGL/unit/transpiler/keyframe.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/tween.test.ts`, `tests/components/Runner/tween.test.ts`. Docs: `src/docs/api-reference/tween.md`.
- ~~Sprite attachment / parenting~~ **[DONE]** — `attachTo(parent)` / `detach()` shipped on both `sprite` and `animatedsprite`. Deliberately deferred out of the keyframe/tween work above rather than designed alongside it — that spec explicitly flagged it as "a separate concern to design then." Built on PIXI's own native container parenting rather than hand-computed per-frame trig: `attachTo` reparents a sprite's PIXI display object under another sprite's, so `setPosition`/`setAngle` are automatically interpreted relative to the parent by PIXI's existing transform stack, and multi-level chains (attaching an already-attached sprite's parent) work for free with zero extra code. No per-frame engine update loop needed at all, unlike `tween`. As an instance method (not a free module like `tween`), it's hand-duplicated onto `animatedsprite.bas` for the same reason `tween`'s design noted `animatedsprite` doesn't inherit from `sprite` in this codebase. Proven out by replacing Dungeon Explorer's hand-built circular-keyframe sword swing with `attachTo`. Design spec: `docs/superpowers/specs/2026-08-23-sprite-attachment-design.md`. Tests: `tests/components/Runner/attach.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/sprite.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/animated-sprite.test.ts`. Docs: `src/docs/api-reference/sprite.md`, `src/docs/api-reference/animatedsprite.md`.
- **Polygon collision** — still not implemented (AABB, circle, and raycast only).
- **Physics / gravity** — Rapier WASM or manual implementation. Not started.
- ~~Save/load (localStorage)~~ **[PROMOTED]** — moved to `docs/roadmap.md` Milestone 3 (Public beta readiness), 2026-08-02. This had sat here unscheduled despite being the actual gate on shippable games (persistent high scores, "continue" saves, roguelike/RPG progression) — a capability gap, not a nice-to-have polish item like the others in this list.
- ~~Text styling~~ **[DONE]** — `Text.setStyle(size,r,g,b)` covers size and colour; `setFont(fontFamily)` and `setAlign(align)` shipped 2026-07-31, exposing font family and left/center/right alignment.
- ~~Particle system~~ **[DONE]** — `Emitter` class (`Emitter.bas` + `src/components/Runner/engine/particles.js`) shipped: `setLifetime`/`setSpawnRate`/`setMaxParticles`/`setSpeed`/`setDirection`/`setGravity`/`setScaleOverLife`/`setAlphaOverLife`/`setColorOverLife`/`setSpawnPoint`/`setSpawnCircle`/`setSpawnBoxShape` config, `start`/`stop`/`burst` actions, `attachTo`/`detach` reused unchanged from the existing sprite-attachment feature (a `PIXI.ParticleContainer` is a `PIXI.Container` subclass, so it reparents exactly like any sprite's handle). Built on PixiJS v8's native `ParticleContainer`/`Particle` for rendering, with all spawn/lifetime/behavior logic hand-written — the official `@pixi/particle-emitter` library that would otherwise provide that behavior layer does not support PixiJS v8 ([confirmed via the project's own tracking issue](https://github.com/pixijs-userland/particle-emitter/issues/211)), and an unofficial community fork was rejected in favor of consistency with how this codebase already builds every other engine capability (PIXI supplies primitives, a hand-written module supplies behavior — the same shape as `tween`/`pathfinding`/`collision`). Individual particle positions deliberately skip the fixed-timestep interpolation system sprites get (see `docs/superpowers/plans/2026-08-24-fixed-timestep-interpolation-plan.md`) — a scope cut, not an oversight, since interpolating potentially hundreds of particles a frame works against the reason `ParticleContainer` was chosen, and per-particle jitter in a chaotic burst is far less perceptible than the same jitter on a single primary sprite. Design: `docs/superpowers/specs/2026-08-25-particle-system-design.md`. Plan: `docs/superpowers/plans/2026-08-25-particle-system-plan.md`. Tests: `tests/components/Runner/particles.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/emitter.test.ts`. Docs: `src/docs/api-reference/emitter.md`. Demo integration deliberately out of scope for this work — a separate follow-up decision.
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
