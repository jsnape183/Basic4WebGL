import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard for the height-aware lighting POC (raycaster-p10-finale):
// a `light:` marker's optional height suffix must be parsed into a new
// per-cell array (lightHArr), defaulting to RcConfig.RC_LIGHT_DEFAULT_Z for a
// bare `light` tag, without changing lightAt()'s existing 0/1 flag semantics.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
const DIR = 'demo-src/raycaster-p5';

function transpileP5(): string {
  const names = readdirSync(DIR)
    .filter((n) => n.endsWith('.bas') && n !== 'Main.bas' && n !== 'LitScene.bas')
    .sort();
  const raw = names.map((name) => ({ name, source: readFileSync(`${DIR}/${name}`, 'utf-8') }));
  const { files, error } = sortByDependencies(raw);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics).toEqual([]);
  return String(result.code);
}

interface RcWorldLike {
  lightat(col: number, row: number): number;
  lightheightat(col: number, row: number): number;
}

function buildWorld(markers: Array<{ row: number; col: number; tag: string }>) {
  // 4x4 open room, no walls, so cell index math is trivial.
  const walls = Array.from({ length: 4 }, () => Array(4).fill(0));

  const code = transpileP5();
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
  const tw = 16;
  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.tileWidth = () => tw;
  _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => walls[0].length * tw;
  _sb.tileMapHeightPx = () => walls.length * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) =>
    walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => markers;

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
    `${code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset };`,
  );
  const { RcWorld, TileMapSet } = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  return new RcWorld(new TileMapSet('room.stm'), 'walls') as RcWorldLike;
}

describe('RcWorld light: marker optional height', () => {
  test('bare "light" marker defaults lightHeightAt to RC_LIGHT_DEFAULT_Z, lightAt stays 1', () => {
    const world = buildWorld([{ row: 1, col: 1, tag: 'light' }]);
    expect(world.lightat(1, 1)).toBe(1);
    expect(world.lightheightat(1, 1)).toBeCloseTo(0.85, 5);
  });

  test('"light:1.8" marker parses the height, lightAt stays 1', () => {
    const world = buildWorld([{ row: 2, col: 2, tag: 'light:1.8' }]);
    expect(world.lightat(2, 2)).toBe(1);
    expect(world.lightheightat(2, 2)).toBeCloseTo(1.8, 5);
  });

  test('a cell with no light marker has lightAt 0 and lightHeightAt defaults to RC_LIGHT_DEFAULT_Z', () => {
    const world = buildWorld([]);
    expect(world.lightat(0, 0)).toBe(0);
    expect(world.lightheightat(0, 0)).toBeCloseTo(0.85, 5);
  });
});
