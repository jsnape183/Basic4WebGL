# Raycaster Engine — Phase 6: `RcActors` (billboards, occlusion, hitscan) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `RcActors.bas` + `RcActor.bas` — a softBASIC billboard layer for a raycast scene: a fixed pool of upright sprites positioned in the world, projected into the first-person view, **occluded per screen column** against a new per-column wall-depth buffer in `RcRender`, shaded by `RcLights` at their feet, plus `los` / `hitscan` ray queries (for weapons, enemy fire, "what am I looking at") and a `near(x, y, r)` proximity query. Verified by an unlisted `raycaster-p6` Cypress demo: barrels on a raised ledge and on the floor, one hidden behind a wall, click to hitscan and log the hit.

**Architecture:** Pure softBASIC (spec §1.1) — no new `_sb` module, no `packageModules` entry. Billboards are drawn through the **existing** `drawing.drawImageStrip` (one 1px-wide source slice per 4px screen column, scaled to the strip's screen rect) — which already pools its `PIXI.Sprite` objects and caches strip textures after the Phase 5 `drawing.js` work, so the spec's "fixed pool of sprite instances" is satisfied at the `drawing.js` layer and `RcActor` itself is pure data. `RcRender` gains a per-column depth buffer (`depthArr`), stores the frame's camera basis as fields, and owns the billboard draw (`bindActors` + an internal `drawActors()` after the column loop) — mirroring `bindCamera` / `bindLights`. `RcActors` owns the pool, the queries, and its own `RcCast` for wall marches.

**Tech Stack:** softBASIC (`.bas` library files in the game project); Vitest (transpile + lib-sync + smoke guards); Cypress e2e. No TypeScript/engine changes expected — `drawImageStrip` and its texture cache already exist.

**Spec:** `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` §5.4 (per-span/per-column depth for sprite occlusion), §6.3 (sprites sample the light grid at their feet), §8 (actors / billboards / `los` / `hitscan` / `worldToScreenX`), phase 6 of §11. **Deviation from spec §8 (resolve in Task 9):** `hitscan` returns the hit `RcActor` (or `0`), with `hitKind()` / `hitDist()` / `hitX()` / `hitY()` accessors for detail — mirroring `RcCast`'s established span-accessor pattern — instead of populating the `rayhit.bas` `RayHit` data-class. Reason: `RcCast` already exposes ray results this way; `RayHit` has only `sprite` + `distance` and `new RayHit()` construction from library code is unproven. **Deferred:** sprite animation beyond a flat horizontal frame strip; per-actor rotation/8-direction sprites; actor-vs-actor collision (spec §7.1 — a later phase); spot-cone light sampling for actors.

---

## Background the implementer needs

### Where things are

- **Phases 1–5 shipped** (through `64bbe06`). Canonical library: `demo-src/raycaster/lib/` — `RcConfig.bas`, `RcWorld.bas`, `RcCast.bas`, `RcRender.bas`, `RcMover.bas`, `RcLights.bas`. Each `demo-src/raycaster-p{1..5}/` ships a **byte-identical copy** of the subset it uses (`scripts/buildDemo.ts` is non-recursive). `tests/lib/Basic4WebGL/integration/raycasterDemoLibSync.test.ts` enforces the copies match canonical — for every `.bas` name that exists in `demo-src/raycaster/lib/`. **So: add `RcActors.bas` / `RcActor.bas` to canonical, and every phase dir that has them must have identical copies.** Phase 6's own demo dir (`demo-src/raycaster-p6/`) copies the full set it uses.
- **Guards** (`tests/lib/Basic4WebGL/integration/`): `raycasterDemoTranspile.test.ts` (zero diagnostics), `raycasterDemoLibSync.test.ts` (copies identical), `raycasterDemoSmoke.test.ts` (transpile + `eval` + drive `RcCast`/`RcRender`/`RcMover`/`RcLights` against a stub world — catches runtime `ReferenceError`s), `raycasterDemoProbes.test.ts` (executes the P5 demo scene's `onenter`/`runProbes` against the real `.stm`). All auto-discover `raycaster-p*/`.
- **`RcRender.bas`** (`demo-src/raycaster-p5/RcRender.bas`, canonical identical): `new RcRender(w as RcWorld)`, `bindCamera(mover)`, `bindLights(lights)`, `setCamera(x,y,angle,pitch)`, `setFov(deg)`, `columnCount()`, `projectY(h, d)`, `drawStrip(destX, sTop, sBot, winTop, winBot, shadeKind, lightLevel)`, `renderFrame()`. Fields: `camX camY camAngle camPitch fovScale viewW viewH scy cols camZ boundMover boundLights`. `renderFrame` computes `dirX dirY planeX planeY` as **locals** each frame (Task 1 promotes them to fields); the column loop is `for col = 0 to self.cols - 1`, `cameraX = (2.0 * col / self.cols) - 1.0`, `rayX = dirX + planeX * cameraX`, casts, walks spans, and on the WALL span does `drawStrip(...)` then `i = n` (terminates the while). `RC_STRIP_W = 4`; `destX = col * RC_STRIP_W + RC_STRIP_W / 2`.
- **`RcCast.bas`**: `cast(wld, ox, oy, dx, dy)` fills span arrays; `los(wld, ox, oy, dx, dy)` → perpendicular distance to first opaque wall along **(dx,dy) as given** (not normalized — `los` returns world units because `deltaDist = |1/dir|`), or `-1` if none within `RC_MAX_DIST`. `spanCount()`, `spanKind(i)`, `spanDist(i)`, `spanLo(i)`, `spanHi(i)`, `spanCol(i)`, `spanRow(i)`, `spanSide(i)`, `spanU(i)`, `spanTex(i)`. **`los` normalizing note:** for a euclidean-comparable distance, pass a **normalized** (dx,dy) — `RcLights.splatCell` does exactly this (`self.rc.los(self.wld, wx, wy, dx / dist, dy / dist)`).
- **`RcMover.bas`**: `move(fwd, strafe)`, `turn(dAngle)`, `look(dPitch)`, `jump()`, `step(dt)`, `x()`, `y()`, `z()`, `angle()`, `pitch()`, `onGround()`.
- **`RcLights.bas`**: `new RcLights(w as RcWorld)`, `setAmbient(level)`, `addPoint(x,y,z,intensity,radiusCells)` → handle, `moveLight(handle,x,y)`, `setLightIntensity(handle,i)`, `removeLight(handle)`, `update()`, `sampleCell(col, row)` → `0`–`1` (OOB → `ambient`).
- **`RcConfig.bas`** `const` block currently ends `RC_STATIC_INTENSITY = 0.9` / `endconst`. Task 2 appends actor constants.
- **`RcWorld.bas`**: `wallAt(col,row)`, `floorHeightAt(col,row)`, `ceilHeightAt(col,row)`, `wallTexAt`, `floorTexAt`, `ceilTexAt`, `lightAt(col,row)`, `widthCells()`, `heightCells()`, `inBounds(col,row)`.
- **`drawing.drawImageStrip(imageName, srcX, destX, destY, destWidth, destHeight)`** — exists (`src/lib/Basic4WebGL/defs/drawing.bas:17`, descriptor `drawing.descriptor.ts`). Engine (`drawing.js`): takes a **1px-wide, full-image-height** vertical slice at pixel `srcX` of `imageName`, scales it to `destWidth × destHeight`, anchored at centre `(destX, destY)`. Texture cache key is `imageName + ':' + srcX` (bounded — a 32px sprite → ≤32 cached textures). Pooled `PIXI.Sprite` reused frame-to-frame; `drawing.clear()` returns them to the pool.
- **`input` def**: `input.mouseX()`, `input.mouseY()`, `input.mouseDown()` (all via `_sb.getMouse*`); `input.bind(name, "key", keyboard.X)`, `input.getKeyDown(name)` / `input.keyPressed(name)` — see `demo-src/raycaster-p4/WalkScene.bas` / `demo-src/raycaster-p5/LitScene.bas` for the WASD drive pattern (`input.bind` in `Constructor()`, polled in `onupdate(delta)`).
- **Demo wiring**: `src/features/demos/devDemoRegistry.ts` (add `raycaster-p6-actors` → `RaycasterP6Actors`), `tests/ui/features/demos/devDemoRegistry.test.ts` (mirror test per entry), `cypress/e2e/demos.cy.ts` `DEV_DEMOS` array (`waitMs`). `Main.bas` pattern (p5): `oninit()` sets `world.setPixelPerfect(true)`; then module-level `dim scn = new ActorScene()` / `scenemanager.register("actors", scn)` / `scenemanager.switch("actors")`.
- **Build**: `npm run build:demo -- demo-src/raycaster-p6 RaycasterP6Actors` → writes `src/docs/demos/RaycasterP6Actors.b4wgl.json`. `packageDemo` gives `.stm` / `.json` MIME `application/json`, `.png` → `image/png`.

### softBASIC facts / footguns (verified this project)

- **Never name a param/local after a builtin module** (`world`, `math`, `array`, `string`, `input`, `camera`, `hud`, `stage`, `pen`, `drawing`, `scenemanager`, `collision`, `save`, `file`, `audio`, `assetmanager`, `gfx`, `keyboard`, `controller`, `tween`). Transpiles clean (zero diagnostics) → emits a broken `<Class>.<method>.<param>` reference chain → `ReferenceError` **at runtime only**. Use `wld` for an `RcWorld`, `ren` for an `RcRender`, `act` for an `RcActor`, etc.
- **`const` block:** prefixed access only — `RcConfig.RC_ACTOR_MAX` from another file; a bare `RC_ACTOR_MAX` does **not** resolve cross-file.
- No `elseif`. No `%` / bitwise. `0 - x` for negation. `and` / `or` / `not` in `if` (but `not` cannot appear *after* `and`/`or` — put a leading `not` or reorder). `<>` is not-equal.
- Function-scoped `dim`s must be **hoisted to the top of the function**.
- **`Class` must be line 1** of a `.bas` file. One class per file. `Extends scene` for a scene class.
- Typed **function-locals of user classes** work (`dim a as RcMover` then `a.x()`), and typed **`self`-field** access works (`self.ren.renderFrame()`). **Method calls** on external instances work. **Untyped `.field` reads** on an external instance do **not** parse — always go through a method (`RcCast` exposes `spanKind(i)` not `.kindArr(i)`; do the same).
- **METHOD-CALL PARSE (Phase 6):** `someLocal.method(arg1, arg2)` in an **expression** (`d = a.distanceTo(x, y)`) — **FIXED, commit `8098c42`.** Still broken: `self.arr(i).method(args)` — a method call chained directly onto an array-index expression (`Expected NewLine … got Dot`, roadmap #33). Split it: `dim e` / `e = self.arr(i)` / `e.method(args)`. Also still broken: `.method()` chained onto a call result (`self.actors.near(x,y,r).x()`) — split with a local. Zero-arg calls, bare-statement arg calls, and `self.field.method(args)` in expressions all work.
- **Passing an array as a parameter and mutating `arr(i) = v` inside** — used successfully in `RcLights` Phase 5 (`splat(grid, ...)` was refactored *away* from this to a `which`-flag form; check `RcLights.bas` for which shape shipped and follow it). If unsure, keep arrays as **member** arrays and branch internally rather than passing them.
- `math`: `sin cos tan pi() abs floor min max clamp val sqrt sign`. No `math.pow` (`x * x`). `math.atan2` — **verify** in `src/lib/Basic4WebGL/defs/math.bas` before using; if absent, avoid it (billboard math below does not need it).
- Scene lifecycle: `Constructor()`, `onenter()`, `onupdate(delta)` — **`delta` is milliseconds**. `bare return` in a function is valid.
- **A failed probe must throw** to surface as `ERR` in the console panel (Cypress asserts no `ERR` span). Reuse the P5 `probe(label, passed, y)` helper: renders `label + ": OK|FAIL"` via `new Text(...)` + `hud.add`, and on `passed = 0` does `boom = array.arrLength(missing)` on an **unassigned** `dim missing` — a caught runtimeError. Copy it verbatim from `demo-src/raycaster-p5/LitScene.bas`.

### Billboard projection math (reference — used in Task 5)

Camera basis this frame: `dirX,dirY = cos/sin(camAngle)`, `planeX = -dirY * fovScale`, `planeY = dirX * fovScale` (already computed in `renderFrame`; Task 1 stores them as fields).

**Sprite dimensions are passed explicitly** to `RcActors.add(imageName, x, y, z, frameW, frameH)` — the game knows its own art (`rc_barrel.png` is 32×32), and `assetmanager` has no way to report a loaded image's pixel size without instantiating a `sprite` (the untyped return of `assetmanager.loadImage` can't have `.width` read off it — untyped external field reads don't parse). No engine change; `frameW`/`frameH` drive both the on-screen aspect and the `srcX` column→texel mapping.

For an actor at world `(ax, ay)` with feet-height `az`:

```
relX = ax - camX
relY = ay - camY
invDet = 1.0 / (planeX * dirY - dirX * planeY)      ' constant per frame; hoist
tX = invDet * (dirY * relX - dirX * relY)            ' lateral
depth = invDet * (0 - planeY * relX + planeX * relY) ' forward distance (perp, no fisheye)
if depth <= 0.05 then  ' behind / on the camera plane -> skip
```

Billboard centre X in pixels: `cx = (viewW / 2) * (1.0 + tX / depth)`.
On-screen width: `wPx = hPx * (frameW / frameH)`.
Vertical placement: the actor's **feet** sit at world height `az`; project with the existing identity — `feetY = projectY(az, depth)`, `headY = projectY(az + RcConfig.RC_ACTOR_HEIGHT, depth)`. `hPx = feetY - headY`. This automatically respects `camZ`, `camPitch`, and the actor standing on a ledge.
Column span: `leftPx = cx - wPx/2`; `c0 = floor(leftPx / RC_STRIP_W)`, `c1 = floor((cx + wPx/2) / RC_STRIP_W)`, clamped to `0 .. cols-1`.
Per column `c` in `[c0, c1]`: `if depth < self.depthAt(c) then` draw. `centerPx = c * RC_STRIP_W + RC_STRIP_W/2`; `frac = (centerPx - leftPx) / wPx` (0..1 across the sprite); skip if `frac < 0 or frac > 1`; `srcX = floor(actor.frame() * frameW + frac * frameW)`; `drawing.drawImageStrip(actor.image(), srcX, centerPx, (feetY + headY)/2, RC_STRIP_W, hPx)`.
Lighting: `drawImageStrip` has **no tint parameter** (spec §5.3 rung 3, deferred). **Decision: Phase 6 actors are gated on depth only — no per-actor tint.** `RcActor` still stores the tint; nothing applies it yet. The light grid still shades the *walls* around each actor so the scene reads correctly. Documented in `RcActors.bas` header + Task 9 limits; revisit when `drawImageStrip(tint)` lands.

---

## Task 1: `RcRender` — per-column depth buffer + camera-basis fields + `worldToScreenX`

**Files:** Modify `demo-src/raycaster/lib/RcRender.bas`; re-sync `demo-src/raycaster-p{3,4,5}/RcRender.bas`; extend `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`.

- [ ] **Step 1: Add fields + init.** In the `dim` block after `boundLights` add:

```basic
dim boundActors
dim fDirX
dim fDirY
dim fPlaneX
dim fPlaneY
dim depthArr(0)
```

In `Constructor`, after `self.boundLights = 0`:

```basic
    self.boundActors = 0
    self.fDirX = 1
    self.fDirY = 0
    self.fPlaneX = 0
    self.fPlaneY = self.fovScale
    dim di
    for di = 0 to self.cols - 1
        array.push(self.depthArr, RcConfig.RC_MAX_DIST)
    next di
```

(`dim di` hoisted to the top of `Constructor` per softBASIC rules.)

- [ ] **Step 2: `bindActors` + accessors.** Add:

```basic
function bindActors(actors)
    self.boundActors = actors
endfunction

function depthAt(col)
    if col < 0 then
        return 0
    endif
    if col >= self.cols then
        return 0
    endif
    return self.depthArr(col)
endfunction

' Screen pixel X of world point (wx, wy) along the current camera basis, or -1
' if the point is behind the camera plane. Uses last renderFrame()'s basis.
function worldToScreenX(wx, wy)
    dim relX
    dim relY
    dim invDet
    dim depth
    dim tX
    relX = wx - self.camX
    relY = wy - self.camY
    invDet = 1.0 / (self.fPlaneX * self.fDirY - self.fDirX * self.fPlaneY)
    depth = invDet * (0 - self.fPlaneY * relX + self.fPlaneX * relY)
    if depth <= 0.05 then
        return -1
    endif
    tX = invDet * (self.fDirY * relX - self.fDirX * relY)
    return (self.viewW / 2) * (1.0 + tX / depth)
endfunction
```

- [ ] **Step 3: Populate the basis + depth in `renderFrame`.** Where `renderFrame` currently sets the locals `dirX/dirY/planeX/planeY`, also store them:

```basic
    dirX = math.cos(self.camAngle)
    dirY = math.sin(self.camAngle)
    planeX = 0 - dirY * self.fovScale
    planeY = dirX * self.fovScale
    self.fDirX = dirX
    self.fDirY = dirY
    self.fPlaneX = planeX
    self.fPlaneY = planeY
```

Inside the column loop, initialise `self.depthArr(col) = RcConfig.RC_MAX_DIST` at the top of each column iteration; when a WALL span is drawn (the `if kind = RcConfig.RC_SPAN_WALL then ... i = n` branch), set `self.depthArr(col) = d` **before** `i = n`.

- [ ] **Step 4: Call `drawActors` after the column loop.** At the very end of `renderFrame`, after `next col`:

```basic
    if self.boundActors <> 0 then
        self.drawActors()
    endif
```

Add a **stub** `drawActors()` for now (Task 5 fills it):

```basic
' Billboard pass -- projects RcActors against depthArr. Filled in Phase 6 Task 5.
function drawActors()
    return
endfunction
```

- [ ] **Step 5: Re-sync copies.**

```bash
cp demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p3/RcRender.bas
cp demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p4/RcRender.bas
cp demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p5/RcRender.bas
```

- [ ] **Step 6: Smoke test.** In `raycasterDemoSmoke.test.ts`, the `RcRenderLike` interface: add `depthat(col: number): number`, `worldtoscreenx(x: number, y: number): number`, `bindactors(a: unknown): void`. In the `RcRender ... renderFrame runs` case, after the existing checks add:

```ts
expect(() => r.depthat(0)).not.toThrow();
expect(typeof r.worldtoscreenx(3, 3)).toBe('number');
```

- [ ] **Step 7: Verify.** `npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo` — all green (lib-sync, transpile, smoke, probes). `npx vitest run` full suite green. `npx vite build` clean.

- [ ] **Step 8: Commit.**

```bash
git add demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p3/RcRender.bas demo-src/raycaster-p4/RcRender.bas demo-src/raycaster-p5/RcRender.bas tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts
git commit -m "feat(raycaster): RcRender per-column depth buffer + worldToScreenX (Phase 6 prep)"
```

---

## Task 2: `RcConfig` — actor constants

**Files:** Modify `demo-src/raycaster/lib/RcConfig.bas`; re-sync every phase dir that **already has** a `RcConfig.bas` copy (p2–p5 — p1 has only `RcWorld.bas`/`MapProbeScene.bas` and does not use `RcConfig`, so do NOT create one there).

- [ ] **Step 1:** Insert before `endconst`:

```basic
    RC_ACTOR_POOL = 32
    RC_ACTOR_HEIGHT = 1.0
    RC_HITSCAN_RANGE = 24.0
    RC_HIT_NONE = 0
    RC_HIT_WALL = 1
    RC_HIT_ACTOR = 2
```

`RC_ACTOR_POOL` — max simultaneous billboards. `RC_ACTOR_HEIGHT` — world-units tall a 1-frame sprite is drawn. `RC_HITSCAN_RANGE` — default max hitscan distance. `RC_HIT_*` — `hitKind()` return values.

- [ ] **Step 2:** Re-sync:

```bash
for d in 2 3 4 5; do cp demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-p$d/RcConfig.bas; done
```

- [ ] **Step 3:** `npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo` green.

- [ ] **Step 4: Commit.**

```bash
git add demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-p2 demo-src/raycaster-p3 demo-src/raycaster-p4 demo-src/raycaster-p5
git commit -m "feat(raycaster): RcConfig actor + hitscan constants"
```

---

## Task 3: `RcActor.bas` — the billboard element (pure data)

**Files:** Create `demo-src/raycaster/lib/RcActor.bas`.

- [ ] **Step 1: Create the file.** One field-accessor class, no rendering, no engine calls — the pool in `RcActors` owns lifecycle.

```basic
Class
' RcActor -- one billboard in a raycast scene (spec §8). Pure data: an image
' name, its source frame size in pixels (frameW x frameH -- one horizontal frame
' of the sprite strip), a world position (x, y) + feet height z, a frame index,
' an RGB tint (stored but NOT yet applied -- drawImageStrip has no tint
' parameter; see RcActors.bas header), and a visible flag. RcActors owns a fixed
' pool of these; the game never `new`s one directly.
'
' Never name anything here `world` / `math` / etc. (builtin-module shadow -> a
' clean transpile that ReferenceErrors at runtime).
dim img
dim fw
dim fh
dim ax
dim ay
dim az
dim frm
dim tr
dim tg
dim tb
dim vis

Constructor()
    self.img = ""
    self.fw = 1
    self.fh = 1
    self.ax = 0
    self.ay = 0
    self.az = 0
    self.frm = 0
    self.tr = 255
    self.tg = 255
    self.tb = 255
    self.vis = 0
EndConstructor

function reset(imageName, x, y, z, frameW, frameH)
    self.img = imageName
    self.fw = frameW
    self.fh = frameH
    self.ax = x
    self.ay = y
    self.az = z
    self.frm = 0
    self.tr = 255
    self.tg = 255
    self.tb = 255
    self.vis = 1
endfunction

function setPosition(x, y)
    self.ax = x
    self.ay = y
endfunction

function setHeight(z)
    self.az = z
endfunction

function setFrame(i)
    self.frm = i
endfunction

function setTint(r, g, b)
    self.tr = r
    self.tg = g
    self.tb = b
endfunction

function setVisible(v)
    self.vis = v
endfunction

function image()
    return self.img
endfunction

function frameW()
    return self.fw
endfunction

function frameH()
    return self.fh
endfunction

function x()
    return self.ax
endfunction

function y()
    return self.ay
endfunction

function z()
    return self.az
endfunction

function frame()
    return self.frm
endfunction

function visible()
    return self.vis
endfunction

function tintR()
    return self.tr
endfunction

function tintG()
    return self.tg
endfunction

function tintB()
    return self.tb
endfunction

' Straight-line distance from this actor to a world point.
function distanceTo(px, py)
    dim dx
    dim dy
    dx = self.ax - px
    dy = self.ay - py
    return math.sqrt(dx * dx + dy * dy)
endfunction

EndClass
```

- [ ] **Step 2: Transpile probe.** Create `tests/scratch/rcActorProbe.test.ts` (in `tests/scratch/` — gitignored, excluded from the suite glob; copy to `tests/lib/Basic4WebGL/rcActorProbeTmp.test.ts` to actually run it, then `mv` it to the scratchpad dir when green):

```ts
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { packageModules } from '../../../src/constants/packageModules';

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

describe('RcActor transpiles clean', () => {
  test('probe', () => {
    const src = require('node:fs').readFileSync('demo-src/raycaster/lib/RcActor.bas', 'utf-8');
    const r = compiler.transpile({ lib, files: [{ name: 'RcActor.bas', source: src }] });
    expect(r.diagnostics).toEqual([]);
  });
});
```

Run: `cp tests/scratch/rcActorProbe.test.ts tests/lib/Basic4WebGL/rcActorProbeTmp.test.ts && npx vitest run tests/lib/Basic4WebGL/rcActorProbeTmp.test.ts`. Expect PASS (zero diagnostics). If `math.sqrt` or a `self.` accessor pattern errors, fix `RcActor.bas`. `mv tests/lib/Basic4WebGL/rcActorProbeTmp.test.ts` out of the tree when green.

- [ ] **Step 3: Commit.**

```bash
git add demo-src/raycaster/lib/RcActor.bas
git commit -m "feat(raycaster): RcActor.bas billboard element (Phase 6)"
```

---

## Task 4: `RcActors.bas` — the pool + `near` / `los` / `hitscan`

**Files:** Create `demo-src/raycaster/lib/RcActors.bas`; extend `raycasterDemoSmoke.test.ts`.

- [ ] **Step 1: Create the module.**

```basic
Class
' RcActors -- billboard pool + ray queries for a raycast scene (spec §8).
'
' A fixed pool of RcActor (RC_ACTOR_POOL) created once in the Constructor;
' add()/remove() flip a visible flag, never allocate. RcRender.bindActors(this)
' + RcRender's drawActors() pass projects the visible ones against the per-column
' wall-depth buffer (spec §5.4) so a billboard behind a wall or a ledge is
' correctly clipped, column by column.
'
' Ray queries share the DDA in an owned RcCast:
'   los(x, y, dx, dy)         -> distance to the first opaque WALL, or -1
'   hitscan(x, y, dx, dy, rng) -> the nearest thing the ray hits within rng:
'                                 an RcActor (actor hit) or 0 (wall hit / miss);
'                                 hitKind()/hitDist()/hitX()/hitY() give detail.
'   near(x, y, r)             -> the nearest visible actor within r, or 0
'
' Tint is stored on RcActor but NOT applied -- drawImageStrip has no tint param
' (spec §5.3 rung 3, deferred). Actors are gated on depth only for now; the light
' grid still shades the surrounding walls. Revisit with textured walls.
'
' The RcWorld field is `wld`, NEVER `world`.
dim wld as RcWorld
dim rc as RcCast
dim pool(0)
dim count
dim hKind
dim hDist
dim hX
dim hY
dim hActor

Constructor(w as RcWorld)
    self.wld = w
    self.rc = new RcCast()
    self.count = 0
    self.hKind = RcConfig.RC_HIT_NONE
    self.hDist = -1
    self.hX = 0
    self.hY = 0
    self.hActor = 0
    dim i
    dim a as RcActor
    for i = 0 to RcConfig.RC_ACTOR_POOL - 1
        a = new RcActor()
        array.push(self.pool, a)
    next i
EndConstructor

' Claim a pooled slot. frameW/frameH are the sprite's source frame size in
' pixels (one horizontal frame). Returns the RcActor, or 0 if the pool is full.
function add(imageName, x, y, z, frameW, frameH)
    dim i
    dim a as RcActor
    for i = 0 to RcConfig.RC_ACTOR_POOL - 1
        a = self.pool(i)
        if a.visible() = 0 then
            a.reset(imageName, x, y, z, frameW, frameH)
            self.count = self.count + 1
            return a
        endif
    next i
    return 0
endfunction

function remove(act as RcActor)
    if act.visible() = 1 then
        act.setVisible(0)
        self.count = self.count - 1
    endif
endfunction

function activeCount()
    return self.count
endfunction

function poolSize()
    return RcConfig.RC_ACTOR_POOL
endfunction

' Direct pool access for RcRender.drawActors() -- iterate 0..poolSize()-1 and
' skip actors whose visible() = 0.
function actorAt(i)
    return self.pool(i)
endfunction

' Nearest visible actor within radius r of (x, y), or 0.
function near(x, y, r)
    dim i
    dim a as RcActor
    dim best
    dim bestD
    dim d
    best = 0
    bestD = r
    for i = 0 to RcConfig.RC_ACTOR_POOL - 1
        a = self.pool(i)
        if a.visible() = 1 then
            d = a.distanceTo(x, y)
            if d <= bestD then
                bestD = d
                best = a
            endif
        endif
    next i
    return best
endfunction

' Distance to the first opaque wall along (dx, dy). Thin pass-through to RcCast
' so callers do not need their own RcCast; (dx, dy) need not be normalized (world
' units out regardless -- see RcCast.los).
function los(x, y, dx, dy)
    return self.rc.los(self.wld, x, y, dx, dy)
endfunction

' Nearest hit along the ray (x,y)+(dx,dy) within range rng. (dx, dy) MUST be
' normalized -- actor hits are found by projecting each actor onto the ray in
' euclidean space, which only matches the wall distance if |dir| = 1.
' Returns the hit RcActor, or 0 for a wall hit or a miss. Populates
' hKind/hDist/hX/hY.
function hitscan(x, y, dx, dy, rng)
    dim wallD
    dim i
    dim a as RcActor
    dim relX
    dim relY
    dim along
    dim perp
    dim closest
    dim closestD
    dim limit

    self.hKind = RcConfig.RC_HIT_NONE
    self.hDist = -1
    self.hActor = 0

    wallD = self.rc.los(self.wld, x, y, dx, dy)
    limit = rng
    if wallD >= 0 and wallD < limit then
        limit = wallD
    endif

    closest = 0
    closestD = limit
    for i = 0 to RcConfig.RC_ACTOR_POOL - 1
        a = self.pool(i)
        if a.visible() = 1 then
            relX = a.x() - x
            relY = a.y() - y
            along = relX * dx + relY * dy
            if along > 0 and along <= closestD then
                perp = math.abs(relX * dy - relY * dx)
                if perp < 0.4 then
                    closestD = along
                    closest = a
                endif
            endif
        endif
    next i

    if closest <> 0 then
        self.hKind = RcConfig.RC_HIT_ACTOR
        self.hDist = closestD
        self.hX = x + dx * closestD
        self.hY = y + dy * closestD
        self.hActor = closest
        return closest
    endif

    if wallD >= 0 and wallD <= rng then
        self.hKind = RcConfig.RC_HIT_WALL
        self.hDist = wallD
        self.hX = x + dx * wallD
        self.hY = y + dy * wallD
    endif
    return 0
endfunction

function hitKind()
    return self.hKind
endfunction

function hitDist()
    return self.hDist
endfunction

function hitX()
    return self.hX
endfunction

function hitY()
    return self.hY
endfunction

EndClass
```

- [ ] **Step 2: Check the array-of-typed-objects pattern.** `dim pool(0)` + `array.push(self.pool, a)` where `a as RcActor`, then `a = self.pool(i)` into a `dim a as RcActor` local, then `a.visible()`. This is the **exact** pattern `RcWorld` uses for markers (`dim mk as Marker` / `markers(mi)`) and bullet-hell demos use for enemy arrays — it works. If the transpile probe (Step 4) shows otherwise, fall back to parallel primitive arrays (`imgArr`, `xArr`, ...) + an index-based API, but try the object-array form first.

- [ ] **Step 3: Verify `math.abs` / `array.push` / `array.arrLength`** are all real (they are — used across the existing lib). No `math.atan2` used here.

- [ ] **Step 4: Transpile probe** — full canonical lib set + `RcActor.bas` + `RcActors.bas` + a one-function `Main.bas` that news an `RcActors`, calls `add`, `near`, `hitscan`, `los`. Zero diagnostics. Iterate. Discard the probe file when green.

- [ ] **Step 5: Smoke test.** In `raycasterDemoSmoke.test.ts`:
  - `stubWorld` already has `wallat`, `widthcells`, `heightcells`, `lightat` etc. Confirm `wallat(c,r)` returns a truthy value for `c<=0||c>=6` (it does).
  - Add `RcActors` to `evalDemo`'s returned module map (`RcActors: typeof _sb_rcactors !== 'undefined' ? _sb_rcactors : null`) and an interface `RcActorsLike { add(...): unknown; near(...): unknown; los(...): number; hitscan(...): unknown; hitkind(): number; activecount(): number; actorat(i: number): unknown; poolsize(): number; }`.
  - New `test.each` case:
    ```ts
    test.each(phaseDirs)('%s: RcActors (if present) pool + queries run', (dirName) => {
      const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`));
      if (!mod.RcActors) return;
      const A = new mod.RcActors(stubWorld);
      const act = A.add('barrel.png', 2, 2, 0, 32, 32) as { visible(): number } | 0;
      expect(act).not.toBe(0);
      expect(A.activecount()).toBe(1);
      expect(() => A.near(2, 2, 5)).not.toThrow();
      expect(() => A.los(1.5, 1.5, 1, 0)).not.toThrow();
      expect(() => A.hitscan(1.5, 1.5, 1, 0, 20)).not.toThrow();
      expect(typeof A.hitkind()).toBe('number');
    });
    ```
  - Also extend the `RcRender ... renderFrame runs` case: `if (mod.RcActors) { const A = new mod.RcActors(stubWorld); r.bindactors(A); expect(() => r.renderframe()).not.toThrow(); }`.

- [ ] **Step 6: Verify.** `npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo` — lib-sync will now demand `RcActor.bas` / `RcActors.bas` copies in any phase dir that has them; none do yet, so still green. `npx vitest run` full green. `npx vite build` clean.

- [ ] **Step 7: Commit.**

```bash
git add demo-src/raycaster/lib/RcActors.bas tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts
git commit -m "feat(raycaster): RcActors.bas billboard pool + near/los/hitscan (Phase 6)"
```

---

## Task 5: `RcRender.drawActors()` — the billboard pass

**Files:** Modify `demo-src/raycaster/lib/RcRender.bas`; re-sync `demo-src/raycaster-p{3,4,5}/RcRender.bas`. **Also** copy `RcActor.bas` + `RcActors.bas` into `demo-src/raycaster-p{3,4,5}/` — `drawActors` has `dim a as RcActor` (a typed local), so `raycasterDemoTranspile.test.ts` (which transpiles each phase dir standalone) needs those two files present there. lib-sync auto-picks them up.

- [ ] **Step 1: Add the two scratch member arrays.** In `RcRender.bas`'s `dim` block (with the other Phase-6 fields from Task 1) add:

```basic
dim actorOrderIdx(0)
dim actorOrderDepth(0)
```

These are re-used every frame (`array.clear` + rebuild) — never declare growable `dim x(0)` arrays as function-locals; each call would re-`push` onto an ever-growing array.

- [ ] **Step 2: Replace the `drawActors()` stub** with the projection + far→near sort + per-column depth-clipped strip draw. Uses `self.fDirX/fDirY/fPlaneX/fPlaneY` (set in `renderFrame`), `self.depthArr` (via `self.depthAt(c)`), `self.projectY`, `self.boundActors`, and `RcConfig.RC_ACTOR_HEIGHT` / `RC_STRIP_W`. Sprite frame size comes from the actor (`a.frameW()` / `a.frameH()`) — passed to `RcActors.add` by the game.

```basic
' Billboard pass -- project every visible RcActor, sort far->near, and draw each
' as depth-clipped vertical strips against depthArr (spec §5.4 / §8). One source
' frame is a horizontal slice frameW px wide at (frame index * frameW); the
' sprite is drawn RC_ACTOR_HEIGHT world-units tall, width scaled by frameW/frameH.
' No per-actor tint yet -- drawImageStrip has no tint param (spec §5.3 rung 3).
function drawActors()
    dim n
    dim i
    dim j
    dim m
    dim a as RcActor
    dim relX
    dim relY
    dim invDet
    dim depth
    dim tX
    dim cx
    dim feetY
    dim headY
    dim hPx
    dim wPx
    dim fw
    dim fh
    dim leftPx
    dim c0
    dim c1
    dim c
    dim centerPx
    dim frac
    dim srcX
    dim tmpI
    dim tmpD

    invDet = 1.0 / (self.fPlaneX * self.fDirY - self.fDirX * self.fPlaneY)
    n = self.boundActors.poolSize()

    ' collect visible, in-front actors with their forward depth
    array.clear(self.actorOrderIdx)
    array.clear(self.actorOrderDepth)
    for i = 0 to n - 1
        a = self.boundActors.actorAt(i)
        if a.visible() = 1 then
            relX = a.x() - self.camX
            relY = a.y() - self.camY
            depth = invDet * (0 - self.fPlaneY * relX + self.fPlaneX * relY)
            if depth > 0.05 then
                array.push(self.actorOrderIdx, i)
                array.push(self.actorOrderDepth, depth)
            endif
        endif
    next i

    ' insertion sort by depth descending (far first) -- pool is small (<= 32)
    m = array.arrLength(self.actorOrderIdx)
    for i = 1 to m - 1
        tmpI = self.actorOrderIdx(i)
        tmpD = self.actorOrderDepth(i)
        j = i - 1
        while j >= 0 and self.actorOrderDepth(j) < tmpD
            self.actorOrderIdx(j + 1) = self.actorOrderIdx(j)
            self.actorOrderDepth(j + 1) = self.actorOrderDepth(j)
            j = j - 1
        endwhile
        self.actorOrderIdx(j + 1) = tmpI
        self.actorOrderDepth(j + 1) = tmpD
    next i

    for i = 0 to m - 1
        a = self.boundActors.actorAt(self.actorOrderIdx(i))
        depth = self.actorOrderDepth(i)
        fw = a.frameW()
        fh = a.frameH()
        if fh <= 0 then
            fh = 1
        endif

        relX = a.x() - self.camX
        relY = a.y() - self.camY
        tX = invDet * (self.fDirY * relX - self.fDirX * relY)
        cx = (self.viewW / 2) * (1.0 + tX / depth)

        feetY = self.projectY(a.z(), depth)
        headY = self.projectY(a.z() + RcConfig.RC_ACTOR_HEIGHT, depth)
        hPx = feetY - headY
        wPx = hPx * (fw / fh)

        leftPx = cx - wPx / 2
        c0 = math.floor(leftPx / RcConfig.RC_STRIP_W)
        c1 = math.floor((cx + wPx / 2) / RcConfig.RC_STRIP_W)
        if c0 < 0 then
            c0 = 0
        endif
        if c1 > self.cols - 1 then
            c1 = self.cols - 1
        endif

        for c = c0 to c1
            if depth < self.depthAt(c) then
                centerPx = c * RcConfig.RC_STRIP_W + RcConfig.RC_STRIP_W / 2
                frac = (centerPx - leftPx) / wPx
                if frac >= 0 and frac <= 1 then
                    srcX = math.floor(a.frame() * fw + frac * fw)
                    drawing.drawImageStrip(a.image(), srcX, centerPx, (feetY + headY) / 2, RcConfig.RC_STRIP_W, hPx)
                endif
            endif
        next c
    next i
endfunction
```

- [ ] **Step 3: Re-sync copies.**

```bash
cp demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p3/RcRender.bas
cp demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p4/RcRender.bas
cp demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p5/RcRender.bas
```

- [ ] **Step 4: Transpile probe** — full canonical lib + `RcActor.bas` + `RcActors.bas` + a `Main.bas` that news `RcRender`, `RcActors`, `ren.bindActors(actors)`, and calls `ren.renderFrame()`. Zero diagnostics. Watch specifically for: `dim a as RcActor` inside `drawActors` resolving (typed local of a lib class — should be fine, `RcRender` already does `dim ... as` nowhere, so this is the first; `RcMover`'s `runProbes` does `dim a as RcMover` in a scene, and `RcWorld` does `dim mk as Marker` in a lib method — the pattern works in lib methods). Iterate; discard the probe when green.

- [ ] **Step 5: Smoke** — the smoke `stubWorld` path drives `renderFrame` with `cols = NaN` (stage stub), so `drawActors`'s column loop is inert, but the sort + projection run. Extend the `RcRender ... renderFrame runs` case in `raycasterDemoSmoke.test.ts`:

```ts
if (mod.RcActors) {
  const A = new mod.RcActors(stubWorld);
  A.add('x.png', 2, 2, 0, 32, 32);
  r.bindactors(A);
  expect(() => r.renderframe()).not.toThrow();
}
```

- [ ] **Step 6: Verify.** Full guard set + `npx vitest run` + `npx vite build`.

- [ ] **Step 7: Commit.**

```bash
git add demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p3/RcRender.bas demo-src/raycaster-p4/RcRender.bas demo-src/raycaster-p5/RcRender.bas tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts
git commit -m "feat(raycaster): RcRender.drawActors billboard pass, depth-clipped per column (Phase 6)"
```

---

## Task 6: Phase 6 room + billboard art

**Files:** Create `demo-src/raycaster-p6/assets/p6room.stm`, `demo-src/raycaster-p6/assets/rc_placeholder_tiles.png` (copy from `demo-src/raycaster-p5/assets/`), `demo-src/raycaster-p6/assets/rc_enemy.png` (copy from `demo-src/raycaster/assets/enemy.png` — a 64×64 transparent raycaster billboard sprite from the shipped raycaster demo; reuse rather than generate, same as p1 reused BulletHell's tilesheet). **DONE by coordinator — this task's files already exist and are committed; a reviewer only needs to sanity-check them.**

- [ ] **Step 1: Room.** A 14-wide × 10-tall room with: (a) a raised-floor ledge (floor height `0.4`) at cells (col 10-11, row 7-8) so an actor stands higher than the camera; (b) a wall stub at (col 8, rows 2-3) so an actor at (9.5, 2.5) sits fully behind it (occlusion test); (c) open floor for a third actor at (6.5, 3.0). Ceiling `1.0`, floor `0` elsewhere. Validate the JSON parses.

```json
{ "tileWidth": 16, "tileHeight": 16, "tileImage": "rc_placeholder_tiles.png",
  "layers": {
    "walls": [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,1,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,1,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    "tags": { "type": "markers", "markers": [
      { "row": 7, "col": 10, "tag": "floor:0.4" },
      { "row": 7, "col": 11, "tag": "floor:0.4" },
      { "row": 8, "col": 10, "tag": "floor:0.4" },
      { "row": 8, "col": 11, "tag": "floor:0.4" },
      { "row": 1, "col": 1, "tag": "light" }
    ] }
  } }
```

Verify `RcWorld.applyKv` handles `floor:<n>` → `floorHArr` (it does — `if key = "floor" then self.floorHArr(idx) = math.val(v)`). Confirm the ledge cells' `floorHeightAt` reads `0.4` after load.

- [ ] **Step 2: Billboard art.** `rc_enemy.png` — the shipped raycaster demo's `enemy.png` (64×64, transparent, a single-frame upright sprite). Copied, not generated. In Task 7's `RcActors.add(...)` calls the frame size is `64, 64`.

- [ ] **Step 3: Commit.** `test(raycaster): Phase 6 room (ledge + occluder wall) + billboard sprite`.

---

## Task 7: Phase 6 demo scene + probes

**Files:** Create `demo-src/raycaster-p6/Main.bas`, `demo-src/raycaster-p6/ActorScene.bas`, and byte-identical copies of `RcConfig.bas RcWorld.bas RcCast.bas RcRender.bas RcMover.bas RcLights.bas RcActor.bas RcActors.bas` from `demo-src/raycaster/lib/`. Build `src/docs/demos/RaycasterP6Actors.b4wgl.json`.

- [ ] **Step 1: `Main.bas`** (copy the p5 shape):

```basic
function oninit()
  world.setPixelPerfect(true)
endfunction

dim scn = new ActorScene()
scenemanager.register("actors", scn)
scenemanager.switch("actors")
```

- [ ] **Step 2: `ActorScene.bas`.** `Class` / `Extends scene`. Fields: `tm as tilemapset`, `wld as RcWorld`, `ren as RcRender`, `me as RcMover`, `lights as RcLights`, `actors as RcActors`, `npcFloor`, `npcLedge`, `npcHidden` (RcActor refs — store untyped), `torch`, `titleText as Text`, `hintText as Text`, `lastMouse`.

`Constructor()` — `input.bind` WASD/QE like `demo-src/raycaster-p5/LitScene.bas` (`fwd`/`back`/`sl`/`sr`/`tl`/`tr`/`jump`).

`onenter()`:
```
world.setBackground(0, 0, 0)
self.lastMouse = 0
self.tm = new tilemapset("p6room.stm")
self.wld = new RcWorld(self.tm, "walls")
self.ren = new RcRender(self.wld)
self.me = new RcMover(self.wld, 3.0, 3.0, 0.3, 0.6)
self.lights = new RcLights(self.wld)
self.actors = new RcActors(self.wld)
self.ren.bindCamera(self.me)
self.ren.bindLights(self.lights)
self.ren.bindActors(self.actors)
self.torch = self.lights.addPoint(3.0, 3.0, 0.5, 0.9, RcConfig.RC_LIGHT_RANGE)
self.npcFloor  = self.actors.add("rc_enemy.png", 6.5, 3.0, 0.0, 64, 64)   ' open floor, dead ahead
self.npcLedge  = self.actors.add("rc_enemy.png", 10.5, 7.5, 0.4, 64, 64)  ' on the raised ledge (floor 0.4)
self.npcHidden = self.actors.add("rc_enemy.png", 9.5, 2.5, 0.0, 64, 64)   ' behind the col-8 wall stub
self.lights.update()
' hud title + hint text, see LitScene's onenter
self.runProbes()
```

`runProbes()` — 6 probes via a copied `probe(label, passed, y)` helper (copy it verbatim from `demo-src/raycaster-p5/LitScene.bas` — renders `label + ": OK|FAIL"` and on `passed = 0` throws via `array.arrLength(missing)` on an unassigned `dim missing`). Every check is a boolean fed to `probe(..., <0-or-1>, y)`. Hoist all `dim`s to the top of `runProbes`. Compute `dim halfW` / `halfW = stage.width() / 2` once. Compare actor identity by spawn position (`n1.x() = 6.5`) — NOT object-ref `=` (unproven in softBASIC).

Set the camera basis explicitly first (renderFrame hasn't run, and it's the cleanest way): `self.ren.setCamera(3.0, 3.0, 0, 0)` — sets `camX/camY = 3` and angle 0; the Constructor-default `fDir*` basis already corresponds to angle 0 (`fDirX=1, fDirY=0, fPlaneX=0, fPlaneY=fovScale`), so `worldToScreenX` is well-defined.

1. **projection sane** — `dim sx` / `sx = self.ren.worldToScreenX(6.5, 3.0)` (NPC dead ahead of the camera at (3,3) looking +x → centre column); pass if `math.abs(sx - halfW) < 12`.
2. **behind-camera guard** — `dim bx` / `bx = self.ren.worldToScreenX(1.0, 3.0)` (behind the camera); pass if `bx < 0`.
3. **hitscan hits the floor NPC** — `dim hit` / `hit = self.actors.hitscan(3.0, 3.0, 1, 0, RcConfig.RC_HITSCAN_RANGE)`; pass if `hit <> 0 and self.actors.hitKind() = RcConfig.RC_HIT_ACTOR and hit.x() = 6.5 and hit.y() = 3.0`.
4. **wall blocks hitscan to the hidden NPC** — `hit = self.actors.hitscan(3.0, 2.5, 1, 0, RcConfig.RC_HITSCAN_RANGE)` — aimed straight at the hidden NPC at `(9.5, 2.5)`, wall cell `(8, 2)` in the way. Pass if `hit = 0 and self.actors.hitKind() = RcConfig.RC_HIT_WALL and math.abs(self.actors.hitDist() - 5.0) < 0.1` (wall face x=8 − origin x=3).
5. **`near` finds the closest NPC** — `dim n1` / `n1 = self.actors.near(6.5, 3.2, 2.0)` (split — don't chain `.x()` on the call result); `dim n2` / `n2 = self.actors.near(0.5, 0.5, 1.0)`; pass if `n1 <> 0 and n1.x() = 6.5 and n2 = 0`.
6. **`los` sees the wall** — `dim dw` / `dw = self.actors.los(3.0, 2.5, 1, 0)`; pass if `dw > 0 and math.abs(dw - 5.0) < 0.1`.

`onupdate(delta)` (hoist `dim dx` / `dim dy` / `dim h` to the top):
```
' WASD/QE drive -> self.me.step(delta)  (copy the input polling from LitScene's onupdate)
self.lights.moveLight(self.torch, self.me.x(), self.me.y())
self.lights.update()
' click-to-hitscan along the camera forward: edge-detect input.mouseDown()
if input.mouseDown() = 1 then
    if self.lastMouse = 0 then
        dx = math.cos(self.me.angle())
        dy = math.sin(self.me.angle())
        h = self.actors.hitscan(self.me.x(), self.me.y(), dx, dy, RcConfig.RC_HITSCAN_RANGE)
        if h <> 0 then
            h.setTint(255, 80, 80)   ' stored, not drawn yet -- harmless
        endif
    endif
endif
self.lastMouse = input.mouseDown()
self.ren.renderFrame()
```

(`dim`s hoisted to the top of `onupdate`.)

- [ ] **Step 3: Copy libs + transpile probe.**

```bash
for f in RcConfig RcWorld RcCast RcRender RcMover RcLights RcActor RcActors; do cp demo-src/raycaster/lib/$f.bas demo-src/raycaster-p6/$f.bas; done
```

Transient probe: transpile every `.bas` in `demo-src/raycaster-p6/` together — zero diagnostics. Iterate on `ActorScene.bas` until green.

- [ ] **Step 4: Build the export + smoke/probe guards.**

```bash
npm run build:demo -- demo-src/raycaster-p6 RaycasterP6Actors
```

`raycasterDemoLibSync` now checks the 8 copies against canonical — must be byte-identical. `raycasterDemoProbes.test.ts` currently hard-codes the P5 demo; **extend it** to also run `demo-src/raycaster-p6`'s `ActorScene.onenter()` against `p6room.stm`. Parameterise the existing helper over `{ dir, sceneVar, probeCount }` — P5 = `_sb_litscene` / 6, P6 = `_sb_actorscene` / 6. The P6 run calls `renderFrame` inside `runProbes` (probe 1), so the `_sb` stub already covering P5 (`getStageWidth`/`getStageHeight` → numbers, `createText` capturing the probe label, tilemap layer stubs from `p6room.stm`) is sufficient; no `assetmanager` stubbing needed (the billboard pass reads `frameW`/`frameH` off the actor, and with `cols` from a real 640px stage the column loop runs — confirm `drawing.drawImageStrip` on the auto-vivifying stub doesn't throw).

- [ ] **Step 5: Verify.** `npx vitest run` full green. `npx vite build` clean.

- [ ] **Step 6: Commit.**

```bash
git add demo-src/raycaster-p6 src/docs/demos/RaycasterP6Actors.b4wgl.json tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts
git commit -m "test(raycaster): Phase 6 actor demo + hitscan/occlusion/near probes"
```

---

## Task 8: Wire the demo into the dev registry + Cypress

**Files:** `src/features/demos/devDemoRegistry.ts`, `tests/ui/features/demos/devDemoRegistry.test.ts`, `cypress/e2e/demos.cy.ts`.

- [ ] **Step 1:** Append to `devDemoRegistry`:

```ts
{
  slug: 'raycaster-p6-actors',
  name: 'Raycaster P6 — Actors',
  tags: ['Raycaster', 'Engine Phase'],
  description:
    'Phase 6 probe: RcActors — a billboard pool projected into the view, depth-clipped per column against the wall buffer (the NPC behind the wall stub stays hidden), plus los / hitscan / near ray queries.',
  docsSlug: '',
  file: 'RaycasterP6Actors',
},
```

- [ ] **Step 2:** Mirror test in `devDemoRegistry.test.ts` (copy the `raycaster-p5-lit` block, swap slug/name/file).

- [ ] **Step 3:** `demos.cy.ts` `DEV_DEMOS`: `{ slug: 'raycaster-p6-actors', title: 'Raycaster P6 — Actors', waitMs: 4000 }`.

- [ ] **Step 4: Verify + commit.**

```bash
npx vitest run tests/ui/features/demos/devDemoRegistry.test.ts
git add src/features/demos/devDemoRegistry.ts tests/ui/features/demos/devDemoRegistry.test.ts cypress/e2e/demos.cy.ts
git commit -m "test(raycaster): wire Phase 6 actor demo into dev registry + e2e"
```

- [ ] **Step 5 (if a browser is available):** `npm run dev`, then `npx cypress run --spec cypress/e2e/demos.cy.ts` — all 10 dev demos green. Then in the Browser pane, seed `raycaster-p6-actors` (`window.__seedDemo`), open it, Run: confirm 6 probes OK, the two visible barrels render (one small on the ledge, one larger on the floor), walking so the floor barrel passes behind the col-8 wall stub clips it column-by-column, and clicking while aimed at a barrel does not throw. Break a probe → `ERR` → restore.

---

## Task 9: Docs + roadmap + spec reconciliation

**Files:** `src/docs/guides/raycaster-library.md`, `docs/roadmap.md`, `docs/language/library-roadmap.md`, `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`, and (only if Task 5a happened) `src/docs/api-reference/assetmanager.md`.

- [ ] **Step 1: Guide.** After the `## RcLights` section add `## RcActors — billboards and ray hits`. Verify every signature against the shipped `.bas`:
  - `new RcActors(world)`; `actors.add(image, x, y, z)` → an actor or `0` (pool full); `actor.setPosition(x,y)` / `setHeight(z)` / `setFrame(i)` / `setTint(r,g,b)` / `setVisible(v)`; `actor.x()/y()/z()/frame()/visible()/distanceTo(px,py)`.
  - `actors.remove(actor)`, `actors.activeCount()`, `actors.near(x, y, r)` → actor or `0`.
  - `actors.los(x, y, dx, dy)` → wall distance or `-1`.
  - `actors.hitscan(x, y, dx, dy, range)` → the hit actor or `0`; then `actors.hitKind()` (`RcConfig.RC_HIT_NONE/WALL/ACTOR`), `hitDist()`, `hitX()`, `hitY()`.
  - `RcRender.bindActors(actors)`, `RcRender.worldToScreenX(x, y)` → pixel X or `-1`.
  - A short `.bas` example: spawn a barrel, hitscan from the player each frame, log what it hits.
  - **Phase 6 limits** subsection: no per-actor tint yet (stored, not drawn — waiting on `drawImageStrip(tint)`); single horizontal frame strip only (no vertical frames, no 8-direction sprites); no actor-vs-actor collision; hitscan actor test is a fixed 0.4-cell ray corridor, not a true billboard-width test.

- [ ] **Step 2: `docs/roadmap.md`** — extend the raycaster bullet: "Phase 6 shipped: `RcActors` — billboard pool projected into the view and depth-clipped per screen column against a new `RcRender` wall-depth buffer, plus `los` / `hitscan` / `near` ray queries and `RcRender.worldToScreenX`." Update "Phases 7–10 remain."

- [ ] **Step 3: `docs/language/library-roadmap.md`** — same update; if it tracks a specific "actors / billboards" line item, mark it done and record how occlusion was actually resolved (per-column strip draw via the existing `drawImageStrip` + a new per-column `depthArr`, not a PIXI sprite pool).

- [ ] **Step 4: Spec reconciliation** (`2026-08-31-raycaster-engine-design.md` — required step 6 of the six-step process). In §8:
  - Replace "Backed by a fixed pool of `sprite` instances" with: billboards draw through `drawing.drawImageStrip` (whose engine layer already pools `PIXI.Sprite` and caches strip textures), so `RcActor` is pure data and there is no separate sprite pool to manage.
  - Replace "`RcActors.hitscan(...)` → a `RayHit` (reuses `rayhit.bas`)" with: `hitscan` returns the hit `RcActor` or `0`, plus `hitKind()/hitDist()/hitX()/hitY()` accessors — matching `RcCast`'s span-accessor style. Note `rayhit.bas` was left unused.
  - In §5.4, note the depth buffer is **per-column** (`RcRender.depthArr`), recording the nearest wall distance; there is no per-span depth list (a column terminates at its first wall, which is all billboard occlusion needs).
  - If Task 5a happened, add `assetmanager.imageWidth/imageHeight` to §9's "engine changes made" list; if the explicit-frame-size fallback was used instead, note that.
  - Update §11 phase 6 line to past tense with the actual demo description.

- [ ] **Step 5:** `npx vitest run` + `npx vite build` (docs changes can still break the docs manifest build). Commit.

```bash
git add src/docs/guides/raycaster-library.md docs/roadmap.md docs/language/library-roadmap.md docs/superpowers/specs/2026-08-31-raycaster-engine-design.md
git commit -m "docs(raycaster): Phase 6 RcActors guide + roadmap + spec reconciliation"
```

---

## Task 10: Phase 6 close-out

- [ ] **Step 1:** `npx vitest run` — all green, including: `raycasterDemoLibSync` (8 canonical files × copies), `raycasterDemoTranspile`, `raycasterDemoSmoke` (drives `RcActors` + `RcRender.drawActors`), `raycasterDemoProbes` (executes both P5 and P6 `onenter`/`runProbes`).
- [ ] **Step 2:** `npx vite build` clean.
- [ ] **Step 3:** `raycaster-p6-actors` is in `devDemoRegistry` **only** — not `demoRegistry`, no `docsSlug`, no `/docs` manifest entry.
- [ ] **Step 4: Manual Cypress** (if a browser is available): all 10 dev demos + 4 shipped demos + the tutorials suite pass. Break a P6 probe → `ERR` → restore. Eyeball the p6 demo: ledge barrel drawn higher + smaller, floor barrel lower + larger, the hidden barrel never appears until you walk around the stub, per-column clipping is clean (no half-barrel bleeding through the wall edge), clicking a barrel doesn't throw.
- [ ] **Step 5: Spec check** — §5.4 (per-column depth) done; §8 (`add`/`setFrame`/`setPosition`/`setTint`/`remove`, depth-sorted billboards occluded by walls + ledges, `los`, `hitscan`, `worldToScreenX`, `near`) done; §6.3 (sample light at feet) — **partial**: the sample is computed-ready but not applied as tint (deferred with §5.3 rung 3); note this in `RcActors.bas` / the spec.
- [ ] **Step 6:** Record any frame-time observation from the p6 demo (billboards add `~wPx/RC_STRIP_W` strip draws each; note if the p3 HUD-style readout is worth adding to p6 — optional).

---

## Notes for later phases (not this plan)

- **Per-actor tint** — arrives with `drawImageStrip(tint)` (spec §5.3 rung 3) + textured walls. `RcActor` already stores `tr/tg/tb` and `drawActors` already computes the feet light sample; wire them into the strip draw then.
- **Phase 7 — diagonal-wall tiles** (`RcWorld` + `RcCast` + `RcMover`). `RcRender.depthArr` and `drawActors` need no change (still one wall per column).
- **Actor-vs-actor collision** (spec §7.1) — `RcActors.resolveOverlap()` pushing circles apart; belongs with a gameplay-demo phase, not the foundation.
- **8-direction / animated billboards** — `RcActor.setFacing(angle)` picking a frame row; needs `drawImageStrip` to gain a `srcY` / frame-rect parameter (generic engine change) or a `sprite`-sheet frame accessor.
- **`hitscan` billboard width** — replace the fixed 0.4-cell perp corridor with each actor's projected half-width at that range.
