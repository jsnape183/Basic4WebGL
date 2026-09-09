import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard for floor/ceiling step rendering under the per-pixel floor
// field (RcRender.setFloorField(1)).
//
// Two bugs this pins down:
//  1. A step riser was drawn as a flat grey drawStrip band (shadeKind 2/3)
//     over the textured floor, even for a DOWN-step whose face a camera on the
//     higher floor cannot see.
//  2. A wall standing on the lower floor beyond that down-step was drawn all
//     the way to its true projected base -- which, near the platform edge,
//     falls *below* the edge on screen -- painting a wedge of wall over the
//     step / the platform the camera is standing on. The window bottom is now
//     clamped to the step edge for a down-step, so nothing past it draws there.

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

// 14 x 12. Border walls. Rows 5-10 are a floor:0.2 platform (south); rows 1-4
// are lower floor (z=0). `interiorWallRow`, when set, drops a full-height wall
// on the lower floor just past the down-step so a camera near the platform's
// north edge looks straight at it across the drop.
const COLS = 14;
const ROWS = 12;
const wallsFor = (interiorWallRow: number | null): number[][] =>
  Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) return 1;
      if (interiorWallRow !== null && r === interiorWallRow) return 1;
      return 0;
    }),
  );
const markers: Array<{ row: number; col: number; tag: string }> = [];
for (let r = 5; r <= 10; r++)
  for (let c = 1; c <= COLS - 2; c++) markers.push({ row: r, col: c, tag: 'floor:0.2' });

type Strip = [string, number, number, number, number, number, number, number, number];

interface Built {
  ren: {
    bindcamera(m: unknown): void; bindlights(l: unknown): void; setwalltexture(n: string): void;
    setfloorfield(v: number): void; setfloortexture(n: string): void; setceiltexture(n: string): void; renderframe(): void;
  };
  mover: { warpto(x: number, y: number, a: number): void; step(dt: number): void };
  lights: { setambient(v: number): void; update(): void };
  rects: Array<{ y: number; w: number; h: number; fill: [number, number, number] }>;
  strips: Strip[];
  VIEWH: number;
}

const VIEWW = 640;
const VIEWH = 400;

function build(interiorWallRow: number | null): Built {
  const walls = wallsFor(interiorWallRow);
  const { files: ordered, error } = sortByDependencies([]);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files: ordered });
  expect(result.diagnostics).toEqual([]);

  const tw = 16;
  const stub: Record<string, unknown> = {};
  const rects: Built['rects'] = [];
  const strips: Strip[] = [];
  let fill: [number, number, number] = [0, 0, 0];

  const handler: ProxyHandler<Record<string, unknown>> = {
    get(t, p: string) {
      if (p === Symbol.toPrimitive || p === 'then') return undefined;
      if (p in t) return t[p];
      return (..._a: unknown[]) => proxy;
    },
    set(t, p: string, v) { t[p] = v; return true; },
    apply: () => proxy,
  };
  const proxy = new Proxy(function () {} as never, handler) as never;
  const _sb = new Proxy(stub, handler) as Record<string, unknown> & ((...a: unknown[]) => unknown);

  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.hasLayer = (_h: unknown, n: string) => n === 'walls';
  _sb.tileWidth = () => tw;
  _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => COLS * tw;
  _sb.tileMapHeightPx = () => ROWS * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) => walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => markers.map((m) => ({ ...m }));
  _sb.getStageWidth = () => VIEWW;
  _sb.getStageHeight = () => VIEWH;
  _sb.setFillColor = (r: number, g: number, b: number) => { fill = [r, g, b]; };
  _sb.drawRect = (_x: number, y: number, w: number, h: number) => { rects.push({ y, w, h, fill }); };
  _sb.drawPlaneField = () => {};
  _sb.drawImageStrip = (...a: unknown[]) => { strips.push(a as Strip); };
  _sb.drawFloorStrip = (...a: unknown[]) => { strips.push(a as Strip); };
  _sb.registerLightmap = () => {};
  _sb.registerFieldTiles = () => {};
  _sb._fieldTexPixels = () => null;

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
    '_sb', '_createArray', ...Object.keys(helpers), 'console',
    `${result.code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcRender: _sb_rcrender, RcMover: _sb_rcmover, RcLights: _sb_rclights };`,
  );
  const M = factory(_sb, _createArray, ...Object.values(helpers), { log() {}, warn() {}, error() {} });
  deferred.forEach((cb) => cb());

  const world = new M.RcWorld(new M.TileMapSet('c.stm'), 'walls');
  const lights = new M.RcLights(world);
  lights.setambient(0.8);
  const ren = new M.RcRender(world);
  const mover = new M.RcMover(world, 1.5, 1.5, 0.3, 0.6);
  ren.bindcamera(mover);
  ren.bindlights(lights);
  ren.setwalltexture('rc_tex_concrete.png');
  ren.setfloorfield(1);
  ren.setfloortexture('rc_tex_concrete.png');
  ren.setceiltexture('rc_tex_concrete.png');
  lights.update();

  return { ren, mover, lights, rects, strips, VIEWH };
}

describe('RcRender floor-field steps', () => {
  test('a down-step draws no riser face (camera stands above it)', () => {
    const { ren, mover, rects, strips } = build(null);
    mover.warpto(6.5, 7.5, -Math.PI / 2); // on the platform, well back, facing a pure drop-off
    mover.step(16);
    rects.length = 0;
    strips.length = 0;
    ren.renderframe();

    const bands = rects.filter((r) => r.w <= 8 && r.h > 4);
    expect(bands).toEqual([]);
    // No short-V riser strips: the down-step face is not rendered at all.
    const risers = strips.filter((s) => s[8] - s[7] > 0.02 && s[8] - s[7] < 0.5);
    expect(risers).toEqual([]);
  });

  test('a wall past a down-step is clamped to the step edge, not drawn as a wedge', () => {
    const { ren, mover, strips } = build(3); // wall on the lower floor at row 3 (face y=4)
    mover.warpto(6.5, 8.0, -Math.PI / 2); // well back on the platform, edge at y=5 (d_step=3)
    mover.step(16);
    strips.length = 0;
    ren.renderframe();

    // Step-edge occlusion line = projectY(runFloorH 0.2, d_step 3). The wall
    // (row 3, face y=4, d_wall 4) would otherwise reach projectY(0, 4), ~3px
    // below the edge -- a wedge over the platform. The clamp forbids it.
    const scy = VIEWH / 2;
    const edgeLine = scy + (0.2 + 0.5 - 0.2) * (VIEWH / 3);
    const unclampedWallBase = scy + (0.2 + 0.5) * (VIEWH / 4);
    expect(unclampedWallBase).toBeGreaterThan(edgeLine + 1); // the wedge is real pre-fix
    const worstBottom = Math.max(...strips.map((s) => s[3] + s[5] / 2));
    expect(worstBottom).toBeLessThanOrEqual(edgeLine + 1);
  });

  test('an up-step: the raised platform face IS drawn, textured at world scale', () => {
    const { ren, mover, rects, strips } = build(null); // open lower floor
    // Down on the lower floor, ~2 back from the platform's north edge (y=5),
    // facing south straight at it rising 0.2.
    mover.warpto(6.5, 3.0, Math.PI / 2);
    mover.step(16);
    rects.length = 0;
    strips.length = 0;
    ren.renderframe();

    const bands = rects.filter((r) => r.w <= 8 && r.h > 4);
    expect(bands).toEqual([]);

    // Riser strips: a 0.2-tall face textured at 1 tile / world unit -> source-V
    // span ~0.2, never the full 0..1 a wall column uses.
    const risers = strips.filter((s) => s[8] - s[7] > 0.05 && s[8] - s[7] < 0.4);
    expect(risers.length).toBeGreaterThan(10);
    for (const s of risers) {
      expect(s[7]).toBeGreaterThanOrEqual(0);
      expect(s[8]).toBeLessThanOrEqual(0.25);
    }
  });
});
