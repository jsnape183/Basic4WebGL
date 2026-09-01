# Raycaster Engine — Phase 3: `RcRender` First 3D View — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `RcRender.bas` — a softBASIC module that owns the camera and renders `RcWorld` to a first-person 3D view by casting one ray per screen column (`RcCast`), walking the returned spans near→far under a per-column vertical occlusion window, projecting each span's world heights to screen Y, and drawing **flat-shaded** vertical strips. Verified by an unlisted `raycaster-p3` Cypress demo (static camera, stepped/pitted/windowed room) that also carries a frame-time readout — the spec §5.3 throughput checkpoint.

**Architecture:** Pure softBASIC (spec §1.1). `RcRender` holds camera state (spec §7.3 — the `camera` module is inert in a raycast scene). `renderFrame()` runs from the scene's `onupdate(delta)`. Phase 3 v1 is **flat-shaded** (strips drawn with `drawing.drawRect`, shaded by distance + surface kind) — textured walls, a texture atlas, and vertical texture-clipping are deferred to a later phase, so Phase 3 needs no wall-texture assets. The occlusion model handles **floor/ceiling rises** and **flat floor/ceiling fill**; "see *into* a pit / *under* a ledge" (floor drop / ceiling rise revealing a farther surface) is a documented later refinement.

**Tech Stack:** softBASIC, Vitest (transpile + smoke-execute guards — `.bas` logic is Cypress-verified per spec §1.2), Cypress e2e.

**Spec:** `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` — implements §5.1 (per-column occlusion window), §5.2 minus texturing (flat strips, no atlas), §5.5 (the frame), §7.3 (RcRender owns the camera), phase 3 of §11 including the §5.3 throughput checkpoint. Deferred: texturing/atlas (§5.2), per-span depth storage for sprites (§5.4 — Phase 6), lighting (§6 — Phase 5), "see-into/see-under" occlusion, upper regions (§4.1 — Phase 8), diagonal tiles (§4.2 — Phase 7).

---

## Background the implementer needs

- **Phases 1–2 shipped** (`d26480e`..`490a5b4`). The library lives in `demo-src/raycaster/lib/`:
  - `RcConfig.bas` — `const` block. Referenced **prefixed**: `RcConfig.RC_MAX_DIST`. Bare names don't resolve cross-file.
  - `RcWorld.bas` — `new RcWorld(tm as tilemapset, wallsLayerName)`; `widthCells()`, `heightCells()`, `wallAt(c,r)` (OOB→1), `floorHeightAt(c,r)` (OOB→0), `ceilHeightAt(c,r)` (OOB→1.0), `flagsAt(c,r)`, `hasUpperAt(c,r)`, `wallTexAt/floorTexAt/ceilTexAt(c,r)` (→"").
  - `RcCast.bas` — `new RcCast()`; `cast(wld as RcWorld, ox, oy, dx, dy)` (⚠ the RcWorld param is `wld`, NEVER `world` — see footgun below); `los(wld, ox, oy, dx, dy)`; accessors `spanCount()`, `spanKind(i)`, `spanDist(i)`, `spanLo(i)`, `spanHi(i)`, `spanCol(i)`, `spanRow(i)`, `spanSide(i)`, `spanU(i)`, `spanTex(i)`. Spans are near→far. Kinds: `RcConfig.RC_SPAN_WALL/RC_SPAN_FLOORSTEP/RC_SPAN_CEILSTEP`. `spanLo`=min(oldH,newH), `spanHi`=max — the span does NOT say which is old vs new; `RcRender` re-queries `wld.floorHeightAt(spanCol, spanRow)` for the new running value.
- **softBASIC footgun — never name a parameter/local after a builtin module** (`world`, `math`, `array`, `string`, `input`, `camera`, `hud`, `stage`, `pen`, `drawing`, `scenemanager`, `tween`, `collision`, `pathfinding`, `save`, `file`, `audio`, `assetmanager`, `gfx`, `keyboard`, `controller`). It transpiles with zero diagnostics but throws `ReferenceError: <class> is not defined` at runtime. Hit in Phase 2.
- **softBASIC facts:** `const` blocks + prefixed access only. No `elseif`, no `%`/bitwise, no unary `-` in some spots (`0 - x` for negation — see `RcWorld.setFlag`). `and`/`or`/`not` work in `if`. Function-scoped `dim` hoisted to the top. `math` has `sin`, `cos`, `tan`, `pi()`, `abs`, `floor`, `min(a,b)`, `max(a,b)`, `clamp(v,lo,hi)`, `val(s)`. `string.len`. `stage.width()` / `stage.height()`. Scenes get `onupdate(delta)` per frame (`delta` = seconds since last frame). `drawing.clear()` wipes all draw objects; `drawing.drawRect(cx, cy, w, h)` centres at cx,cy; `pen.setFillColor(r,g,b)` / `pen.setLineWidth(n)`.
- **Reference renderer:** `demo-src/raycaster/GameScene.bas` `castRays()` (~line 388) — `lineHeight = SH / perpDist`, `destX = col * STRIP + STRIP/2`, `SCY = SH/2`. Phase 3 generalises `SH/perpDist` to project arbitrary world heights.
- **`build:demo` is non-recursive** — each demo dir needs its own copies of the lib `.bas`. Guards: `raycasterDemoLibSync.test.ts` (copies byte-identical), `raycasterDemoTranspile.test.ts` (transpile clean), `raycasterDemoSmoke.test.ts` (transpile + evaluate + drive `RcCast`; **extend it to drive `RcRender` in Task 2**). All auto-discover new `raycaster-p*/` dirs.
- **Probe scenes MUST force a runtime error on a failed check** (`array.arrLength(missing)` on an unassigned `dim`) — see `demo-src/raycaster-p2/SpanViewScene.bas` `probe()`.

---

## Projection math (the core of Task 2)

Camera: position `(camX, camY)`, yaw `camAngle` (radians), pitch `camPitch` (a screen-pixel vertical shear, clamped ±`RC_MAX_PITCH`), horizontal-FOV encoded as `fovScale` = `tan(hfov/2)` (the camera-plane half-length). Eye height `RcConfig.RC_EYE_Z` (0.5 — halfway up a standard 1.0-tall room).

**Per column `col` (0 .. cols-1):**
```
cameraX = 2*col/cols - 1                 ' -1 .. +1 across the view
dirX = cos(camAngle);  dirY = sin(camAngle)
planeX = -dirY * fovScale;  planeY = dirX * fovScale
rayX = dirX + planeX*cameraX;  rayY = dirY + planeY*cameraX
```
`rc.cast(wld, camX, camY, rayX, rayY)` — the ray vector is deliberately NOT normalised; `RcCast`'s `deltaDist = |1/dir|` makes `spanDist(i)` come out as **perpendicular** distance (no fisheye).

**Project a world height `h` at perpendicular distance `d` to a screen Y:**
```
screenY(h, d) = SCY + (RC_EYE_Z - h) * (SH / max(d, 0.05)) + camPitch
```
Check: `h = 1` (standard ceiling), `d = 1`, eye 0.5, pitch 0, SH 600 → `300 + (-0.5)*600 = 0` (top of screen). `h = 0` (floor) → `300 + 0.5*600 = 600` (bottom). A full-height wall fills the screen at `d = 1`. ✓

**Per-column occlusion window:** `winTop = 0`, `winBot = SH`. Track `runFloorH` / `runCeilH` starting from the camera's own cell. Walk spans near→far:
- **WALL:** strip from `screenY(spanHi, d)` to `screenY(spanLo, d)` (= `screenY(runCeilH)` .. `screenY(runFloorH)`), clipped to `[winTop, winBot]`. Draw, then **stop the column**.
- **FLOORSTEP:** `newH = wld.floorHeightAt(spanCol, spanRow)`. Strip `screenY(spanHi,d)` .. `screenY(spanLo,d)` (the riser face), clipped. Draw. If `newH > runFloorH` (floor rose): `winBot = min(winBot, screenY(newH, d))` (can't see under a raised floor). If `newH < runFloorH` (pit): leave the window (Phase 3 v1 shows the far geometry through the gap — the pit floor itself is not specially filled; documented gap). Set `runFloorH = newH`.
- **CEILSTEP:** mirror. `newH = wld.ceilHeightAt(spanCol, spanRow)`. If `newH < runCeilH` (ceiling dropped): `winTop = max(winTop, screenY(newH, d))`. If `newH > runCeilH` (atrium): leave the window. Set `runCeilH = newH`.
- After the span walk (or if a wall stopped it): nothing more to draw — the flat sky/floor fill drawn once before the column loop shows through wherever the window stayed open.

---

## File Structure

**Created:**
- `demo-src/raycaster/lib/RcRender.bas` — the renderer. One responsibility: camera state + project + per-column span→strip render.
- `demo-src/raycaster-p3/Main.bas`
- `demo-src/raycaster-p3/RoomViewScene.bas` — static-camera 3D view + frame-time HUD + probes.
- `demo-src/raycaster-p3/RcConfig.bas`, `RcWorld.bas`, `RcCast.bas`, `RcRender.bas` — copies.
- `demo-src/raycaster-p3/assets/p3room.stm`, `rc_placeholder_tiles.png` (copy).
- `src/docs/demos/RaycasterP3RoomView.b4wgl.json` — generated, committed.

**Modified:**
- `demo-src/raycaster/lib/RcConfig.bas` — add `RC_STRIP_W`, `RC_EYE_Z`, `RC_MAX_PITCH`.
- `demo-src/raycaster-p2/RcConfig.bas` — re-sync (const file changed).
- `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts` — drive `RcRender` where present.
- `src/features/demos/devDemoRegistry.ts`, `cypress/e2e/demos.cy.ts` — wire `raycaster-p3-roomview`.
- `src/docs/guides/raycaster-library.md`, `docs/roadmap.md`, `docs/language/library-roadmap.md`.

---

## Task 1: `RcConfig` additions

**Files:** Modify `demo-src/raycaster/lib/RcConfig.bas`, re-sync `demo-src/raycaster-p2/RcConfig.bas`.

- [ ] **Step 1: Add constants**

In `demo-src/raycaster/lib/RcConfig.bas`, add to the `const` block (after the existing entries):

```basic
  RC_STRIP_W = 4
  RC_EYE_Z = 0.5
  RC_MAX_PITCH = 220
```

`RC_STRIP_W` — screen px per column. `RC_EYE_Z` — camera height in a 1.0-tall room. `RC_MAX_PITCH` — max pitch shear in px (about a third of a 600px view).

- [ ] **Step 2: Re-sync the Phase 2 copy**

```bash
cp demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-p2/RcConfig.bas
```

- [ ] **Step 3: Verify + commit**

```bash
npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo
```
All green (transpile + lib-sync + smoke, now covering the updated const file).

```bash
git add demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-p2/RcConfig.bas
git commit -m "feat(raycaster): RcConfig render constants (strip width, eye height, max pitch)"
```

---

## Task 2: `RcRender.bas` — the renderer

**Files:** Create `demo-src/raycaster/lib/RcRender.bas`; modify `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`.

No `.bas` unit tests (spec §1.2). Verified by the smoke test driving it + the Phase 3 demo.

- [ ] **Step 1: Create the module**

```basic
Class
' RcRender -- first-person renderer for RcWorld (spec §5). Owns the camera
' (spec §7.3 -- the `camera` module is inert in a raycast scene). Call
' renderFrame() from the scene's onupdate(delta).
'
' Phase 3 v1: FLAT-SHADED strips (drawing.drawRect, shaded by distance + surface
' kind). No wall textures / atlas / vertical texture-clip yet. The occlusion
' model handles floor/ceiling RISES + flat sky/floor fill; seeing INTO a pit or
' UNDER a ledge (floor drop / ceiling rise revealing farther geometry) is a
' later refinement -- the window is left open there so farther spans show
' through, but the pit floor / under-ledge surface is not specially drawn.
'
' The RcWorld parameter is `wld`, NEVER `world` (builtin module -> silent
' mis-transpile -> runtime ReferenceError).
dim wld as RcWorld
dim rc as RcCast
dim camX
dim camY
dim camAngle
dim camPitch
dim fovScale
dim viewW
dim viewH
dim scy
dim cols

Constructor(w as RcWorld)
    self.wld = w
    self.rc = new RcCast()
    self.camX = 2.0
    self.camY = 2.0
    self.camAngle = 0
    self.camPitch = 0
    self.fovScale = 0.66
    self.viewW = stage.width()
    self.viewH = stage.height()
    self.scy = self.viewH / 2
    self.cols = math.floor(self.viewW / RcConfig.RC_STRIP_W)
EndConstructor

function setCamera(x, y, angle, pitch)
    self.camX = x
    self.camY = y
    self.camAngle = angle
    self.camPitch = math.clamp(pitch, 0 - RcConfig.RC_MAX_PITCH, RcConfig.RC_MAX_PITCH)
endfunction

function setFov(degrees)
    self.fovScale = math.tan(degrees * 0.5 * math.pi() / 180.0)
endfunction

function columnCount()
    return self.cols
endfunction

' Screen Y of world height h at perpendicular distance d.
function projectY(h, d)
    dim dd
    dd = d
    if dd < 0.05 then
        dd = 0.05
    endif
    return self.scy + (RcConfig.RC_EYE_Z - h) * (self.viewH / dd) + self.camPitch
endfunction

' Draws a vertical strip [sTop..sBot] clipped to [winTop..winBot], flat-shaded.
' shadeKind: 0 wall x-side, 1 wall y-side, 2 floor-step, 3 ceil-step.
function drawStrip(destX, sTop, sBot, winTop, winBot, shadeKind)
    dim t
    dim b
    dim g
    t = sTop
    b = sBot
    if t < winTop then
        t = winTop
    endif
    if b > winBot then
        b = winBot
    endif
    if b <= t then
        return
    endif
    g = 150
    if shadeKind = 1 then
        g = 115
    endif
    if shadeKind = 2 then
        g = 90
    endif
    if shadeKind = 3 then
        g = 65
    endif
    pen.setLineWidth(0)
    pen.setFillColor(g, g, g + 25)
    drawing.drawRect(destX, (t + b) / 2, RcConfig.RC_STRIP_W, b - t)
endfunction

function renderFrame()
    dim dirX
    dim dirY
    dim planeX
    dim planeY
    dim col
    dim cameraX
    dim rayX
    dim rayY
    dim i
    dim n
    dim winTop
    dim winBot
    dim runFloorH
    dim runCeilH
    dim kind
    dim d
    dim sTop
    dim sBot
    dim destX
    dim newH
    dim camCol
    dim camRow
    dim horizon
    dim fh

    horizon = self.scy + self.camPitch
    fh = self.viewH - horizon
    if fh < 0 then
        fh = 0
    endif

    drawing.clear()

    ' flat sky (full screen) then floor (horizon..bottom) -- strips draw over both
    pen.setLineWidth(0)
    pen.setFillColor(28, 32, 46)
    drawing.drawRect(self.viewW / 2, self.viewH / 2, self.viewW, self.viewH)
    if fh > 0 then
        pen.setFillColor(20, 18, 16)
        drawing.drawRect(self.viewW / 2, horizon + fh / 2, self.viewW, fh)
    endif

    dirX = math.cos(self.camAngle)
    dirY = math.sin(self.camAngle)
    planeX = 0 - dirY * self.fovScale
    planeY = dirX * self.fovScale

    camCol = math.floor(self.camX)
    camRow = math.floor(self.camY)

    for col = 0 to self.cols - 1
        cameraX = (2.0 * col / self.cols) - 1.0
        rayX = dirX + planeX * cameraX
        rayY = dirY + planeY * cameraX

        self.rc.cast(self.wld, self.camX, self.camY, rayX, rayY)

        winTop = 0
        winBot = self.viewH
        runFloorH = self.wld.floorHeightAt(camCol, camRow)
        runCeilH = self.wld.ceilHeightAt(camCol, camRow)
        destX = col * RcConfig.RC_STRIP_W + RcConfig.RC_STRIP_W / 2

        n = self.rc.spanCount()
        i = 0
        while i < n
            kind = self.rc.spanKind(i)
            d = self.rc.spanDist(i)
            sTop = self.projectY(self.rc.spanHi(i), d)
            sBot = self.projectY(self.rc.spanLo(i), d)

            if kind = RcConfig.RC_SPAN_WALL then
                self.drawStrip(destX, sTop, sBot, winTop, winBot, self.rc.spanSide(i))
                i = n
            else
                if kind = RcConfig.RC_SPAN_FLOORSTEP then
                    newH = self.wld.floorHeightAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    self.drawStrip(destX, sTop, sBot, winTop, winBot, 2)
                    if newH > runFloorH then
                        if self.projectY(newH, d) < winBot then
                            winBot = self.projectY(newH, d)
                        endif
                    endif
                    runFloorH = newH
                else
                    newH = self.wld.ceilHeightAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    self.drawStrip(destX, sTop, sBot, winTop, winBot, 3)
                    if newH < runCeilH then
                        if self.projectY(newH, d) > winTop then
                            winTop = self.projectY(newH, d)
                        endif
                    endif
                    runCeilH = newH
                endif
                i = i + 1
            endif

            if winTop >= winBot then
                i = n
            endif
        endwhile
    next col
endfunction

EndClass
```

- [ ] **Step 2: Check calls against defs**

- `math.cos/sin/tan/pi/abs/floor/clamp` — `math.bas` (verify `clamp(v,lo,hi)` arg order; `pi()` is a function call).
- `0 - RcConfig.RC_MAX_PITCH` — softBASIC dislikes bare unary minus in some positions; `0 - x` is the safe negation form (used in `RcWorld`/`RcCast`).
- `stage.width()` / `stage.height()` — `stage.bas`.
- `pen.setFillColor` / `pen.setLineWidth`, `drawing.clear` / `drawing.drawRect` — `pen.bas` / `drawing.bas`.
- `self.wld.floorHeightAt` etc. — `RcWorld.bas`.
- `self.rc.cast` / `spanCount` / `spanKind` / `spanDist` / `spanLo` / `spanHi` / `spanCol` / `spanRow` / `spanSide` — `RcCast.bas`.
- `new RcCast()` in the constructor — confirm a class can `new` another class in its `Constructor` (RcCast does `new RcCast()`-free but SpanViewScene does `new RcCast()` in `onenter`; the constructor timing is different — if it fails, move `self.rc = new RcCast()` into a lazy init or the first `renderFrame`). Note whatever you find.
- `while i < n ... i = n` to break — same pattern `RcCast` uses.

- [ ] **Step 3: Extend the smoke test**

In `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`:
- add `RcRender: typeof _sb_rcrender !== 'undefined' ? _sb_rcrender : null` to the `evalDemo` return.
- add a `test.each(phaseDirs)` case: if `mod.RcRender` is present, `new mod.RcRender(fakeWorld)` (the constructor calls `stage.width()` → the `_sb` stub returns a chainable stub; `math.floor(stub/4)` → `NaN`, fine — we only care it doesn't throw a ReferenceError), then `rc.setCamera(2, 2, 0, 0)` and `expect(() => rc.renderFrame()).not.toThrow()`. The stub `wld` needs `floorheightat`/`ceilheightat`/`wallat` returning numbers; extend `stubWorld` with whatever `RcRender` calls. Since `self.cols` will be `NaN`, guard: also stub `stage` — actually the `_sb` proxy already covers `stage.width()`; make it return a real number by special-casing in the smoke harness: give the eval scope a real `stage = { width: () => 320, height: () => 200 }` (and `pen`, `drawing` as no-op objects) so `renderFrame`'s loop actually runs a few columns. Look at how the emitted code references `stage`/`pen`/`drawing` (as bare module consts defined in the emitted output — so they're already real no-op objects from the transpiled `pen.bas`/`drawing.bas`/`stage.bas`; `stage.width()` calls `_sb.getStageWidth()` which the proxy stubs as a chainable — `math.floor(chainable / 4)` is `NaN`). Simplest: after `new RcRender`, if `columnCount()` is `NaN`, skip the `renderFrame` assertion but keep the "constructs without ReferenceError" one. Use your judgement; the key assertion is **no ReferenceError**.

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts` → green (it will only fully exercise `RcRender` once a p3 demo dir exists in Task 4; until then the `RcRender` branch is skipped for p1/p2).

- [ ] **Step 4: Transpile probe**

`tests/scratch/rcRender.probe.ts` — transpile `RcConfig` + `RcWorld` + `RcCast` + `RcRender` + a `Main.bas` stub (`function t()\n  dim r\n  r = 0\nendfunction\n`), ordered via `sortByDependencies`, `expect(diagnostics).toEqual([])`. Run via the scratch config. Iterate on `.bas` syntax. Delete when green.

- [ ] **Step 5: Verify + commit**

```bash
npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo
npx vitest run
npx vite build
```
All green/clean.

```bash
git add demo-src/raycaster/lib/RcRender.bas tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts
git commit -m "feat(raycaster): RcRender.bas flat-shaded first-person renderer (Phase 3)"
```

---

## Task 3: Phase 3 test room

**Files:** Create `demo-src/raycaster-p3/assets/p3room.stm` + `rc_placeholder_tiles.png` (copy).

- [ ] **Step 1: Copy the tilesheet**

```bash
mkdir -p demo-src/raycaster-p3/assets
cp demo-src/raycaster-p2/assets/rc_placeholder_tiles.png demo-src/raycaster-p3/assets/rc_placeholder_tiles.png
```

- [ ] **Step 2: Create the room**

A 10×8 room the static camera at `(2, 4)` facing east (angle 0) looks down the length of. Left area has two stair steps; a low "window" wall; a pit; a raised platform; a tall atrium ceiling on the far side.

```json
{
  "tileWidth": 16,
  "tileHeight": 16,
  "tileImage": "rc_placeholder_tiles.png",
  "layers": {
    "walls": [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    "tags": {
      "type": "markers",
      "markers": [
        { "row": 4, "col": 4, "tag": "floor:0.35" },
        { "row": 4, "col": 5, "tag": "floor:0.7" },
        { "row": 4, "col": 6, "tag": "floor:-2" },
        { "row": 4, "col": 7, "tag": "floor:1.2" },
        { "row": 3, "col": 8, "tag": "ceil:3" },
        { "row": 4, "col": 8, "tag": "ceil:3" },
        { "row": 5, "col": 8, "tag": "ceil:3" }
      ]
    }
  }
}
```

Validate: `node -e "JSON.parse(require('fs').readFileSync('demo-src/raycaster-p3/assets/p3room.stm','utf8'));console.log('ok')"`.

- [ ] **Step 3: Commit**

```bash
git add demo-src/raycaster-p3/assets
git commit -m "test(raycaster): Phase 3 room map"
```

---

## Task 4: Phase 3 demo scene

**Files:** Create `demo-src/raycaster-p3/Main.bas`, `RoomViewScene.bas`, the 4 lib copies; `tests/scratch/*.probe.ts` (transient); `src/docs/demos/RaycasterP3RoomView.b4wgl.json`.

### Expected projection values (for the probes)

Camera at `(2, 4)`, angle 0 (east), pitch 0, `fovScale 0.66`, `viewH = stage.height()`. Whatever `stage.height()` is (the demo reads it), `projectY` is deterministic:
- `projectY(RC_EYE_Z, d)` = `scy` for any `d` (eye-height point is always on the horizon). So `projectY(0.5, 5)` **exactly equals** `viewH / 2`.
- `projectY(0, 1)` = `scy + 0.5 * viewH` = `viewH` (floor at 1 unit = screen bottom).
- `projectY(1, 1)` = `scy - 0.5 * viewH` = `0`.

The probes assert these three identities (they hold for any `viewH`, so no need to know the stage size) plus a span-count sanity check on the centre column.

- [ ] **Step 1: `RoomViewScene.bas`**

```basic
Class
Extends scene

dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim titleText as Text
dim fpsText as Text
dim frames
dim accum

Constructor()
EndConstructor

function onenter()
  self.frames = 0
  self.accum = 0

  world.setBackground(0, 0, 0)
  self.tm = new tilemapset("p3room.stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.ren = new RcRender(self.wld)
  self.ren.setCamera(2.0, 4.0, 0, 0)

  self.titleText = new Text("Raycaster P3 - room view", 12, 10)
  self.titleText.setStyle(16, 255, 220, 120)
  hud.add(self.titleText)

  self.fpsText = new Text("...", 12, 30)
  self.fpsText.setStyle(14, 180, 255, 180)
  hud.add(self.fpsText)

  dim eyeOnHorizon
  dim floorAtBottom
  dim ceilAtTop
  dim h
  h = self.ren.projectY(RcConfig.RC_EYE_Z, 5.0)
  eyeOnHorizon = 0
  if math.abs(h - self.ren.projectY(RcConfig.RC_EYE_Z, 1.0)) < 0.001 then
    eyeOnHorizon = 1
  endif
  self.probe("eye height maps to horizon at any distance", eyeOnHorizon, 52)

  floorAtBottom = 0
  if math.abs(self.ren.projectY(0, 1.0) - stage.height()) < 0.001 then
    floorAtBottom = 1
  endif
  self.probe("floor at d=1 maps to screen bottom", floorAtBottom, 72)

  ceilAtTop = 0
  if math.abs(self.ren.projectY(1.0, 1.0)) < 0.001 then
    ceilAtTop = 1
  endif
  self.probe("ceiling at d=1 maps to screen top", ceilAtTop, 92)
endfunction

function probe(label, passed, y)
  dim result
  dim t as Text
  dim missing
  dim boom
  ' A failed probe must throw a caught runtimeError -- canvas text is invisible
  ' to the Cypress "no ERR" guard, so a plain "FAIL" string would pass CI.
  result = "OK"
  if passed = 0 then
    result = "FAIL"
  endif
  t = new Text(label + ": " + result, 12, y)
  t.setStyle(12, 255, 255, 255)
  hud.add(t)
  if passed = 0 then
    boom = array.arrLength(missing)
  endif
endfunction

function onupdate(delta)
  self.ren.renderFrame()
  self.frames = self.frames + 1
  self.accum = self.accum + delta
  if self.frames >= 30 then
    dim ms
    ms = (self.accum / self.frames) * 1000.0
    self.fpsText.setText("frame avg " + string.str(math.floor(ms)) + " ms over " + string.str(self.frames) + " (" + string.str(self.ren.columnCount()) + " cols)")
    self.frames = 0
    self.accum = 0
  endif
endfunction

EndClass
```

VERIFY: `Text` + `setStyle` + `setText` (`text.bas`), `string.str`, `math.abs`/`math.floor`, `Extends scene` + `onenter` + `onupdate(delta)` (`Scene.bas`), `hud.add`, `world.setBackground`. `self.ren.projectY(...)` and `self.ren.columnCount()` and `self.ren.renderFrame()` must match `RcRender.bas`. All `dim`s hoisted to function tops.

- [ ] **Step 2: `Main.bas`**

```basic
function oninit()
  world.setPixelPerfect(true)
endfunction

dim roomView = new RoomViewScene()
scenemanager.register("roomview", roomView)
scenemanager.switch("roomview")
```

- [ ] **Step 3: Stage lib copies**

```bash
cp demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-p3/RcConfig.bas
cp demo-src/raycaster/lib/RcWorld.bas  demo-src/raycaster-p3/RcWorld.bas
cp demo-src/raycaster/lib/RcCast.bas   demo-src/raycaster-p3/RcCast.bas
cp demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p3/RcRender.bas
```

- [ ] **Step 4: Transpile probe**

`tests/scratch/p3demo.probe.ts` — copy the setup from `raycasterDemoTranspile.test.ts`, point at `demo-src/raycaster-p3`, `expect(diagnostics).toEqual([])`. Run via scratch config. Iterate. Delete when green.

- [ ] **Step 5: Smoke test now exercises RcRender**

`npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts` → the `RcRender` branch (added in Task 2 Step 3) now runs for `raycaster-p3`. Green. If `renderFrame` throws in the stub harness, fix the harness stubs (real `stage`/`pen`/`drawing` no-ops) OR `RcRender` if it's a real bug.

- [ ] **Step 6: Build the export**

```bash
npm run build:demo -- demo-src/raycaster-p3 RaycasterP3RoomView
```

- [ ] **Step 7: Verify + commit**

```bash
npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo   # transpile + lib-sync + smoke, now covering p3
npx vitest run
npx vite build
```

```bash
git add demo-src/raycaster-p3 src/docs/demos/RaycasterP3RoomView.b4wgl.json
git commit -m "test(raycaster): Phase 3 room-view demo scene + frame-time readout"
```

---

## Task 5: Wire the demo + Cypress

**Files:** Modify `src/features/demos/devDemoRegistry.ts`, `cypress/e2e/demos.cy.ts`, `tests/ui/features/demos/devDemoRegistry.test.ts`.

- [ ] **Step 1:** Add a third `devDemoRegistry` entry (mirror the P2 one):

```ts
  {
    slug: 'raycaster-p3-roomview',
    name: 'Raycaster P3 — Room View',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 3 probe: RcRender casts one ray per column and draws flat-shaded strips under a per-column occlusion window; first 3D view + frame-time readout.',
    docsSlug: '',
    file: 'RaycasterP3RoomView',
  },
```

- [ ] **Step 2:** Add a mirror test to `tests/ui/features/demos/devDemoRegistry.test.ts` (`includes the Phase 3 room-view demo`), matching the P1/P2 ones.

- [ ] **Step 3:** Add to `DEV_DEMOS` in `cypress/e2e/demos.cy.ts`:

```ts
  { slug: 'raycaster-p3-roomview', title: 'Raycaster P3 — Room View', waitMs: 4000 },
```

(4000ms — the demo needs a few frames for the projection probes AND to render; the probes are in `onenter` so they fire immediately, but give the renderer headroom.)

- [ ] **Step 4:** `npx vitest run` (baseline + 1 new mirror test), `npx vite build`. Green/clean.

- [ ] **Step 5:** E2E if a browser is available — `npm run dev` + `npx cypress run --spec cypress/e2e/demos.cy.ts`. All specs pass incl. `Dev demo: Raycaster P3 — Room View`. Then break a probe (e.g. `< 0.001` → `< -1`), rebuild, confirm the spec FAILS with `ERR`, restore. If no browser, state that manual Cypress verification is required and give the wiring trace.

- [ ] **Step 6: Commit**

```bash
git add src/features/demos/devDemoRegistry.ts cypress/e2e/demos.cy.ts tests/ui/features/demos/devDemoRegistry.test.ts
git commit -m "test(raycaster): wire Phase 3 room-view demo into dev registry + e2e"
```

---

## Task 6: Frame-time checkpoint (spec §5.3)

**Files:** none (measurement) — may spawn follow-up tasks.

- [ ] **Step 1: Measure**

Run the demo in a browser (`npm run dev`, seed `raycaster-p3-roomview`, open the project, Run). Read the `frame avg N ms over 30 (M cols)` HUD line after it settles. Also try widening the view (larger stage) if easy, to push the column count up.

- [ ] **Step 2: Decide**

- **avg ≤ ~14 ms (≥ ~70 fps) with headroom:** record the number in the Phase 3 close-out summary and the roadmap. No `drawing` changes. Done.
- **avg 14–20 ms (marginal):** record it; note that Phase 5 (lighting, adds a tint per strip) and textured walls will erode this, so the generic `drawing` fixes are *likely* needed by Phase 5 — flag as a tracked item, don't build yet.
- **avg > 20 ms (fails 60 fps now):** this is the §5.3 trigger. Do the **generic** `drawing.js` fixes IN ORDER, each its own commit with JS unit tests, re-measuring after each:
  1. **Sprite/graphics pooling** — `drawing.js` currently `new PIXI.Graphics()` per `drawRect` and `destroy()`s all objects each `clearDrawing()`. Pool and reuse. Helps every game that draws in a loop. (Its own mini-spec.)
  2. If still slow: **`tint` param on `drawImageStrip`** (needed for Phase 5 lighting anyway) + a batched-strip primitive `drawing.drawStrips(...)`. Generic blit primitives, not raycaster-specific.
  Each of these is a separate task/PR with its own review — spawn them as a follow-up plan (`2026-XX-XX-drawing-throughput.md`) rather than inlining here.

- [ ] **Step 3:** Record the outcome in `docs/superpowers/plans/2026-09-01-raycaster-engine-phase-3.md` (this file) under a new `## Frame-time result` heading, and in the roadmap.

---

## Task 7: Docs + roadmap

**Files:** Modify `src/docs/guides/raycaster-library.md`, `docs/roadmap.md`, `docs/language/library-roadmap.md`.

- [ ] **Step 1: Guide** — add an `## RcRender — drawing the view` section after `RcCast`. Content (verify method names against `RcRender.bas`):

```markdown
## RcRender — drawing the view

`RcRender` turns an `RcWorld` into a first-person picture. It owns the camera, so
you set the camera on it directly (the normal `camera` module does nothing in a
raycaster scene).

```basic
dim ren as RcRender

function onenter()
  self.ren = new RcRender(self.wld)
  self.ren.setCamera(2, 4, 0, 0)   ' x, y, angle (radians), pitch
endfunction

function onupdate(delta)
  self.ren.renderFrame()
endfunction
```

| Call | Does |
|---|---|
| `new RcRender(world)` | create a renderer for a loaded `RcWorld` |
| `ren.setCamera(x, y, angle, pitch)` | move/aim the camera; `angle` in radians, `pitch` is a small up/down look (pixels), clamped |
| `ren.setFov(degrees)` | horizontal field of view (default ~66°) |
| `ren.renderFrame()` | draw one frame — call every `onupdate` |
| `ren.projectY(height, distance)` | screen Y for a world height at a distance (mostly internal) |
| `ren.columnCount()` | how many vertical strips wide the view is |

### Phase 3 limits

Everything is flat-shaded — no wall textures yet. You can see across a pit to the
wall beyond, but the inside of the pit isn't drawn specially. Rooms stacked above
a cell and angled walls come in later phases.
```

- [ ] **Step 2: Roadmap** — update the "Raycaster library (in progress)" item in both files: Phase 3 (`RcRender` flat-shaded first-person renderer + occlusion window) shipped; phases 4–10 remain. Include the frame-time number from Task 6.

- [ ] **Step 3:** `npx vite build`, `npx vitest run`. Commit:

```bash
git add src/docs/ docs/roadmap.md docs/language/library-roadmap.md
git commit -m "docs(raycaster): Phase 3 RcRender guide section + roadmap"
```

---

## Task 8: Phase 3 close-out

**Files:** none.

- [ ] `npx vitest run` → all green, only the pre-existing skip.
- [ ] `npx vite build` → clean.
- [ ] `npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo` → transpile + lib-sync + smoke all green, covering `raycaster-p3/` and driving `RcRender`.
- [ ] Confirm `raycaster-p3-roomview` is absent from `src/features/demos/demoRegistry.ts` and does not render on `/demos`.
- [ ] **Manual Cypress** — `npx cypress run --spec cypress/e2e/demos.cy.ts`: P1, P2, P3 all pass; deliberately break a P3 probe and confirm it FAILS with `ERR`, then restore. Also eyeball the P3 3D view: horizon, stairs stepping up, atrium ceiling lifting, a wall where the pit's far side is. Flag anything wrong.
- [ ] **Spec check** — re-read spec §5.1, §5.5, §7.3, §11 phase 3. `RcRender` owns camera state ✓; `renderFrame` from `onupdate` ✓; per-column occlusion window ✓; projection ✓. Confirm deferrals (texturing/atlas, per-span depth §5.4, see-into-pit, lighting) are noted in `RcRender.bas`'s header. The frame-time checkpoint (Task 6) is recorded.

---

## Notes for later phases (not this plan)

- **Phase 4 (`RcMover`)** — height-aware locomotion + collision; feeds `RcRender.setCamera` from a bound actor (spec §7). The P4 demo makes the P3 room walkable.
- **Phase 5 (`RcLights`)** needs a per-strip tint — the generic `drawImageStrip(tint)` param (Task 6 rung 2). If Task 6 didn't already build it, Phase 5 triggers it.
- **Textured walls + atlas** (spec §5.2) — a dedicated task before or during Phase 5, once `RcRender` flat-shading is proven. Needs `RC_STRIP_W`-wide sampling and the fixed-size grid atlas.
- **Per-span depth for sprite occlusion** (spec §5.4) — Phase 6. `RcRender` will store per-column, per-span depth so `RcActors` clips billboards.
- **"See into a pit / under a ledge"** — the occlusion-window refinement where a floor drop / ceiling rise draws the revealed farther surface (pit floor, under-walkway room) instead of just leaving the window open. Revisit once the flat renderer + lighting are stable; may want `RcCast` to emit an explicit floor/ceiling *surface* span, not just the step.
