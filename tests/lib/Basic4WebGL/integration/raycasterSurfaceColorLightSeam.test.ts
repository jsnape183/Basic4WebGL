import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard: an fcol:/ccol: tile tag must not change the LIGHTING of the
// surface it colours.
//
// RcRender.drawSurface() coalesces contiguous same-coloured floor/ceiling cells
// into bands and calls drawFlatSeg() once per band. drawFlatSeg() used to build
// its flat-shaded light sub-bands from the band's OWN clipped screen extent
// (yTop + (yBot - yTop) * si / nSeg), so every colour-tile boundary was forced
// to be a sub-band boundary -- i.e. a hard step in the shading. The far side of
// the boundary was sampled up to RC_SURF_LIGHT_STEP darker than the near side,
// and neighbouring columns (which split at a different depth, or not at all)
// stepped somewhere else entirely, so the light step traced the projected tile
// edge. On screen that reads as a hard, diagonal, wall-shadow-like edge sitting
// exactly on a floor colour boundary -- the finale demo's "boundary shadowing"
// bug, reported as "the renderer is treating floor boundaries as walls".
//
// The invariant that pins it: tag a patch of floor with fcol:696982, which is
// (105, 105, 130) -- byte-for-byte RcRender's own default RC_SHADE_FLOOR_TOP
// shade. Painting that patch must then be indistinguishable from not tagging it
// at all. Any difference in the rendered pixels is lighting leaking out of the
// colour-run subdivision.
//
// Light sub-bands are therefore placed on a frame-global screen-Y lattice
// (see RcRender.drawFlatSeg) that every column and every band shares, instead
// of one lattice per band.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
// Rc* modules come from the softRaycaster package (lib); nothing to compile as files here.
const VIEW_W = 320;
const VIEW_H = 200;

// (105, 105, 130) -- exactly what drawStrip() paints for RC_SHADE_FLOOR_TOP.
const DEFAULT_FLOOR_HEX = '696982';

interface Draw {
  r: number;
  g: number;
  b: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Marker {
  row: number;
  col: number;
  tag: string;
}

// A 16x16 grid: solid border, open interior.
function roomWalls(): number[][] {
  const n = 16;
  const grid: number[][] = [];
  for (let r = 0; r < n; r++) {
    const row: number[] = [];
    for (let c = 0; c < n; c++) row.push(r === 0 || r === n - 1 || c === 0 || c === n - 1 ? 1 : 0);
    grid.push(row);
  }
  return grid;
}

// A rectangular patch of floor a couple of cells in front of the camera, well
// inside the torch's radius so the light gradient is steep across its boundary.
function patchMarkers(hex: string): Marker[] {
  const out: Marker[] = [];
  for (let row = 6; row <= 9; row++) for (let col = 5; col <= 10; col++) out.push({ row, col, tag: `fcol:${hex}` });
  return out;
}

function renderFrame(markers: Marker[]): Draw[] {
  const walls = roomWalls();
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
  _sb.tileAt = (_h: unknown, px: number, py: number) => walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => markers.map((m) => ({ ...m }));
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

  const world = new RcWorld(new TileMapSet('room.stm'), 'walls');
  const render = new RcRender(world);
  const px = 8.5;
  const py = 3.5;
  const mover = new RcMover(world, px, py, 0.3, 0.6);
  const lights = new RcLights(world);
  lights.setambient(0.05);
  // Same torch the finale carries: quadratic falloff, tight 4-cell radius --
  // the steepest gradient the library can put across a tile boundary.
  const torch = lights.addpoint(px, py, 0.5, 0.95, 4);
  lights.setlightfalloff(torch, 1); // RC_FALLOFF_QUADRATIC
  lights.update();
  render.bindlights(lights);
  render.bindcamera(mover);
  render.setflatfill(0); // what FinaleScene.bas does -- accurate per-column path

  // face "south" (row+): dirY = sin(angle) = 1
  mover.turn(Math.PI / 2 - mover.angle());
  render.renderframe();
  return draws;
}

// Painter's-order rasteriser -- later draws paint over earlier ones.
function rasterise(draws: Draw[]): Float64Array {
  const buf = new Float64Array(VIEW_W * VIEW_H * 3);
  for (const d of draws) {
    const x0 = Math.max(0, Math.round(d.x - d.w / 2));
    const x1 = Math.min(VIEW_W, Math.round(d.x + d.w / 2));
    const y0 = Math.max(0, Math.round(d.y - d.h / 2));
    const y1 = Math.min(VIEW_H, Math.round(d.y + d.h / 2));
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const i = (y * VIEW_W + x) * 3;
        buf[i] = d.r;
        buf[i + 1] = d.g;
        buf[i + 2] = d.b;
      }
  }
  return buf;
}

describe('RcRender fcol: boundaries do not shade like walls', () => {
  const tagged = rasterise(renderFrame(patchMarkers(DEFAULT_FLOOR_HEX)));
  const plain = rasterise(renderFrame([]));

  test('tagging floor with the default floor colour is a pixel-exact no-op', () => {
    let worst = 0;
    let worstAt = '';
    for (let y = 0; y < VIEW_H; y++) {
      for (let x = 0; x < VIEW_W; x++) {
        const i = (y * VIEW_W + x) * 3;
        for (let k = 0; k < 3; k++) {
          const diff = Math.abs(tagged[i + k] - plain[i + k]);
          if (diff > worst) {
            worst = diff;
            worstAt = `x=${x} y=${y} ch=${k} tagged=${tagged[i + k].toFixed(2)} plain=${plain[i + k].toFixed(2)}`;
          }
        }
      }
    }
    expect(`${worst.toFixed(3)} @ ${worstAt}`).toBe('0.000 @ ');
  });

  test('the colour boundary carries no light step down the middle column', () => {
    // Walk the centre column top-to-bottom; the largest brightness step between
    // vertically adjacent floor pixels must not exceed what the ordinary
    // distance banding produces anywhere else in the column. A boundary-only
    // step would show up as a single outlier far above the rest.
    const x = VIEW_W / 2;
    const lum = (buf: Float64Array, y: number) => {
      const i = (y * VIEW_W + x) * 3;
      return buf[i] * 0.3 + buf[i + 1] * 0.59 + buf[i + 2] * 0.11;
    };
    const steps: number[] = [];
    for (let y = VIEW_H / 2 + 2; y < VIEW_H - 1; y++) steps.push(Math.abs(lum(tagged, y + 1) - lum(tagged, y)));
    const sorted = [...steps].sort((a, b) => b - a);
    // The floor is flat-shaded in bands, so a handful of real steps is expected;
    // the bug added an EXTRA one at the tile boundary. With the tag painting the
    // default colour there must be no more distinct steps than the untagged
    // render has.
    const plainSteps: number[] = [];
    for (let y = VIEW_H / 2 + 2; y < VIEW_H - 1; y++) plainSteps.push(Math.abs(lum(plain, y + 1) - lum(plain, y)));
    const count = (arr: number[]) => arr.filter((s) => s > 0.5).length;
    expect(count(steps)).toBe(count(plainSteps));
    expect(sorted[0]).toBeLessThanOrEqual(Math.max(...plainSteps) + 1e-9);
  });
});
