# Raycaster Wall Decals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a `decal:<image>` marker put a fixed-size, floor-anchored, alpha
textured insert on a raycaster wall face — a door, sign, light, or picture —
without stretching or tiling the wall texture underneath it.

**Architecture:** A general-purpose `assetmanager.imageWidth`/`imageHeight`
accessor exposes raw image pixel dimensions to softBASIC for the first time.
`RcWorld` parses `decal:` markers into a per-cell string array, mirroring the
existing `tex:`/`wallTexArr` pattern exactly. `RcRender` draws the decal as a
second per-column strip, co-planar with the wall, immediately after the wall
strip for that column, reusing the same per-column `d`/`u` the wall draw
already computed.

**Tech Stack:** softBASIC (transpiles to JS), Vitest, PIXI.js engine modules.

**Spec:** `docs/superpowers/specs/2026-09-10-raycaster-wall-decals-design.md` —
read it before starting; this plan does not repeat the design rationale.

---

### Task 1: `assetmanager.imageWidth` / `imageHeight`

**Files:**
- Modify: `src/lib/Basic4WebGL/library/descriptors/assetmanager.descriptor.ts`
- Modify (generated, do not hand-edit further): `src/lib/Basic4WebGL/defs/assetmanager.bas`
- Modify: `src/components/Runner/engine/assets.js`
- Test: `tests/lib/Basic4WebGL/unit/transpiler/assetmanager.test.ts`
- Test: `tests/components/Runner/assets.test.ts`
- Test: `src/docs/api-reference/assetmanager.md`

- [ ] **Step 1: Write the failing transpiler test**

Add to `tests/lib/Basic4WebGL/unit/transpiler/assetmanager.test.ts`, as a new
`describe` block after the existing `defineRegion` one:

```ts
describe('assetmanager.imageWidth / imageHeight', () => {
  test('compile to the expected _sb calls', () => {
    const result = transpile(
      [
        'dim w',
        'dim h',
        'w = assetmanager.imageWidth("door.png")',
        'h = assetmanager.imageHeight("door.png")',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sb.imageWidth(imagewidth_name)');
    expect(result.code).toContain('_sb.imageHeight(imageheight_name)');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/assetmanager.test.ts`
Expected: FAIL — `assetmanager.bas` has no `imageWidth`/`imageHeight` function,
so the parser reports an unknown-function diagnostic.

- [ ] **Step 3: Add the descriptor functions**

In `src/lib/Basic4WebGL/library/descriptors/assetmanager.descriptor.ts`, add two
entries to the `functions` array (after `defineRegion`):

```ts
    {
      name: 'imageWidth',
      params: ['name'],
      returns: (p, _self) => `_sb.imageWidth(${p.name})`,
    },
    {
      name: 'imageHeight',
      params: ['name'],
      returns: (p, _self) => `_sb.imageHeight(${p.name})`,
    },
```

- [ ] **Step 4: Regenerate the `.bas` file**

Run: `npm run generate:library`

This rewrites `src/lib/Basic4WebGL/defs/assetmanager.bas`. Confirm it now ends
with:

```bas
function imageWidth(name)
    return call("_sb.imageWidth(imagewidth_name)")
endfunction

function imageHeight(name)
    return call("_sb.imageHeight(imageheight_name)")
endfunction
```

Do not hand-edit this file — if the output doesn't match, fix the descriptor
and regenerate again.

- [ ] **Step 5: Run the transpiler test to confirm it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/unit/transpiler/assetmanager.test.ts`
Expected: PASS (2 describe blocks, 3 tests).

- [ ] **Step 6: Write the failing engine test**

Add to `tests/components/Runner/assets.test.ts`, as a new `describe` block after
`getSlices — memoized frame slicing`:

```ts
describe('imageWidth / imageHeight — raw pixel dimensions by asset name', () => {
  test('return the loaded image\'s width and height', async () => {
    const { assets } = await preloadedAssets();
    expect(assets.imageWidth('sheet.png')).toBe(256);
    expect(assets.imageHeight('sheet.png')).toBe(256);
  });

  test('imageWidth on an unknown name throws the same "not found" error as get()', () => {
    const assets = loadAssets();
    expect(() => assets.imageWidth('missing.png')).toThrow(/not found/);
  });
});
```

- [ ] **Step 7: Run it to confirm it fails**

Run: `npx vitest run tests/components/Runner/assets.test.ts`
Expected: FAIL — `imageWidth is not a function`.

- [ ] **Step 8: Implement `imageWidth`/`imageHeight` in the engine**

In `src/components/Runner/engine/assets.js`, add two methods to the object
returned from the `_sbAssets` IIFE, right after `get(name) { ... }`:

```js
    imageWidth(name) {
      return this.get(name).width;
    },

    imageHeight(name) {
      return this.get(name).height;
    },
```

- [ ] **Step 9: Run the engine test to confirm it passes**

Run: `npx vitest run tests/components/Runner/assets.test.ts`
Expected: PASS.

- [ ] **Step 10: Document the new functions**

In `src/docs/api-reference/assetmanager.md`, add a new section after
`loadImage(name)` and before `defineRegion(...)`:

```markdown
## imageWidth(name)

Returns the width of a loaded image, in pixels.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The filename of the image, as it appears in your project's Assets panel. |

**Returns:** number — the image's width in pixels.

```bas
dim w
w = assetmanager.imageWidth("player.png")
```

## imageHeight(name)

Returns the height of a loaded image, in pixels.

| Parameter | Type   | Description |
|-----------|--------|-------------|
| name      | string | The filename of the image, as it appears in your project's Assets panel. |

**Returns:** number — the image's height in pixels.

```bas
dim h
h = assetmanager.imageHeight("player.png")
```
```

- [ ] **Step 11: Verify the build and full suite**

Run: `npx vite build`
Expected: succeeds.

Run: `npx vitest run`
Expected: all tests pass, including
`tests/lib/Basic4WebGL/unit/generator/generatedDefsInSync.test.ts` (confirms
the regenerated `.bas` matches the descriptor).

- [ ] **Step 12: Commit**

```bash
git add src/lib/Basic4WebGL/library/descriptors/assetmanager.descriptor.ts \
        src/lib/Basic4WebGL/defs/assetmanager.bas \
        src/components/Runner/engine/assets.js \
        tests/lib/Basic4WebGL/unit/transpiler/assetmanager.test.ts \
        tests/components/Runner/assets.test.ts \
        src/docs/api-reference/assetmanager.md
git commit -m "feat(assetmanager): add imageWidth/imageHeight accessors

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: `RcWorld` — `decal:` marker + accessors

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/RcWorld.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterWallDecals.test.ts` (new)

**Context:** `RcWorld.bas` already parses `tex:` into `wallTexArr` /
`wallTexAt(col,row)`. Follow that pattern exactly for `decal:` /
`decalArr` / `decalAt(col,row)`, plus a `hasDecals()` fast-path flag mirroring
`hasSurfaceColor()`.

- [ ] **Step 1: Write the failing test file**

Create `tests/lib/Basic4WebGL/integration/raycasterWallDecals.test.ts`. This
reuses the exact transpile/proxy harness from
`tests/lib/Basic4WebGL/integration/raycasterWallTexScale.test.ts` — copy its
imports, `lib`, `walls`/`markers` setup helpers and the `_sb` stub shape, but
build a small dedicated map and start with only the `RcWorld` tests (the render
tests are added in Task 3):

```ts
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

// 5x5 room: perimeter walls, one decal on the north wall at (2,0), one plain
// wall at (3,0) with no decal.
const COLS = 5, ROWS = 5;
const walls: number[][] = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1 ? 1 : 0)),
);
const markers = [{ row: 0, col: 2, tag: 'decal:door.png' }];

function buildWorld() {
  const { files: ordered, error } = sortByDependencies([]);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files: ordered });
  expect(result.diagnostics).toEqual([]);

  const tw = 16;
  const stub: Record<string, unknown> = {};
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(t, p: string) { if (p === Symbol.toPrimitive || p === 'then') return undefined; if (p in t) return t[p]; return (..._a: unknown[]) => proxy; },
    set(t, p: string, v) { t[p] = v; return true; }, apply: () => proxy,
  };
  const proxy = new Proxy(function () {} as never, handler) as never;
  const _sb = new Proxy(stub, handler) as Record<string, unknown> & ((...a: unknown[]) => unknown);
  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.hasLayer = (_h: unknown, n: string) => n === 'walls';
  _sb.tileWidth = () => tw; _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => COLS * tw; _sb.tileMapHeightPx = () => ROWS * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) => walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => markers.map((m) => ({ ...m }));

  const deferred: Array<() => void> = [];
  _sb._deferModuleBody = (cb: () => void) => deferred.push(cb);
  const _createArray = (init: unknown[]) => (Array.isArray(init) && init.length === 1 && init[0] === 0 ? [] : [...(init ?? [])]);
  const helpers: Record<string, unknown> = {
    _sbLength: (x: { length?: number }) => x?.length ?? 0, _sbJoin: (x: unknown[], s: string) => x.join(s),
    _sbContains: (x: unknown[], i: unknown) => x.includes(i), _sbRemove: () => {}, _sbClear: (x: unknown[]) => x.splice(0),
    _sbCheckedArrayGet: (a: unknown[], i: number) => a[i], _createDict: () => new Map(),
  };
  const factory = new Function('_sb', '_createArray', ...Object.keys(helpers), 'console',
    `${result.code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset };`);
  const M = factory(_sb, _createArray, ...Object.values(helpers), { log() {}, warn() {}, error() {} });
  deferred.forEach((cb) => cb());

  return new M.RcWorld(new M.TileMapSet('c.stm'), 'walls');
}

describe('RcWorld — decal: marker', () => {
  test('decalAt returns the image name for a tagged cell', () => {
    const world = buildWorld();
    expect(world.decalat(2, 0)).toBe('door.png');
  });

  test('decalAt returns "" for a cell with no decal', () => {
    const world = buildWorld();
    expect(world.decalat(3, 0)).toBe('');
  });

  test('decalAt returns "" out of bounds', () => {
    const world = buildWorld();
    expect(world.decalat(-1, 0)).toBe('');
    expect(world.decalat(99, 99)).toBe('');
  });

  test('hasDecals is 1 when any cell carries a decal', () => {
    const world = buildWorld();
    expect(world.hasdecals()).toBe(1);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterWallDecals.test.ts`
Expected: FAIL — `decalat`/`hasdecals` are not functions on `RcWorld` yet.

- [ ] **Step 3: Add the `decalArr` field and `decalSeen` flag**

In `src/lib/Basic4WebGL/defs/RcWorld.bas`, find the `dim wallTexArr(0)` line
near the top (around line 23) and add a `decalArr` dim next to the other
per-cell arrays. Also find `dim surfColSeen` (the `hasSurfaceColor` fast-path
flag, just above `dim heightVarSeen`) and add a matching `decalSeen` flag right
after `dim heightVarSeen`:

```basic
' Per-cell decal image name, from a `decal:<image>` tag. "" = no decal.
' decalSeen is a fast-path flag mirroring surfColSeen/heightVarSeen: 1 if any
' cell carries a decal, so RcRender can skip the per-column decal check
' entirely on levels that don't use the feature.
dim decalArr(0)
dim decalSeen
```

(Place `dim decalArr(0)` next to `dim wallTexArr(0)`'s group and `dim
decalSeen` next to `dim heightVarSeen` — keep the file's existing grouping of
"per-cell arrays" vs "fast-path flags" rather than bunching both declarations
in one spot.)

- [ ] **Step 4: Initialise `decalArr` and `decalSeen` in `build()`**

In `build()`, find the cell-init loop:

```basic
    for i = 0 to total - 1
        array.push(self.wallArr, 0)
        array.push(self.floorHArr, 0)
        array.push(self.ceilHArr, RcConfig.RC_UNTAGGED)
        array.push(self.wallTexArr, "")
        array.push(self.floorTexArr, "")
        array.push(self.ceilTexArr, "")
        array.push(self.floorColArr, 0 - 1)
        array.push(self.ceilColArr, 0 - 1)
        array.push(self.lightArr, 0)
        array.push(self.lightHArr, RcConfig.RC_UNTAGGED)
        array.push(self.flagsArr, 0)
        array.push(self.diagArr, 0)
    next i
```

Add `array.push(self.decalArr, "")` to this loop (after `array.push(self.wallTexArr, "")`):

```basic
    for i = 0 to total - 1
        array.push(self.wallArr, 0)
        array.push(self.floorHArr, 0)
        array.push(self.ceilHArr, RcConfig.RC_UNTAGGED)
        array.push(self.wallTexArr, "")
        array.push(self.decalArr, "")
        array.push(self.floorTexArr, "")
        array.push(self.ceilTexArr, "")
        array.push(self.floorColArr, 0 - 1)
        array.push(self.ceilColArr, 0 - 1)
        array.push(self.lightArr, 0)
        array.push(self.lightHArr, RcConfig.RC_UNTAGGED)
        array.push(self.flagsArr, 0)
        array.push(self.diagArr, 0)
    next i
```

Also find `self.surfColSeen = 0` / `self.heightVarSeen = 0` near the top of
`build()` and add `self.decalSeen = 0` next to them:

```basic
    self.surfColSeen = 0
    self.heightVarSeen = 0
    self.decalSeen = 0
```

- [ ] **Step 5: Parse `decal:` in `applyKv`**

In `applyKv(idx, key, v)`, add a branch after the `ctex` branch:

```basic
    if key = "decal" then
        self.decalArr(idx) = v
        self.decalSeen = 1
    endif
```

- [ ] **Step 6: Add the `decalAt` and `hasDecals` accessors**

Add these two functions near `wallTexAt` (after it), matching its exact style:

```basic
function decalAt(col, row)
    if self.inBounds(col, row) = 0 then
        return ""
    endif
    return self.decalArr(row * self.cols + col)
endfunction

' 1 if any cell carries a decal: tag -- lets the renderer skip the per-column
' decal lookup entirely on levels that don't use the feature.
function hasDecals()
    return self.decalSeen
endfunction
```

- [ ] **Step 7: Run the test to confirm it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterWallDecals.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 8: Run the full raycaster suite**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/`
Expected: all existing raycaster integration tests still pass (no regression
in `raycasterFlatFillHeightVariation.test.ts`, `raycasterSettings.test.ts`,
`raycasterWallTexScale.test.ts`, etc.).

- [ ] **Step 9: Commit**

```bash
git add src/lib/Basic4WebGL/defs/RcWorld.bas \
        tests/lib/Basic4WebGL/integration/raycasterWallDecals.test.ts
git commit -m "feat(raycaster): parse decal: markers in RcWorld

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `RcRender` — draw the decal strip

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/RcRender.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterWallDecals.test.ts`

**Context:** `RcRender.drawWallStrip` (around line 1149) is the model to copy
the clipping/projection style from. `projectY(h, d)` (around line 532) projects
a world height to a screen Y at a given distance. The call site is in
`renderFrame`'s `RC_SPAN_WALL` branch (around line 1459), right after
`self.drawWallStrip(...)`. `RcCast` already exposes `spanCol(i)`, `spanRow(i)`,
`spanU(i)`, `spanSide(i)`, `spanDist(i)` — all used by the existing wall-draw
call.

- [ ] **Step 1: Write the failing render test**

Add to `tests/lib/Basic4WebGL/integration/raycasterWallDecals.test.ts` a second
harness function that builds a full renderable scene (copy the `build()`
pattern from `raycasterWallTexScale.test.ts`, including its `_sb` stage/draw
stubs), plus `_sb.imageWidth`/`_sb.imageHeight` stubs for the decal image:

```ts
function buildScene(decalTag: string | null, imgW: number, imgH: number) {
  const { files: ordered, error } = sortByDependencies([]);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files: ordered });
  expect(result.diagnostics).toEqual([]);

  // 40x40, camera far from the decal wall (not adjacent to it) -- mirrors
  // raycasterWallTexScale.test.ts's pose, needed for the same reason: a
  // camera right next to the wall saturates/clips the projected span against
  // the screen edges before the aspect-ratio math can be observed.
  const COLS2 = 40, ROWS2 = 40, tw = 16;
  const walls2: number[][] = Array.from({ length: ROWS2 }, (_, r) =>
    Array.from({ length: COLS2 }, (_, c) => (r === 0 || r === ROWS2 - 1 || c === 0 || c === COLS2 - 1 ? 1 : 0)),
  );
  // ceil:3 gives the wall enough height that a 1-unit or 2-unit decal is
  // never clamped by the wall's own screen extent (drawDecalStrip clips a
  // decal to the wall's span so it can never poke above the ceiling) --
  // without this, both decal heights below would clip to the same span and
  // the aspect-ratio test couldn't tell them apart.
  // East wall, directly ahead of the camera's +x facing below.
  const markers2 = decalTag ? [{ row: 20, col: 39, tag: `${decalTag} ceil:3` }] : [];

  const stub: Record<string, unknown> = {};
  const strips: unknown[][] = [];
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(t, p: string) { if (p === Symbol.toPrimitive || p === 'then') return undefined; if (p in t) return t[p]; return (..._a: unknown[]) => proxy; },
    set(t, p: string, v) { t[p] = v; return true; }, apply: () => proxy,
  };
  const proxy = new Proxy(function () {} as never, handler) as never;
  const _sb = new Proxy(stub, handler) as Record<string, unknown> & ((...a: unknown[]) => unknown);
  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.hasLayer = (_h: unknown, n: string) => n === 'walls';
  _sb.tileWidth = () => tw; _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => COLS2 * tw; _sb.tileMapHeightPx = () => ROWS2 * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) => walls2[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => markers2.map((m) => ({ ...m }));
  _sb.getStageWidth = () => 320; _sb.getStageHeight = () => 600;
  _sb.drawImageStrip = (...a: unknown[]) => { strips.push(a); };
  _sb.drawRect = () => {};
  _sb.registerLightmap = () => {}; _sb.registerFieldTiles = () => {}; _sb.drawPlaneField = () => {};
  _sb.imageWidth = (_n: string) => imgW;
  _sb.imageHeight = (_n: string) => imgH;

  const deferred: Array<() => void> = [];
  _sb._deferModuleBody = (cb: () => void) => deferred.push(cb);
  const _createArray = (init: unknown[]) => (Array.isArray(init) && init.length === 1 && init[0] === 0 ? [] : [...(init ?? [])]);
  const helpers: Record<string, unknown> = {
    _sbLength: (x: { length?: number }) => x?.length ?? 0, _sbJoin: (x: unknown[], s: string) => x.join(s),
    _sbContains: (x: unknown[], i: unknown) => x.includes(i), _sbRemove: () => {}, _sbClear: (x: unknown[]) => x.splice(0),
    _sbCheckedArrayGet: (a: unknown[], i: number) => a[i], _createDict: () => new Map(),
  };
  const factory = new Function('_sb', '_createArray', ...Object.keys(helpers), 'console',
    `${result.code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcRender: _sb_rcrender, RcMover: _sb_rcmover };`);
  const M = factory(_sb, _createArray, ...Object.values(helpers), { log() {}, warn() {}, error() {} });
  deferred.forEach((cb) => cb());

  const world = new M.RcWorld(new M.TileMapSet('c.stm'), 'walls');
  const ren = new M.RcRender(world);
  const me = new M.RcMover(world, 1.5, 1.5, 0.3, 0.6);
  me.warpto(20.5, 20.5, 0); // angle 0 = facing +x, straight at the decal wall ~18.5 units away
  ren.bindcamera(me);
  ren.setwalltexture('rc_wall.png');
  ren.renderframe();
  return strips;
}

describe('RcRender — decal strips', () => {
  test('a square decal image draws a 1x1 co-planar strip, floor-anchored', () => {
    const strips = buildScene('decal:door.png', 64, 64);
    const decalStrips = strips.filter((s) => s[0] === 'door.png');
    expect(decalStrips.length).toBeGreaterThan(0);
    for (const s of decalStrips) {
      // srcVTop/srcVBot (indices 7, 8) span the whole image top-to-bottom.
      expect(s[7] as number).toBeCloseTo(0, 2);
      expect(s[8] as number).toBeCloseTo(1, 2);
    }
  });

  test('a taller-than-wide image scales the decal height by its aspect ratio', () => {
    const wideStrips = buildScene('decal:door.png', 64, 64);
    const tallStrips = buildScene('decal:door.png', 64, 128); // 2x taller
    const wideSpan = (wideStrips.find((s) => s[0] === 'door.png')?.[4] as number);
    const tallSpan = (tallStrips.find((s) => s[0] === 'door.png')?.[4] as number);
    // drawImageStrip's height arg (index 4) grows with decalH; a 2x taller
    // image should project to roughly twice the screen height at the same d.
    expect(tallSpan).toBeGreaterThan(wideSpan * 1.7);
  });

  test('no decal markers -> no decal strips drawn', () => {
    const strips = buildScene(null, 64, 64);
    const decalStrips = strips.filter((s) => s[0] === 'door.png');
    expect(decalStrips.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterWallDecals.test.ts`
Expected: FAIL — no decal strips are drawn yet (the first two tests find zero
matching strips).

- [ ] **Step 3: Add `drawDecalStrip` to `RcRender.bas`**

Add this new method right after `drawWallStrip` (after its closing
`endfunction`, before the `' --- Textures ---` comment / `setWallTexture`):

```basic
' Fixed-size, floor-anchored, alpha-composited image on a wall face -- a
' door, sign, light or picture from a `decal:<image>` tag. Co-planar with the
' wall (a "billboard that doesn't rotate with the camera"): reuses the same
' per-column distance `d` and face parameter `u` the wall strip for this
' column already used, so perspective is correct at any viewing angle. Width
' is always 1 world unit (the full cell face); height comes from the image's
' own pixel aspect ratio, so a 128x128 image is 1 unit tall, a 64x128 image
' is 2 units tall. Drawn immediately after the wall strip so the image's
' alpha composites over it. Returns 1 if a strip was drawn, else 0.
function drawDecalStrip(destX, wTop, wBot, winTop, winBot, image, u, d, lite)
    dim dw
    dim dh
    dim decalH
    dim screenTop
    dim screenBot
    dim dTop
    dim dBot
    dim vTop
    dim vBot
    dim srcX
    dim tint
    dw = assetmanager.imageWidth(image)
    dh = assetmanager.imageHeight(image)
    if dw <= 0 or dh <= 0 then
        return 0
    endif
    decalH = dh / dw
    screenTop = self.projectY(decalH, d)
    screenBot = self.projectY(0, d)
    dTop = screenTop
    if dTop < wTop then
        dTop = wTop
    endif
    if dTop < winTop then
        dTop = winTop
    endif
    dBot = screenBot
    if dBot > wBot then
        dBot = wBot
    endif
    if dBot > winBot then
        dBot = winBot
    endif
    if dBot <= dTop then
        return 0
    endif
    vTop = (dTop - screenTop) / (screenBot - screenTop)
    vBot = (dBot - screenTop) / (screenBot - screenTop)
    srcX = math.floor(u * dw)
    if srcX < 0 then
        srcX = 0
    endif
    if srcX >= dw then
        srcX = dw - 1
    endif
    tint = self.packTint(255 * lite, 255 * lite, 255 * lite)
    drawing.drawImageStrip(image, srcX, destX, (dTop + dBot) / 2, RcConfig.RC_STRIP_W, dBot - dTop, tint, vTop, vBot)
    self.primCount = self.primCount + 1
    return 1
endfunction
```

- [ ] **Step 4: Wire it into `renderFrame`**

In `renderFrame`, find the wall-draw line (around line 1459):

```basic
                wtex = self.wallTexFor(self.rc.spanCol(i), self.rc.spanRow(i))
                if string.len(wtex) > 0 then
                    self.surfCountLast = self.surfCountLast + self.drawWallStrip(destX, sTop, sBot, winTop, winBot, wtex, self.rc.spanU(i), lite, self.rc.spanSide(i), self.rc.spanLo(i), self.rc.spanHi(i))
                else
                    wshade = self.rc.spanSide(i)
                    if wshade = RcConfig.RC_SPAN_SIDE_DIAG then
                        wshade = 1
                    endif
                    self.drawStrip(destX, sTop, sBot, winTop, winBot, wshade, lite)
                endif
```

Add the decal check right after this `if/else/endif` block (still inside the
`kind = RcConfig.RC_SPAN_WALL` branch, at the same nesting level):

```basic
                if self.wld.hasDecals() = 1 and self.rc.spanSide(i) <> RcConfig.RC_SPAN_SIDE_DIAG then
                    dtex = self.wld.decalAt(self.rc.spanCol(i), self.rc.spanRow(i))
                    if string.len(dtex) > 0 then
                        self.surfCountLast = self.surfCountLast + self.drawDecalStrip(destX, sTop, sBot, winTop, winBot, dtex, self.rc.spanU(i), d, lite)
                    endif
                endif
```

`dtex` needs a `dim` at the top of `renderFrame` alongside the function's other
locals (find the existing block of `dim` statements at the top of
`renderFrame`, e.g. near `dim wtex`, `dim wshade`, and add `dim dtex` next to
them).

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycasterWallDecals.test.ts`
Expected: PASS (7 tests total across both describe blocks).

- [ ] **Step 6: Run the full raycaster and drawing suites**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/ tests/components/Runner/drawing.test.ts`
Expected: all pass, no regressions (existing wall-render tests unaffected
since `hasDecals()` short-circuits when no `decal:` marker exists anywhere).

- [ ] **Step 7: Run the full suite and build**

Run: `npx vitest run`
Expected: all green.

Run: `npx vite build`
Expected: succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/lib/Basic4WebGL/defs/RcRender.bas \
        tests/lib/Basic4WebGL/integration/raycasterWallDecals.test.ts
git commit -m "feat(raycaster): draw wall decals in RcRender

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Docs and roadmap

**Files:**
- Modify: `src/docs/guides/raycaster-library.md`
- Modify: `docs/raycaster/api-reference.md`
- Modify: `docs/language/library-roadmap.md`
- Modify: `docs/roadmap.md`

- [ ] **Step 1: Guide — add a decals subsection**

In `src/docs/guides/raycaster-library.md`, add a new subsection right after
`### Wall textures` (after its last paragraph, before `### Floor and ceiling
colour`):

```markdown
### Wall decals

A `decal:<image>` marker tag puts a fixed-size image flat against a wall face
— a door, a sign, a wall light, a picture — without stretching or tiling the
wall texture underneath it:

```json
{ "row": 2, "col": 5, "tag": "decal:rc_door.png" }
```

The decal always fills the cell's full width (1 world unit) and its height
comes from the image's own pixel aspect ratio: a square 64x64 image is 1 unit
tall, a 64x128 image is 2 units tall. It's anchored at the floor and drawn on
top of the wall texture, alpha-composited — transparent pixels show the wall
behind. It's the same per-column strip the wall itself uses (a "billboard that
doesn't rotate with the camera"), so perspective stays correct at any angle.

One `decal:` per cell; it shows on whichever face the ray hits, including all
four faces of a pillar. A `decal:` marker does nothing on its own — pair it
with a `door:` marker (read by your own game code) to make it interactive.
```

- [ ] **Step 2: API reference — settings table**

In `docs/raycaster/api-reference.md`, add a row to the `### Settings
(key:value)` table (after the `diag:` row):

```markdown
| `decal:<image>` | asset filename | fixed-size image on this wall face, floor-anchored, height from the image's pixel aspect ratio. Alpha-composited over the wall texture. Pair with `door:`/etc. (read in game code) for interactivity. |
```

- [ ] **Step 3: API reference — RcWorld table**

In the `## RcWorld — the parsed map` table, add a row after
`wallTexAt`/`floorTexAt`/`ceilTexAt`:

```markdown
| `decalAt(col, row)` | decal image name or `""` |
| `hasDecals()` | 1 if any cell carries a `decal:` tag (fast-path flag) |
```

- [ ] **Step 4: API reference — assetmanager**

`docs/raycaster/api-reference.md` doesn't cover `assetmanager` directly (it's
covered fully in `src/docs/api-reference/assetmanager.md`, updated in Task 1).
No change needed here beyond the two rows above.

- [ ] **Step 5: Roadmap — mark shipped, record deferred items**

In `docs/language/library-roadmap.md`, find the entry for `setWallTexScale`
(added when Part 1 shipped) and add a new shipped entry right after it:

```markdown
- **Wall decals** (shipped): `decal:<image>` marker puts a fixed-size,
  floor-anchored, alpha-composited image on a wall face — see
  `docs/superpowers/specs/2026-09-10-raycaster-wall-decals-design.md`.
  Deferred follow-ups, each its own future design: a `:z` bottom-edge offset
  (hang a picture at eye height instead of the floor), sub-cell width with
  horizontal centering, per-face decals on pillar cells, decals on `diag:`
  cells, a mutable `RcDecals` list for runtime add/remove/animate/retexture,
  and per-frame image-dimension caching in `RcRender` if profiling ever shows
  it's needed.
```

Check `docs/roadmap.md` for a corresponding raycaster tracking line (it may
reference the softRaycaster package generally rather than per-feature); if it
has an open item this closes, mark it done with a one-line note pointing at
the same spec. If there's no matching open item, no change is needed there.

- [ ] **Step 6: Verify docs build**

Run: `npx vite build`
Expected: succeeds (docs are markdown consumed at runtime, not part of the
TypeScript build, but this confirms nothing else broke).

- [ ] **Step 7: Commit**

```bash
git add src/docs/guides/raycaster-library.md \
        docs/raycaster/api-reference.md \
        docs/language/library-roadmap.md \
        docs/roadmap.md
git commit -m "docs(raycaster): document wall decals

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-review notes

- **Spec coverage:** authoring (`decal:` tag, Task 2) — texture mapping and
  geometry (Task 3) — engine dependency (Task 1) — testing (Tasks 1-3, mirrors
  the spec's 5-point RcRender test list plus the 2-point engine test) — docs
  (Task 4) — deferred items recorded, not silently dropped (Task 4 Step 5) —
  all covered.
- **Diagonal walls:** explicitly skipped in the `renderFrame` wiring
  (`self.rc.spanSide(i) <> RcConfig.RC_SPAN_SIDE_DIAG`), matching the spec's
  "treat as decal-less" call.
- **Non-wall `decal:` cells:** parsed and stored (Task 2) but never drawn,
  because `renderFrame`'s decal check only runs inside the
  `kind = RcConfig.RC_SPAN_WALL` branch — matches spec, no extra code needed.
- **Type/name consistency checked:** `decalArr`, `decalAt`, `hasDecals`,
  `decalSeen`, `drawDecalStrip` are spelled identically everywhere they're
  used across Tasks 2 and 3.
