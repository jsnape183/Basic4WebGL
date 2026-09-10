# Raycaster `setWallTexScale` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** `RcRender.setWallTexScale(unitsPerTile)` — repeat a wall texture every N world units up the wall (floor-anchored) instead of stretching one copy over the whole floor→ceiling span, so a `ceil:3` wall isn't 3× vertically distorted.

**Architecture:** `RcRender` gains `dim wallTexScale` (default `0` = today's stretch-to-wall, unchanged) + `setWallTexScale(v)`. `drawWallStrip` gains the wall's world-Z span (`wLoZ`/`wHiZ`, already computed at its one call site as `spanLo`/`spanHi`); when `wallTexScale > 0` it maps the source-V by world height / scale (a value that can exceed `[0,1]`) instead of the "0 at ceiling, 1 at floor" stretch. The engine's `_texFor` (in `drawing.js`) already builds a `PIXI.Rectangle` frame of `(vb-vt)*height`; it just needs to set the texture source's `addressMode = 'repeat'` when the V range implies tiling, so an oversized frame wraps instead of clamping. `projectY` is linear in world height at a fixed distance, so screen-Y ↔ world-Z within a wall column is a plain lerp — no perspective correction needed.

**Tech Stack:** softBASIC (`.bas`), the raycaster `softRaycaster` package, `src/components/Runner/engine/drawing.js` (PIXI v8), Vitest.

**Reference:** conversation design, approved 2026-09-10. `drawImageStrip`'s softBASIC signature does **not** change, so `drawing.descriptor.ts` / `drawing.bas` are untouched.

---

## softBASIC reminders

- Every `dim` at the top of its function. No `elseif`. No `for … step`. `<>` not `!=`.
- softBASIC has `math.ceil`, `math.floor`, `math.clamp` (all used elsewhere in `RcRender.bas`). Unary minus is written `0 - x`.
- Transpiled: `RcRender` → `_sb_rcrender`; `setWallTexScale` → `.setwalltexscale()`, `drawWallStrip` → `.drawwallstrip()`.
- `Rc*` `.bas` files are hand-written (not descriptor-generated).

## Verification commands

- `npx vitest run tests/components/Runner/drawing.test.ts --no-coverage`
- `npx vitest run tests/lib/Basic4WebGL/integration/raycaster --no-coverage` — full raycaster suite (~3–4 min, machine loaded). Baseline: **22 files / 242 tests passed**. A benign `[vitest-worker]: Timeout calling "onTaskUpdate"` line makes the process exit nonzero but every file still reports passed — judge by the counts.
- `npx vite build` — exit 0.

## File structure

| File | Change |
|---|---|
| `src/components/Runner/engine/drawing.js` | `_texFor`: set `addressMode = 'repeat'` on the source when the V range exceeds `[0,1]` (so an oversized frame tiles). |
| `src/lib/Basic4WebGL/defs/RcRender.bas` | `dim wallTexScale` + ctor default `0` + `setWallTexScale(v)`; `drawWallStrip` gains `wLoZ`/`wHiZ` params + a tiled-V branch; the one call site passes `self.rc.spanLo(i)` / `self.rc.spanHi(i)`. |
| `tests/components/Runner/drawing.test.ts` | unit: an out-of-`[0,1]` V range produces a frame taller than the source and marks the source `repeat`. |
| `tests/lib/Basic4WebGL/integration/raycasterWallTexScale.test.ts` | **new** — render a `ceil:3` textured wall; default `wallTexScale 0` → captured `drawImageStrip` V span ≈ 1; `setWallTexScale(1)` → V span ≈ 3, floor-anchored. |
| `src/docs/guides/raycaster-library.md` | note in the wall-textures section. |
| `docs/raycaster/api-reference.md` | `setWallTexScale` in the `RcRender` setter list. |
| `docs/language/library-roadmap.md` | shipped note. |

---

## Task 1: engine — `_texFor` tiles an out-of-range V

**Files:**
- Modify: `src/components/Runner/engine/drawing.js`
- Test: `tests/components/Runner/drawing.test.ts`

- [ ] **Step 1: Write the failing test**

In `tests/components/Runner/drawing.test.ts`, the `loadDrawing()` helper's fake `_sbAssets` currently returns a **fresh** object per `get()` call: `const _sbAssets = { get: () => ({ source: { style: {} }, width: 64, height: 64 }) };`. Change it to return a **stable shared** asset so a test can observe `source.style` mutations:

```ts
  const _sharedSource = { style: {} as { addressMode?: string } };
  const _sbAssets = { get: () => ({ source: _sharedSource, width: 64, height: 64 }) };
```

(Re-create it inside `loadDrawing()` each call so tests stay isolated — put the two lines where the old one-liner was.)

Then add to the `describe('drawing — drawImageStrip tint + vertical source clip', …)` block:

```ts
  test('a V range beyond [0,1] tiles: oversized frame + source set to repeat', () => {
    const { d } = loadDrawing();
    d.drawImageStrip('w.png', 3, 0, 0, 4, 120, 0xffffff, 0, 3); // 3 tiles tall
    const rect = lastTexOpts.frame;
    expect(rect.y).toBe(0);
    expect(rect.h).toBe(192); // 3 * 64
  });

  test('an in-range V clip leaves the source addressMode untouched', () => {
    const { d } = loadDrawing();
    d.drawImageStrip('w.png', 3, 0, 0, 4, 40, 0xffffff, 0.25, 0.75);
    // (no assertion on addressMode here — just that the normal path is unaffected;
    //  the rect assertions from the existing 'clips source V' test still hold)
    expect(lastTexOpts.frame.h).toBe(32);
  });
```

For the `repeat` assertion, add a helper read of the shared source. The simplest: expose it. Change `loadDrawing()` to also return `_sharedSource`:

```ts
  return { d: factory(PIXI, worldContainer, _sbAssets), worldContainer, sharedSource: _sharedSource };
```

and in the tiling test:

```ts
    const { d, sharedSource } = loadDrawing();
    d.drawImageStrip('w.png', 3, 0, 0, 4, 120, 0xffffff, 0, 3);
    expect(sharedSource.style.addressMode).toBe('repeat');
```

- [ ] **Step 2: Run it — fails**

Run: `npx vitest run tests/components/Runner/drawing.test.ts --no-coverage`
Expected: the tiling test fails — `sharedSource.style.addressMode` is `undefined` (current `_texFor` never sets it); `rect.h` may already be 192 (the frame maths already multiplies) — that assertion is a guard, the `addressMode` one is the real failure.

- [ ] **Step 3: Implement**

In `src/components/Runner/engine/drawing.js`, `_texFor(imageName, srcX, srcVTop, srcVBot)` — after `const base = _sbAssets.get(imageName);` and before `t = new PIXI.Texture({…})`, add:

```js
      // A V window outside [0,1] (or wider than one tile) means the caller wants
      // the image to repeat down the frame (tall walls). Match _meshTexFor: flip
      // the shared source to 'repeat' so the oversized frame wraps, not clamps.
      if ((vt < 0 || vb > 1 || vb - vt > 1.0001) && base.source && base.source.style) {
        base.source.style.addressMode = 'repeat';
      }
```

(Use the already-declared `vt` / `vb` locals — they are the `srcVTop === undefined ? 0 : srcVTop` / `srcVBot` values computed just above. The `qt`/`qb` quantised values feed the cache key and the frame; `vt`/`vb` are fine for the range check.)

The frame line already reads `new PIXI.Rectangle(srcX, qt * base.height, 1, Math.max(1, (qb - qt) * base.height))` — for `qt=0, qb=3` that is `Rectangle(srcX, 0, 1, 192)`, exactly what we want. No change there. Guard against a negative frame origin is handled caller-side (Task 2 keeps `svTop ≥ 0`).

- [ ] **Step 4: Run — passes**

Run: `npx vitest run tests/components/Runner/drawing.test.ts --no-coverage`
Expected: all pass (the file's other ~40 tests unaffected — the `_sbAssets` shared-source change is behaviourally identical for them).

- [ ] **Step 5: Build**

Run: `npx vite build` — exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/Runner/engine/drawing.js tests/components/Runner/drawing.test.ts
git commit -m "feat(engine): _texFor tiles a V window outside [0,1] (repeat wrap)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `RcRender.setWallTexScale` + tiled `drawWallStrip`

**Files:**
- Modify: `src/lib/Basic4WebGL/defs/RcRender.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterWallTexScale.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `tests/lib/Basic4WebGL/integration/raycasterWallTexScale.test.ts`. Model the harness on `tests/lib/Basic4WebGL/integration/raycasterFloorFieldRiser.test.ts` (the `_sb` Proxy + `new Function` factory that transpiles the whole `softRaycaster` package). Capture `drawImageStrip` calls: signature is `(imageName, srcX, destX, destY, destWidth, destHeight, tint, srcVTop, srcVBot)` — so `args[7]` / `args[8]` are the V window.

Scene: a 6×5 room, all border walls, `ceil:3` on every interior cell (or on the wall cells the test ray hits — simplest: put `ceil:3` markers on the whole interior), a wall texture set via `setWallTexture`, camera at `(2.5, 2.5)` facing a wall a couple of cells away.

```ts
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

const COLS = 6, ROWS = 5;
const walls: number[][] = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1 ? 1 : 0)),
);
// ceil:3 on every cell (interior + walls) so the wall the ray hits is 3 tall.
const markers: Array<{ row: number; col: number; tag: string }> = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) markers.push({ row: r, col: c, tag: 'ceil:3' });

function build(scale: number | null) {
  const { files: ordered, error } = sortByDependencies([]);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files: ordered });
  expect(result.diagnostics).toEqual([]);

  const tw = 16;
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
  _sb.tileMapWidthPx = () => COLS * tw; _sb.tileMapHeightPx = () => ROWS * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) => walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => markers.map((m) => ({ ...m }));
  _sb.getStageWidth = () => 320; _sb.getStageHeight = () => 200;
  _sb.drawImageStrip = (...a: unknown[]) => { strips.push(a); };
  _sb.drawRect = () => {};
  _sb.registerLightmap = () => {}; _sb.registerFieldTiles = () => {}; _sb.drawPlaneField = () => {};

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
  me.warpto(2.5, 2.5, 0); // face east toward the col-5 wall
  ren.bindcamera(me);
  ren.setwalltexture('rc_wall.png');
  if (scale !== null) ren.setwalltexscale(scale);
  ren.renderframe();
  return strips;
}

describe('RcRender.setWallTexScale', () => {
  test('default (0): one texture copy stretched over the wall — V span ~= 1', () => {
    const strips = build(null);
    expect(strips.length).toBeGreaterThan(0);
    for (const s of strips) {
      const span = (s[8] as number) - (s[7] as number);
      expect(span).toBeGreaterThan(0.95);
      expect(span).toBeLessThan(1.05);
    }
  });

  test('scale 1 on a ceil:3 wall: texture repeats ~3x — V span ~= 3, floor-anchored', () => {
    const strips = build(1);
    expect(strips.length).toBeGreaterThan(0);
    for (const s of strips) {
      const span = (s[8] as number) - (s[7] as number);
      expect(span).toBeGreaterThan(2.8);
      expect(span).toBeLessThan(3.2);
      // floor-anchored: the bottom edge (srcVBot) sits on an integer tile seam
      const vb = s[8] as number;
      expect(Math.abs(vb - Math.round(vb))).toBeLessThan(0.02);
    }
  });

  test('scale 2 on a ceil:3 wall: V span ~= 1.5', () => {
    const strips = build(2);
    for (const s of strips) {
      const span = (s[8] as number) - (s[7] as number);
      expect(span).toBeGreaterThan(1.4);
      expect(span).toBeLessThan(1.6);
    }
  });
});
```

> Implementer: verify method names (`setWallTexture` / `renderFrame` / `warpTo` exist; `setWallTexScale` is new). If the camera pose doesn't hit an unclipped `ceil:3` wall (so the V span isn't clean), nudge the map / pose so at least one full wall column is captured — the span *ratio* between scale 0 / 1 / 2 is the assertion. If the wall strips come back clipped by the viewport (span not clean), widen the stage (`getStageHeight` → e.g. 600) or move the camera further from the wall.

- [ ] **Step 2: Run — fails** (`ren.setwalltexscale is not a function`).

- [ ] **Step 3: Add the field + setter**

In `src/lib/Basic4WebGL/defs/RcRender.bas`:

Add to the class-body `dim` list (near `dim defWallTex`):

```basic
' Wall-texture vertical repeat, in world units per tile. 0 (default) = the
' legacy behaviour: one texture copy stretched over the whole floor->ceiling
' span (fine at ceil:1, distorts at ceil:3). >0 = repeat every N units,
' anchored at the floor. Applies to setWallTexture and per-cell tex: alike.
dim wallTexScale
```

In the constructor, next to `self.defWallTex = ""`:

```basic
    self.wallTexScale = 0
```

Add the setter next to `setWallTexture`:

```basic
function setWallTexScale(v)
    self.wallTexScale = v
endfunction
```

- [ ] **Step 4: Tiled-V branch in `drawWallStrip`**

Change the signature (one caller, updated in Step 5):

```basic
function drawWallStrip(destX, wTop, wBot, winTop, winBot, tex, u, lite, sideKind, wLoZ, wHiZ)
```

Add to its `dim` list:

```basic
    dim hTopVis
    dim hBotVis
    dim vk
```

The function currently computes `cTop`/`cBot` (window-clipped screen span) then:

```basic
    svTop = (cTop - wTop) / (wBot - wTop)
    svBot = (cBot - wTop) / (wBot - wTop)
```

Replace those two lines with:

```basic
    if self.wallTexScale > 0 and wHiZ > wLoZ then
        ' projectY is linear in world height at fixed distance, so screen Y
        ' maps linearly onto world Z between (wTop <-> wHiZ) and (wBot <-> wLoZ).
        hTopVis = wHiZ + (wLoZ - wHiZ) * (cTop - wTop) / (wBot - wTop)
        hBotVis = wHiZ + (wLoZ - wHiZ) * (cBot - wTop) / (wBot - wTop)
        ' V increases downward; one tile per wallTexScale units; the texture's
        ' bottom row sits on the floor (V at an integer there). vk lifts the
        ' whole window to a non-negative frame origin.
        vk = math.ceil((wHiZ - wLoZ) / self.wallTexScale)
        svTop = vk - (hTopVis - wLoZ) / self.wallTexScale
        svBot = vk - (hBotVis - wLoZ) / self.wallTexScale
    else
        svTop = (cTop - wTop) / (wBot - wTop)
        svBot = (cBot - wTop) / (wBot - wTop)
    endif
```

Everything else in `drawWallStrip` (the `srcX` clamp, `tint`, the `drawing.drawImageStrip(tex, srcX, destX, (cTop + cBot) / 2, RcConfig.RC_STRIP_W, cBot - cTop, tint, svTop, svBot)` call) is unchanged — it already passes `svTop`/`svBot` straight through.

> Sanity: unclipped `ceil:3` wall, `wallTexScale=1` → `cTop=wTop`, `cBot=wBot`, so `hTopVis=wHiZ` (=3), `hBotVis=wLoZ` (=0). `vk = ceil(3/1) = 3`. `svTop = 3 - (3-0)/1 = 0`; `svBot = 3 - (0-0)/1 = 3`. Frame V `[0,3]` → 3 tiles, floor at `svBot=3` (integer seam). ✓ At `scale=2`: `vk = ceil(1.5) = 2`; `svTop = 2 - 1.5 = 0.5`; `svBot = 2`. Span 1.5, floor at integer `2`. ✓

- [ ] **Step 5: Pass the world-Z span at the call site**

The sole caller (in `renderFrame`, the `RC_SPAN_WALL` branch):

```basic
                    self.surfCountLast = self.surfCountLast + self.drawWallStrip(destX, sTop, sBot, winTop, winBot, wtex, self.rc.spanU(i), lite, self.rc.spanSide(i))
```
→
```basic
                    self.surfCountLast = self.surfCountLast + self.drawWallStrip(destX, sTop, sBot, winTop, winBot, wtex, self.rc.spanU(i), lite, self.rc.spanSide(i), self.rc.spanLo(i), self.rc.spanHi(i))
```

(`sTop = self.projectY(self.rc.spanHi(i), d)` and `sBot = self.projectY(self.rc.spanLo(i), d)` are computed a few lines up — `spanHi` is the ceiling height, `spanLo` the floor height, so `wLoZ = spanLo(i)`, `wHiZ = spanHi(i)`.)

- [ ] **Step 6: Run test — passes.** Tune the camera pose / stage size per the note if the V spans aren't clean.

- [ ] **Step 7: Regression**

Run: `npx vitest run tests/lib/Basic4WebGL/integration/raycaster --no-coverage`
Expected: **22 files pass**, now **245 tests** (242 + 3 new). Every existing textured-wall test (`raycasterSurfaceColor`, `raycasterWindowOcclusion`, `raycasterDemoSmoke`, phase-demo transpile/probes, `raycasterFloorFieldRiser`) uses `wallTexScale = 0` (default) so `drawWallStrip` takes the `else` branch — byte-identical. If any regress, the `else` branch or the new params broke the legacy path.

- [ ] **Step 8: Commit**

```bash
git add src/lib/Basic4WebGL/defs/RcRender.bas tests/lib/Basic4WebGL/integration/raycasterWallTexScale.test.ts
git commit -m "feat(raycaster): RcRender.setWallTexScale — repeat wall textures per N world units

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: docs + roadmap + full regression

**Files:**
- Modify: `src/docs/guides/raycaster-library.md`
- Modify: `docs/raycaster/api-reference.md`
- Modify: `docs/language/library-roadmap.md`

- [ ] **Step 1: Guide**

In `src/docs/guides/raycaster-library.md`, find the wall-texture material in the `## RcRender` section (search for `setWallTexture`). Add, in the guide's voice:

```markdown
By default one copy of the wall texture is stretched over the whole wall,
floor to ceiling. That looks right at the standard ceiling height but stretches
vertically on a `ceil:2` / `ceil:3` wall. `ren.setWallTexScale(1)` repeats the
texture once per world unit up the wall instead (anchored at the floor);
`setWallTexScale(2)` once per two units. `0` (the default) keeps the
stretch-to-wall behaviour. It applies to `setWallTexture` and per-cell `tex:`
overrides alike; horizontal tiling is always one copy per cell.
```

- [ ] **Step 2: Internal ref**

In `docs/raycaster/api-reference.md`, in the `## RcRender` section's method table / setter list, add a row:

```markdown
| `setWallTexScale(u)` | wall-texture vertical repeat: world units per tile, floor-anchored. `0` (default) = one copy stretched floor→ceiling. |
```

- [ ] **Step 3: Roadmap**

In `docs/language/library-roadmap.md`, in the raycaster section (near the `RcSettings` "Per-scene tuning" note), add:

```markdown
**Wall texture vertical scale [DONE 2026-09-10].** `RcRender.setWallTexScale(unitsPerTile)`
— `0` (default) keeps one texture copy stretched floor→ceiling; `>0` repeats the
wall texture every N world units, floor-anchored, so `ceil:2`/`ceil:3` walls
don't stretch. Engine: `drawing.js` `_texFor` now flips the source to
`addressMode:'repeat'` for a V window outside `[0,1]`. Doorway textures (a
fixed-height image that neither stretches nor tiles) are a separate follow-up.
```

- [ ] **Step 4: Build**

Run: `npx vite build` — exit 0.

- [ ] **Step 5: Full suite**

Run: `npx vitest run`
Expected: `0 failed`. Baseline this session: 215 files / 2150 passed / 8 skipped; +1 file (`raycasterWallTexScale.test.ts`), +~5 tests (3 integration + 2 drawing).

- [ ] **Step 6: Commit**

```bash
git add src/docs/guides/raycaster-library.md docs/raycaster/api-reference.md docs/language/library-roadmap.md
git commit -m "docs(raycaster): setWallTexScale guide + roadmap note

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-review notes

- **`drawImageStrip` signature unchanged** — the V params already exist; only their *range* is newly allowed to exceed `[0,1]`. No `drawing.descriptor.ts` / `drawing.bas` regen, no `generatedDefsInSync` impact.
- **Default `0` = zero behavioural change.** Every existing scene and every raycaster test runs the `else` branch of `drawWallStrip`. The regression suite is the proof.
- **`addressMode` is on the shared source** (like `_meshTexFor` already does for floor textures) — once an image is used as a tiled wall texture its source is `repeat` for the rest of the session. Acceptable and precedented; a normal sprite of the same image samples within `[0,1]` so wrap never triggers.
- **Not covered here:** per-cell texture height / doorway textures (the follow-up the user is brainstorming separately); horizontal wall-texture scale (always 1 per cell); floor/ceiling field already tiles per unit via `_meshTexFor`.
