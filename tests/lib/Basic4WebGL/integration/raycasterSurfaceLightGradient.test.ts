import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard for RcRender's floor/ceiling surface LIGHTING RESOLUTION.
//
// drawSurface() coalesces a whole contiguous run of same-coloured cells into one
// band and drawFlatSeg() used to shade that entire band with a SINGLE
// RcLights.sampleAt() taken at the run's midpoint. Down a long corridor lit only
// by a short-radius carried torch that midpoint sits far outside the torch's
// radius, so the whole visible floor AND ceiling -- from right in front of the
// player out to the far wall -- got painted at plain ambient: a pitch-black
// slab, with a hard vertical seam against any neighbouring column whose run
// happened to be short (a nearer wall, or an fcol:/ccol: tile boundary splitting
// the run). See the finale demo's "black hallway" bug.
//
// The scene here is deliberately synthetic and colour-free: one 5-wide, 22-deep
// corridor, ambient 0.05, one 6-cell torch carried by the camera. The floor two
// and a half cells in front of the player is well inside the torch radius and
// must therefore render far brighter than ambient.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
// Rc* modules come from the softRaycaster package (lib); nothing to compile as files here.
const VIEW_W = 320;
const VIEW_H = 200;

interface Draw {
  r: number;
  g: number;
  b: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

// A 7x24 grid: solid border, a 5-wide open corridor running "south" (row+).
function corridorWalls(): number[][] {
  const rows = 24;
  const cols = 7;
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(r === 0 || r === rows - 1 || c === 0 || c === cols - 1 ? 1 : 0);
    }
    grid.push(row);
  }
  return grid;
}

function renderCorridorFrame(): Draw[] {
  const walls = corridorWalls();
  const ordered: Array<{ name: string; source: string }> = []; // Rc* now from the softRaycaster package (lib)
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
  const _sb = new Proxy(stub, handler) as Record<string, unknown>;
  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.tileWidth = () => tw;
  _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => walls[0].length * tw;
  _sb.tileMapHeightPx = () => walls.length * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) =>
    walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => [];
  _sb.getStageWidth = () => VIEW_W;
  _sb.getStageHeight = () => VIEW_H;

  const draws: Draw[] = [];
  let fill = { r: 255, g: 255, b: 255 };
  _sb.setFillColor = (r: number, g: number, b: number) => {
    fill = { r, g, b };
  };
  _sb.setLineColor = () => {};
  _sb.setLineWidth = () => {};
  _sb.clearDrawing = () => {
    draws.length = 0;
  };
  _sb.drawRect = (x: number, y: number, w: number, h: number) => {
    draws.push({ ...fill, x, y, w, h });
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
    `${result.code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcRender: _sb_rcrender, RcMover: _sb_rcmover, RcLights: _sb_rclights };`,
  );
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { RcWorld, TileMapSet, RcRender, RcMover, RcLights } = factory(
    _sb,
    _createArray,
    ...Object.values(helpers),
    { log() {} },
  ) as any;
  deferred.forEach((cb: () => void) => cb());

  const world = new RcWorld(new TileMapSet('corridor.stm'), 'walls');
  const render = new RcRender(world);
  const px = 3.5;
  const py = 1.5;
  const mover = new RcMover(world, px, py, 0.3, 0.6);
  const lights = new RcLights(world);
  lights.setambient(0.05);
  lights.addpoint(px, py, 0.5, 0.95, 6);
  lights.update();
  render.bindlights(lights);
  render.bindcamera(mover);
  render.setflatfill(0); // what FinaleScene.bas does -- accurate per-column path

  // face "south" (row+): dirY = sin(angle) = 1
  mover.turn(Math.PI / 2 - mover.angle());

  render.renderframe();
  return draws;
}

// Painter's-order rasteriser: drawing.js gives each draw a strictly increasing
// zIndex within a frame, so later draws paint over earlier ones.
function rasterise(draws: Draw[]): Float64Array {
  const luma = new Float64Array(VIEW_W * VIEW_H);
  for (const d of draws) {
    const x0 = Math.max(0, Math.round(d.x - d.w / 2));
    const x1 = Math.min(VIEW_W, Math.round(d.x + d.w / 2));
    const y0 = Math.max(0, Math.round(d.y - d.h / 2));
    const y1 = Math.min(VIEW_H, Math.round(d.y + d.h / 2));
    const l = d.r * 0.3 + d.g * 0.59 + d.b * 0.11;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) luma[y * VIEW_W + x] = l;
  }
  return luma;
}

describe('RcRender floor/ceiling light gradient', () => {
  const draws = renderCorridorFrame();
  const luma = rasterise(draws);
  // screen Y of the floor (world height 0) at perpendicular distance d:
  //   y = viewH/2 + (RC_EYE_Z - 0) * viewH / d
  const floorY = (d: number) => Math.round(VIEW_H / 2 + (0.5 * VIEW_H) / d);
  const at = (x: number, y: number) => luma[y * VIEW_W + x];

  test('the floor a few cells ahead is lit by the torch, not painted at ambient', () => {
    // 2.5 cells out, torch radius 6 -> light ~0.05 + 0.95*(1 - 2.5/6) = 0.60,
    // against a base floor shade of 105 -> luma ~65. The single-midpoint-sample
    // bug painted this whole band at ambient (0.05) -> luma ~5.
    const near = at(VIEW_W / 2, floorY(2.5));
    expect(near).toBeGreaterThan(30);
  });

  test('floor brightness falls off with distance instead of stepping to black', () => {
    const d1 = at(VIEW_W / 2, floorY(1.5));
    const d2 = at(VIEW_W / 2, floorY(3.0));
    const d3 = at(VIEW_W / 2, floorY(5.0));
    expect(d1).toBeGreaterThan(d2);
    expect(d2).toBeGreaterThan(d3);
    // and no single step may collapse from lit to ambient-black
    expect(d2).toBeGreaterThan(d1 * 0.25);
  });

  test('the ceiling directly overhead is lit by the torch', () => {
    // ceiling (world height RC_STD_CEIL = 1) at 2 cells out
    const y = Math.round(VIEW_H / 2 + ((0.5 - 1.0) * VIEW_H) / 2.0);
    expect(at(VIEW_W / 2, y)).toBeGreaterThan(20);
  });
});
