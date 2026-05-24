# softBASIC Library Roadmap

> Living document. Updated as features are designed and built.
> Last updated: 2026-05-24

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

Three JavaScript singleton objects are injected into the sandboxed iframe at runtime:

| Object | File | Responsibility |
|---|---|---|
| `_SoftBasicGfx` | `src/components/Runner/softBasicGFX.js` | Drawing, keyboard, lifecycle |
| `_SoftAssetManager` | `src/components/Runner/softAssetManager.js` | Texture preloading |
| `_SoftSpriteManager` | `src/components/Runner/softSpriteManager.js` | Sprite creation/lookup |

PIXI v8 is loaded from CDN. Output is rendered in a sandboxed `<iframe>`.

### Existing modules

| Module | Functions |
|---|---|
| `gfx` | `boxCollide(a, b)`, `getKeyDown(keycode)` |
| `math` | `abs` `sin` `cos` `tan` `asin` `acos` `atan` `atan2` `sinh` `cosh` `tanh` `asinh` `acosh` `atanh` `sqrt` `pow` `cbrt` `exp` `log` `log2` `log10` `floor` `ceil` `round` `trunc` `sign` `random(max)` `pi()` `euler()` `val(s)` |
| `string` | `len` `lcase` `ucase` `str` `substr` `split` `trim` `padstart` `padend` |
| `array` | `arrLength` `join` |
| `drawing` | `drawLine(x,y,x2,y2)` `drawRect(x,y,w,h)` `drawCircle(x,y,r)` |
| `pen` | `setFillColor(r,g,b)` `setLineColor(r,g,b)` `setAlpha(obj,a)` |
| `text` | `drawText(s,x,y)` `setText(obj,text)` |
| `transform` | `setPosition(obj,x,y)` `getPositionX(obj)` `getPositionY(obj)` `setAngle(obj,angle)` |
| `stage` | `registerNode(name)` `clear()` |
| `assetmanager` | `loadImage(name)` |
| `spritemanager` | `create(name,texture)` |

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

Priority order agreed 2026-05-23. Each item will get its own brainstorm → spec → plan cycle.

### ~~P1 — Fix `onupdate` wiring~~ **[DONE]**
Fixed. See above.

### ~~P2 — Fix `softBasicGFX.js` binding bugs~~ **[DONE]**
Fixed. See above.

### P3 — Library architecture refactor *(subproject)*
Before adding significant new library surface, address the maintainability issues that would
make all future additions painful. This is its own subproject — not a single task.

Key concerns:

1. **No type signatures for library functions**
   Every library function is `Variant → Variant`. The symbol table knows nothing about return
   types (e.g. what `spritemanager.create()` returns), so the compiler can't validate usage or
   give useful errors. Requires a type manifest — probably a TypeScript descriptor per module.

2. **Hand-written `call()` string templates**
   ```basic
   function abs(n):return call("Math.abs(abs_n)"):endfunction
   ```
   The parameter name must manually match the template variable (`abs_n`). Tedious and fragile
   at scale. A generator or structured descriptor approach would make adding functions trivial.

3. **Three uncoordinated runtime singletons**
   `_SoftBasicGfx`, `_SoftAssetManager`, `_SoftSpriteManager` have no unified surface.
   Extending the runtime means touching multiple files with no clear contract between them.
   Worth unifying behind a single `SoftBasicEngine` (or similar) before the runtime grows
   significantly larger.

4. **Hardcoded canvas size**
   640×360 baked into `softBasicGFX.js` and `pixiInit.js`. No way to change from user code
   or project settings.

> Brainstorm this as a standalone subproject. Output: architecture spec + implementation plan.

### P4 — Audio system
Highest-value missing feature for games. No sound at all currently.

Suggested surface:
```basic
call audio.load("jump", "jump.wav")
call audio.play("jump")
call audio.loop("music")
call audio.stop("music")
call audio.volume("jump", 0.5)
```

Backend: Web Audio API (no external library needed).
New module: `softAudio.ts` + runtime `softAudio.js`.

### P5 — Mouse and touch input
Only keyboard is supported today. Mouse position and click state are needed for most games.

Suggested surface:
```basic
dim x as number = input.mouseX()
dim y as number = input.mouseY()
if input.mouseDown(0) then  ' 0=left, 1=right, 2=middle
```

Optional: `input.touchX(i)`, `input.touchY(i)`, `input.touchCount()` for mobile.

Backend: extend `softBasicGFX.js` with `mousemove`/`mousedown`/`mouseup`/`touchstart` listeners.

### P6 — Scene management
Needed once any game has more than one screen (menu → game → game over). No multi-scene
support exists today.

Suggested surface:
```basic
call scenes.register("game", GameClass)
call scenes.go("menu")
call scenes.push("pause")  ' push/pop for overlay scenes
call scenes.pop()
```

Lifecycle: `onenter()` / `onexit()` per scene class. Stage cleared on scene change.

### P7 — Sprite animation / spritesheets
Sprites are currently static. PIXI natively supports spritesheets — this is mostly a wrapper.

Suggested surface:
```basic
dim anim as spritesheet = assetmanager.loadSheet("player", "player.json")
call spritemanager.createAnimated("hero", anim, "walk")
call spritemanager.setFrame("hero", 3)
call spritemanager.play("hero", "run", true)   ' true = loop
```

### P8 — Camera / viewport
Single static 640×360 view. Anything scrolling or larger than one screen needs this.

Suggested surface:
```basic
call camera.follow("player")
call camera.setPosition(x, y)
call camera.setZoom(1.5)
dim wx as number = camera.worldX(screenX)   ' screen → world coords
```

Backend: PIXI container parented to a camera container; transform applied each frame.

---

## Lower Priority / Future

These are noted for completeness but are not currently scheduled:

- **Vector math helpers** — `distance(x1,y1,x2,y2)`, `lerp(a,b,t)`, `clamp(v,min,max)`, `Vec2` type
- **Circle/polygon collision** — extend beyond AABB
- **Physics / gravity** — Rapier WASM or manual implementation
- **Save/load (localStorage)** — expose to user programs for game state persistence
- **Text styling** — font size, family, alignment
- **Particle system** — emitter abstraction over PIXI particles
- **Keyboard events** (press/release, not just down state)
- **Two-pass compilation** — remove file ordering constraint for class references

---

## Key File Locations

| Purpose | Path |
|---|---|
| Library source files (.bas) | `src/lib/Basic4WebGL/defs/*.bas` |
| Module name → source map | `src/constants/packageModules.ts` |
| First-party package definitions | `src/constants/firstPartyPackages.ts` |
| Package Redux slice | `src/features/packages/packagesSlice.ts` |
| Build hook (packages → ProjectFile[]) | `src/hooks/useProjectForBuild.ts` |
| Compilation entry point | `src/lib/Basic4WebGL/index.ts` |
| Runtime iframe template | `src/components/Runner/bootstrapper.html` |
| Runtime managers | `src/components/Runner/softBasicGFX.js` `.../softAssetManager.js` `.../softSpriteManager.js` |
| PIXI initialisation | `src/components/Runner/pixiInit.js` |
| Built-in type definitions | `src/lib/Basic4WebGL/builtInTypes/definitions/` |
| Runner component | `src/components/Runner/index.tsx` |
