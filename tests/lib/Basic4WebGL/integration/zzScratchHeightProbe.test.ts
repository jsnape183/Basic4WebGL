import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Scratch probe: what do sampleAt / sampleAtZ actually return at real finale
// light positions? Diagnosing the user's "no visible difference" report.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
const DIR = 'demo-src/raycaster-p10-finale';

function transpile(): string {
  const names = readdirSync(DIR)
    .filter((n) => n.endsWith('.bas') && n !== 'Main.bas' && n !== 'FinaleScene.bas')
    .sort();
  const raw = names.map((name) => ({ name, source: readFileSync(`${DIR}/${name}`, 'utf-8') }));
  const { files, error } = sortByDependencies(raw);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics).toEqual([]);
  return String(result.code);
}

interface RcLightsLike {
  setambient(v: number): void;
  sampleat(x: number, y: number): number;
  sampleatz(x: number, y: number, z: number): number;
  setheightaware(v: number): void;
}

function build() {
  const stm = JSON.parse(readFileSync(`${DIR}/assets/finale.stm`, 'utf-8'));
  const walls: number[][] = stm.layers.walls;
  const markers: Array<{ row: number; col: number; tag: string }> = stm.layers.tags.markers;

  const code = transpile();
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
    `${code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcLights: _sb_rclights };`,
  );
  const { RcWorld, TileMapSet, RcLights } = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  const world = new RcWorld(new TileMapSet('finale.stm'), 'walls');
  const lights = new RcLights(world) as RcLightsLike;
  lights.setambient(0.05);
  return { lights };
}

describe('scratch: real finale sampleAt vs sampleAtZ numbers', () => {
  test('hub junction light (15.5,15.5, height 1.7)', () => {
    const { lights } = build();
    for (const dist of [0, 0.5, 1, 2, 3, 4]) {
      const x = 15.5 + dist;
      const y = 15.5;
      const flat = lights.sampleat(x, y);
      lights.setheightaware(0);
      const zOff = lights.sampleatz(x, y, 0);
      lights.setheightaware(1);
      const floor = lights.sampleatz(x, y, 0);
      const ceil = lights.sampleatz(x, y, 1.0);
      // eslint-disable-next-line no-console
      console.log(
        `dist=${dist} flat(sampleAt)=${flat.toFixed(3)} sampleAtZ(off)=${zOff.toFixed(3)} floor(on)=${floor.toFixed(3)} ceil(on)=${ceil.toFixed(3)} diff=${(floor - ceil).toFixed(3)}`,
      );
    }
    expect(true).toBe(true);
  });
});
