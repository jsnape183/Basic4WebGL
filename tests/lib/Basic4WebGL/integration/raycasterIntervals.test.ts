import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Focused unit test for RcRender's interval-list occlusion primitives
// (renderer rework, design spec §1): resetIntervals / occlude / drawInto /
// intervalCount / dropThinnest. These are plain public functions callable
// directly against a transpiled RcRender -- renderFrame is NOT involved (that
// wiring is Task 3).

const DEMO_DIR = 'demo-src/raycaster-p8';
const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

function transpileDemo(dir: string): string {
  const names = readdirSync(dir)
    .filter((n) => n.endsWith('.bas'))
    .sort();
  const raw = names.map((name) => ({ name, source: readFileSync(`${dir}/${name}`, 'utf-8') }));
  const { files, error } = sortByDependencies(raw);
  expect(error, `${dir} dependency sort`).toBeUndefined();
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics, `${dir} diagnostics`).toEqual([]);
  return String(result.code);
}

function makeSbStub(overrides: Record<string, unknown> = {}) {
  const cache = new Map<string, unknown>();
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop: string) {
      if (prop === Symbol.toPrimitive || prop === 'then') return undefined;
      if (prop in target) return target[prop];
      if (!cache.has(prop)) {
        const fn = (..._a: unknown[]) => stub;
        cache.set(prop, new Proxy(fn as never, handler));
      }
      return cache.get(prop);
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
    apply() {
      return stub;
    },
  };
  const stub = new Proxy(function () {} as never, handler) as Record<string, unknown> &
    ((...a: unknown[]) => unknown);
  Object.assign(stub, overrides);
  return stub;
}

function evalDemo(code: string, sbOverrides: Record<string, unknown> = {}) {
  const _sb = makeSbStub(sbOverrides);
  const deferred: Array<() => void> = [];
  (_sb as Record<string, unknown>)._deferModuleBody = (cb: () => void) => deferred.push(cb);

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
    `${code}\n; return { RcRender: typeof _sb_rcrender !== 'undefined' ? _sb_rcrender : null };`,
  );
  const mod = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  return mod as { RcRender: (new (w: unknown) => RcRenderLike) | null };
}

interface RcRenderLike {
  setcamera(x: number, y: number, angle: number, pitch: number): void;
  resetintervals(): void;
  occlude(t: number, b: number): void;
  drawinto(t: number, b: number, shade: number, lite: number): number;
  intervalcount(): number;
}

const stubWorld = {
  floorheightat: () => 0,
  ceilheightat: () => 1,
  wallat: (c: number) => (c <= 0 || c >= 6 ? 1 : 0),
  diagat: () => 0,
  upperkindat: () => 0,
  upperfloorat: () => 1,
  upperceilat: () => 2,
  walltexat: () => '',
  floortexat: () => '',
  ceiltexat: () => '',
  widthcells: () => 8,
  heightcells: () => 4,
  lightat: () => 0,
};

describe('RcRender interval-list occlusion primitives', () => {
  const strips: number[][] = [];
  const overrides = {
    getStageWidth: () => 320,
    getStageHeight: () => 200,
    drawRect: (...a: unknown[]) => {
      strips.push(a as number[]);
      return undefined;
    },
  };

  function newRender() {
    const mod = evalDemo(transpileDemo(DEMO_DIR), overrides);
    expect(mod.RcRender).not.toBeNull();
    const r = new (mod.RcRender as new (w: unknown) => RcRenderLike)(stubWorld);
    r.setcamera(2, 2, 0, 0);
    return r;
  }

  // The interval primitives expose no boundary accessor, so read the actual
  // visible [top, bot] pairs back through drawInto + the drawRect spy: drawStrip
  // paints drawRect(iDestX, (t+b)/2, RC_STRIP_W, b-t) for each visible interval
  // when the surface strip [0, viewH] is drawn into it (no clipping happens, so
  // the painted band IS the interval). midY ± height/2 recovers [top, bot].
  const VIEW_H = 200;
  function readIntervals(r: RcRenderLike): Array<{ top: number; bot: number }> {
    strips.length = 0;
    r.drawinto(0, VIEW_H, 0, 1.0);
    return strips
      .filter((a) => a[2] === 4) // RC_STRIP_W strips only
      .map((a) => {
        const midY = a[1] as number;
        const h = a[3] as number;
        return { top: midY - h / 2, bot: midY + h / 2 };
      })
      .sort((p, q) => p.top - q.top);
  }

  function expectIntervals(
    got: Array<{ top: number; bot: number }>,
    want: Array<[number, number]>,
  ) {
    expect(got.length).toBe(want.length);
    want.forEach(([t, b], i) => {
      expect(Math.abs(got[i].top - t)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(got[i].bot - b)).toBeLessThanOrEqual(0.5);
    });
  }

  test('interval boundaries: mid-band split is exact', () => {
    const r = newRender();
    r.resetintervals();
    expectIntervals(readIntervals(r), [[0, 200]]);
    r.occlude(80, 120);
    expect(r.intervalcount()).toBe(2);
    expectIntervals(readIntervals(r), [
      [0, 80],
      [120, 200],
    ]);
  });

  test('interval boundaries: a spanning occlude trims both bands', () => {
    const r = newRender();
    r.resetintervals();
    r.occlude(80, 120); // -> [0,80] [120,200]
    r.occlude(60, 140); // spans the gap -> [0,60] [140,200]
    expect(r.intervalcount()).toBe(2);
    expectIntervals(readIntervals(r), [
      [0, 60],
      [140, 200],
    ]);
  });

  test('interval boundaries: top-shrink keeps the far remnant, not the near one', () => {
    const r = newRender();
    r.resetintervals();
    r.occlude(80, 120); // -> [0,80] [120,200]
    r.occlude(0, 40); // shrink [0,80] from the top -> [40,80], NOT [0,40]
    expect(r.intervalcount()).toBe(2);
    expectIntervals(readIntervals(r), [
      [40, 80],
      [120, 200],
    ]);
  });

  test('resetIntervals gives one full-height interval', () => {
    const r = newRender();
    r.resetintervals();
    expect(r.intervalcount()).toBe(1);
  });

  test('occlude a middle band splits one interval into two', () => {
    const r = newRender();
    r.resetintervals();
    r.occlude(80, 120);
    expect(r.intervalcount()).toBe(2); // [0,80] and [120,200]
  });

  test('occlude the top of an interval shrinks it, no new interval', () => {
    const r = newRender();
    r.resetintervals();
    r.occlude(80, 120);
    r.occlude(0, 40);
    expect(r.intervalcount()).toBe(2); // [40,80] and [120,200]
  });

  test('occlude spanning the gap trims both intervals', () => {
    const r = newRender();
    r.resetintervals();
    r.occlude(80, 120);
    r.occlude(0, 40);
    r.occlude(60, 140);
    expect(r.intervalcount()).toBe(2); // [40,60] and [140,200]
  });

  test('occlude covering an interval entirely drops it', () => {
    const r = newRender();
    r.resetintervals();
    r.occlude(80, 120);
    r.occlude(0, 40);
    r.occlude(60, 140);
    r.occlude(0, 70);
    expect(r.intervalcount()).toBe(1); // [140,200]
  });

  test('occlude with bot <= top is a no-op', () => {
    const r = newRender();
    r.resetintervals();
    r.occlude(100, 100);
    r.occlude(120, 80);
    expect(r.intervalcount()).toBe(1);
  });

  test('over-splitting past the cap drops the thinnest intervals', () => {
    const r = newRender();
    r.resetintervals();
    r.occlude(10, 12);
    r.occlude(20, 22);
    r.occlude(30, 32);
    r.occlude(40, 42);
    r.occlude(50, 52);
    r.occlude(60, 62); // 7 intervals momentarily -> capped at 6
    expect(r.intervalcount()).toBeLessThanOrEqual(6);
    // the wide tail interval [62,200] survives; a thin 2px sliver was dropped
    expect(r.intervalcount()).toBe(6);
  });

  test('drawInto paints one strip per visible interval', () => {
    const r = newRender();
    r.resetintervals();
    r.occlude(90, 110);
    strips.length = 0;
    const painted = r.drawinto(0, 200, 4, 1.0);
    expect(painted).toBe(2);
    expect(strips.filter((a) => a[2] === 4).length).toBe(2); // RC_STRIP_W strips
  });

  test('drawInto returns 0 when nothing is visible', () => {
    const r = newRender();
    r.resetintervals();
    r.occlude(0, 200); // covers the whole column
    strips.length = 0;
    const painted = r.drawinto(0, 200, 4, 1.0);
    expect(painted).toBe(0);
    expect(r.intervalcount()).toBe(0);
  });
});
