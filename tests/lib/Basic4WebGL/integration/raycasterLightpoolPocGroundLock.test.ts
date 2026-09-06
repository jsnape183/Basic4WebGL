import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Ground-lock guard for the light-pool POC after the floor-field rewrite.
//
// The old renderer drew each pool as a screen-space ellipse re-derived from
// the camera every frame, so it slid under rotation. The new renderer hands
// the engine's per-pixel floorcaster (drawPlaneField) a STABLE plane -- fixed
// planeZ, fixed lightmap id -- and only the camera pose changes. The pixel
// projection (and its ground-lock) is unit-tested in drawing.test.ts; this
// test just proves the demo feeds drawPlaneField correctly and no longer
// emits the old ellipse overlay.

const DIR = 'demo-src/raycaster-lightpool-poc';
const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

function transpileDemo(): string {
  const names = readdirSync(DIR).filter((n) => n.endsWith('.bas')).sort();
  const raw = names.map((name) => ({ name, source: readFileSync(`${DIR}/${name}`, 'utf-8') }));
  const { files, error } = sortByDependencies(raw);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics).toEqual([]);
  return String(result.code);
}

interface PlaneCall {
  fieldId: unknown;
  planeZ: number;
  camX: number;
  camY: number;
  dirX: number;
}

function build() {
  const stm = JSON.parse(readFileSync(`${DIR}/assets/lightpool.stm`, 'utf-8'));
  const walls: number[][] = stm.layers.walls;
  const markers = stm.layers.tags.markers;
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

  const planeCalls: PlaneCall[] = [];
  let ellipseCalls = 0;
  let lightmapIds: unknown[] = [];
  _sb.setFillColor = () => {};
  _sb.setLineWidth = () => {};
  _sb.drawRect = () => {};
  _sb.drawRadialGradientEllipse = () => { ellipseCalls++; };
  _sb.drawRadialGradientCircle = () => { ellipseCalls++; };
  _sb.registerLightmap = (id: unknown) => { lightmapIds.push(id); };
  _sb.drawPlaneField = (
    fieldId: unknown, planeZ: number, camX: number, camY: number, _camZ: number, dirX: number,
  ) => {
    planeCalls.push({ fieldId, planeZ, camX, camY, dirX });
  };

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
  const render = new RcRenderPool(world) as {
    bindlights: (l: unknown) => void;
    bindcamera: (m: unknown) => void;
    renderframe: () => void;
  };
  const mover = new RcMover(world, 4.5, 3.5, 0.3, 0.6) as {
    warpto: (x: number, y: number, a: number) => void;
  };
  const lights = new RcLights(world) as { setambient: (v: number) => void };
  lights.setambient(0.08);
  render.bindlights(lights);
  render.bindcamera(mover);
  return { render, mover, planeCalls, ellipseCalls: () => ellipseCalls, lightmapIds: () => lightmapIds };
}

describe('raycaster-lightpool-poc: floor-field feeds a stable plane, no ellipse overlay', () => {
  test('bindLights bakes a floor and a ceiling lightmap', () => {
    const { lightmapIds } = build();
    expect(lightmapIds()).toEqual(['rcpoc_floor', 'rcpoc_ceil']);
  });

  test('each frame draws exactly one floor + one ceiling field, at fixed planeZ, only the camera changes', () => {
    const { render, mover, planeCalls, ellipseCalls } = build();

    mover.warpto(4.5, 3.0, Math.PI / 2);
    render.renderframe();
    const a = planeCalls.slice();
    planeCalls.length = 0;

    mover.warpto(4.5, 3.0, Math.PI / 2 + 0.3); // rotate in place
    render.renderframe();
    const b = planeCalls.slice();

    expect(a.map((c) => c.fieldId)).toEqual(['rcpoc_floor', 'rcpoc_ceil']);
    expect(b.map((c) => c.fieldId)).toEqual(['rcpoc_floor', 'rcpoc_ceil']);
    // plane heights are constant across the rotation...
    expect(a[0].planeZ).toBe(b[0].planeZ);
    expect(a[1].planeZ).toBe(b[1].planeZ);
    expect(a[0].planeZ).toBe(0);
    expect(a[1].planeZ).toBeGreaterThan(0);
    // ...the camera direction is what moved
    expect(a[0].dirX).not.toBeCloseTo(b[0].dirX, 3);
    // and the drifting ellipse overlay is gone
    expect(ellipseCalls()).toBe(0);
  });
});
