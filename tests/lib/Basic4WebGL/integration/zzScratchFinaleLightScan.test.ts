import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Scratch probe (see CLAUDE.md): scans the REAL raycaster-p10-finale map for
// sharp local drops in RcLights.sampleAt that would show up as a hard "shadow"
// edge on screen, matching the user's bug report. Not a maintained regression
// test -- .skip'd once the investigation it was written for is closed out.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
const CANON = 'demo-src/raycaster/lib';
const files = ['RcConfig.bas', 'RcWorld.bas', 'RcCast.bas', 'RcLights.bas'].map((name) => ({
  name,
  source: readFileSync(`${CANON}/${name}`, 'utf-8'),
}));

interface RcLightsLike {
  samplecell(col: number, row: number): number;
  sampleat(x: number, y: number): number;
  addpoint(x: number, y: number, z: number, intensity: number, radiusCells: number): number;
  update(): void;
  setambient(v: number): void;
}
interface RcWorldLike {
  wallat(col: number, row: number): number;
}

function buildLights(
  walls: number[][],
  markers: Array<{ row: number; col: number; tag: string }>,
): { lights: RcLightsLike; world: RcWorldLike } {
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
  const world = new RcWorld(new TileMapSet('finale.stm'), 'walls') as RcWorldLike;
  const lights = new RcLights(world) as RcLightsLike;
  return { lights, world };
}

describe('finale map light scan (scratch)', () => {
  test('no sharp local drop in sampleAt across the whole map', () => {
    const stm = JSON.parse(readFileSync('demo-src/raycaster-p10-finale/assets/finale.stm', 'utf-8'));
    const walls: number[][] = stm.layers.walls;
    const markers: Array<{ row: number; col: number; tag: string }> = stm.layers.tags.markers;
    const { lights, world } = buildLights(walls, markers);
    lights.setambient(0.05);
    const torchHandle = lights.addpoint(15.5, 5.5, 0.5, 0.95, 6);
    lights.update();

    const rows = walls.length;
    const cols = walls[0].length;
    const step = 0.25;
    const all: Array<{ d: number; msg: string }> = [];
    for (let ry = 0; ry < rows; ry += step) {
      for (let rx = 0; rx < cols; rx += step) {
        const col = Math.floor(rx);
        const row = Math.floor(ry);
        if (world.wallat(col, row) > 0) continue;
        const v0 = lights.sampleat(rx, ry);
        const vR = lights.sampleat(rx + step, ry);
        const vD = lights.sampleat(rx, ry + step);
        if (world.wallat(Math.floor(rx + step), row) === 0) {
          all.push({ d: Math.abs(v0 - vR), msg: `(${rx.toFixed(2)},${ry.toFixed(2)})->(+${step},0): ${v0.toFixed(3)} -> ${vR.toFixed(3)}` });
        }
        if (world.wallat(col, Math.floor(ry + step)) === 0) {
          all.push({ d: Math.abs(v0 - vD), msg: `(${rx.toFixed(2)},${ry.toFixed(2)})->(0,+${step}): ${v0.toFixed(3)} -> ${vD.toFixed(3)}` });
        }
      }
    }
    all.sort((a, b) => b.d - a.d);
    console.log('top 20 deltas (0.25-unit step):');
    all.slice(0, 20).forEach((a) => console.log(a.d.toFixed(3), a.msg));
    const anomalies = all.filter((a) => a.d > 0.15).map((a) => a.msg);
    expect(anomalies).toEqual([]);
  });
});
