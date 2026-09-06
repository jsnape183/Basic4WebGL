import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard for the light-pool POC's ground-lock. The floor/ceiling
// pools are drawn as perspective strips sampling a BAKED lightmap by absolute
// world position. For any fixed world point, the lightmap it samples must not
// depend on where the camera is or which way it faces -- that invariance IS
// "the pool stays painted on the ground". The billboard version failed this.
//
// This renders two frames from the SAME position at DIFFERENT angles, captures
// the floor quad's near-edge and far-edge world points, and asserts the
// camera-to-edge distance is invariant under rotation. Those distances come
// from projectYInv at a fixed screen Y -- angle-independent by construction --
// so if they ever drift, the floor render has picked up a camera-angle
// dependency it must not have.

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

interface StripCall {
  id: string;
  sxL: number;
  sxR: number;
  syNear: number;
  syFar: number;
  wNearLX: number;
  wNearLY: number;
  wNearRX: number;
  wNearRY: number;
  wFarLX: number;
  wFarLY: number;
  wFarRX: number;
  wFarRY: number;
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

  const strips: StripCall[] = [];
  _sb.setFillColor = () => {};
  _sb.setLineWidth = () => {};
  _sb.drawRect = () => {};
  _sb.registerLightmap = () => {};
  _sb.drawLightmapStrip = (
    id: string,
    sxL: number,
    sxR: number,
    syNear: number,
    syFar: number,
    wNearLX: number,
    wNearLY: number,
    wNearRX: number,
    wNearRY: number,
    wFarLX: number,
    wFarLY: number,
    wFarRX: number,
    wFarRY: number,
  ) =>
    strips.push({
      id, sxL, sxR, syNear, syFar,
      wNearLX, wNearLY, wNearRX, wNearRY,
      wFarLX, wFarLY, wFarRX, wFarRY,
    });

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
  return { render, mover, strips };
}

function floorQuad(strips: StripCall[]): StripCall {
  const q = strips.find((s) => s.id === 'rcpool_floor');
  if (!q) throw new Error('no rcpool_floor quad drawn');
  return q;
}

// perpendicular distance from a point to the camera along its facing dir.
function edgeDist(mx: number, my: number, cx: number, cy: number): number {
  return Math.hypot(mx - cx, my - cy);
}

describe('raycaster-lightpool-poc: floor lightmap stays locked to the ground', () => {
  test('the floor quad edges sit at the same camera distance regardless of facing', () => {
    const { render, mover, strips } = build();
    const CX = 5.5;
    const CY = 3.5;

    mover.warpto(CX, CY, Math.PI / 2); // facing +y
    render.renderframe();
    const a = floorQuad([...strips]);
    strips.length = 0;

    mover.warpto(CX, CY, Math.PI / 2 + 0.4); // same spot, rotated ~23 deg
    render.renderframe();
    const b = floorQuad([...strips]);

    const aNear = edgeDist((a.wNearLX + a.wNearRX) / 2, (a.wNearLY + a.wNearRY) / 2, CX, CY);
    const bNear = edgeDist((b.wNearLX + b.wNearRX) / 2, (b.wNearLY + b.wNearRY) / 2, CX, CY);
    const aFar = edgeDist((a.wFarLX + a.wFarRX) / 2, (a.wFarLY + a.wFarRY) / 2, CX, CY);
    const bFar = edgeDist((b.wFarLX + b.wFarRX) / 2, (b.wFarLY + b.wFarRY) / 2, CX, CY);

    // eslint-disable-next-line no-console
    console.log(
      `near: A=${aNear.toFixed(3)} B=${bNear.toFixed(3)}   far: A=${aFar.toFixed(2)} B=${bFar.toFixed(2)}`,
    );
    expect(Math.abs(aNear - bNear)).toBeLessThan(0.05);
    expect(Math.abs(aFar - bFar)).toBeLessThan(0.5);
  });
});
