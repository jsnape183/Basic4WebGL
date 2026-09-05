# Raycaster Light-Pool POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate, as cheaply as possible, whether a screen-space radial-gradient "light pool" overlay can make a raycaster's static lights read as genuine round pools on floor/ceiling — including looking down a narrow corridor at a light in the room beyond, the exact case that broke the previous per-column-strip approach.

**Architecture:** A new PIXI-native `drawing.drawRadialGradientCircle` engine primitive (real, permanent capability — PIXI v8 has genuine GPU-interpolated radial gradients). A new standalone dev-only demo, `raycaster-lightpool-poc`, with straight unmodified copies of the shared raycaster library files plus one new renderer, `RcRenderPool.bas`, that flat-fills floor/ceiling with pure ambient colour (no per-column light sampling at all) and then overlays one radial-gradient circle per static light, projected to screen space using the same camera-plane transform the shared library already uses for actor billboards.

**Tech Stack:** softBASIC (transpiles to JS), PIXI.js v8.20.0 (native radial `FillGradient`), Vitest.

---

### Task 1: `drawing.drawRadialGradientCircle` engine primitive

**Files:**
- Modify: `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts`
- Modify (generated, do not hand-edit): `src/lib/Basic4WebGL/defs/drawing.bas`
- Modify: `src/components/Runner/engine/drawing.js`
- Modify: `tests/components/Runner/drawing.test.ts`
- Modify: `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`

- [ ] **Step 1: Write the failing transpiler test**

In `tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`, add this new `describe` block right after the existing `describe('drawing — drawFloorStrip', ...)` block (which ends around line 428 with `});`):

```typescript
// ─── drawing — drawRadialGradientCircle ──────────────────────────────────────

describe('drawing — drawRadialGradientCircle', () => {
  const call =
    'function test()\n  drawing.drawRadialGradientCircle(100, 120, 40, 255, 220, 160, 0.6)\nendfunction';
  test('compiles without error', () => {
    expect(transpileWithDrawing(call).diagnostics).toHaveLength(0);
  });
  test('emits _sb.drawRadialGradientCircle(', () => {
    expect(transpileWithDrawing(call).code).toContain('_sb.drawRadialGradientCircle(');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts`
Expected: FAIL — `drawing.drawRadialGradientCircle` is not a recognised function (diagnostics non-empty), because it doesn't exist in `drawing.bas` yet.

- [ ] **Step 3: Write the failing drawing.js unit tests**

In `tests/components/Runner/drawing.test.ts`, add this new `describe` block at the very end of the file (after the existing `describe('drawing — vertical gradient fill', ...)` block's closing `});`):

```typescript
describe('drawing — radial gradient fill (light-pool POC)', () => {
  test('drawRadialGradientCircle fills a circle with a radial gradient from the given colour to fully transparent', () => {
    const { d } = loadDrawing();
    const o = d.drawRadialGradientCircle(50, 60, 40, 255, 220, 160, 0.6) as FakeGraphics;
    const style = o.lastFill as {
      opts: {
        type: string;
        center: { x: number; y: number };
        innerRadius: number;
        outerCenter: { x: number; y: number };
        outerRadius: number;
        colorStops: Array<{ offset: number; color: { r: number; g: number; b: number; a: number } }>;
      };
    };
    expect(style.opts.type).toBe('radial');
    expect(style.opts.center).toEqual({ x: 0.5, y: 0.5 });
    expect(style.opts.innerRadius).toBe(0);
    expect(style.opts.outerCenter).toEqual({ x: 0.5, y: 0.5 });
    expect(style.opts.outerRadius).toBe(0.5);
    expect(style.opts.colorStops[0].offset).toBe(0);
    expect(style.opts.colorStops[0].color.a).toBeCloseTo(0.6, 5);
    expect(style.opts.colorStops[1].offset).toBe(1);
    expect(style.opts.colorStops[1].color.a).toBe(0);
  });

  test('is pooled exactly like drawCircle', () => {
    const { d } = loadDrawing();
    d.drawRadialGradientCircle(0, 0, 10, 255, 255, 255, 0.5);
    d.drawRadialGradientCircle(0, 0, 10, 255, 255, 255, 0.5);
    expect(gfxCreated).toBe(2);
    d.clearDrawing();
    d.drawRadialGradientCircle(0, 0, 10, 255, 255, 255, 0.5);
    d.drawRadialGradientCircle(0, 0, 10, 255, 255, 255, 0.5);
    expect(gfxCreated).toBe(2); // reused from the pool
  });

  test('reuses a cached PIXI.FillGradient for the same colour+alpha instead of allocating a new GPU resource every call', () => {
    // Same VRAM-exhaustion risk as drawVGradientRect (see that describe block) --
    // a per-light-per-frame overlay must not allocate a fresh gradient per call.
    const { d } = loadDrawing();
    for (let i = 0; i < 50; i++) {
      d.drawRadialGradientCircle(0, 0, 10, 255, 220, 160, 0.6);
    }
    expect(gradientCreated).toBe(1);
  });

  test('does not evict or destroy cached gradients no matter how many distinct colour+alpha pairs accumulate', () => {
    // Same regression guard as drawVGradientRect's cache -- see that describe
    // block for why an LRU cap here would crash the renderer.
    const { d } = loadDrawing();
    for (let i = 0; i < 1000; i++) {
      d.drawRadialGradientCircle(0, 0, 10, i % 256, 0, 0, 0.5);
    }
    expect(gradientDestroyed).toBe(0);
  });

  test('_drawingReset destroys the cached radial gradients too', () => {
    const { d } = loadDrawing();
    d.drawRadialGradientCircle(0, 0, 10, 255, 220, 160, 0.6);
    const createdBefore = gradientCreated;
    d._drawingReset();
    expect(gradientDestroyed).toBeGreaterThanOrEqual(createdBefore);
    d.drawRadialGradientCircle(0, 0, 10, 255, 220, 160, 0.6);
    expect(gradientCreated).toBe(createdBefore + 1); // rebuilt, not reused from a destroyed instance
  });
});
```

- [ ] **Step 4: Run it to confirm it fails**

Run: `npx vitest run tests/components/Runner/drawing.test.ts`
Expected: FAIL — `d.drawRadialGradientCircle is not a function`.

- [ ] **Step 5: Add the descriptor entry**

In `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts`, add this new function object to the `functions` array, right after the existing `drawVGradientRect` entry (before the closing `],`):

```typescript
    {
      name: 'drawRadialGradientCircle',
      params: ['x', 'y', 'radius', 'r', 'g', 'b', 'alpha'],
      body: (p, _self) =>
        `_sb.drawRadialGradientCircle(${p.x}, ${p.y}, ${p.radius}, ${p.r}, ${p.g}, ${p.b}, ${p.alpha})`,
    },
```

- [ ] **Step 6: Regenerate the `.bas` file**

Run: `npm run generate:library`
This regenerates `src/lib/Basic4WebGL/defs/drawing.bas` from the descriptor. Do not hand-edit that file directly.

- [ ] **Step 7: Implement in `drawing.js`**

In `src/components/Runner/engine/drawing.js`, add a new cache and helper right after the existing `_gradientFor` function (after its closing `}` around line 93, before `function _texFor`):

```javascript
  const _radialGradientCache = new Map(); // `${r}:${g}:${b}:${a}` (quantised) -> PIXI.FillGradient

  function _quantizeAlpha01(a) {
    return Math.min(1, Math.max(0, Math.round(a * 20) / 20)); // 0.05 steps -- imperceptible
  }

  // Same VRAM-exhaustion and in-flight-destroy hazards as _gradientFor above
  // apply here (a per-light-per-frame overlay can issue several of these every
  // frame) -- same fix: cache by quantised key, never evict/destroy mid-session,
  // only cleared on _drawingReset() (scene switch).
  function _radialGradientFor(r, g, b, alpha) {
    const qr = _quantizeChannel(r);
    const qg = _quantizeChannel(g);
    const qb = _quantizeChannel(b);
    const qa = _quantizeAlpha01(alpha);
    const key = qr + ':' + qg + ':' + qb + ':' + qa;
    let g2 = _radialGradientCache.get(key);
    if (!g2) {
      g2 = new PIXI.FillGradient({
        type: 'radial',
        center: { x: 0.5, y: 0.5 },
        innerRadius: 0,
        outerCenter: { x: 0.5, y: 0.5 },
        outerRadius: 0.5,
        colorStops: [
          { offset: 0, color: { r: qr, g: qg, b: qb, a: qa } },
          { offset: 1, color: { r: qr, g: qg, b: qb, a: 0 } },
        ],
      });
      _radialGradientCache.set(key, g2);
    }
    return g2;
  }
```

Then add the drawing method itself inside the returned object, right after the existing `drawCircle(x, y, radius) { ... }` method (after its closing `},`):

```javascript
    // A circle filled with a radial gradient from (r,g,b,alpha) at its centre
    // fading to fully transparent at its edge -- used by the raycaster
    // light-pool POC to overlay a soft "pool of light" on floor/ceiling,
    // independent of the per-column wall/floor render. x/y is the circle's
    // centre, matching drawCircle.
    drawRadialGradientCircle(x, y, radius, r, g, b, alpha) {
      const o = _acquireG();
      const gradient = _radialGradientFor(r, g, b, alpha);
      o.circle(0, 0, radius).fill(gradient);
      o.position.set(x, y);
      return o;
    },
```

Finally, in `_drawingReset()`, add cleanup for the new cache right after the existing `_gradientCache.clear();` line:

```javascript
      for (const g of _radialGradientCache.values()) { if (g.destroy) g.destroy(); }
      _radialGradientCache.clear();
```

- [ ] **Step 8: Run the tests to confirm they pass**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts tests/components/Runner/drawing.test.ts`
Expected: PASS (all tests, including the 2 new transpiler tests and 5 new drawing.js tests).

- [ ] **Step 9: Run the full suite to confirm no regressions**

Run: `npx vitest run`
Expected: all pass, including `tests/lib/Basic4WebGL/unit/generator/generatedDefsInSync.test.ts` (confirms the regenerated `drawing.bas` matches the descriptor).

- [ ] **Step 10: Commit**

```bash
git add src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts src/lib/Basic4WebGL/defs/drawing.bas src/components/Runner/engine/drawing.js tests/components/Runner/drawing.test.ts tests/lib/Basic4WebGL/unit/transpiler/softgfx.test.ts
git commit -m "feat(drawing): add drawRadialGradientCircle primitive (PIXI native radial gradient)"
```

---

### Task 2: POC demo scaffold — world files, POC-local light accessors, map

**Files:**
- Create: `demo-src/raycaster-lightpool-poc/RcWorld.bas` (copy)
- Create: `demo-src/raycaster-lightpool-poc/RcCast.bas` (copy)
- Create: `demo-src/raycaster-lightpool-poc/RcMover.bas` (copy)
- Create: `demo-src/raycaster-lightpool-poc/RcConfig.bas` (copy)
- Create: `demo-src/raycaster-lightpool-poc/RcLights.bas` (copy + additive accessors)
- Create: `demo-src/raycaster-lightpool-poc/assets/rc_placeholder_tiles.png` (copy)
- Create: `demo-src/raycaster-lightpool-poc/assets/lightpool.stm` (generated)
- Create: `demo-src/raycaster-lightpool-poc/Main.bas`

- [ ] **Step 1: Copy the unmodified shared library files**

```bash
mkdir -p demo-src/raycaster-lightpool-poc/assets
cp demo-src/raycaster/lib/RcWorld.bas demo-src/raycaster-lightpool-poc/RcWorld.bas
cp demo-src/raycaster/lib/RcCast.bas demo-src/raycaster-lightpool-poc/RcCast.bas
cp demo-src/raycaster/lib/RcMover.bas demo-src/raycaster-lightpool-poc/RcMover.bas
cp demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-lightpool-poc/RcConfig.bas
cp demo-src/raycaster/lib/RcLights.bas demo-src/raycaster-lightpool-poc/RcLights.bas
cp demo-src/raycaster-p5/assets/rc_placeholder_tiles.png demo-src/raycaster-lightpool-poc/assets/rc_placeholder_tiles.png
```

Note: `RcRender.bas` is deliberately NOT copied here — this POC uses a new, much smaller renderer (`RcRenderPool.bas`, Task 3), not the full 1200-line production renderer with its step/diagonal/texture logic the flat POC scene doesn't need.

- [ ] **Step 2: Add read-only static-light accessors to the POC's own `RcLights.bas` copy**

This is additive-only to the POC's local copy (the canonical `demo-src/raycaster/lib/RcLights.bas` is untouched — per the spec, this POC is fully isolated). Open `demo-src/raycaster-lightpool-poc/RcLights.bas` and find the end of the `sampleAt` function, immediately before the final `EndClass` line:

```
    return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + e * tx * ty
endfunction

EndClass
```

Insert these six new functions between `endfunction` and `EndClass`:

```
' Read-only accessors onto the static-light arrays bakeStatic() already fills
' -- added for the light-pool POC's RcRenderPool.drawLightPools(), which needs
' to enumerate each static light's real position/height/intensity/radius to
' project it to screen space. Additive only; nothing above this point changed.
function staticLightCount()
    return array.arrLength(self.slxArr)
endfunction

function staticLightX(i)
    return self.slxArr(i)
endfunction

function staticLightY(i)
    return self.slyArr(i)
endfunction

function staticLightZ(i)
    return self.slzArr(i)
endfunction

function staticLightIntensity(i)
    return self.sliArr(i)
endfunction

function staticLightRadius(i)
    return self.slrArr(i)
endfunction

EndClass
```

- [ ] **Step 3: Generate the map**

Create a temporary generator script at `/tmp/genLightpool.mjs`:

```javascript
import { writeFileSync, mkdirSync } from 'node:fs';

const W = 10;
const H = 20;

// 1 = wall, 0 = open floor. Start solid, carve two rooms + one straight,
// 2-cell-wide corridor -- deliberately reproducing the exact case that broke
// the per-column-strip approach: standing in a room, looking down a narrow
// corridor at a light in the room beyond.
const grid = Array.from({ length: H }, () => Array(W).fill(1));

function carve(c0, c1, r0, r1) {
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      grid[r][c] = 0;
    }
  }
}

carve(2, 7, 2, 7);   // Room A (north) -- 6x6 open
carve(4, 5, 8, 11);  // corridor, 2 cells wide, 4 cells long
carve(2, 7, 12, 17); // Room B (south) -- 6x6 open

const markers = [
  { row: 4, col: 4, tag: 'light:1.6' },  // Room A light, roughly centred
  { row: 14, col: 4, tag: 'light:1.6' }, // Room B light, roughly centred
];

const stm = {
  tileWidth: 16,
  tileHeight: 16,
  tileImage: 'rc_placeholder_tiles.png',
  layers: {
    walls: grid,
    tags: { type: 'markers', markers },
  },
};

mkdirSync('/tmp/lightpool-out', { recursive: true });
writeFileSync('/tmp/lightpool-out/lightpool.stm', JSON.stringify(stm, null, 1));
console.log('wrote /tmp/lightpool-out/lightpool.stm');
```

Run it and copy the output into place:

```bash
node /tmp/genLightpool.mjs
cp /tmp/lightpool-out/lightpool.stm demo-src/raycaster-lightpool-poc/assets/lightpool.stm
```

- [ ] **Step 4: Write `Main.bas`**

Create `demo-src/raycaster-lightpool-poc/Main.bas`:

```
function oninit()
  world.setPixelPerfect(true)
endfunction

dim pool = new PoolScene()
scenemanager.register("pool", pool)
scenemanager.switch("pool")
```

(`PoolScene` is created in Task 3 — this file references it by name but the class itself doesn't exist until that task; that's fine, nothing in this task compiles the demo standalone yet.)

- [ ] **Step 5: Commit**

```bash
git add demo-src/raycaster-lightpool-poc/
git commit -m "feat(raycaster): scaffold light-pool POC demo (world files, map, static-light accessors)"
```

---

### Task 3: `RcRenderPool.bas` renderer + `PoolScene.bas`

**Files:**
- Create: `demo-src/raycaster-lightpool-poc/RcRenderPool.bas`
- Create: `demo-src/raycaster-lightpool-poc/PoolScene.bas`

- [ ] **Step 1: Write `RcRenderPool.bas`**

Create `demo-src/raycaster-lightpool-poc/RcRenderPool.bas`:

```
Class
' RcRenderPool -- rough, throwaway POC renderer validating the light-pool
' redesign direction (see
' docs/superpowers/specs/2026-09-05-raycaster-lightpool-poc-design.md).
' NOT production code. Deliberately much smaller than the shared RcRender.bas:
' this POC's map has no floor/ceiling height variation, no diagonal tiles, no
' textures, so none of that logic is needed. Floor/ceiling are flat, dim,
' ambient-only fills -- NO per-column light sampling anywhere in the base
' render. Static lights are drawn afterward as screen-space radial-gradient
' "pool" overlays (drawLightPools()) instead, using the exact camera-plane
' billboard-projection formula the shared RcRender.bas already uses for actor
' billboards (relX/relY -> invDet -> depth/tX -> screenX).
'
' Known POC simplifications (see spec's "Known POC simplifications" section):
' pools are true screen-space circles, not perspective-correct ellipses;
' occlusion is a single ray to the light's centre, no penumbra; no per-pixel
' depth test against walls, so a pool very close to a wall may draw over it;
' no handling for overlapping lights beyond draw order.
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
dim camZ
dim boundMover
dim boundLights
dim fDirX
dim fDirY
dim fPlaneX
dim fPlaneY
dim poolWorldRadius

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
    self.camZ = 0
    self.boundMover = 0
    self.boundLights = 0
    self.poolWorldRadius = 2.5
    self.fDirX = 1
    self.fDirY = 0
    self.fPlaneX = 0
    self.fPlaneY = self.fovScale
EndConstructor

function bindCamera(mover)
    self.boundMover = mover
endfunction

function bindLights(lights)
    self.boundLights = lights
endfunction

' World-unit radius of the drawn light pool (screen radius scales down with
' distance from this). Tunable for the POC without touching the render logic.
function setPoolRadius(r)
    self.poolWorldRadius = r
endfunction

' Screen Y of world height h at perpendicular distance d. Identical formula to
' the shared RcRender.projectY.
function projectY(h, d)
    dim dd
    dd = d
    if dd < 0.05 then
        dd = 0.05
    endif
    return self.scy + (self.camZ + RcConfig.RC_EYE_Z - h) * (self.viewH / dd) + self.camPitch
endfunction

function renderFrame()
    dim ambient
    dim baseCh
    dim rayX
    dim rayY
    dim cameraX
    dim col
    dim destX
    dim n
    dim i
    dim wallDist
    dim wallSide
    dim wallTop
    dim wallBot
    dim shade

    if self.boundMover <> 0 then
        self.camX = self.boundMover.x()
        self.camY = self.boundMover.y()
        self.camZ = self.boundMover.z()
        self.camAngle = self.boundMover.angle()
        self.camPitch = self.boundMover.pitch()
    endif
    self.fDirX = math.cos(self.camAngle)
    self.fDirY = math.sin(self.camAngle)
    self.fPlaneX = 0 - self.fDirY * self.fovScale
    self.fPlaneY = self.fDirX * self.fovScale

    ambient = RcConfig.RC_AMBIENT
    if self.boundLights <> 0 then
        ambient = self.boundLights.ambientLevel()
    endif
    baseCh = math.clamp(255 * (ambient + 0.15), 20, 90)

    ' Flat ambient-only background -- no per-column floor/ceiling sampling at
    ' all. This is the whole point of the POC: static lights are drawn as
    ' overlay pools afterward (drawLightPools), never baked into this fill.
    drawing.setLineWidth(0)
    drawing.setFillColor(baseCh * 0.55, baseCh * 0.55, baseCh * 0.75)
    drawing.drawRect(self.viewW / 2, self.scy / 2, self.viewW, self.scy)
    drawing.setFillColor(baseCh * 0.4, baseCh * 0.4, baseCh * 0.5)
    drawing.drawRect(self.viewW / 2, self.scy + self.scy / 2, self.viewW, self.viewH - self.scy)

    for col = 0 to self.cols - 1
        destX = col * RcConfig.RC_STRIP_W + RcConfig.RC_STRIP_W / 2
        cameraX = 2.0 * col / self.cols - 1.0
        rayX = self.fDirX + self.fPlaneX * cameraX
        rayY = self.fDirY + self.fPlaneY * cameraX
        self.rc.cast(self.wld, self.camX, self.camY, rayX, rayY)
        wallDist = RcConfig.RC_MAX_DIST
        wallSide = 0
        n = self.rc.spanCount()
        for i = 0 to n - 1
            if self.rc.spanKind(i) = RcConfig.RC_SPAN_WALL then
                wallDist = self.rc.spanDist(i)
                wallSide = self.rc.spanSide(i)
                i = n
            endif
        next i
        if wallDist < RcConfig.RC_MAX_DIST then
            wallTop = self.projectY(RcConfig.RC_STD_CEIL, wallDist)
            wallBot = self.projectY(0, wallDist)
            shade = 150
            if wallSide = 1 then
                shade = 115
            endif
            drawing.setFillColor(shade, shade, shade)
            drawing.drawRect(destX, (wallTop + wallBot) / 2, RcConfig.RC_STRIP_W, wallBot - wallTop)
        endif
    next col

    if self.boundLights <> 0 then
        self.drawLightPools()
    endif
endfunction

' Overlay pass: one radial-gradient "pool" per static light, on the floor and
' on the ceiling, projected to screen space with the same camera-plane
' transform the shared RcRender.bas uses for actor billboards.
function drawLightPools()
    dim n
    dim i
    dim lx
    dim ly
    dim lz
    dim intensity
    dim radiusCells
    dim relX
    dim relY
    dim invDet
    dim depth
    dim tX
    dim screenX
    dim dist2d
    dim losD
    dim screenR
    dim alpha
    dim ch
    dim floorY
    dim ceilY

    invDet = 1.0 / (self.fPlaneX * self.fDirY - self.fDirX * self.fPlaneY)
    n = self.boundLights.staticLightCount()
    for i = 0 to n - 1
        lx = self.boundLights.staticLightX(i)
        ly = self.boundLights.staticLightY(i)
        lz = self.boundLights.staticLightZ(i)
        intensity = self.boundLights.staticLightIntensity(i)
        radiusCells = self.boundLights.staticLightRadius(i)

        relX = lx - self.camX
        relY = ly - self.camY
        depth = invDet * (0 - self.fPlaneY * relX + self.fPlaneX * relY)
        if depth > 0.1 then
            tX = invDet * (self.fDirY * relX - self.fDirX * relY)
            screenX = (self.viewW / 2) * (1.0 + tX / depth)
            if screenX > 0 - 200 and screenX < self.viewW + 200 then
                dist2d = math.sqrt(relX * relX + relY * relY)
                losD = 0 - 1
                if dist2d > 0.001 then
                    losD = self.rc.los(self.wld, self.camX, self.camY, relX / dist2d, relY / dist2d)
                endif
                if losD < 0 or losD >= dist2d - 0.1 then
                    screenR = self.poolWorldRadius * (self.viewH / depth)
                    alpha = math.clamp((1.0 - depth / radiusCells) * intensity, 0.1, 0.85)
                    ch = math.clamp(255 * intensity, 120, 255)
                    floorY = self.projectY(0, depth)
                    ceilY = self.projectY(RcConfig.RC_STD_CEIL, depth)
                    drawing.drawRadialGradientCircle(screenX, floorY, screenR, ch, ch * 0.85, ch * 0.6, alpha)
                    drawing.drawRadialGradientCircle(screenX, ceilY, screenR, ch, ch * 0.85, ch * 0.6, alpha)
                endif
            endif
        endif
    next i
endfunction

EndClass
```

- [ ] **Step 2: Write `PoolScene.bas`**

Create `demo-src/raycaster-lightpool-poc/PoolScene.bas`:

```
Class
Extends scene

' Light-pool POC scene: spawns in Room A facing south down the 2-cell corridor
' toward Room B's light -- the exact "shaft not pool" case from the finale.
dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRenderPool
dim me as RcMover
dim lights as RcLights
dim titleText as Text
dim helpText as Text

Constructor()
    input.bind("fwd", "key", keyboard.W)
    input.bind("back", "key", keyboard.S)
    input.bind("sl", "key", keyboard.Q)
    input.bind("sr", "key", keyboard.E)
    input.bind("tl", "key", keyboard.A)
    input.bind("tr", "key", keyboard.D)
EndConstructor

function onenter()
    world.setBackground(0, 0, 0)
    self.tm = new tilemapset("lightpool.stm")
    self.wld = new RcWorld(self.tm, "walls")
    self.ren = new RcRenderPool(self.wld)
    self.me = new RcMover(self.wld, 4.5, 3.5, 0.3, 0.6)
    self.me.warpTo(4.5, 3.5, math.pi() / 2)
    self.lights = new RcLights(self.wld)
    self.lights.setAmbient(0.08)
    self.ren.bindLights(self.lights)
    self.ren.bindCamera(self.me)

    self.titleText = new Text("Raycaster Light-Pool POC", 12, 10)
    self.titleText.setStyle(16, 255, 220, 120)
    hud.add(self.titleText)
    self.helpText = new Text("WASD move  QE strafe  AD turn -- validating round pools, not final quality", 12, 30)
    self.helpText.setStyle(12, 180, 200, 220)
    hud.add(self.helpText)
endfunction

function onupdate(delta)
    dim fwd
    dim strafe
    dim turnAxis

    fwd = input.axis("back", "fwd")
    strafe = input.axis("sl", "sr")
    turnAxis = input.axis("tl", "tr")

    self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
    if turnAxis <> 0 then
        self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
    endif
    self.me.step(delta)
    self.ren.renderFrame()
endfunction

EndClass
```

- [ ] **Step 3: Verify it compiles**

There's no dedicated Vitest harness for this yet (that's Task 4's smoke test), so verify manually for now:

Run: `npx vite build`
Expected: succeeds (this demo isn't wired into the app yet, so the build succeeding just confirms nothing else broke — Task 4 adds the real compile/run check).

- [ ] **Step 4: Commit**

```bash
git add demo-src/raycaster-lightpool-poc/RcRenderPool.bas demo-src/raycaster-lightpool-poc/PoolScene.bas
git commit -m "feat(raycaster): RcRenderPool + PoolScene -- light-pool POC renderer"
```

---

### Task 4: Register demo, smoke test, full verification, visual handoff

**Files:**
- Modify: `src/features/demos/devDemoRegistry.ts`
- Test: `tests/lib/Basic4WebGL/integration/raycasterLightpoolPocSmoke.test.ts` (new)

- [ ] **Step 1: Register the demo**

In `src/features/demos/devDemoRegistry.ts`, add this entry to the `devDemoRegistry` array, after the existing `raycaster-p10-finale` entry (before the closing `];`):

```typescript
  {
    slug: 'raycaster-lightpool-poc',
    name: 'Raycaster — Light-Pool POC',
    tags: ['Raycaster', 'POC'],
    description:
      'Rough, throwaway POC validating a screen-space radial-gradient "light pool" overlay for floor/ceiling static lighting -- two rooms and a corridor, testing whether a static light now reads as a round pool instead of the rectangular shaft the per-column-strip approach produced. Not production code.',
    docsSlug: '',
    file: 'RaycasterLightpoolPoc',
  },
```

- [ ] **Step 2: Write the failing smoke test**

Create `tests/lib/Basic4WebGL/integration/raycasterLightpoolPocSmoke.test.ts`:

```typescript
import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard for the light-pool POC (raycaster-lightpool-poc): proves it
// transpiles with zero diagnostics AND runs to a full renderFrame() with zero
// runtime errors in a stubbed environment. This is deliberately the ONLY
// automated test for this demo -- see
// docs/superpowers/specs/2026-09-05-raycaster-lightpool-poc-design.md's
// Testing section: the actual success criterion (does it look like a round
// pool of light) can only be judged by a human looking at it.

const DIR = 'demo-src/raycaster-lightpool-poc';
const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

function transpileDemo(): string {
  const names = readdirSync(DIR)
    .filter((n) => n.endsWith('.bas'))
    .sort();
  const raw = names.map((name) => ({ name, source: readFileSync(`${DIR}/${name}`, 'utf-8') }));
  const { files, error } = sortByDependencies(raw);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics).toEqual([]);
  return String(result.code);
}

describe('raycaster-lightpool-poc demo', () => {
  test('transpiles with zero diagnostics and renderFrame() runs with zero runtime errors', () => {
    const stm = JSON.parse(readFileSync(`${DIR}/assets/lightpool.stm`, 'utf-8'));
    const walls: number[][] = stm.layers.walls;
    const markers: Array<{ row: number; col: number; tag: string }> = stm.layers.tags.markers;

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
    const render = new (RcRenderPool as new (w: unknown) => { bindlights: (l: unknown) => void; bindcamera: (m: unknown) => void; renderframe: () => void })(world);
    const mover = new (RcMover as new (w: unknown, x: number, y: number, r: number, h: number) => { warpto: (x: number, y: number, a: number) => void })(world, 4.5, 3.5, 0.3, 0.6);
    mover.warpto(4.5, 3.5, Math.PI / 2);
    const lights = new (RcLights as new (w: unknown) => { setambient: (v: number) => void })(world);
    lights.setambient(0.08);
    render.bindlights(lights);
    render.bindcamera(mover);

    expect(() => render.renderframe()).not.toThrow();
  });
});
```

- [ ] **Step 3: Run it to confirm it currently passes (or diagnose why not)**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterLightpoolPocSmoke.test.ts`
Expected: PASS. If it fails, the failure is real — fix `RcRenderPool.bas`/`PoolScene.bas`/`lightpool.stm` from Tasks 2-3 until this passes (this is the whole point of a smoke test: it catches load-time and runtime errors the transpiler alone can't see, same as `raycasterDemoSmoke.test.ts` does for the phase demos).

- [ ] **Step 4: Run the full suite and build**

```bash
npx vitest run
npx vite build
```

Expected: all pass, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/features/demos/devDemoRegistry.ts tests/lib/Basic4WebGL/integration/raycasterLightpoolPocSmoke.test.ts
git commit -m "feat(raycaster): register light-pool POC demo, add smoke test"
```

- [ ] **Step 6: Manual visual handoff**

Start the dev server (`npm run dev`), open the app, and load the `raycaster-lightpool-poc` demo (it's dev-only — not in the public `/demos` list, so use the same `window.__seedDemo('raycaster-lightpool-poc')` dev hook the project's Cypress specs use, then navigate to `/projects/<returned-id>/edit` and click Run). Walk from the spawn point (Room A) down the corridor toward Room B, and stand directly under Room A's own light.

Report back to the user with the actual visual result — does the light now read as a genuine round pool on floor and ceiling, including looking down the corridor, or not. This judgement call is the entire point of the POC and cannot be automated (per the spec's Success Criteria section).

---

## Self-Review Notes

- **Spec coverage:** new `drawing.drawRadialGradientCircle` primitive via descriptor+generator ✅ (Task 1); standalone demo, unmodified shared-library copies, no changes to canonical files ✅ (Task 2); `RcRenderPool.bas` flat ambient base + `drawLightPools()` overlay using the billboard camera-plane transform ✅ (Task 3); POC scene (two rooms, one corridor, one light each, spawn facing down the corridor) ✅ (Task 2/3); light testing (transpile test, drawing.js unit tests, smoke test, no deep raycaster-math tests) ✅ (Tasks 1 and 4); manual visual judgement as the real success criterion ✅ (Task 4 Step 6); known POC simplifications documented in `RcRenderPool.bas`'s header comment ✅ (Task 3).
- **Placeholder scan:** no TBD/TODO; every step has complete, real code.
- **Type consistency:** `drawRadialGradientCircle(x,y,radius,r,g,b,alpha)`'s parameter order and names are identical across the descriptor (Task 1), the `drawing.js` implementation (Task 1), and its two call sites in `RcRenderPool.bas` (Task 3). `staticLightCount/X/Y/Z/Intensity/Radius` are named identically between their definition (Task 2) and their use in `drawLightPools()` (Task 3).
- **Isolation check:** no task modifies any file under `demo-src/raycaster/lib/` (the canonical shared library) or `demo-src/raycaster-p10-finale/` — confirmed by re-reading each task's Files list.
