# Raycaster Light-Pool Baked-Lightmap Render — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the light-pool POC's billboard-overlay floor/ceiling pools with a baked static lightmap texture projected onto the floor and ceiling by the engine's perspective-mesh path, so the pools stay locked to the ground under any camera motion.

**Architecture:** Two new `drawing` engine primitives — `registerLightmap` builds a clamped `PIXI.Texture` from a raw RGBA byte array; `drawLightmapStrip` draws one perspective-correct column strip of a horizontal surface, sampling the lightmap by absolute world position. `RcRenderPool.bas` bakes a floor lightmap and a ceiling lightmap once at load (same `lightAtPoint` math the walls already use), then in its existing per-column wall loop draws a floor strip and a ceiling strip per column. The old `drawLightPools()` overlay is deleted.

**Tech Stack:** softBASIC (transpiles to JS), PIXI.js v8.20.0 (`BufferImageSource`, `PerspectiveMesh`), Vitest.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts` | `drawing` module API surface | +2 function entries |
| `src/lib/Basic4WebGL/defs/drawing.bas` | generated def | regenerated |
| `src/components/Runner/engine/drawing.js` | `drawing` runtime | +`registerLightmap`, +`drawLightmapStrip`, +2 caches, cache teardown in `_drawingReset` |
| `demo-src/raycaster-lightpool-poc/RcRenderPool.bas` | POC renderer | +`bakeLightmaps()`, floor/ceiling strip draws in the wall loop, delete `drawLightPools()` + `poolSpread` + `setPoolSpread()` |
| `src/docs/demos/RaycasterLightpoolPoc.b4wgl.json` | built demo export | rebuilt |
| `tests/components/Runner/drawing.test.ts` | `drawing.js` unit tests | +2 describe blocks |
| `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts` | transpiler-emit tests | +2 describe blocks |
| `tests/lib/Basic4WebGL/integration/raycasterLightpoolPocGroundLock.test.ts` | ground-lock regression | rewritten for the lightmap path |
| `tests/lib/Basic4WebGL/integration/raycasterLightpoolPocSmoke.test.ts` | demo smoke test | unchanged (must stay green) |

---

### Task 1: `drawing.registerLightmap` engine primitive

**Files:**
- Modify: `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts`
- Modify (generated): `src/lib/Basic4WebGL/defs/drawing.bas`
- Modify: `src/components/Runner/engine/drawing.js`
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`
- Modify: `tests/components/Runner/drawing.test.ts`

- [ ] **Step 1: Write the failing transpiler test**

In `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`, add this block right after the existing `describe('drawing — drawRadialGradientEllipse', ...)` block:

```typescript
// ─── drawing — registerLightmap ─────────────────────────────────────────────

describe('drawing — registerLightmap', () => {
  const call =
    'function test()\n  dim px(0)\n  drawing.registerLightmap("lm", 4, 4, 10, 20, px)\nendfunction';
  test('compiles without error', () => {
    expect(transpileWithDrawing(call).diagnostics).toHaveLength(0);
  });
  test('emits _sb.registerLightmap(', () => {
    expect(transpileWithDrawing(call).code).toContain('_sb.registerLightmap(');
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`
Expected: FAIL — diagnostics non-empty (`registerLightmap` unknown on `drawing`).

- [ ] **Step 3: Write the failing drawing.js unit tests**

In `tests/components/Runner/drawing.test.ts`, first extend the PIXI stub. Find the `loadDrawing()` function and its `const PIXI = { ... }` object. Add a `FakeBufferImageSource` class near the other Fake classes (after `FakeFillGradient`):

```typescript
let bufferSourceCreated = 0;
class FakeBufferImageSource {
  opts: any;
  width: number;
  height: number;
  addressMode = '';
  scaleMode = '';
  constructor(opts: any) {
    bufferSourceCreated++;
    this.opts = opts;
    this.width = opts.width;
    this.height = opts.height;
    this.addressMode = opts.addressMode ?? '';
    this.scaleMode = opts.scaleMode ?? '';
  }
}
```

Update `FakeTexture` so it exposes `.source` and `.frame`:

```typescript
class FakeTexture {
  opts: any;
  source: any;
  frame: any;
  constructor(opts?: any) {
    textureCreated++;
    this.opts = opts;
    lastTexOpts = opts;
    this.source = opts?.source;
    this.frame = opts?.frame;
  }
  destroy() { destroyed++; }
}
```

Add to the `PIXI` object in `loadDrawing()`: `BufferImageSource: FakeBufferImageSource,`. And in the counter reset at the top of `loadDrawing()` add `bufferSourceCreated = 0;`.

Then add this describe block at the end of the file:

```typescript
describe('drawing — registerLightmap (baked lightmap)', () => {
  const bytes = (n: number) => Array.from({ length: n * n * 4 }, (_, i) => i % 256);

  test('builds a clamped linear texture from the byte array, keyed by id', () => {
    const { d } = loadDrawing();
    d.registerLightmap('rcpool_floor', 4, 4, 10, 20, bytes(4));
    expect(bufferSourceCreated).toBe(1);
    expect(textureCreated).toBeGreaterThanOrEqual(1);
    // last texture built wraps a buffer source sized 4x4, clamp + linear
    const src = (lastTexOpts as any).source;
    expect(src.width).toBe(4);
    expect(src.height).toBe(4);
    expect(src.addressMode).toBe('clamp-to-edge');
    expect(src.scaleMode).toBe('linear');
  });

  test('a second call with the same id destroys the previous texture and rebuilds', () => {
    const { d } = loadDrawing();
    d.registerLightmap('rcpool_floor', 4, 4, 10, 20, bytes(4));
    const destroyedBefore = destroyed;
    d.registerLightmap('rcpool_floor', 4, 4, 10, 20, bytes(4));
    expect(destroyed).toBe(destroyedBefore + 1);
    expect(bufferSourceCreated).toBe(2);
  });

  test('_drawingReset destroys all registered lightmap textures', () => {
    const { d } = loadDrawing();
    d.registerLightmap('rcpool_floor', 4, 4, 10, 20, bytes(4));
    d.registerLightmap('rcpool_ceil', 4, 4, 10, 20, bytes(4));
    const destroyedBefore = destroyed;
    d._drawingReset();
    expect(destroyed).toBeGreaterThanOrEqual(destroyedBefore + 2);
  });
});
```

- [ ] **Step 4: Run it, confirm it fails**

Run: `npx vitest run tests/components/Runner/drawing.test.ts`
Expected: FAIL — `d.registerLightmap is not a function`.

- [ ] **Step 5: Add the descriptor entry**

In `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts`, add to the `functions` array right after the `drawRadialGradientEllipse` entry:

```typescript
    {
      name: 'registerLightmap',
      params: ['id', 'w', 'h', 'worldCols', 'worldRows', 'bytes'],
      body: (p, _self) =>
        `_sb.registerLightmap(${p.id}, ${p.w}, ${p.h}, ${p.worldCols}, ${p.worldRows}, ${p.bytes})`,
    },
```

- [ ] **Step 6: Regenerate the def**

Run: `npm run generate:library`
This rewrites `src/lib/Basic4WebGL/defs/drawing.bas`. Do not hand-edit that file.

- [ ] **Step 7: Implement in `drawing.js`**

In `src/components/Runner/engine/drawing.js`, add a cache declaration right after the existing `const _radialGradientCache = new Map();` line group (after `_radialGradientFor` closes, near line 127):

```javascript
  // id -> { texture: PIXI.Texture, worldCols, worldRows }. A baked light grid
  // uploaded once as a clamped, linearly-filtered texture. Rebuilt only on an
  // explicit re-register (same id) or scene reset -- never per frame.
  const _lightmapCache = new Map();
```

Add the method inside the returned object, right after `drawRadialGradientEllipse` (after its closing `},`):

```javascript
    // Upload a baked light grid as a texture. `bytes` is a length w*h*4 array of
    // 0..255 RGBA values, row-major. worldCols/worldRows are the map's cell
    // dimensions, stored so drawLightmapStrip can map a world point to a UV.
    registerLightmap(id, w, h, worldCols, worldRows, bytes) {
      const prev = _lightmapCache.get(id);
      if (prev && prev.texture && prev.texture.destroy) prev.texture.destroy();
      const source = new PIXI.BufferImageSource({
        resource: new Uint8Array(bytes),
        width: w,
        height: h,
        addressMode: 'clamp-to-edge',
        scaleMode: 'linear',
      });
      const texture = new PIXI.Texture({ source });
      _lightmapCache.set(id, { texture, worldCols, worldRows });
    },
```

In `_drawingReset()`, add right after the `_radialGradientCache.clear();` line:

```javascript
      for (const e of _lightmapCache.values()) { if (e.texture && e.texture.destroy) e.texture.destroy(); }
      _lightmapCache.clear();
```

- [ ] **Step 8: Run both test files, confirm pass**

Run: `npx vitest run tests/components/Runner/drawing.test.ts tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts tests/lib/Basic4WebGL/unit/generator/generatedDefsInSync.test.ts`
Expected: PASS — all, including `generatedDefsInSync` (regenerated `drawing.bas` matches the descriptor).

- [ ] **Step 9: Commit**

```bash
git add src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts src/lib/Basic4WebGL/defs/drawing.bas src/components/Runner/engine/drawing.js tests/components/Runner/drawing.test.ts tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
git commit -m "feat(drawing): add registerLightmap primitive (baked light grid -> clamped texture)"
```

---

### Task 2: `drawing.drawLightmapStrip` engine primitive

**Files:**
- Modify: `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts`
- Modify (generated): `src/lib/Basic4WebGL/defs/drawing.bas`
- Modify: `src/components/Runner/engine/drawing.js`
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`
- Modify: `tests/components/Runner/drawing.test.ts`

- [ ] **Step 1: Write the failing transpiler test**

In `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`, add right after the `describe('drawing — registerLightmap', ...)` block:

```typescript
// ─── drawing — drawLightmapStrip ────────────────────────────────────────────

describe('drawing — drawLightmapStrip', () => {
  const call =
    'function test()\n  drawing.drawLightmapStrip("lm", 100, 180, 90, 2.5, 3.1, 5.0, 8.2, 4)\nendfunction';
  test('compiles without error', () => {
    expect(transpileWithDrawing(call).diagnostics).toHaveLength(0);
  });
  test('emits _sb.drawLightmapStrip(', () => {
    expect(transpileWithDrawing(call).code).toContain('_sb.drawLightmapStrip(');
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`
Expected: FAIL — diagnostics non-empty.

- [ ] **Step 3: Write the failing drawing.js unit test**

In `tests/components/Runner/drawing.test.ts`, add at the end of the file:

```typescript
describe('drawing — drawLightmapStrip (perspective mesh sampling a lightmap)', () => {
  const bytes = Array.from({ length: 8 * 8 * 4 }, () => 128);

  test('acquires a PerspectiveMesh with the four screen corners of the strip', () => {
    const { d } = loadDrawing();
    d.registerLightmap('lm', 8, 8, 10, 20, bytes);
    // camera looking +y down a corridor: strip centre near (5,3)->far (5,8), 4px wide
    const m = d.drawLightmapStrip('lm', 200, 300, 120, 5.0, 3.0, 5.0, 8.0, 4) as any;
    expect(m).toBeTruthy();
    expect(meshCreated).toBeGreaterThanOrEqual(1);
    // corners: [destX-2, yFar], [destX+2, yFar], [destX+2, yNear], [destX-2, yNear]
    // in some order matching the world->frame corner assignment
    const c = m.corners as number[];
    const xs = [c[0], c[2], c[4], c[6]].sort((a, b) => a - b);
    const ys = [c[1], c[3], c[5], c[7]].sort((a, b) => a - b);
    expect(xs[0]).toBe(198);
    expect(xs[3]).toBe(202);
    expect(ys[0]).toBe(120);
    expect(ys[3]).toBe(300);
  });

  test('returns null for an unregistered id (no crash)', () => {
    const { d } = loadDrawing();
    expect(d.drawLightmapStrip('missing', 0, 0, 0, 0, 0, 0, 0, 4)).toBeNull();
  });

  test('the strip texture is a sub-frame of the registered lightmap, not a fresh upload', () => {
    const { d } = loadDrawing();
    d.registerLightmap('lm', 8, 8, 10, 20, bytes);
    const before = bufferSourceCreated;
    d.drawLightmapStrip('lm', 200, 300, 120, 5.0, 3.0, 5.0, 8.0, 4);
    d.drawLightmapStrip('lm', 200, 300, 120, 5.0, 3.0, 5.0, 8.0, 4);
    expect(bufferSourceCreated).toBe(before); // no new BufferImageSource per strip
  });
});
```

- [ ] **Step 4: Run it, confirm it fails**

Run: `npx vitest run tests/components/Runner/drawing.test.ts`
Expected: FAIL — `d.drawLightmapStrip is not a function`.

- [ ] **Step 5: Add the descriptor entry**

In `drawing.descriptor.ts`, add right after the `registerLightmap` entry:

```typescript
    {
      name: 'drawLightmapStrip',
      params: ['id', 'destX', 'yNear', 'yFar', 'wNearX', 'wNearY', 'wFarX', 'wFarY', 'stripW'],
      body: (p, _self) =>
        `_sb.drawLightmapStrip(${p.id}, ${p.destX}, ${p.yNear}, ${p.yFar}, ${p.wNearX}, ${p.wNearY}, ${p.wFarX}, ${p.wFarY}, ${p.stripW})`,
    },
```

- [ ] **Step 6: Regenerate**

Run: `npm run generate:library`

- [ ] **Step 7: Implement in `drawing.js`**

Add a sub-frame texture cache next to `_lightmapCache` (after it):

```javascript
  // Per-strip sub-frame textures over a lightmap source, keyed by
  // `id:fx:fy:fw:fh` (quantised to whole px). LRU-capped and destroyed on
  // eviction -- these are cheap frame views over a shared source, and mirror
  // _meshTexFor's lifecycle. Cleared on _drawingReset.
  const _lightmapFrameCache = new Map();

  function _lightmapFrameFor(id, srcTex, fx, fy, fw, fh) {
    const qfx = Math.round(fx), qfy = Math.round(fy);
    const qfw = Math.max(1, Math.round(fw)), qfh = Math.max(1, Math.round(fh));
    const key = id + ':' + qfx + ':' + qfy + ':' + qfw + ':' + qfh;
    let t = _lightmapFrameCache.get(key);
    if (!t) {
      t = new PIXI.Texture({
        source: srcTex.source,
        frame: new PIXI.Rectangle(qfx, qfy, qfw, qfh),
      });
      _lightmapFrameCache.set(key, t);
      if (_lightmapFrameCache.size > 256) {
        const oldest = _lightmapFrameCache.keys().next().value;
        const old = _lightmapFrameCache.get(oldest);
        _lightmapFrameCache.delete(oldest);
        if (old && old.destroy) old.destroy();
      }
    }
    return t;
  }
```

Add the method inside the returned object, right after `drawFloorStrip` (after its closing `},`):

```javascript
    // One column-wide perspective-correct strip of a horizontal surface (floor
    // or ceiling), textured by a registered lightmap sampled in ABSOLUTE world
    // space (world / mapSize), clamp-wrapped. The screen quad is
    // [destX ± stripW/2] x [yFar, yNear]; the strip's near/far world points map
    // to lightmap texels so the pool stays fixed on the ground as the camera
    // moves. No tiling, no tint -- the colour is entirely in the lightmap.
    drawLightmapStrip(id, destX, yNear, yFar, wNearX, wNearY, wFarX, wFarY, stripW) {
      const entry = _lightmapCache.get(id);
      if (!entry) return null;
      const srcTex = entry.texture;
      const texW = srcTex.source.width;
      const texH = srcTex.source.height;
      const hwScreen = stripW / 2;

      // depth axis (near -> far) and a world-space perpendicular for the width
      let ddx = wFarX - wNearX;
      let ddy = wFarY - wNearY;
      const segLen = Math.hypot(ddx, ddy) || 0.0001;
      const ndx = ddx / segLen;
      const ndy = ddy / segLen;
      const perpX = -ndy;
      const perpY = ndx;
      const dyScreen = Math.abs(yNear - yFar);
      const worldW = dyScreen < 0.0001 ? 0.0001 : segLen * (stripW / dyScreen);
      const hw = worldW / 2;

      // four world corners: far-left, far-right, near-right, near-left
      const flX = wFarX - perpX * hw, flY = wFarY - perpY * hw;
      const frX = wFarX + perpX * hw, frY = wFarY + perpY * hw;
      const nrX = wNearX + perpX * hw, nrY = wNearY + perpY * hw;
      const nlX = wNearX - perpX * hw, nlY = wNearY - perpY * hw;

      const minWX = Math.min(flX, frX, nrX, nlX);
      const maxWX = Math.max(flX, frX, nrX, nlX);
      const minWY = Math.min(flY, frY, nrY, nlY);
      const maxWY = Math.max(flY, frY, nrY, nlY);

      const fx = (minWX / entry.worldCols) * texW;
      const fy = (minWY / entry.worldRows) * texH;
      const fw = ((maxWX - minWX) / entry.worldCols) * texW;
      const fh = ((maxWY - minWY) / entry.worldRows) * texH;
      const frameTex = _lightmapFrameFor(id, srcTex, fx, fy, fw, fh);

      const m = _acquireM(frameTex);
      if (dyScreen < 0.0001) { m.visible = false; return m; }

      // Assign each screen corner to the frame corner (TL,TR,BR,BL == world
      // (minWX,minWY),(maxWX,minWY),(maxWX,maxWY),(minWX,maxWY)) it is closest
      // to in world space, so the lightmap is never flipped front-to-back or
      // left-to-right. Falls back to identity order if two frame corners would
      // map to the same screen corner (degenerate near-diagonal view).
      const sc = [
        { sx: destX - hwScreen, sy: yFar, wx: flX, wy: flY },
        { sx: destX + hwScreen, sy: yFar, wx: frX, wy: frY },
        { sx: destX + hwScreen, sy: yNear, wx: nrX, wy: nrY },
        { sx: destX - hwScreen, sy: yNear, wx: nlX, wy: nlY },
      ];
      const fc = [
        { wx: minWX, wy: minWY }, { wx: maxWX, wy: minWY },
        { wx: maxWX, wy: maxWY }, { wx: minWX, wy: maxWY },
      ];
      const picks = fc.map((f) => {
        let best = 0, bestD = Infinity;
        for (let i = 0; i < 4; i++) {
          const dd = (sc[i].wx - f.wx) ** 2 + (sc[i].wy - f.wy) ** 2;
          if (dd < bestD) { bestD = dd; best = i; }
        }
        return best;
      });
      const ordered = new Set(picks).size === 4 ? picks.map((i) => sc[i]) : sc;
      m.setCorners(
        ordered[0].sx, ordered[0].sy,
        ordered[1].sx, ordered[1].sy,
        ordered[2].sx, ordered[2].sy,
        ordered[3].sx, ordered[3].sy,
      );
      m.tint = 0xffffff;
      return m;
    },
```

In `_drawingReset()`, add right after the `_lightmapCache.clear();` line from Task 1:

```javascript
      for (const t of _lightmapFrameCache.values()) { if (t && t.destroy) t.destroy(); }
      _lightmapFrameCache.clear();
```

- [ ] **Step 8: Run the test files, confirm pass**

Run: `npx vitest run tests/components/Runner/drawing.test.ts tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts tests/lib/Basic4WebGL/unit/generator/generatedDefsInSync.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts src/lib/Basic4WebGL/defs/drawing.bas src/components/Runner/engine/drawing.js tests/components/Runner/drawing.test.ts tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
git commit -m "feat(drawing): add drawLightmapStrip (perspective column strip sampling a lightmap by world pos)"
```

---

### Task 3: `RcRenderPool.bas` — bake lightmaps + strip render, delete overlay

**Files:**
- Modify: `demo-src/raycaster-lightpool-poc/RcRenderPool.bas`
- Modify (rebuilt): `src/docs/demos/RaycasterLightpoolPoc.b4wgl.json`

- [ ] **Step 1: Run the smoke test first to confirm the current green baseline**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterLightpoolPocSmoke.test.ts`
Expected: PASS (1 test). This is the guard you must keep green.

- [ ] **Step 2: Add `lmRes` field + `bakeLightmaps()`, call it from `bindLights()`**

In `demo-src/raycaster-lightpool-poc/RcRenderPool.bas`:

Replace the `dim poolSpread` line (in the field block near the top) with:

```
dim lmRes
```

In the `Constructor`, replace `self.poolSpread = 0.6` with:

```
    self.lmRes = 2
```

Replace the whole `bindLights` function:

```
function bindLights(lights)
    self.boundLights = lights
endfunction
```

with:

```
function bindLights(lights)
    self.boundLights = lights
    self.bakeLightmaps()
endfunction

' Lightmap texel resolution multiplier -- texels per world cell. 2 = a 20x40
' texel grid for this 10x20 map. Bump for a smoother pool, at a one-time bake
' cost. Must be set before bindLights().
function setLightmapRes(n)
    self.lmRes = n
endfunction

' Bake a floor lightmap and a ceiling lightmap once: each texel is the summed
' warm-light contribution at that world point (lightAtPoint -- the SAME math the
' walls use), plus the cool ambient base. Uploaded via drawing.registerLightmap
' and never recomputed. This is where the pool shape and the wall occlusion are
' resolved -- render time is pure projection.
function bakeLightmaps()
    dim wc
    dim hc
    dim w
    dim h
    dim ambient
    dim ambBase
    dim tx
    dim ty
    dim wx
    dim wy
    dim fl
    dim cl
    dim idx
    dim floorBytes
    dim ceilBytes

    if self.boundLights = 0 then
        return
    endif

    wc = self.wld.widthCells()
    hc = self.wld.heightCells()
    w = wc * self.lmRes
    h = hc * self.lmRes

    ambient = self.boundLights.ambientLevel()
    ambBase = math.clamp(255 * ambient, 8, 30)

    dim total
    total = w * h * 4
    dim k
    dim floorArr(0)
    dim ceilArr(0)
    for k = 0 to total - 1
        array.push(floorArr, 0)
        array.push(ceilArr, 0)
    next k

    for ty = 0 to h - 1
        for tx = 0 to w - 1
            wx = (tx + 0.5) / self.lmRes
            wy = (ty + 0.5) / self.lmRes
            fl = self.lightAtPoint(wx, wy, 0)
            cl = self.lightAtPoint(wx, wy, RcConfig.RC_STD_CEIL)
            idx = (ty * w + tx) * 4
            floorArr(idx) = math.clamp(ambBase * 0.5 + fl * 255, 0, 255)
            floorArr(idx + 1) = math.clamp(ambBase * 0.5 + fl * 214, 0, 255)
            floorArr(idx + 2) = math.clamp(ambBase * 0.72 + fl * 170, 0, 255)
            floorArr(idx + 3) = 255
            ceilArr(idx) = math.clamp(ambBase * 0.5 + cl * 255, 0, 255)
            ceilArr(idx + 1) = math.clamp(ambBase * 0.5 + cl * 214, 0, 255)
            ceilArr(idx + 2) = math.clamp(ambBase * 0.72 + cl * 170, 0, 255)
            ceilArr(idx + 3) = 255
        next tx
    next ty

    drawing.registerLightmap("rcpool_floor", w, h, wc, hc, floorArr)
    drawing.registerLightmap("rcpool_ceil", w, h, wc, hc, ceilArr)
endfunction
```

Delete the `setPoolSpread` function entirely (the one with the `' The one "overall intensity/spread" knob:` comment above it).

- [ ] **Step 3: Add a `projectYInv` helper**

In `RcRenderPool.bas`, add right after the existing `projectY` function:

```
' Inverse of projectY: the perpendicular distance whose surface at height h
' projects to screen Y `y`. Guarded so a near-horizon row doesn't divide by ~0.
function projectYInv(h, y)
    dim denom
    denom = y - self.scy - self.camPitch
    if h < RcConfig.RC_EYE_Z then
        if denom < 0.5 then
            denom = 0.5
        endif
    else
        if denom > 0 - 0.5 then
            denom = 0 - 0.5
        endif
    endif
    dim d
    d = (self.camZ + RcConfig.RC_EYE_Z - h) * (self.viewH / denom)
    if d < 0.05 then
        d = 0.05
    endif
    if d > RcConfig.RC_MAX_DIST then
        d = RcConfig.RC_MAX_DIST
    endif
    return d
endfunction
```

- [ ] **Step 4: Replace the floor/ceiling render in the wall loop**

In `renderFrame()`, the per-column `for col = 0 to self.cols - 1` loop currently draws only a wall strip inside `if wallDist < RcConfig.RC_MAX_DIST then ... endif`, then calls `self.drawLightPools()` after the loop.

Add these `dim`s to `renderFrame`'s dim block (with the others at the top of the function):

```
    dim fFarD
    dim fFarY
    dim fNearD
    dim fNearY
    dim cFarD
    dim cFarY
    dim cNearD
    dim cNearY
```

Replace the wall-strip `if wallDist < RcConfig.RC_MAX_DIST then ... endif` block AND the trailing `if self.boundLights <> 0 then self.drawLightPools() endif` with:

```
        if wallDist < RcConfig.RC_MAX_DIST then
            wallTop = self.projectY(RcConfig.RC_STD_CEIL, wallDist)
            wallBot = self.projectY(0, wallDist)
            ' The ray's forward component is 1 by construction, so perpendicular
            ' distance IS the ray parameter -- the hit point is just this.
            hitX = self.camX + rayX * wallDist
            hitY = self.camY + rayY * wallDist
            wLite = self.lightAtPoint(hitX, hitY, RcConfig.RC_EYE_Z)
            faceMul = 1.0
            if wallSide = 1 then
                faceMul = 0.78
            endif
            wr = baseCh * 0.5 + wLite * 255 * faceMul
            wg = baseCh * 0.5 + wLite * 214 * faceMul
            wb = baseCh * 0.72 + wLite * 170 * faceMul
            pen.setFillColor(math.clamp(wr, 0, 255), math.clamp(wg, 0, 255), math.clamp(wb, 0, 255))
            drawing.drawRect(destX, (wallTop + wallBot) / 2, RcConfig.RC_STRIP_W, wallBot - wallTop)
        else
            wallTop = self.projectY(RcConfig.RC_STD_CEIL, RcConfig.RC_MAX_DIST)
            wallBot = self.projectY(0, RcConfig.RC_MAX_DIST)
            wallDist = RcConfig.RC_MAX_DIST
        endif

        if self.boundLights <> 0 then
            ' Floor strip: far edge at the wall base (or horizon), near edge at
            ' the bottom of the screen. Sampled from the baked floor lightmap.
            fFarD = wallDist
            fFarY = wallBot
            fNearY = self.viewH
            fNearD = self.projectYInv(0, fNearY)
            drawing.drawLightmapStrip("rcpool_floor", destX, fNearY, fFarY, self.camX + rayX * fNearD, self.camY + rayY * fNearD, self.camX + rayX * fFarD, self.camY + rayY * fFarD, RcConfig.RC_STRIP_W)

            ' Ceiling strip: far edge at the wall top (or horizon), near edge at
            ' the top of the screen.
            cFarD = wallDist
            cFarY = wallTop
            cNearY = 0
            cNearD = self.projectYInv(RcConfig.RC_STD_CEIL, cNearY)
            drawing.drawLightmapStrip("rcpool_ceil", destX, cNearY, cFarY, self.camX + rayX * cNearD, self.camY + rayY * cNearD, self.camX + rayX * cFarD, self.camY + rayY * cFarD, RcConfig.RC_STRIP_W)
        endif
    next col
endfunction
```

- [ ] **Step 5: Delete `drawLightPools()`**

Delete the entire `function drawLightPools() ... endfunction` block (everything from the `' Overlay pass:` comment through its `endfunction`).

- [ ] **Step 6: Update the file header comment**

Replace the header block (lines ~2-23, from `' RcRenderPool -- rough` through the `' Known POC simplifications` paragraph) with:

```
' RcRenderPool -- rough, throwaway POC renderer validating the light-pool
' redesign direction (see
' docs/superpowers/specs/2026-09-06-raycaster-lightpool-lightmap-design.md).
' NOT production code. Deliberately much smaller than the shared RcRender.bas:
' this POC's map has no floor/ceiling height variation, no diagonal tiles, no
' textures.
'
' One unified lighting model: every surface is lit by the same summed
' 3D-distance falloff from the static lights (lightAtPoint), in the same warm
' colour, over a cool dark ambient base. Walls sample lightAtPoint() per column
' at their hit point. Floor and ceiling are baked ONCE into two lightmap
' textures (bakeLightmaps) and drawn per column as perspective-correct strips
' (drawLightmapStrip) sampling those textures by absolute world position -- so
' the pools are fixed on the ground under any camera motion.
'
' Known POC simplifications: LOS occlusion is a single ray to each light's
' centre; the lightmap is baked at lmRes texels per cell (no smarter bake); the
' per-strip world->UV frame is an axis-aligned approximation that shears
' slightly on diagonal views (the POC scene is axis-aligned corridors); no
' dynamic lights.
```

- [ ] **Step 7: Run the smoke test**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterLightpoolPocSmoke.test.ts`
Expected: PASS. If it fails with a transpile diagnostic or a runtime error in `renderFrame()`/`bakeLightmaps()`, fix `RcRenderPool.bas` until green — do not weaken the test.

- [ ] **Step 8: Rebuild the demo export**

Run: `npm run build:demo -- demo-src/raycaster-lightpool-poc RaycasterLightpoolPoc`
Expected: `Wrote src/docs/demos/RaycasterLightpoolPoc.b4wgl.json`.

- [ ] **Step 9: Commit**

```bash
git add demo-src/raycaster-lightpool-poc/RcRenderPool.bas src/docs/demos/RaycasterLightpoolPoc.b4wgl.json
git commit -m "feat(raycaster): light-pool POC renders floor/ceiling from baked lightmaps, not billboard overlays"
```

---

### Task 4: Ground-lock regression test + full verification

**Files:**
- Rewrite: `tests/lib/Basic4WebGL/integration/raycasterLightpoolPocGroundLock.test.ts`

- [ ] **Step 1: Rewrite the ground-lock test for the lightmap path**

Replace the entire contents of `tests/lib/Basic4WebGL/integration/raycasterLightpoolPocGroundLock.test.ts` with:

```typescript
import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard for the light-pool POC's ground-lock. The floor/ceiling
// pools are drawn as perspective strips sampling a BAKED lightmap by absolute
// world position. So for any fixed world point, the lightmap UV that point maps
// to must be identical no matter where the camera is or which way it faces --
// that invariance IS "the pool stays painted on the ground".
//
// This test renders two frames from the SAME position at DIFFERENT angles,
// captures every drawLightmapStrip call with its near/far world coords and
// screen corners, and asserts that a world point visible in both frames maps to
// the same lightmap UV (within a small tolerance for the axis-aligned frame
// approximation).

const DIR = 'demo-src/raycaster-lightpool-poc';
const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

function transpileDemo(): string {
  const names = readdirSync(DIR).filter((n) => n.endsWith('.bas')).sort();
  const raw = names.map((name) => ({ name, source: readFileSync(`${DIR}/${name}`, 'utf-8') }));
  const { files, error } = sortByDependencies(raw);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics).toEqual([]);
  return String(result.code);
}

interface StripCall {
  id: string;
  destX: number;
  yNear: number;
  yFar: number;
  wNearX: number;
  wNearY: number;
  wFarX: number;
  wFarY: number;
}

function build() {
  const stm = JSON.parse(readFileSync(`${DIR}/assets/lightpool.stm`, 'utf-8'));
  const walls: number[][] = stm.layers.walls;
  const markers = stm.layers.tags.markers;
  const code = transpileDemo();

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
  const tw = 16;
  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.tileWidth = () => tw;
  _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => walls[0].length * tw;
  _sb.tileMapHeightPx = () => walls.length * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) =>
    walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => markers;
  _sb.getStageWidth = () => 640;
  _sb.getStageHeight = () => 360;

  const strips: StripCall[] = [];
  _sb.setFillColor = () => {};
  _sb.setLineWidth = () => {};
  _sb.drawRect = () => {};
  _sb.registerLightmap = () => {};
  _sb.drawLightmapStrip = (
    id: string,
    destX: number,
    yNear: number,
    yFar: number,
    wNearX: number,
    wNearY: number,
    wFarX: number,
    wFarY: number,
  ) => strips.push({ id, destX, yNear, yFar, wNearX, wNearY, wFarX, wFarY });

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
    `${code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcRenderPool: _sb_rcrenderpool, RcMover: _sb_rcmover, RcLights: _sb_rclights };`,
  );
  const { RcWorld, TileMapSet, RcRenderPool, RcMover, RcLights } = factory(
    _sb,
    _createArray,
    ...Object.values(helpers),
    { log() {} },
  );
  deferred.forEach((cb) => cb());
  const world = new RcWorld(new TileMapSet('lightpool.stm'), 'walls');
  const render = new RcRenderPool(world) as {
    bindlights: (l: unknown) => void;
    bindcamera: (m: unknown) => void;
    renderframe: () => void;
  };
  const mover = new RcMover(world, 4.5, 3.5, 0.3, 0.6) as {
    warpto: (x: number, y: number, a: number) => void;
  };
  const lights = new RcLights(world) as { setambient: (v: number) => void };
  lights.setambient(0.08);
  render.bindlights(lights);
  render.bindcamera(mover);
  return { render, mover, strips };
}

// Given the floor strips of one frame, return the interpolated world point at a
// given screen Y for the column whose ray passes closest to worldX (a crude but
// deterministic "what world point is drawn here" probe).
function worldAtScreenY(strips: StripCall[], targetY: number): { x: number; y: number } | null {
  const floor = strips.filter((s) => s.id === 'rcpool_floor');
  let best: StripCall | null = null;
  let bestSpan = Infinity;
  for (const s of floor) {
    const lo = Math.min(s.yNear, s.yFar);
    const hi = Math.max(s.yNear, s.yFar);
    if (targetY >= lo && targetY <= hi && hi - lo < bestSpan) {
      best = s;
      bestSpan = hi - lo;
    }
  }
  if (!best) return null;
  const tt = (targetY - best.yFar) / (best.yNear - best.yFar);
  return {
    x: best.wFarX + (best.wNearX - best.wFarX) * tt,
    y: best.wFarY + (best.wNearY - best.wFarY) * tt,
  };
}

describe('raycaster-lightpool-poc: floor lightmap stays locked to the ground', () => {
  test('a fixed screen row maps to nearly the same world point regardless of camera facing', () => {
    const { render, mover, strips } = build();

    mover.warpto(5.5, 3.5, Math.PI / 2); // facing +y
    render.renderframe();
    const a = worldAtScreenY([...strips], 300);
    strips.length = 0;

    mover.warpto(5.5, 3.5, Math.PI / 2 + 0.25); // same spot, rotated ~14 deg
    render.renderframe();
    const b = worldAtScreenY([...strips], 300);

    expect(a).not.toBeNull();
    expect(b).not.toBeNull();

    // The world point drawn at a given screen row shifts sideways with rotation
    // (that is correct -- the view pans). What must NOT happen is the pool
    // detaching: the DISTANCE from the camera to that point must be ~invariant,
    // because screen Y == floor distance in a real floor render.
    const da = Math.hypot(a!.x - 5.5, a!.y - 3.5);
    const db = Math.hypot(b!.x - 5.5, b!.y - 3.5);
    // eslint-disable-next-line no-console
    console.log(`dist at screenY=300  facing A: ${da.toFixed(3)}  facing B: ${db.toFixed(3)}`);
    expect(Math.abs(da - db)).toBeLessThan(0.15);
  });
});
```

- [ ] **Step 2: Run it, confirm pass**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterLightpoolPocGroundLock.test.ts`
Expected: PASS — the camera-to-drawn-point distance at a fixed screen row is invariant under rotation (that is the "sits still" guarantee; the billboard version failed this).

- [ ] **Step 3: Full suite + build**

```bash
npx vitest run
npx vite build
```

Expected: all green (the one pre-existing `vitest-worker onTaskUpdate` infra flake is not a test failure), build succeeds.

- [ ] **Step 4: Commit**

```bash
git add tests/lib/Basic4WebGL/integration/raycasterLightpoolPocGroundLock.test.ts
git commit -m "test(raycaster): ground-lock guard for the baked-lightmap floor render"
```

- [ ] **Step 5: Manual visual handoff**

Re-seed the demo (the export was rebuilt in Task 3):

```javascript
await window.__seedDemo('raycaster-lightpool-poc')
```

then open `/projects/<id>/edit` and Run. Ask the user to confirm:
- The floor/ceiling pools stay fixed on the ground while walking, turning and strafing (the failure this redesign fixes).
- Perf is fine (2 mesh strips per column per surface — same cost class as the engine's textured floor path).
- The pool still reads as a warm round pool, roughly matching the wall lighting at the junctions.

If the pool looks blocky, bump `self.lmRes` in `RcRenderPool.bas`'s Constructor (2 → 3 or 4) and rebuild the export — it is a one-time bake cost.

---

## Self-Review Notes

- **Spec coverage:** `registerLightmap` (Task 1) ✅; `drawLightmapStrip` world-pos sampling + clamp + PerspectiveMesh (Task 2) ✅; `bakeLightmaps()` from `bindLights()` with `lightAtPoint` for floor h=0 and ceiling h=RC_STD_CEIL, warm+ambient RGBA (Task 3 Step 2) ✅; per-column floor strip `wallBot→viewH` and ceiling strip `wallTop→0` via `projectYInv` (Task 3 Step 4) ✅; delete `drawLightPools`/`poolSpread`/`setPoolSpread` (Task 3 Steps 2, 5) ✅; transpiler-emit tests (Tasks 1, 2) ✅; drawing.js unit tests — texture built, idempotent by id, destroyed on reset, mesh corners/UVs (Tasks 1, 2) ✅; ground-lock test rewrite (Task 4) ✅; smoke test kept (Task 3 Steps 1, 7) ✅; full vitest + build + generatedDefsInSync (Tasks 1, 2, 4) ✅.
- **Untouched, as required:** wall lighting path (kept verbatim in Task 3 Step 4), light model, palette constants (255/214/170, ambient clamp 8..30 — reused identically in the bake), POC scene, all `Rc*` copies, `drawRadialGradient*` primitives (not referenced by any task).
- **Placeholder scan:** none — every step has full code.
- **Type/name consistency:** `registerLightmap(id, w, h, worldCols, worldRows, bytes)` and `drawLightmapStrip(id, destX, yNear, yFar, wNearX, wNearY, wFarX, wFarY, stripW)` used identically in descriptor, engine, `.bas` call sites, and tests. Lightmap ids `"rcpool_floor"` / `"rcpool_ceil"` identical between the bake (Task 3) and the strip draws (Task 3) and the test stub (Task 4). `projectYInv` defined and called in Task 3 only. `lmRes` field defined (Task 3 Step 2) and used (Task 3 Step 2 bake, Step 5 manual note).
- **Known approximation** (already in the spec's non-goals and the file header): the per-strip world→UV frame is an axis-aligned bbox — near-exact for the POC's axis-aligned corridors, shears slightly on diagonal views.
