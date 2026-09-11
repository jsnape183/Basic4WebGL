import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

// 5x5 room: perimeter walls, one decal on the north wall at (2,0), one plain
// wall at (3,0) with no decal.
const COLS = 5, ROWS = 5;
const walls: number[][] = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1 ? 1 : 0)),
);
const markers = [{ row: 0, col: 2, tag: 'decal:door.png' }];

function buildWorld() {
  const { files: ordered, error } = sortByDependencies([]);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files: ordered });
  expect(result.diagnostics).toEqual([]);

  const tw = 16;
  const stub: Record<string, unknown> = {};
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(t, p: string) { if (p === Symbol.toPrimitive || p === 'then') return undefined; if (p in t) return t[p]; return (..._a: unknown[]) => proxy; },
    set(t, p: string, v) { t[p] = v; return true; }, apply: () => proxy,
  };
  const proxy = new Proxy(function () {} as never, handler) as never;
  const _sb = new Proxy(stub, handler) as Record<string, unknown> & ((...a: unknown[]) => unknown);
  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.hasLayer = (_h: unknown, n: string) => n === 'walls';
  _sb.tileWidth = () => tw; _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => COLS * tw; _sb.tileMapHeightPx = () => ROWS * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) => walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => markers.map((m) => ({ ...m }));

  const deferred: Array<() => void> = [];
  _sb._deferModuleBody = (cb: () => void) => deferred.push(cb);
  const _createArray = (init: unknown[]) => (Array.isArray(init) && init.length === 1 && init[0] === 0 ? [] : [...(init ?? [])]);
  const helpers: Record<string, unknown> = {
    _sbLength: (x: { length?: number }) => x?.length ?? 0, _sbJoin: (x: unknown[], s: string) => x.join(s),
    _sbContains: (x: unknown[], i: unknown) => x.includes(i), _sbRemove: () => {}, _sbClear: (x: unknown[]) => x.splice(0),
    _sbCheckedArrayGet: (a: unknown[], i: number) => a[i], _createDict: () => new Map(),
  };
  const factory = new Function('_sb', '_createArray', ...Object.keys(helpers), 'console',
    `${result.code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset };`);
  const M = factory(_sb, _createArray, ...Object.values(helpers), { log() {}, warn() {}, error() {} });
  deferred.forEach((cb) => cb());

  return new M.RcWorld(new M.TileMapSet('c.stm'), 'walls');
}

describe('RcWorld — decal: marker', () => {
  test('decalAt returns the image name for a tagged cell', () => {
    const world = buildWorld();
    expect(world.decalat(2, 0)).toBe('door.png');
  });

  test('decalAt returns "" for a cell with no decal', () => {
    const world = buildWorld();
    expect(world.decalat(3, 0)).toBe('');
  });

  test('decalAt returns "" out of bounds', () => {
    const world = buildWorld();
    expect(world.decalat(-1, 0)).toBe('');
    expect(world.decalat(99, 99)).toBe('');
  });

  test('hasDecals is 1 when any cell carries a decal', () => {
    const world = buildWorld();
    expect(world.hasdecals()).toBe(1);
  });
});
