import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Focused guard for RcLights.sampleAt() -- bilinear light at a world point.
// Builds a real RcLights from an inline tilemap stub (same shape as
// raycasterDiagWorld) with two `light:` markers a few cells apart, so staticArr
// carries a real spatial gradient. sampleAt must reproduce sampleCell at a cell
// centre, interpolate strictly between two neighbouring cells at their midpoint,
// and degrade to ambient out of bounds (via sampleCell's OOB clamp).

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

const CANON = 'demo-src/raycaster/lib';
const files = ['RcConfig.bas', 'RcWorld.bas', 'RcCast.bas', 'RcLights.bas'].map((name) => ({
  name,
  source: readFileSync(`${CANON}/${name}`, 'utf-8'),
}));

interface RcLightsLike {
  samplecell(col: number, row: number): number;
  sampleat(x: number, y: number): number;
}

function buildLights(
  walls: number[][],
  markers: Array<{ row: number; col: number; tag: string }>,
): RcLightsLike {
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
    `${result.code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcLights: _sb_rclights };`,
  );
  const { RcWorld, TileMapSet, RcLights } = factory(
    _sb,
    _createArray,
    ...Object.values(helpers),
    { log() {} },
  );
  deferred.forEach((cb) => cb());
  const world = new RcWorld(new TileMapSet('lighttest.stm'), 'walls');
  return new RcLights(world) as RcLightsLike;
}

describe('RcLights.sampleAt bilinear light', () => {
  // 12x5 bordered room; two `light:` markers on row 2, at col 2 and col 9.
  const walls = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];
  const markers = [
    { row: 2, col: 2, tag: 'light' },
    { row: 2, col: 9, tag: 'light' },
  ];

  test('sampling at a cell centre reproduces the per-cell value', () => {
    const L = buildLights(walls, markers);
    for (const [c, r] of [
      [5, 2],
      [4, 3],
      [7, 1],
    ] as const) {
      expect(L.sampleat(c + 0.5, r + 0.5)).toBeCloseTo(L.samplecell(c, r), 2);
    }
  });

  test('a point between two cells interpolates strictly between them', () => {
    const L = buildLights(walls, markers);
    // col 2 sits on a light marker (bright, clamps near 1); col 3 is dimmer.
    const brite = L.samplecell(2, 2);
    const dark = L.samplecell(3, 2);
    expect(brite).toBeGreaterThan(dark + 0.02); // genuinely different

    const mid = L.sampleat(3.0, 2.5); // midpoint of the two cell centres
    const lo = Math.min(brite, dark);
    const hi = Math.max(brite, dark);
    expect(mid).toBeGreaterThan(lo);
    expect(mid).toBeLessThan(hi);
    expect(mid).toBeCloseTo((brite + dark) / 2, 2);
  });

  test('out of bounds degrades to the ambient value', () => {
    const L = buildLights(walls, markers);
    const ambient = L.samplecell(-1, -1); // sampleCell returns ambient for OOB
    expect(L.sampleat(-5, -5)).toBeCloseTo(ambient, 6);
  });
});
