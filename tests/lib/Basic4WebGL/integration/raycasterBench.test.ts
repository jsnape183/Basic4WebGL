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
// Baseline (pre-optimisation) observed prim.max: 16=1620, 32=2030, 48=2159.
const PRIM_CEIL: Record<number, number> = { 16: 1863, 32: 2335, 48: 2483 };

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
