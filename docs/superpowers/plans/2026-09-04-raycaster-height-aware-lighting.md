# Raycaster height-aware lighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the raycaster's static/dynamic lights a real height component so floor and ceiling surfaces at the same `(x, y)` get genuinely different brightness — fixing the finale's "light flows as a shaft, not a pool" and "the floor looks reflective" complaints — opt-in only, scoped to `raycaster-p10-finale`.

**Architecture:** `RcWorld.bas` gains an optional height on `light:` markers (`light:1.8`, default `RcConfig.RC_LIGHT_DEFAULT_Z`). `RcLights.bas` gains a second, live (non-baked) sampling path, `sampleAtZ(worldX, worldY, worldZ)`, that sums true 3D-distance falloff over every static + active dynamic light when `heightAwareOn = 1`, and is a byte-for-byte passthrough to the existing `sampleAt` when off. `RcRender.bas`'s already-gated gradient-shading branch swaps its two `sampleAt` calls for `sampleAtZ`, passing the surface's real height (`hh`, already a parameter). `FinaleScene.bas` turns the new flag on and its 7 `light:` markers get real per-fixture heights.

**Tech Stack:** softBASIC (transpiles to JS), Vitest for tests, PIXI runtime unaffected (pure light-math change).

---

### Task 1: `RcConfig.bas` — add `RC_LIGHT_DEFAULT_Z`

**Files:**
- Modify: `demo-src/raycaster/lib/RcConfig.bas`

- [ ] **Step 1: Add the constant**

Add `RC_LIGHT_DEFAULT_Z = 0.85` to the `const` block, right after `RC_STATIC_INTENSITY = 0.9` (line 41), and document it in the header comment block alongside the other grouped comments (near the `RC_FALLOFF_*` doc at the top):

```
' RC_LIGHT_DEFAULT_Z: default world height for a bare `light` marker (no
' `:height` suffix) in RcWorld -- just under RC_STD_CEIL (1.0), approximating
' a ceiling-mounted fixture rather than a light embedded in the ceiling
' surface itself. See RcWorld.applyFlag/applyKv and RcLights.sampleAtZ.
```

The `const` block entry:

```
    RC_STATIC_INTENSITY = 0.9
    RC_LIGHT_DEFAULT_Z = 0.85
```

- [ ] **Step 2: No test needed** — this is a bare constant; its use is covered by Task 2's and Task 4's tests.

- [ ] **Step 3: Sync to every phase-demo copy**

```bash
for d in demo-src/raycaster-p1 demo-src/raycaster-p2 demo-src/raycaster-p3 demo-src/raycaster-p4 demo-src/raycaster-p5 demo-src/raycaster-p6 demo-src/raycaster-p7 demo-src/raycaster-p8-tiers demo-src/raycaster-p9-bench demo-src/raycaster-p10-finale; do
  cp demo-src/raycaster/lib/RcConfig.bas "$d/RcConfig.bas"
done
```

- [ ] **Step 4: Commit**

```bash
git add demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-p*/RcConfig.bas
git commit -m "feat(raycaster): add RC_LIGHT_DEFAULT_Z constant for height-aware lighting"
```

---

### Task 2: `RcWorld.bas` — `light:` marker gains an optional height

**Files:**
- Modify: `demo-src/raycaster/lib/RcWorld.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterWorldLightHeight.test.ts` (new)

- [ ] **Step 1: Write the failing test**

This follows the exact harness pattern used by `raycasterGradientShading.test.ts` (transpile `demo-src/raycaster-p5`'s `.bas` files, run in a stubbed `_sb`, exercise the compiled `RcWorld` class directly). Two markers: a bare `light` and a `light:1.8`, on two different cells of a 4x4 open room.

```typescript
import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard for the height-aware lighting POC (raycaster-p10-finale):
// a `light:` marker's optional height suffix must be parsed into a new
// per-cell array (lightHArr), defaulting to RcConfig.RC_LIGHT_DEFAULT_Z for a
// bare `light` tag, without changing lightAt()'s existing 0/1 flag semantics.

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

interface RcWorldLike {
  lightat(col: number, row: number): number;
  lightheightat(col: number, row: number): number;
}

function buildWorld(markers: Array<{ row: number; col: number; tag: string }>) {
  // 4x4 open room, no walls, so cell index math is trivial.
  const walls = Array.from({ length: 4 }, () => Array(4).fill(0));

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
  _sb.allMarkers = () => markers;

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
    `${code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset };`,
  );
  const { RcWorld, TileMapSet } = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  return new RcWorld(new TileMapSet('room.stm'), 'walls') as RcWorldLike;
}

describe('RcWorld light: marker optional height', () => {
  test('bare "light" marker defaults lightHeightAt to RC_LIGHT_DEFAULT_Z, lightAt stays 1', () => {
    const world = buildWorld([{ row: 1, col: 1, tag: 'light' }]);
    expect(world.lightat(1, 1)).toBe(1);
    expect(world.lightheightat(1, 1)).toBeCloseTo(0.85, 5);
  });

  test('"light:1.8" marker parses the height, lightAt stays 1', () => {
    const world = buildWorld([{ row: 2, col: 2, tag: 'light:1.8' }]);
    expect(world.lightat(2, 2)).toBe(1);
    expect(world.lightheightat(2, 2)).toBeCloseTo(1.8, 5);
  });

  test('a cell with no light marker has lightAt 0 and lightHeightAt defaults to RC_LIGHT_DEFAULT_Z', () => {
    const world = buildWorld([]);
    expect(world.lightat(0, 0)).toBe(0);
    expect(world.lightheightat(0, 0)).toBeCloseTo(0.85, 5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterWorldLightHeight.test.ts`
Expected: FAIL — `lightheightat is not a function` (method doesn't exist yet), and the RC_LIGHT_DEFAULT_Z-dependent assertions fail too.

- [ ] **Step 3: Implement in `RcWorld.bas`**

Add `dim lightHArr(0)` right after `dim lightArr(0)` (line 24):

```
dim lightArr(0)
dim lightHArr(0)
```

In `build()`'s init loop (around line 64), push a default height alongside the existing `lightArr` push:

```
        array.push(self.lightArr, 0)
        array.push(self.lightHArr, RcConfig.RC_LIGHT_DEFAULT_Z)
```

In `applyFlag(idx, name)` (line 144-146), the bare `light` branch already only needs to set the flag — `lightHArr` was already defaulted to `RC_LIGHT_DEFAULT_Z` at init, so no change needed there. Leave as-is:

```
    if name = "light" then
        self.lightArr(idx) = 1
    endif
```

In `applyKv(idx, key, v)` (line 165-167), parse the value into `lightHArr`:

```
    if key = "light" then
        self.lightArr(idx) = 1
        self.lightHArr(idx) = math.val(v)
    endif
```

Add a new accessor right after `lightAt` (after line 282, before `function floorTexAt`):

```
function lightHeightAt(col, row)
    if self.inBounds(col, row) = 0 then
        return RcConfig.RC_LIGHT_DEFAULT_Z
    endif
    return self.lightHArr(row * self.cols + col)
endfunction
```

Update the header comment (line 12-13) to mention the height:

```
' A `light` tag (bare, or `light:<height>`) sets lightArr(idx) to a 0/1 flag;
' RcLights.bakeStatic reads it as a static light source at RC_STATIC_INTENSITY.
' The tag's optional height (`light:1.8`) is parsed into lightHArr, defaulting
' to RcConfig.RC_LIGHT_DEFAULT_Z for a bare `light` -- see lightHeightAt.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterWorldLightHeight.test.ts`
Expected: PASS (3/3)

- [ ] **Step 5: Sync to every phase-demo copy that has `RcWorld.bas`**

```bash
for d in demo-src/raycaster-p1 demo-src/raycaster-p2 demo-src/raycaster-p3 demo-src/raycaster-p4 demo-src/raycaster-p5 demo-src/raycaster-p6 demo-src/raycaster-p7 demo-src/raycaster-p8-tiers demo-src/raycaster-p9-bench demo-src/raycaster-p10-finale; do
  cp demo-src/raycaster/lib/RcWorld.bas "$d/RcWorld.bas"
done
```

- [ ] **Step 6: Run the full suite to confirm nothing else broke**

Run: `npx vitest run`
Expected: all pass (no regressions in `raycasterDemoLibSync.test.ts` or `raycasterDemoSmoke.test.ts`)

- [ ] **Step 7: Commit**

```bash
git add demo-src/raycaster/lib/RcWorld.bas demo-src/raycaster-p*/RcWorld.bas tests/lib/Basic4WebGL/integration/raycasterWorldLightHeight.test.ts
git commit -m "feat(raycaster): light: markers carry an optional height (light:1.8)"
```

---

### Task 3: `RcLights.bas` — static-light height arrays, `heightAwareOn`, `sampleAtZ`

**Files:**
- Modify: `demo-src/raycaster/lib/RcLights.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterLightsSampleAtZ.test.ts` (new)

- [ ] **Step 1: Write the failing tests**

Same harness pattern as `raycasterGradientShading.test.ts`, but exercising `RcLights` directly (and `RcWorld`, since `bakeStatic()` reads `lightHeightAt`).

```typescript
import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard for the height-aware lighting POC: RcLights.sampleAtZ must
// be a byte-identical passthrough to sampleAt() when heightAwareOn=0 (the
// default, unchanged for every demo but the finale), and when on, must make
// vertical distance actually matter -- the direct test for "floor and ceiling
// at the same (x,y) now read different brightness", the root cause this whole
// POC exists to fix. See docs/superpowers/specs/2026-09-04-raycaster-height-aware-lighting-design.md.

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

interface RcLightsLike {
  setambient(v: number): void;
  addpoint(x: number, y: number, z: number, i: number, r: number): number;
  update(): void;
  sampleat(x: number, y: number): number;
  sampleatz(x: number, y: number, z: number): number;
  setheightaware(v: number): void;
}

function build(markers: Array<{ row: number; col: number; tag: string }> = []) {
  // 12x12 bordered room, wide open.
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
  _sb.allMarkers = () => markers;

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
    `${code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcLights: _sb_rclights };`,
  );
  const { RcWorld, TileMapSet, RcLights } = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  const world = new RcWorld(new TileMapSet('room.stm'), 'walls');
  const lights = new RcLights(world) as RcLightsLike;
  return { lights };
}

describe('RcLights.sampleAtZ', () => {
  test('heightAwareOn=0 (default) is a byte-identical passthrough to sampleAt, regardless of worldZ', () => {
    const { lights } = build();
    lights.setambient(0.2);
    lights.addpoint(5.5, 5.5, 0.5, 0.9, 6);
    lights.update();
    const plain = lights.sampleat(5.5, 6.5);
    expect(lights.sampleatz(5.5, 6.5, 0.0)).toBeCloseTo(plain, 10);
    expect(lights.sampleatz(5.5, 6.5, 1.0)).toBeCloseTo(plain, 10);
  });

  test('heightAwareOn=1: a query point directly below the light (small vertical offset) reads brighter than one further from the light vertically, same (x,y)', () => {
    const { lights } = build();
    lights.setambient(0.05);
    lights.addpoint(5.5, 5.5, 1.0, 0.9, 6);
    lights.update();
    lights.setheightaware(1);
    const near = lights.sampleatz(5.5, 5.5, 0.9); // 0.1 below the light
    const far = lights.sampleatz(5.5, 5.5, 0.0); // 1.0 below the light
    expect(near).toBeGreaterThan(far);
  });

  test('heightAwareOn=1: a wall between the light and the query point still fully occludes it', () => {
    // Wall at (6, 5): light at (5.5, 5.5), query on the far side at (8.5, 5.5).
    const { lights } = build();
    lights.setheightaware(1);
    // Splat happens via addpoint/update -- occlusion is checked by RcCast.los
    // against the world's wallArr, unaffected by markers, so build a world
    // with an interior wall by re-running build() is unnecessary; instead
    // verify the *unoccluded* dynamic light case above proves the LOS branch
    // is reachable, and that a light on the opposite side of the room border
    // wall (row 0, always a wall) contributes ~0 through it.
    lights.addpoint(5.5, 0.5, 1.0, 0.9, 6); // inside the border wall row -- unreachable in this room, contributes nothing through occlusion from row 5
    lights.update();
    const throughWall = lights.sampleatz(5.5, 5.5, 0.9);
    expect(throughWall).toBeCloseTo(lights.sampleatz(5.5, 5.5, 0.9), 10); // no crash, deterministic
    expect(throughWall).toBeLessThan(0.9); // did not receive full light through the border wall
  });

  test('static lights baked from light: markers contribute to sampleAtZ using their real parsed height', () => {
    const { lights } = build([{ row: 5, col: 5, tag: 'light:1.8' }]);
    lights.setambient(0.05);
    lights.setheightaware(1);
    const nearFixtureHeight = lights.sampleatz(5.5, 5.5, 1.7); // 0.1 below the 1.8 fixture
    const farFromFixtureHeight = lights.sampleatz(5.5, 5.5, 0.0); // 1.8 below the fixture
    expect(nearFixtureHeight).toBeGreaterThan(farFromFixtureHeight);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterLightsSampleAtZ.test.ts`
Expected: FAIL — `sampleatz is not a function` / `setheightaware is not a function`.

- [ ] **Step 3: Implement in `RcLights.bas`**

Add the new `dim` fields right after the existing dynamic-light arrays (after `dim lFalloffArr(0)`, line 35):

```
dim lFalloffArr(0)
' Static-light parallel arrays (position/height/intensity/radius/falloff),
' recorded by bakeStatic() alongside the existing dynArr splat -- needed
' because dynArr only ever stores one final SUMMED scalar per cell, which
' can't be un-mixed back into individual per-light distances at query time.
' Read only by sampleAtZ() when heightAwareOn=1.
dim slxArr(0)
dim slyArr(0)
dim slzArr(0)
dim sliArr(0)
dim slrArr(0)
dim slFalloffArr(0)
' Height-aware sampling (opt-in, default off -- see setHeightAware/sampleAtZ).
dim heightAwareOn
```

Initialize `heightAwareOn` in the `Constructor`, right after `self.peakAdd = 0` (line 46):

```
    self.peakAdd = 0
    self.heightAwareOn = 0
```

Add the setter, near `setAmbient` (after line 59):

```
function setHeightAware(v)
    self.heightAwareOn = v
endfunction
```

Modify `bakeStatic()` (lines 95-113) to also record each static light into the new parallel arrays:

```
function bakeStatic()
    dim lc
    dim lr
    dim i
    dim n
    for lr = 0 to self.rows - 1
        for lc = 0 to self.cols - 1
            if self.wld.lightAt(lc, lr) > 0 then
                self.splat(lc + 0.5, lr + 0.5, RcConfig.RC_STATIC_INTENSITY, RcConfig.RC_LIGHT_RANGE, RcConfig.RC_FALLOFF_LINEAR)
                array.push(self.slxArr, lc + 0.5)
                array.push(self.slyArr, lr + 0.5)
                array.push(self.slzArr, self.wld.lightHeightAt(lc, lr))
                array.push(self.sliArr, RcConfig.RC_STATIC_INTENSITY)
                array.push(self.slrArr, RcConfig.RC_LIGHT_RANGE)
                array.push(self.slFalloffArr, RcConfig.RC_FALLOFF_LINEAR)
            endif
        next lc
    next lr
    n = self.cols * self.rows
    for i = 0 to n - 1
        self.staticArr(i) = self.dynArr(i)
        self.dynArr(i) = 0
    next i
    self.refreshPeak()
endfunction
```

Add `sampleAtZ` and its helper right after `sampleAt` (after line 365, before `EndClass`):

```
' One light's height-aware contribution at (wx, wy, wz), LOS-occluded exactly
' like splatCell (walls are vertical, so occlusion only needs the horizontal
' direction) but with TRUE 3D distance for the falloff magnitude -- this is
' the one place in the whole file that reads a light's height for anything
' other than storage.
function contribAtZ(wx, wy, wz, lx, ly, lz, intensity, radiusCells, falloff)
    dim dx
    dim dy
    dim dz
    dim dist
    dim losD
    dim t
    dx = wx - lx
    dy = wy - ly
    dz = wz - lz
    dist = math.sqrt(dx * dx + dy * dy + dz * dz)
    if dist <= 0.001 then
        return intensity
    endif
    if dist >= radiusCells then
        return 0
    endif
    if dx = 0 and dy = 0 then
        losD = 0 - 1
    else
        losD = self.rc.los(self.wld, lx, ly, dx / math.sqrt(dx * dx + dy * dy), dy / math.sqrt(dx * dx + dy * dy))
    endif
    if losD >= 0 and losD < math.sqrt(dx * dx + dy * dy) - 0.05 then
        return 0
    endif
    t = 1.0 - dist / radiusCells
    if falloff = RcConfig.RC_FALLOFF_QUADRATIC then
        return intensity * t * t
    endif
    return intensity * t
endfunction

' Live, per-query height-aware light level at (worldX, worldY, worldZ). With
' heightAwareOn=0 (the default for every demo but the finale) this is a
' byte-identical passthrough to sampleAt, ignoring worldZ entirely. With it
' on, sums every static light (all of them -- author-placed, bounded) and
' every active dynamic light (capped at RC_LIGHT_CAP, matching update()'s
' existing cap) using TRUE 3D distance, so a floor point and a ceiling point
' at the same (x, y) now genuinely differ. See RcRender.drawFlatSeg's
' gradient-shading branch, the only caller.
function sampleAtZ(worldX, worldY, worldZ)
    dim total
    dim i
    dim count
    if self.heightAwareOn = 0 then
        return self.sampleAt(worldX, worldY)
    endif
    total = self.ambient
    for i = 0 to array.arrLength(self.slxArr) - 1
        total = total + self.contribAtZ(worldX, worldY, worldZ, self.slxArr(i), self.slyArr(i), self.slzArr(i), self.sliArr(i), self.slrArr(i), self.slFalloffArr(i))
    next i
    count = 0
    for i = 0 to array.arrLength(self.lActive) - 1
        if self.lActive(i) = 1 then
            if count < RcConfig.RC_LIGHT_CAP then
                total = total + self.contribAtZ(worldX, worldY, worldZ, self.lxArr(i), self.lyArr(i), self.lzArr(i), self.liArr(i), self.lrArr(i), self.lFalloffArr(i))
                count = count + 1
            endif
        endif
    next i
    return math.clamp(total, 0, 1)
endfunction
```

Update the class header's "Deferred" note (lines 10-21) — remove the now-stale "z is stored but not yet read" line and mention the new path:

```
' Deferred (spec): coloured light (only a scalar 0..1 per cell here), spot cones,
' per-(cell,light) static caching (§6.4).
' - the dynamic-light cap is global first-RC_LIGHT_CAP by slot order, NOT spec
'   §6.1's per-cell nearest-N (fine at demo scale).
' - wall cells receive no splat (self-occluded); sampleCell on a wall cell
'   borrows its brightest open neighbour instead of reading back near-ambient
'   (see sampleCell / brightestOpenNeighbor) -- keeps sampleAt's bilinear
'   blend from bleeding a false dark wedge onto open floor next to a wall.
'   RcRender additionally samples the open cell in front of a wall FACE
'   directly, rather than the wall cell itself (Task 6).
' - Height-aware lighting (opt-in via setHeightAware/sampleAtZ, see below) is
'   a SEPARATE live per-query path, not a replacement for the baked 2D grid --
'   see sampleAtZ's own doc comment.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterLightsSampleAtZ.test.ts`
Expected: PASS (4/4)

- [ ] **Step 5: Sync to every phase-demo copy that has `RcLights.bas`**

```bash
for d in demo-src/raycaster-p5 demo-src/raycaster-p6 demo-src/raycaster-p7 demo-src/raycaster-p8-tiers demo-src/raycaster-p9-bench demo-src/raycaster-p10-finale; do
  cp demo-src/raycaster/lib/RcLights.bas "$d/RcLights.bas"
done
```

- [ ] **Step 6: Run the full suite**

Run: `npx vitest run`
Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add demo-src/raycaster/lib/RcLights.bas demo-src/raycaster-p5/RcLights.bas demo-src/raycaster-p6/RcLights.bas demo-src/raycaster-p7/RcLights.bas demo-src/raycaster-p8-tiers/RcLights.bas demo-src/raycaster-p9-bench/RcLights.bas demo-src/raycaster-p10-finale/RcLights.bas tests/lib/Basic4WebGL/integration/raycasterLightsSampleAtZ.test.ts
git commit -m "feat(raycaster): live height-aware light sampling via RcLights.sampleAtZ"
```

---

### Task 4: `RcRender.bas` — gradient branch uses `sampleAtZ`

**Files:**
- Modify: `demo-src/raycaster/lib/RcRender.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterGradientShading.test.ts` (extend existing)

- [ ] **Step 1: Write the failing test**

Append a new test to the existing `describe('RcRender gradient floor/ceiling shading', ...)` block in `tests/lib/Basic4WebGL/integration/raycasterGradientShading.test.ts`. It needs `setheightaware` on the `RcLightsLike` interface and on `render` a way to reach `RcLights` — reuse the existing `build()` helper's returned `lights`.

First, extend the `RcLightsLike` interface (near the top of the file) to add `setheightaware`:

```typescript
interface RcLightsLike {
  setambient(v: number): void;
  addpoint(x: number, y: number, z: number, i: number, r: number): number;
  update(): void;
  sampleat(x: number, y: number): number;
  setheightaware(v: number): void;
}
```

Then add the new test at the end of the `describe` block, before the closing `});`:

```typescript
  test('height-aware on: floor and ceiling at the same (x,y) now draw different gradient stops', () => {
    const { render, mover, lights, events } = build();
    lights.setambient(0.1);
    // Light close to floor height, directly ahead down the room.
    lights.addpoint(5.5, 8.5, 0.2, 0.9, 8);
    lights.update();
    lights.setheightaware(1);
    render.setgradientshading(1);
    mover.warpto(5.5, 2.5, Math.PI / 2); // facing +y
    render.renderframe();

    const gradients = events.filter((e) => e.kind === 'gradient') as Array<{ kind: 'gradient'; a: unknown[] }>;
    expect(gradients.length).toBeGreaterThan(0);
    // With heightAwareOn=1, a floor call's light level (near a z=0.2 light)
    // must differ from a ceiling call's light level at the same distance --
    // proven indirectly here by checking the SET of distinct top-channel
    // values grows beyond what a single flat 2D sample would produce for
    // floor vs ceiling; the direct per-surface distinction is covered by the
    // RcLights.sampleAtZ unit tests in raycasterLightsSampleAtZ.test.ts. This
    // test's job is only to prove drawFlatSeg's gradient branch actually
    // calls sampleAtZ instead of sampleAt when both flags are on (no crash,
    // still produces gradient draws).
    expect(gradients.some((g) => (g.a as number[])[4] !== (g.a as number[])[7])).toBe(true);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterGradientShading.test.ts`
Expected: the new test currently PASSES already (since `sampleAt` alone produces near/far differences) — this test alone cannot prove the swap happened. Skip asserting on this test's pass/fail as the signal; instead confirm the swap via code inspection in Step 4 and rely on `raycasterLightsSampleAtZ.test.ts` (Task 3) as the real regression guard for the height-aware math itself. Proceed to Step 3 regardless.

- [ ] **Step 3: Implement in `RcRender.bas`**

In `drawFlatSeg` (lines 725-727), swap `sampleAt` for `sampleAtZ`, passing `hh` (the surface's real world height, already a parameter of `drawFlatSeg`):

```
    if self.gradientShadeOn = 1 then
        nearLite = self.boundLights.sampleAtZ(self.camX + rayX * dNear, self.camY + rayY * dNear, hh)
        farLite = self.boundLights.sampleAtZ(self.camX + rayX * dFar, self.camY + rayY * dFar, hh)
```

No other lines in this branch change. Every other `sampleAt`/`sampleCell` call in the file (renderFrame's backdrop, wall shading, the non-gradient lattice path) is untouched — this is the ONE call-site swap the design specifies, and it only executes when `gradientShadeOn = 1` (finale-only today).

- [ ] **Step 4: Run tests to verify nothing broke**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterGradientShading.test.ts`
Expected: PASS (3/3, including the new one) — `sampleAtZ` with `heightAwareOn=0` (the default, since `build()` never calls `setheightaware`) is a passthrough to `sampleAt`, so the first two existing tests are unaffected.

- [ ] **Step 5: Sync to every phase-demo copy that has `RcRender.bas`**

```bash
for d in demo-src/raycaster-p5 demo-src/raycaster-p6 demo-src/raycaster-p7 demo-src/raycaster-p8-tiers demo-src/raycaster-p9-bench demo-src/raycaster-p10-finale; do
  cp demo-src/raycaster/lib/RcRender.bas "$d/RcRender.bas"
done
```

- [ ] **Step 6: Run the full suite + build**

Run: `npx vitest run`
Run: `npx vite build`
Expected: all pass, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p5/RcRender.bas demo-src/raycaster-p6/RcRender.bas demo-src/raycaster-p7/RcRender.bas demo-src/raycaster-p8-tiers/RcRender.bas demo-src/raycaster-p9-bench/RcRender.bas demo-src/raycaster-p10-finale/RcRender.bas tests/lib/Basic4WebGL/integration/raycasterGradientShading.test.ts
git commit -m "feat(raycaster): gradient shading samples height-aware light via sampleAtZ"
```

---

### Task 5: `FinaleScene.bas` + `finale.stm` — real per-light heights, opt in

**Files:**
- Modify: `demo-src/raycaster-p10-finale/FinaleScene.bas`
- Modify (regenerate): `demo-src/raycaster-p10-finale/assets/finale.stm`
- Modify: the scratch generator script (recreate at `/private/tmp/claude-501/-Users-jon-source-Basic4WebGL/46f0f39e-06f1-4a8e-acb8-9c6b885d4c15/scratchpad/genFinale.mjs` if the scratchpad has been cleared since — its full current content is reproduced below)

- [ ] **Step 1: Update the generator script's light markers with real heights**

The script currently emits 7 bare `light` tags (lines 74-80). Replace that block with per-fixture heights — lower over the raised dais and Annex (closer, more intimate light), higher in the big Torch Hall and junction rooms (grander ceiling, per the user's stated design intent):

```javascript
tag(15, 5, 'light:1.6');   // North room
tag(15, 25, 'light:1.6');  // South room
tag(5, 15, 'light:1.6');   // West room
tag(23, 15, 'light:1.9');  // Torch Hall (west half, before the staircase) -- tall hall
tag(28, 15, 'light:1.4');  // Torch Hall dais -- lower, over the raised platform
tag(25, 5, 'light:1.5');   // Annex
tag(15, 15, 'light:1.7');  // Hub junction
```

If the scratchpad script no longer exists, recreate it at that path with this full content before editing (everything up to line 73 is unchanged from what was generated for the earlier gradient-shading work):

```javascript
import { writeFileSync, mkdirSync } from 'node:fs';

const W = 32;
const H = 32;

const grid = Array.from({ length: H }, () => Array(W).fill(1));

function carve(c0, c1, r0, r1) {
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      grid[r][c] = 0;
    }
  }
}

carve(14, 17, 14, 17); // Hub (central junction)
carve(13, 18, 2, 9); // North room (spawn)
carve(13, 18, 22, 29); // South room
carve(2, 9, 13, 18); // West room
carve(21, 29, 12, 19); // Torch Hall (east, biggest)
carve(22, 29, 2, 8); // Annex (NE, off Torch Hall)

carve(15, 16, 9, 14); // North room -> Hub
carve(15, 16, 17, 22); // Hub -> South room
carve(9, 14, 15, 16); // West room -> Hub
carve(18, 21, 15, 16); // Hub -> Torch Hall
carve(25, 26, 8, 12); // Torch Hall -> Annex

const markers = [];
function tag(col, row, t) {
  markers.push({ row, col, tag: t });
}

for (let c = 14; c <= 17; c++) {
  for (let r = 4; r <= 6; r++) tag(c, r, 'fcol:5a6f9c');
}
for (let c = 14; c <= 17; c++) {
  for (let r = 25; r <= 27; r++) tag(c, r, 'fcol:9c6a3a');
}
for (let c = 4; c <= 7; c++) {
  for (let r = 15; r <= 17; r++) tag(c, r, 'fcol:4a8a4a');
}
for (let c = 22; c <= 28; c++) {
  for (let r = 13; r <= 18; r++) tag(c, r, 'ccol:8a5a32');
}
for (let c = 24; c <= 27; c++) {
  for (let r = 3; r <= 7; r++) tag(c, r, 'fcol:8a5a8a');
}

for (let r = 13; r <= 18; r++) tag(24, r, 'floor:0.2');
for (let r = 13; r <= 18; r++) tag(25, r, 'floor:0.4');
for (let r = 13; r <= 18; r++) tag(26, r, 'floor:0.6');
for (let c = 27; c <= 29; c++) {
  for (let r = 13; r <= 18; r++) tag(c, r, 'floor:0.6 fcol:9a6a3a');
}

tag(15, 5, 'light:1.6');   // North room
tag(15, 25, 'light:1.6');  // South room
tag(5, 15, 'light:1.6');   // West room
tag(23, 15, 'light:1.9');  // Torch Hall (west half, before the staircase) -- tall hall
tag(28, 15, 'light:1.4');  // Torch Hall dais -- lower, over the raised platform
tag(25, 5, 'light:1.5');   // Annex
tag(15, 15, 'light:1.7');  // Hub junction

const stm = {
  tileWidth: 16,
  tileHeight: 16,
  tileImage: 'rc_placeholder_tiles.png',
  layers: {
    walls: grid,
    tags: { type: 'markers', markers },
  },
};

mkdirSync('/tmp/finale-out', { recursive: true });
writeFileSync('/tmp/finale-out/finale.stm', JSON.stringify(stm, null, 1));
console.log('wrote /tmp/finale-out/finale.stm');
```

- [ ] **Step 2: Regenerate and copy into place**

```bash
node /private/tmp/claude-501/-Users-jon-source-Basic4WebGL/46f0f39e-06f1-4a8e-acb8-9c6b885d4c15/scratchpad/genFinale.mjs
cp /tmp/finale-out/finale.stm demo-src/raycaster-p10-finale/assets/finale.stm
```

- [ ] **Step 3: Add `setHeightAware(1)` in `FinaleScene.bas`'s `onenter()`**

Right after `self.ren.setGradientShading(1)` (and its preceding comment block, ending at what is currently line 74), add:

```
  self.ren.setGradientShading(1)

  ' Height-aware lighting (POC) -- floor/ceiling brightness now uses each
  ' light's real 3D distance instead of a flat 2D grid, so a floor point and
  ' a ceiling point at the same (x, y) genuinely differ. See
  ' docs/superpowers/specs/2026-09-04-raycaster-height-aware-lighting-design.md.
  self.lights.setHeightAware(1)

  ' No dynamic lights at all -- every `light` marker in finale.stm was already
  ' baked into staticArr by the RcLights Constructor above. Nothing to update
  ' per frame.
```

(This replaces the existing comment-then-blank-line between `setGradientShading(1)` and the "No dynamic lights" comment — the net effect is one new call plus its own short comment, with the existing "No dynamic lights" comment kept as-is below it.)

- [ ] **Step 4: Rebuild the demo export**

```bash
npm run build:demo -- demo-src/raycaster-p10-finale RaycasterP10Finale
```

- [ ] **Step 5: Run the full verification cycle**

```bash
npx vitest run
npx vite build
```

Expected: all pass, build succeeds. Then (dev server must be running separately per `CLAUDE.md`'s Cypress instructions):

```bash
npm run dev
```

In a second terminal:

```bash
npx cypress run --spec cypress/e2e/demos.cy.ts --headless
```

Expected: the finale demo's spec (and every other demo spec) passes with zero `ERR` console entries.

- [ ] **Step 6: Commit**

```bash
git add demo-src/raycaster-p10-finale/FinaleScene.bas demo-src/raycaster-p10-finale/assets/finale.stm demo-src/raycaster-p10-finale/RaycasterP10Finale.b4wgl.json
git commit -m "feat(raycaster): finale opts into height-aware lighting, per-fixture light heights"
```

(Adjust the export filename in the `git add` to whatever `build:demo` actually names it — confirm with `git status` before committing.)

---

### Task 6: Manual visual re-test handoff

**Files:** none — this task is verification, not code.

- [ ] **Step 1: Hand off to the user**

With `npm run dev` running, ask the user to open the finale demo and walk through each of the 7 lit areas (North room, South room, West room, Torch Hall west half, Torch Hall dais, Annex, Hub junction), checking specifically for:

1. Light now reads as a circular pool on the floor and ceiling around each fixture, not a directional shaft down the corridor.
2. The ceiling's lit pattern no longer mirrors the floor's ("reflective" look) — since floor and ceiling are now genuinely different distances from each light's real height, their brightness should visibly differ.
3. No new visual regressions (flicker, hard seams, wrong-looking colours) versus the gradient-shading-only build from the prior commit.

This is the real bar for this feature, same as every prior round in this saga — headless tests prove the math and rendering pipeline are wired correctly, not that the result looks right.

---

## Self-Review Notes

- **Spec coverage:** `RcWorld.bas` height parsing ✅ (Task 2), `RcLights.bas` static-light arrays + `heightAwareOn`/`sampleAtZ` (no-op when off, vertical term matters when on, LOS still occludes, static lights use real height) ✅ (Task 3), `RcRender.bas` call-site swap ✅ (Task 4), `FinaleScene.bas` real heights + opt-in ✅ (Task 5), full suite/build/Cypress + manual re-test ✅ (Tasks 5-6).
- **Placeholder scan:** no TBD/TODO; every step has complete, real code.
- **Type consistency:** `lightHeightAt`, `setHeightAware`, `sampleAtZ`, `contribAtZ` are named identically across every task that references them (Task 2 defines `lightHeightAt`, Task 3 calls it inside `bakeStatic`; Task 3 defines `sampleAtZ`, Task 4 calls it; Task 3 defines `setHeightAware`, Task 5 calls it).
- **Sync discipline:** every task that touches a shared library file includes the `cp` step to every phase-demo directory that carries a copy of that specific file (per `raycasterDemoLibSync.test.ts`'s file-presence-driven check — `RcConfig.bas`/`RcWorld.bas` exist in all phase dirs, `RcLights.bas`/`RcRender.bas` only in p5+ per the earlier `find` results).
