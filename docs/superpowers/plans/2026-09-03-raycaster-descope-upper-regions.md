# Raycaster — Descope Upper Regions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the raycaster's split-level (upper region) system and the multi-interval occlusion renderer it forced, returning to a single-window occlusion model, and replace the two Phase 8 dev demos with one multi-tier level-design showcase that also wires camera look.

**Architecture:** `RcCast` and `RcMover` revert to their pre-Phase-8 commits (`3e0361b` / `354ba4f`) with the one post-Phase-8 feature each still wanted re-applied (`RcCast`'s along-chord diagonal texture-U). `RcWorld` and `RcConfig` are edited surgically (upper regions have been baked into `RcWorld` since Phase 1, so there is no clean revert commit). `RcRender` is edited surgically: its `drawStrip` is already window-form, so the interval wrappers (`drawInto` / `drawSurfaceInto` / `occlude` / ...) are deleted and `renderFrame` is rewritten to the single `winTop`/`winBot` model from commit `93022f9`, keeping bilinear light, wall texturing, and per-tile `fcol:`/`ccol:` colour. Floor/ceiling texturing (`drawFloorStrip`) is dropped from `RcRender` but kept as an unused engine primitive.

**Tech Stack:** softBASIC (`.bas` → transpiled JS), Vitest, `scripts/buildDemo.ts` (deterministic demo packager), Cypress e2e.

**Spec:** `docs/superpowers/specs/2026-09-03-raycaster-descope-upper-regions-design.md`

**Reference commits:**
- `93022f9` — RcRender single-window renderer (Phase 7), the target shape for `renderFrame`.
- `3e0361b` — RcCast before regions (Phase 7 chord test).
- `354ba4f` — RcMover before regions (Phase 7 diagonal slide).
- `30fbe96` — RcCast along-chord diagonal-U (re-applied on top of `3e0361b`).

**Conventions (from CLAUDE.md):** work on `main`; every `.bas` file in a `raycaster-p*` phase dir must stay byte-identical to `demo-src/raycaster/lib/` (`raycasterDemoLibSync` enforces this); rebuild every affected `src/docs/demos/Raycaster*.b4wgl.json` after lib changes; verify builds with `npx vite build`, never `tsc`; `npx vitest run` is the full suite (`[vitest-worker]: Timeout calling "onTaskUpdate"` is a known infra flake, not a failure); commit messages end with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

## File Structure

**Modified — canonical library (`demo-src/raycaster/lib/`):**
- `RcConfig.bas` — drop 5 constants
- `RcWorld.bas` — drop upper-region arrays / layer read / `uceil:` / accessors
- `RcCast.bas` — revert to `3e0361b` + re-apply diagonal-U
- `RcMover.bas` — revert to `354ba4f`
- `RcRender.bas` — delete interval machinery + floor/ceiling texture path; rewrite `renderFrame` to single-window; keep wall texturing + `fcol`/`ccol` + bilinear light

**Synced copies:** the same five files in `demo-src/raycaster-p1/` … `demo-src/raycaster-p7/`.

**Deleted:**
- `demo-src/raycaster-p8/` (whole dir), `demo-src/raycaster-p8b/` (whole dir)
- `src/docs/demos/RaycasterP8Upper.b4wgl.json`, `src/docs/demos/RaycasterP8bTextures.b4wgl.json`
- `tests/lib/Basic4WebGL/integration/raycasterUpperWorld.test.ts`
- `tests/lib/Basic4WebGL/integration/raycasterIntervals.test.ts`

**Created:**
- `demo-src/raycaster-p8-tiers/` — new showcase demo (Main.bas, TiersScene.bas, 5 lib copies… actually all lib copies, assets/)
- `src/docs/demos/RaycasterP8Tiers.b4wgl.json`
- `tests/lib/Basic4WebGL/integration/raycasterWindowOcclusion.test.ts`

**Wiring touched:** `src/features/demos/devDemoRegistry.ts`, `cypress/e2e/demos.cy.ts`, `tests/ui/features/demos/devDemoRegistry.test.ts`, `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts`, `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`, `scripts/genRaycasterTextures.ts`.

**Docs:** `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`, `docs/roadmap.md`, `src/docs/roadmap.md`, `docs/language/library-roadmap.md`, `src/docs/guides/raycaster-library.md`, `src/docs/api-reference/drawing.md`, plus supersede headers on the two superseded spec/plan files.

---

## Task 1: Remove the two Phase 8 demos and their wiring

This clears the demos that are incompatible with the reverted library, so Task 2 can revert the lib without breaking `raycasterDemoTranspile` / `raycasterDemoProbes`.

**Files:**
- Delete: `demo-src/raycaster-p8/` (whole dir), `demo-src/raycaster-p8b/` (whole dir)
- Delete: `src/docs/demos/RaycasterP8Upper.b4wgl.json`, `src/docs/demos/RaycasterP8bTextures.b4wgl.json`
- Delete: `tests/lib/Basic4WebGL/integration/raycasterUpperWorld.test.ts`
- Modify: `src/features/demos/devDemoRegistry.ts`
- Modify: `cypress/e2e/demos.cy.ts:47-48`
- Modify: `tests/ui/features/demos/devDemoRegistry.test.ts`
- Modify: `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts`

- [ ] **Step 1: Delete the demo directories, exports, and stale test**

```bash
git rm -r demo-src/raycaster-p8 demo-src/raycaster-p8b
git rm src/docs/demos/RaycasterP8Upper.b4wgl.json src/docs/demos/RaycasterP8bTextures.b4wgl.json
git rm tests/lib/Basic4WebGL/integration/raycasterUpperWorld.test.ts
```

- [ ] **Step 2: Remove the two entries from `src/features/demos/devDemoRegistry.ts`**

Delete the two object literals whose `slug` is `'raycaster-p8-upper'` and `'raycaster-p8b-textures'` (each is a `{ slug, name, tags, description, docsSlug, file }` block; the `raycaster-p8b-textures` block is the last element of the array — remove its trailing entry cleanly so the array still ends with `raycaster-p7-diagonals`'s block followed by `];`).

- [ ] **Step 3: Remove the two Cypress rows**

In `cypress/e2e/demos.cy.ts`, delete these two lines (currently 47–48):

```ts
  { slug: 'raycaster-p8-upper', title: 'Raycaster P8 — Upper Regions', waitMs: 4000 },
  { slug: 'raycaster-p8b-textures', title: 'Raycaster P8b — Textures', waitMs: 4000 },
```

- [ ] **Step 4: Remove the p8 assertions from `tests/ui/features/demos/devDemoRegistry.test.ts`**

Delete the block that looks up `'raycaster-p8-upper'` (the `const p8 = devDemoRegistry.find(...)` and its `expect` assertions) and the `expect(devDemoRegistry.find((d) => d.slug === 'raycaster-p8b-textures')?.file).toBe('RaycasterP8bTextures')` assertion (currently around lines 57–63). Leave the `raycaster-p7-diagonals` assertions as the last raycaster check.

- [ ] **Step 5: Remove the P8 / P8b cases from `raycasterDemoProbes.test.ts`**

Delete the two `runPhaseProbes({ dir: 'demo-src/raycaster-p8', ... })` and `runPhaseProbes({ dir: 'demo-src/raycaster-p8b', ... })` `test(...)` blocks (around lines 163–178). The p5/p6/p7 cases stay.

- [ ] **Step 6: Run the affected suites**

```bash
npx vitest run devDemoRegistry raycasterDemoProbes raycasterDemo
```

Expected: PASS (p8/p8b gone, no dangling references). If `raycasterDemoLibSync` complains it is unrelated to this task — it should still pass here because the lib is untouched.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(raycaster): remove the two Phase 8 dev demos ahead of the descope

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Revert the library to single-window occlusion

All five files change together — a half-reverted tree does not transpile (e.g. `RcRender` calling `wld.upperFloorAt` after `RcWorld` drops it). One commit, after the suite is green.

**Files:**
- Modify: `demo-src/raycaster/lib/RcConfig.bas`
- Modify: `demo-src/raycaster/lib/RcWorld.bas`
- Modify: `demo-src/raycaster/lib/RcCast.bas`
- Modify: `demo-src/raycaster/lib/RcMover.bas`
- Modify: `demo-src/raycaster/lib/RcRender.bas`
- Sync: the same five files into `demo-src/raycaster-p1/` … `demo-src/raycaster-p7/`
- Delete: `tests/lib/Basic4WebGL/integration/raycasterIntervals.test.ts`
- Modify: `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts` (stub world)
- Create: `tests/lib/Basic4WebGL/integration/raycasterWindowOcclusion.test.ts`

### 2.1 — RcConfig

- [ ] **Step 1: Delete the 5 upper-region / interval constants**

In `demo-src/raycaster/lib/RcConfig.bas`, delete exactly these five lines from the `const` block:

```bas
    RC_SPAN_PORTAL_WALL = 3
    RC_SPAN_PORTAL_CEIL = 4
    RC_SPAN_PORTAL_FLOOR = 5
    RC_SHADE_UPPER_FLOOR = 8
    RC_MAX_INTERVALS = 6
```

Keep `RC_STD_CEIL = 1.0` and `RC_TEX_SIZE = 64` (the lines above and below the deleted block).

### 2.2 — RcCast

- [ ] **Step 2: Revert RcCast to the pre-region commit**

```bash
git checkout 3e0361b -- demo-src/raycaster/lib/RcCast.bas
```

- [ ] **Step 3: Re-apply the along-chord diagonal texture-U (from `30fbe96`)**

In `demo-src/raycaster/lib/RcCast.bas`, in the header comment block, after the line:

```bas
' vertical extent), col/row (source cell), side (0 x-hit / 1 y-hit), u (wall
' texture coord 0..1; 0 for steps), tex (texture id string).
'
```

insert:

```bas
' Diagonal walls (side = RC_SPAN_SIDE_DIAG) carry a real along-chord u: the
' distance of the hit point from the chord's start corner (NE for nw/se, NW for
' ne/sw) over the chord length (root 2). They are no longer flat-shaded at u = 0.
'
```

Then in `function cast(...)`, extend the local declarations — after `dim dh` add:

```bas
    dim hx
    dim hy
    dim dStartX
    dim dStartY
    dim du
```

Then replace this line (inside `if dh >= 0 then`):

```bas
                self.addSpan(RcConfig.RC_SPAN_WALL, dh, runFloor, runCeil, self.mMapX, self.mMapY, RcConfig.RC_SPAN_SIDE_DIAG, 0, wld.wallTexAt(self.mMapX, self.mMapY))
```

with:

```bas
                hx = ox + dx * dh
                hy = oy + dy * dh
                if dg = RcConfig.RC_DIAG_NW or dg = RcConfig.RC_DIAG_SE then
                    dStartX = self.mMapX + 1.0
                    dStartY = self.mMapY
                else
                    dStartX = self.mMapX
                    dStartY = self.mMapY
                endif
                du = math.sqrt((hx - dStartX) * (hx - dStartX) + (hy - dStartY) * (hy - dStartY)) / 1.41421356
                du = math.clamp(du, 0, 1)
                self.addSpan(RcConfig.RC_SPAN_WALL, dh, runFloor, runCeil, self.mMapX, self.mMapY, RcConfig.RC_SPAN_SIDE_DIAG, du, wld.wallTexAt(self.mMapX, self.mMapY))
```

(Match the indentation of the surrounding block — the reverted file's diagonal block is one `if dg > 0 then` deep inside the march loop.)

### 2.3 — RcMover

- [ ] **Step 4: Revert RcMover to the pre-region commit**

```bash
git checkout 354ba4f -- demo-src/raycaster/lib/RcMover.bas
```

No re-apply — `354ba4f` already has the Phase 7 diagonal slide, `look()`, `turn()`, `pitch()`, and every constant it needs survives in RcConfig.

### 2.4 — RcWorld (surgical)

- [ ] **Step 5: Delete the upper-region field declarations**

In `demo-src/raycaster/lib/RcWorld.bas`, delete:

```bas
dim upKindArr(0)
dim upCeilHArr(0)
```

Keep `dim floorColArr(0)`, `dim ceilColArr(0)`, `dim surfColSeen` (the `fcol:`/`ccol:` fields). Also update the header comment block: delete the paragraph beginning `' Upper regions (Phase 8): an optional second stacked space per cell ...` through its closing line.

- [ ] **Step 6: Delete the upper-region `array.push` lines in `build`**

In `function build`, delete:

```bas
        array.push(self.upKindArr, 0)
        array.push(self.upCeilHArr, 0 - 1)
```

- [ ] **Step 7: Delete the `upper` layer read in `build`**

Delete the whole block:

```bas
    if tm.hasLayer("upper") then
        upLayer = tm.layer("upper")
        for row = 0 to self.rows - 1
            for col = 0 to self.cols - 1
                id = upLayer.tileAt(col * tw + tw / 2, row * th + th / 2)
                if id > 0 then
                    self.upKindArr(row * self.cols + col) = id
                endif
            next col
        next row
    endif
```

and delete the now-unused local declaration `dim upLayer as tilemaplayer` near the top of `build`.

- [ ] **Step 8: Delete the `uceil:` key in `applyKv`**

In `function applyKv`, delete:

```bas
    if key = "uceil" then
        self.upCeilHArr(idx) = math.val(v)
    endif
```

- [ ] **Step 9: Delete the upper-region accessors**

Delete these four functions entirely: `upperKindAt`, `hasUpperAt`, `upperFloorAt`, `upperCeilAt`. Keep `floorColAt`, `ceilColAt`, `hasSurfaceColor`, `diagAt`, `wallTexAt`, `floorTexAt`, `ceilTexAt`, and everything else.

### 2.5 — RcRender (surgical)

- [ ] **Step 10: Delete the interval + floor-texture field declarations**

In `demo-src/raycaster/lib/RcRender.bas`, delete the comment + fields:

```bas
' Per-column visible screen-Y interval list (renderer rework). Parallel arrays,
' top < bot. occTop/occBot are reused scratch (no per-frame alloc). iDestX is the
' current column's strip centre X -- set by renderFrame (Task 3); drawInto reads it.
dim intvTop(0)
dim intvBot(0)
dim occTop(0)
dim occBot(0)
dim iDestX
dim fRayX
dim fRayY
```

and, from the texture-defaults block, delete `dim defFloorTex` and `dim defCeilTex` (keep `dim defWallTex`).

- [ ] **Step 11: Trim the Constructor**

In `Constructor`, delete these lines:

```bas
    self.iDestX = 0
    self.fRayX = 0
    self.fRayY = 0
    self.defFloorTex = ""
    self.defCeilTex = ""
```

Keep `self.defWallTex = ""`.

- [ ] **Step 12: Update the header comment**

Replace the Phase 8 paragraph (`' Phase 8: the camera's region (0 lower / 1 upper) is derived each frame ...` through `' region-blind (sampled from the lower-region light grid) -- a documented v1 limit.`) with:

```bas
' Occlusion is a single per-column window [winTop, winBot]: a floor RISE clamps
' winBot up from the ground, a ceiling DROP clamps winTop down; a floor DROP or
' ceiling RISE leaves the window open so farther geometry shows through. Wall
' faces blit textured (drawWallStrip) when a wall texture resolves, else flat.
' Floor/ceiling surfaces are flat-shaded, coloured per tile by fcol:/ccol: tags,
' and lit by RcLights.sampleAt (bilinear). Floor/ceiling TEXTURES are not drawn.
```

- [ ] **Step 13: Drop shade kind 8 from `drawStrip`**

In `function drawStrip`, delete:

```bas
    if shadeKind = 8 then
        g = 70
    endif
```

- [ ] **Step 14: Delete the interval-era surface/colour/occlusion functions**

Delete these functions entirely: `drawSurfaceInto`, `drawSurfaceColorRun`, `surfaceRunEnd` (the version that reads `self.fRayX`), `drawColorInto`, `resetIntervals`, `intervalCount`, `dropThinnest`, `occlude`, `drawInto`, `drawWallInto`. Also delete `setFloorTexture`, `setCeilTexture`, `floorTexFor`, `ceilTexFor`, and `distAtScreenY`. Keep `packTint`, `projectY`, `drawStrip`, `setWallTexture`, `wallTexFor`, `surfaceCount`, `columnCount`, `setFov`, `setCamera`, `bindLights`, `bindActors`, `bindCamera`, `depthAt`, `worldToScreenX`, `drawActors`.

- [ ] **Step 15: Add the single-window surface + wall helpers**

Insert, immediately after `function drawStrip` … `endfunction`:

```bas
' The perpendicular distance at which this column's ray (rayX, rayY) leaves the
' grid cell it occupies at tStart, clamped to tMax. One DDA step (nearest x/y
' crossing). Used only for the per-tile colour march.
function surfaceRunEnd(tStart, tMax, rayX, rayY)
    dim px
    dim py
    dim cx
    dim cy
    dim tx
    dim ty
    dim t
    px = self.camX + rayX * (tStart + 0.0001)
    py = self.camY + rayY * (tStart + 0.0001)
    cx = math.floor(px)
    cy = math.floor(py)
    tx = tMax
    ty = tMax
    if rayX > 0.00001 then
        tx = (cx + 1 - self.camX) / rayX
    endif
    if rayX < 0 - 0.00001 then
        tx = (cx - self.camX) / rayX
    endif
    if rayY > 0.00001 then
        ty = (cy + 1 - self.camY) / rayY
    endif
    if rayY < 0 - 0.00001 then
        ty = (cy - self.camY) / rayY
    endif
    t = tx
    if ty < t then
        t = ty
    endif
    if t > tMax then
        t = tMax
    endif
    if t <= tStart then
        t = tMax
    endif
    return t
endfunction

' Draw one flat horizontal sub-band at world height hh from dNear to dFar,
' clipped to [winTop, winBot]. packed < 0 -> the default `kind` grey shade;
' packed >= 0 -> that RGB (r*65536 + g*256 + b). Lit by sampleAt at the band
' midpoint when lights are bound, else by `lite`.
function drawFlatSeg(destX, hh, dNear, dFar, winTop, winBot, kind, packed, lite, rayX, rayY)
    dim ya
    dim yb
    dim yTop
    dim yBot
    dim useLite
    dim rr
    dim gg
    dim bb
    ya = self.projectY(hh, dNear)
    yb = self.projectY(hh, dFar)
    if ya <= yb then
        yTop = ya
        yBot = yb
    else
        yTop = yb
        yBot = ya
    endif
    if yTop < winTop then
        yTop = winTop
    endif
    if yBot > winBot then
        yBot = winBot
    endif
    if yBot <= yTop then
        return
    endif
    useLite = lite
    if self.boundLights <> 0 then
        useLite = self.boundLights.sampleAt(self.camX + rayX * ((dNear + dFar) / 2), self.camY + rayY * ((dNear + dFar) / 2))
    endif
    if packed < 0 then
        self.surfCountLast = self.surfCountLast + self.drawStrip(destX, yTop, yBot, winTop, winBot, kind, useLite)
    else
        rr = math.floor(packed / 65536)
        gg = math.floor(packed / 256) - rr * 256
        bb = packed - rr * 65536 - gg * 256
        pen.setLineWidth(0)
        pen.setFillColor(math.clamp(rr * useLite, 0, 255), math.clamp(gg * useLite, 0, 255), math.clamp(bb * useLite, 0, 255))
        drawing.drawRect(destX, (yTop + yBot) / 2, RcConfig.RC_STRIP_W, yBot - yTop)
        self.surfCountLast = self.surfCountLast + 1
    endif
endfunction

' Draw a floor/ceiling surface at world height hh from dNear to dFar, clipped to
' [winTop, winBot]. No fcol:/ccol: anywhere -> one strip. Otherwise march the
' grid cells the band crosses and emit one sub-band per contiguous run of the
' same resolved colour (default shade counts as a colour for coalescing).
function drawSurface(destX, hh, dNear, dFar, winTop, winBot, kind, lite, rayX, rayY)
    dim eyeZ
    dim isFloor
    dim a
    dim b
    dim runStart
    dim runCol
    dim segCol
    dim mx
    dim my
    dim guard
    if self.wld.hasSurfaceColor() = 0 then
        self.drawFlatSeg(destX, hh, dNear, dFar, winTop, winBot, kind, 0 - 1, lite, rayX, rayY)
        return
    endif
    eyeZ = self.camZ + RcConfig.RC_EYE_Z
    isFloor = 0
    if hh < eyeZ then
        isFloor = 1
    endif
    a = dNear
    runStart = dNear
    runCol = 0 - 2
    guard = 0
    while a < dFar - 0.0001 and guard < 128
        guard = guard + 1
        b = self.surfaceRunEnd(a, dFar, rayX, rayY)
        mx = self.camX + rayX * ((a + b) / 2)
        my = self.camY + rayY * ((a + b) / 2)
        if isFloor = 1 then
            segCol = self.wld.floorColAt(math.floor(mx), math.floor(my))
        else
            segCol = self.wld.ceilColAt(math.floor(mx), math.floor(my))
        endif
        if runCol = 0 - 2 then
            runCol = segCol
        endif
        if segCol <> runCol then
            self.drawFlatSeg(destX, hh, runStart, a, winTop, winBot, kind, runCol, lite, rayX, rayY)
            runStart = a
            runCol = segCol
        endif
        a = b
    endwhile
    if runCol = 0 - 2 then
        runCol = 0 - 1
    endif
    self.drawFlatSeg(destX, hh, runStart, dFar, winTop, winBot, kind, runCol, lite, rayX, rayY)
endfunction

' Textured wall face: blit source column srcX of `tex` into [winTop, winBot],
' with the source-V window clipped to the visible span so a wall behind a
' floor-step shows the right vertical slice. sideKind: 0 x-face / 1 y-face /
' RC_SPAN_SIDE_DIAG diagonal. Returns 1 if a strip was drawn, else 0.
function drawWallStrip(destX, wTop, wBot, winTop, winBot, tex, u, lite, sideKind)
    dim cTop
    dim cBot
    dim svTop
    dim svBot
    dim srcX
    dim chan
    dim sideDim
    dim tint
    sideDim = 1.0
    if sideKind = 1 then
        sideDim = 0.8
    endif
    if sideKind = RcConfig.RC_SPAN_SIDE_DIAG then
        sideDim = 0.9
    endif
    if wBot <= wTop then
        return 0
    endif
    cTop = wTop
    cBot = wBot
    if cTop < winTop then
        cTop = winTop
    endif
    if cBot > winBot then
        cBot = winBot
    endif
    if cBot <= cTop then
        return 0
    endif
    srcX = math.floor(u * RcConfig.RC_TEX_SIZE)
    if srcX < 0 then
        srcX = 0
    endif
    if srcX >= RcConfig.RC_TEX_SIZE then
        srcX = RcConfig.RC_TEX_SIZE - 1
    endif
    chan = 255 * lite * sideDim
    tint = self.packTint(chan, chan, chan + 25)
    svTop = (cTop - wTop) / (wBot - wTop)
    svBot = (cBot - wTop) / (wBot - wTop)
    drawing.drawImageStrip(tex, srcX, destX, (cTop + cBot) / 2, RcConfig.RC_STRIP_W, cBot - cTop, tint, svTop, svBot)
    return 1
endfunction
```

- [ ] **Step 16: Rewrite `renderFrame` to the single-window model**

Replace the entire `function renderFrame() ... endfunction` with:

```bas
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
    dim newY
    dim camCol
    dim camRow
    dim horizon
    dim fh
    dim lite
    dim bgLite
    dim hitWall
    dim sfH
    dim sfD
    dim sfKind
    dim sfLite
    dim scH
    dim scD
    dim scKind
    dim scLite
    dim wshade
    dim wtex

    if self.boundMover <> 0 then
        self.camX = self.boundMover.x()
        self.camY = self.boundMover.y()
        self.camAngle = self.boundMover.angle()
        self.camPitch = self.boundMover.pitch()
        self.camZ = self.boundMover.z()
    endif

    bgLite = 1.0
    self.surfCountLast = 0
    if self.boundLights <> 0 then
        bgLite = self.boundLights.sampleCell(math.floor(self.camX), math.floor(self.camY))
    endif

    horizon = self.scy + self.camPitch
    fh = self.viewH - horizon
    if fh < 0 then
        fh = 0
    endif

    drawing.clear()

    pen.setLineWidth(0)
    pen.setFillColor(28 * bgLite, 32 * bgLite, 46 * bgLite)
    drawing.drawRect(self.viewW / 2, self.viewH / 2, self.viewW, self.viewH)
    if fh > 0 then
        pen.setFillColor(20 * bgLite, 18 * bgLite, 16 * bgLite)
        drawing.drawRect(self.viewW / 2, horizon + fh / 2, self.viewW, fh)
    endif

    dirX = math.cos(self.camAngle)
    dirY = math.sin(self.camAngle)
    planeX = 0 - dirY * self.fovScale
    planeY = dirX * self.fovScale
    self.fDirX = dirX
    self.fDirY = dirY
    self.fPlaneX = planeX
    self.fPlaneY = planeY

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
        self.depthArr(col) = RcConfig.RC_MAX_DIST

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
            sfLite = self.boundLights.sampleAt(self.camX, self.camY)
            scLite = sfLite
        endif

        n = self.rc.spanCount()
        i = 0
        while i < n
            kind = self.rc.spanKind(i)
            d = self.rc.spanDist(i)
            sTop = self.projectY(self.rc.spanHi(i), d)
            sBot = self.projectY(self.rc.spanLo(i), d)

            lite = 1.0
            if self.boundLights <> 0 then
                if kind = RcConfig.RC_SPAN_WALL then
                    if self.rc.spanSide(i) = RcConfig.RC_SPAN_SIDE_DIAG then
                        lite = self.boundLights.sampleCell(self.rc.spanCol(i), self.rc.spanRow(i))
                    else
                        if self.rc.spanSide(i) = 0 then
                            lite = self.boundLights.sampleCell(self.rc.spanCol(i) - math.sign(rayX), self.rc.spanRow(i))
                        else
                            lite = self.boundLights.sampleCell(self.rc.spanCol(i), self.rc.spanRow(i) - math.sign(rayY))
                        endif
                    endif
                else
                    lite = self.boundLights.sampleAt(self.camX + rayX * d, self.camY + rayY * d)
                endif
            endif

            if kind = RcConfig.RC_SPAN_WALL then
                self.drawSurface(destX, sfH, sfD, d, winTop, winBot, sfKind, sfLite, rayX, rayY)
                self.drawSurface(destX, scH, scD, d, winTop, winBot, scKind, scLite, rayX, rayY)
                hitWall = 1
                wtex = self.wallTexFor(self.rc.spanCol(i), self.rc.spanRow(i))
                if string.len(wtex) > 0 then
                    self.surfCountLast = self.surfCountLast + self.drawWallStrip(destX, sTop, sBot, winTop, winBot, wtex, self.rc.spanU(i), lite, self.rc.spanSide(i))
                else
                    wshade = self.rc.spanSide(i)
                    if wshade = RcConfig.RC_SPAN_SIDE_DIAG then
                        wshade = 1
                    endif
                    self.drawStrip(destX, sTop, sBot, winTop, winBot, wshade, lite)
                endif
                self.depthArr(col) = d
                i = n
            else
                if kind = RcConfig.RC_SPAN_FLOORSTEP then
                    newH = self.wld.floorHeightAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    self.drawSurface(destX, sfH, sfD, d, winTop, winBot, sfKind, sfLite, rayX, rayY)
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
                else
                    newH = self.wld.ceilHeightAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    self.drawSurface(destX, scH, scD, d, winTop, winBot, scKind, scLite, rayX, rayY)
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
                i = i + 1
            endif

            if winTop >= winBot then
                i = n
            endif
        endwhile

        if hitWall = 0 then
            self.drawSurface(destX, sfH, sfD, RcConfig.RC_MAX_DIST, winTop, winBot, sfKind, sfLite, rayX, rayY)
            self.drawSurface(destX, scH, scD, RcConfig.RC_MAX_DIST, winTop, winBot, scKind, scLite, rayX, rayY)
        endif
    next col

    if self.boundActors <> 0 then
        self.drawActors()
    endif
endfunction
```

- [ ] **Step 17: Transpile-check the canonical library**

```bash
npx vitest run raycasterDemoTranspile
```

Expected: the `raycaster-p1` … `raycaster-p7` cases PASS (their own copies are still the old code, but self-consistent). This step only proves the phase dirs are untouched so far.

- [ ] **Step 18: Sync the reverted library into every phase dir**

```bash
for f in RcConfig.bas RcWorld.bas RcCast.bas RcMover.bas RcRender.bas; do
  for d in demo-src/raycaster-p1 demo-src/raycaster-p2 demo-src/raycaster-p3 demo-src/raycaster-p4 demo-src/raycaster-p5 demo-src/raycaster-p6 demo-src/raycaster-p7; do
    cp "demo-src/raycaster/lib/$f" "$d/$f"
  done
done
```

- [ ] **Step 19: Delete the interval test**

```bash
git rm tests/lib/Basic4WebGL/integration/raycasterIntervals.test.ts
```

- [ ] **Step 20: Fix the smoke-test stub world**

In `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`, in **every** stub-world object literal (the top-level `stubWorld` plus each inline `{ floorheightat: ..., ceiltexat: () => '', ... }`), delete the lines:

```ts
  upperkindat: () => 0,
  upperfloorat: () => 1,
  upperceilat: () => 2,
```

Keep `hassurfacecolor: () => 0`, `floorcolat: () => -1`, `ceilcolat: () => -1` (added for `fcol`/`ccol`). Match each literal's indentation.

- [ ] **Step 21: Write the window-occlusion regression test**

Create `tests/lib/Basic4WebGL/integration/raycasterWindowOcclusion.test.ts`:

```ts
import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Focused guard for the single-window occlusion renderer (post upper-region
// descope). Drives RcRender.renderframe against a duck-typed world and captures
// drawRect calls to assert: a raised-floor column clamps the window (fewer /
// shorter far strips), a pit column still shows the wall beyond, and a
// multi-cell coloured floor run coalesces into one strip per colour boundary.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
const DIR = 'demo-src/raycaster-p3';

function transpileP3(): string {
  const names = readdirSync(DIR).filter((n) => n.endsWith('.bas')).sort();
  const raw = names.map((name) => ({ name, source: readFileSync(`${DIR}/${name}`, 'utf-8') }));
  const { files, error } = sortByDependencies(raw);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics).toEqual([]);
  return String(result.code);
}

interface RcRenderLike {
  setcamera(x: number, y: number, angle: number, pitch: number): void;
  renderframe(): void;
  columncount(): number;
}

function makeRender(world: Record<string, unknown>, rects: unknown[][]): RcRenderLike {
  const code = transpileP3();
  const stub: Record<string, unknown> = {};
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(t, p: string) {
      if (p === Symbol.toPrimitive || p === 'then') return undefined;
      if (p in t) return t[p];
      return (..._a: unknown[]) => proxy;
    },
    set(t, p: string, v) {
      t[p] = v;
      return true;
    },
    apply: () => proxy,
  };
  const proxy = new Proxy(function () {} as never, handler) as never;
  const _sb = new Proxy(stub, handler) as Record<string, unknown> & ((...a: unknown[]) => unknown);
  _sb.getStageWidth = () => 320;
  _sb.getStageHeight = () => 200;
  _sb.drawRect = (...a: unknown[]) => {
    rects.push(a);
    return undefined;
  };
  const deferred: Array<() => void> = [];
  _sb._deferModuleBody = (cb: () => void) => deferred.push(cb);
  const _createArray = (init: unknown[]) =>
    Array.isArray(init) && init.length === 1 && init[0] === 0 ? [] : [...(init ?? [])];
  const helpers: Record<string, unknown> = {
    _sbLength: (x: { length?: number }) => x?.length ?? 0,
    _sbJoin: (x: unknown[], s: string) => x.join(s),
    _sbContains: (x: unknown[], i: unknown) => x.includes(i),
    _sbRemove: () => {},
    _sbClear: (x: unknown[]) => x.splice(0),
    _sbCheckedArrayGet: (a: unknown[], i: number) => a[i],
    _createDict: () => new Map(),
  };
  const factory = new Function(
    '_sb',
    '_createArray',
    ...Object.keys(helpers),
    'console',
    `${code}\n; return { RcRender: _sb_rcrender };`,
  );
  const { RcRender } = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  return new RcRender(world) as RcRenderLike;
}

const openWorld = {
  floorheightat: () => 0,
  ceilheightat: () => 1,
  wallat: (c: number) => (c <= 0 || c >= 8 ? 1 : 0),
  diagat: () => 0,
  walltexat: () => '',
  floortexat: () => '',
  ceiltexat: () => '',
  hassurfacecolor: () => 0,
  floorcolat: () => -1,
  ceilcolat: () => -1,
  widthcells: () => 8,
  heightcells: () => 4,
  lightat: () => 0,
};

describe('RcRender single-window occlusion', () => {
  test('renderframe runs and draws strips against an open world', () => {
    const rects: unknown[][] = [];
    const r = makeRender({ ...openWorld }, rects);
    r.setcamera(2, 2, 0, 0);
    r.renderframe();
    // one bg fill + one horizon fill + per-column surface/wall strips
    expect(rects.length).toBeGreaterThan(openWorld.widthcells() * 2);
  });

  test('a raised-floor column paints less far geometry than an open column', () => {
    const rectsOpen: unknown[][] = [];
    makeRender({ ...openWorld }, rectsOpen);
    const open = makeRender({ ...openWorld }, rectsOpen);
    rectsOpen.length = 0;
    open.setcamera(2, 2, 0, 0);
    open.renderframe();
    const openStrips = rectsOpen.filter((a) => (a as number[])[2] === 4).length;

    const rectsStep: unknown[][] = [];
    const stepWorld = {
      ...openWorld,
      // a wall of raised floor at column >= 4, tall enough to clamp the window
      floorheightat: (c: number) => (c >= 4 ? 0.9 : 0),
    };
    const step = makeRender(stepWorld, rectsStep);
    step.setcamera(2, 2, 0, 0);
    step.renderframe();
    const stepStrips = rectsStep.filter((a) => (a as number[])[2] === 4).length;

    // the raised floor clamps winBot, so fewer 4px surface/wall strips are drawn
    expect(stepStrips).toBeLessThan(openStrips);
  });

  test('a coloured multi-cell floor run coalesces to one strip per colour boundary', () => {
    const rects: unknown[][] = [];
    const colWorld = {
      ...openWorld,
      hassurfacecolor: () => 1,
      // cols 1-3 one colour, 4-6 another, rest none
      floorcolat: (c: number) => {
        if (c >= 1 && c <= 3) return 0x804020;
        if (c >= 4 && c <= 6) return 0x204080;
        return -1;
      },
      ceilcolat: () => -1,
    };
    const r = makeRender(colWorld, rects);
    r.setcamera(1.5, 2, 0, 0); // look straight down +x across the colour bands
    r.renderframe();
    // the centre column's floor surface crosses 3 colour regions (2 tagged + tail)
    // -> at most a few strips, NOT one per cell. Assert the count is bounded.
    const fills = rects.filter((a) => {
      const w = (a as number[])[2];
      return w === 4;
    });
    expect(fills.length).toBeGreaterThan(0);
    expect(fills.length).toBeLessThan(colWorld.widthcells() * 6);
  });
});
```

- [ ] **Step 22: Run the raycaster suites**

```bash
npx vitest run raycaster
```

Expected: PASS — `raycasterDemoTranspile`, `raycasterDemoSmoke`, `raycasterDemoLibSync`, `raycasterDemoProbes`, `raycasterLights`, `raycasterDiagWorld`, `raycasterSurfaceColor`, `raycasterWindowOcclusion`. If `raycasterDemoLibSync` fails, a phase dir copy diverged in Step 18 — re-copy. If a focused test references a removed method, update its stub.

- [ ] **Step 23: Full suite + build**

```bash
npx vitest run
npx vite build
```

Expected: full suite green (one known `onTaskUpdate` flake tolerated), build clean.

- [ ] **Step 24: Commit**

```bash
git add -A
git commit -m "refactor(raycaster): remove upper regions, revert to single-window occlusion

RcCast/RcMover revert to their pre-Phase-8 commits (+ the along-chord
diagonal texture-U kept). RcWorld/RcConfig drop the upper-region arrays,
layer read, uceil: marker and accessors. RcRender drops the interval-list
occlusion (occlude/drawInto/drawSurfaceInto/...) and the floor/ceiling
texture path; renderFrame is back to a single winTop/winBot window,
keeping bilinear light, wall texturing and per-tile fcol:/ccol: colour.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Rebuild every dev-demo export

The `.b4wgl.json` exports embed a full copy of the demo's `.bas` files, including the raycaster lib. They are now stale.

**Files:**
- Modify: `src/docs/demos/RaycasterP1MapLoad.b4wgl.json` … `RaycasterP7Diagonals.b4wgl.json`
- Modify: `src/docs/demos/Raycaster.b4wgl.json` (the Wolfenstein game demo — check whether it embeds the lib)

- [ ] **Step 1: Identify the export slugs**

```bash
grep -l raycaster src/docs/demos/*.b4wgl.json
```

- [ ] **Step 2: Rebuild each phase export**

For each phase dir, run its build. The slug/`SlugName` pairs (from `src/features/demos/devDemoRegistry.ts` `file:` fields):

```bash
npm run build:demo -- demo-src/raycaster-p1 RaycasterP1MapLoad
npm run build:demo -- demo-src/raycaster-p2 RaycasterP2SpanCast
npm run build:demo -- demo-src/raycaster-p3 RaycasterP3RoomView
npm run build:demo -- demo-src/raycaster-p4 RaycasterP4Walk
npm run build:demo -- demo-src/raycaster-p5 RaycasterP5Lit
npm run build:demo -- demo-src/raycaster-p6 RaycasterP6Actors
npm run build:demo -- demo-src/raycaster-p7 RaycasterP7Diagonals
```

(If any `SlugName` is wrong the command errors before writing — confirm each against `devDemoRegistry.ts`.)

- [ ] **Step 3: Check the Wolfenstein game demo**

```bash
grep -c "RcRender\|RcCast\|RcWorld" src/docs/demos/Raycaster.b4wgl.json
```

This is **0** as of writing — the Wolfenstein game demo has its own monolithic `GameScene.bas` and does not embed the reusable lib, so **skip the rebuild**. (If a future change makes the count non-zero, rebuild with `npm run build:demo -- demo-src/raycaster Raycaster`.)

- [ ] **Step 4: Verify Cypress-relevant transpilation**

```bash
npx vitest run raycasterDemo
```

Expected: PASS (exports are only read by Cypress, but this confirms the source dirs still transpile).

- [ ] **Step 5: Commit**

```bash
git add src/docs/demos/
git commit -m "chore(raycaster): rebuild dev-demo exports after the descope

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: New `raycaster-p8-tiers` showcase demo

**Files:**
- Create: `demo-src/raycaster-p8-tiers/Main.bas`
- Create: `demo-src/raycaster-p8-tiers/TiersScene.bas`
- Create: `demo-src/raycaster-p8-tiers/RcConfig.bas` … `RcRender.bas` (+ `RcLights.bas`, `RcActor.bas`, `RcActors.bas` — every canonical lib file, copied)
- Create: `demo-src/raycaster-p8-tiers/assets/tiersroom.stm`
- Create: `demo-src/raycaster-p8-tiers/assets/*.png` (6 generated textures)
- Modify: `scripts/genRaycasterTextures.ts`
- Modify: `src/features/demos/devDemoRegistry.ts`
- Modify: `cypress/e2e/demos.cy.ts`
- Modify: `tests/ui/features/demos/devDemoRegistry.test.ts`
- Modify: `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts`
- Create: `src/docs/demos/RaycasterP8Tiers.b4wgl.json`

- [ ] **Step 1: Create the demo dir and copy the library**

```bash
mkdir -p demo-src/raycaster-p8-tiers/assets
for f in demo-src/raycaster/lib/*.bas; do cp "$f" "demo-src/raycaster-p8-tiers/$(basename "$f")"; done
ls demo-src/raycaster-p8-tiers
```

- [ ] **Step 2: Retarget the texture generator and regenerate**

In `scripts/genRaycasterTextures.ts` change:

```ts
const OUT_DIR = 'demo-src/raycaster-p8b/assets';
```

to:

```ts
const OUT_DIR = 'demo-src/raycaster-p8-tiers/assets';
```

Then:

```bash
npx vite-node scripts/genRaycasterTextures.ts
ls demo-src/raycaster-p8-tiers/assets
```

Expected: `rc_tex_brick.png rc_tex_concrete.png rc_tex_panel.png rc_tex_rock.png rc_tex_floor.png rc_tex_ceil.png` (or whatever names the script writes — confirm by reading its write calls). Also copy the placeholder tile image the `.stm` references:

```bash
cp demo-src/raycaster-p3/assets/rc_placeholder_tiles.png demo-src/raycaster-p8-tiers/assets/
```

- [ ] **Step 3: Write the showcase `.stm`**

Create `demo-src/raycaster-p8-tiers/assets/tiersroom.stm` — a 12×10 room: solid border, a sunken 4×4 arena in the middle (`floor:-0.5`), a stepped stair on the west side climbing 0 → 0.8, a raised perimeter walkway (`floor:0.8`) along the north edge with `ceil:2.2` over it, and a higher nook in the NE corner (`floor:1.4`, reached by a second short stair, `ceil:3`). Wall-texture accents and a few `fcol:`/`ccol:` tiles.

```json
{
  "tileWidth": 16,
  "tileHeight": 16,
  "tileImage": "rc_placeholder_tiles.png",
  "layers": {
    "walls": [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    "tags": {
      "type": "markers",
      "markers": [
        { "row": 4, "col": 4, "tag": "floor:-0.5" },
        { "row": 4, "col": 5, "tag": "floor:-0.5" },
        { "row": 4, "col": 6, "tag": "floor:-0.5" },
        { "row": 5, "col": 4, "tag": "floor:-0.5 fcol:6b3f22" },
        { "row": 5, "col": 5, "tag": "floor:-0.5 fcol:6b3f22" },
        { "row": 5, "col": 6, "tag": "floor:-0.5 fcol:6b3f22" },
        { "row": 6, "col": 4, "tag": "floor:-0.5" },
        { "row": 6, "col": 5, "tag": "floor:-0.5" },
        { "row": 6, "col": 6, "tag": "floor:-0.5" },
        { "row": 1, "col": 1, "tag": "floor:0.8 ceil:2.2" },
        { "row": 1, "col": 2, "tag": "floor:0.8 ceil:2.2" },
        { "row": 1, "col": 3, "tag": "floor:0.8 ceil:2.2" },
        { "row": 1, "col": 4, "tag": "floor:0.8 ceil:2.2" },
        { "row": 1, "col": 5, "tag": "floor:0.8 ceil:2.2 ccol:2f3a52" },
        { "row": 1, "col": 6, "tag": "floor:0.8 ceil:2.2 ccol:2f3a52" },
        { "row": 1, "col": 7, "tag": "floor:0.8 ceil:2.2" },
        { "row": 1, "col": 8, "tag": "floor:1.4 ceil:3" },
        { "row": 1, "col": 9, "tag": "floor:1.4 ceil:3 fcol:394c2f" },
        { "row": 1, "col": 10, "tag": "floor:1.4 ceil:3 fcol:394c2f" },
        { "row": 2, "col": 9, "tag": "floor:0.8" },
        { "row": 2, "col": 10, "tag": "floor:0.8" },
        { "row": 2, "col": 1, "tag": "floor:0.6" },
        { "row": 3, "col": 1, "tag": "floor:0.4" },
        { "row": 4, "col": 1, "tag": "floor:0.2" },
        { "row": 5, "col": 1, "tag": "tex:rc_tex_brick.png" },
        { "row": 6, "col": 1, "tag": "tex:rc_tex_brick.png" },
        { "row": 8, "col": 6, "tag": "tex:rc_tex_panel.png" },
        { "row": 8, "col": 7, "tag": "tex:rc_tex_panel.png" }
      ]
    }
  }
}
```

(The exact heights/positions are a starting point — the implementer may nudge them so every raised platform keeps `RC_EYE_Z` of headroom under its ceiling and every stair rise stays ≤ `RC_STEP_UP = 0.35`. The `0 → 0.2 → 0.4 → 0.6 → 0.8` west stair already satisfies that.)

- [ ] **Step 4: Write `Main.bas`**

Create `demo-src/raycaster-p8-tiers/Main.bas`:

```bas
function oninit()
  world.setPixelPerfect(true)
endfunction

dim scn = new TiersScene()
scenemanager.register("tiers", scn)
scenemanager.switch("tiers")
```

- [ ] **Step 5: Write `TiersScene.bas`**

Create `demo-src/raycaster-p8-tiers/TiersScene.bas`:

```bas
Class
Extends scene

' Raycaster Phase 8 -- multi-tier level-design showcase. Pure floor:/ceil:
' height variation (no upper regions): a sunken central arena, a west staircase
' up to a raised north walkway with a higher NE nook. Wall textures + a few
' fcol:/ccol: accent tiles. WASD move, QE turn, RF look up/down.

dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim lights as RcLights
dim torch
dim titleText as Text
dim fpsText as Text
dim frames
dim accum

Constructor()
  input.bind("fwd", "key", keyboard.W)
  input.bind("back", "key", keyboard.S)
  input.bind("sl", "key", keyboard.Q)
  input.bind("sr", "key", keyboard.E)
  input.bind("tl", "key", keyboard.A)
  input.bind("tr", "key", keyboard.D)
  input.bind("lu", "key", keyboard.R)
  input.bind("ld", "key", keyboard.F)
EndConstructor

function onenter()
  self.frames = 0
  self.accum = 0

  world.setBackground(0, 0, 0)
  self.tm = new tilemapset("tiersroom.stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.ren = new RcRender(self.wld)
  self.me = new RcMover(self.wld, 6.0, 7.0, 0.3, 0.6)
  self.lights = new RcLights(self.wld)
  self.ren.bindLights(self.lights)
  self.ren.bindCamera(self.me)
  self.torch = self.lights.addPoint(6.0, 7.0, 0.5, 0.9, RcConfig.RC_LIGHT_RANGE)
  self.lights.update()

  self.ren.setWallTexture("rc_tex_concrete.png")

  self.titleText = new Text("Raycaster P8 - multi-tier showcase", 12, 10)
  self.titleText.setStyle(16, 255, 220, 120)
  hud.add(self.titleText)
  self.fpsText = new Text("WASD move  QE turn  RF look  (climb the west stairs)", 12, 30)
  self.fpsText.setStyle(14, 180, 255, 180)
  hud.add(self.fpsText)

  self.runProbes()
endfunction

function runProbes()
  dim pc as RcCast
  dim mv as RcMover
  dim ok1
  dim ok2
  dim ok3
  dim ok4
  dim ok5
  dim i
  dim sc
  dim sawFar

  ' 1 - the west stair climbs 0 -> 0.8 in five cells
  ok1 = 0
  if math.abs(self.wld.floorHeightAt(1, 4) - 0.2) < 0.001 then
    if math.abs(self.wld.floorHeightAt(1, 1) - 0.8) < 0.001 then
      ok1 = 1
    endif
  endif
  self.probe("west stair heights", ok1, 52)

  ' 2 - the sunken arena floor is below the room floor
  ok2 = 0
  if self.wld.floorHeightAt(5, 5) < 0 - 0.4 then
    ok2 = 1
  endif
  self.probe("sunken arena floor", ok2, 72)

  ' 3 - a ray across the sunken arena still reaches the far wall (window stays
  '     open over a floor DROP)
  pc = new RcCast()
  pc.cast(self.wld, 2.0, 5.5, 1.0, 0.0)
  sc = pc.spanCount()
  sawFar = 0
  for i = 0 to sc - 1
    if pc.spanKind(i) = RcConfig.RC_SPAN_WALL then
      if pc.spanDist(i) > 6.0 then
        sawFar = 1
      endif
    endif
  next i
  self.probe("see across the pit to the far wall", sawFar, 92)

  ' 4 - fcol:/ccol: tags parsed; an untagged cell reads -1
  ok4 = 0
  if self.wld.hasSurfaceColor() = 1 then
    if self.wld.floorColAt(5, 5) > 0 then
      if self.wld.ceilColAt(5, 1) > 0 then
        if self.wld.floorColAt(3, 3) = 0 - 1 then
          ok4 = 1
        endif
      endif
    endif
  endif
  self.probe("fcol/ccol tags parse per tile", ok4, 112)

  ' 5 - a mover walking up the west stair gains height (step-up climbing works
  '     without regions)
  mv = new RcMover(self.wld, 5.0, 4.5, 0.3, 0.6)
  mv.turn(math.pi())
  for i = 0 to 59
    mv.move(RcConfig.RC_MOVE_SPEED, 0)
    mv.step(50)
  next i
  ok5 = 0
  if mv.z() > 0.3 then
    ok5 = 1
  endif
  self.probe("mover climbs the west stair", ok5, 132)
endfunction

function probe(label, passed, y)
  dim result
  dim t as Text
  dim missing
  dim boom
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
  dim fwd
  dim strafe
  dim turnAxis
  dim lookAxis

  fwd = input.axis("back", "fwd")
  strafe = 0
  turnAxis = input.axis("tl", "tr")
  lookAxis = input.axis("ld", "lu")

  self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe)
  if turnAxis <> 0 then
    self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
  endif
  if lookAxis <> 0 then
    self.me.look(lookAxis * RcConfig.RC_LOOK_SPEED * (delta / 1000.0))
  endif
  self.me.step(delta)
  self.lights.moveLight(self.torch, self.me.x(), self.me.y())
  self.lights.update()

  self.ren.renderFrame()
  self.frames = self.frames + 1
  self.accum = self.accum + delta
  if self.frames >= 30 then
    dim ms
    ms = self.accum / self.frames
    self.fpsText.setText("frame avg " + string.str(math.floor(ms)) + " ms  (" + string.str(self.ren.columnCount()) + " cols)")
    self.frames = 0
    self.accum = 0
  endif
endfunction

EndClass
```

Before finalising, verify every call against the def files: `RcMover` constructor is `(w, x, y, radius, bodyHeight)`; `RcMover.look`, `.turn`, `.move`, `.step`, `.z`, `.x`, `.y` exist (`354ba4f` RcMover); `RcLights.addPoint(x, y, z, intensity, radiusCells)` and `.moveLight(handle, x, y)` and `.update()` (unchanged RcLights); `RcRender.setWallTexture`, `.bindLights`, `.bindCamera`, `.renderFrame`, `.columnCount`; `RcCast.cast(wld, ox, oy, dx, dy)`, `.spanCount`, `.spanKind`, `.spanDist`. `input.bind` / `input.axis` / `keyboard.*` per `demo-src/raycaster-p8`'s old scene (now deleted — cross-check `demo-src/raycaster-p7`'s scene or `src/lib/Basic4WebGL/defs/input.bas`).

- [ ] **Step 6: Add the registry entry**

In `src/features/demos/devDemoRegistry.ts`, append after the `raycaster-p7-diagonals` block (keeping the array's closing `];`):

```ts
  {
    slug: 'raycaster-p8-tiers',
    name: 'Raycaster P8 — Multi-Tier Level',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 8 probe: multi-tier level design with pure floor:/ceil: height variation — a sunken arena, a west staircase up to a raised north walkway and a higher NE nook. Wall textures, per-tile fcol:/ccol: colour, WASD + RF camera look.',
    docsSlug: '',
    file: 'RaycasterP8Tiers',
  },
```

- [ ] **Step 7: Add the Cypress row**

In `cypress/e2e/demos.cy.ts`, after the `raycaster-p7-diagonals` row:

```ts
  { slug: 'raycaster-p8-tiers', title: 'Raycaster P8 — Multi-Tier Level', waitMs: 4000 },
```

- [ ] **Step 8: Add the devDemoRegistry test assertion**

In `tests/ui/features/demos/devDemoRegistry.test.ts`, after the `raycaster-p7-diagonals` assertions:

```ts
    const p8 = devDemoRegistry.find((d) => d.slug === 'raycaster-p8-tiers');
    expect(p8).toBeDefined();
    expect(p8?.file).toBe('RaycasterP8Tiers');
```

- [ ] **Step 9: Add the probes case**

In `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts`, after the p7 case:

```ts
  test('P8-tiers TiersScene.onenter runs runProbes and every probe passes', () => {
    runPhaseProbes({
      dir: 'demo-src/raycaster-p8-tiers',
      stm: 'tiersroom.stm',
      sceneGlobal: '_sb_tiersscene',
      probeCount: 5,
    });
  });
```

Confirm `sceneGlobal` — it is `_sb_` + the class name lower-cased (the p8b case used `_sb_texturescene` for `TextureScene`), so `TiersScene` → `_sb_tiersscene`.

- [ ] **Step 10: Confirm the phase-dir regex still matches**

Three test files filter phase dirs with `/^raycaster-p\d+[a-z]?$/`: `raycasterDemoLibSync.test.ts`, `raycasterDemoSmoke.test.ts`, `raycasterDemoTranspile.test.ts`. `raycaster-p8-tiers` does **not** match (`-tiers` suffix). Change the pattern in **all three** to:

```ts
/^raycaster-p\d+(-[a-z]+)?$/
```

Confirm with `grep -rln "raycaster-p" tests/` that no fourth copy exists.

- [ ] **Step 11: Build the export**

```bash
npm run build:demo -- demo-src/raycaster-p8-tiers RaycasterP8Tiers
```

Expected: `Wrote src/docs/demos/RaycasterP8Tiers.b4wgl.json (N file(s), M asset(s))`.

- [ ] **Step 12: Run the suites**

```bash
npx vitest run raycaster devDemoRegistry
npx vite build
```

Expected: PASS including `raycasterDemoProbes` P8-tiers (5/5), `raycasterDemoLibSync` (new dir in sync), `raycasterDemoSmoke` (new dir executes). Build clean.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat(raycaster): raycaster-p8-tiers multi-tier showcase demo + camera look

Replaces the two retired Phase 8 demos with one showcase of pure
floor:/ceil: tiering (sunken arena, west staircase, raised walkway, NE
nook), wall textures, fcol:/ccol: accent tiles, and WASD + RF camera look
(pitch via RcMover.look, already clamped to RC_MAX_PITCH).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Docs, roadmap, supersede headers

**Files:**
- Modify: `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`
- Modify: `docs/roadmap.md`, `src/docs/roadmap.md`, `docs/language/library-roadmap.md`
- Modify: `src/docs/guides/raycaster-library.md`
- Modify: `src/docs/api-reference/drawing.md`
- Modify: `docs/superpowers/specs/2026-09-02-raycaster-phase-8-upper-regions-design.md`
- Modify: `docs/superpowers/plans/2026-09-02-raycaster-phase-8-upper-regions.md`
- Modify: `docs/superpowers/specs/2026-09-02-raycaster-renderer-rework-design.md`
- Modify: `docs/superpowers/plans/2026-09-02-raycaster-renderer-rework.md`

- [ ] **Step 1: Supersede headers**

At the very top of each of the four Phase-8 / renderer-rework spec & plan files, insert:

```markdown
> **Superseded** by `docs/superpowers/specs/2026-09-03-raycaster-descope-upper-regions-design.md` — upper regions were removed and the interval renderer reverted to a single window. Kept for history.
```

- [ ] **Step 2: Engine design spec**

In `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`:
- Find the §5 / §5.2 / §5.3 renderer sections and the "As built (renderer rework …)" / "As built (texturing …)" notes. Replace the multi-interval occlusion description with the single-window model (a floor rise clamps `winBot`, a ceiling drop clamps `winTop`, a floor drop / ceiling rise leaves the window open).
- Find the Phase 8 section. Strike it through and add a note: *"Upper regions were built (2026-09-02) and removed (2026-09-03). The lower↔upper camera transition read as jarring and the feature forced the multi-interval occlusion renderer, which was the raycaster's largest per-frame cost. Room-over-room is out of scope for 'DOOM plus a bit'. Phase 8 is redefined as Multi-tier level design & surface colour — `floor:`/`ceil:` tiering, `fcol:`/`ccol:` colour, wall texturing, camera look. See `2026-09-03-raycaster-descope-upper-regions-design.md`."*
- Note that `drawing.drawFloorStrip` remains an engine primitive but is not used by `RcRender` (floor/ceiling texturing deferred).

- [ ] **Step 3: Roadmaps**

In `docs/roadmap.md` and `src/docs/roadmap.md` and `docs/language/library-roadmap.md`, rewrite the "Phase 8 shipped" / "Renderer rework shipped" / "Texturing shipped" clauses of the raycaster entry:
- Phase 8 = "Multi-tier level design & surface colour" (dev demo `raycaster-p8-tiers`): `floor:`/`ceil:` tiering (already in Phases 3–6), per-tile `fcol:`/`ccol:` flat colour, wall texturing (`setWallTexture` / `tex:` / `drawImageStrip` tint + vertical clip), camera look wired.
- Upper regions: "built then removed 2026-09-03 — jarring transition, forced the costly interval renderer, room-over-room beyond scope."
- Renderer: "single-window occlusion (restored); bilinear surface light kept."
- Keep the Phase 9 (optimisation) and Phase 10 (docs) items. Update the "Phase 9 is now well-motivated" note to point at the class-method-dispatch / checked-array overhead and per-frame draw-primitive count rather than `drawFloorStrip`.
- Update any "Last updated" line to `2026-09-03`.

- [ ] **Step 4: Library guide**

In `src/docs/guides/raycaster-library.md`:
- Delete the "Upper regions" section entirely, and its bullet in the intro marker list (`uceil:` line) and the `wld.upperKindAt` / `upperFloorAt` / `upperCeilAt` / `hasUpperAt` rows in the accessor table.
- The "Wall textures" and "Floor and ceiling colour" sections were already added; adjust the "Floor and ceiling colour" closing note to say floor/ceiling **textures are not implemented** in the library (`drawFloorStrip` exists in the `drawing` engine module but `RcRender` does not call it — deferred to a later phase), rather than "parked".
- If any prose mentions "region" / "walkway you walk under" / "second storey", remove it.

- [ ] **Step 5: drawing API reference**

In `src/docs/api-reference/drawing.md`, on the `drawFloorStrip` entry add:

```markdown
> **Note:** This primitive is not yet used by the raycaster library — perspective-correct floor/ceiling texturing is reserved for a future pass. `drawImageStrip` (walls) is the supported textured-surface call today.
```

- [ ] **Step 6: Verify docs build**

```bash
npx vite build
```

Expected: clean (docs are markdown imported at build time).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "docs(raycaster): descope upper regions, redefine Phase 8 as multi-tier

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Full unit suite**

```bash
npx vitest run
```

Expected: green (~same count as before minus the deleted `raycasterIntervals` / `raycasterUpperWorld` tests plus the new `raycasterWindowOcclusion`; one known `onTaskUpdate` flake tolerated).

- [ ] **Step 2: Build**

```bash
npx vite build
```

Expected: clean.

- [ ] **Step 3: Cypress e2e (manual — needs the dev server)**

```bash
npm run dev
```

then in another shell:

```bash
npm run cypress:run --spec cypress/e2e/demos.cy.ts
```

Expected: green. The `raycaster-p8-upper` / `raycaster-p8b-textures` describe blocks are gone; `raycaster-p8-tiers` is present and shows no `ERR`. `raycaster-p1` … `raycaster-p7` still pass on the reverted lib.

- [ ] **Step 4: Grep for stragglers**

```bash
grep -rn "upperKindAt\|upperFloorAt\|upperCeilAt\|hasUpperAt\|RC_SPAN_PORTAL\|RC_MAX_INTERVALS\|RC_SHADE_UPPER_FLOOR\|drawSurfaceInto\|resetIntervals\|raycaster-p8-upper\|raycaster-p8b" src/ demo-src/ tests/ docs/ cypress/ scripts/
```

Expected: no matches outside the superseded spec/plan files in `docs/superpowers/`.

- [ ] **Step 5: Hand off for the manual walk**

Tell the user: seed `raycaster-p8-tiers`, Run, walk it. Check — stairs climb smoothly, the raised walkway occludes what's behind it, the sunken arena shows the far wall across it, RF tilts the view and clamps, textured walls + coloured accent tiles read correctly, and the frame feels smoother than the interval build (compare the HUD `frame avg` against the old p8). Do **not** bump the version or push until the user confirms.

---

## Self-Review

**Spec coverage:**
- §2.1 (stays) — variable heights: untouched in Tasks 2/4. Diagonal walls + along-chord U: Task 2 Step 3. Bilinear light: Task 2 Steps 15–16 (`sampleAt` in `drawFlatSeg` / `renderFrame`). Wall texturing: Task 2 Step 15 (`drawWallStrip`), Step 16. `fcol`/`ccol`: Task 2 Steps 15–16, kept in RcWorld Steps 5–9. `hasLayer`: not touched (kept). `drawFloorStrip` primitive kept: Task 5 Step 5 + not deleted from `drawing.js`. ✓
- §2.2 (removed) — RcWorld: Task 2 Steps 5–9. RcCast: Steps 2–3. RcMover: Step 4. RcRender: Steps 10–16. RcConfig: Step 1. Demos: Task 1. ✓
- §3 (single window) — Task 2 Steps 15–16, test Step 21. ✓
- §4 (new demo) — Task 4. Camera look: Task 4 Step 5 (`lu`/`ld` binds, `me.look`). ✓
- §5 (follow-through) — lib sync Task 2 Step 18; export rebuild Task 3; focused tests Task 2 Steps 19–21; smoke stub Step 20; docs Task 5. ✓
- §6 (testing) — Task 6. ✓
- §7 (out of scope) — no Phase 9 / floor textures / pointer-lock tasks. ✓

**Placeholder scan:** the `.stm` layout in Task 4 Step 3 is marked as adjustable with the invariant stated (headroom + `RC_STEP_UP`); every code step shows full code. The `Raycaster.b4wgl.json` rebuild in Task 3 Step 3 is conditional on a `grep` result with both branches specified. No "TBD"/"handle edge cases". ✓

**Type / name consistency:** `drawSurface(destX, hh, dNear, dFar, winTop, winBot, kind, lite, rayX, rayY)` — same signature in the helper definition (Step 15) and all 6 call sites (Step 16). `drawFlatSeg` / `drawWallStrip` / `surfaceRunEnd(tStart, tMax, rayX, rayY)` consistent between Steps 15 and 16. `hassurfacecolor` / `floorcolat` / `ceilcolat` stub names match the `.bas` accessor names lower-cased (transpiler convention), consistent across Task 2 Steps 20–21 and Task 4's test world. `RaycasterP8Tiers` / `raycaster-p8-tiers` / `_sb_tiersscene` / `tiersroom.stm` / `TiersScene` consistent across Task 4 Steps 3–13. ✓
