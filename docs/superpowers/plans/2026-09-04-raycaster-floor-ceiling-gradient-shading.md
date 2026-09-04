# Raycaster Floor/Ceiling Gradient Shading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `raycaster-p10-finale`'s floor/ceiling band-lattice light shading with a per-colour-run vertical gradient fill, gated behind a per-`RcRender`-instance opt-in so every other raycaster demo is byte-identical and behaviourally unchanged.

**Architecture:** A new engine primitive `drawing.drawVGradientRect` (PIXI `FillGradient`) draws one shape per colour run, gradient-filled from the light level at that run's own real near edge to its own real far edge — no intermediate sampling lattice, so the whole "sample point doesn't match visible depth" bug class (fixed piecemeal across 8 prior rounds) is structurally impossible. `RcRender.bas` gains `setGradientShading(v)` (default off); `demo-src/raycaster-p10-finale/FinaleScene.bas` is the only caller that turns it on.

**Tech Stack:** softBASIC (transpiles to JS), PIXI.js v8.20.0 (loaded via CDN, `PIXI.FillGradient`), Vitest.

**Spec:** `docs/superpowers/specs/2026-09-04-raycaster-floor-ceiling-gradient-shading-design.md`

---

## Before you start

Read these files in full — you'll be editing/extending all of them:
- `demo-src/raycaster/lib/RcRender.bas` (the canonical raycaster renderer — every `demo-src/raycaster-p*/RcRender.bas` must stay byte-identical to this file; that's enforced by `tests/lib/Basic4WebGL/integration/raycasterDemoLibSync.test.ts`)
- `demo-src/raycaster-p10-finale/FinaleScene.bas`
- `src/components/Runner/engine/drawing.js`
- `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts`
- `tests/components/Runner/drawing.test.ts`

Also skim `docs/superpowers/specs/2026-09-04-raycaster-floor-ceiling-gradient-shading-design.md` for the full rationale — this plan implements it task-by-task but doesn't repeat all the "why".

---

### Task 1: `drawing.drawVGradientRect` engine primitive

**Files:**
- Modify: `src/components/Runner/engine/drawing.js`
- Test: `tests/components/Runner/drawing.test.ts`

The confirmed PIXI v8.20.0 `FillGradient` constructor (verified against the real `.d.ts`, not guessed):
```ts
new PIXI.FillGradient({
  type: 'linear',
  start: { x: number, y: number },   // local space, 0..1 by default
  end: { x: number, y: number },
  colorStops: [{ offset: number, color: ColorSource }],
});
```
`color` accepts a plain packed number (`0xRRGGBB`), same as `_styles.fillColor` elsewhere in this file.

- [ ] **Step 1: Write the failing test**

Open `tests/components/Runner/drawing.test.ts`. It fakes PIXI for a from-source `new Function(...)` load of `drawing.js` (see `loadDrawing()` near the top). Add a `FakeFillGradient` class next to the other `Fake*` classes (after `FakeContainer`, before `function loadDrawing()`):

```ts
class FakeFillGradient {
  opts: any;
  constructor(opts?: unknown) { this.opts = opts; }
}
```

Add `FillGradient: FakeFillGradient,` to the `PIXI` object inside `loadDrawing()`.

`FakeGraphics.fill()` currently discards its argument (`fill() { return this; }`). Change it to record what it was called with, so a test can inspect the gradient:

```ts
class FakeGraphics {
  visible = true; position = { set() {} }; pivot = { set() {} };
  parent: unknown = undefined; zIndex = 0;
  lastFill: unknown = undefined;
  constructor() { gfxCreated++; }
  clear() { return this; }
  rect() { return this; } circle() { return this; } moveTo() { return this; } lineTo() { return this; }
  fill(style?: unknown) { this.lastFill = style; return this; } stroke() { return this; }
  destroy() { destroyed++; }
}
```

Add a new test in the `describe('drawing — object pooling', ...)` block (or a new adjacent `describe`) in the same file:

```ts
describe('drawing — vertical gradient fill', () => {
  test('drawVGradientRect fills with a linear top-to-bottom gradient using the given colours', () => {
    const { d } = loadDrawing();
    const o = d.drawVGradientRect(10, 20, 4, 30, 255, 0, 0, 0, 0, 255) as FakeGraphics;
    const style = o.lastFill as { opts: { type: string; start: { x: number; y: number }; end: { x: number; y: number }; colorStops: Array<{ offset: number; color: number }> } };
    expect(style.opts.type).toBe('linear');
    expect(style.opts.start).toEqual({ x: 0, y: 0 });
    expect(style.opts.end).toEqual({ x: 0, y: 1 });
    expect(style.opts.colorStops).toEqual([
      { offset: 0, color: 0xff0000 },
      { offset: 1, color: 0x0000ff },
    ]);
  });

  test('drawVGradientRect is pooled exactly like drawRect', () => {
    const { d } = loadDrawing();
    d.drawVGradientRect(0, 0, 10, 10, 255, 255, 255, 0, 0, 0);
    d.drawVGradientRect(0, 0, 10, 10, 255, 255, 255, 0, 0, 0);
    expect(gfxCreated).toBe(2);
    d.clearDrawing();
    d.drawVGradientRect(0, 0, 10, 10, 255, 255, 255, 0, 0, 0);
    d.drawVGradientRect(0, 0, 10, 10, 255, 255, 255, 0, 0, 0);
    expect(gfxCreated).toBe(2); // reused from the pool
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/Runner/drawing.test.ts -t "vertical gradient"`
Expected: FAIL — `d.drawVGradientRect is not a function`.

- [ ] **Step 3: Implement `drawVGradientRect` in `drawing.js`**

Open `src/components/Runner/engine/drawing.js`. Find the `return { ... }` object (starts around the `setFillColor(r, g, b) {` line, right after the `_meshTexFor` function). Add a new method right after `drawRect` (which currently reads):

```js
    drawRect(x, y, width, height) {
      const o = _acquireG();
      o.rect(0, 0, width, height).fill(_styles.fillColor);
      if (_styles.lineWidth > 0) o.stroke({ width: _styles.lineWidth, color: _styles.lineColor });
      o.pivot.set(width / 2, height / 2);
      o.position.set(x, y);
      return o;
    },
```

Insert immediately after it:

```js
    // A rect filled with a true top-to-bottom colour gradient (PIXI.FillGradient,
    // local coordinate space so start/end are 0..1 within the shape regardless of
    // its actual width/height) -- used by RcRender's floor/ceiling shading so one
    // shape covers a whole colour run's light gradient exactly, with no
    // intermediate sampling lattice. x/y is the shape's centre, matching drawRect.
    drawVGradientRect(x, y, width, height, topR, topG, topB, botR, botG, botB) {
      const o = _acquireG();
      const topHex = parseInt(_componentToHex(topR) + _componentToHex(topG) + _componentToHex(topB), 16);
      const botHex = parseInt(_componentToHex(botR) + _componentToHex(botG) + _componentToHex(botB), 16);
      const gradient = new PIXI.FillGradient({
        type: 'linear',
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
        colorStops: [
          { offset: 0, color: topHex },
          { offset: 1, color: botHex },
        ],
      });
      o.rect(0, 0, width, height).fill(gradient);
      o.pivot.set(width / 2, height / 2);
      o.position.set(x, y);
      return o;
    },
```

Note: `_componentToHex` already exists in this file (used by `setFillColor`/`setLineColor`) and expects each channel already clamped to 0-255 — callers of `drawVGradientRect` (RcRender, in Task 3) are responsible for clamping, exactly like every other caller of colour-producing helpers in this codebase already is.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/Runner/drawing.test.ts`
Expected: PASS, all tests in the file (including the two new ones).

- [ ] **Step 5: Commit**

```bash
git add src/components/Runner/engine/drawing.js tests/components/Runner/drawing.test.ts
git commit -m "feat(drawing): drawVGradientRect -- a Graphics rect filled with a true top-to-bottom gradient"
```

---

### Task 2: `.bas` wrapper (descriptor-generated)

**Files:**
- Modify: `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts`
- Generated (do not hand-edit): `src/lib/Basic4WebGL/defs/drawing.bas`
- Test: `tests/lib/Basic4WebGL/unit/generator/generatedDefsInSync.test.ts` (already exists, no changes needed — it will simply also cover this new function once generated)

`drawing` is listed in `src/lib/Basic4WebGL/library/registry.ts` as descriptor-generated. Per `CLAUDE.md`'s rule, **never hand-edit `drawing.bas`** — edit the descriptor and regenerate.

- [ ] **Step 1: Add the descriptor entry**

Open `src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts`. Add a new entry to the `functions` array, after `drawFloorStrip`:

```ts
    {
      name: 'drawVGradientRect',
      params: ['x', 'y', 'width', 'height', 'topR', 'topG', 'topB', 'botR', 'botG', 'botB'],
      body: (p, _self) =>
        `_sb.drawVGradientRect(${p.x}, ${p.y}, ${p.width}, ${p.height}, ${p.topR}, ${p.topG}, ${p.topB}, ${p.botR}, ${p.botG}, ${p.botB})`,
    },
```

- [ ] **Step 2: Regenerate the library**

Run: `npm run generate:library`
Expected: exits 0, and `src/lib/Basic4WebGL/defs/drawing.bas` now has a new `function drawVGradientRect(...)` block at the end, in the same style as the existing `drawFloorStrip` entry (a `call("_sb.drawVGradientRect(...)")` body with parameter-prefixed local names, matching every other function in that file).

- [ ] **Step 3: Verify the sync test passes**

Run: `npx vitest run generatedDefsInSync`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/Basic4WebGL/library/descriptors/drawing.descriptor.ts src/lib/Basic4WebGL/defs/drawing.bas
git commit -m "feat(drawing): drawVGradientRect .bas wrapper (descriptor-generated)"
```

---

### Task 3: `RcRender.bas` — per-instance gradient shading path

**Files:**
- Modify: `demo-src/raycaster/lib/RcRender.bas`
- Sync (byte-identical copy): `demo-src/raycaster-p1/RcRender.bas`, `demo-src/raycaster-p2/RcRender.bas` (if present — check with `ls demo-src | grep raycaster-p`, only copy into directories that already have their own `RcRender.bas`), `demo-src/raycaster-p3/RcRender.bas`, `demo-src/raycaster-p4/RcRender.bas`, `demo-src/raycaster-p5/RcRender.bas`, `demo-src/raycaster-p6/RcRender.bas`, `demo-src/raycaster-p7/RcRender.bas`, `demo-src/raycaster-p8-tiers/RcRender.bas`, `demo-src/raycaster-p9-bench/RcRender.bas`, `demo-src/raycaster-p10-finale/RcRender.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterGradientShading.test.ts` (new)

This task adds the new code path but does not turn it on anywhere yet (default `gradientShadeOn = 0`) — Task 5 wires `FinaleScene.bas` to opt in.

- [ ] **Step 1: Write the failing test**

Create `tests/lib/Basic4WebGL/integration/raycasterGradientShading.test.ts`. This follows the exact harness pattern already used by `tests/lib/Basic4WebGL/integration/raycasterBackdropLight.test.ts` and `raycasterApproachDirection.test.ts` in this repo (both already committed — read one of them first for the full boilerplate shape) but targets the new API. Full file:

```ts
import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard for the gradient floor/ceiling shading path (per-instance
// opt-in via RcRender.setGradientShading -- default off, so every other
// raycaster demo is unaffected). Proves: with gradient shading on, a colour
// run's drawn gradient stops are the light level at that run's OWN real near
// and far edge (sampleAt at the run's actual dNear/dFar), not a value derived
// from any intermediate lattice cell -- the whole "sample point behind a wall"
// bug class this replaces cannot occur here because there is no intermediate
// sample point at all.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
const DIR = 'demo-src/raycaster-p5';

function transpileP5(): string {
  const names = readdirSync(DIR)
    .filter((n) => n.endsWith('.bas') && n !== 'Main.bas' && n !== 'LitScene.bas')
    .sort();
  const raw = names.map((name) => ({ name, source: readFileSync(`${DIR}/${name}`, 'utf-8') }));
  const { files, error } = sortByDependencies(raw);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics).toEqual([]);
  return String(result.code);
}

interface RcRenderLike {
  bindlights(l: unknown): void;
  bindcamera(m: unknown): void;
  setgradientshading(v: number): void;
  renderframe(): void;
}
interface RcMoverLike {
  warpto(x: number, y: number, angle: number): void;
}
interface RcLightsLike {
  setambient(v: number): void;
  addpoint(x: number, y: number, z: number, i: number, r: number): number;
  update(): void;
  sampleat(x: number, y: number): number;
}

function build() {
  // 12x12 bordered room, wide open, no walls anywhere near the camera's
  // sightline -- one long uncoloured floor/ceiling run to test the gradient on.
  const walls = Array.from({ length: 12 }, (_, r) =>
    Array.from({ length: 12 }, (_, c) => (r === 0 || r === 11 || c === 0 || c === 11 ? 1 : 0)),
  );

  const code = transpileP5();
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
  _sb.allMarkers = () => [];
  _sb.getStageWidth = () => 320;
  _sb.getStageHeight = () => 200;

  const events: Array<{ kind: 'gradient'; a: unknown[] } | { kind: 'other' }> = [];
  _sb.setFillColor = () => events.push({ kind: 'other' });
  _sb.drawRect = () => events.push({ kind: 'other' });
  _sb.drawImageStrip = () => events.push({ kind: 'other' });
  _sb.drawVGradientRect = (...a: unknown[]) => events.push({ kind: 'gradient', a });

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
    `${code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcRender: _sb_rcrender, RcMover: _sb_rcmover, RcLights: _sb_rclights };`,
  );
  const { RcWorld, TileMapSet, RcRender, RcMover, RcLights } = factory(
    _sb,
    _createArray,
    ...Object.values(helpers),
    { log() {} },
  );
  deferred.forEach((cb) => cb());
  const world = new RcWorld(new TileMapSet('room.stm'), 'walls');
  const render = new RcRender(world) as RcRenderLike;
  const mover = new RcMover(world, 5.5, 5.5, 0.3, 0.6) as RcMoverLike;
  const lights = new RcLights(world) as RcLightsLike;
  render.bindlights(lights);
  render.bindcamera(mover);
  return { render, mover, lights, events };
}

describe('RcRender gradient floor/ceiling shading', () => {
  test('default (gradient shading off) never calls drawVGradientRect', () => {
    const { render, mover, lights, events } = build();
    lights.setambient(0.3);
    mover.warpto(5.5, 2.5, Math.PI / 2); // facing +y, straight down the room
    render.renderframe();
    expect(events.some((e) => e.kind === 'gradient')).toBe(false);
  });

  test('gradient shading on: draws with drawVGradientRect, using the run\\'s own near/far light', () => {
    const { render, mover, lights, events } = build();
    lights.setambient(0.2);
    const h = lights.addpoint(5.5, 9.5, 0.5, 0.9, 8); // light toward the far wall
    lights.update();
    render.setgradientshading(1);
    mover.warpto(5.5, 2.5, Math.PI / 2); // facing +y, straight down the room toward the light
    render.renderframe();

    const gradients = events.filter((e) => e.kind === 'gradient') as Array<{ kind: 'gradient'; a: unknown[] }>;
    expect(gradients.length).toBeGreaterThan(0);
    // Every gradient call's args are (x, y, w, h, topR, topG, topB, botR, botG, botB) --
    // channel values are the SAME base grey (105/105/130-ish for floor, scaled by
    // light) at both ends only if light is uniform; since a light exists, top and
    // bottom must differ for at least one gradient (proving two distinct samples
    // were actually taken, not one value reused for both ends).
    const distinct = gradients.some((g) => {
      const [, , , , tr, , , br] = g.a as number[];
      return Math.abs(tr - br) > 1;
    });
    expect(distinct).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run raycasterGradientShading`
Expected: FAIL — `render.setgradientshading is not a function` (the transpiled JS won't have this method yet).

- [ ] **Step 3: Add the `gradientShadeOn` field and setter**

Open `demo-src/raycaster/lib/RcRender.bas`. Find this block (the `surfSegN` field declaration, just before the `Constructor`):

```
' How many flat light steps a floor/ceiling surface is allowed across half the
' screen, recomputed once per renderFrame() from the bound lights' dynamic range
' (peakLevel() - ambientLevel()) and capped at RcConfig.RC_SURF_SEG_MAX. It is
' deliberately a FRAME-global number, not a per-band or per-column one -- see
' drawFlatSeg. 1 = no subdivision (a uniformly lit scene pays nothing).
dim surfSegN
```

Add immediately after it:

```

' Per-instance opt-in for gradient floor/ceiling shading (0 = default, the
' existing band-lattice path below; 1 = one drawVGradientRect per colour run,
' gradient-filled from the light at that run's own real near/far edge -- see
' setGradientShading() and the branch near the top of drawFlatSeg()). Defaults
' off so every raycaster demo except the one that explicitly opts in is
' byte-identical in behaviour to before this field existed.
dim gradientShadeOn
```

Find `self.surfSegN = 1` inside the `Constructor`, and add immediately after it:
```
    self.gradientShadeOn = 0
```

Find the `setFlatFill` function:
```
function setFlatFill(v)
    self.flatFillOn = v
endfunction
```

Add immediately after it:
```

' 0 (default) = the existing screen-Y light-band lattice. 1 = one
' drawVGradientRect per floor/ceiling colour run, gradient-filled from the
' light at that run's own real near/far edge -- no intermediate sampling
' point, so it cannot sample behind a wall or in the wrong room. See
' docs/superpowers/specs/2026-09-04-raycaster-floor-ceiling-gradient-shading-design.md.
function setGradientShading(v)
    self.gradientShadeOn = v
endfunction
```

- [ ] **Step 4: Add the `shadeToPacked` and `drawGradientBand` helpers**

Find the `emitFlatBand` function (it ends with `endfunction` right before the large comment block starting `' Draw one flat horizontal sub-band...` that precedes `drawFlatSeg`). Insert two new functions between `emitFlatBand`'s `endfunction` and that comment block:

```

' Same colour math as emitFlatBand's packed>=0 branch and drawStrip's default
' shadeKind table, but returns a packed colour (self.packTint) instead of
' drawing -- used by the gradient shading path to compute a colour at two
' different light levels (near/far edge) without two copies of this table.
function shadeToPacked(kind, packed, lite)
    dim g
    dim rr
    dim gg
    dim bb
    if packed >= 0 then
        rr = math.floor(packed / 65536)
        gg = math.floor(packed / 256) - rr * 256
        bb = packed - rr * 65536 - gg * 256
        return self.packTint(rr * lite, gg * lite, bb * lite)
    endif
    g = 150
    if kind = 1 then
        g = 115
    endif
    if kind = 2 then
        g = 90
    endif
    if kind = 3 then
        g = 65
    endif
    if kind = 4 then
        g = 105
    endif
    if kind = 5 then
        g = 60
    endif
    if kind = 6 then
        g = 80
    endif
    if kind = 7 then
        g = 50
    endif
    return self.packTint(g * lite, g * lite, (g + 25) * lite)
endfunction

' One drawVGradientRect call, gradient-filled from topPacked to botPacked
' (both self.packTint()-packed colours). Mirrors emitFlatBand's bookkeeping
' (surfCountLast/primCount) so callers can't tell which shading path ran.
function drawGradientBand(destX, yTop, yBot, topPacked, botPacked)
    dim tr
    dim tg
    dim tb
    dim br
    dim bg
    dim bb
    if yBot <= yTop then
        return
    endif
    tr = math.floor(topPacked / 65536)
    tg = math.floor(topPacked / 256) - tr * 256
    tb = topPacked - tr * 65536 - tg * 256
    br = math.floor(botPacked / 65536)
    bg = math.floor(botPacked / 256) - br * 256
    bb = botPacked - br * 65536 - bg * 256
    drawing.drawVGradientRect(destX, (yTop + yBot) / 2, RcConfig.RC_STRIP_W, yBot - yTop, tr, tg, tb, br, bg, bb)
    self.surfCountLast = self.surfCountLast + 1
    self.primCount = self.primCount + 1
endfunction
```

- [ ] **Step 5: Branch in `drawFlatSeg`**

Find this exact block inside `drawFlatSeg` (right after the `yBot <= yTop` clip-and-return, before the "Screen extent of the WHOLE surface" comment):

```
    if self.boundLights = 0 then
        self.emitFlatBand(destX, yTop, yBot, kind, packed, lite)
        return
    endif
    ' Screen extent of the WHOLE surface this column sees, not just this colour
    ' run -- the clamp range for every lattice sample below.
    oa = self.projectY(hh, dOutNear)
```

Replace it with:

```
    if self.boundLights = 0 then
        self.emitFlatBand(destX, yTop, yBot, kind, packed, lite)
        return
    endif
    if self.gradientShadeOn = 1 then
        nearLite = self.boundLights.sampleAt(self.camX + rayX * dNear, self.camY + rayY * dNear)
        farLite = self.boundLights.sampleAt(self.camX + rayX * dFar, self.camY + rayY * dFar)
        if ya <= yb then
            topPacked = self.shadeToPacked(kind, packed, nearLite)
            botPacked = self.shadeToPacked(kind, packed, farLite)
        else
            topPacked = self.shadeToPacked(kind, packed, farLite)
            botPacked = self.shadeToPacked(kind, packed, nearLite)
        endif
        self.drawGradientBand(destX, yTop, yBot, topPacked, botPacked)
        return
    endif
    ' Screen extent of the WHOLE surface this column sees, not just this colour
    ' run -- the clamp range for every lattice sample below.
    oa = self.projectY(hh, dOutNear)
```

Now add the four new locals this branch uses to `drawFlatSeg`'s `dim` block at the top of the function. Find:

```
    dim segStart
    dim segLite
    dim done
    dim guard
    ya = self.projectY(hh, dNear)
```

Replace with:

```
    dim segStart
    dim segLite
    dim done
    dim guard
    dim nearLite
    dim farLite
    dim topPacked
    dim botPacked
    ya = self.projectY(hh, dNear)
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run raycasterGradientShading`
Expected: PASS, both tests.

- [ ] **Step 7: Run the full raycaster test suite to confirm nothing else regressed**

Run: `npx vitest run raycaster`
Expected: PASS, all files (this change is purely additive/gated, so every pre-existing raycaster test must still pass unchanged).

- [ ] **Step 8: Sync to every other raycaster demo copy**

```bash
cd /Users/jon/source/Basic4WebGL
ls demo-src | grep '^raycaster-p'
```

For every directory that lists (and has its own `RcRender.bas` — check with `ls demo-src/<dir>/RcRender.bas`), copy the canonical file over it:

```bash
for d in raycaster-p1 raycaster-p2 raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6 raycaster-p7 raycaster-p8-tiers raycaster-p9-bench raycaster-p10-finale; do
  if [ -f "demo-src/$d/RcRender.bas" ]; then
    cp demo-src/raycaster/lib/RcRender.bas demo-src/$d/RcRender.bas
  fi
done
```

(Adjust the directory list if `ls demo-src | grep '^raycaster-p'` showed different names — copy into every directory that actually has its own `RcRender.bas`, no more, no fewer.)

- [ ] **Step 9: Verify the sync test passes**

Run: `npx vitest run raycasterDemoLibSync`
Expected: PASS.

- [ ] **Step 10: Full suite**

Run: `npx vitest run`
Expected: PASS, 0 failures (there may be 1-2 pre-existing Cypress-adjacent flakes reported elsewhere in this project's history, but nothing in `npx vitest run` should fail — if something does, stop and investigate before continuing, don't assume flake).

- [ ] **Step 11: Commit**

```bash
git add demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p1/RcRender.bas demo-src/raycaster-p2/RcRender.bas demo-src/raycaster-p3/RcRender.bas demo-src/raycaster-p4/RcRender.bas demo-src/raycaster-p5/RcRender.bas demo-src/raycaster-p6/RcRender.bas demo-src/raycaster-p7/RcRender.bas demo-src/raycaster-p8-tiers/RcRender.bas demo-src/raycaster-p9-bench/RcRender.bas demo-src/raycaster-p10-finale/RcRender.bas tests/lib/Basic4WebGL/integration/raycasterGradientShading.test.ts
git commit -m "feat(raycaster): RcRender.setGradientShading -- per-run vertical gradient floor/ceiling shading, opt-in"
```

(Only `git add` the `RcRender.bas` paths that actually exist per Step 8 above -- drop any that don't apply.)

---

### Task 4: Wire the finale in and rebuild its export

**Files:**
- Modify: `demo-src/raycaster-p10-finale/FinaleScene.bas`
- Modify (generated): `src/docs/demos/RaycasterP10Finale.b4wgl.json`

- [ ] **Step 1: Turn on gradient shading for the finale**

Open `demo-src/raycaster-p10-finale/FinaleScene.bas`. Find:

```
  ' Rung 1's painter's background fill assumes floor/ceiling brightness is
  ' roughly uniform across the visible plane -- badly wrong with several
  ' short-radius static lights and genuinely dark corridors between them,
  ' where it produces a false bright/dark seam right at any fcol:/ccol:
  ' boundary. Force the accurate per-pixel path everywhere.
  self.ren.setFlatFill(0)
```

Add immediately after it:

```

  ' Gradient floor/ceiling shading (POC) -- one shape per colour run,
  ' gradient-filled from the light at that run's own real near/far edge,
  ' instead of the shared library's default screen-Y light-band lattice. See
  ' docs/superpowers/specs/2026-09-04-raycaster-floor-ceiling-gradient-shading-design.md.
  self.ren.setGradientShading(1)
```

- [ ] **Step 2: Rebuild the demo export**

Run: `npx vite-node scripts/buildDemo.ts demo-src/raycaster-p10-finale RaycasterP10Finale`
Expected: `Wrote src/docs/demos/RaycasterP10Finale.b4wgl.json (10 file(s), 3 asset(s))`

- [ ] **Step 3: Full verification**

```bash
npx vitest run
npx vite build
```
Expected: both clean, 0 failures.

Then (dev server must already be running on port 5173 -- if a `node` process already owns that port, that's the dev server, leave it running):
```bash
npx cypress run --spec cypress/e2e/demos.cy.ts --headless
```
Expected: 14/14 passing. If 1-2 fail, rerun once before treating it as real -- this Cypress spec has shown transient flakiness elsewhere in this project's history unrelated to code changes; a clean rerun confirms flake, a repeat failure does not.

- [ ] **Step 4: Commit**

```bash
git add demo-src/raycaster-p10-finale/FinaleScene.bas src/docs/demos/RaycasterP10Finale.b4wgl.json
git commit -m "feat(raycaster): raycaster-p10-finale opts into gradient floor/ceiling shading"
```

---

### Task 5: Manual visual re-test (handoff, not automated)

This is not a coding task. Headless tests prove the mechanism is correct; they have not been sufficient on their own anywhere in this saga to prove the *visual result* is acceptable. Hand off to the user:

1. Seed a fresh copy: from any page in the running app, browser console: `window.__seedDemo('raycaster-p10-finale').then(id => location.href = '/projects/' + id + '/edit')`.
2. Click "Run project".
3. Walk the same corridor(s) that showed problems before (hub → Torch Hall → dais especially, and each accent-coloured room).
4. Report back specifically: does the floor/ceiling look right now? If not, per the spec's escalation rule, at most 2 more fix attempts responding to whatever's reported before switching to Option C (baked lightmap texture) -- do not attempt a third patch to this same gradient approach.
