import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
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

// Per-frame primitive-count guards. Re-baselined after the measurement-bug fixes
// (all enemies now spawn on open floor; harness no longer double-draws actors).
// Post-rung-1 observed (RC_FLAT_FILL = 1): see docs/raycaster-benchmark-report.md.
//   prim.max:  16=1478  32=1888  48=1936
//   prim.mean: 16=752   32=1099  48=1173
// CEIL = ceil(max * 1.15); FLOOR = floor(mean * 0.7).
//
// Re-baselined again when RcRender.drawFlatSeg gained light-gradient subdivision
// (RC_SURF_LIGHT_STEP / RC_SURF_SEG_MAX). Shading a whole floor/ceiling band from
// one light sample was the "black hallway" bug -- a band spanning a big gradient
// has to be split, and splitting costs primitives. Deliberate trade, measured at
// RC_SURF_LIGHT_STEP = 0.12 / RC_SURF_SEG_MAX = 6:
//   prim.max:  16=2093  32=2655  48=2638   (1.4x the single-sample renderer)
//   prim.mean: 16=1074  32=1563  48=1621
//   ms.mean:   16=0.51  32=0.66  48=0.94   (was 0.44 / 0.57 / 0.82)
// Same CEIL = ceil(max * 1.15) rule; FLOOR left at the old values (still a valid
// "the surface pass actually ran" floor, and subdivision only ever adds).
//
// Re-baselined once more when those sub-bands moved onto a frame-global screen-Y
// lattice (see RcRender.drawFlatSeg). Placing them per band made every
// fcol:/ccol: colour-run edge a light step, which rendered as a hard diagonal
// "shadow" along a floor colour boundary; a shared lattice removes that, at the
// cost of a band no longer being able to choose its own (sometimes coarser)
// subdivision:
//   prim.max:  16=2717  32=3471  48=3189   (+25% worst frame)
//   prim.mean: 16=1188  32=1728  48=1701   (+9% mean)
//   ms.mean:   16=0.47  32=0.62  48=0.80   (no regression -- the extra strips are
//                                           small and the sample count is flat)
const PRIM_CEIL: Record<number, number> = { 16: 3125, 32: 3992, 48: 3668 };
const PRIM_FLOOR: Record<number, number> = { 16: 526, 32: 769, 48: 821 };

interface World {
  floorheightat(c: number, r: number): number;
  ceilheightat(c: number, r: number): number;
}

function transpileLib(): string {
  // Rc* modules ship in the softRaycaster package (lib).
  const result = compiler.transpile({ lib, files: [] });
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

  const counters = { drawRect: 0, drawImageStrip: 0, sampleCell: 0, sampleAt: 0 };
  const mod = makeModule(stm, counters);
  const world = new mod.RcWorld(new mod.TileMapSet(`stress${n}.stm`), 'walls');
  const ren = new mod.RcRender(world);
  const acts = new mod.RcActors(world);
  const lights = new mod.RcLights(world);
  // Count RcLights sample calls per frame (decision inputs for backlog rung 3).
  const _sc = (lights.samplecell as (...a: unknown[]) => unknown).bind(lights);
  lights.samplecell = (...a: unknown[]) => {
    counters.sampleCell++;
    return _sc(...a);
  };
  const _sa = (lights.sampleat as (...a: unknown[]) => unknown).bind(lights);
  lights.sampleat = (...a: unknown[]) => {
    counters.sampleAt++;
    return _sa(...a);
  };
  ren.bindlights(lights);
  ren.bindactors(acts);
  for (const e of enemies) acts.add('rc_enemy.png', e.x * scale, e.y * scale, 0, 64, 64);
  const torch = lights.addpoint(2 * scale, 2 * scale, 0.5, 0.9, 6);
  lights.update();

  const frames: Array<{ ms: number; prim: number; sampleCell: number; sampleAt: number }> = [];
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
      counters.sampleCell = 0;
      counters.sampleAt = 0;
      const t0 = performance.now();
      // renderFrame() ends with self.drawActors() (bound at construction) — no
      // explicit drawactors() call here, that would double-count billboards.
      ren.renderframe();
      const ms = performance.now() - t0;
      if (pass > 0)
        frames.push({
          ms,
          prim: counters.drawRect + counters.drawImageStrip,
          sampleCell: counters.sampleCell,
          sampleAt: counters.sampleAt,
        });
    }
  }

  frames.sort((a, b) => a.ms - b.ms);
  const msMean = frames.reduce((s, f) => s + f.ms, 0) / frames.length;
  const p50 = frames[Math.floor(frames.length * 0.5)].ms;
  const p95 = frames[Math.floor(frames.length * 0.95)].ms;
  const worst = frames[frames.length - 1].ms;
  const primMean = frames.reduce((s, f) => s + f.prim, 0) / frames.length;
  const primMax = Math.max(...frames.map((f) => f.prim));
  const sampleCellMean = frames.reduce((s, f) => s + f.sampleCell, 0) / frames.length;
  const sampleAtMean = frames.reduce((s, f) => s + f.sampleAt, 0) / frames.length;
  return { n, frames: frames.length, msMean, p50, p95, worst, primMean, primMax, sampleCellMean, sampleAtMean };
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
        'sampleCell/f': Math.round(r.sampleCellMean),
        'sampleAt/f': Math.round(r.sampleAtMean),
      })),
    );
    for (const r of rows) {
      expect(r.primMax, `stress${r.n} per-frame primitive max`).toBeLessThan(PRIM_CEIL[r.n]);
      expect(r.primMean, `stress${r.n} per-frame primitive mean floor`).toBeGreaterThan(PRIM_FLOOR[r.n]);
      expect(r.frames).toBeGreaterThan(0);
    }
    // Primitive count still has to grow with scene size out of the smallest map.
    //
    // 32 vs 48 is deliberately NOT ordered any more. runSize scales the world and
    // the camera path by n/32 but leaves the torch at a fixed 6-cell radius, so a
    // bigger map shows a SMALLER lit fraction of the screen -- and since
    // drawFlatSeg now coalesces adjacent light-lattice cells that sample the same
    // level, the flat-ambient far field beyond the torch collapses to one strip.
    // Surface primitives therefore track lit screen area, not cell count, and
    // stress48 legitimately lands just under stress32 (1701 vs 1728). prim.max
    // was already non-monotonic across these two before that change (2655/2638).
    expect(rows[1].primMean, 'stress32 prim.mean > stress16').toBeGreaterThan(rows[0].primMean);
    expect(rows[2].primMean, 'stress48 prim.mean > stress16').toBeGreaterThan(rows[0].primMean);
  });
});
