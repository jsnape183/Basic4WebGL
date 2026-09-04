# Raycaster Wall-Mesh Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a runtime-selectable second wall-rendering path to the softBASIC raycaster that draws all textured wall columns as one `PIXI.Mesh` per texture (1–4 draw calls) instead of ~360 pooled sprites, toggled live in `raycaster-p9-bench` for A/B evaluation.

**Architecture:** A new `drawing.wallColumn(...)` / `drawing.wallFlush()` engine primitive accumulates per-column quad data into per-image buffers, then emits one mesh per image with per-column vertex geometry and a per-vertex light-tint colour. `RcRender` gains a `useWallMesh` flag; when set, its `RC_SPAN_WALL` branch calls `wallColumn` instead of `drawWallStrip`, and calls `wallFlush` after the column loop. Everything else — cast, floor/ceiling, steps, diagonals, colour, actors, the `.bas` API — is untouched. `useWallMesh` defaults `0`, so the whole feature is inert until `raycaster-p9-bench`'s `M` key turns it on.

**Tech Stack:** softBASIC (`.bas` → transpiled JS), PIXI.js v8.20.0 (CDN), Vitest (fake-PIXI harness), `scripts/buildDemo.ts`.

**Spec:** `docs/superpowers/specs/2026-09-04-raycaster-wall-mesh-spike-design.md` — read it, especially §2 (primitive), §3 (RcRender), §8 (risks).

**Conventions (CLAUDE.md):** work on `main`, no branch; every `.bas` in a `raycaster-p*` dir must stay byte-identical to `demo-src/raycaster/lib/` (`raycasterDemoLibSync` enforces); rebuild affected `src/docs/demos/Raycaster*.b4wgl.json` after lib changes with `npx vite-node scripts/buildDemo.ts <dir> <Slug>` (NOT `npm run build:demo -- …` — npm 11 drops the args); verify builds with `npx vite build`, never `tsc`; `[vitest-worker]: Timeout calling "onTaskUpdate"` is a known flake; commit messages end `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

**Recent context this builds on:** commit `381e5c4` made `drawing.js` stamp every pooled object with `o.zIndex = _DRAW_Z_BASE + _drawSeq++` (module-scope `const _DRAW_Z_BASE = 1_000_000; let _drawSeq = 0;`) and only `addChild` when `o.parent !== worldContainer` — the mesh follows the same pattern. `time.now()` (→ `performance.now()`) and `world.fps()` (→ `app.ticker.FPS`) exist as of `c56ae14`.

---

## File Structure

**Modified:**
- `src/components/Runner/engine/drawing.js` — `+wallColumn`, `+wallFlush`, `+_wallBuffers` map, `+_wallPool` map, `+_wallShader`, teardown in `_drawingReset`
- `tests/components/Runner/drawing.test.ts` — `FakeMesh` / `FakeGeometry` / `FakeBuffer` / `FakeShader` in the harness; new `describe('drawing — wallColumn/wallFlush')`
- `demo-src/raycaster/lib/RcRender.bas` — `wallColSetup` helper (factored from `drawWallStrip`), `useWallMesh` field, `setWallMesh` / `wallMeshMs`, mesh branch + flush in `renderFrame`, `primitiveCount` accounting; **synced to `raycaster-p1…p9-bench`**
- `demo-src/raycaster-p9-bench/BenchScene.bas` — `M` toggle, `meshOn` field, HUD line
- `src/docs/demos/RaycasterP9Bench.b4wgl.json` + the p3–p8-tiers exports (RcRender sync) — rebuilt

**Created:**
- `docs/raycaster-mesh-spike-findings.md` — skeleton for the user's verdict

**Untouched:** `RcCast.bas`, `RcWorld.bas`, `RcMover.bas`, `RcConfig.bas`, `RcLights.bas`, all `.bas` def files, the manifest, every non-p9-bench demo's behaviour.

---

## Task 1: `drawing.wallColumn` / `wallFlush` engine primitive

**Files:**
- Modify: `src/components/Runner/engine/drawing.js`
- Test: `tests/components/Runner/drawing.test.ts`

### Context for the implementer

`drawing.js` is an IIFE returning an object of `_sb.*` methods. It has `worldContainer` and `_sbAssets` in scope (injected in the test, module-global in prod). PIXI v8.20 is on the global `PIXI`. Existing mesh precedent: `_acquireM` / `PIXI.PerspectiveMesh` for `drawFloorStrip`.

You are building a batched wall renderer. Per frame, `RcRender` calls `wallColumn(...)` once per visible textured wall column (just an array push — no drawing), then `wallFlush()` once. `wallFlush` turns each per-image buffer into **one `PIXI.Mesh`**: 2 triangles per column, positions = the column's screen-space quad, UVs = a thin vertical slice at `srcU`, per-vertex colour = the column's light tint.

**PIXI v8.20 mesh — primary approach (per-vertex tint via custom shader):**

```js
// module scope, alongside the other pools
const _wallBuffers = new Map();   // imageName -> { x:[], top:[], bot:[], u:[], vt:[], vb:[], tint:[] }
const _wallPool = new Map();      // imageName -> { mesh, geom, cap }  (cap = column capacity)
let _wallShader = null;

function _wallShaderInstance() {
  if (_wallShader) return _wallShader;
  _wallShader = PIXI.Shader.from({
    gl: {
      vertex: `
        in vec2 aPosition;
        in vec2 aUV;
        in vec4 aColor;
        uniform mat3 uProjectionMatrix;
        uniform mat3 uWorldTransformMatrix;
        uniform mat3 uTransformMatrix;
        out vec2 vUV;
        out vec4 vColor;
        void main() {
          mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
          gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
          vUV = aUV;
          vColor = aColor;
        }`,
      fragment: `
        in vec2 vUV;
        in vec4 vColor;
        uniform sampler2D uTexture;
        out vec4 fragColor;
        void main() { fragColor = texture(uTexture, vUV) * vColor; }`,
    },
    resources: { uTexture: PIXI.Texture.WHITE.source },  // replaced per-mesh below
  });
  return _wallShader;
}
```

The exact uniform names PIXI v8.20 injects into a mesh shader (`uProjectionMatrix` / `uWorldTransformMatrix` / `uTransformMatrix`) may differ — **verify against a working PIXI v8 mesh** (e.g. inspect `PIXI.MeshPipe` defaults or a quick console test) and adjust. If a per-mesh texture resource can't be swapped on a shared shader cleanly, build one shader per pooled mesh.

**Documented fallback (if the custom shader can't be made to work in a reasonable time box):** use `new PIXI.Mesh({ geometry, texture })` with the default material and set `mesh.tint` to the **mid-run column's** tint (single per-mesh light). Note in your report + the findings doc that lighting is per-mesh in the spike, per-column in the full version. This still answers the structural question (textures, perspective, occlusion, cliff).

**Geometry (updatable, capacity-based):**

```js
function _acquireWallMesh(imageName, colCount) {
  let entry = _wallPool.get(imageName);
  const need = Math.max(64, Math.ceil(colCount / 64) * 64);
  if (!entry || entry.cap < need) {
    if (entry) { entry.mesh.destroy(); entry.geom.destroy(); }
    const verts = need * 4, idxN = need * 6;
    const pos = new Float32Array(verts * 2);
    const uv  = new Float32Array(verts * 2);
    const col = new Float32Array(verts * 4);
    const idx = new Uint32Array(idxN);
    for (let c = 0; c < need; c++) {
      const b = c * 4;
      idx.set([b, b + 1, b + 2, b + 1, b + 3, b + 2], c * 6);
    }
    const geom = new PIXI.Geometry({
      attributes: {
        aPosition: pos,
        aUV: uv,
        aColor: col,
      },
      indexBuffer: idx,
    });
    // keep JS-side refs so wallFlush can mutate + re-upload
    geom._posArr = pos; geom._uvArr = uv; geom._colArr = col;
    const mesh = new PIXI.Mesh({ geometry: geom, shader: _wallShaderInstance() });
    entry = { mesh, geom, cap: need };
    _wallPool.set(imageName, entry);
  }
  return entry;
}
```

(If `PIXI.Geometry`'s attribute-from-plain-array shorthand isn't available in v8.20, wrap each in `new PIXI.Buffer({ data, usage: PIXI.BufferUsage.VERTEX | PIXI.BufferUsage.COPY_DST })` — INDEX usage for the index buffer — and read `geom.getBuffer('aPosition')` to update. Verify.)

- [ ] **Step 1: Add the fake-PIXI harness classes**

In `tests/components/Runner/drawing.test.ts`, after `FakePerspectiveMesh`, add:

```ts
let wallMeshCreated = 0;
class FakeBuffer { data: unknown; updated = 0; constructor(o: any) { this.data = o?.data ?? o; } update() { this.updated++; } }
class FakeGeometry {
  attributes: any; indexBuffer: any; _posArr: any; _uvArr: any; _colArr: any; destroyed = 0;
  constructor(o: any) { this.attributes = o?.attributes ?? {}; this.indexBuffer = o?.indexBuffer; }
  getBuffer(name: string) { return this.attributes?.[name]?.buffer ?? this.attributes?.[name] ?? { update() {} }; }
  destroy() { this.destroyed++; }
}
class FakeShader { resources: any; static from(o: any) { return new FakeShader(o); } constructor(o?: any) { this.resources = o?.resources ?? {}; } }
class FakeMesh {
  geometry: any; shader: any; texture: any; tint = 0xffffff; visible = true; zIndex = 0;
  parent: unknown = undefined; position = { set() {} };
  constructor(o: any) { wallMeshCreated++; this.geometry = o?.geometry; this.shader = o?.shader; this.texture = o?.texture; }
  destroy() { destroyed++; }
}
```

Register them in `loadDrawing()`'s `PIXI` object:
```ts
    Mesh: FakeMesh, Geometry: FakeGeometry, Shader: FakeShader, Buffer: FakeBuffer,
    BufferUsage: { VERTEX: 1, INDEX: 2, COPY_DST: 4 },
```
Add `Texture.WHITE = { source: {} }` to the `FakeTexture`-based `Texture` stub (a static prop): after `class FakeTexture { … }`, `(FakeTexture as any).WHITE = { source: {} };` and pass `FakeTexture` as `Texture` (already done). Reset `wallMeshCreated = 0` in `loadDrawing()`.

- [ ] **Step 2: Write the failing test**

Add to `drawing.test.ts`:

```ts
describe('drawing — wallColumn / wallFlush (batched wall mesh)', () => {
  test('wallFlush emits one mesh per distinct image with 6 indices per column', () => {
    const { d, worldContainer } = loadDrawing();
    d.wallColumn('brick.png', 10, 20, 180, 0.25, 0, 1, 0xff8080);
    d.wallColumn('brick.png', 14, 30, 170, 0.30, 0, 1, 0xff8080);
    d.wallColumn('panel.png', 200, 40, 160, 0.50, 0.1, 0.9, 0xffffff);
    d.wallFlush();
    const meshes = worldContainer.children.filter((c: any) => c instanceof (globalThis as any).FakeMesh || c.geometry);
    expect(meshes.length).toBe(2);                         // brick + panel
    const brick = meshes.find((m: any) => m.geometry._colArr.some((v: number) => v !== 1 && v !== 0));
    // 2 columns -> 8 verts -> positions length 16, colors length 32; indexBuffer holds >= 12 used entries
    expect(brick.geometry._posArr.length).toBeGreaterThanOrEqual(16);
    expect(brick.geometry._uvArr.length).toBeGreaterThanOrEqual(16);
  });

  test('a second wallFlush with no wallColumn calls draws an empty (zero-area) mesh', () => {
    const { d } = loadDrawing();
    d.wallColumn('brick.png', 10, 20, 180, 0.25, 0, 1, 0xffffff);
    d.wallFlush();
    d.wallFlush();  // buffers cleared -> all quads zero-area
    // no throw; the mesh's used column count is 0
    expect(true).toBe(true);
  });

  test('wallColumn packs the passed quad: positions span [x±2, top..bot], uv.x == srcU', () => {
    const { d, worldContainer } = loadDrawing();
    d.wallColumn('brick.png', 100, 50, 150, 0.5, 0, 1, 0xffffff);
    d.wallFlush();
    const m = worldContainer.children.find((c: any) => c.geometry);
    const pos = m.geometry._posArr;
    // first quad: 4 verts (x-2,top)(x+2,top)(x-2,bot)(x+2,bot) — RC_STRIP_W hardcoded 4 in RcRender, but wallColumn is passed destX only; the half-width must be a param OR a module const in drawing.js
    expect([pos[0], pos[2], pos[4], pos[6]].sort((a: number, b: number) => a - b)).toEqual([98, 98, 102, 102]);
    const uv = m.geometry._uvArr;
    expect(uv[0]).toBeCloseTo(0.5);
  });

  test('_drawingReset destroys the wall mesh pool', () => {
    const { d } = loadDrawing();
    d.wallColumn('brick.png', 10, 20, 180, 0.25, 0, 1, 0xffffff);
    d.wallFlush();
    const before = wallMeshCreated;
    d._drawingReset();
    d.wallColumn('brick.png', 10, 20, 180, 0.25, 0, 1, 0xffffff);
    d.wallFlush();
    expect(wallMeshCreated).toBe(before + 1);  // pool was cleared, mesh re-created
  });
});
```

(The `wallColumn` signature is `(imageName, destX, topY, botY, srcU, srcVTop, srcVBot, tint)`. The strip half-width: hardcode a module const `const _WALL_HALF_W = 2;` in `drawing.js` — the raycaster's `RC_STRIP_W` is 4, so half is 2. If a future consumer needs a different width, add a param; not now.)

- [ ] **Step 3: Run — expect FAIL**

```bash
npx vitest run drawing -t "wallColumn"
```

Expected: FAIL (`d.wallColumn is not a function`).

- [ ] **Step 4: Implement `wallColumn` / `wallFlush` in `drawing.js`**

Add the module-scope `_wallBuffers` / `_wallPool` / `_wallShader` / `_WALL_HALF_W` declarations (near the other pools). Add `_wallShaderInstance` and `_acquireWallMesh` (code above, adjusted to the real v8.20 API). Add to the returned object:

```js
    wallColumn(imageName, destX, topY, botY, srcU, srcVTop, srcVBot, tint) {
      let b = _wallBuffers.get(imageName);
      if (!b) { b = { x: [], top: [], bot: [], u: [], vt: [], vb: [], tint: [] }; _wallBuffers.set(imageName, b); }
      b.x.push(destX); b.top.push(topY); b.bot.push(botY);
      b.u.push(srcU); b.vt.push(srcVTop); b.vb.push(srcVBot); b.tint.push(tint);
    },

    // Returns the number of meshes drawn (0..N) so RcRender can account primitiveCount.
    wallFlush() {
      let meshCount = 0;
      for (const [imageName, b] of _wallBuffers) {
        const n = b.x.length;
        const entry = _acquireWallMesh(imageName, n);
        const { mesh, geom, cap } = entry;
        const pos = geom._posArr, uv = geom._uvArr, col = geom._colArr;
        for (let c = 0; c < cap; c++) {
          const vb = c * 8, cb = c * 16;
          if (c < n) {
            const x0 = b.x[c] - _WALL_HALF_W, x1 = b.x[c] + _WALL_HALF_W;
            const yt = b.top[c], yd = b.bot[c];
            pos[vb] = x0; pos[vb + 1] = yt;  pos[vb + 2] = x1; pos[vb + 3] = yt;
            pos[vb + 4] = x0; pos[vb + 5] = yd; pos[vb + 6] = x1; pos[vb + 7] = yd;
            const u = b.u[c], vt = b.vt[c], vd = b.vb[c];
            uv[vb] = u; uv[vb + 1] = vt;  uv[vb + 2] = u; uv[vb + 3] = vt;
            uv[vb + 4] = u; uv[vb + 5] = vd; uv[vb + 6] = u; uv[vb + 7] = vd;
            const t = b.tint[c];
            const r = ((t >> 16) & 255) / 255, g = ((t >> 8) & 255) / 255, bl = (t & 255) / 255;
            for (let v = 0; v < 4; v++) { col[cb + v * 4] = r; col[cb + v * 4 + 1] = g; col[cb + v * 4 + 2] = bl; col[cb + v * 4 + 3] = 1; }
          } else {
            for (let k = 0; k < 8; k++) pos[vb + k] = 0;   // zero-area
          }
        }
        // re-upload — adjust to the real buffer-update call for v8.20
        const upd = (name) => { const buf = geom.getBuffer ? geom.getBuffer(name) : null; if (buf && buf.update) buf.update(); };
        upd('aPosition'); upd('aUV'); upd('aColor');
        mesh.texture = _texFor(imageName, 0, 0, 1);  // full source (srcX 0, whole V) — the sprite path uses a 1px frame; a full-source texture is fine here, UVs do the slicing. If _texFor's 1px frame is wrong for a mesh, use a plain PIXI.Texture on the source.
        if (mesh.shader && mesh.shader.resources) mesh.shader.resources.uTexture = mesh.texture.source;
        mesh.zIndex = _DRAW_Z_BASE + _drawSeq++;
        if (mesh.parent !== worldContainer) worldContainer.addChild(mesh);
        mesh.visible = true;
        meshCount++;
      }
      _wallBuffers.clear();
      return meshCount;
    },
```

Note `_texFor(imageName, 0, 0, 1)` builds a `Rectangle(0, 0, 1, height)` — a **1px-wide** frame, wrong for a mesh whose UVs address the whole image. Instead add a tiny helper `_fullTexFor(imageName)` that caches one `PIXI.Texture` per image over the whole source (`frame` = full `base.width × base.height` or just `new PIXI.Texture({ source: base.source })`), and use that. Add it near `_texFor`.

In `_drawingReset()`, before the cache clears, add:
```js
      for (const e of _wallPool.values()) { if (e.mesh?.destroy) e.mesh.destroy(); if (e.geom?.destroy) e.geom.destroy(); }
      _wallPool.clear();
      _wallBuffers.clear();
      _wallShader = null;
```

- [ ] **Step 5: Run — expect PASS**

```bash
npx vitest run drawing
```

Expected: all pass (existing 16 + 4 new).

- [ ] **Step 6: Full suite + build**

```bash
npx vitest run
npx vite build
```

Expected: full suite green (~2088 pass / 2 skip), build clean. If `vite build` fails on a PIXI symbol, the real `PIXI` global has it — the failure would be a typo in `drawing.js`.

- [ ] **Step 7: Commit**

```bash
git add src/components/Runner/engine/drawing.js tests/components/Runner/drawing.test.ts
git commit -m "feat(drawing): batched wall-mesh primitive (wallColumn / wallFlush)

One PIXI.Mesh per wall texture, 2 tris per column, per-vertex light tint.
Additive — nothing calls it yet. For the raycaster wall-mesh spike.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `RcRender` mesh path + toggle

**Files:**
- Modify: `demo-src/raycaster/lib/RcRender.bas` (+ sync to `raycaster-p1…p9-bench`)
- Modify: `src/docs/demos/RaycasterP3RoomView.b4wgl.json` … `RaycasterP9Bench.b4wgl.json` (rebuilt)
- Test: `tests/lib/Basic4WebGL/integration/raycasterWindowOcclusion.test.ts`

- [ ] **Step 1: Factor the wall tint + source-V math into a helper**

`drawWallStrip` (line ~573) computes `cTop/cBot/svTop/svBot/srcX/chan/tint` then draws. Extract the compute into a helper that stashes results in scratch fields so both paths use identical values. Add fields near the other `dim`s at the top of `RcRender.bas`:

```bas
dim wCTop
dim wCBot
dim wSrcU
dim wSvTop
dim wSvBot
dim wTint
dim useWallMesh
dim wallMeshMsLast
```

Add the helper (place it right before `drawWallStrip`):

```bas
' Compute the clipped screen span, source-V window, texture U and light tint for
' a wall column into self.wC*/wSrcU/wSv*/wTint. Returns 1 if the column is
' visible (something to draw), 0 if fully clipped. Both the sprite path
' (drawWallStrip) and the mesh path (renderFrame) call this so the A/B is exact.
function wallColSetup(wTop, wBot, winTop, winBot, u, lite, sideKind)
    dim sideDim
    dim srcX
    dim chan
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
    self.wCTop = wTop
    self.wCBot = wBot
    if self.wCTop < winTop then
        self.wCTop = winTop
    endif
    if self.wCBot > winBot then
        self.wCBot = winBot
    endif
    if self.wCBot <= self.wCTop then
        return 0
    endif
    srcX = math.floor(u * RcConfig.RC_TEX_SIZE)
    if srcX < 0 then
        srcX = 0
    endif
    if srcX >= RcConfig.RC_TEX_SIZE then
        srcX = RcConfig.RC_TEX_SIZE - 1
    endif
    self.wSrcU = (srcX + 0.5) / RcConfig.RC_TEX_SIZE
    chan = 255 * lite * sideDim
    self.wTint = self.packTint(chan, chan, chan + 25)
    self.wSvTop = (self.wCTop - wTop) / (wBot - wTop)
    self.wSvBot = (self.wCBot - wTop) / (wBot - wTop)
    return 1
endfunction
```

Rewrite `drawWallStrip` to use it:

```bas
function drawWallStrip(destX, wTop, wBot, winTop, winBot, tex, u, lite, sideKind)
    dim srcX
    if self.wallColSetup(wTop, wBot, winTop, winBot, u, lite, sideKind) = 0 then
        return 0
    endif
    srcX = math.floor(self.wSrcU * RcConfig.RC_TEX_SIZE)
    drawing.drawImageStrip(tex, srcX, destX, (self.wCTop + self.wCBot) / 2, RcConfig.RC_STRIP_W, self.wCBot - self.wCTop, self.wTint, self.wSvTop, self.wSvBot)
    self.primCount = self.primCount + 1
    return 1
endfunction
```

- [ ] **Step 2: Constructor + accessors**

In the Constructor, after `self.primCount = 0` (or wherever the field inits are): `self.useWallMesh = 0` and `self.wallMeshMsLast = 0`. Add:

```bas
function setWallMesh(v)
    self.useWallMesh = v
endfunction

function wallMeshMs()
    return self.wallMeshMsLast
endfunction
```

- [ ] **Step 3: Wire the mesh branch in `renderFrame`**

Add `dim wmT0` and `dim wmCount` to `renderFrame`'s `dim` block.

Replace the textured-wall draw at line ~811–812:

```bas
                if string.len(wtex) > 0 then
                    self.surfCountLast = self.surfCountLast + self.drawWallStrip(destX, sTop, sBot, winTop, winBot, wtex, self.rc.spanU(i), lite, self.rc.spanSide(i))
                else
```

with:

```bas
                if string.len(wtex) > 0 then
                    if self.useWallMesh = 1 then
                        if self.wallColSetup(sTop, sBot, winTop, winBot, self.rc.spanU(i), lite, self.rc.spanSide(i)) = 1 then
                            drawing.wallColumn(wtex, destX, self.wCTop, self.wCBot, self.wSrcU, self.wSvTop, self.wSvBot, self.wTint)
                        endif
                    else
                        self.surfCountLast = self.surfCountLast + self.drawWallStrip(destX, sTop, sBot, winTop, winBot, wtex, self.rc.spanU(i), lite, self.rc.spanSide(i))
                    endif
                else
```

After the `for col … next col` loop (find the loop's `next col`, then the `if self.boundActors <> 0 then self.drawActors() endif`), insert **before** `drawActors`:

```bas
    if self.useWallMesh = 1 then
        wmT0 = time.now()
        wmCount = drawing.wallFlush()
        self.wallMeshMsLast = time.now() - wmT0
        self.primCount = self.primCount + wmCount
    endif
```

- [ ] **Step 4: Test — mesh path produces the same visible span, fewer primitives**

Add to `tests/lib/Basic4WebGL/integration/raycasterWindowOcclusion.test.ts` (the harness there transpiles `raycaster-p3` and drives `RcRender` against a fake `_sb`). The fake `_sb` needs `wallcolumn` / `wallflush` stubs — add them to `makeRender`'s `_sb`:

```ts
  _sb.wallcolumn = (...a: unknown[]) => { wallCols.push(a); return undefined; };
  _sb.wallflush = () => { const n = new Set(wallCols.map((a) => a[0])).size; wallCols.length = 0; return n; };
```
where `wallCols` is a captured array passed into `makeRender` like `wallStrips`.

Test:
```ts
  test('wall-mesh path: same columns hit, collapses to drawImageStrip-free', () => {
    const strips: unknown[][] = [];
    const wallCols: unknown[][] = [];
    const r = makeRender({ ...openWorld, walltexat: () => 'w.png' }, [], strips, wallCols);
    (r as unknown as { setwallmesh(v: number): void }).setwallmesh(1);
    r.setcamera(2, 2, 0, 0);
    r.renderframe();
    expect(strips.length).toBe(0);              // no per-column sprites
    expect(wallCols.length).toBeGreaterThan(0); // columns went to the mesh buffer
    // toggle back off -> sprites return
    (r as unknown as { setwallmesh(v: number): void }).setwallmesh(0);
    strips.length = 0; wallCols.length = 0;
    r.renderframe();
    expect(strips.length).toBeGreaterThan(0);
    expect(wallCols.length).toBe(0);
  });
```

(Extend `makeRender`'s signature to accept the `wallCols` array; default `[]`.)

- [ ] **Step 5: Run the focused tests**

```bash
npx vitest run raycasterWindowOcclusion
```

Expected: PASS (existing + new).

- [ ] **Step 6: Sync + rebuild + raycaster suite**

```bash
for d in demo-src/raycaster-p3 demo-src/raycaster-p4 demo-src/raycaster-p5 demo-src/raycaster-p6 demo-src/raycaster-p7 demo-src/raycaster-p8-tiers demo-src/raycaster-p9-bench; do
  cp demo-src/raycaster/lib/RcRender.bas "$d/RcRender.bas"
done
npx vite-node scripts/buildDemo.ts demo-src/raycaster-p3 RaycasterP3RoomView
npx vite-node scripts/buildDemo.ts demo-src/raycaster-p4 RaycasterP4Walk
npx vite-node scripts/buildDemo.ts demo-src/raycaster-p5 RaycasterP5Lit
npx vite-node scripts/buildDemo.ts demo-src/raycaster-p6 RaycasterP6Actors
npx vite-node scripts/buildDemo.ts demo-src/raycaster-p7 RaycasterP7Diagonals
npx vite-node scripts/buildDemo.ts demo-src/raycaster-p8-tiers RaycasterP8Tiers
npx vite-node scripts/buildDemo.ts demo-src/raycaster-p9-bench RaycasterP9Bench
npx vitest run raycaster
```

(p1/p2 have no `RcRender.bas` — the list above is exactly the dirs that carry it.)

Expected: green. `raycasterDemoLibSync` byte-identity; `raycasterDemoTranspile` compiles `time.now()` + `drawing.wallColumn`/`wallFlush` (they're used in `RcRender` only under the `useWallMesh = 1` branch but still referenced — the transpiler resolves `drawing.wallColumn` against the `drawing` def; **if `drawing.bas` is descriptor-generated and doesn't declare `wallColumn`/`wallFlush`, the transpile fails** — see Step 7).

- [ ] **Step 7: Declare the new `drawing` methods in the def**

`drawing` IS descriptor-generated (`src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts`, per CLAUDE.md). Add `wallColumn` and `wallFlush` entries to the descriptor (mirror `drawImageStrip`'s entry shape — params `['imageName','destX','topY','botY','srcU','srcVTop','srcVBot','tint']` for `wallColumn`; no params for `wallFlush`, returns a number). Run `npm run generate:library`. Confirm `src/lib/Basic4WebGL/defs/drawing.bas` now has both and `tests/lib/Basic4WebGL/unit/generator/generatedDefsInSync.test.ts` passes. Also update `src/docs/api-reference/drawing.md` — a short entry each, marked *"experimental — used by the raycaster wall-mesh spike"*.

Re-run `npx vitest run raycaster` and `npx vitest run generatedDefsInSync softgfx`.

- [ ] **Step 8: Full suite + build + commit**

```bash
npx vitest run
npx vite build
git add -A
git commit -m "feat(raycaster): RcRender wall-mesh render path behind setWallMesh(v)

Factors the wall tint/source-V math into wallColSetup (shared by both
paths); when useWallMesh=1 the RC_SPAN_WALL branch feeds drawing.wallColumn
+ wallFlush instead of per-column drawImageStrip. Default off — inert
everywhere except when raycaster-p9-bench toggles it.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: `raycaster-p9-bench` M-key toggle + HUD

**Files:**
- Modify: `demo-src/raycaster-p9-bench/BenchScene.bas`
- Modify: `src/docs/demos/RaycasterP9Bench.b4wgl.json` (rebuilt)

- [ ] **Step 1: Bind the key + add the field**

In `BenchScene.bas` Constructor, after `input.bind("autop", "key", keyboard.P)`:
```bas
  input.bind("meshtoggle", "key", keyboard.M)
```
Add `dim meshOn` to the field block near `dim auto`. In `onenter` (or wherever `self.auto = 0` is set), add `self.meshOn = 0`.

- [ ] **Step 2: Toggle in `onupdate`**

After the existing `if input.pressed("autop") then … endif`:
```bas
  if input.pressed("meshtoggle") then
    self.meshOn = 1 - self.meshOn
    self.ren.setWallMesh(self.meshOn)
  endif
```

- [ ] **Step 3: HUD line**

Replace the `self.hudA.setText(...)` line (~152) with:

```bas
    dim meshLbl
    meshLbl = "off"
    if self.meshOn = 1 then
      meshLbl = "on"
    endif
    self.hudA.setText("avg " + string.str(math.floor(self.accum / self.frames)) + "ms   " + string.str(math.floor(world.fps())) + " fps   |   MESH " + meshLbl + "   " + string.str(self.ren.primitiveCount()) + " prim   flush " + string.str(math.floor(self.ren.wallMeshMs() * 1000) / 1000) + "ms   " + string.str(self.ren.columnCount()) + " cols   " + string.str(self.enemyN) + " foes   stress" + string.str(self.curSize))
```

(`dim meshLbl` must be at the **top** of whatever function this is in — move it up to that function's `dim` block, not mid-function.)

- [ ] **Step 4: Build + verify**

```bash
npx vite-node scripts/buildDemo.ts demo-src/raycaster-p9-bench RaycasterP9Bench
npx vitest run raycaster devDemoRegistry
npx vite build
```

Expected: green — `raycasterDemoProbes` P9-bench 5/5 (probes don't toggle mesh; `setWallMesh` / `wallMeshMs` resolve), `raycasterDemoTranspile` compiles the new `keyboard.M` bind + `setWallMesh` call, `raycasterDemoLibSync` still byte-identical.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(raycaster): raycaster-p9-bench — M toggles the wall-mesh path + HUD

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Findings doc + final verification + hand-off

**Files:**
- Create: `docs/raycaster-mesh-spike-findings.md`

- [ ] **Step 1: Write the skeleton**

```markdown
# Raycaster wall-mesh spike — findings

_Spec: docs/superpowers/specs/2026-09-04-raycaster-wall-mesh-spike-design.md_
_Toggle: `raycaster-p9-bench`, press `M`. HUD shows `MESH on/off`, `prim`, `flush <ms>`, `fps`._

## Setup used
- Shader path: **custom per-vertex tint** / **mesh.tint single per-mesh** (implementer fills in which)
- Texture filtering: (default linear / nearest)

## A/B observations (fill in after play-testing)

| | sprite path (M off) | mesh path (M on) |
|---|---|---|
| prim count (stress32, autopilot) | | |
| fps at stress32 | | |
| fps pushed hard (stress48 + close to a textured wall) | | |
| flush ms | n/a | |

### Visual
- Textures map correctly? 
- Perspective correct (no warping)? 
- Per-column light gradient present / matches sprite path? 
- Seams between column quads? 
- Occlusion against floor-steps correct (wall behind a step V-clipped)? 
- Anything that looks worse than the sprite path?

### Feel
- Does the cliff go away / soften? 
- Does this feel like "yes, this is the rendering path"? 

## Verdict

**[ pursue Option 1 / revert / another spike iteration ]**

One-line rationale:
```

- [ ] **Step 2: Full verification**

```bash
npx vitest run
npx vite build
```

Expected: full suite green (~2092 pass / 2 skip — +4 drawing, +1 occlusion; the `onTaskUpdate` flake tolerated), build clean.

- [ ] **Step 3: Commit**

```bash
git add docs/raycaster-mesh-spike-findings.md
git commit -m "docs: raycaster wall-mesh spike findings skeleton

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Hand off to the user**

Report:
- which shader path was used (custom per-vertex tint, or `mesh.tint` fallback) and why,
- the headless test numbers (prim count with mesh on vs off from the occlusion test),
- ask the user to run `raycaster-p9-bench`, press `M` on the autopilot, cycle sizes, push it hard, and fill in `docs/raycaster-mesh-spike-findings.md`,
- the revert path (spec §7) is one commit-range if the verdict is "revert",
- do NOT push, do NOT touch `src/docs/release-notes.md` or the version — and note the unpushed queue now includes the descope, the collision fix, all of Phase 9, `time.now()`/`world.fps()`, the O(n²) fix, and this spike.

---

## Self-Review

**Spec coverage:**
- §2 primitive (`wallColumn`/`wallFlush`, per-image buffers, per-texture mesh pool, 2 tris/column, per-vertex tint, full-source texture, zIndex, conditional addChild, `_drawingReset` teardown, shader + `mesh.tint` fallback) → Task 1. ✓
- §3 RcRender (`useWallMesh`/`setWallMesh`, `wallColSetup` factored helper shared by both paths, mesh branch at `RC_SPAN_WALL`, `wallFlush` after the loop, `primitiveCount` accounting, `wallMeshMs`, sync + rebuild) → Task 2. ✓
- §4 p9-bench toggle (`M`, `meshOn`, `setWallMesh` call, HUD `MESH on/off` + `flush ms`) → Task 3. ✓
- §5 testing (drawing.test.ts fake-PIXI additions + primitive test; raycaster suite green; occlusion test for the toggle) → Tasks 1, 2. ✓
- §6 deliverable (findings skeleton) → Task 4. ✓
- §8 risks — the shader-vs-tint fallback is explicit in Task 1 Step 4; UV seams / filtering are a findings-doc observation, not a build task (correct — the spike is *for* observing them). ✓
- The `drawing` descriptor-generated-def gotcha (Task 2 Step 7) is NOT in the spec but is a hard requirement — added as a task step so the transpile doesn't fail. ✓

**Placeholder scan:** Task 1's PIXI v8.20 API code carries explicit "verify against the real API and adjust" notes — that is deliberate latitude for a graphics spike where the exact v8.20 surface can't be confirmed from a CDN build offline, not a vague instruction; the *shape* (3 attributes, GLSL, construction order) is fully specified, and the fallback is concrete. The findings-doc table cells are the user's to fill — that's the deliverable's design. No "TBD"/"handle errors"/"similar to Task N".

**Type / name consistency:** `wallColumn(imageName, destX, topY, botY, srcU, srcVTop, srcVBot, tint)` — same 8 params in Task 1 (impl + test), Task 2 (RcRender call + `wallColSetup` outputs `wCTop`→topY, `wCBot`→botY, `wSrcU`→srcU, `wSvTop`→srcVTop, `wSvBot`→srcVBot, `wTint`→tint), Task 2 Step 7 (descriptor). `wallFlush()` returns mesh count — Task 1 impl returns `meshCount`, Task 2 Step 3 reads `wmCount = drawing.wallFlush()`. `setWallMesh` / `useWallMesh` / `wallMeshMs` / `wallMeshMsLast` — consistent Task 2 ↔ Task 3. `_DRAW_Z_BASE` / `_drawSeq` — from `381e5c4`, used in Task 1 `wallFlush` as they are elsewhere in `drawing.js`. `_WALL_HALF_W = 2` (half of `RC_STRIP_W = 4`) — Task 1 const, matches the test's `[98,98,102,102]` expectation for `destX=100`. ✓
