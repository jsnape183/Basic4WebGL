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
    `${result.code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset };`,
  );
  const { RcWorld, TileMapSet } = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  return new RcWorld(new TileMapSet('p7test.stm'), 'walls') as {
    diagat(c: number, r: number): number;
    lightat(c: number, r: number): number;
  };
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
