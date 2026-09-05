import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard for the light-pool POC (raycaster-lightpool-poc): proves it
// transpiles with zero diagnostics AND runs to a full renderFrame() with zero
// runtime errors in a stubbed environment. This is deliberately the ONLY
// automated test for this demo -- see
// docs/superpowers/specs/2026-09-05-raycaster-lightpool-poc-design.md's
// Testing section: the actual success criterion (does it look like a round
// pool of light) can only be judged by a human looking at it.

const DIR = 'demo-src/raycaster-lightpool-poc';
const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

function transpileDemo(): string {
  const names = readdirSync(DIR)
    .filter((n) => n.endsWith('.bas'))
    .sort();
  const raw = names.map((name) => ({ name, source: readFileSync(`${DIR}/${name}`, 'utf-8') }));
  const { files, error } = sortByDependencies(raw);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics).toEqual([]);
  return String(result.code);
}

describe('raycaster-lightpool-poc demo', () => {
  test('transpiles with zero diagnostics and renderFrame() runs with zero runtime errors', () => {
    const stm = JSON.parse(readFileSync(`${DIR}/assets/lightpool.stm`, 'utf-8'));
    const walls: number[][] = stm.layers.walls;
    const markers: Array<{ row: number; col: number; tag: string }> = stm.layers.tags.markers;

    const code = transpileDemo();
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
    _sb.getStageWidth = () => 640;
    _sb.getStageHeight = () => 360;

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
      `${code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcRenderPool: _sb_rcrenderpool, RcMover: _sb_rcmover, RcLights: _sb_rclights };`,
    );
    const { RcWorld, TileMapSet, RcRenderPool, RcMover, RcLights } = factory(
      _sb,
      _createArray,
      ...Object.values(helpers),
      { log() {} },
    );
    deferred.forEach((cb) => cb());

    const world = new RcWorld(new TileMapSet('lightpool.stm'), 'walls');
    const render = new (RcRenderPool as new (w: unknown) => { bindlights: (l: unknown) => void; bindcamera: (m: unknown) => void; renderframe: () => void })(world);
    const mover = new (RcMover as new (w: unknown, x: number, y: number, r: number, h: number) => { warpto: (x: number, y: number, a: number) => void })(world, 4.5, 3.5, 0.3, 0.6);
    mover.warpto(4.5, 3.5, Math.PI / 2);
    const lights = new (RcLights as new (w: unknown) => { setambient: (v: number) => void })(world);
    lights.setambient(0.08);
    render.bindlights(lights);
    render.bindcamera(mover);

    expect(() => render.renderframe()).not.toThrow();
  });
});
