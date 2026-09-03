import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Focused guard for RcWorld's per-tile flat floor/ceiling colour tags
// (`fcol:RRGGBB` / `ccol:RRGGBB`). Same inline-tilemap harness as
// raycasterUpperWorld; drives parseHex / floorColAt / ceilColAt /
// hasSurfaceColor directly. The renderer's per-cell march that consumes these
// is exercised by raycasterDemoSmoke's execute pass over raycaster-p8b.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
const CANON = 'demo-src/raycaster/lib';
const files = ['RcConfig.bas', 'RcWorld.bas'].map((name) => ({
  name,
  source: readFileSync(`${CANON}/${name}`, 'utf-8'),
}));

function buildWorld(
  walls: number[][],
  markers: Array<{ row: number; col: number; tag: string }>,
) {
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
  _sb.hasLayer = (_h: unknown, n: string) => n === 'walls';
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
    `${result.code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset };`,
  );
  const { RcWorld, TileMapSet } = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  return new RcWorld(new TileMapSet('c.stm'), 'walls') as {
    hassurfacecolor(): number;
    floorcolat(c: number, r: number): number;
    ceilcolat(c: number, r: number): number;
  };
}

const walls = [
  [1, 1, 1, 1],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 1, 1, 1],
];

const pack = (r: number, g: number, b: number) => r * 65536 + g * 256 + b;

describe('RcWorld per-tile floor/ceiling colour tags', () => {
  test('fcol:/ccol: parse 6 hex digits to a packed RGB int', () => {
    const w = buildWorld(walls, [
      { row: 1, col: 1, tag: 'fcol:7a4f2a' },
      { row: 2, col: 2, tag: 'ccol:35608a' },
    ]);
    expect(w.floorcolat(1, 1)).toBe(pack(0x7a, 0x4f, 0x2a));
    expect(w.ceilcolat(2, 2)).toBe(pack(0x35, 0x60, 0x8a));
  });

  test('a cell with both tags carries an independent floor and ceiling colour', () => {
    const w = buildWorld(walls, [{ row: 1, col: 2, tag: 'fcol:ff0000 ccol:0000ff' }]);
    expect(w.floorcolat(2, 1)).toBe(pack(255, 0, 0));
    expect(w.ceilcolat(2, 1)).toBe(pack(0, 0, 255));
  });

  test('untagged cells and out-of-bounds read -1', () => {
    const w = buildWorld(walls, [{ row: 1, col: 1, tag: 'fcol:abcdef' }]);
    expect(w.floorcolat(2, 2)).toBe(-1);
    expect(w.ceilcolat(1, 1)).toBe(-1);
    expect(w.floorcolat(-1, 0)).toBe(-1);
    expect(w.floorcolat(99, 99)).toBe(-1);
  });

  test('hasSurfaceColor is 0 until a cell carries fcol:/ccol:, then 1', () => {
    expect(buildWorld(walls, []).hassurfacecolor()).toBe(0);
    expect(buildWorld(walls, [{ row: 2, col: 1, tag: 'diag:nw' }]).hassurfacecolor()).toBe(0);
    expect(buildWorld(walls, [{ row: 1, col: 1, tag: 'fcol:112233' }]).hassurfacecolor()).toBe(1);
  });
});
