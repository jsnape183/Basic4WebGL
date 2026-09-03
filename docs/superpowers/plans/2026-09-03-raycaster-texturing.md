# Raycaster Texturing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Texture the raycaster's walls, floors, and ceilings (currently all flat grey). Walls blit a texture column via `drawing.drawImageStrip` (with a new tint + vertical source-clip); horizontal surfaces use a new perspective-correct `drawing.drawFloorStrip`. Ship a textured demo `raycaster-p8b-textures`.

**Architecture:** Two generic `drawing` engine additions (tint + `srcVTop`/`srcVBot` on `drawImageStrip`; new `drawFloorStrip` = a pooled `PIXI.PerspectiveMesh` per strip). `RcRender` gains scene-level texture defaults + per-cell `tex:`/`ftex:`/`ctex:` overrides (already parsed by `RcWorld`), and a textured branch in the wall and surface draw paths that clips to the interval list and derives the source-V window. `RcCast` computes the real along-chord U for diagonal walls (was hard-0).

**Tech Stack:** softBASIC, descriptor-generated `drawing` def (`npm run generate:library`), PIXI v8.20 (CDN), Vitest, Cypress, `scripts/buildDemo.ts`.

**Spec:** `docs/superpowers/specs/2026-09-03-raycaster-wall-texturing-design.md`

**Sits after** the renderer rework (interval occlusion) — textured strips clip to `intvTop`/`intvBot` the same way flat ones do.

---

## File Structure

**Engine (generic):**
- `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts` — `drawImageStrip` +3 params; new `drawFloorStrip`.
- `src/lib/Basic4WebGL/defs/drawing.bas` — **regenerated**, never hand-edited (`generatedDefsInSync` guard).
- `src/components/Runner/engine/drawing.js` — `_texFor` V-frame + `o.tint`; `drawFloorStrip` mesh path + `_poolM`/`_liveM`.
- `tests/components/Runner/drawing.test.ts` — `FakeSprite.tint`, `FakePerspectiveMesh`, new assertions.
- `src/docs/api-reference/drawing.md` — updated signatures.

**Library (canonical `demo-src/raycaster/lib/`, copied to phase dirs):**
- `RcConfig.bas` — `RC_TEX_SIZE = 64`. Copied p2–p8, p8b.
- `RcCast.bas` — real diagonal wall-U. Copied p2–p8, p8b.
- `RcRender.bas` — texture defaults + setters, `drawWallInto`, textured wall + surface branches, `distAtScreenY`. Copied p3–p8, p8b.

**Test infra:**
- `raycasterDemoLibSync` / `raycasterDemoTranspile` / `raycasterDemoSmoke` — widen the phase-dir regex `/^raycaster-p\d+$/` → `/^raycaster-p\d+[a-z]?$/` so `raycaster-p8b` is covered.

**Demo (`demo-src/raycaster-p8b/`, new):**
- `assets/` — 6 placeholder 64×64 PNGs (`scripts/genRaycasterTextures.ts` one-off) + a copied tile image + a retagged `p8broom.stm`.
- `TextureScene.bas` (from p3's `RoomViewScene.bas`), `Main.bas`, 8 lib copies.
- `src/docs/demos/RaycasterP8bTextures.b4wgl.json`, `devDemoRegistry.ts` + test, `cypress/e2e/demos.cy.ts`.

**Docs:** engine spec §5.2/§5.3/§6.3/§11; roadmap ×2; guide.

---

## Task 1: RcConfig + widen the phase-dir regexes

**Files:** `demo-src/raycaster/lib/RcConfig.bas`; `tests/lib/Basic4WebGL/integration/raycasterDemo{LibSync,Transpile,Smoke}.test.ts`; then `cp` RcConfig to `raycaster-p2`…`raycaster-p8`.

- [ ] **Step 1:** `RcConfig.bas` — before `endconst`: `    RC_TEX_SIZE = 64`
- [ ] **Step 2:** in all three `raycasterDemo*.test.ts`, change `/^raycaster-p\d+$/` → `/^raycaster-p\d+[a-z]?$/` (the `.filter((entry) => entry.isDirectory() && ...)` line). This future-proofs `raycaster-p8b` before it exists — the change is inert today (no `p<n><letter>` dir yet).
- [ ] **Step 3:** `for d in raycaster-p2 raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6 raycaster-p7 raycaster-p8; do cp demo-src/raycaster/lib/RcConfig.bas demo-src/$d/RcConfig.bas; done` (p1 has RcConfig too — `cp` to `raycaster-p1` as well; `raycasterDemoLibSync` checks it).
- [ ] **Step 4:** `npx vitest run raycasterDemoTranspile raycasterDemoLibSync` → PASS.
- [ ] **Step 5:** commit `feat: RC_TEX_SIZE + widen phase-dir regex for raycaster-p8b`

---

## Task 2: Engine — `drawImageStrip` gains `tint`, `srcVTop`, `srcVBot`

**Files:** `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts`, `src/components/Runner/engine/drawing.js`, `src/lib/Basic4WebGL/defs/drawing.bas` (regenerated), `tests/components/Runner/drawing.test.ts`, `tests/lib/Basic4WebGL/unit/transpiler/*drawing*` (if one exists — else the smoke path), `src/docs/api-reference/drawing.md`.

### Step 1: Failing engine test

In `tests/components/Runner/drawing.test.ts`:
- Add `tint = 0xffffff` to `FakeSprite` (a plain assignable field).
- Extend `_sbAssets.get` fake to return `{ source: { style: {} }, width: 64, height: 64 }` (so `.height` is real).
- New tests:
  - `drawImageStrip applies tint` — `d.drawImageStrip('w.png', 3, 0, 0, 4, 40, 0x804020)` → the created/reused sprite's `.tint === 0x804020`; a 6-arg call → `.tint === 0xffffff`.
  - `drawImageStrip clips the source V range` — capture the `FakeRectangle` passed to `FakeTexture`; `d.drawImageStrip('w.png', 3, 0, 0, 4, 40, 0xffffff, 0.25, 0.75)` → rectangle `y === 0.25*64 === 16`, `h === 0.5*64 === 32`; default 6-arg → `y === 0`, `h === 64`.
  - `_texCache key includes the V window` — same `(image, srcX)` but different `srcVTop` → a *new* `FakeTexture` (`textureCreated` bumps).

Run → FAIL.

### Step 2: Descriptor

`drawing.descriptor.ts`, the `drawImageStrip` entry:
```ts
{
  name: 'drawImageStrip',
  params: ['imageName', 'srcX', 'destX', 'destY', 'destWidth', 'destHeight', 'tint', 'srcVTop', 'srcVBot'],
  body: (p) =>
    `_sb.drawImageStrip(${p.imageName}, ${p.srcX}, ${p.destX}, ${p.destY}, ${p.destWidth}, ${p.destHeight}, ${p.tint}, ${p.srcVTop}, ${p.srcVBot})`,
},
```

### Step 3: `npm run generate:library` → `drawing.bas` regenerates. Do NOT hand-edit it.

### Step 4: Engine

`src/components/Runner/engine/drawing.js`:
```js
function _texFor(imageName, srcX, srcVTop, srcVBot) {
  const vt = srcVTop === undefined ? 0 : srcVTop;
  const vb = srcVBot === undefined ? 1 : srcVBot;
  const qt = Math.round(vt * 1000) / 1000;      // quantise so a jittering clip
  const qb = Math.round(vb * 1000) / 1000;      // doesn't churn the cache
  const key = imageName + ':' + srcX + ':' + qt + ':' + qb;
  let t = _texCache.get(key);
  if (!t) {
    const base = _sbAssets.get(imageName);
    t = new PIXI.Texture({
      source: base.source,
      frame: new PIXI.Rectangle(srcX, qt * base.height, 1, Math.max(1, (qb - qt) * base.height)),
    });
    _texCache.set(key, t);
    // LRU cap — evict oldest if over (Map preserves insertion order)
    if (_texCache.size > 512) {
      const oldest = _texCache.keys().next().value;
      const old = _texCache.get(oldest);
      _texCache.delete(oldest);
      if (old && old.destroy) old.destroy();
    }
  }
  return t;
}

drawImageStrip(imageName, srcX, destX, destY, destWidth, destHeight, tint, srcVTop, srcVBot) {
  const o = _acquireS();
  o.texture = _texFor(imageName, srcX, srcVTop, srcVBot);
  o.width = destWidth;
  o.height = destHeight;
  o.tint = tint === undefined ? 0xffffff : tint;
  o.anchor.set(0.5, 0.5);
  o.position.set(destX, destY);
  return o;
}
```
Match the current `_texFor` call in `drawImageStrip` (it currently passes 2 args) — every caller now goes through the 4-arg form.

### Step 5: `drawActors` in `RcRender.bas` — pass a real tint

`demo-src/raycaster/lib/RcRender.bas` `drawActors` line ~238: `drawing.drawImageStrip(a.image(), srcX, centerPx, (feetY + headY) / 2, RcConfig.RC_STRIP_W, hPx)` → add three args: a tint from the actor's light (`self.boundLights.sampleAt(a.x(), a.y())` if bound, else `1.0`, packed via a helper `packTint(lite)` → `math.floor(255*lite)*65536 + math.floor(255*lite)*256 + math.floor(255*lite)`), and `0, 1` for the V range (billboards use the full source). This clears the "billboard tint deferred since Phase 6" note. Add a `packTint(lite)` helper function to `RcRender`.

### Step 6: Run → PASS. `npx vitest run drawing generatedDefsInSync` → PASS (the regenerated `drawing.bas` matches; the engine tests pass). Also `npx vitest run raycasterDemoSmoke raycasterDemoTranspile` (drawActors change is a `.bas` edit — sync RcRender to p3–p8 + run).

### Step 7: Docs — `src/docs/api-reference/drawing.md` `drawImageStrip`: note the three new **optional** params (`tint` default white, `srcVTop`/`srcVBot` default 0/1 — "draw only a vertical slice of the source, for a strip clipped by something in front of it").

### Step 8: Sync RcRender p3–p8, commit `feat(drawing): drawImageStrip tint + vertical source clip`

---

## Task 3: Engine — `drawing.drawFloorStrip` (perspective-mesh textured strip)

**Files:** `drawing.descriptor.ts`, `drawing.js`, `drawing.bas` (regenerated), `drawing.test.ts`, `drawing.md`.

**Risk task.** If `PIXI.PerspectiveMesh` can't tile a sub-region, fall back per spec §1.2/§5 (hand-built `Mesh` geometry with per-vertex UV + `w`; then a subdivided plane; then a plain 2-tri affine quad). A 4px-wide strip tolerates affine UV across its width; perspective correctness matters along its depth (yNear→yFar), which any vertical subdivision + `w` handles.

### Step 1: Failing test

`drawing.test.ts` — add `FakePerspectiveMesh` (or `FakeMesh`) to the injected `PIXI`: `class FakePerspectiveMesh { visible = true; tint = 0xffffff; position = {set(){}}; constructor(opts){ meshCreated++; this.opts = opts; } destroy(){ destroyed++; } setCorners(...c){ this.corners = c; } }`. Tests:
- `drawFloorStrip creates a mesh with the four screen corners` — `d.drawFloorStrip('f.png', 100, 50, 30, 2, 3, 5, 8, 4, 0xc0c0c0)` → a mesh was created; its corners (however the impl sets them) correspond to `destX ± 2` at `yNear=50` / `yFar=30`; `tint === 0xc0c0c0`.
- `drawFloorStrip pools the mesh across a clear` — draw, `clearDrawing()`, draw again → `meshCreated` stays 1.
- `_drawingReset destroys pooled meshes`.

Run → FAIL.

### Step 2: Descriptor

```ts
{
  name: 'drawFloorStrip',
  params: ['imageName', 'destX', 'yNear', 'yFar', 'wNearX', 'wNearY', 'wFarX', 'wFarY', 'stripW', 'tint'],
  body: (p) =>
    `_sb.drawFloorStrip(${p.imageName}, ${p.destX}, ${p.yNear}, ${p.yFar}, ${p.wNearX}, ${p.wNearY}, ${p.wFarX}, ${p.wFarY}, ${p.stripW}, ${p.tint})`,
},
```
`npm run generate:library`.

### Step 3: Engine

`drawing.js` — add `_poolM`/`_liveM` (mirror `_poolS`/`_liveS` in `_acquireM`, `clearDrawing`, `_drawingReset`). Then:
```js
drawFloorStrip(imageName, destX, yNear, yFar, wNearX, wNearY, wFarX, wFarY, stripW, tint) {
  const base = _sbAssets.get(imageName);
  const tex = base;                       // full texture; UVs carry the world tiling
  const hw = stripW / 2;
  const m = _acquireM(tex);
  // screen quad: near edge (yNear, wide), far edge (yFar). TL, TR, BR, BL.
  m.setCorners(
    destX - hw, yFar,
    destX + hw, yFar,
    destX + hw, yNear,
    destX - hw, yNear,
  );
  // world tiling: v runs 0..segLenInTiles along near->far; u a fixed narrow band.
  // Implementation detail — see the fallback ladder in the spec. Simplest that
  // renders correct against the checkerboard test texture wins. Set the mesh's
  // texture UV matrix / repeat wrap so one world unit == one texture repeat.
  m.tint = tint === undefined ? 0xffffff : tint;
  return m;
}
```
The precise `PerspectiveMesh` construction (subdivisions, UV/`w` setup, `wrapMode = 'repeat'`) is the implementer's to get right against a **checkerboard test texture** — the acceptance bar: a receding floor shows squares that *stay square* toward the horizon (perspective-correct), tiled ~1 square per world unit, no per-CPU-pixel loop. Document which mechanism was used in the report.

### Step 4: Run → PASS. `npx vitest run drawing generatedDefsInSync` → PASS.

### Step 5: Docs — `drawing.md` new `drawFloorStrip` entry (beginner-facing).

### Step 6: Commit `feat(drawing): drawFloorStrip — perspective-correct textured floor/ceiling strip`

---

## Task 4: RcCast — real diagonal wall-U

**Files:** `demo-src/raycaster/lib/RcCast.bas`; `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`; then `cp` to `raycaster-p2`…`raycaster-p8`.

### Step 1: Failing test

`raycasterDemoSmoke.test.ts` — in the `RcCast resolves a diagonal tile as a wall span` test (or a sibling), assert `rc.spanu(n - 1)` is strictly between 0 and 1 (not 0) for the SE-diagonal hit, and that two rays hitting the same diagonal chord at different points give different `spanu` values. Extend `RcCastLike` with `spanu(i: number): number` if missing.

Run → FAIL (`spanu` is 0).

### Step 2: Implement

`RcCast.bas` `cast()`, the diagonal `addSpan` (~L204). Add to `cast()`'s dim block: `dim hx`, `dim hy`, `dim startX`, `dim startY`, `dim du`. Where the diagonal hit is confirmed (`if dh >= 0 then`):
```basic
    hx = ox + dx * dh
    hy = oy + dy * dh
    if dg = RcConfig.RC_DIAG_NW or dg = RcConfig.RC_DIAG_SE then
        startX = self.mMapX + 1.0
        startY = self.mMapY
    else
        startX = self.mMapX
        startY = self.mMapY
    endif
    du = math.sqrt((hx - startX) * (hx - startX) + (hy - startY) * (hy - startY)) / 1.41421356
    du = math.clamp(du, 0, 1)
    self.addSpan(RcConfig.RC_SPAN_WALL, dh, runFloor, runCeil, self.mMapX, self.mMapY, RcConfig.RC_SPAN_SIDE_DIAG, du, wld.wallTexAt(self.mMapX, self.mMapY))
```
(replaces the `, 0,` with `, du,`). Header comment: drop "wall-U = 0" / "flat-shaded, v1" for diagonals.

### Step 3: Run → PASS. Sync `cp` p2–p8. `npx vitest run raycasterDemoSmoke raycasterDemoProbes raycasterDemoTranspile raycasterDemoLibSync raycasterDiagWorld` → PASS.

### Step 4: Commit `feat: RcCast real along-chord wall-U for diagonal tiles`

---

## Task 5: RcRender — textured walls

**Files:** `demo-src/raycaster/lib/RcRender.bas`; `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`; then `cp` to `raycaster-p3`…`raycaster-p8`.

### Step 1: Failing test

`raycasterDemoSmoke.test.ts` — new `test.each(phaseDirs)`: a stub world with a wall texture (`walltexat: () => 'brick.png'`), render, spy on `drawImageStrip` + `drawRect`. Assert: at least one `drawImageStrip` call with a non-`0xffffff` tint and a `srcX` in `[0, 64)`; the fully-untextured control (`walltexat: () => ''`) still produces `drawRect` wall strips and no `drawImageStrip` (beyond billboards). The `evalDemo` `_sb` stub needs `drawImageStrip` capturing all 9 args.

Run → FAIL.

### Step 2: Implement

**(a) Fields + setters** — `dim defWallTex` / `dim defFloorTex` / `dim defCeilTex` (class scope, `""` in Constructor). `setWallTexture(name)` / `setFloorTexture(name)` / `setCeilTexture(name)` → assign. Resolve helper:
```basic
function wallTexFor(col, row)
    dim t
    t = self.wld.wallTexAt(col, row)
    if string.len(t) > 0 then
        return t
    endif
    return self.defWallTex
endfunction
```
(+ `floorTexFor` / `ceilTexFor` similarly using `floorTexAt` / `ceilTexAt`.)

**(b) `packTint(r, g, b)` helper** (also used by `drawActors` from Task 2):
```basic
function packTint(r, g, b)
    return math.floor(math.clamp(r, 0, 255)) * 65536 + math.floor(math.clamp(g, 0, 255)) * 256 + math.floor(math.clamp(b, 0, 255))
endfunction
```

**(c) `drawWallInto(wTop, wBot, tex, u, lite, sideKind)`** — the textured mirror of `drawInto` for walls:
```basic
function drawWallInto(wTop, wBot, tex, u, lite, sideKind)
    dim k
    dim n
    dim total
    dim cTop
    dim cBot
    dim svTop
    dim svBot
    dim srcX
    dim dim2
    dim sideDim
    dim tint
    total = 0
    sideDim = 1.0
    if sideKind = 1 then
        sideDim = 0.8
    endif
    if sideKind = RcConfig.RC_SPAN_SIDE_DIAG then
        sideDim = 0.9
    endif
    srcX = math.floor(u * RcConfig.RC_TEX_SIZE)
    if srcX < 0 then
        srcX = 0
    endif
    if srcX >= RcConfig.RC_TEX_SIZE then
        srcX = RcConfig.RC_TEX_SIZE - 1
    endif
    dim2 = 255 * lite * sideDim
    tint = self.packTint(dim2, dim2, dim2 + 25)
    n = array.arrLength(self.intvTop)
    for k = 0 to n - 1
        cTop = wTop
        cBot = wBot
        if cTop < self.intvTop(k) then
            cTop = self.intvTop(k)
        endif
        if cBot > self.intvBot(k) then
            cBot = self.intvBot(k)
        endif
        if cBot > cTop then
            svTop = (cTop - wTop) / (wBot - wTop)
            svBot = (cBot - wTop) / (wBot - wTop)
            drawing.drawImageStrip(tex, srcX, self.iDestX, (cTop + cBot) / 2, RcConfig.RC_STRIP_W, cBot - cTop, tint, svTop, svBot)
            total = total + 1
        endif
    next k
    return total
endfunction
```

**(d) renderFrame wall branch** — where it currently does `wshade = self.rc.spanSide(i) ; if wshade = RC_SPAN_SIDE_DIAG then wshade = 1 ; self.drawInto(sTop, sBot, wshade, lite)`:
```basic
                dim wtex
                wtex = self.wallTexFor(self.rc.spanCol(i), self.rc.spanRow(i))
                if string.len(wtex) > 0 then
                    self.surfCountLast = self.surfCountLast + self.drawWallInto(sTop, sBot, wtex, self.rc.spanU(i), lite, self.rc.spanSide(i))
                else
                    wshade = self.rc.spanSide(i)
                    if wshade = RcConfig.RC_SPAN_SIDE_DIAG then
                        wshade = 1
                    endif
                    self.drawInto(sTop, sBot, wshade, lite)
                endif
```
Same for the `RC_SPAN_PORTAL_WALL` branch (use `wallTexFor(spanCol, spanRow)` — a portal wall is an upper/lower cell with its own or the default tex; `sideKind` = whatever the portal wall's `spanSide` is, likely 0). All new `dim`s (`wtex`) to renderFrame's function-top block.

### Step 3: Run → PASS. Sync p3–p8. `npx vitest run raycasterDemoSmoke raycasterDemoProbes raycasterDemoTranspile raycasterDemoLibSync raycasterIntervals` → PASS (untextured demos unaffected — `wallTexFor` returns `""`).

### Step 4: Commit `feat: RcRender textured wall strips`

---

## Task 6: RcRender — textured floors & ceilings

**Files:** `demo-src/raycaster/lib/RcRender.bas`; `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`; then `cp` to `raycaster-p3`…`raycaster-p8`.

### Step 1: Failing test

`raycasterDemoSmoke.test.ts` — new `test.each`: stub world with `floortexat: () => 'floor.png'`, render, spy on `drawFloorStrip`. Assert it's called with the right `destX` and a `yNear > yFar` (near edge lower on screen) and a tint reflecting the light. Untextured control → `drawRect` surface strips, no `drawFloorStrip`. The `_sb` stub captures `drawFloorStrip` args.

Run → FAIL.

### Step 2: Implement

**(a) `distAtScreenY(hh, y)`** — inverse of `projectY`, for re-deriving the world point when the interval clip cuts a surface band:
```basic
function distAtScreenY(hh, y)
    dim denom
    dim horizon
    horizon = self.scy + self.camPitch
    denom = y - horizon
    if math.abs(denom) < 0.0001 then
        return RcConfig.RC_MAX_DIST
    endif
    return (self.camZ + RcConfig.RC_EYE_Z - hh) * self.viewH / denom
endfunction
```
(cross-check the constant against `projectY`'s exact form — `projectY(h,d) = scy + (camZ + RC_EYE_Z - h) * (viewH / d) + camPitch`, so `d = (camZ + RC_EYE_Z - h) * viewH / (y - scy - camPitch)`.)

**(b) `drawSurfaceInto` texture branch** — add a `tex` param resolution + branch. The caller (renderFrame's flush sites) passes whether this is a floor or ceiling; simplest: add a `texName` param to `drawSurfaceInto` and let the caller resolve it (`floorTexFor` / `ceilTexFor` by shade kind), OR resolve inside from `kind` (`kind = RC_SHADE_FLOOR_TOP or _PIT_FLOOR` → `floorTexFor(spanCol,spanRow)` — but `drawSurfaceInto` doesn't have the cell). **Pass `texName` in.** Signature → `drawSurfaceInto(hh, dNear, dFar, kind, lite, texName)`.
```basic
    if string.len(texName) = 0 then
        ' existing flat path: drawInto(yTop, yBot, kind, useLite) + occlude
        ...
    else
        dim k
        dim n
        dim cTop
        dim cBot
        dim cdN
        dim cdF
        dim wnx
        dim wny
        dim wfx
        dim wfy
        dim ft
        n = array.arrLength(self.intvTop)
        for k = 0 to n - 1
            cTop = yTop
            cBot = yBot
            if cTop < self.intvTop(k) then
                cTop = self.intvTop(k)
            endif
            if cBot > self.intvBot(k) then
                cBot = self.intvBot(k)
            endif
            if cBot > cTop then
                ' re-derive world near/far for the clipped screen span so the
                ' texture doesn't slide. yBot is the NEAR edge (bigger screen Y).
                cdN = self.distAtScreenY(hh, cBot)
                cdF = self.distAtScreenY(hh, cTop)
                wnx = self.camX + self.fRayX * cdN
                wny = self.camY + self.fRayY * cdN
                wfx = self.camX + self.fRayX * cdF
                wfy = self.camY + self.fRayY * cdF
                ft = self.packTint(255 * useLite, 255 * useLite, 255 * useLite)
                drawing.drawFloorStrip(texName, self.iDestX, cBot, cTop, wnx, wny, wfx, wfy, RcConfig.RC_STRIP_W, ft)
                self.surfCountLast = self.surfCountLast + 1
            endif
        next k
    endif
    self.occlude(yTop, yBot)
```
Watch the yTop/yBot vs near/far orientation — for a **floor** (below eye) the near edge is *lower* on screen (bigger Y); for a **ceiling** (above eye) the near edge is *higher* (smaller Y). `distAtScreenY` handles both signs via `(camZ + RC_EYE_Z - hh)` being negative for a ceiling. Verify with the smoke test that a floor strip's `wNear` is closer than `wFar`.

**(c) renderFrame flush sites** — every `self.drawSurfaceInto(sfH, sfD, d, sfKind, sfLite)` → `self.drawSurfaceInto(sfH, sfD, d, sfKind, sfLite, <tex>)` where `<tex>` = for the pending floor surface, `self.floorTexFor(camCol, camRow)` seeded per column (the surface belongs to the run of cells from the camera; use the camera cell's tex or the default — a per-cell floor texture that varies mid-run is a v2 nicety). Similarly `ceilTexFor` for the ceiling surface. Add `dim sfTex` / `dim scTex` to renderFrame, seed alongside `sfLite`/`scLite`.

### Step 3: Run → PASS. Sync p3–p8. Full `npx vitest run raycasterDemoSmoke raycasterDemoProbes raycasterDemoTranspile raycasterDemoLibSync raycasterIntervals raycasterLights` → PASS.

### Step 4: Commit `feat: RcRender textured floors and ceilings via drawFloorStrip`

---

## Task 7: `raycaster-p8b-textures` demo

**Files:** `scripts/genRaycasterTextures.ts` (new one-off); `demo-src/raycaster-p8b/**`; `src/docs/demos/RaycasterP8bTextures.b4wgl.json`; `src/features/demos/devDemoRegistry.ts`; `tests/ui/features/demos/devDemoRegistry.test.ts`; `cypress/e2e/demos.cy.ts`; `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts`.

### Step 1: Placeholder textures

`scripts/genRaycasterTextures.ts` (run with `vite-node`) — writes six 64×64 PNGs into `demo-src/raycaster-p8b/assets/`: `rc_tex_brick.png` (horizontal courses + offset verticals), `rc_tex_concrete.png` (low-freq noise), `rc_tex_panel.png` (bordered square + rivets), `rc_tex_rock.png` (noise + a few dark blobs), `rc_tex_floor.png` (tile grid), `rc_tex_ceil.png` (flat + a light square). Use `pngjs` or the `canvas` package if available; else emit a raw PNG via a tiny encoder. Each must **tile seamlessly** (wrap the pattern). Keep them small (few KB).

### Step 2: Copy p3 → p8b

```bash
mkdir -p demo-src/raycaster-p8b/assets
cp demo-src/raycaster-p3/assets/rc_placeholder_tiles.png demo-src/raycaster-p8b/assets/ 2>/dev/null || cp demo-src/raycaster-p6/assets/rc_placeholder_tiles.png demo-src/raycaster-p8b/assets/
for f in RcConfig RcWorld RcCast RcRender RcMover RcLights RcActor RcActors; do cp demo-src/raycaster/lib/$f.bas demo-src/raycaster-p8b/$f.bas; done
cp demo-src/raycaster-p3/RoomViewScene.bas demo-src/raycaster-p8b/TextureScene.bas   # then rename the class inside
cp demo-src/raycaster-p3/Main.bas demo-src/raycaster-p8b/Main.bas                     # then point it at TextureScene
```
(p3 ships `RcActor`/`RcActors`? check — if not, copy from canonical anyway; `raycasterDemoLibSync` only checks files present in both dirs, but `RcRender.bas` has `dim a as RcActor` so a standalone transpile needs `RcActor.bas`. Copy all 8, matching p7/p8.)

- `TextureScene.bas`: rename `Class` → keep `Class`/`Extends scene`, rename any `RoomViewScene` identifier; in `onenter` after `new RcRender(...)` add `self.ren.setWallTexture("rc_tex_concrete.png")` / `setFloorTexture("rc_tex_floor.png")` / `setCeilTexture("rc_tex_ceil.png")`. Keep the FPS readout. Add `runProbes()`.
- `Main.bas`: `dim scn = new TextureScene()` / register+switch `"textures"`.
- `assets/p8broom.stm`: copy `p3room.stm`, add `tex:rc_tex_brick.png` on the north wall cells, `tex:rc_tex_panel.png` on the east wall, `tex:rc_tex_rock.png` on one pillar; leave the rest to the defaults. Keep p3's `floor:` steps.

### Step 3: Probes (`TextureScene.runProbes`)

Copy the `probe(label, passed, y)` helper verbatim (p7/p8 style). Probes:
1. `dim pc as RcCast` / cast at a `tex:rc_tex_brick.png`-tagged wall → `pc.spanTex(pc.spanCount()-1) = "rc_tex_brick.png"`.
2. cast at an untagged wall → `spanTex = ""` (falls back to the scene default at render time, not in the span).
3. cast at a diagonal (if the room has one — p3 may not; if not, skip or add one diag cell) → `spanU` strictly in `(0, 1)`.
4. `self.ren.renderFrame()` runs ERR-free with textures set.
5. `wallTexFor` resolution: after `setWallTexture`, an untagged cell resolves to the default; a tagged cell resolves to its tag. (Expose nothing new — probe via `self.ren` if a getter exists, else fold into probe 4 as "renderFrame didn't throw with a default + a tag both in view".)
6. a floor-textured cast/render sanity (`floorTexFor` default resolves).

### Step 4: Build + wire

- `npm run build:demo -- demo-src/raycaster-p8b RaycasterP8bTextures` → `src/docs/demos/RaycasterP8bTextures.b4wgl.json`.
- `devDemoRegistry.ts`: `{ slug: 'raycaster-p8b-textures', name: 'Raycaster P8b — Textures', tags: ['Raycaster', 'Engine Phase'], description: 'Textured walls, floors and ceilings — a retextured copy of the P3 room. Wall columns blit via drawImageStrip; horizontal surfaces via a perspective-correct drawFloorStrip.', docsSlug: '', file: 'RaycasterP8bTextures' }`
- `devDemoRegistry.test.ts`: presence test.
- `demos.cy.ts` `DEV_DEMOS`: `{ slug: 'raycaster-p8b-textures', title: 'Raycaster P8b — Textures', waitMs: 4000 }`
- `raycasterDemoProbes.test.ts`: P8b case `{ dir: 'demo-src/raycaster-p8b', stm: 'p8broom.stm', sceneGlobal: '_sb_texturescene', probeCount: <N> }`. The `makeSbStub` needs a `drawImageStrip` / `drawFloorStrip` no-op and `_sbAssets`-style texture-size — but probes run `onenter`/`runProbes`, not a real render frame; if probe 4 calls `renderFrame` the stub's auto-vivifying proxy covers `drawing.*`. Confirm.

### Step 5: Verify

`npx vitest run raycasterDemo devDemoRegistry drawing generatedDefsInSync` → PASS. `npx vite build` → clean.

### Step 6: Commit `feat: raycaster-p8b-textures demo`

---

## Task 8: Full verification + manual

- [ ] `npx vitest run` → no new failures (the `[vitest-worker] Timeout onTaskUpdate` unhandled error under load is a known infra flake, not a failure).
- [ ] `npx vite build` → clean.
- [ ] `npm run dev` + `npx cypress run --spec cypress/e2e/demos.cy.ts` → p1–p8b ERR-free (re-run once on a flake).
- [ ] **Manual (user drives):** seed `raycaster-p8b-textures`, Run, walk it. Check: walls show the tagged textures + the concrete default; a wall behind a floor-step shows its texture V-clipped (not stretched); the floor/ceiling textures are perspective-correct (squares stay square toward the horizon, not swimming); lighting tints the textures smoothly; diagonal walls (if present) show a non-repeating slice. Report.
- [ ] If `drawFloorStrip` looks wrong (swimming / stretched / not tiling), that's the §5 risk — the implementer notes which mesh mechanism was used; iterate on it or fall back per the ladder.
- [ ] Commit any texture / stm / mesh tuning.

---

## Task 9: Docs

- [ ] **`docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`** §5.2: "As built (texturing 2026-09-03): wall spans blit `drawing.drawImageStrip(tex, srcX = u·RC_TEX_SIZE, …, tint, srcVTop, srcVBot)` — tint = distance·light·side-dim, srcV clipped to the visible interval; horizontal surfaces blit `drawing.drawFloorStrip` (a pooled `PIXI.PerspectiveMesh` per strip, world-tiled UVs). Untextured cells keep the flat grey path." §5.3 rung 3: mark `drawImageStrip(tint)` DONE. §6.3: billboard tint DONE (`drawActors` passes `sampleAt` light). §11: add a "Texturing (2026-09-03)" milestone note before Phase 9, and update Phase 9's framing ("now there's textured drawing to profile").
- [ ] **`src/docs/api-reference/drawing.md`** — `drawImageStrip` new optional params; new `drawFloorStrip`. (Done in Tasks 2/3 — confirm complete.)
- [ ] **`src/docs/guides/raycaster-library.md`** — a "Textures" subsection: `tex:` / `ftex:` / `ctex:` markers, `ren.setWallTexture/setFloorTexture/setCeilTexture` defaults, textures are full asset names, authored at `RC_TEX_SIZE` (64), must tile. Update "Phase 3 limits" — walls/floors/ceilings are textured now; still no atlas, no animated textures, upper-region surfaces still flat, sky still a gradient.
- [ ] **`docs/roadmap.md`** item 28 + **`docs/language/library-roadmap.md`** — a "Texturing shipped (2026-09-03)" clause; note Phase 9 (optimisation) is now well-motivated (PerspectiveMesh-per-strip + `_texCache` growth to profile).
- [ ] `npx vitest run` → PASS.
- [ ] Commit `docs: raycaster texturing shipped`

---

## Self-Review

**Spec coverage:** §1.1 `drawImageStrip` tint+V → Task 2. §1.2 `drawFloorStrip` → Task 3. §2.1 texture defaults → Task 5. §2.2 textured walls → Task 5. §2.3 textured surfaces + `distAtScreenY` → Task 6. §2.4 diagonal U → Task 4. §2.5 `RC_TEX_SIZE` → Task 1. §3 assets+demo → Task 7. §4 out-of-scope — nothing to build. §5 risk — Task 3 + Task 8 fallback note. Six-step: descriptor/engine (2,3), tests (each), docs (2,3,9), roadmap (9).

**Placeholder scan:** Task 3's `drawFloorStrip` UV mechanism is deliberately "implementer picks against a checkerboard test" with an explicit fallback ladder + acceptance bar — the highest-uncertainty item, appropriately bounded not hand-waved. Task 7 probe count is `<N>` (filled once the probes are written). No `TODO`/`TBD`.

**Type/name consistency:** `drawImageStrip(imageName, srcX, destX, destY, destWidth, destHeight, tint, srcVTop, srcVBot)` and `drawFloorStrip(imageName, destX, yNear, yFar, wNearX, wNearY, wFarX, wFarY, stripW, tint)` — identical across descriptor, engine, `drawWallInto`, `drawSurfaceInto`, tests. `RC_TEX_SIZE = 64`. `defWallTex`/`defFloorTex`/`defCeilTex`, `setWallTexture`/`setFloorTexture`/`setCeilTexture`, `wallTexFor`/`floorTexFor`/`ceilTexFor`, `packTint`, `drawWallInto`, `distAtScreenY`. softBASIC → TS: `drawimagestrip`/`drawfloorstrip`/`spanu`/`setwalltexture` etc.

**Sync coverage:** RcConfig p1–p8 (Task 1), RcCast p2–p8 (Task 4), RcRender p3–p8 (Tasks 2/5/6), all 8 into p8b (Task 7). `raycasterDemoLibSync` in every verify step. The regex widening (Task 1) makes `p8b` covered by transpile/libsync/smoke.

**Ordering:** RcConfig+regex → drawImageStrip (engine) → drawFloorStrip (engine) → RcCast diag-U → RcRender walls (needs drawImageStrip) → RcRender surfaces (needs drawFloorStrip + diag not required) → demo (needs all) → verify → docs. `drawImageStrip` stays back-compatible (undefined trailing args) so `drawActors` isn't broken between Task 2 Step 4 and Step 5. No forward refs.

**Risk isolation:** Task 3 (`drawFloorStrip` mesh) is the one that could go sideways. Tasks 4–5 (diagonal U + textured *walls*) don't depend on it — if Task 3 blocks, the wall-texturing 80% still lands and Task 6 can ship option-C (affine quad) as the documented fallback.
