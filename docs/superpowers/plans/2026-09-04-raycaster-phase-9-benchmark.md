# Raycaster Phase 9 — Benchmark + First Optimisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the raycaster performance measurement infrastructure (procedural stress-scene generator, headless CPU harness, browser frame-cost demo), implement one optimisation rung (painter's background floor/ceiling fill), and write the Phase 9 report.

**Architecture:** A deterministic TS generator writes 3 sized `.stm` stress scenes + enemy/path JSON. A Vitest harness transpiles the `raycaster-p9-bench` lib, builds a real `RcWorld` from a generated `.stm` via the existing inline-tilemap stub, drives `RcRender`/`RcActors`/`RcLights` over a fixed camera path against a counting fake-PIXI surface, and prints/asserts primitive counts. Rung 1 adds two full-screen background `drawRect`s at the top of `renderFrame` (guarded by `RcConfig.RC_FLAT_FILL`, a grounded standard-height camera, and a colour-clean check) and skips the per-column `drawSurface` for columns with no step — the Wolfenstein approach.

**Tech Stack:** softBASIC (`.bas` → transpiled JS), TypeScript (`vite-node` scripts), Vitest, `scripts/buildDemo.ts`, Cypress e2e.

**Spec:** `docs/superpowers/specs/2026-09-04-raycaster-phase-9-benchmark-design.md` — read §3–§8 before starting.

**Conventions (CLAUDE.md):** work on `main`, no branch; every `.bas` in a `raycaster-p*` phase dir must stay byte-identical to `demo-src/raycaster/lib/` (`raycasterDemoLibSync` enforces); rebuild affected `src/docs/demos/Raycaster*.b4wgl.json` after lib changes; verify builds with `npx vite build`, never `tsc`; `npx vitest run` is the full suite (`[vitest-worker]: Timeout calling "onTaskUpdate"` is a known flake); commit messages end `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

## File Structure

**Created — generator & data:**
- `scripts/genRaycasterStress.ts` — deterministic; writes the three `.stm`, the three `stressN.enemies.json` + `stressPath.json` (consumed by the TS harness only), **and** `demo-src/raycaster-p9-bench/StressData.bas` (a softBASIC class holding the same path + enemy lists as pushed arrays — consumed by the demo scene, since softBASIC has no JSON parser)
- `demo-src/raycaster-p9-bench/assets/stress16.stm`, `stress32.stm`, `stress48.stm`
- `demo-src/raycaster-p9-bench/assets/stress16.enemies.json` … `stress48.enemies.json`, `stressPath.json`
- `demo-src/raycaster-p9-bench/assets/*.png` — 6 textures (regenerated) + `rc_placeholder_tiles.png` + `rc_enemy.png` (copied from p6)

**Known softBASIC limits confirmed against `src/lib/Basic4WebGL/defs/`:** no JSON
parser (→ `StressData.bas` holds the data as code); no monotonic clock (→ the
demo HUD times frames from the `delta` arg of `onupdate`, which *is* the real
frame interval); number-row keys are `keyboard.DIGIT_1` / `DIGIT_2` / `DIGIT_3`
(not `NUM1`).

**Created — demo:**
- `demo-src/raycaster-p9-bench/Main.bas`, `BenchScene.bas`, + 8 lib `.bas` copies
- `src/docs/demos/RaycasterP9Bench.b4wgl.json`

**Created — harness & report:**
- `tests/lib/Basic4WebGL/integration/raycasterBench.test.ts`
- `docs/raycaster-benchmark-report.md`

**Modified — library (canonical `demo-src/raycaster/lib/`, then synced to every phase dir that carries the file):**
- `RcConfig.bas` — `RC_FLAT_FILL = 1` (Task 5)
- `RcRender.bas` — `primCount` field + `primitiveCount()` accessor (Task 2); `drawFill` / `floorBandClean` / `ceilBandClean` helpers; background fills + per-column skip in `renderFrame` (Task 5)
- `RcMover.bas` — `warpTo(x, y, angle)` (Task 4 Step 2a)

**Modified — wiring:**
- `src/features/demos/devDemoRegistry.ts`, `cypress/e2e/demos.cy.ts`, `tests/ui/features/demos/devDemoRegistry.test.ts`, `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts`
- `tests/lib/Basic4WebGL/integration/raycasterWindowOcclusion.test.ts` — rung-1 assertions
- `src/docs/guides/raycaster-library.md`, `docs/language/library-roadmap.md` — size-budget sentence + report link

---

## Task 1: Stress-scene generator

**Files:**
- Create: `scripts/genRaycasterStress.ts`
- Create (generated): `demo-src/raycaster-p9-bench/assets/stress{16,32,48}.stm`, `stress{16,32,48}.enemies.json`, `stressPath.json`
- Test: `tests/lib/Basic4WebGL/integration/raycasterBench.test.ts` (a parse-check only in this task; the full harness is Task 3)

- [ ] **Step 1: Write the generator**

Create `scripts/genRaycasterStress.ts`:

```ts
/**
 * Deterministic stress-scene generator for the raycaster Phase 9 benchmark.
 *
 *   npx vite-node scripts/genRaycasterStress.ts
 *
 * Writes stress16/32/48 .stm + enemy spawn lists + a shared camera path into
 * demo-src/raycaster-p9-bench/assets/. No RNG — placement is a pure function of
 * cell coordinates, so the benchmark is stable run to run.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'demo-src/raycaster-p9-bench/assets';
const SIZES = [16, 32, 48];
const FCOLS = ['6b3f22', '394c2f', '35608a'];
const CCOLS = ['2f3a52', '4a2f3a', '2f4a3a'];
const TEXES = ['rc_tex_brick.png', 'rc_tex_panel.png', 'rc_tex_rock.png'];

interface Marker {
  row: number;
  col: number;
  tag: string;
}

function buildStm(n: number) {
  // walls grid: solid border, open interior
  const walls: number[][] = [];
  for (let r = 0; r < n; r++) {
    const row: number[] = [];
    for (let c = 0; c < n; c++) {
      row.push(r === 0 || c === 0 || r === n - 1 || c === n - 1 ? 1 : 0);
    }
    walls.push(row);
  }

  const markers: Marker[] = [];
  // interior 4x4 motif
  for (let r = 1; r < n - 1; r++) {
    for (let c = 1; c < n - 1; c++) {
      const br = r % 4;
      const bc = c % 4;
      const blk = Math.floor(r / 4) + Math.floor(c / 4);
      if (br === 0 && bc === 0) markers.push({ row: r, col: c, tag: 'floor:0.4 ceil:2.0' });
      else if (br === 1 && bc === 1) markers.push({ row: r, col: c, tag: 'floor:-0.6' });
      else if (br === 2 && bc === 2) markers.push({ row: r, col: c, tag: 'diag:se' });
      else if (br === 0 && bc === 2) markers.push({ row: r, col: c, tag: `fcol:${FCOLS[blk % 3]}` });
      else if (br === 2 && bc === 0) markers.push({ row: r, col: c, tag: `ccol:${CCOLS[blk % 3]}` });
      else if (br === 3 && bc === 3) {
        walls[r][c] = 1;
        markers.push({ row: r, col: c, tag: `tex:${TEXES[blk % 3]}` });
      }
    }
  }
  // border wall textures, ~1 in 3
  for (let c = 0; c < n; c++) {
    if (c % 3 === 0) {
      markers.push({ row: 0, col: c, tag: `tex:${TEXES[c % 3]}` });
      markers.push({ row: n - 1, col: c, tag: `tex:${TEXES[(c + 1) % 3]}` });
    }
  }

  return {
    tileWidth: 16,
    tileHeight: 16,
    tileImage: 'rc_placeholder_tiles.png',
    layers: { walls, tags: { type: 'markers', markers } },
  };
}

function buildEnemies(n: number) {
  const out: Array<{ x: number; y: number }> = [];
  for (let r = 3; r < n - 2; r += 6) {
    for (let c = 3; c < n - 2; c += 6) {
      // avoid the raised/pit motif cells so spawns land on standard floor
      if (r % 4 === 0 && c % 4 === 0) continue;
      if (r % 4 === 1 && c % 4 === 1) continue;
      out.push({ x: c + 0.5, y: r + 0.5 });
    }
  }
  return out;
}

// Camera path authored in stress32 coordinates; the harness scales by n/32.
function buildPath() {
  const wp: Array<{ x: number; y: number; angle: number }> = [];
  const pts: Array<[number, number]> = [
    [2, 2], [8, 3], [8, 10], [3, 14], [10, 16], [16, 12],
    [16, 20], [22, 22], [28, 18], [29, 28], [20, 29], [12, 24], [4, 28], [2, 20],
  ];
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[(i + 1) % pts.length];
    const angle = Math.atan2(ny - y, nx - x);
    // 3 sub-waypoints per leg → ~42 frames
    for (let s = 0; s < 3; s++) {
      const t = s / 3;
      wp.push({ x: x + (nx - x) * t, y: y + (ny - y) * t, angle });
    }
  }
  return wp;
}

// softBASIC data module — same path + enemy lists as code (no JSON parser in
// the language). One class; the demo scene does `new StressData()`.
function buildBas(path: ReturnType<typeof buildPath>, enemiesBySize: Record<number, ReturnType<typeof buildEnemies>>) {
  const L: string[] = ['Class', "' GENERATED by scripts/genRaycasterStress.ts -- do not hand-edit.", ''];
  L.push('dim pathX(0)', 'dim pathY(0)', 'dim pathA(0)');
  for (const n of SIZES) L.push(`dim e${n}x(0)`, `dim e${n}y(0)`);
  L.push('', 'Constructor()');
  for (const w of path) {
    L.push(`  array.push(self.pathX, ${w.x.toFixed(4)})`);
    L.push(`  array.push(self.pathY, ${w.y.toFixed(4)})`);
    L.push(`  array.push(self.pathA, ${w.angle.toFixed(4)})`);
  }
  for (const n of SIZES) {
    for (const e of enemiesBySize[n]) {
      L.push(`  array.push(self.e${n}x, ${e.x.toFixed(2)})`);
      L.push(`  array.push(self.e${n}y, ${e.y.toFixed(2)})`);
    }
  }
  L.push('EndConstructor', '');
  L.push('function pathCount()', '  return array.arrLength(self.pathX)', 'endfunction', '');
  L.push('function px(i)', '  return self.pathX(i)', 'endfunction', '');
  L.push('function py(i)', '  return self.pathY(i)', 'endfunction', '');
  L.push('function pa(i)', '  return self.pathA(i)', 'endfunction', '');
  L.push('function enemyCount(size)');
  for (const n of SIZES) L.push(`  if size = ${n} then`, `    return array.arrLength(self.e${n}x)`, '  endif');
  L.push('  return 0', 'endfunction', '');
  L.push('function ex(size, i)');
  for (const n of SIZES) L.push(`  if size = ${n} then`, `    return self.e${n}x(i)`, '  endif');
  L.push('  return 0', 'endfunction', '');
  L.push('function ey(size, i)');
  for (const n of SIZES) L.push(`  if size = ${n} then`, `    return self.e${n}y(i)`, '  endif');
  L.push('  return 0', 'endfunction', '');
  L.push('EndClass', '');
  return L.join('\n');
}

mkdirSync(OUT, { recursive: true });
const enemiesBySize: Record<number, ReturnType<typeof buildEnemies>> = {};
for (const n of SIZES) {
  writeFileSync(join(OUT, `stress${n}.stm`), JSON.stringify(buildStm(n), null, 2));
  enemiesBySize[n] = buildEnemies(n);
  writeFileSync(join(OUT, `stress${n}.enemies.json`), JSON.stringify(enemiesBySize[n], null, 2));
  console.log(`wrote stress${n}.stm + enemies (${enemiesBySize[n].length})`);
}
const path = buildPath();
writeFileSync(join(OUT, 'stressPath.json'), JSON.stringify(path, null, 2));
writeFileSync('demo-src/raycaster-p9-bench/StressData.bas', buildBas(path, enemiesBySize));
console.log(`wrote stressPath.json (${path.length} wp) + StressData.bas`);
```

- [ ] **Step 2: Run it**

```bash
mkdir -p demo-src/raycaster-p9-bench/assets
npx vite-node scripts/genRaycasterStress.ts
ls demo-src/raycaster-p9-bench/assets
```

Expected: `stress16.stm stress32.stm stress48.stm stress16.enemies.json … stressPath.json`.

- [ ] **Step 3: Sanity-check the output**

```bash
npx vite-node -e "const s=require('./demo-src/raycaster-p9-bench/assets/stress32.stm'); console.log('walls', s.layers.walls.length, 'x', s.layers.walls[0].length, 'markers', s.layers.tags.markers.length); const e=require('./demo-src/raycaster-p9-bench/assets/stress32.enemies.json'); console.log('enemies', e.length); const p=require('./demo-src/raycaster-p9-bench/assets/stressPath.json'); console.log('waypoints', p.length);"
```

Expected: `walls 32 x 32`, markers ≈ 200+, enemies ≈ 16–25, waypoints ≈ 42. Confirm no enemy spawn `{x,y}` lands on a border (`x`/`y` between 1 and n-1) or a motif raised/pit cell.

- [ ] **Step 4: Copy the shared assets**

```bash
cp demo-src/raycaster-p3/assets/rc_placeholder_tiles.png demo-src/raycaster-p9-bench/assets/
cp demo-src/raycaster-p6/assets/rc_enemy.png demo-src/raycaster-p9-bench/assets/
```

Retarget `scripts/genRaycasterTextures.ts` `OUT_DIR` to `demo-src/raycaster-p9-bench/assets` and run it:

```bash
npx vite-node scripts/genRaycasterTextures.ts
ls demo-src/raycaster-p9-bench/assets/*.png
```

Expected: `rc_enemy.png rc_placeholder_tiles.png rc_tex_brick.png rc_tex_ceil.png rc_tex_concrete.png rc_tex_floor.png rc_tex_panel.png rc_tex_rock.png`.

- [ ] **Step 5: Commit**

```bash
git add scripts/genRaycasterStress.ts scripts/genRaycasterTextures.ts demo-src/raycaster-p9-bench/assets
git commit -m "feat(raycaster): Phase 9 stress-scene generator + bench assets

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: `RcRender.primitiveCount()` accessor

A per-frame counter of every draw primitive (`drawRect` + `drawImageStrip`),
read by both the headless harness and the browser HUD. Independent of
`surfCountLast` (which stays — some tests read it).

**Files:**
- Modify: `demo-src/raycaster/lib/RcRender.bas`
- Test: `tests/lib/Basic4WebGL/integration/raycasterWindowOcclusion.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `tests/lib/Basic4WebGL/integration/raycasterWindowOcclusion.test.ts`:

```ts
  test('primitiveCount reports every drawRect + drawImageStrip of the last frame', () => {
    const rects: unknown[][] = [];
    const strips: unknown[][] = [];
    const r = makeRender({ ...openWorld, walltexat: () => 'w.png' }, rects, strips);
    r.setcamera(2, 2, 0, 0);
    r.renderframe();
    const rendered = rects.length + strips.length;
    // primitiveCount excludes the 2 background split rects drawn before the loop
    expect((r as unknown as { primitivecount(): number }).primitivecount()).toBe(rendered - 2);
  });
```

(`makeRender`'s `_sb.drawImageStrip` already pushes to `strips` — confirm the closure signature; if it only accepts `rects`, extend it to also capture `drawImageStrip` into a passed array, mirroring the existing `wallStrips` param.)

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run raycasterWindowOcclusion -t "primitiveCount"
```

Expected: FAIL — `primitivecount is not a function`.

- [ ] **Step 3: Add the field + accessor + bumps**

In `demo-src/raycaster/lib/RcRender.bas`:

Add after `dim surfCountLast` (line ~54):

```bas
dim primCount
```

In `Constructor`, after `self.surfCountLast = 0`:

```bas
    self.primCount = 0
```

In `renderFrame`, right after `self.surfCountLast = 0` (line ~602):

```bas
    self.primCount = 0
```

Add the accessor after `function surfaceCount()`:

```bas
' Total draw primitives (drawRect + drawImageStrip) issued during the last
' renderFrame(), excluding the 2 sky/ground background rects. Read by the Phase 9
' benchmark harness and the p9-bench HUD.
function primitiveCount()
    return self.primCount
endfunction
```

Bump `self.primCount = self.primCount + 1` at each primitive site:
- in `drawStrip`, just before `return 1`
- in `drawFlatSeg`, in both branches (after the `drawStrip` call add nothing — `drawStrip` already bumped; after the manual `drawing.drawRect` in the `packed >= 0` branch, add the bump)
- in `drawWallStrip`, just before `return 1`
- in `drawActors`, right after the `drawing.drawImageStrip(...)` billboard call

Do **not** bump for the 2 background `drawing.drawRect` calls at the top of
`renderFrame` (sky + ground) — the accessor's contract excludes them.

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run raycasterWindowOcclusion
```

Expected: PASS (all blocks).

- [ ] **Step 5: Sync + rebuild + full check**

```bash
for d in demo-src/raycaster-p3 demo-src/raycaster-p4 demo-src/raycaster-p5 demo-src/raycaster-p6 demo-src/raycaster-p7 demo-src/raycaster-p8-tiers; do [ -e "$d/RcRender.bas" ] && cp demo-src/raycaster/lib/RcRender.bas "$d/RcRender.bas"; done
for p in "raycaster-p3 RaycasterP3RoomView" "raycaster-p4 RaycasterP4Walk" "raycaster-p5 RaycasterP5Lit" "raycaster-p6 RaycasterP6Actors" "raycaster-p7 RaycasterP7Diagonals" "raycaster-p8-tiers RaycasterP8Tiers"; do npm run build:demo -- demo-src/$p; done
npx vitest run raycaster
npx vite build
```

Expected: all raycaster suites green (`raycasterDemoLibSync` byte-identity holds), build clean.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(raycaster): RcRender.primitiveCount() per-frame draw-primitive counter

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Headless CPU benchmark harness + baseline

**Files:**
- Create/rewrite: `tests/lib/Basic4WebGL/integration/raycasterBench.test.ts`
- Create: `demo-src/raycaster-p9-bench/RcConfig.bas` … `RcRender.bas` (8 lib copies — needed for the harness to transpile)

- [ ] **Step 1: Copy the library into the bench dir**

```bash
for f in demo-src/raycaster/lib/*.bas; do cp "$f" "demo-src/raycaster-p9-bench/$(basename "$f")"; done
ls demo-src/raycaster-p9-bench/*.bas
```

(The `BenchScene.bas` / `Main.bas` come in Task 4; the harness in this task
drives the lib classes directly and does not need a scene.)

- [ ] **Step 2: Write the harness**

Create `tests/lib/Basic4WebGL/integration/raycasterBench.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Phase 9 benchmark. Drives RcRender + RcActors + RcLights over a fixed camera
// path through a generated stress scene against a counting fake-PIXI surface.
// Prints a table (always) and asserts the per-frame primitive count stays under
// a checked-in ceiling (the regression guard — ratcheted down after rung 1).
//
// ms is PRINTED, not asserted (machine-dependent). Counts ARE asserted.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
const LIBDIR = 'demo-src/raycaster-p9-bench';
const ASSETS = `${LIBDIR}/assets`;

// Per-frame primitive-count ceilings. Set from the Task 3 baseline run, then
// LOWERED in Task 5 after rung 1. Keep generous headroom (x1.15) over observed.
const PRIM_CEIL: Record<number, number> = { 16: 99999, 32: 99999, 48: 99999 };

interface World {
  floorheightat(c: number, r: number): number;
  ceilheightat(c: number, r: number): number;
}

function transpileLib(): string {
  const names = ['RcConfig', 'RcWorld', 'RcCast', 'RcMover', 'RcLights', 'RcActor', 'RcActors', 'RcRender'];
  const raw = names.map((n) => ({ name: `${n}.bas`, source: readFileSync(`${LIBDIR}/${n}.bas`, 'utf-8') }));
  const { files, error } = sortByDependencies(raw);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics).toEqual([]);
  return String(result.code);
}

function makeModule(stm: { walls: number[][]; markers: unknown[] }, counters: Record<string, number>) {
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

  // tilemap
  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.hasLayer = (_h: unknown, n: string) => n === 'walls';
  _sb.tileWidth = () => tw;
  _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => stm.walls[0].length * tw;
  _sb.tileMapHeightPx = () => stm.walls.length * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) =>
    stm.walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => (stm.markers as Array<Record<string, unknown>>).map((m) => ({ ...m }));

  // stage
  _sb.getStageWidth = () => 640; // 160 columns at RC_STRIP_W 4 — realistic, keeps the harness quick
  _sb.getStageHeight = () => 400;

  // counting draw surface
  _sb.drawRect = () => {
    counters.drawRect++;
    return undefined;
  };
  _sb.drawImageStrip = () => {
    counters.drawImageStrip++;
    return undefined;
  };
  _sb.clear = () => undefined;

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
    `${transpileLib()}\n; return {
       RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset,
       RcRender: _sb_rcrender, RcActors: _sb_rcactors, RcLights: _sb_rclights,
     };`,
  );
  const mod = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  return mod as {
    RcWorld: new (tms: unknown, layer: string) => World;
    TileMapSet: new (name: string) => unknown;
    RcRender: new (w: unknown) => Record<string, (...a: unknown[]) => unknown>;
    RcActors: new (w: unknown) => Record<string, (...a: unknown[]) => unknown>;
    RcLights: new (w: unknown) => Record<string, (...a: unknown[]) => unknown>;
  };
}

function runSize(n: number) {
  const stmJson = JSON.parse(readFileSync(`${ASSETS}/stress${n}.stm`, 'utf-8'));
  const stm = { walls: stmJson.layers.walls as number[][], markers: stmJson.layers.tags.markers as unknown[] };
  const enemies = JSON.parse(readFileSync(`${ASSETS}/stress${n}.enemies.json`, 'utf-8')) as Array<{ x: number; y: number }>;
  const path = JSON.parse(readFileSync(`${ASSETS}/stressPath.json`, 'utf-8')) as Array<{ x: number; y: number; angle: number }>;
  const scale = n / 32;

  const counters = { drawRect: 0, drawImageStrip: 0 };
  const mod = makeModule(stm, counters);
  const world = new mod.RcWorld(new mod.TileMapSet(`stress${n}.stm`), 'walls');
  const ren = new mod.RcRender(world);
  const acts = new mod.RcActors(world);
  const lights = new mod.RcLights(world);
  ren.bindlights(lights);
  ren.bindactors(acts);
  for (const e of enemies) acts.add('rc_enemy.png', e.x * scale, e.y * scale, 0, 64, 64);
  const torch = lights.addpoint(2 * scale, 2 * scale, 0.5, 0.9, 6);
  lights.update();

  const frames: Array<{ ms: number; prim: number }> = [];
  const PASSES = 20;
  for (let pass = 0; pass < PASSES; pass++) {
    for (const w of path) {
      const x = w.x * scale;
      const y = w.y * scale;
      lights.movelight(torch, x, y);
      lights.update();
      ren.setcamera(x, y, w.angle, 0);
      counters.drawRect = 0;
      counters.drawImageStrip = 0;
      const t0 = performance.now();
      ren.renderframe();
      ren.drawactors();
      const ms = performance.now() - t0;
      if (pass > 0) frames.push({ ms, prim: counters.drawRect + counters.drawImageStrip });
    }
  }

  frames.sort((a, b) => a.ms - b.ms);
  const msMean = frames.reduce((s, f) => s + f.ms, 0) / frames.length;
  const p50 = frames[Math.floor(frames.length * 0.5)].ms;
  const p95 = frames[Math.floor(frames.length * 0.95)].ms;
  const worst = frames[frames.length - 1].ms;
  const primMean = frames.reduce((s, f) => s + f.prim, 0) / frames.length;
  const primMax = Math.max(...frames.map((f) => f.prim));
  return { n, frames: frames.length, msMean, p50, p95, worst, primMean, primMax };
}

describe('raycaster Phase 9 benchmark', () => {
  test('stress16/32/48 — print table, assert primitive ceilings', { timeout: 180_000 }, () => {
    const rows = [16, 32, 48].map(runSize);
    // eslint-disable-next-line no-console
    console.table(
      rows.map((r) => ({
        size: r.n,
        frames: r.frames,
        'ms.mean': +r.msMean.toFixed(3),
        'ms.p50': +r.p50.toFixed(3),
        'ms.p95': +r.p95.toFixed(3),
        'ms.worst': +r.worst.toFixed(3),
        'prim.mean': Math.round(r.primMean),
        'prim.max': r.primMax,
      })),
    );
    for (const r of rows) {
      expect(r.primMax, `stress${r.n} per-frame primitive max`).toBeLessThan(PRIM_CEIL[r.n]);
      expect(r.frames).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 3: Run it — capture the baseline**

```bash
npx vitest run raycasterBench 2>&1 | tee /tmp/rc-bench-baseline.txt
```

Expected: PASS (ceilings are `99999` placeholders). **Record the printed table** — this is the "before" data for the Phase 9 report (Task 6).

- [ ] **Step 4: Set the real ceilings**

Edit `PRIM_CEIL` in the test: for each size set the value to `Math.ceil(primMax * 1.15)` from the baseline run (e.g. if `stress32` `prim.max` was 1420, set `32: 1633`). Re-run — still PASS, now a real guard.

- [ ] **Step 5: Full suite + commit**

```bash
npx vitest run
npx vite build
git add tests/lib/Basic4WebGL/integration/raycasterBench.test.ts demo-src/raycaster-p9-bench/*.bas
git commit -m "test(raycaster): Phase 9 headless benchmark harness + baseline ceilings

Baseline (this machine): stress32 ~<primMax> prim/frame, ~<msMean>ms.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

(Fill the `<...>` in the commit body from the actual baseline table.)

---

## Task 4: `raycaster-p9-bench` browser demo

**Files:**
- Create: `demo-src/raycaster-p9-bench/Main.bas`, `demo-src/raycaster-p9-bench/BenchScene.bas`
- Create (build output): `src/docs/demos/RaycasterP9Bench.b4wgl.json`
- Modify: `src/features/demos/devDemoRegistry.ts`, `cypress/e2e/demos.cy.ts`, `tests/ui/features/demos/devDemoRegistry.test.ts`, `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts`

- [ ] **Step 1: `Main.bas`**

```bas
function oninit()
  world.setPixelPerfect(true)
endfunction

dim scn = new BenchScene()
scenemanager.register("bench", scn)
scenemanager.switch("bench")
```

- [ ] **Step 2: `BenchScene.bas`**

Model on `demo-src/raycaster-p8-tiers/TiersScene.bas` (same control rig,
`probe()` helper, HUD-every-30-frames pattern). Full scene:

```bas
Class
Extends scene

' Raycaster Phase 9 -- frame-cost bench. A generated stress scene (all Phase 8
' features + idle billboard enemies) with an on-screen frame-time / primitive
' readout. 1/2/3 swap stress size; P toggles the fixed-path autopilot. Frame
' time is the `delta` arg (softBASIC has no monotonic clock); path + enemy data
' come from the generated StressData class (no JSON parser in the language).

dim tm as tilemapset
dim wld as RcWorld
dim ren as RcRender
dim me as RcMover
dim lights as RcLights
dim acts as RcActors
dim sd as StressData
dim torch
dim hudA as Text
dim hudB as Text
dim frames
dim accum
dim minMs
dim maxMs
dim curSize
dim auto
dim autoIdx
dim enemyN

Constructor()
  input.bind("fwd", "key", keyboard.W)
  input.bind("back", "key", keyboard.S)
  input.bind("tl", "key", keyboard.A)
  input.bind("tr", "key", keyboard.D)
  input.bind("ql", "key", keyboard.Q)
  input.bind("er", "key", keyboard.E)
  input.bind("lu", "key", keyboard.R)
  input.bind("ld", "key", keyboard.F)
  input.bind("s1", "key", keyboard.DIGIT_1)
  input.bind("s2", "key", keyboard.DIGIT_2)
  input.bind("s3", "key", keyboard.DIGIT_3)
  input.bind("autop", "key", keyboard.P)
EndConstructor

function onenter()
  self.frames = 0
  self.accum = 0
  self.minMs = 9999
  self.maxMs = 0
  self.auto = 0
  self.autoIdx = 0
  self.sd = new StressData()
  self.loadSize(32)

  self.hudA = new Text("...", 12, 10)
  self.hudA.setStyle(14, 255, 220, 120)
  hud.add(self.hudA)
  self.hudB = new Text("WASD/QE/RF   1-2-3 size   P autopilot", 12, 28)
  self.hudB.setStyle(12, 180, 255, 180)
  hud.add(self.hudB)

  self.runProbes()
endfunction

function loadSize(n)
  dim i
  dim sc
  self.curSize = n
  sc = n / 32.0
  self.tm = new tilemapset("stress" + string.str(n) + ".stm")
  self.wld = new RcWorld(self.tm, "walls")
  self.ren = new RcRender(self.wld)
  self.me = new RcMover(self.wld, 2.5 * sc, 2.5 * sc, 0.3, 0.6)
  self.lights = new RcLights(self.wld)
  self.acts = new RcActors(self.wld)
  self.ren.bindLights(self.lights)
  self.ren.bindCamera(self.me)
  self.ren.bindActors(self.acts)
  self.ren.setWallTexture("rc_tex_concrete.png")
  self.torch = self.lights.addPoint(2.5 * sc, 2.5 * sc, 0.5, 0.9, RcConfig.RC_LIGHT_RANGE)
  self.enemyN = self.sd.enemyCount(n)
  for i = 0 to self.enemyN - 1
    self.acts.add("rc_enemy.png", self.sd.ex(n, i), self.sd.ey(n, i), 0.0, 64, 64)
  next i
  self.lights.update()
endfunction

function onupdate(delta)
  dim fwd
  dim strafe
  dim turnAxis
  dim lookAxis
  dim ms
  dim wpi

  if input.pressed("s1") then
    self.loadSize(16)
  endif
  if input.pressed("s2") then
    self.loadSize(32)
  endif
  if input.pressed("s3") then
    self.loadSize(48)
  endif
  if input.pressed("autop") then
    self.auto = 1 - self.auto
  endif

  if self.auto = 1 then
    wpi = self.autoIdx - math.floor(self.autoIdx / self.sd.pathCount()) * self.sd.pathCount()
    self.me.warpTo(self.sd.px(wpi) * (self.curSize / 32.0), self.sd.py(wpi) * (self.curSize / 32.0), self.sd.pa(wpi))
    self.autoIdx = self.autoIdx + 1
  else
    fwd = input.axis("back", "fwd")
    strafe = input.axis("tl", "tr")
    turnAxis = input.axis("ql", "er")
    lookAxis = input.axis("ld", "lu")
    self.me.move(fwd * RcConfig.RC_MOVE_SPEED, strafe * RcConfig.RC_MOVE_SPEED)
    if turnAxis <> 0 then
      self.me.turn(turnAxis * RcConfig.RC_TURN_SPEED * (delta / 1000.0))
    endif
    if lookAxis <> 0 then
      self.me.look(lookAxis * RcConfig.RC_LOOK_SPEED * (delta / 1000.0))
    endif
    self.me.step(delta)
  endif

  self.lights.moveLight(self.torch, self.me.x(), self.me.y())
  self.lights.update()

  ms = delta
  if ms < self.minMs then
    self.minMs = ms
  endif
  if ms > self.maxMs then
    self.maxMs = ms
  endif

  self.ren.renderFrame()

  self.frames = self.frames + 1
  self.accum = self.accum + delta
  if self.frames >= 30 then
    self.hudA.setText("avg " + string.str(math.floor(self.accum / self.frames)) + "ms   min " + string.str(math.floor(self.minMs)) + "   max " + string.str(math.floor(self.maxMs)) + "   |   " + string.str(self.ren.columnCount()) + " cols   " + string.str(self.ren.primitiveCount()) + " prim   " + string.str(self.enemyN) + " foes   stress" + string.str(self.curSize))
    self.frames = 0
    self.accum = 0
    self.minMs = 9999
    self.maxMs = 0
  endif
endfunction

function runProbes()
  dim ok2
  self.probe("stress32 loaded 32 wide", self.wld.widthCells(), 52)
  ok2 = 0
  if self.wld.floorHeightAt(4, 4) > 0.3 then
    if self.wld.floorHeightAt(5, 5) < 0 - 0.4 then
      ok2 = 1
    endif
  endif
  self.probe("stress motif: raised + pit cells", ok2, 72)
  self.probe("enemies seeded from StressData", self.acts.activeCount() = self.enemyN and self.enemyN > 4, 92)
  self.ren.renderFrame()
  self.probe("renderFrame ran, primitives drawn", self.ren.primitiveCount() > 0, 112)
  self.loadSize(16)
  self.probe("size swap rebuilt to 16 wide", self.wld.widthCells() = 16, 132)
  self.loadSize(32)
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

EndClass
```

Confirmed against the defs: `keyboard.DIGIT_1/2/3`, `input.pressed(action)`,
`input.axis(neg,pos)`, `input.bind` all present; `RcMover` fields are `px` `py`
`ang` `pit` `vz`; `RcActors.activeCount()` present.

- [ ] **Step 2a: Add `RcMover.warpTo` (needed by the autopilot)**

The reverted `RcMover` has no teleport. Add to `demo-src/raycaster/lib/RcMover.bas`,
after `function look(dPitch)`:

```bas
' Snap the body to (x, y) facing `angle`, clearing vertical velocity. Used by the
' Phase 9 bench autopilot to replay a fixed camera path; also handy for spawns.
function warpTo(x, y, angle)
    self.px = x
    self.py = y
    self.ang = angle
    self.vz = 0
endfunction
```

Add a unit assertion to `tests/lib/Basic4WebGL/integration/raycasterDemoSmoke.test.ts`
in the existing `RcMover ... step runs` block (or a new tiny block): after
constructing the mover, `m.warpto(4, 5, 1); expect(m.x()).toBe(4); expect(m.y()).toBe(5); expect(m.angle()).toBe(1);`.

Sync `RcMover.bas` to every phase dir that carries it (p3–p8-tiers, p9-bench) and
rebuild those exports — fold into this task's final sync/commit step.

- [ ] **Step 2b: Verify remaining calls**
- `RcActor.setFrame` is available but the scene above does **not** animate enemies
  (idle billboards, `setFrame(0)` implicit) — the billboard projection + per-column
  depth-clip is the cost being measured, not frame cycling. If you want a visible
  idle wobble, add a cheap `self.acts.actorAt(k).setFrame(...)` in `onupdate`
  guarded by a frame counter; not required.
- `probe()` uses the same undeclared-`missing` throw trick as every raycaster demo
  (Cypress "no ERR" guard) — keep verbatim.

- [ ] **Step 3: Build the export**

```bash
npm run build:demo -- demo-src/raycaster-p9-bench RaycasterP9Bench
```

- [ ] **Step 4: Wire it in**

- `src/features/demos/devDemoRegistry.ts` — append after `raycaster-p8-tiers`:
  ```ts
  {
    slug: 'raycaster-p9-bench',
    name: 'Raycaster P9 — Frame-Cost Bench',
    tags: ['Raycaster', 'Engine Phase'],
    description:
      'Phase 9 benchmark: a generated stress scene (all Phase 8 features + idle billboard enemies, 16/32/48 cells) with an on-screen frame-time + primitive-count readout and a fixed-path autopilot.',
    docsSlug: '',
    file: 'RaycasterP9Bench',
  },
  ```
- `cypress/e2e/demos.cy.ts` — after the `raycaster-p8-tiers` row:
  ```ts
  { slug: 'raycaster-p9-bench', title: 'Raycaster P9 — Frame-Cost Bench', waitMs: 4000 },
  ```
- `tests/ui/features/demos/devDemoRegistry.test.ts` — after the p8-tiers assertion:
  ```ts
    const p9 = devDemoRegistry.find((d) => d.slug === 'raycaster-p9-bench');
    expect(p9?.file).toBe('RaycasterP9Bench');
  ```
- `tests/lib/Basic4WebGL/integration/raycasterDemoProbes.test.ts` — after the p8-tiers case:
  ```ts
  test('P9-bench BenchScene.onenter runs runProbes and every probe passes', () => {
    runPhaseProbes({
      dir: 'demo-src/raycaster-p9-bench',
      stm: 'stress32.stm',
      sceneGlobal: '_sb_benchscene',
      probeCount: 5,
    });
  });
  ```

- [ ] **Step 5: Verify**

```bash
npx vitest run raycaster devDemoRegistry
npx vite build
```

Expected: all green — `raycasterDemoProbes` P9-bench 5/5, `raycasterDemoLibSync` (bench dir byte-identical), `raycasterDemoSmoke` + `raycasterDemoTranspile` pick up `raycaster-p9-bench`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(raycaster): raycaster-p9-bench frame-cost demo

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Rung 1 — painter's background floor/ceiling fill

**Files:**
- Modify: `demo-src/raycaster/lib/RcConfig.bas`
- Modify: `demo-src/raycaster/lib/RcRender.bas`
- Modify: `tests/lib/Basic4WebGL/integration/raycasterWindowOcclusion.test.ts`
- Modify: `tests/lib/Basic4WebGL/integration/raycasterBench.test.ts` (ratchet `PRIM_CEIL`)

- [ ] **Step 1: Config flag**

In `demo-src/raycaster/lib/RcConfig.bas`, add before `endconst`:

```bas
    RC_FLAT_FILL = 1
```

- [ ] **Step 2: Write the failing test**

Add to `raycasterWindowOcclusion.test.ts`:

```ts
  test('rung 1: a flat room draws a constant surface-rect count, not ~2 per column', () => {
    const rects: unknown[][] = [];
    const r = makeRender({ ...openWorld }, rects);
    r.setcamera(2, 2, 0, 0);
    r.renderframe();
    const surfaceRects = rects.filter((a) => (a as number[])[2] === (openWorld as { stripW?: number }).stripW ?? true);
    // 2 sky/ground + 2 background fills; NO per-column 4px-wide surface rects
    const perColumn = rects.filter((a) => (a as number[])[2] === 4);
    expect(perColumn.length).toBe(0);
    expect(rects.length).toBeLessThan(8); // a handful of full-width rects, not 100s
  });

  test('rung 1: a mid-view floor step still draws that column per-column', () => {
    const rects: unknown[][] = [];
    const stepWorld = { ...openWorld, floorheightat: (c: number) => (c >= 4 ? 0.4 : 0) };
    const r = makeRender(stepWorld, rects);
    r.setcamera(2, 2, 0, 0);
    r.renderframe();
    // the stepped columns produce their own 4px riser + pit/soffit rects
    expect(rects.filter((a) => (a as number[])[2] === 4).length).toBeGreaterThan(0);
  });

  test('rung 1: RC_FLAT_FILL=0 restores the pre-rung-1 per-column count', () => {
    // transpile a variant with RC_FLAT_FILL forced to 0
    const rects: unknown[][] = [];
    const r = makeRenderFlatFillOff({ ...openWorld }, rects); // helper: patches RcConfig source 'RC_FLAT_FILL = 1' -> '= 0' before transpile
    r.setcamera(2, 2, 0, 0);
    r.renderframe();
    expect(rects.filter((a) => (a as number[])[2] === 4).length).toBeGreaterThan(openWorld.widthcells() * 1);
  });
```

Add a `makeRenderFlatFillOff` variant of `makeRender` that does
`source.replace('RC_FLAT_FILL = 1', 'RC_FLAT_FILL = 0')` on `RcConfig.bas`
before `sortByDependencies`.

- [ ] **Step 3: Run — expect FAIL**

```bash
npx vitest run raycasterWindowOcclusion -t "rung 1"
```

Expected: FAIL — flat room still draws ~1 rect per column.

- [ ] **Step 4: Add the `drawFill` helper + band-clean helpers to `RcRender.bas`**

After `function drawStrip(...) ... endfunction`:

```bas
' Full-viewport-width flat fill for the painter's background floor/ceiling
' (rung 1). shadeKind 4 = floor top, 6 = ceiling under -- the only two the
' background ever uses.
function drawFill(yTop, yBot, shadeKind, lite)
    dim g
    dim rr
    dim gg
    dim bb
    if yBot <= yTop then
        return
    endif
    g = 105
    if shadeKind = 6 then
        g = 80
    endif
    rr = math.clamp(g * lite, 0, 255)
    gg = math.clamp(g * lite, 0, 255)
    bb = math.clamp((g + 25) * lite, 0, 255)
    pen.setLineWidth(0)
    pen.setFillColor(rr, gg, bb)
    drawing.drawRect(self.viewW / 2, (yTop + yBot) / 2, self.viewW, yBot - yTop)
    self.primCount = self.primCount + 1
endfunction

' 1 if no cell this column's floor band crosses between dNear and dFar carries an
' fcol: override -- lets the background fill cover the column. Only called when
' wld.hasSurfaceColor() = 1.
function floorBandClean(dNear, dFar, rayX, rayY)
    dim a
    dim b
    dim mx
    dim my
    dim guard
    a = dNear
    guard = 0
    while a < dFar - 0.0001 and guard < 128
        guard = guard + 1
        b = self.surfaceRunEnd(a, dFar, rayX, rayY)
        mx = self.camX + rayX * ((a + b) / 2)
        my = self.camY + rayY * ((a + b) / 2)
        if self.wld.floorColAt(math.floor(mx), math.floor(my)) >= 0 then
            return 0
        endif
        a = b
    endwhile
    return 1
endfunction

function ceilBandClean(dNear, dFar, rayX, rayY)
    dim a
    dim b
    dim mx
    dim my
    dim guard
    a = dNear
    guard = 0
    while a < dFar - 0.0001 and guard < 128
        guard = guard + 1
        b = self.surfaceRunEnd(a, dFar, rayX, rayY)
        mx = self.camX + rayX * ((a + b) / 2)
        my = self.camY + rayY * ((a + b) / 2)
        if self.wld.ceilColAt(math.floor(mx), math.floor(my)) >= 0 then
            return 0
        endif
        a = b
    endwhile
    return 1
endfunction
```

- [ ] **Step 5: Background fills + per-column skip in `renderFrame`**

In `renderFrame`, add locals `dim fillOn`, `dim fillLite`, `dim colStepped`.

After the existing sky/ground rects and after `camCol`/`camRow` are set,
before the `for col` loop:

```bas
    fillLite = 1.0
    if self.boundLights <> 0 then
        fillLite = self.boundLights.sampleCell(camCol, camRow)
    endif
    fillOn = 0
    if RcConfig.RC_FLAT_FILL = 1 then
        if self.wld.floorHeightAt(camCol, camRow) = 0 then
            if self.wld.ceilHeightAt(camCol, camRow) = RcConfig.RC_STD_CEIL then
                fillOn = 1
            endif
        endif
    endif
    if fillOn = 1 then
        self.drawFill(horizon, self.viewH, RcConfig.RC_SHADE_CEIL_UNDER - 2, fillLite)
        self.drawFill(0, horizon, RcConfig.RC_SHADE_CEIL_UNDER, fillLite)
    endif
```

(`RC_SHADE_CEIL_UNDER - 2` = `4` = `RC_SHADE_FLOOR_TOP`; using the arithmetic
keeps the two constants obviously paired. Or just pass `RcConfig.RC_SHADE_FLOOR_TOP`.)

Inside the `for col` loop, add `colStepped = 0` at the top (with the other
per-column resets). In the span `while` loop, in **both** the FLOORSTEP and
CEILSTEP branches, set `colStepped = 1` (first line of each branch).

Then wrap the pending-surface `drawSurface` calls so they are skipped for a
simple fill-covered column. At the WALL branch (currently two calls):

```bas
                if fillOn = 0 or colStepped = 1 then
                    self.drawSurface(destX, sfH, sfD, d, winTop, winBot, sfKind, sfLite, rayX, rayY)
                    self.drawSurface(destX, scH, scD, d, winTop, winBot, scKind, scLite, rayX, rayY)
                else
                    if self.wld.hasSurfaceColor() = 1 then
                        if self.floorBandClean(sfD, d, rayX, rayY) = 0 then
                            self.drawSurface(destX, sfH, sfD, d, winTop, winBot, sfKind, sfLite, rayX, rayY)
                        endif
                        if self.ceilBandClean(scD, d, rayX, rayY) = 0 then
                            self.drawSurface(destX, scH, scD, d, winTop, winBot, scKind, scLite, rayX, rayY)
                        endif
                    endif
                endif
```

At the FLOORSTEP branch's leading `self.drawSurface(destX, sfH, sfD, d, ...)`
(the surface *before* the step) and the CEILSTEP branch's leading
`self.drawSurface(destX, scH, scD, d, ...)`: guard each with
`if fillOn = 0 or colStepped = 1 or (self.wld.hasSurfaceColor() = 1 and self.floorBandClean(sfD, d, rayX, rayY) = 0) then` — but note `colStepped` was just
set to 1 at the top of this same branch, so the guard simplifies to: **draw it**
(a column that reached a FLOORSTEP is stepped, so its leading surface is not
fill-covered once you're past `sfD = 0` … except the very first FLOORSTEP's
leading surface *is* the standard floor from `sfD = 0`). Keep it correct and
simple: at the FLOORSTEP/CEILSTEP leading `drawSurface`, guard with

```bas
                    if fillOn = 0 or sfD <> 0 or sfH <> 0 or (self.wld.hasSurfaceColor() = 1 and self.floorBandClean(0, d, rayX, rayY) = 0) then
                        self.drawSurface(destX, sfH, sfD, d, winTop, winBot, sfKind, sfLite, rayX, rayY)
                    endif
```

i.e. skip only when it is the pristine standard floor from the camera (`sfD = 0`,
`sfH = 0`) and colour-clean — exactly what the background fill already covers.
Mirror for ceiling with `scD`, `scH <> RcConfig.RC_STD_CEIL`.

At the `hitWall = 0` final flush (after the `while`):

```bas
        if hitWall = 0 then
            if fillOn = 0 or colStepped = 1 then
                self.drawSurface(destX, sfH, sfD, RcConfig.RC_MAX_DIST, winTop, winBot, sfKind, sfLite, rayX, rayY)
                self.drawSurface(destX, scH, scD, RcConfig.RC_MAX_DIST, winTop, winBot, scKind, scLite, rayX, rayY)
            else
                if self.wld.hasSurfaceColor() = 1 then
                    if self.floorBandClean(0, RcConfig.RC_MAX_DIST, rayX, rayY) = 0 then
                        self.drawSurface(destX, sfH, sfD, RcConfig.RC_MAX_DIST, winTop, winBot, sfKind, sfLite, rayX, rayY)
                    endif
                    if self.ceilBandClean(0, RcConfig.RC_MAX_DIST, rayX, rayY) = 0 then
                        self.drawSurface(destX, scH, scD, RcConfig.RC_MAX_DIST, winTop, winBot, scKind, scLite, rayX, rayY)
                    endif
                endif
            endif
        endif
```

- [ ] **Step 6: Run the focused tests — expect PASS**

```bash
npx vitest run raycasterWindowOcclusion
```

Expected: all PASS including the three `rung 1` blocks.

- [ ] **Step 7: Sync + rebuild + raycaster suite**

```bash
for d in demo-src/raycaster-p1 demo-src/raycaster-p2 demo-src/raycaster-p3 demo-src/raycaster-p4 demo-src/raycaster-p5 demo-src/raycaster-p6 demo-src/raycaster-p7 demo-src/raycaster-p8-tiers demo-src/raycaster-p9-bench; do
  for f in RcConfig.bas RcRender.bas; do [ -e "$d/$f" ] && cp "demo-src/raycaster/lib/$f" "$d/$f"; done
done
for p in "raycaster-p1 RaycasterP1MapLoad" "raycaster-p2 RaycasterP2SpanCast" "raycaster-p3 RaycasterP3RoomView" "raycaster-p4 RaycasterP4Walk" "raycaster-p5 RaycasterP5Lit" "raycaster-p6 RaycasterP6Actors" "raycaster-p7 RaycasterP7Diagonals" "raycaster-p8-tiers RaycasterP8Tiers" "raycaster-p9-bench RaycasterP9Bench"; do npm run build:demo -- demo-src/$p; done
npx vitest run raycaster
```

Expected: green. `raycasterDemoSmoke`'s `renderFrame draws floor/pit surfaces` and `floor-rise occludes geometry` blocks still pass (stepped columns use the unchanged fallback). If a smoke assertion counted a specific `drawRect` total that the fill changed, update it to match the fill behaviour (document why in the commit).

- [ ] **Step 8: Re-run the benchmark — capture the "after" numbers + ratchet ceilings**

```bash
npx vitest run raycasterBench 2>&1 | tee /tmp/rc-bench-after.txt
```

**Record the printed table.** Then lower `PRIM_CEIL` in `raycasterBench.test.ts` to `Math.ceil(primMax * 1.15)` from this run. Re-run — PASS.

- [ ] **Step 9: Full suite + build + commit**

```bash
npx vitest run
npx vite build
git add -A
git commit -m "perf(raycaster): rung 1 — painter's background floor/ceiling fill

Flat columns no longer emit a per-column drawRect for floor/ceiling; two
full-width background fills cover them and the wall strips paint over.
Stepped and fcol:/ccol: columns keep the per-column drawSurface path.
Gated by RcConfig.RC_FLAT_FILL (=1) + a grounded standard-height camera.

Benchmark: stress32 <before>->\<after> prim/frame, <before>->\<after>ms.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Phase 9 report + size budget

**Files:**
- Create: `docs/raycaster-benchmark-report.md`
- Modify: `src/docs/guides/raycaster-library.md`, `docs/language/library-roadmap.md`

- [ ] **Step 1: Write the report**

Create `docs/raycaster-benchmark-report.md` with the four sections from spec §8:

```markdown
# Raycaster Phase 9 — benchmark report

_Reference machine: <name / CPU>. Headless numbers from `npx vitest run raycasterBench`
(160-column viewport, 20-pass fixed camera path). Browser numbers from
`raycaster-p9-bench` autopilot (P), rolling 30-frame average._

## 1. Before optimisation (single-window renderer, per-column surfaces)

| size | ms.mean | ms.p95 | prim/frame | spans/frame | sampleCell/f | sampleAt/f | browser fps |
|------|---------|--------|-----------|-------------|--------------|------------|-------------|
| 16   | …       | …      | …         | …           | …            | …          | …           |
| 32   | …       | …      | …         | …           | …            | …          | …           |
| 48   | …       | …      | …         | …           | …            | …          | …           |

## 2. After rung 1 (painter's background fill)

| size | ms.mean | ms.p95 | prim/frame | Δ prim | Δ ms | browser fps |
|------|---------|--------|-----------|--------|------|-------------|
| 16   | …       | …      | …         | −…%    | −…%  | …           |
| 32   | …       | …      | …         | −…%    | −…%  | …           |
| 48   | …       | …      | …         | −…%    | −…%  | …           |

## 3. Size budget

> A single fully-featured area up to roughly **N×N cells** with **~M idle
> billboard enemies** sustains 60fps with headroom; up to **~P×P** is playable;
> beyond that, split into separate scenes at a doorway or stair.

(Fill N/M/P from where stress32 / stress48 land after rung 1.)

## 4. Further optimisation & risk

| # | rung | still worth it? | est. extra headroom | risk |
|---|------|-----------------|---------------------|------|
| 2 | batched wall-strip `drawing.drawStrips` | <yes/no + evidence> | … | engine change, all `drawing` games |
| 3 | light-grid dirty-cell caching | … | … | staleness on fast lights |
| 4 | RC_STRIP_W / ray-count tuning | … | … | blockier walls |
| 5 | hoist span arrays to locals | … | … | transpiler blast radius |

**Recommendation:** <continue to rung 2 / close Phase 9 and proceed to Phase 10>.
```

Fill every `…` from `/tmp/rc-bench-baseline.txt` and `/tmp/rc-bench-after.txt`
and the user's browser readings. **Ask the user for the browser fps numbers per
size** (both before — from a stash of the pre-rung-1 build — and after) if not
already provided; the headless table can be filled from the harness output
directly.

- [ ] **Step 2: Size-budget sentence into the guide**

In `src/docs/guides/raycaster-library.md`, in the "Multi-tier levels" section,
after the existing scene-switch paragraph, add the §3 budget sentence (the
`> A single fully-featured area up to ...` block) and a link:
`See [the Phase 9 benchmark report](../../docs/raycaster-benchmark-report.md) for the measured numbers.`
(check the correct relative path from `src/docs/guides/` to `docs/`).

- [ ] **Step 3: Roadmap**

In `docs/language/library-roadmap.md`, update the Phase 9 clause: benchmark
harness + `raycaster-p9-bench` demo + rung 1 (painter's fill) shipped
(2026-09-04); link the report; note which backlog rungs (§7) remain open per the
report's recommendation. `Last updated` → 2026-09-04.

- [ ] **Step 4: Verify + commit**

```bash
npx vite build
git add -A
git commit -m "docs(raycaster): Phase 9 benchmark report + size budget

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Hand off**

Tell the user:
- the headless before/after table and the primitive-count reduction,
- ask them to run `raycaster-p9-bench` (autopilot `P`, cycle `1`/`2`/`3`) and
  report the rolling fps per size, plus a subjective check that the flat-fill
  floor/ceiling lighting (toggle `RC_FLAT_FILL` to compare) looks acceptable,
- ask them to run `cypress/e2e/demos.cy.ts` (`raycaster-p9-bench` ERR-free),
- with their fps numbers, finalise §2/§3/§4 of the report,
- then the Phase 9 continue-or-close decision (rung 2 vs Phase 10).

Do NOT bump the version or push — that waits on an explicit push request.

---

## Self-Review

**Spec coverage:**
- §3 generator → Task 1. §4 headless harness → Task 3. §5 browser demo +
  `primitiveCount()` → Tasks 2, 4. §6 rung 1 (painter's fill, `RC_FLAT_FILL`,
  colour coexistence, light trade-off, tests) → Task 5. §7 backlog → carried into
  the report template (Task 6 §4). §8 report → Task 6. §2 success bar → Task 5
  Step 8 + Task 6 (the browser fps check is the user hand-off). §9 testing →
  each task's verify steps. ✓
- §5 "new `RcRender.primitiveCount()` … same pattern as `surfCountLast`" → Task 2
  implements exactly that. ✓
- §6.2 "camera grounded on standard-height context" gate → Task 5 Step 5
  `fillOn` check (`floorHeightAt(camCol,camRow)=0` and `ceilHeightAt=RC_STD_CEIL`). ✓
- §6.4 "no `RcCast`/`RcMover` change; `RcWorld` only if `hasSurfaceColor` too
  coarse" → the plan uses the existing single `hasSurfaceColor()` + per-column
  `floorBandClean`/`ceilBandClean` (in `RcRender`), so **no `RcWorld` change**. ✓

**Placeholder scan:** the `…` cells in the Task 6 report template are the
deliverable's data, filled from the two captured `/tmp` files + user fps
readings — Task 6 Step 1 says so explicitly and names the sources. The
`PRIM_CEIL` `99999` in Task 3 is a deliberate first-pass value replaced in the
same task (Step 4) and again in Task 5 (Step 8). No "TBD"/"handle edge cases".
Task 4 Step 2 leaves `onupdate` / `runProbes` as prose+partial-code rather than
full verbatim `.bas` — acceptable because it is an explicit "model on
`TiersScene.bas`, verify every call against the def files" adaptation of an
existing committed file, and the 5 probes are fully specified.

**Type / name consistency:** `primitiveCount()` / `primCount` — Task 2 defines,
Tasks 3/4/5 read (`ren.primitivecount()` lower-cased in the transpiled JS
harness, `self.ren.primitiveCount()` in `.bas`). `RC_FLAT_FILL` — Task 5 Step 1
defines, Steps 5/2 reference, Task 6 Step 5 hand-off mentions the toggle.
`drawFill` / `floorBandClean` / `ceilBandClean` — Task 5 Step 4 defines, Step 5
calls with matching signatures. `fillOn` / `colStepped` / `fillLite` — declared
and used within Task 5 Step 5. `stressPath.json` / `stressN.enemies.json` /
`stressN.stm` — Task 1 writes, Tasks 3/4 read by the same names. `runSize` /
`makeModule` / `PRIM_CEIL` — internal to Task 3, consistent. ✓
