# Raycaster Phase 6b — Horizontal Surface Rendering — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `RcRender` draws the **horizontal** surfaces it currently skips — the top of a raised floor, the floor of a pit, the underside of a raised ceiling, the top of a dropped one — as flat-shaded per-column strips, so raised/dropped geometry looks solid and nothing standing on a ledge floats.

**Architecture:** Pure softBASIC. One new "pending surface" bit of per-column state in `RcRender.renderFrame`'s span loop: when a floor/ceiling step is crossed, first paint the surface that was open up to that step (`drawStrip` between `projectY(h, dNear)` and `projectY(h, dFar)`), then the existing riser. Four new shade kinds in `drawStrip`. A debug `surfaceCount()` accessor for the demo probe. No `RcCast` / `RcWorld` change; no engine (`drawing.js`) change.

**Tech Stack:** softBASIC (`.bas` library files in a game project); Vitest (transpile + lib-sync + smoke + probe guards); Cypress e2e.

**Spec:** `docs/superpowers/specs/2026-09-02-raycaster-surface-rendering-design.md`. It amends `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` §5.2 and inserts "Phase 6b" in §11.

---

## Background the implementer needs

### Where things are

- **Canonical raycaster library:** `demo-src/raycaster/lib/` — `RcConfig.bas`, `RcWorld.bas`, `RcCast.bas`, `RcRender.bas`, `RcMover.bas`, `RcLights.bas`, `RcActor.bas`, `RcActors.bas`. Every `demo-src/raycaster-p{1..6}/` ships **byte-identical copies** of the subset it uses (`scripts/buildDemo.ts` is non-recursive; `tests/lib/Basic4WebGL/integration/raycasterDemoLibSync.test.ts` enforces identity — for every `.bas` name that exists in `demo-src/raycaster/lib/`). **Edit canonical, then `cp` to the phase dirs. Never hand-edit a phase-dir copy.** `RcConfig.bas` lives in p2–p6 (not p1). `RcRender.bas` lives in p3–p6.
- **Guards** (`tests/lib/Basic4WebGL/integration/`): `raycasterDemoTranspile` (zero diagnostics), `raycasterDemoLibSync` (copies identical), `raycasterDemoSmoke` (transpile + `eval` + drive the Rc* classes against a stub world), `raycasterDemoProbes` (transpiles + evaluates a demo, runs `<scene>.onenter()` → `runProbes()`, asserts every probe label ends `": OK"` and `onenter` doesn't throw — currently P5 (`_sb_litscene`, 6 probes) + P6 (`_sb_actorscene`, 6 probes) via a parameterised `runPhaseProbes` helper).
- **`RcRender.bas`** — read it end to end first. Relevant parts:
  - Constructor seeds `camX/camY = 2.0`, `fovScale = 0.66`, `viewW/viewH` from `stage.width()/height()`, `scy = viewH/2`, `cols = floor(viewW / RC_STRIP_W)`, `camZ = 0`, the `boundMover/boundLights/boundActors = 0`, the `fDir*/fPlane*` basis defaults, and pushes `RC_MAX_DIST` into `depthArr` per column.
  - `projectY(h, d)` → `scy + (camZ + RC_EYE_Z - h) * (viewH / dd) + camPitch`, `dd` clamped to `0.05`. **Larger `h` ⇒ smaller `projectY` ⇒ higher on screen.** As `d → ∞`, `projectY → scy + camPitch` (horizon).
  - `drawStrip(destX, sTop, sBot, winTop, winBot, shadeKind, lightLevel)` — clips `[sTop,sBot]` to `[winTop,winBot]`, returns if `b <= t`, picks grey `g` from `shadeKind` (0→150, 1→115, 2→90, 3→65), `rr=gg=clamp(g*light,0,255)`, `bb=clamp((g+25)*light,0,255)`, then `pen.setFillColor` + `drawing.drawRect(destX, (t+b)/2, RC_STRIP_W, b-t)`.
  - `renderFrame()` — pulls the camera from `boundMover` if bound; computes `bgLite`; draws two full-screen background rects (dark floor bottom half, sky top half — **left unchanged by this phase**); computes the `dir*/plane*` basis and stores it in `self.fDir*/fPlane*`; then the column loop:
    ```
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
        self.depthArr(col) = RcConfig.RC_MAX_DIST
        n = self.rc.spanCount()
        i = 0
        while i < n
            kind = self.rc.spanKind(i)
            d = self.rc.spanDist(i)
            sTop = self.projectY(self.rc.spanHi(i), d)
            sBot = self.projectY(self.rc.spanLo(i), d)
            lite = 1.0
            if self.boundLights <> 0 then
                <wall: step-back sample; else: sampleCell(spanCol(i), spanRow(i))>
            endif
            if kind = RcConfig.RC_SPAN_WALL then
                self.drawStrip(destX, sTop, sBot, winTop, winBot, self.rc.spanSide(i), lite)
                self.depthArr(col) = d
                i = n
            else
                if kind = RcConfig.RC_SPAN_FLOORSTEP then
                    newH = self.wld.floorHeightAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    self.drawStrip(destX, sTop, sBot, winTop, winBot, 2, lite)
                    if newH > runFloorH then <clamp winBot to projectY(newH, d)> endif
                    runFloorH = newH
                else
                    newH = self.wld.ceilHeightAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    self.drawStrip(destX, sTop, sBot, winTop, winBot, 3, lite)
                    if newH < runCeilH then <clamp winTop to projectY(newH, d)> endif
                    runCeilH = newH
                endif
                i = i + 1
            endif
            if winTop >= winBot then i = n endif
        endwhile
    next col
    if self.boundActors <> 0 then self.drawActors() endif
    ```
- **`RcCast`** — `cast()` emits one span per surface event along the ray, near→far: `RC_SPAN_WALL` (terminates), `RC_SPAN_FLOORSTEP` / `RC_SPAN_CEILSTEP` for **any** floor/ceiling height change (rise **or** drop). `spanDist(i)` = perpendicular distance, `spanCol(i)`/`spanRow(i)` = the transition cell, `spanLo(i)`/`spanHi(i)` = the riser's world-height extent. **No change in this phase** — but confirm a pure drop still emits a FLOORSTEP span (it does: `cellFloor <> runFloor`).
- **`RcConfig.bas`** — `const … endconst`; ends with the Phase-6 actor/hit constants. New constants append before `endconst`.
- **`RcWorld`** — `floorHeightAt(col,row)` / `ceilHeightAt(col,row)` return the per-cell heights; `applyKv` parses a `floor:<n>` tag as `math.val(v)` (so `floor:-0.25` → `-0.25` — confirm).
- **`demo-src/raycaster-p6/`** — `Main.bas`, `ActorScene.bas` (`Class` / `Extends scene`; `onenter` builds the world + 3 NPC billboards + torch, runs `runProbes()`; `runProbes` does `self.ren.setCamera(3.0, 3.0, 0, 0)` then 6 boolean probes via a verbatim `probe(label, passed, y)` helper; `onupdate` drives the mover + `renderFrame`). `assets/p6room.stm` — 14 wide × 10 tall walls layer, tags: ledge `floor:0.4` on (row 7 col 10), (row 7 col 11), (row 8 col 10), (row 8 col 11); `light` on (row 1 col 1). Wall stub at (row 2 col 8), (row 3 col 8). `assets/rc_enemy.png` 64×64. 8 lib copies.
- **`src/docs/demos/RaycasterP6Actors.b4wgl.json`** — rebuilt via `npm run build:demo -- demo-src/raycaster-p6 RaycasterP6Actors`.

### softBASIC facts / footguns (verified)

- **Never name a param/local after a builtin module** (`world`, `math`, `array`, `string`, `input`, `camera`, `hud`, `stage`, `pen`, `drawing`, `scenemanager`, `collision`, `save`, `file`, `audio`, `assetmanager`, `gfx`, `keyboard`, `controller`, `tween`). Transpiles clean → `ReferenceError` at runtime only.
- **`const` prefixed only** (`RcConfig.RC_SHADE_FLOOR_TOP`). No `elseif`. No `%`/bitwise. `0 - x` for negation. `<>` = not-equal. `and`/`or` in `if` (never `not` after `and`/`or`).
- **Every function-scoped `dim` hoisted to the top of the function.**
- **`Class` on line 1.** Class-body `dim` array/dict fields now init **per-instance in the constructor** (fixed 2026-09-02, `d43b18c`); scalar `dim` fields default `undefined` on the prototype and get an own property on first write. `surfCountLast` is a scalar written every `renderFrame` — fine either way; still `dim` it in the class body and set it in the Constructor for clarity.
- **Method calls:** zero-arg accessors work everywhere; `self.field.method(args)` in an expression works; `local.method(args)` in an expression works since `8098c42` **only for a typed local**; `arr(i).method(args)` still fails (roadmap #34). None of this phase's code needs the fragile shapes.
- `math`: `floor`, `abs`, `clamp`, `min`, `max`, `sign`, `sqrt`, `cos`, `sin`, `tan`, `pi()`, `val`. `math.abs` for probe tolerances.
- A failed demo probe must **throw** (the `probe` helper does `array.arrLength(missing)` on an unassigned `dim missing` when `passed = 0`) so Cypress's "no `ERR`" guard catches it.

### Verification commands

- Tests: `npx vitest run` (full, currently **1928 passed / 1 skipped**) or a path filter. Never `tsc`.
- Build: `npx vite build` (ignore the pre-existing chunk-size warning).
- Demo export: `npm run build:demo -- demo-src/raycaster-p6 RaycasterP6Actors`.
- Cypress (needs `npm run dev` on :5173 first): `npx cypress run --spec cypress/e2e/demos.cy.ts` (expect 10 passing).
- Transient transpile probes: `tests/scratch/` (gitignored + glob-excluded); to run, copy to a real `tests/**/…Tmp.test.ts` path, run, then `mv` to `/private/tmp/claude-501/-Users-jon-source-Basic4WebGL/46f0f39e-06f1-4a8e-acb8-9c6b885d4c15/scratchpad/`. Never leave `*Tmp*.test.ts` in `tests/`, never commit a probe.

---

## Task 1: `RcConfig` shade constants + `drawStrip` new kinds

**Files:** Modify `demo-src/raycaster/lib/RcConfig.bas` and `demo-src/raycaster/lib/RcRender.bas`; re-sync `demo-src/raycaster-p{2,3,4,5,6}/RcConfig.bas` and `demo-src/raycaster-p{3,4,5,6}/RcRender.bas`.

- [ ] **Step 1: `RcConfig`** — insert before `endconst`:

```basic
    RC_SHADE_FLOOR_TOP = 4
    RC_SHADE_PIT_FLOOR = 5
    RC_SHADE_CEIL_UNDER = 6
    RC_SHADE_SOFFIT = 7
```

These are **`drawStrip` shadeKind indices**, continuing the 0–3 series (0 wall-x, 1 wall-y, 2 floor-step riser, 3 ceil-step riser). The greys they map to live in `drawStrip`'s table, next to the existing ones.

- [ ] **Step 2: `drawStrip`** — in `demo-src/raycaster/lib/RcRender.bas`, extend the `g` selection. After the existing `if shadeKind = 3 then g = 65 endif` add:

```basic
    if shadeKind = 4 then
        g = 105
    endif
    if shadeKind = 5 then
        g = 60
    endif
    if shadeKind = 6 then
        g = 80
    endif
    if shadeKind = 7 then
        g = 50
    endif
```

(Horizontal top surfaces read a touch brighter than the vertical risers; pit floor / soffit read darker — in shadow.) Everything else in `drawStrip` is unchanged.

- [ ] **Step 3: Re-sync.**

```bash
for d in 2 3 4 5 6; do cp demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-p$d/RcConfig.bas; done
for d in 3 4 5 6; do cp demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p$d/RcRender.bas; done
```

- [ ] **Step 4: Verify.** `npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo` — all green (transpile + lib-sync + smoke + probes; no behaviour change yet — shadeKinds 4–7 are never passed). `npx vite build` clean.

- [ ] **Step 5: Commit.**

```bash
git add demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p2/RcConfig.bas demo-src/raycaster-p3 demo-src/raycaster-p4 demo-src/raycaster-p5 demo-src/raycaster-p6
git commit -m "feat(raycaster): RcConfig surface shade kinds + drawStrip table (Phase 6b)"
```

---

## Task 2: `RcRender` — the surface pass

**Files:** Modify `demo-src/raycaster/lib/RcRender.bas`; re-sync `demo-src/raycaster-p{3,4,5,6}/RcRender.bas`; extend `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`.

- [ ] **Step 1: Class field + Constructor.** Add `dim surfCountLast` to the class dim block (next to `depthArr(0)` / `actorOrderIdx(0)`). In the Constructor, after `self.boundActors = 0` (or near the other `= 0` inits), add `self.surfCountLast = 0`.

- [ ] **Step 2: `surfaceCount()` accessor.** Add near `depthAt` / `columnCount`:

```basic
' Debug/probe hook: number of horizontal-surface strips drawn during the last
' renderFrame(). A billboard/probe uses it to confirm the surface pass ran; a
' small over-count from window-clipped strips is fine.
function surfaceCount()
    return self.surfCountLast
endfunction
```

- [ ] **Step 2b: `drawSurface()` helper** (added in the Task 2 code review — do NOT inline the surface draw). A floor surface below eye level and a ceiling surface above it project with *opposite* near/far screen ordering; centralise it so `drawStrip` never gets `sTop > sBot` (which it silently skips). `drawStrip` gains a `1`/`0` return (drew / clipped) so `surfaceCount()` is honest.

```basic
' Draw one flat horizontal surface at world height hh, from depth dNear to dFar,
' as a per-column strip. Orders the two projected Ys so drawStrip always gets
' top < bottom (a floor below eye and a ceiling above it project inverted).
' Bumps surfCountLast only when a strip is actually painted.
function drawSurface(destX, hh, dNear, dFar, winTop, winBot, kind, lite)
    dim ya
    dim yb
    ya = self.projectY(hh, dNear)
    yb = self.projectY(hh, dFar)
    if ya <= yb then
        self.surfCountLast = self.surfCountLast + self.drawStrip(destX, ya, yb, winTop, winBot, kind, lite)
    else
        self.surfCountLast = self.surfCountLast + self.drawStrip(destX, yb, ya, winTop, winBot, kind, lite)
    endif
endfunction
```

And in `drawStrip`, change the two early `return`s (the `b <= t` guard and, if present, any other) plus the end of the function to **return 1 on a real draw, 0 on a clipped skip** — the wall/riser callers ignore the value (harmless). Concretely: `if b <= t then return 0 endif` at the guard, and `return 1` as the last line after `drawing.drawRect(...)`.

- [ ] **Step 3: `renderFrame` dim block.** Add these hoisted locals to `renderFrame`'s `dim` list (NO `yF`/`yN` — the helper owns projection):

```basic
    dim hitWall
    dim sfH
    dim sfD
    dim sfKind
    dim sfLite
    dim scH
    dim scD
    dim scKind
    dim scLite
```

- [ ] **Step 4: Reset the counter.** Near the top of `renderFrame` (with `bgLite`), add `self.surfCountLast = 0`.

- [ ] **Step 5: Per-column init.** Inside `for col = 0 to self.cols - 1`, right after `self.depthArr(col) = RcConfig.RC_MAX_DIST` (and after `runFloorH` / `runCeilH` are set), add:

```basic
        hitWall = 0
        sfH = runFloorH
        sfD = 0
        sfKind = RcConfig.RC_SHADE_FLOOR_TOP
        scH = runCeilH
        scD = 0
        scKind = RcConfig.RC_SHADE_CEIL_UNDER
        sfLite = 1.0
        scLite = 1.0
        if self.boundLights <> 0 then
            sfLite = self.boundLights.sampleCell(camCol, camRow)
            scLite = sfLite
        endif
```

- [ ] **Step 6: WALL branch.** Replace the `if kind = RcConfig.RC_SPAN_WALL then` block body with (surfaces first, then the existing wall draw):

```basic
            if kind = RcConfig.RC_SPAN_WALL then
                self.drawSurface(destX, sfH, sfD, d, winTop, winBot, sfKind, sfLite)
                self.drawSurface(destX, scH, scD, d, winTop, winBot, scKind, scLite)
                hitWall = 1
                self.drawStrip(destX, sTop, sBot, winTop, winBot, self.rc.spanSide(i), lite)
                self.depthArr(col) = d
                i = n
```

- [ ] **Step 7: FLOORSTEP branch.** Replace it with:

```basic
                if kind = RcConfig.RC_SPAN_FLOORSTEP then
                    newH = self.wld.floorHeightAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    self.drawSurface(destX, sfH, sfD, d, winTop, winBot, sfKind, sfLite)
                    self.drawStrip(destX, sTop, sBot, winTop, winBot, 2, lite)
                    if newH > runFloorH then
                        newY = self.projectY(newH, d)
                        if newY < winBot then
                            winBot = newY
                        endif
                    endif
                    sfD = d
                    if newH < runFloorH then
                        sfKind = RcConfig.RC_SHADE_PIT_FLOOR
                    else
                        sfKind = RcConfig.RC_SHADE_FLOOR_TOP
                    endif
                    sfH = newH
                    sfLite = lite
                    runFloorH = newH
```

- [ ] **Step 8: CEILSTEP branch** (the `else` of the FLOORSTEP `if`). Replace with:

```basic
                else
                    newH = self.wld.ceilHeightAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    self.drawSurface(destX, scH, scD, d, winTop, winBot, scKind, scLite)
                    self.drawStrip(destX, sTop, sBot, winTop, winBot, 3, lite)
                    if newH < runCeilH then
                        newY = self.projectY(newH, d)
                        if newY > winTop then
                            winTop = newY
                        endif
                    endif
                    scD = d
                    if newH < runCeilH then
                        scKind = RcConfig.RC_SHADE_SOFFIT
                    else
                        scKind = RcConfig.RC_SHADE_CEIL_UNDER
                    endif
                    scH = newH
                    scLite = lite
                    runCeilH = newH
                endif
```

(A ceiling that **drops** — `newH < runCeilH`, lower on screen per `projectY` — is a soffit you look up at; a ceiling that **rises** shows its `CEIL_UNDER` underside. This matches the existing riser clamp `if newH < runCeilH then <clamp winTop>`.)

- [ ] **Step 9: Post-loop tail.** After `endwhile` and before `next col`, add:

```basic
        if hitWall = 0 then
            self.drawSurface(destX, sfH, sfD, RcConfig.RC_MAX_DIST, winTop, winBot, sfKind, sfLite)
            self.drawSurface(destX, scH, scD, RcConfig.RC_MAX_DIST, winTop, winBot, scKind, scLite)
        endif
```

- [ ] **Step 10: Header comment.** In the `RcRender.bas` header, delete the sentence "seeing INTO a pit or UNDER a ledge (floor drop / ceiling rise revealing farther geometry) is a later refinement -- the window is left open there so farther spans show through, but the pit floor / under-ledge surface is not specially drawn." Replace with: "Phase 6b: floor/ceiling step *risers* AND the horizontal surfaces between them (step tops, pit floors, ceiling undersides, soffits) are drawn as flat per-column strips. Floor/ceiling *textures* are still not sampled."

- [ ] **Step 11: Re-sync.**

```bash
for d in 3 4 5 6; do cp demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p$d/RcRender.bas; done
```

- [ ] **Step 12: Transpile probe.** `tests/scratch/` → runnable `tests/lib/Basic4WebGL/p6bRenderProbeTmp.test.ts` (imports `../../../src/constants/packageModules` + `@Basic4WebGL/sortByDependencies`): transpile every `.bas` in `demo-src/raycaster-p6/` together, assert `diagnostics` is `[]`. Iterate on `RcRender.bas` until clean. `mv` out when green.

- [ ] **Step 13: Smoke test — surface strips are drawn where projected.** In `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`:
  - The Phase-6 occlusion test already added an `evalDemo(code, sbOverrides)` overrides param and a `getStageWidth`/`getStageHeight` + `drawImageStrip` spy pattern. Reuse it; also spy `drawRect`. Override keys are the `_sb.<name>` method names verbatim from the `.bas` `call(...)` strings — `drawImageStrip`, `drawRect`, `getStageWidth`, `getStageHeight` (camelCase, same as the Phase-6 test's `drawImageStrip` key which is known to work).
  - Add `surfacecount(): number` to `RcRenderLike`.
  - New `test.each(phaseDirs)('%s: renderFrame draws floor/pit surfaces', ...)`:
    - `stubWorld2` — a corridor (wall at `c >= 8`) whose `floorheightat(c,r)` returns `0` for `c < 4`, `0.3` for `4 <= c < 6` (a step up), `-0.25` for `c >= 6` (a drop); **`ceilheightat(c,r)` returns `1` for `c < 5` and `1.4` for `c >= 5` (a ceiling that rises — its `CEIL_UNDER` underside must draw)**. `widthcells: 12`, `heightcells: 4`.
    - `const rects: any[][] = []` via `drawRect: (...a) => { rects.push(a); }` in overrides; `getStageWidth: () => 320`, `getStageHeight: () => 200`.
    - `const r = new mod.RcRender(stubWorld2); r.setcamera(2, 2, 0, 0);` (camera in the `c<4` flat zone, looking `+x`).
    - `if (!mod.RcRender) return;` — this test needs no `RcActors`, so it can run for p3–p6.
    - `r.renderframe();`
    - `expect(r.surfacecount()).toBeGreaterThan(0);`
    - `drawRect` args are `(destX, midY, w, h)`. The two background fills are `drawRect(160, 100, 320, 200)` and `drawRect(160, ~150, 320, ~100)` — filter those out (w === 320). The remaining rects are strips (w === `RC_STRIP_W` === 4).
    - **Step-top present, at the right height:** for a centre-ish column, there must be a strip whose vertical band brackets `projectY(0.3, someDepthInThatCell)`. Compute the expected screen Y with the same formula (`scy=100`, `viewH=200`, `camZ=0`, `RC_EYE_Z=0.5`, `camPitch=0`): `projectY(0.3, d) = 100 + (0.5 - 0.3) * (200 / d)`. For `d` in the `0.3` cell (≈ 2 to 4 world units from camera at x=2), that's ≈ `100 + 0.2*(200/3)` ≈ `113`. Assert **some** strip rect at a centre column has `midY` within, say, `±25` of that AND grey brighter than the pit (see below). Keep the tolerance loose — the point is "a floor surface is drawn roughly where the step is", not pixel-exactness.
    - **Pit floor is drawn BELOW the rim:** assert there exists a strip with `midY` greater (lower on screen) than the step-top strip's `midY`.
    - **Ceiling underside draws:** assert at least one `w === 4` (`a[2] === RC_STRIP_W`) strip has `midY < 100` (above the horizon at `scy = 100`). Before this task's ceiling-ordering fix this assertion **fails** (ceiling surfaces silently skipped) — it is the regression guard for the Critical bug.
    - **Kind selection not inverted:** spy `pen.setFillColor` (`_sb.setFillColor` — check `src/lib/Basic4WebGL/defs/pen.bas`; override key `setFillColor`). Capture `(r,g,b)` per `drawRect` (they're issued back-to-back). Assert the pit-floor strip's grey (`RC_SHADE_PIT_FLOOR` → g≈60) is **darker** than the step-top strip's (`RC_SHADE_FLOOR_TOP` → g≈105). Catches a `sfKind` / `scKind` `<`/`>` inversion. If pairing colours to rects is awkward, at minimum assert the set of distinct greys drawn includes both a "bright" (>95) and a "dark" (<70) surface value.
  - `surfacecount()` is now honest (only counts real draws — Step 2b) so `expect(r.surfacecount()).toBeGreaterThan(3)` is a fair loose sanity check alongside the specific assertions above.
  - If the colour-pairing maths gets genuinely fiddly, the floor + ceiling + `surfacecount` assertions are the must-haves; report what you dropped and why.

- [ ] **Step 14: Verify.** `npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemo` green. `npx vitest run` full green. `npx vite build` clean.

- [ ] **Step 15: Commit.**

```bash
git add demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p3/RcRender.bas demo-src/raycaster-p4/RcRender.bas demo-src/raycaster-p5/RcRender.bas demo-src/raycaster-p6/RcRender.bas tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts
git commit -m "feat(raycaster): RcRender draws floor/ceiling horizontal surfaces (Phase 6b)"
```

---

## Task 3: `p6room.stm` — add a staircase and a pit

**Files:** Modify `demo-src/raycaster-p6/assets/p6room.stm`.

- [ ] **Step 1: Room.** Keep the existing walls grid (14×10, border walls, wall stub at row 2–3 col 8) and the `light` marker. Extend the `tags.markers` list — keep the ledge, add the stair + pit:

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
      { "row": 1, "col": 1, "tag": "light" },

      { "row": 7, "col": 8,  "tag": "floor:0.15" },
      { "row": 8, "col": 8,  "tag": "floor:0.15" },
      { "row": 7, "col": 9,  "tag": "floor:0.3" },
      { "row": 8, "col": 9,  "tag": "floor:0.3" },
      { "row": 7, "col": 10, "tag": "floor:0.4" },
      { "row": 8, "col": 10, "tag": "floor:0.4" },
      { "row": 7, "col": 11, "tag": "floor:0.4" },
      { "row": 8, "col": 11, "tag": "floor:0.4" },

      { "row": 4, "col": 5, "tag": "floor:-0.25" },
      { "row": 4, "col": 6, "tag": "floor:-0.25" },
      { "row": 5, "col": 5, "tag": "floor:-0.25" },
      { "row": 5, "col": 6, "tag": "floor:-0.25" }
    ] }
  } }
```

- [ ] **Step 2: Validate.** `node -e "const d=JSON.parse(require('fs').readFileSync('demo-src/raycaster-p6/assets/p6room.stm','utf8')); console.log(d.layers.walls.length, d.layers.tags.markers.length)"` — expect `10 13`.

- [ ] **Step 3: Confirm `floor:-0.25` loads.** A one-off probe (or fold into Task 4's probe test): transpile + eval the p6 demo, `new RcWorld(tm, "walls")`, assert `wld.floorHeightAt(5, 4)` ≈ `-0.25` (`RcWorld.applyKv` does `self.floorHArr(idx) = math.val(v)` → `Number("-0.25")` → `-0.25`). If negative parse fails, STOP and report — that's an `applyKv` / lexer issue for a separate fix, not a workaround here.

- [ ] **Step 4: Commit.**

```bash
git add demo-src/raycaster-p6/assets/p6room.stm
git commit -m "test(raycaster): p6 room gains a staircase + a pit (Phase 6b)"
```

---

## Task 4: `ActorScene` probes + rebuild export

**Files:** Modify `demo-src/raycaster-p6/ActorScene.bas`; re-sync it is NOT needed (it's demo-only, not a canonical lib file). Rebuild `src/docs/demos/RaycasterP6Actors.b4wgl.json`. Modify `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts`.

- [ ] **Step 1: Probes.** In `ActorScene.bas`'s `runProbes()`, after the existing 6 probes, add three (hoist any new `dim` to the top of `runProbes`; `probe(label, passed, y)` unchanged; keep the `y` values increasing — the last existing probe is at `y = 152`, so use 172 / 192 / 212):

```basic
    ' 7 - the staircase geometry loaded (0 -> 0.15 -> 0.3 -> 0.4)
    dim ok7
    ok7 = 0
    if math.abs(self.wld.floorHeightAt(9, 7) - 0.3) < 0.01 then
        if math.abs(self.wld.floorHeightAt(11, 7) - 0.4) < 0.01 then
            ok7 = 1
        endif
    endif
    self.probe("staircase loaded", ok7, 172)

    ' 8 - the pit geometry loaded
    dim ok8
    ok8 = 0
    if math.abs(self.wld.floorHeightAt(5, 4) + 0.25) < 0.01 then
        ok8 = 1
    endif
    self.probe("pit loaded", ok8, 192)

    ' 9 - the surface pass actually drew something last frame
    dim ok9
    self.ren.renderFrame()
    ok9 = 0
    if self.ren.surfaceCount() > 0 then
        ok9 = 1
    endif
    self.probe("surfaces drawn", ok9, 212)
```

(`math.abs(x + 0.25)` tests `x ≈ -0.25` without needing a negative literal in a comparison. `runProbes` already calls `self.ren.setCamera(3.0, 3.0, 0, 0)` at its top and — from Phase 6 — a `renderFrame` isn't there yet for probe 1; probe 1 uses `worldToScreenX` off the Constructor basis. Probe 9's `renderFrame()` is the first real frame; it's safe in `onenter` (assets are loaded).)

- [ ] **Step 2: Verify the ledge NPC is grounded** — no code change, but check `ActorScene.onenter` still spawns the ledge NPC at `(10.5, 7.5, 0.4)`. It now stands on the drawn stair-top. If the "floor" NPC at `(6.5, 3.0, 0)` overlaps the pit (pit is rows 4–5 cols 5–6; the NPC at col 6 row 3 is clear) — it's clear, leave it.

- [ ] **Step 3: Rebuild the export.**

```bash
npm run build:demo -- demo-src/raycaster-p6 RaycasterP6Actors
```

- [ ] **Step 4: `raycasterDemoProbes.test.ts`** — bump the P6 case's `probeCount` from `6` to `9`. The harness already feeds the real `p6room.stm` and a real stage width, so the two geometry probes + the `surfaceCount` probe run with no harness change. Run `npx vitest run tests/lib/Basic4WebGL/integration/raycasterDemoProbes` — the P6 test must pass (all 9 probes `": OK"`, `onenter` no throw). If a probe fails, trace the geometry (Task 3's grid) and fix the probe's expected value, not the tolerance-to-meaninglessness; report any adjustment.

- [ ] **Step 5: Verify.** `npx vitest run` full green (lib-sync picks up nothing new — `ActorScene.bas` isn't a canonical file; the 8 p6 lib copies are already synced from Task 1/2). `npx vite build` clean.

- [ ] **Step 6: Commit.**

```bash
git add demo-src/raycaster-p6/ActorScene.bas src/docs/demos/RaycasterP6Actors.b4wgl.json tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts
git commit -m "test(raycaster): p6 probes for staircase / pit geometry + surface pass (Phase 6b)"
```

---

## Task 5: Registry description + Cypress eyeball

**Files:** `src/features/demos/devDemoRegistry.ts` (description only).

- [ ] **Step 1:** Update the `raycaster-p6-actors` entry's `description` to mention the surfaces, e.g.: *"Phase 6/6b probe: RcActors billboards depth-clipped per column against the wall buffer + los/hitscan/near; RcRender now also fills floor/ceiling horizontal surfaces (step tops, pit floor) so the ledge NPC stands on solid ground."* Keep it one sentence-ish. No `devDemoRegistry.test.ts` change (it only checks `slug`/`file`/`name`).

- [ ] **Step 2:** `npx vitest run tests/ui/features/demos/devDemoRegistry.test.ts` green.

- [ ] **Step 3: Commit.**

```bash
git add src/features/demos/devDemoRegistry.ts
git commit -m "docs(raycaster): p6 demo description mentions surface rendering (Phase 6b)"
```

- [ ] **Step 4: Cypress + manual** (needs a browser). `npm run dev`, then:
  - `npx cypress run --spec cypress/e2e/demos.cy.ts` — all 10 dev demos green (P6 no `ERR`; the 3 new probes must pass).
  - Seed `raycaster-p6-actors` (`window.__seedDemo`), open, Run. Confirm: 9 probes `OK`; the ledge is a **solid platform** reached by visible **steps**; the **pit has a floor** you can see into (not a see-through hole); walk the stairs — the camera rises; the ledge NPC's feet **touch the platform**, no float. Also glance at p3 / p4 — their stepped/pitted rooms should now render solid too.
  - Break probe 9 (temporarily invert `> 0` to `< 0`) → `ERR` in Cypress → restore.

---

## Task 6: Docs + roadmap + spec reconciliation

**Files:** `src/docs/guides/raycaster-library.md`, `docs/roadmap.md`, `docs/language/library-roadmap.md`, `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`.

- [ ] **Step 1: Guide** (`src/docs/guides/raycaster-library.md`). In the `## RcRender — drawing the view` section, add a short paragraph (and/or update `### Phase 3 limits`): RcRender now fills the horizontal surfaces of raised/dropped floors and ceilings (step tops, pit floors, ceiling undersides, soffits) as flat-shaded strips; floor/ceiling **textures** are still not sampled. If `surfaceCount()` is worth a one-liner as a debug hook, add it to the RcRender method table; otherwise leave it undocumented (it's a probe hook). Match the guide's beginner voice.

- [ ] **Step 2: `docs/roadmap.md`** — extend the raycaster bullet: after "Phase 6 shipped…", add "Phase 6b shipped: `RcRender` fills floor/ceiling horizontal surfaces (step tops, pit floors, ceiling undersides, soffits) as flat per-column strips — completing the flat-shaded render before Phase 7's diagonal walls." Leave "Phases 7–10 remain" (6b is a sub-step, not a new numbered phase).

- [ ] **Step 3: `docs/language/library-roadmap.md`** — same Phase 6b line; update the "Known limits" list (drop "no floor/ceiling surface rendering" if present; keep "no floor/ceiling textures").

- [ ] **Step 4: Engine spec** (`docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`):
  - §5.2: the "Floor/ceiling step surfaces use a flat-shaded `drawing.drawRect`" line — add an "As built (6b)" note that this now covers the *horizontal* surface between risers, per-column, with four new shade kinds, deferred one loop iteration; textures still not sampled.
  - §11: insert `**6b. Horizontal surface rendering.** RcRender fills step tops / pit floors / ceiling undersides / soffits as flat per-column strips. *Demo:* `raycaster-p6-actors` gains a staircase + a pit; the ledge NPC is grounded. **[DONE]**` between phase 6 and phase 7.

- [ ] **Step 5:** `npx vitest run` + `npx vite build` (docs-manifest test can break on a bad edit). Commit.

```bash
git add src/docs/guides/raycaster-library.md docs/roadmap.md docs/language/library-roadmap.md docs/superpowers/specs/2026-08-31-raycaster-engine-design.md
git commit -m "docs(raycaster): Phase 6b guide + roadmap + engine-spec reconciliation"
```

---

## Task 7: Close-out

- [ ] `npx vitest run` — all green, incl. `raycasterDemoLibSync` (RcConfig p2–6 + RcRender p3–6 byte-identical), `raycasterDemoTranspile`, `raycasterDemoSmoke` (surface-strip test), `raycasterDemoProbes` (P6 = 9 probes).
- [ ] `npx vite build` clean.
- [ ] `raycaster-p6-actors` still `devDemoRegistry`-only (not `demoRegistry`, no `docsSlug`, not in `docs/manifest.ts`).
- [ ] **Manual Cypress** (browser): `demos.cy.ts` 10/10, `tutorials.cy.ts` 11/11. Eyeball the p6 demo per Task 5 Step 4. Break probe 9 → `ERR` → restore.
- [ ] **Spec check** — surface-rendering design doc §2 (all four surfaces, per-column strips, stash-and-defer, kind fixed at stash time), §4 (demo room + probes), §5 (`surfaceCount`) all delivered. Note in the design doc's status line: shipped `<commit range>`.
- [ ] Frame-time: if the p3 or a p6 HUD frame-time readout exists, note the number before/after (surfaces add ~1 `drawRect` per floor/ceiling transition per column). If it's materially worse, that's the spec §5.3 rung-4 trigger — record it as a tracked item, don't fix here.

---

## Notes for later (not this plan)

- **Floor/ceiling textures** — per-scanline UV (floor-casting) sampling `floorTex`/`ceilTex`; rides with the wall-texturing pass. The flat surface strips from 6b become the fallback for untextured cells.
- **Distance fog** in `drawStrip` — a single global falloff term applied to every shade kind at once; Phase 9 polish.
- **Batched strip primitive** (`drawing.drawStrips(...)`, spec §5.3 rung 4) — only if a measured frame-time failure demands it; 6b's extra `drawRect`s are the most likely trigger.
