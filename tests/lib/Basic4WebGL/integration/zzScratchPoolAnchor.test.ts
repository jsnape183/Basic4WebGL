import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Scratch probe: does the ellipse-anchor fix actually make the floor pool
// GROUND-LOCKED? Render two frames -- camera at A, then walked ~1.5 cells
// forward toward the light -- and check the pool's FAR edge (top of the floor
// ellipse) barely moves in screen space while the NEAR edge (bottom) sweeps
// down a lot. That asymmetry == "painted on the ground", not "floating orb".

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

interface Ellipse {
  x: number;
  y: number;
  rx: number;
  ry: number;
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

  const ellipses: Ellipse[] = [];
  _sb.setFillColor = () => {};
  _sb.setLineWidth = () => {};
  _sb.drawRect = () => {};
  _sb.drawRadialGradientCircle = () => {};
  _sb.drawRadialGradientEllipse = (x: number, y: number, rx: number, ry: number) =>
    ellipses.push({ x, y, rx, ry });

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
  return { render, mover, ellipses };
}

// RETIRED -- promoted to raycasterLightpoolPocGroundLock.test.ts (committed).
describe.skip('scratch: light-pool ground-lock', () => {
  test('floor pool far edge stays pinned while near edge sweeps as the camera walks toward the light', () => {
    const { render, mover, ellipses } = build();

    // Light A sits at world (4.5, 4.5, 0.9). Camera facing +y (south) toward it.
    mover.warpto(4.5, 3.0, Math.PI / 2);
    render.renderframe();
    // largest-rx ellipse in the lower half = the nearby floor pool
    const a = ellipses.filter((e) => e.y > 180).sort((p, q) => q.rx - p.rx)[0];
    ellipses.length = 0;

    mover.warpto(4.5, 4.0, Math.PI / 2); // walked 1 cell closer
    render.renderframe();
    const b = ellipses.filter((e) => e.y > 180).sort((p, q) => q.rx - p.rx)[0];

    expect(a).toBeDefined();
    expect(b).toBeDefined();

    const aFar = a.y - a.ry; // top of the floor ellipse == far edge
    const aNear = a.y + a.ry; // bottom == near edge
    const bFar = b.y - b.ry;
    const bNear = b.y + b.ry;

    // eslint-disable-next-line no-console
    console.log(
      `A: far=${aFar.toFixed(0)} near=${aNear.toFixed(0)}  B: far=${bFar.toFixed(0)} near=${bNear.toFixed(0)}  ` +
        `farMoved=${Math.abs(bFar - aFar).toFixed(0)} nearMoved=${Math.abs(bNear - aNear).toFixed(0)}`,
    );

    const farMoved = Math.abs(bFar - aFar);
    const nearMoved = Math.abs(bNear - aNear);

    // Ground-lock signature: the near edge moves several times more than the far edge.
    expect(nearMoved).toBeGreaterThan(farMoved * 2);
  });
});
