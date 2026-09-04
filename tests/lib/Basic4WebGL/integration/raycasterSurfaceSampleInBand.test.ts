import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard: a floor/ceiling band must be lit from a point that is
// actually ON that band -- never from a point past the end of it.
//
// drawFlatSeg shades each cell of a FRAME-GLOBAL screen-Y lattice from the light
// at that cell's own midpoint. The lattice is anchored on the horizon and spans
// half the screen in RC_SURF_SEG_MAX steps, so its horizon-most cell covers
// everything from a few cells out to infinity -- and its midpoint sits at a
// FIXED perpendicular distance (12 world units for a 200px-tall view). When the
// visible surface stops short of that -- a wall, a floor step, a ceiling drop,
// anything that ends the band part-way through a lattice cell -- the sample was
// still taken at the cell midpoint, i.e. at a world point BEHIND the thing that
// ended the band. A lit room past a wall then painted the near side of that wall
// bright, and a dark space past a wall painted a lit sliver black; both jumped
// discontinuously as the camera walked, because the sample point is pinned to the
// camera (always exactly 12 units ahead) while the geometry that clips the band
// is pinned to the world.
//
// The scene: a 9-cell dark corridor, a wall across it, and a bright light in the
// sealed room beyond. The corridor floor and ceiling right up against that wall
// must stay dark -- the light behind it is not visible and does not reach.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
const CANON = 'demo-src/raycaster/lib';
const LIB_FILES = [
  'RcConfig.bas',
  'RcWorld.bas',
  'RcCast.bas',
  'RcLights.bas',
  'RcMover.bas',
  'RcActor.bas',
  'RcActors.bas',
  'RcRender.bas',
];

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

// 19 x 5. Open rows 1..3. Open cols 1..9 (the corridor the camera stands in),
// a solid wall column at 10, and a sealed room at cols 11..17 holding the light.
function sealedRoomWalls(): number[][] {
  const rows = 5;
  const cols = 19;
  const grid: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(r === 0 || r === rows - 1 || c === 0 || c === cols - 1 || c === 10 ? 1 : 0);
    }
    grid.push(row);
  }
  return grid;
}

function renderFrame(): Draw[] {
  const walls = sealedRoomWalls();
  const files = LIB_FILES.map((name) => ({
    name,
    source: readFileSync(`${CANON}/${name}`, 'utf-8'),
  }));
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

  const world = new RcWorld(new TileMapSet('sealed.stm'), 'walls');
  const render = new RcRender(world);
  const mover = new RcMover(world, 1.5, 2.5, 0.3, 0.6);
  const lights = new RcLights(world);
  lights.setambient(0.05);
  // Sealed in the far room, 13 cells from the camera: never visible, never in
  // line of sight of any corridor cell, but sitting exactly where the horizon
  // lattice cell's fixed 12-unit midpoint sample lands.
  lights.addpoint(14.5, 2.5, 0.5, 0.95, 6);
  lights.update();
  render.bindlights(lights);
  render.bindcamera(mover);
  render.setflatfill(0); // what FinaleScene.bas does -- accurate per-column path

  render.renderframe(); // camera starts facing +x (angle 0), straight down the corridor
  return draws;
}

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

describe('RcRender surface light sample stays inside the band it shades', () => {
  const luma = rasterise(renderFrame());
  const at = (x: number, y: number) => luma[y * VIEW_W + x];
  // floor (h = 0) and ceiling (h = RC_STD_CEIL = 1) screen rows at distance d
  const floorY = (d: number) => Math.round(VIEW_H / 2 + (0.5 * VIEW_H) / d);
  const ceilY = (d: number) => Math.round(VIEW_H / 2 + ((0.5 - 1.0) * VIEW_H) / d);
  // ambient 0.05 on the FLOOR_TOP shade (105,105,130) is luma ~5.4; the sealed
  // light would drag it to ~90. 25 is comfortably clear of both.
  const DARK = 25;

  test('the corridor floor just short of the far wall is not lit through it', () => {
    expect(at(VIEW_W / 2, floorY(7.0))).toBeLessThan(DARK);
    expect(at(VIEW_W / 2, floorY(8.0))).toBeLessThan(DARK);
  });

  test('the corridor ceiling just short of the far wall is not lit through it', () => {
    expect(at(VIEW_W / 2, ceilY(7.0))).toBeLessThan(DARK);
    expect(at(VIEW_W / 2, ceilY(8.0))).toBeLessThan(DARK);
  });

  test('the whole corridor stays dark -- nothing about it is in the light', () => {
    for (const d of [2, 3, 4, 5, 6, 7, 8]) {
      expect(at(VIEW_W / 2, floorY(d))).toBeLessThan(DARK);
      expect(at(VIEW_W / 2, ceilY(d))).toBeLessThan(DARK);
    }
  });
});
