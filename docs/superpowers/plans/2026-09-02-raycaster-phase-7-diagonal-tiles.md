# Raycaster Phase 7 — Fixed Diagonal-Wall Tiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add corner-solid 45° diagonal-wall tiles to the softBASIC raycaster library (`RcWorld` + `RcCast` + `RcMover`, with a one-line `RcRender` shade tweak) and ship a Cypress-verified `raycaster-p7-diagonals` dev demo (octagonal room + a canted dead-end passage).

**Architecture:** A diagonal cell is authored as a marker tag `diag:nw|ne|se|sw` on an otherwise-open (`walls`-layer `0`) cell — same mechanism as `floor:` / `light:`, no `.stm` format change. `RcWorld` parses it into a per-cell `diagArr` and exposes `diagAt(col,row)`. `RcCast` runs a ray-vs-45°-chord segment test when the DDA march lands in a diagonal cell (shared helper used by both `cast()` and `los()`), emitting a wall span with a new `side` value `RC_SPAN_SIDE_DIAG`. `RcMover` adds one corrective push-out pass per frame so a body slides along the 45° face. `RcRender` maps the new side value to the y-face wall shade and adds a diagonal lighting branch; otherwise it draws whatever spans `RcCast` emits.

**Tech Stack:** softBASIC (`.bas`, transpiles to JS/PIXI), Vitest integration tests (`tests/lib/Basic4WebGL/integration/raycasterDemo*.test.ts`), Cypress e2e (`cypress/e2e/demos.cy.ts`), `scripts/buildDemo.ts` demo packager.

**Spec:** `docs/superpowers/specs/2026-09-02-raycaster-phase-7-diagonal-tiles-design.md`

---

## Geometry reference (used throughout)

Cell-local coords: `u = worldX - col ∈ [0,1]` (east), `v = worldY - row ∈ [0,1]` (south). The solid triangle fills the named corner; the 45° chord connects the two adjacent corners.

| Tag | Code | Solid corner | Chord (world) | Chord fn `f` | Solid side |
|---|---|---|---|---|---|
| `diag:nw` | 1 | NW `(0,0)` | `x+y = col+row+1` | `f = (x-col)+(y-row)-1` | `f ≤ 0` |
| `diag:ne` | 2 | NE `(1,0)` | `x-y = col-row`     | `f = (x-col)-(y-row)`   | `f ≥ 0` |
| `diag:se` | 3 | SE `(1,1)` | `x+y = col+row+1` | `f = (x-col)+(y-row)-1` | `f ≥ 0` |
| `diag:sw` | 4 | SW `(0,1)` | `x-y = col-row`     | `f = (x-col)-(y-row)`   | `f ≤ 0` |

`nw`/`se` share the anti-diagonal chord; `ne`/`sw` share the main-diagonal chord. `RcCast`'s DDA state uses the ray parameter `s` (multiplier on the raw, un-normalised `(dx,dy)`) as the perpendicular distance — `mEntryDist`, `mSideX`, `mSideY` are all in those units, so the chord solve produces `s` directly with no normalisation.

Chord solve for the ray `(ox+s·dx, oy+s·dy)`:
- anti-diagonal (`nw`/`se`): `s = (col + row + 1 - ox - oy) / (dx + dy)`
- main-diagonal (`ne`/`sw`): `s = (col - row - ox + oy) / (dx - dy)`

---

## File Structure

**Library (canonical `demo-src/raycaster/lib/`, then byte-copied into phase dirs):**
- `RcConfig.bas` — +5 constants. Copied in `raycaster-p2..p7`.
- `RcWorld.bas` — `diagArr` field, `diag:` parse, `diagAt()`. Copied in `raycaster-p1..p7`. Encodes 1–4 as bare literals (matches the file's existing hardcoded flag bits; `RcConfig` is *not* bundled in `raycaster-p1`).
- `RcCast.bas` — `diagHit()` helper + `cast()`/`los()` wiring. Copied in `raycaster-p2..p7`.
- `RcRender.bas` — wall-strip shade map + diagonal lighting branch. Copied in `raycaster-p3..p7`.
- `RcMover.bas` — diagonal push-out in `step()`. Copied in `raycaster-p3..p7`.
- `RcActor.bas`, `RcActors.bas`, `RcLights.bas` — unchanged, but copied into `raycaster-p7` for a clean standalone transpile (RcRender.bas has `dim a as RcActor`).

**Demo (`demo-src/raycaster-p7/`, new):**
- `assets/p7room.stm` — 10×14 grid, octagonal room + canted dead-end passage.
- `assets/rc_placeholder_tiles.png` — copied from `raycaster-p6/assets/` (`.stm` requires a `tileImage`).
- `DiagScene.bas` — scene with 6 runtime probes.
- `Main.bas` — bootstrap.
- 8 lib copies (see above).

**Build output:**
- `src/docs/demos/RaycasterP7Diagonals.b4wgl.json` — from `npm run build:demo`.

**Wiring:**
- `src/features/demos/devDemoRegistry.ts` — `raycaster-p7-diagonals` entry.
- `tests/ui/features/demos/devDemoRegistry.test.ts` — presence test.
- `cypress/e2e/demos.cy.ts` — `DEV_DEMOS` entry.

**Tests:**
- `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts` — `diagat` on the existing stubs + new `stubWorldDiag`/`makeDiagStub` blocks for RcCast, RcRender, RcMover.
- `tests/lib/Basic4WebGL/integration/raycasterDiagWorld.test.ts` — NEW, focused RcWorld `diagAt` parse test.
- `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts` — P7 case (`probeCount: 6`).
- `raycasterDemoTranspile` / `raycasterDemoLibSync` — auto-pick up new files, no edit.

**Docs (Task 8):**
- `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md` — §11 phasing, §3.1/§3.3/§4.2 "As built".
- `docs/roadmap.md` — item 28 "Phase 7 shipped:" clause.
- Header comments in `RcCast.bas` / `RcWorld.bas` / `RcMover.bas` / `RcRender.bas`.

---

## Task 1: RcConfig — diagonal constants

**Files:**
- Modify: `demo-src/raycaster/lib/RcConfig.bas` (before `endconst`, after line 36)
- Then copy: `demo-src/raycaster-p2/RcConfig.bas` … `demo-src/raycaster-p6/RcConfig.bas`

- [ ] **Step 1: Add the constants**

In `demo-src/raycaster/lib/RcConfig.bas`, insert these 5 lines immediately before `endconst`:

```basic
    RC_DIAG_NW = 1
    RC_DIAG_NE = 2
    RC_DIAG_SE = 3
    RC_DIAG_SW = 4
    RC_SPAN_SIDE_DIAG = 2
```

- [ ] **Step 2: Sync the copies**

```bash
for d in raycaster-p2 raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6; do
  cp demo-src/raycaster/lib/RcConfig.bas demo-src/$d/RcConfig.bas
done
```

- [ ] **Step 3: Verify transpile + lib-sync**

Run: `npx vitest run raycasterDemoTranspile raycasterDemoLibSync`
Expected: PASS (all phase dirs compile; every `RcConfig.bas` copy byte-matches canonical).

- [ ] **Step 4: Commit**

```bash
git add demo-src/raycaster/lib/RcConfig.bas demo-src/raycaster-p*/RcConfig.bas
git commit -m "feat: RcConfig diagonal-tile constants (phase 7)"
```

---

## Task 2: RcCast — diagonal chord test

**Files:**
- Modify: `demo-src/raycaster/lib/RcCast.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`
- Then copy: `demo-src/raycaster-p2/RcCast.bas` … `demo-src/raycaster-p6/RcCast.bas`

- [ ] **Step 1: Write the failing test — add `diagat` to the existing stubs and a new RcCast diagonal block**

In `raycasterDemoSmoke.test.ts`:

(a) Add `diagat: () => 0,` to **both** `stubWorld` and `stubWorld2` (they now feed a `cast()` that calls `wld.diagAt` every step).

(b) After the `const stubWorld2 = {...}` block, add:

```ts
// A single SE-solid diagonal at cell (3,3) in an 8x8 bordered room.
const stubWorldDiag = {
  floorheightat: () => 0,
  ceilheightat: () => 1,
  wallat: (c: number, r: number) => (c <= 0 || c >= 7 || r <= 0 || r >= 7 ? 1 : 0),
  diagat: (c: number, r: number) => (c === 3 && r === 3 ? 3 : 0), // 3 = RC_DIAG_SE
  walltexat: () => '',
  floortexat: () => '',
  ceiltexat: () => '',
  widthcells: () => 8,
  heightcells: () => 8,
  lightat: () => 0,
};
```

(c) Inside `describe('raycaster phase demos smoke-execute', ...)`, add:

```ts
test.each(phaseDirs)('%s: RcCast resolves a diagonal tile as a wall span', (dirName) => {
  const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`));
  if (!mod.RcCast) return; // phase 1 has no RcCast
  const rc = new mod.RcCast() as RcCastLike & {
    spanside(i: number): number;
    spandist(i: number): number;
  };

  // Ray SE from (1.5,1.5) straight at the SE-solid chord of cell (3,3):
  // crosses the chord at world (3.5,3.5), ray param s = 2.0.
  rc.cast(stubWorldDiag, 1.5, 1.5, 1, 1);
  const n = rc.spancount();
  expect(n).toBeGreaterThan(0);
  expect(rc.spanside(n - 1)).toBe(2); // RC_SPAN_SIDE_DIAG
  expect(rc.spandist(n - 1)).toBeCloseTo(2.0, 1);

  // los agrees with cast on the diagonal (spec: light/bullets match the eye).
  expect(rc.los(stubWorldDiag, 1.5, 1.5, 1, 1)).toBeCloseTo(2.0, 1);

  // Control: a ray that never meets the diagonal cell hits a normal border
  // wall — side is NOT the diagonal value.
  rc.cast(stubWorldDiag, 1.5, 5.5, 1, 0);
  const m = rc.spancount();
  expect(rc.spanside(m - 1)).not.toBe(2);
  expect(rc.los(stubWorldDiag, 1.5, 5.5, 1, 0)).toBeCloseTo(5.5, 1);
});
```

Also extend the `RcCastLike` interface with `spanside(i: number): number;` and `spandist(i: number): number;`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run raycasterDemoSmoke -t "resolves a diagonal tile"`
Expected: FAIL — `cast` ignores `diagAt`, so the last span is the border wall (`spanside` 0/1) or the ray never terminates on the diagonal; `spandist` ≠ 2.0.

- [ ] **Step 3: Implement `diagHit()` + wire `cast()` and `los()`**

In `demo-src/raycaster/lib/RcCast.bas`:

(a) Update the header comment — replace the `Phase 2 scope:` line's `no diagonal tiles (Phase 7).` with `diagonal tiles: Phase 7 (diagHit).`

(b) Add this function anywhere in the class body (e.g. right before `function spanCount()`):

```basic
' Ray-parameter distance of a diagonal-chord hit in cell (cx,cy), or -1 for a
' miss (ray stays in the cell's open triangle). dg = RcConfig.RC_DIAG_* ;
' entryDist/exitDist = ray params where the ray enters/leaves the cell.
function diagHit(dg, ox, oy, dx, dy, cx, cy, entryDist, exitDist)
    dim eps
    dim ex0
    dim ey0
    dim f0
    dim denom
    dim solidPos
    dim s

    eps = 0.00001
    ex0 = ox + entryDist * dx
    ey0 = oy + entryDist * dy
    f0 = 0
    denom = 0
    solidPos = 0
    s = 0

    if dg = RcConfig.RC_DIAG_NW or dg = RcConfig.RC_DIAG_SE then
        f0 = (ex0 - cx) + (ey0 - cy) - 1.0
        denom = dx + dy
    else
        f0 = (ex0 - cx) - (ey0 - cy)
        denom = dx - dy
    endif

    if dg = RcConfig.RC_DIAG_SE or dg = RcConfig.RC_DIAG_NE then
        solidPos = 1
    endif

    ' entered already on / inside the solid side -> hit at the cell boundary
    if solidPos = 1 then
        if f0 >= 0 - eps then
            return entryDist
        endif
    else
        if f0 <= eps then
            return entryDist
        endif
    endif

    ' does the ray cross the chord inside this cell?
    if math.abs(denom) < eps then
        return 0 - 1
    endif
    if dg = RcConfig.RC_DIAG_NW or dg = RcConfig.RC_DIAG_SE then
        s = (cx + cy + 1.0 - ox - oy) / denom
    else
        s = (cx - cy - ox + oy) / denom
    endif
    if s < entryDist - eps then
        return 0 - 1
    endif
    if s > exitDist + eps then
        return 0 - 1
    endif
    return s
endfunction
```

(c) In `cast()`, add to the `dim` block at the top (after `dim hi`):

```basic
    dim dg
    dim exitD
    dim dh
```

Then immediately after the existing `if wallHere > 0 then … return … endif` block (currently ends line 162, right before `cellFloor = wld.floorHeightAt(...)`), insert:

```basic
        dg = wld.diagAt(self.mMapX, self.mMapY)
        if dg > 0 then
            exitD = self.mSideX
            if self.mSideY < exitD then
                exitD = self.mSideY
            endif
            dh = self.diagHit(dg, ox, oy, dx, dy, self.mMapX, self.mMapY, self.mEntryDist, exitD)
            if dh >= 0 then
                self.addSpan(RcConfig.RC_SPAN_WALL, dh, runFloor, runCeil, self.mMapX, self.mMapY, RcConfig.RC_SPAN_SIDE_DIAG, 0, wld.wallTexAt(self.mMapX, self.mMapY))
                return
            endif
        endif
```

(d) In `los()`, add to its `dim` block (after `dim iters`):

```basic
    dim dg
    dim exitD
    dim dh
```

Then after the existing `if wld.wallAt(self.mMapX, self.mMapY) > 0 then return self.mEntryDist endif`, insert:

```basic
        dg = wld.diagAt(self.mMapX, self.mMapY)
        if dg > 0 then
            exitD = self.mSideX
            if self.mSideY < exitD then
                exitD = self.mSideY
            endif
            dh = self.diagHit(dg, ox, oy, dx, dy, self.mMapX, self.mMapY, self.mEntryDist, exitD)
            if dh >= 0 then
                return dh
            endif
        endif
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run raycasterDemoSmoke -t "resolves a diagonal tile"`
Expected: PASS.

- [ ] **Step 5: Sync the copies and run the full smoke suite**

```bash
for d in raycaster-p2 raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6; do
  cp demo-src/raycaster/lib/RcCast.bas demo-src/$d/RcCast.bas
done
```

Run: `npx vitest run raycasterDemoSmoke raycasterDemoTranspile raycasterDemoLibSync`
Expected: PASS for every phase dir (the new `test.each` runs against all copies; the existing RcCast cast/los tests still pass because `stubWorld` now has `diagat`).

- [ ] **Step 6: Commit**

```bash
git add demo-src/raycaster/lib/RcCast.bas demo-src/raycaster-p*/RcCast.bas tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts
git commit -m "feat: RcCast diagonal-tile chord test in cast/los (phase 7)"
```

---

## Task 3: RcWorld — diag storage, parse, accessor

**Files:**
- Modify: `demo-src/raycaster/lib/RcWorld.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterDiagWorld.test.ts` (create)
- Then copy: `demo-src/raycaster-p1/RcWorld.bas` … `demo-src/raycaster-p6/RcWorld.bas`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/Basic4WebGL/integration/raycasterDiagWorld.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Focused guard for RcWorld's `diag:` marker parsing + diagAt() accessor.
// RcWorld is built from a tilemapset, not a duck world, so it can't ride the
// raycasterDemoSmoke duck-world harness — this test stubs `_sb` with an inline
// grid + markers (same shape as raycasterDemoProbes' makeSbStub) and drives
// diagAt directly.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

const CANON = 'demo-src/raycaster/lib';
const files = ['RcConfig.bas', 'RcWorld.bas'].map((name) => ({
  name,
  source: readFileSync(`${CANON}/${name}`, 'utf-8'),
}));

function buildWorld(walls: number[][], markers: Array<{ row: number; col: number; tag: string }>) {
  const { files: ordered, error } = sortByDependencies(files);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files: ordered });
  expect(result.diagnostics).toEqual([]);

  const tw = 16;
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
  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.tileWidth = () => tw;
  _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => walls[0].length * tw;
  _sb.tileMapHeightPx = () => walls.length * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) =>
    walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => markers.map((m) => ({ ...m }));

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
    `${result.code}\n; return _sb_rcworld;`,
  );
  const RcWorld = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  return new RcWorld('TMS', 'walls') as { diagat(c: number, r: number): number };
}

describe('RcWorld diag: markers', () => {
  const walls = [
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
  ];

  test('each diag:<corner> tag maps to its RC_DIAG_* code', () => {
    const w = buildWorld(walls, [
      { row: 1, col: 1, tag: 'diag:nw' },
      { row: 1, col: 2, tag: 'diag:ne' },
      { row: 2, col: 1, tag: 'diag:sw' },
      { row: 2, col: 2, tag: 'diag:se' },
    ]);
    expect(w.diagat(1, 1)).toBe(1);
    expect(w.diagat(2, 1)).toBe(2);
    expect(w.diagat(1, 2)).toBe(4);
    expect(w.diagat(2, 2)).toBe(3);
  });

  test('cells with no diag tag report 0, and out-of-bounds is 0', () => {
    const w = buildWorld(walls, [{ row: 1, col: 1, tag: 'diag:se' }]);
    expect(w.diagat(2, 2)).toBe(0);
    expect(w.diagat(9, 9)).toBe(0);
  });

  test('diag: combines with other tokens on one marker', () => {
    const w = buildWorld(walls, [{ row: 1, col: 1, tag: 'diag:ne light' }]);
    expect(w.diagat(1, 1)).toBe(2);
    expect(w.lightat(1, 1)).toBe(1);
  });
});
```

Add `lightat(c: number, r: number): number;` to the return type cast if TS complains (`as { diagat(...): number; lightat(...): number }`).

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run raycasterDiagWorld`
Expected: FAIL — `w.diagat is not a function`.

- [ ] **Step 3: Implement**

In `demo-src/raycaster/lib/RcWorld.bas`:

(a) Header comment — under the `flags bitset:` line, add:
```basic
' diagArr: 0 = not diagonal, else a corner code 1=nw 2=ne 3=se 4=sw (a
' corner-solid 45-degree tile; mirrors RcConfig.RC_DIAG_* — kept as bare
' literals here because raycaster-p1 does not bundle RcConfig).
```

(b) After `dim flagsArr(0)` (line 29), add:
```basic
dim diagArr(0)
```

(c) In `build()`'s per-cell init loop, after `array.push(self.flagsArr, 0)` (line 63), add:
```basic
        array.push(self.diagArr, 0)
```

(d) In `applyKv()`, before the final `if key = "upper"` block, add:
```basic
    if key = "diag" then
        if v = "nw" then
            self.diagArr(idx) = 1
        endif
        if v = "ne" then
            self.diagArr(idx) = 2
        endif
        if v = "se" then
            self.diagArr(idx) = 3
        endif
        if v = "sw" then
            self.diagArr(idx) = 4
        endif
    endif
```

(e) After `function flagsAt(col, row)` … `endfunction` (line 253), add:
```basic
function diagAt(col, row)
    if self.inBounds(col, row) = 0 then
        return 0
    endif
    return self.diagArr(row * self.cols + col)
endfunction
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run raycasterDiagWorld`
Expected: PASS.

- [ ] **Step 5: Sync copies + verify**

```bash
for d in raycaster-p1 raycaster-p2 raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6; do
  cp demo-src/raycaster/lib/RcWorld.bas demo-src/$d/RcWorld.bas
done
```

Run: `npx vitest run raycasterDemoTranspile raycasterDemoLibSync raycasterDemoProbes raycasterDemoSmoke`
Expected: PASS (p1 still compiles — no `RcConfig` reference added; p5/p6 probes unaffected — no `diag:` markers in their `.stm`).

- [ ] **Step 6: Commit**

```bash
git add demo-src/raycaster/lib/RcWorld.bas demo-src/raycaster-p*/RcWorld.bas tests/lib/Basic4WebGL/integration/raycasterDiagWorld.test.ts
git commit -m "feat: RcWorld diag: marker parsing + diagAt accessor (phase 7)"
```

---

## Task 4: RcRender — diagonal wall shade + lighting branch

**Files:**
- Modify: `demo-src/raycaster/lib/RcRender.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`
- Then copy: `demo-src/raycaster-p3/RcRender.bas` … `demo-src/raycaster-p6/RcRender.bas`

- [ ] **Step 1: Write the failing test**

In `raycasterDemoSmoke.test.ts`, inside the main `describe`, add:

```ts
// A diagonal wall span carries side = RC_SPAN_SIDE_DIAG (2), which collides with
// drawStrip's shadeKind 2 (floor-step riser, grey 90). renderFrame must remap it
// to the y-face wall grey (115) before drawing.
test.each(phaseDirs)('%s: renderFrame shades a diagonal wall as a wall, not a floor riser', (dirName) => {
  const fills: number[][] = [];
  const rects: unknown[][] = [];
  const overrides = {
    getStageWidth: () => 320,
    getStageHeight: () => 200,
    setFillColor: (...a: unknown[]) => {
      fills.push(a as number[]);
      return undefined;
    },
    drawRect: (...a: unknown[]) => {
      rects.push([...(a as unknown[]), fills[fills.length - 1]]);
      return undefined;
    },
  };
  const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`), overrides);
  if (!mod.RcRender) return;

  const r = new mod.RcRender(stubWorldDiag);
  r.setcamera(1.5, 1.5, Math.PI / 4, 0); // looking SE straight at the diagonal
  r.renderframe();

  // Per-column strips have w === 4 (RC_STRIP_W); backgrounds have w === 320.
  const greys = rects
    .filter((a) => a[2] === 4)
    .map((a) => (a[4] as number[] | undefined)?.[1])
    .filter((g): g is number => typeof g === 'number');

  expect(greys.length).toBeGreaterThan(0);
  expect(greys).toContain(115); // y-face wall grey — the remapped diagonal
  expect(greys).not.toContain(90); // floor-riser grey — the un-remapped bug
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run raycasterDemoSmoke -t "shades a diagonal wall"`
Expected: FAIL — `drawStrip(destX, …, self.rc.spanSide(i), lite)` passes `2`, producing grey `90`; `greys` contains `90`, not `115`.

- [ ] **Step 3: Implement**

In `demo-src/raycaster/lib/RcRender.bas`:

(a) Header comment — under the `Phase 6b:` paragraph, add:
```basic
' Phase 7: a diagonal-tile wall arrives as a span with side RC_SPAN_SIDE_DIAG;
' it is drawn with the y-face wall shade and its light is sampled from the
' (half-open) diagonal cell itself.
```

(b) In `renderFrame()`'s `dim` block, add `dim wshade`.

(c) In the lighting block (currently lines 442–452), replace:
```basic
            lite = 1.0
            if self.boundLights <> 0 then
                if kind = RcConfig.RC_SPAN_WALL then
                    if self.rc.spanSide(i) = 0 then
                        lite = self.boundLights.sampleCell(self.rc.spanCol(i) - math.sign(rayX), self.rc.spanRow(i))
                    else
                        lite = self.boundLights.sampleCell(self.rc.spanCol(i), self.rc.spanRow(i) - math.sign(rayY))
                    endif
                else
                    lite = self.boundLights.sampleCell(self.rc.spanCol(i), self.rc.spanRow(i))
                endif
            endif
```
with:
```basic
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
                    lite = self.boundLights.sampleCell(self.rc.spanCol(i), self.rc.spanRow(i))
                endif
            endif
```

(d) In the `if kind = RcConfig.RC_SPAN_WALL then` branch (currently line 454–460), replace:
```basic
                self.drawStrip(destX, sTop, sBot, winTop, winBot, self.rc.spanSide(i), lite)
```
with:
```basic
                wshade = self.rc.spanSide(i)
                if wshade = RcConfig.RC_SPAN_SIDE_DIAG then
                    wshade = 1
                endif
                self.drawStrip(destX, sTop, sBot, winTop, winBot, wshade, lite)
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run raycasterDemoSmoke -t "shades a diagonal wall"`
Expected: PASS (`greys` contains `115`, not `90`).

- [ ] **Step 5: Sync + full smoke**

```bash
for d in raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6; do
  cp demo-src/raycaster/lib/RcRender.bas demo-src/$d/RcRender.bas
done
```

Run: `npx vitest run raycasterDemoSmoke raycasterDemoTranspile raycasterDemoLibSync raycasterDemoProbes`
Expected: PASS (existing renderFrame tests still green — `stubWorld`/`stubWorld2` now have `diagat: () => 0`, so the wall branch is unchanged for them).

- [ ] **Step 6: Commit**

```bash
git add demo-src/raycaster/lib/RcRender.bas demo-src/raycaster-p*/RcRender.bas tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts
git commit -m "feat: RcRender shades diagonal walls + samples their light (phase 7)"
```

---

## Task 5: RcMover — slide along the 45° face

**Files:**
- Modify: `demo-src/raycaster/lib/RcMover.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`
- Then copy: `demo-src/raycaster-p3/RcMover.bas` … `demo-src/raycaster-p6/RcMover.bas`

- [ ] **Step 1: Write the failing test**

In `raycasterDemoSmoke.test.ts`, after `stubWorldDiag`, add a per-corner stub factory:

```ts
// Center cell (3,3) is a diagonal of the given code; everything else open,
// bordered at 0 and 7.
function makeDiagStub(code: number) {
  return {
    floorheightat: () => 0,
    ceilheightat: () => 1,
    wallat: (c: number, r: number) => (c <= 0 || c >= 7 || r <= 0 || r >= 7 ? 1 : 0),
    diagat: (c: number, r: number) => (c === 3 && r === 3 ? code : 0),
    walltexat: () => '',
    floortexat: () => '',
    ceiltexat: () => '',
    widthcells: () => 8,
    heightcells: () => 8,
    lightat: () => 0,
  };
}

// For each corner code: [spawn x, spawn y, drive angle (into the wedge),
// signed-distance check that must stay true — body centre never crosses to the
// solid side]. Chord of cell (3,3) is world x+y=7 (nw/se) or x-y=0 (ne/sw).
const DIAG_MOVER_CASES = [
  // nw solid (x+y<=7 solid): spawn SE of the chord, drive NW.
  { code: 1, x: 4.4, y: 3.6, ang: Math.atan2(-1, -1), ok: (x: number, y: number) => x + y > 7.0 },
  // ne solid (x-y>=0 solid): spawn NW of the chord (x<y), drive SE-ish toward +x-y.
  { code: 2, x: 3.4, y: 3.7, ang: Math.atan2(-1, 1), ok: (x: number, y: number) => x - y < 0.0 },
  // se solid (x+y>=7 solid): spawn NW of the chord, drive SE.
  { code: 3, x: 3.4, y: 3.4, ang: Math.atan2(1, 1), ok: (x: number, y: number) => x + y < 7.0 },
  // sw solid (x-y<=0 solid): spawn SE of the chord (x>y), drive SW-ish toward -x+y.
  { code: 4, x: 3.7, y: 3.4, ang: Math.atan2(1, -1), ok: (x: number, y: number) => x - y > 0.0 },
];
```

Then inside the `describe`:

```ts
test.each(phaseDirs)('%s: RcMover slides along a diagonal face instead of tunnelling', (dirName) => {
  const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`));
  if (!mod.RcMover) return;

  for (const cs of DIAG_MOVER_CASES) {
    const m = new mod.RcMover(makeDiagStub(cs.code) as unknown, cs.x, cs.y, 0.3, 0.6);
    m.turn(cs.ang);
    for (let i = 0; i < 40; i++) {
      m.move(2.6, 0); // RC_MOVE_SPEED
      m.step(50);
    }
    expect(cs.ok(m.x(), m.y()), `code ${cs.code}: (${m.x().toFixed(2)},${m.y().toFixed(2)}) must stay open-side`).toBe(true);
    // and it actually moved off the spawn (didn't get stuck immediately)
    expect(Math.hypot(m.x() - cs.x, m.y() - cs.y)).toBeGreaterThan(0.05);
  }

  // Free walk: no diagonal on the path -> travels far.
  const free = new mod.RcMover(makeDiagStub(3) as unknown, 1.5, 1.5, 0.3, 0.6);
  free.turn(0); // +x, row 1, never touches the (3,3) diagonal
  for (let i = 0; i < 40; i++) {
    free.move(2.6, 0);
    free.step(50);
  }
  expect(free.x()).toBeGreaterThan(4.0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run raycasterDemoSmoke -t "slides along a diagonal face"`
Expected: FAIL — with no push-out, `blocked()` ignores the diagonal (wall 0, floor 0, ceil 1), the body drives straight through, and at least one `cs.ok(...)` is false (centre on the solid side).

- [ ] **Step 3: Implement the push-out**

In `demo-src/raycaster/lib/RcMover.bas`:

(a) Header comment — under the `single-cell slide invariant:` bullet, add:
```basic
'   - diagonal tiles: step() runs ONE push-out pass per frame after the axis
'     moves — if the centre lands inside a diag cell's solid wedge it is pushed
'     back out along the chord normal (a smooth 45-degree slide). Same speed
'     limit as the slide invariant: a body fast enough to cross the thin part of
'     the wedge in one frame is not caught.
```

(b) In `step()`'s `dim` block (after `dim steppingUp`), add:
```basic
    dim dcx
    dim dcy
    dim dgc
    dim lu
    dim lv
    dim sd
    dim push
    dim nX
    dim nY
```

(c) Immediately after the `moveY` slide block (currently ends line 142, before `if self.wantJump = 1 then`), insert:
```basic
    ' Diagonal push-out: keep the body centre at least `rad` off the 45-degree
    ' chord of the diag cell it now occupies, on the open side.
    dcx = math.floor(self.px)
    dcy = math.floor(self.py)
    dgc = self.wld.diagAt(dcx, dcy)
    if dgc > 0 then
        lu = self.px - dcx
        lv = self.py - dcy
        sd = 0
        nX = 0
        nY = 0
        if dgc = RcConfig.RC_DIAG_NW then
            sd = (lu + lv - 1.0) * 0.70710678
            nX = 0.70710678
            nY = 0.70710678
        endif
        if dgc = RcConfig.RC_DIAG_SE then
            sd = (1.0 - lu - lv) * 0.70710678
            nX = 0 - 0.70710678
            nY = 0 - 0.70710678
        endif
        if dgc = RcConfig.RC_DIAG_NE then
            sd = (lv - lu) * 0.70710678
            nX = 0 - 0.70710678
            nY = 0.70710678
        endif
        if dgc = RcConfig.RC_DIAG_SW then
            sd = (lu - lv) * 0.70710678
            nX = 0.70710678
            nY = 0 - 0.70710678
        endif
        if sd < self.rad then
            push = self.rad - sd
            self.px = self.px + nX * push
            self.py = self.py + nY * push
        endif
    endif
```

**Sign check (verify against the geometry table while implementing):** `sd` is the signed distance from the centre to the chord, positive on the OPEN side. `(nX,nY)` is the unit chord normal pointing to the open side. For `nw` (solid `u+v ≤ 1`), open is `u+v > 1`, so `sd = (lu+lv-1)/√2` and the normal is `(+,+)/√2`. For `ne` (solid `u ≥ v`), open is `v > u`, so `sd = (lv-lu)/√2` and normal `(-,+)/√2`. `se` and `sw` are the negations.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run raycasterDemoSmoke -t "slides along a diagonal face"`
Expected: PASS for all 4 corner codes + the free-walk control.

- [ ] **Step 5: Sync + full smoke + probes**

```bash
for d in raycaster-p3 raycaster-p4 raycaster-p5 raycaster-p6; do
  cp demo-src/raycaster/lib/RcMover.bas demo-src/$d/RcMover.bas
done
```

Run: `npx vitest run raycasterDemoSmoke raycasterDemoTranspile raycasterDemoLibSync raycasterDemoProbes`
Expected: PASS (existing RcMover step tests still green — `stubWorld.diagat` returns 0, push-out block is skipped).

- [ ] **Step 6: Commit**

```bash
git add demo-src/raycaster/lib/RcMover.bas demo-src/raycaster-p*/RcMover.bas tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts
git commit -m "feat: RcMover slides along diagonal-tile faces (phase 7)"
```

---

## Task 6: The `raycaster-p7-diagonals` demo

**Files:**
- Create: `demo-src/raycaster-p7/assets/p7room.stm`
- Create: `demo-src/raycaster-p7/assets/rc_placeholder_tiles.png` (copy)
- Create: `demo-src/raycaster-p7/DiagScene.bas`
- Create: `demo-src/raycaster-p7/Main.bas`
- Create: 8 lib copies in `demo-src/raycaster-p7/`
- Create: `src/docs/demos/RaycasterP7Diagonals.b4wgl.json` (via build script)
- Modify: `src/features/demos/devDemoRegistry.ts`
- Modify: `tests/ui/features/demos/devDemoRegistry.test.ts`
- Modify: `cypress/e2e/demos.cy.ts`
- Modify: `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts`

- [ ] **Step 1: Create the room `.stm`**

`demo-src/raycaster-p7/assets/p7room.stm` — 10 rows × 14 cols. Room interior open cols 3–8 rows 1–8; canted dead-end passage cols 9–12 rows 4–5; octagon corners + chevron via `diag:` markers; one `light`.

```json
{
  "tileWidth": 16,
  "tileHeight": 16,
  "tileImage": "rc_placeholder_tiles.png",
  "layers": {
    "walls": [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
      [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    "tags": {
      "type": "markers",
      "markers": [
        { "row": 1, "col": 3, "tag": "diag:nw" },
        { "row": 1, "col": 8, "tag": "diag:ne" },
        { "row": 8, "col": 3, "tag": "diag:sw" },
        { "row": 8, "col": 8, "tag": "diag:se" },
        { "row": 4, "col": 12, "tag": "diag:ne" },
        { "row": 5, "col": 12, "tag": "diag:se" },
        { "row": 4, "col": 5, "tag": "light" }
      ]
    }
  }
}
```

The chevron: `(col12,row4) ne` + `(col12,row5) se` — the two solid wedges meet at world `(13,5)`, forming a `<`-shaped canted dead-end that a ray down the passage middle hits, and either face slides a body diagonally.

- [ ] **Step 2: Copy the tile image + lib files**

```bash
mkdir -p demo-src/raycaster-p7/assets
cp demo-src/raycaster-p6/assets/rc_placeholder_tiles.png demo-src/raycaster-p7/assets/
for f in RcConfig RcWorld RcCast RcRender RcMover RcLights RcActor RcActors; do
  cp demo-src/raycaster/lib/$f.bas demo-src/raycaster-p7/$f.bas
done
```

- [ ] **Step 3: Create `Main.bas`**

`demo-src/raycaster-p7/Main.bas`:

```basic
function oninit()
  world.setPixelPerfect(true)
endfunction

dim scn = new DiagScene()
scenemanager.register("diag", scn)
scenemanager.switch("diag")
```

- [ ] **Step 4: Create `DiagScene.bas` with the 6 probes**

`demo-src/raycaster-p7/DiagScene.bas`:

```basic
Class
Extends scene

dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim lights as RcLights
dim torch
dim titleText as Text
dim hintText as Text

Constructor()
    input.bind("fwd", "key", keyboard.W)
    input.bind("back", "key", keyboard.S)
    input.bind("sl", "key", keyboard.Q)
    input.bind("sr", "key", keyboard.E)
    input.bind("tl", "key", keyboard.A)
    input.bind("tr", "key", keyboard.D)
    input.bind("jump", "key", keyboard.SPACE)
EndConstructor

function onenter()
    world.setBackground(0, 0, 0)
    self.tm = new tilemapset("p7room.stm")
    self.wld = new RcWorld(self.tm, "walls")
    self.ren = new RcRender(self.wld)
    self.me = new RcMover(self.wld, 5.5, 4.5, 0.3, 0.6)
    self.lights = new RcLights(self.wld)
    self.ren.bindLights(self.lights)
    self.ren.bindCamera(self.me)
    self.torch = self.lights.addPoint(5.5, 4.5, 0.5, 0.9, RcConfig.RC_LIGHT_RANGE)
    self.lights.update()

    self.titleText = new Text("Raycaster P7 - diagonal tiles", 12, 10)
    self.titleText.setStyle(16, 255, 220, 120)
    hud.add(self.titleText)
    self.hintText = new Text("WASD move/turn  QE strafe  (octagon room + canted passage east)", 12, 30)
    self.hintText.setStyle(12, 180, 200, 220)
    hud.add(self.hintText)

    self.runProbes()
endfunction

function runProbes()
    dim ok1
    dim ok2
    dim ok3
    dim ok4
    dim ok5
    dim ok6
    dim probeCast as RcCast
    dim sc
    dim mc
    dim mv as RcMover
    dim i
    dim dlos
    dim ddiag

    ' 1 - diag: markers parsed to the right corner codes
    ok1 = 0
    if self.wld.diagAt(3, 1) = RcConfig.RC_DIAG_NW then
        if self.wld.diagAt(8, 8) = RcConfig.RC_DIAG_SE then
            ok1 = 1
        endif
    endif
    self.probe("diag tags loaded", ok1, 52)

    probeCast = new RcCast()

    ' 2 - a ray from room centre at the NW corner tile terminates on a diagonal wall
    probeCast.cast(self.wld, 5.5, 4.5, 0 - 2.2, 0 - 3.2)
    sc = probeCast.spanCount()
    ok2 = 0
    if sc > 0 then
        if probeCast.spanSide(sc - 1) = RcConfig.RC_SPAN_SIDE_DIAG then
            ok2 = 1
        endif
    endif
    self.probe("cast hits a diagonal", ok2, 72)

    ' 3 - control: straight up an open column hits a NORMAL wall (not diagonal)
    probeCast.cast(self.wld, 5.5, 4.5, 0, 0 - 1)
    sc = probeCast.spanCount()
    ok3 = 0
    if sc > 0 then
        if probeCast.spanSide(sc - 1) <> RcConfig.RC_SPAN_SIDE_DIAG then
            ok3 = 1
        endif
    endif
    self.probe("open ray hits plain wall", ok3, 92)

    ' 4 - a body driven into the NW corner wedge never crosses to the solid side
    '     (world chord x + y = 5; solid side x + y < 5)
    mv = new RcMover(self.wld, 3.9, 1.6, 0.3, 0.6)
    mv.turn(0 - 2.356)
    for i = 0 to 39
        mv.move(RcConfig.RC_MOVE_SPEED, 0)
        mv.step(50)
    next i
    ok4 = 0
    if mv.x() + mv.y() > 4.9 then
        if mv.x() < 3.9 then
            ok4 = 1
        endif
    endif
    self.probe("mover slides on diagonal", ok4, 112)

    ' 5 - a body walks freely from room centre out through the doorway into the passage
    mv = new RcMover(self.wld, 5.5, 4.5, 0.3, 0.6)
    mv.turn(0)
    for i = 0 to 39
        mv.move(RcConfig.RC_MOVE_SPEED, 0)
        mv.step(50)
    next i
    ok5 = 0
    if mv.x() > 9.0 then
        ok5 = 1
    endif
    self.probe("mover crosses open room", ok5, 132)

    ' 6 - cast + los agree on the canted dead-end chevron (ray passes through one
    '     diagonal's open half and hits the next)
    probeCast.cast(self.wld, 5.5, 4.5, 7.0, 0.5)
    sc = probeCast.spanCount()
    dlos = probeCast.los(self.wld, 5.5, 4.5, 7.0, 0.5)
    ok6 = 0
    if sc > 0 then
        if probeCast.spanSide(sc - 1) = RcConfig.RC_SPAN_SIDE_DIAG then
            if dlos > 0 then
                ddiag = probeCast.spanDist(sc - 1)
                if math.abs(dlos - ddiag) < 0.05 then
                    ok6 = 1
                endif
            endif
        endif
    endif
    self.probe("cast and los agree on diagonal", ok6, 152)
endfunction

function probe(label, passed, y)
    dim result
    dim t as Text
    dim missing
    dim boom
    ' A failed probe must throw a caught runtimeError -- canvas text is invisible
    ' to the Cypress "no ERR" guard.
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

    fwd = input.axis("back", "fwd")
    strafe = input.axis("sl", "sr")
    turnAxis = input.axis("tl", "tr")

    self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
    if turnAxis <> 0 then
        self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
    endif
    if input.pressed("jump") then
        self.me.jump()
    endif

    self.me.step(delta)
    self.lights.moveLight(self.torch, self.me.x(), self.me.y())
    self.lights.update()
    self.ren.renderFrame()
endfunction

EndClass
```

> **Note on probe geometry:** the numeric thresholds (probe 4's `4.9` / `3.9`, probe 5's `9.0`, probe 6's `0.05`) are derived from `p7room.stm` as written. If Step 6 shows a probe failing, first re-derive the expectation from the actual grid — do **not** just loosen the tolerance. Probe 4's anti-tunnel bound `x+y > 4.9` must stay clearly above the tunnelled value (`x+y ≈ 3–4` if the body passes into/through the wedge). Probe 6's `< 0.05` must stay tight (cast and los share `diagHit`, so they should match to floating-point noise).

- [ ] **Step 5: Add the `devDemoRegistry` entry**

In `src/features/demos/devDemoRegistry.ts`, append to the array (after the `raycaster-p6-actors` object):

```ts
  {
    slug: 'raycaster-p7-diagonals',
    name: 'Raycaster P7 — Diagonal Tiles',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 7 probe: corner-solid 45° diagonal-wall tiles — RcWorld parses diag: markers, RcCast ray-tests the chord in cast/los, RcMover slides along the 45° face. Octagonal room + a canted dead-end passage.',
    docsSlug: '',
    file: 'RaycasterP7Diagonals',
  },
```

- [ ] **Step 6: Build the demo JSON**

Run: `npm run build:demo -- demo-src/raycaster-p7 RaycasterP7Diagonals`
Expected: `Wrote src/docs/demos/RaycasterP7Diagonals.b4wgl.json (10 file(s), 2 asset(s))`

- [ ] **Step 7: Add the probes-test case**

In `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts`, inside `describe('raycaster phase demo probes execute', ...)`, add:

```ts
test('P7 DiagScene.onenter runs runProbes and every probe passes', () => {
  runPhaseProbes({
    dir: 'demo-src/raycaster-p7',
    stm: 'p7room.stm',
    sceneGlobal: '_sb_diagscene',
    probeCount: 6,
  });
});
```

- [ ] **Step 8: Add the devDemoRegistry presence test**

In `tests/ui/features/demos/devDemoRegistry.test.ts`, inside the `describe`, add:

```ts
test('includes the Phase 7 diagonal-tiles demo', () => {
  const p7 = devDemoRegistry.find((d) => d.slug === 'raycaster-p7-diagonals');
  expect(p7?.file).toBe('RaycasterP7Diagonals');
});
```

- [ ] **Step 9: Add the Cypress DEV_DEMOS entry**

In `cypress/e2e/demos.cy.ts`, append to `DEV_DEMOS`:

```ts
  { slug: 'raycaster-p7-diagonals', title: 'Raycaster P7 — Diagonal Tiles', waitMs: 4000 },
```

- [ ] **Step 10: Run the full raycaster + demo suite**

Run: `npx vitest run raycasterDemo raycasterDiagWorld devDemoRegistry`
Expected: PASS —
- `raycasterDemoTranspile` — `raycaster-p7` compiles, zero diagnostics.
- `raycasterDemoLibSync` — all 8 `raycaster-p7/*.bas` lib copies byte-match canonical.
- `raycasterDemoSmoke` — p7 rides every `test.each(phaseDirs)` block.
- `raycasterDemoProbes` — P7's 6 probes all report OK.
- `devDemoRegistry` — p7 entry present, slug doesn't collide.

- [ ] **Step 11: Commit**

```bash
git add demo-src/raycaster-p7 src/docs/demos/RaycasterP7Diagonals.b4wgl.json src/features/demos/devDemoRegistry.ts tests/ui/features/demos/devDemoRegistry.test.ts tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts cypress/e2e/demos.cy.ts
git commit -m "feat: raycaster-p7-diagonals dev demo (phase 7)"
```

---

## Task 7: Full verification pass

- [ ] **Step 1: Whole Vitest suite**

Run: `npx vitest run`
Expected: PASS, no new failures vs. `main`. (Tutorial-1 e2e is a separate Cypress spec, not in this run.)

- [ ] **Step 2: Production build**

Run: `npx vite build`
Expected: builds clean (the `RaycasterP7Diagonals.b4wgl.json` dynamic import resolves).

- [ ] **Step 3: Cypress demo spec**

In one terminal: `npm run dev`
In another: `npx cypress run --spec cypress/e2e/demos.cy.ts`
Expected: `Dev demo: Raycaster P7 — Diagonal Tiles` passes (seeds, runs, no `ERR` in the console panel). Existing raycaster p1–p6 specs still green.

- [ ] **Step 4: Manual eyeball**

`npm run dev`, browser console: `await window.__seedDemo('raycaster-p7-diagonals')`, then open `/projects/<id>/edit` and Run. Confirm:
- the central room reads as an **octagon** — the four corners are cut at 45°, not square.
- walking into a cut corner, you **slide along** the 45° face (not stop dead, not pass through).
- the passage east of the room ends in a **canted `<` dead-end**, not a flat wall.
- light and shade fall sensibly on the diagonal faces (no black wedges where a torch clearly hits).

- [ ] **Step 5: Commit (if any eyeball tweak to `p7room.stm` was needed)**

```bash
git add -A && git commit -m "fix: p7room.stm geometry tweak after eyeball"
```

(Skip if nothing changed. If `p7room.stm` changes, re-run `npm run build:demo -- demo-src/raycaster-p7 RaycasterP7Diagonals` and re-commit the JSON, and re-check the probe thresholds.)

---

## Task 8: Docs

**Files:**
- Modify: `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`
- Modify: `docs/roadmap.md`
- (Header comments already updated in Tasks 2–5.)

- [ ] **Step 1: Engine spec — mark Phase 7 done**

In `docs/superpowers/specs/2026-08-31-raycaster-engine-design.md`:
- §11 phasing table/list: change the Phase 7 line to `7 [DONE 2026-09-02] — Diagonal-wall tiles (RcWorld + RcCast + RcMover). Demo: raycaster-p7-diagonals (octagonal room + canted dead-end passage).`
- §3.1: after the `wall(i)` "a diagonal-tile id selects a 45° chord + rotation" note, add: `As built: not a wall id — a per-cell diagArr populated from a diag:nw|ne|se|sw marker tag; walls-layer stays 0. RcWorld.diagAt(col,row) → 0 | RC_DIAG_NW..SW.`
- §3.3: after the "one 'diagonal' placeholder with 4 rotations" line, add: `As built: marker tags diag:nw / diag:ne / diag:se / diag:sw (corner the solid triangle fills).`
- §4.2: after the "single ray/segment intersection against the tile's 45° chord" sentence, add: `As built: RcCast.diagHit() — signed chord function f, hit at ray-param mEntryDist if the ray enters on the solid side, else at the chord-crossing param s if s ∈ [entry, exit]. Shared by cast() and los(). Span side = RC_SPAN_SIDE_DIAG; wall-U = 0 (flat-shaded, v1).`
- §5.x (wherever the "As built" render notes live): add `Phase 7: renderFrame maps span side RC_SPAN_SIDE_DIAG to the y-face wall shade (115) and samples the diagonal cell's own light grid entry.`
- §7.x (mover notes): add `Phase 7: step() runs one diagonal push-out pass per frame after the axis slides — centre pushed out along the chord normal to rad clearance; smooth 45° slide, same speed limit as the single-cell slide invariant.`

- [ ] **Step 2: `docs/roadmap.md` — item 28**

In the item-28 raycaster paragraph, after the "Phase 6b shipped:" clause, add:
`Phase 7 shipped (2026-09-02): corner-solid 45° diagonal-wall tiles — diag: marker tags, RcWorld.diagAt, RcCast chord test in cast/los, RcMover 45°-face slide. Dev demo raycaster-p7-diagonals (octagon + canted passage). Deferred: diagonal wall texturing (flat-shaded, spanU=0), diag+floor/ceil-step in one cell (diag cells are flat), a dedicated diagonal wall shade.`

Leave roadmap #34 (`arr(i).method(args)` untyped chain) as-is — unaffected by this work.

- [ ] **Step 3: Verify docs build**

Run: `npx vitest run` (catches any manifest/doc test regressions)
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-08-31-raycaster-engine-design.md docs/roadmap.md
git commit -m "docs: raycaster phase 7 shipped — diagonal-wall tiles"
```

---

## Self-Review

**Spec coverage:**
- (a) model A geometry — Task 3 (codes 1–4), geometry reference table. ✓
- (b) `RcWorld` diagArr / diag: parse / diagAt — Task 3. ✓
- (c) `RcCast` chord test in cast + los, shared helper — Task 2 (`diagHit`). ✓
- (d) `RcRender` shading + spanSide value — Task 1 (`RC_SPAN_SIDE_DIAG`), Task 4 (remap + lighting branch). ✓
- (e) `RcMover` slide — Task 5 (push-out, all 4 corner signs). ✓
- (f) new p7 demo, octagon + canted passage, probes on diagAt + a cast/los ray — Task 6 (6 probes: diagAt, cast-diag, cast-control, mover-slide, mover-free, cast/los agree). ✓
- (g) out of scope — documented in Task 8 Step 2 + spec §9. ✓

**Placeholder scan:** thresholds in the p7 probes carry an explicit "re-derive, don't loosen" note; the RcMover sign table has a "verify against geometry" callout; no `TODO`/`TBD`/"handle edge cases". ✓

**Type/name consistency:** `diagAt` (softBASIC) → `diagat` (transpiled, used in TS stubs) — consistent. `RC_SPAN_SIDE_DIAG = 2`, `RC_DIAG_NW..SW = 1..4` — used identically in `diagHit`, RcRender, RcWorld (as bare literals, per the p1-no-RcConfig constraint), RcMover, and the tests. `diagHit(dg, ox, oy, dx, dy, cx, cy, entryDist, exitDist)` signature matches both call sites. `stubWorldDiag` / `makeDiagStub` / the existing `stubWorld` + `stubWorld2` all carry `diagat`. ✓

**Sync coverage:** every library `.bas` edit is followed by an explicit `cp` loop to the phase dirs that carry it (`RcConfig`/`RcCast` p2–p6→p7; `RcWorld` p1–p6→p7; `RcRender`/`RcMover` p3–p6→p7), and `raycasterDemoLibSync` is in the verify step each time. ✓
