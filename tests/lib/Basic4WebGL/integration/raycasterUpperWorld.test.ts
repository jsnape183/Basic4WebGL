import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Focused guard for RcWorld's Phase 8 upper-region layer read + accessors.
// RcWorld is built from a tilemapset, not a duck world, so it can't ride the
// raycasterDemoSmoke duck-world harness — this test stubs `_sb` with two inline
// tile grids (`walls` + `upper`) plus markers (same shape as raycasterDiagWorld)
// and drives upperKindAt / hasUpperAt / upperFloorAt / upperCeilAt directly.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

const CANON = 'demo-src/raycaster/lib';
const files = ['RcConfig.bas', 'RcWorld.bas'].map((name) => ({
  name,
  source: readFileSync(`${CANON}/${name}`, 'utf-8'),
}));

function buildWorld(
  walls: number[][],
  upper: number[][],
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
  _sb.hasLayer = (_h: unknown, n: string) => n === 'walls' || n === 'upper';
  _sb.tileWidth = () => tw;
  _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => walls[0].length * tw;
  _sb.tileMapHeightPx = () => walls.length * tw;
  _sb.tileAt = (h: unknown, px: number, py: number) => {
    const grid = h === 'LAYER:upper' ? upper : walls;
    return grid[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  };
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
  return new RcWorld(new TileMapSet('upper.stm'), 'walls') as {
    upperkindat(c: number, r: number): number;
    hasupperat(c: number, r: number): number;
    upperfloorat(c: number, r: number): number;
    upperceilat(c: number, r: number): number;
    ceilheightat(c: number, r: number): number;
  };
}

describe('RcWorld upper-region layer read', () => {
  const walls = [
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
  ];
  const upper = [
    [0, 0, 0, 0],
    [0, 1, 3, 0],
    [0, 2, 1, 0],
    [0, 0, 0, 0],
  ];
  const markers = [
    { row: 1, col: 1, tag: 'ceil:1.5' },
    { row: 1, col: 2, tag: 'uceil:2.6' },
  ];

  test('upperKindAt reports the painted tile id, 0 off-layer and out of bounds', () => {
    const w = buildWorld(walls, upper, markers);
    expect(w.upperkindat(1, 1)).toBe(1);
    expect(w.upperkindat(2, 1)).toBe(3);
    expect(w.upperkindat(1, 2)).toBe(2);
    expect(w.upperkindat(2, 2)).toBe(1);
    expect(w.upperkindat(0, 0)).toBe(0);
    expect(w.upperkindat(9, 9)).toBe(0);
  });

  test('hasUpperAt is upperKindAt > 0', () => {
    const w = buildWorld(walls, upper, markers);
    expect(w.hasupperat(1, 1)).toBe(1);
    expect(w.hasupperat(0, 0)).toBe(0);
  });

  test('upperFloorAt is the host cell ceiling; upperCeilAt honours uceil: then falls back to ceilH + RC_STD_CEIL', () => {
    const w = buildWorld(walls, upper, markers);
    expect(w.upperfloorat(1, 1)).toBe(1.5);
    expect(w.ceilheightat(1, 1)).toBe(1.5);
    expect(w.upperceilat(2, 1)).toBe(2.6);
    expect(w.upperceilat(1, 1)).toBe(w.ceilheightat(1, 1) + 1.0);
  });
});
