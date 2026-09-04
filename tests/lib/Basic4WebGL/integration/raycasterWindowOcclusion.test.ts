import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Focused guard for the single-window occlusion renderer (post upper-region
// descope). Drives RcRender.renderframe against a duck-typed world and captures
// drawRect calls to assert: a raised-floor column clamps the window (fewer /
// shorter far strips), a pit column still shows the wall beyond, and a
// multi-cell coloured floor run coalesces into one strip per colour boundary.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
const DIR = 'demo-src/raycaster-p3';

function transpileP3(): string {
  const names = readdirSync(DIR).filter((n) => n.endsWith('.bas')).sort();
  const raw = names.map((name) => ({ name, source: readFileSync(`${DIR}/${name}`, 'utf-8') }));
  const { files, error } = sortByDependencies(raw);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics).toEqual([]);
  return String(result.code);
}

interface RcRenderLike {
  setcamera(x: number, y: number, angle: number, pitch: number): void;
  renderframe(): void;
  columncount(): number;
}

function makeRender(
  world: Record<string, unknown>,
  rects: unknown[][],
  wallStrips: unknown[][] = [],
): RcRenderLike {
  const code = transpileP3();
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
  _sb.getStageWidth = () => 320;
  _sb.getStageHeight = () => 200;
  _sb.drawRect = (...a: unknown[]) => {
    rects.push(a);
    return undefined;
  };
  _sb.drawImageStrip = (...a: unknown[]) => {
    wallStrips.push(a);
    return undefined;
  };
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
    `${code}\n; return { RcRender: _sb_rcrender };`,
  );
  const { RcRender } = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  return new RcRender(world) as RcRenderLike;
}

const openWorld = {
  floorheightat: () => 0,
  ceilheightat: () => 1,
  wallat: (c: number) => (c <= 0 || c >= 8 ? 1 : 0),
  diagat: () => 0,
  walltexat: () => '',
  floortexat: () => '',
  ceiltexat: () => '',
  hassurfacecolor: () => 0,
  floorcolat: () => -1,
  ceilcolat: () => -1,
  widthcells: () => 8,
  heightcells: () => 4,
  lightat: () => 0,
};

describe('RcRender single-window occlusion', () => {
  test('renderframe runs and draws strips against an open world', () => {
    const rects: unknown[][] = [];
    const r = makeRender({ ...openWorld }, rects);
    r.setcamera(2, 2, 0, 0);
    r.renderframe();
    // one bg fill + one horizon fill + per-column surface/wall strips
    expect(rects.length).toBeGreaterThan(openWorld.widthcells() * 2);
  });

  // The heart of the single-window model: a floor RISE clamps winBot, hiding the
  // wall behind it; a floor DROP (pit) leaves the window open so the same wall
  // still paints. Counted via textured wall blits (one drawImageStrip per column).
  test('a floor rise occludes the wall behind it; a pit does not', () => {
    const wallTexWorld = { ...openWorld, walltexat: () => 'wall.png' };

    const run = (world: Record<string, unknown>) => {
      const strips: unknown[][] = [];
      const r = makeRender(world, [], strips);
      r.setcamera(2, 2, 0, 0);
      r.renderframe();
      return strips.length;
    };

    const flat = run({ ...wallTexWorld });
    // a chest-high floor rise at col >= 4, between the camera and the far wall
    const rise = run({ ...wallTexWorld, floorheightat: (c: number) => (c >= 4 ? 0.9 : 0) });
    // a pit at col >= 4 -- a DOWN step must NOT clamp the window
    const pit = run({ ...wallTexWorld, floorheightat: (c: number) => (c >= 4 ? -0.5 : 0) });

    expect(flat).toBeGreaterThan(0);
    expect(rise).toBeLessThan(flat); // the rise ate the window
    expect(pit).toBe(flat); // the pit left it open
  });

  test('a coloured multi-cell floor run coalesces to one strip per colour boundary', () => {
    const rects: unknown[][] = [];
    const colWorld = {
      ...openWorld,
      hassurfacecolor: () => 1,
      // cols 1-3 one colour, 4-6 another, rest none
      floorcolat: (c: number) => {
        if (c >= 1 && c <= 3) return 0x804020;
        if (c >= 4 && c <= 6) return 0x204080;
        return -1;
      },
      ceilcolat: () => -1,
    };
    const r = makeRender(colWorld, rects);
    r.setcamera(1.5, 2, 0, 0); // look straight down +x across the colour bands
    r.renderframe();
    const strips = (r: unknown[][]) => r.filter((a) => (a as number[])[2] === 4).length;
    const coalesced = strips(rects);

    // Control: the same march with a DIFFERENT colour in every cell cannot
    // coalesce, so it must paint strictly more strips.
    const perCellRects: unknown[][] = [];
    const perCell = makeRender(
      { ...openWorld, hassurfacecolor: () => 1, floorcolat: (c: number) => 0x100000 * (c + 1), ceilcolat: () => -1 },
      perCellRects,
    );
    perCell.setcamera(1.5, 2, 0, 0);
    perCell.renderframe();

    expect(coalesced).toBeGreaterThan(0);
    expect(coalesced).toBeLessThan(strips(perCellRects));
  });

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
});
