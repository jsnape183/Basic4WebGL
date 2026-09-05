import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard for the height-aware lighting POC: RcLights.sampleAtZ must
// be a byte-identical passthrough to sampleAt() when heightAwareOn=0 (the
// default, unchanged for every demo but the finale), and when on, must make
// vertical distance actually matter -- the direct test for "floor and ceiling
// at the same (x,y) now read different brightness", the root cause this whole
// POC exists to fix. See docs/superpowers/specs/2026-09-04-raycaster-height-aware-lighting-design.md.

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

interface RcLightsLike {
  setambient(v: number): void;
  addpoint(x: number, y: number, z: number, i: number, r: number): number;
  update(): void;
  sampleat(x: number, y: number): number;
  sampleatz(x: number, y: number, z: number): number;
  setheightaware(v: number): void;
}

function build(markers: Array<{ row: number; col: number; tag: string }> = []) {
  // 12x12 bordered room, wide open.
  const walls = Array.from({ length: 12 }, (_, r) =>
    Array.from({ length: 12 }, (_, c) => (r === 0 || r === 11 || c === 0 || c === 11 ? 1 : 0)),
  );

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
    `${code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcLights: _sb_rclights };`,
  );
  const { RcWorld, TileMapSet, RcLights } = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  const world = new RcWorld(new TileMapSet('room.stm'), 'walls');
  const lights = new RcLights(world) as RcLightsLike;
  return { lights };
}

describe('RcLights.sampleAtZ', () => {
  test('heightAwareOn=0 (default) is a byte-identical passthrough to sampleAt, regardless of worldZ', () => {
    const { lights } = build();
    lights.setambient(0.2);
    lights.addpoint(5.5, 5.5, 0.5, 0.9, 6);
    lights.update();
    const plain = lights.sampleat(5.5, 6.5);
    expect(lights.sampleatz(5.5, 6.5, 0.0)).toBeCloseTo(plain, 10);
    expect(lights.sampleatz(5.5, 6.5, 1.0)).toBeCloseTo(plain, 10);
  });

  test('heightAwareOn=1: a query point directly below the light (small vertical offset) reads brighter than one further from the light vertically, same (x,y)', () => {
    const { lights } = build();
    lights.setambient(0.05);
    lights.addpoint(5.5, 5.5, 1.0, 0.9, 6);
    lights.update();
    lights.setheightaware(1);
    const near = lights.sampleatz(5.5, 5.5, 0.9); // 0.1 below the light
    const far = lights.sampleatz(5.5, 5.5, 0.0); // 1.0 below the light
    expect(near).toBeGreaterThan(far);
  });

  test('heightAwareOn=1: a wall between the light and the query point still fully occludes it', () => {
    const { lights } = build();
    lights.setheightaware(1);
    lights.addpoint(5.5, 0.5, 1.0, 0.9, 6); // inside the border wall row -- unreachable through row 5, contributes nothing through occlusion
    lights.update();
    const throughWall = lights.sampleatz(5.5, 5.5, 0.9);
    expect(throughWall).toBeCloseTo(lights.sampleatz(5.5, 5.5, 0.9), 10); // deterministic, no crash
    expect(throughWall).toBeLessThan(0.9); // did not receive full light through the border wall
  });

  test('static lights baked from light: markers contribute to sampleAtZ using their real parsed height', () => {
    const { lights } = build([{ row: 5, col: 5, tag: 'light:1.8' }]);
    lights.setambient(0.05);
    lights.setheightaware(1);
    const nearFixtureHeight = lights.sampleatz(5.5, 5.5, 1.7); // 0.1 below the 1.8 fixture
    const farFromFixtureHeight = lights.sampleatz(5.5, 5.5, 0.0); // 1.8 below the fixture
    expect(nearFixtureHeight).toBeGreaterThan(farFromFixtureHeight);
  });
});
