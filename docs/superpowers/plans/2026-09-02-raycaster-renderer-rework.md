# Raycaster Renderer Rework — Interval Occlusion + Bilinear Light — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `RcRender`'s single per-column occlusion window with a per-column list of visible screen-Y intervals (so a mid-column opaque band — a walkway plank underside, a railing seen from below — splits the visible band instead of flattening it), and add bilinear light sampling for floor/ceiling surfaces. Fixes the `raycaster-p8` walkway/hole garbage and the "shadows of walls that aren't there" floor lighting.

**Architecture:** New `RcRender` primitives `resetIntervals()` / `occlude(oTop,oBot)` / `drawInto(sTop,sBot,shade,lite)` / `intervalCount()` over parallel arrays `intvTop`/`intvBot` (capped at `RcConfig.RC_MAX_INTERVALS`, drop-thinnest). `renderFrame`'s span walk is rewritten: every opaque surface `occlude`s exactly its own projected screen band; a full wall clears all intervals and stops; the walk ends early when nothing is visible. New `RcLights.sampleAt(x,y)` bilinear-blends the 4 surrounding cells; `RcRender` uses it for surfaces (sampled at `cam + rayDir*d`), keeps `sampleCell` for walls.

**Tech Stack:** softBASIC (`.bas` → JS/PIXI), Vitest integration tests, Cypress e2e, `scripts/buildDemo.ts`.

**Spec:** `docs/superpowers/specs/2026-09-02-raycaster-renderer-rework-design.md`

**No `src/` change.** `RcCast` / `RcWorld` / `RcMover` unchanged — they already emit the right spans (incl. the Phase-8 `newH`-from-span-endpoint fix and the hole-cell `cellFloor`/`cellCeil` overrides).

---

## File Structure

- `demo-src/raycaster/lib/RcConfig.bas` — `RC_MAX_INTERVALS`. Copied p2–p8.
- `demo-src/raycaster/lib/RcRender.bas` — interval primitives + `renderFrame` rewrite + `drawSurfaceInto` + `sampleAt` for surfaces. Copied p3–p8.
- `demo-src/raycaster/lib/RcLights.bas` — `sampleAt(worldX, worldY)`. Copied p5–p8.
- `tests/lib/Basic4WebGL/integration/raycasterIntervals.test.ts` — NEW: `occlude`/`drawInto`/`resetIntervals`/`intervalCount` unit behaviour.
- `tests/lib/Basic4WebGL/integration/raycasterLights.test.ts` — NEW (or a block in an existing file): `RcLights.sampleAt` bilinear.
- `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts` — rewrite the two render assertions (`renderFrame draws portal strips through an upper-region hole`, `renderFrame draws floor/pit surfaces`) to interval-list behaviour; add a smooth-floor-light assertion.
- `demo-src/raycaster-p8/` — re-verify; adjust `PortalScene.bas` torch / `p8room.stm` `light:` markers only if the fixed renderer shows they're wrong; rebuild `src/docs/demos/RaycasterP8Upper.b4wgl.json`.
- Docs: engine spec §5.1/§5.2/§6, phase-8 spec §4, `src/docs/guides/raycaster-library.md`, `docs/roadmap.md`, `docs/language/library-roadmap.md`.

---

## Task 1: RcConfig — `RC_MAX_INTERVALS`

**Files:** `demo-src/raycaster/lib/RcConfig.bas`; then `cp` to `raycaster-p2`…`raycaster-p8`.

- [ ] **Step 1:** before `endconst`, add:
```basic
    RC_MAX_INTERVALS = 6
```
- [ ] **Step 2:** `for d in raycaster-p2 raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6 raycaster-p7 raycaster-p8; do cp demo-src/raycaster/lib/RcConfig.bas demo-src/$d/RcConfig.bas; done`
- [ ] **Step 3:** `npx vitest run raycasterDemoTranspile raycasterDemoLibSync` → PASS.
- [ ] **Step 4:** commit `feat: RcConfig RC_MAX_INTERVALS (renderer rework)`

---

## Task 2: RcRender — interval primitives (not yet wired in)

**Files:** `demo-src/raycaster/lib/RcRender.bas`; `tests/lib/Basic4WebGL/integration/raycasterIntervals.test.ts` (create); then `cp` RcRender to `raycaster-p3`…`raycaster-p8`.

### Step 1: Write the failing test

Create `raycasterIntervals.test.ts` — model the harness on `raycasterDiagWorld.test.ts` / the smoke test's `evalDemo` (transpile a phase demo, `new mod.RcRender(stubWorld)`, call the primitives). The primitives are plain public functions, callable directly. Assertions:

```ts
// r = new mod.RcRender(stubWorld); r.setcamera(2,2,0,0);
// (viewH comes from getStageHeight override — set it to 200)

r.resetintervals();
expect(r.intervalcount()).toBe(1);            // [0,200]

// occlude a middle band -> split into two
r.occlude(80, 120);
expect(r.intervalcount()).toBe(2);            // [0,80] and [120,200]

// occlude the top of the first -> shrinks, no new interval
r.occlude(0, 40);
expect(r.intervalcount()).toBe(2);            // [40,80] and [120,200]

// occlude spanning across the gap -> trims both
r.occlude(60, 140);
expect(r.intervalcount()).toBe(2);            // [40,60] and [140,200]

// occlude covering an interval entirely -> drop it
r.occlude(0, 70);
expect(r.intervalcount()).toBe(1);            // [140,200]

// reset, then over-split past the cap -> drops the thinnest
r.resetintervals();
r.occlude(10, 12);   // -> [0,10],[12,200]
r.occlude(20, 22);   // -> [0,10],[12,20],[22,200]
r.occlude(30, 32);
r.occlude(40, 42);
r.occlude(50, 52);
r.occlude(60, 62);   // 7 intervals momentarily -> cap 6 -> thinnest ([0,10]? no, the 2-px ones) dropped
expect(r.intervalcount()).toBeLessThanOrEqual(6);

// drawInto hits every visible interval
r.resetintervals();
r.occlude(90, 110);
const strips: number[][] = [];
// (drawRect override pushes args)
r.drawinto(0, 200, 0, 1.0);
expect(strips.filter((a) => a[2] === 4).length).toBe(2); // one strip per visible interval
```

Extend `RcRenderLike` with `resetintervals(): void`, `occlude(t: number, b: number): void`, `drawinto(t: number, b: number, shade: number, lite: number): number`, `intervalcount(): number`.

Run → FAIL (`resetintervals` not a function).

### Step 2: Implement the primitives

In `demo-src/raycaster/lib/RcRender.bas`:

**(a) Fields** — with the other `dim`s at class scope:
```basic
dim intvTop(0)
dim intvBot(0)
dim occTop(0)
dim occBot(0)
```

**(b) `resetIntervals()`** — one full-height interval:
```basic
function resetIntervals()
    array.clear(self.intvTop)
    array.clear(self.intvBot)
    array.push(self.intvTop, 0)
    array.push(self.intvBot, self.viewH)
endfunction
```

**(c) `intervalCount()`:**
```basic
function intervalCount()
    return array.arrLength(self.intvTop)
endfunction
```

**(d) `occlude(oTop, oBot)`** — subtract the band from every interval, splitting mid-interval; then enforce the cap by dropping the thinnest:
```basic
function occlude(oTop, oBot)
    dim k
    dim t
    dim b
    dim cnt
    if oBot <= oTop then
        return
    endif
    array.clear(self.occTop)
    array.clear(self.occBot)
    cnt = array.arrLength(self.intvTop)
    for k = 0 to cnt - 1
        t = self.intvTop(k)
        b = self.intvBot(k)
        if oBot <= t or oTop >= b then
            array.push(self.occTop, t)
            array.push(self.occBot, b)
        else
            if oTop > t then
                array.push(self.occTop, t)
                array.push(self.occBot, oTop)
            endif
            if oBot < b then
                array.push(self.occTop, oBot)
                array.push(self.occBot, b)
            endif
        endif
    next k
    array.clear(self.intvTop)
    array.clear(self.intvBot)
    cnt = array.arrLength(self.occTop)
    for k = 0 to cnt - 1
        array.push(self.intvTop, self.occTop(k))
        array.push(self.intvBot, self.occBot(k))
    next k
    while array.arrLength(self.intvTop) > RcConfig.RC_MAX_INTERVALS
        self.dropThinnest()
    endwhile
endfunction
```

**(e) `dropThinnest()`** — remove the shortest interval by rebuilding without it:
```basic
function dropThinnest()
    dim k
    dim n
    dim minIdx
    dim minH
    dim h
    n = array.arrLength(self.intvTop)
    if n <= 1 then
        return
    endif
    minIdx = 0
    minH = self.intvBot(0) - self.intvTop(0)
    for k = 1 to n - 1
        h = self.intvBot(k) - self.intvTop(k)
        if h < minH then
            minH = h
            minIdx = k
        endif
    next k
    array.clear(self.occTop)
    array.clear(self.occBot)
    for k = 0 to n - 1
        if k <> minIdx then
            array.push(self.occTop, self.intvTop(k))
            array.push(self.occBot, self.intvBot(k))
        endif
    next k
    array.clear(self.intvTop)
    array.clear(self.intvBot)
    for k = 0 to array.arrLength(self.occTop) - 1
        array.push(self.intvTop, self.occTop(k))
        array.push(self.intvBot, self.occBot(k))
    next k
endfunction
```
(`occTop`/`occBot` double as `dropThinnest`'s scratch — safe, `occlude` has already finished reading them before the `while` loop calls `dropThinnest`.)

**(f) `drawInto(sTop, sBot, shadeKind, lite)`** — draw the surface clipped to each visible interval; return total strips painted:
```basic
function drawInto(sTop, sBot, shadeKind, lite)
    dim k
    dim total
    dim n
    total = 0
    n = array.arrLength(self.intvTop)
    for k = 0 to n - 1
        total = total + self.drawStrip(self.iDestX, sTop, sBot, self.intvTop(k), self.intvBot(k), shadeKind, lite)
    next k
    return total
endfunction
```
`drawStrip` currently takes `destX` as its first arg; `drawInto` needs the column's `destX`. Add a field `dim iDestX` set at the top of each column iteration in `renderFrame` (`self.iDestX = destX`) so the primitives don't need it threaded through. (Alternative: pass `destX` into `drawInto` — but `occlude` doesn't need it and keeping the primitive signatures minimal is cleaner. The plan uses `self.iDestX`.)

### Step 3: Run → PASS.

### Step 4: Sync + verify

```bash
for d in raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6 raycaster-p7 raycaster-p8; do
  cp demo-src/raycaster/lib/RcRender.bas demo-src/$d/RcRender.bas
done
```
Run: `npx vitest run raycasterIntervals raycasterDemoSmoke raycasterDemoTranspile raycasterDemoLibSync raycasterDemoProbes` → PASS (renderFrame not changed yet — everything else stays green; `iDestX` is set but unused so far, harmless).

### Step 5: Commit — `feat: RcRender interval-list occlusion primitives (renderer rework)`

---

## Task 3: RcRender — rewrite `renderFrame`'s span walk

**Files:** `demo-src/raycaster/lib/RcRender.bas`; `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`; then `cp` to `raycaster-p3`…`raycaster-p8`.

### Step 1: Rewrite the two render smoke tests (RED)

In `raycasterDemoSmoke.test.ts`:

**(a) `renderFrame draws portal strips through an upper-region hole`** — rewrite to assert the interval-list fix: a region-0 ray looking through the hole must draw **both** a strip for the room below **and** a strip for the ceiling area above, at different `midY`, from a `drawRect` spy (w === 4). Before the rework there's one flattened band; after, two.

**(b) `renderFrame draws floor/pit surfaces`** (the `stubWorld2` SURF_GREYS / midY test) — the exact greys/midYs churn. Retarget: assert `r.surfacecount() > 3` still holds, and that a FLOOR_TOP-grey strip and a CEIL_UNDER-grey strip both appear (the surface pass still runs) — but drop the brittle `Math.abs(s.midY - 113) <= 25` positional asserts, replacing them with "a FLOOR_TOP strip exists above a PIT_FLOOR strip" (relative ordering, which the interval walk preserves).

Run the targeted tests → they should FAIL against the current single-window `renderFrame` (or pass trivially — if trivial, tighten until they capture the two-strip / ordering invariant that the current code gets wrong).

### Step 2: Rewrite `renderFrame`

Replace the per-column body (from `winTop = 0` / `winBot = self.viewH` seed through the `endwhile` and the `if hitWall = 0` post-loop flush) with the interval walk. Keep everything above (camera sync, `camRegion`, `dirX/dirY/planeX/planeY`, `camCol/camRow`) and below (`next col`, `drawActors`) unchanged.

**Per-column skeleton:**
```basic
        self.rc.cast(self.wld, self.camX, self.camY, rayX, rayY)
        self.iDestX = col * RcConfig.RC_STRIP_W + RcConfig.RC_STRIP_W / 2
        self.resetIntervals()
        self.depthArr(col) = RcConfig.RC_MAX_DIST

        if camRegion = 1 then
            runFloorH = self.wld.upperFloorAt(camCol, camRow)
            runCeilH = self.wld.upperCeilAt(camCol, camRow)
        else
            runFloorH = self.wld.floorHeightAt(camCol, camRow)
            runCeilH = self.wld.ceilHeightAt(camCol, camRow)
        endif

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

        n = self.rc.spanCount()
        i = 0
        while i < n
            if self.intervalCount() = 0 then
                i = n
            else
                kind = self.rc.spanKind(i)
                d = self.rc.spanDist(i)
                sTop = self.projectY(self.rc.spanHi(i), d)
                sBot = self.projectY(self.rc.spanLo(i), d)
                lite = self.spanLite(i, kind, rayX, rayY)   ' §Step 5 extracts this; until then inline the existing lite block

                if kind = RcConfig.RC_SPAN_PORTAL_WALL then
                    self.drawInto(sTop, sBot, 1, lite)
                    self.occlude(sTop, sBot)
                    i = i + 1
                else
                    if kind = RcConfig.RC_SPAN_PORTAL_CEIL then
                        self.drawInto(0, sBot, 3, lite)
                        self.occlude(0, sBot)
                        i = i + 1
                    else
                        if kind = RcConfig.RC_SPAN_PORTAL_FLOOR then
                            if camRegion = 0 then
                                self.drawInto(0, sBot, RcConfig.RC_SHADE_UPPER_FLOOR, lite)
                                self.occlude(0, sBot)
                            else
                                self.drawInto(sTop, self.viewH, RcConfig.RC_SHADE_UPPER_FLOOR, lite)
                                self.occlude(sTop, self.viewH)
                            endif
                            i = i + 1
                        else
                            if kind = RcConfig.RC_SPAN_WALL then
                                self.drawSurfaceInto(sfH, sfD, d, sfKind, sfLite)
                                self.drawSurfaceInto(scH, scD, d, scKind, scLite)
                                wshade = self.rc.spanSide(i)
                                if wshade = RcConfig.RC_SPAN_SIDE_DIAG then
                                    wshade = 1
                                endif
                                self.drawInto(sTop, sBot, wshade, lite)
                                self.depthArr(col) = d
                                array.clear(self.intvTop)
                                array.clear(self.intvBot)
                                i = n
                            else
                                ' FLOORSTEP / CEILSTEP
                                if kind = RcConfig.RC_SPAN_FLOORSTEP then
                                    if self.rc.spanLo(i) = runFloorH then
                                        newH = self.rc.spanHi(i)
                                    else
                                        newH = self.rc.spanLo(i)
                                    endif
                                    self.drawSurfaceInto(sfH, sfD, d, sfKind, sfLite)
                                    self.drawInto(sTop, sBot, 2, lite)
                                    self.occlude(sTop, sBot)
                                    sfD = d
                                    if newH < runFloorH then
                                        sfKind = RcConfig.RC_SHADE_PIT_FLOOR
                                    else
                                        sfKind = RcConfig.RC_SHADE_FLOOR_TOP
                                    endif
                                    sfH = newH
                                    sfLite = lite
                                    runFloorH = newH
                                else
                                    if self.rc.spanLo(i) = runCeilH then
                                        newH = self.rc.spanHi(i)
                                    else
                                        newH = self.rc.spanLo(i)
                                    endif
                                    self.drawSurfaceInto(scH, scD, d, scKind, scLite)
                                    self.drawInto(sTop, sBot, 3, lite)
                                    self.occlude(sTop, sBot)
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
                                i = i + 1
                            endif
                        endif
                    endif
                endif
            endif
        endwhile

        if self.intervalCount() > 0 then
            self.drawSurfaceInto(sfH, sfD, RcConfig.RC_MAX_DIST, sfKind, sfLite)
            self.drawSurfaceInto(scH, scD, RcConfig.RC_MAX_DIST, scKind, scLite)
        endif
```

**Notes:**
- softBASIC has no `elseif` — the nested `if` ladder above is deliberate. Keep it flat-ish and commented per branch.
- **The riser `occlude(sTop, sBot)`**: a floor riser and a ceiling riser each occlude only their own band `[sTop, sBot]` (which is `[projectY(hi,d), projectY(lo,d)]`). This is the change from "clamp winBot / winTop": with intervals, occluding the riser band + the pending surface's own occlude (in `drawSurfaceInto`) together produce the correct visible set. A floor RISE: the riser band sits just below the old floor line; `drawSurfaceInto` for the *new* higher floor (flushed at the next span) will occlude from the new floor line down. A floor DROP (pit): the riser band is drawn (you see the pit lip) and occluded; the pit floor surface draws farther/lower. **Do not** re-add a `winBot`-style "clamp everything below" — that's what the interval list replaces.
- **Wall** clears the interval arrays directly (`array.clear` ×2) rather than `occlude(0, viewH)` — cheaper, unambiguous, and `intervalCount()` then returns 0 so the `while` guard exits.
- `hitWall` is gone — the post-loop flush is guarded by `intervalCount() > 0` (true iff no wall cleared the list and something's still visible).
- Remove the now-dead `drawSurface`, `winTop`, `winBot`, `newY`, `hitWall` locals from `renderFrame`'s `dim` block. Add `dim` for anything new the skeleton introduces that isn't already declared (`iDestX` is a field, not a local).

### Step 3: `drawSurfaceInto(hh, dNear, dFar, kind, lite)` — replaces `drawSurface`

```basic
function drawSurfaceInto(hh, dNear, dFar, kind, lite)
    dim ya
    dim yb
    dim yTop
    dim yBot
    ya = self.projectY(hh, dNear)
    yb = self.projectY(hh, dFar)
    if ya <= yb then
        yTop = ya
        yBot = yb
    else
        yTop = yb
        yBot = ya
    endif
    self.surfCountLast = self.surfCountLast + self.drawInto(yTop, yBot, kind, lite)
    self.occlude(yTop, yBot)
endfunction
```
Delete the old `drawSurface`.

### Step 4: Run tests → PASS

`npx vitest run raycasterDemoSmoke` — the rewritten portal + floor/pit tests pass; the other render tests (`renderFrame runs`, `shades a diagonal wall`, `drawActors clips`) stay green (the diagonal-wall test may need its `drawStrip`→`drawInto` call-shape expectation updated — the *grey* it checks is unchanged, just how many strips: with one full-height interval it's still one strip).

### Step 5: Sync + full verify

```bash
for d in raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6 raycaster-p7 raycaster-p8; do
  cp demo-src/raycaster/lib/RcRender.bas demo-src/$d/RcRender.bas
done
```
`npx vitest run raycasterDemoSmoke raycasterDemoProbes raycasterDemoTranspile raycasterDemoLibSync raycasterIntervals raycasterDiagWorld raycasterUpperWorld` → ALL PASS. The P8 probes (span/region checks, not render) must stay green untouched.

### Step 6: Commit — `feat: RcRender interval-list span walk (renderer rework)`

---

## Task 4: RcLights — `sampleAt(worldX, worldY)` bilinear

**Files:** `demo-src/raycaster/lib/RcLights.bas`; `tests/lib/Basic4WebGL/integration/raycasterLights.test.ts` (create); then `cp` to `raycaster-p5`…`raycaster-p8`.

### Step 1: Failing test

Create `raycasterLights.test.ts` — transpile `[RcConfig, RcWorld, RcCast, RcLights]`, build a real `RcLights` from an inline stm with two `light:` markers a few cells apart (so `staticArr` has a gradient). Assert:
- `L.sampleat(c + 0.5, r + 0.5)` ≈ `L.samplecell(c, r)` for a lit cell (within ~0.01).
- `L.sampleat(midX, midY)` between a bright cell and a dark cell is strictly between the two `sampleCell` values and ≈ their weighted average.
- `L.sampleat(-5, -5)` === the ambient value (OOB via `sampleCell`'s clamp).

Extend `RcLightsLike` with `sampleat(x: number, y: number): number`.

Run → FAIL.

### Step 2: Implement

In `RcLights.bas`, after `sampleCell`:
```basic
' Bilinear light at a world point (cell centres are at integer + 0.5).
function sampleAt(worldX, worldY)
    dim fx
    dim fy
    dim c0
    dim r0
    dim tx
    dim ty
    dim a
    dim b
    dim c
    dim e
    fx = worldX - 0.5
    fy = worldY - 0.5
    c0 = math.floor(fx)
    r0 = math.floor(fy)
    tx = fx - c0
    ty = fy - r0
    a = self.sampleCell(c0, r0)
    b = self.sampleCell(c0 + 1, r0)
    c = self.sampleCell(c0, r0 + 1)
    e = self.sampleCell(c0 + 1, r0 + 1)
    return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + e * tx * ty
endfunction
```
(local named `e` not `d` — `d` collides with nothing here but keep it distinct from the common distance var for readability.)

### Step 3: Run → PASS. Update header comment (the "RcRender samples sampleCell() per strip" line → note `sampleAt` for surfaces).

### Step 4: Sync + verify

```bash
for d in raycaster-p5 raycaster-p6 raycaster-p7 raycaster-p8; do
  cp demo-src/raycaster/lib/RcLights.bas demo-src/$d/RcLights.bas
done
```
`npx vitest run raycasterLights raycasterDemoSmoke raycasterDemoTranspile raycasterDemoLibSync` → PASS.

### Step 5: Commit — `feat: RcLights.sampleAt bilinear light (renderer rework)`

---

## Task 5: RcRender — use `sampleAt` for surfaces

**Files:** `demo-src/raycaster/lib/RcRender.bas`; `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`; then `cp` to `raycaster-p3`…`raycaster-p8`.

### Step 1: Failing test

Add a smoke test: `stubWorld` with a `samplecell` that varies by column distance (e.g. `lightat`/`samplecell` returning a value that steps hard between cells), render a flat floor, capture the floor-surface `drawRect` fills across adjacent screen columns, and assert consecutive floor strips' brightness differs by **less than a full inter-cell step** (i.e. the gradient is interpolated, not stair-stepped). Precise form: sample two columns whose rays hit the same floor cell-pair boundary and assert `|briteA - briteB| < hardStep * 0.6`.

Actually simpler and robust: give the stub `samplecell` returning `0.2` at even cols, `0.8` at odd cols; render; the floor strips (via `sampleAt` midpoint) should show intermediate values (~0.5) somewhere, never only {0.2, 0.8}. Assert the set of distinct floor-strip brightnesses has more than 2 values.

Run → FAIL (still `sampleCell`, only 2 values).

### Step 2: Implement

In `renderFrame`'s span loop, the `lite` computation currently uses `sampleCell` for everything. Split it:
- **Walls** (`RC_SPAN_WALL`): keep the existing `sampleCell` + x/y step-back + diagonal special-case block, unchanged.
- **Everything else** (steps, portal planes, and the pending-surface `sfLite`/`scLite` captured at each step): sample at the ray's world hit point —
```basic
lite = 1.0
if self.boundLights <> 0 then
    if kind = RcConfig.RC_SPAN_WALL then
        ' ... existing wall sampleCell block ...
    else
        lite = self.boundLights.sampleAt(self.camX + rayX * d, self.camY + rayY * d)
    endif
endif
```
- The pending horizontal surfaces are flushed with `sfLite` / `scLite` which were captured as `lite` at the step that started them — so they now carry the interpolated value too. Good. The *initial* `sfLite = self.boundLights.sampleCell(camCol, camRow)` seed can become `sampleAt(self.camX, self.camY)` for consistency.
- `drawSurfaceInto` samples once per flush with the passed `lite`; if you want the surface's *own* midpoint light rather than its starting segment's, pass `sampleAt(camX + rayX * dMid, camY + rayY * dMid)` where `dMid = (dNear + dFar) / 2` — **do this**: compute `dMid` inside `drawSurfaceInto` and re-sample there when `self.boundLights <> 0`, overriding the passed `lite`. That gives the smoothest floor. (Pass `boundLights` visibility via the field `self.boundLights`.)

Adjust `drawSurfaceInto`:
```basic
function drawSurfaceInto(hh, dNear, dFar, kind, lite)
    dim ya
    dim yb
    dim yTop
    dim yBot
    dim useLite
    dim dMid
    useLite = lite
    if self.boundLights <> 0 then
        dMid = (dNear + dFar) / 2
        useLite = self.boundLights.sampleAt(self.camX + self.fRayX * dMid, self.camY + self.fRayY * dMid)
    endif
    ...
    self.surfCountLast = self.surfCountLast + self.drawInto(yTop, yBot, kind, useLite)
    self.occlude(yTop, yBot)
endfunction
```
`drawSurfaceInto` doesn't have `rayX`/`rayY` in scope — stash them as fields `self.fRayX` / `self.fRayY` at the top of each column iteration (like `iDestX`). Add the `dim`s / fields.

### Step 3: Run → PASS (floor strips show >2 brightnesses; smoothness assertion holds).

### Step 4: Sync p3–p8, full `npx vitest run raycasterDemoSmoke raycasterDemoProbes raycasterDemoTranspile raycasterDemoLibSync raycasterIntervals raycasterLights` → PASS.

### Step 5: Commit — `feat: RcRender bilinear light for floor/ceiling surfaces (renderer rework)`

---

## Task 6: p8 re-verification + full pass

- [ ] `npx vitest run` → no new failures vs `main` (expect ~2040+ pass / 1 skip).
- [ ] `npx vite build` → clean.
- [ ] `npm run build:demo -- demo-src/raycaster-p8 RaycasterP8Upper` (deterministic — commit the JSON only if it changed).
- [ ] `npm run dev` + `npx cypress run --spec cypress/e2e/demos.cy.ts` → p1–p8 ERR-free (re-run once on a flake).
- [ ] **Manual (user drives):** seed `raycaster-p8-upper`, walk the three reported spots — floor lighting cascade (→ smooth gradient), walkway underside (→ solid platform, room visible under), ceiling hole (→ upper ceiling / room-through clean). Report back.
- [ ] If the torch or `light:` markers still look harsh with correct interpolation: tune `PortalScene.bas` `addPoint(...)` intensity/range and/or the `p8room.stm` `light:` positions, rebuild the export, re-verify. Geometry stays as-is.
- [ ] Commit any p8 tuning: `fix: tune raycaster-p8 lighting after the renderer rework`

---

## Task 7: Docs

- [ ] **`docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`** §5.1: the "one shrinking window" description → "As built (renderer rework 2026-09-02): a per-column list of visible screen-Y intervals; `occlude(top,bot)` splits an interval when an opaque band lands in its middle (walkway plank underside, railing from below); capped at `RC_MAX_INTERVALS`, thinnest dropped. A full wall clears the list and ends the column." §5.2: `drawSurface` → `drawSurfaceInto` (draws + occludes its own band). §6.1/§6.3: `RcLights.sampleAt` bilinear for surfaces; walls keep per-cell.
- [ ] **`docs/superpowers/specs/2026-09-02-raycaster-phase-8-upper-regions-design.md`** §4: remove the "render-fidelity A / single-window / no mid-band split" limitation notes; replace with a pointer to the renderer-rework spec.
- [ ] **`src/docs/guides/raycaster-library.md`**: "Phase 3 limits" — drop "the view through a hole is a close approximation … at glancing angles" and "an upper strip is lit by the room below it" stays (region-blind lighting is still a thing) but the floor-lighting is now smooth — reword. The "Upper regions" limits paragraph: drop the glancing-angle caveat.
- [ ] **`docs/roadmap.md`** item 28 + **`docs/language/library-roadmap.md`**: a "Renderer rework (2026-09-02)" clause — interval occlusion + bilinear surface light, what it fixed (p8 walkway/hole, floor lighting), what's still deferred (per-region lighting, portal light traversal, textures).
- [ ] `npx vitest run` (doc/manifest tests) → PASS.
- [ ] Commit — `docs: raycaster renderer rework — interval occlusion + bilinear light`

---

## Self-Review

**Spec coverage:**
- §1 interval list (`RC_MAX_INTERVALS`, drop-thinnest, `resetIntervals`/`occlude`/`drawInto`/`intervalCount`) → Tasks 1, 2. ✓
- §2 `renderFrame` rewrite (wall clears+stops, steps occlude riser band, surfaces `drawSurfaceInto`, portal spans fill+occlude, early-out on `intervalCount()=0`) → Task 3. ✓
- §2.1 `drawSurfaceInto` → Task 3 Step 3. ✓
- §3 `RcLights.sampleAt` bilinear + `RcRender` uses it for surfaces (`cam + rayDir*d`, midpoint for surfaces) → Tasks 4, 5. ✓
- §4 region-1 step correctness (region-agnostic rewrite consuming region-aware spans; region-1 walkway smoke test) → Task 3 (the rewrite is region-agnostic) + Task 3 Step 5 verify. ✓
- §5 tests (rewrite smoke assertions, `raycasterIntervals`, `sampleAt` test, probes untouched) → Tasks 2, 3, 4, 5. ✓
- §6 p8 re-verify + tune → Task 6. ✓
- §7 out of scope — nothing to implement. ✓

**Placeholder scan:** Task 5 Step 1's test form is given two ways ("simpler and robust: … more than 2 values") — the implementer picks the concrete one; not a gap. Task 3 Step 1 says "if trivial, tighten until it captures the invariant" — TDD guidance, acceptable. No `TODO`/`TBD`.

**Type/name consistency:** `resetIntervals`/`occlude`/`drawInto`/`intervalCount`/`dropThinnest`/`drawSurfaceInto` (softBASIC) → `resetintervals`/`occlude`/`drawinto`/`intervalcount` in TS stubs. Fields `intvTop`/`intvBot`/`occTop`/`occBot`/`iDestX`/`fRayX`/`fRayY`. `RC_MAX_INTERVALS = 6`. `sampleAt` (softBASIC) → `sampleat`. Used consistently across tasks + tests.

**Sync coverage:** every `.bas` edit has an explicit `cp` loop + `raycasterDemoLibSync` in its verify step. RcConfig p2–p8, RcRender p3–p8, RcLights p5–p8.

**Ordering:** RcConfig (constant) → RcRender primitives (Task 2, self-contained, not wired) → RcRender rewrite (Task 3, uses the primitives) → RcLights (Task 4, independent) → RcRender uses sampleAt (Task 5, needs both Task 3 and Task 4) → verify → docs. No forward references. Each task leaves the suite green.

**Risk:** Task 3 is the big one. If the interval walk is too fiddly, the spec's §8 fallback (single window except a two-interval special-case for portal/plank bands) is the retreat — but Tasks 1–2 (the primitives + their unit test) are independently valuable and low-risk, so even a partial landing is progress.
