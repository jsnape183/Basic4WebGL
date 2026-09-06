import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard for the per-pixel floor-field renderer (per-instance opt-in
// via RcRender.setFloorField -- default off, so every other raycaster demo is
// byte-identical). Proves: default off never touches the floorcaster; on, it
// bakes exactly one floor + one ceiling lightmap (once, not per frame) and
// emits one drawPlaneField per plane per frame at a fixed planeZ.

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

interface RcRenderLike {
  bindlights(l: unknown): void;
  bindcamera(m: unknown): void;
  setfloorfield(v: number): void;
  renderframe(): void;
}
interface RcMoverLike { warpto(x: number, y: number, angle: number): void }
interface RcLightsLike { setambient(v: number): void; addpoint(x: number, y: number, z: number, i: number, r: number): number; update(): void }

function build(markers: Array<{ row: number; col: number; tag: string }> = []) {
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
    set(t, p: string, v) { t[p] = v; return true; },
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
  _sb.getStageWidth = () => 320;
  _sb.getStageHeight = () => 200;

  const lightmaps: unknown[] = [];
  const tileAtlases: Array<{ id: unknown; cols: unknown; rows: unknown; names: unknown; colors: unknown }> = [];
  const planes: unknown[][] = [];
  let rects = 0;
  _sb.setFillColor = () => {};
  _sb.drawRect = () => { rects++; };
  _sb.drawImageStrip = () => {};
  _sb.registerLightmap = (id: unknown) => { lightmaps.push(id); };
  _sb.registerFieldTiles = (id: unknown, cols: unknown, rows: unknown, names: unknown, colors: unknown) => {
    tileAtlases.push({ id, cols, rows, names, colors });
  };
  _sb.drawPlaneField = (...a: unknown[]) => { planes.push(a); };

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
    `${code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcRender: _sb_rcrender, RcMover: _sb_rcmover, RcLights: _sb_rclights };`,
  );
  const { RcWorld, TileMapSet, RcRender, RcMover, RcLights } = factory(
    _sb, _createArray, ...Object.values(helpers), { log() {} },
  );
  deferred.forEach((cb) => cb());
  const world = new RcWorld(new TileMapSet('room.stm'), 'walls');
  const render = new RcRender(world) as RcRenderLike;
  const mover = new RcMover(world, 5.5, 5.5, 0.3, 0.6) as RcMoverLike;
  const lights = new RcLights(world) as RcLightsLike;
  render.bindlights(lights);
  render.bindcamera(mover);
  return { render, mover, lights, lightmaps, tileAtlases, planes, rects: () => rects };
}

describe('RcRender per-pixel floor field', () => {
  test('default (floor field off) never bakes a lightmap or calls drawPlaneField', () => {
    const { render, mover, lights, lightmaps, planes } = build();
    lights.setambient(0.3);
    mover.warpto(5.5, 2.5, Math.PI / 2);
    render.renderframe();
    expect(lightmaps).toEqual([]);
    expect(planes).toEqual([]);
  });

  test('floor field on: bakes one floor + one ceiling lightmap, emits one plane each per frame', () => {
    const { render, mover, lights, lightmaps, planes, rects } = build();
    lights.setambient(0.2);
    lights.addpoint(5.5, 9.5, 0.5, 0.9, 8);
    lights.update();
    render.setfloorfield(1);
    mover.warpto(5.5, 2.5, Math.PI / 2);
    render.renderframe();

    expect(lightmaps).toEqual(['rc_ff_floor', 'rc_ff_ceil']);
    // one floor plane (planeZ 0) + one ceiling plane (planeZ RC_STD_CEIL == 1)
    // args: fieldId, texName, tilesId, planeZ, camX, camY, camZ, ...
    expect(planes.length).toBe(2);
    expect(planes[0][1]).toBe(''); // no scene texture -> procedural checker
    expect(planes[0][2]).toBe(''); // no ftex: markers -> no per-cell atlas
    expect(planes[0][3]).toBe(0);
    expect(planes[1][3]).toBe(1);
    expect(planes[0][4]).toBeCloseTo(5.5, 5); // camX
    // walls still render
    expect(rects()).toBeGreaterThan(0);
  });

  test('ftex: markers -> registerFieldTiles once + the atlas id threaded into the floor plane', () => {
    const { render, mover, lights, tileAtlases, planes } = build([
      { row: 5, col: 5, tag: 'ftex:stone.png' },
      { row: 5, col: 6, tag: 'ftex:stone.png' },
    ]);
    lights.setambient(0.2);
    render.setfloorfield(1);
    mover.warpto(5.5, 2.5, Math.PI / 2);
    render.renderframe();
    render.renderframe();

    expect(tileAtlases.map((a) => a.id)).toEqual(['rc_ff_floor_tiles']); // floor only, once
    const atlas = tileAtlases[0];
    expect(atlas.cols).toBe(12);
    expect(atlas.rows).toBe(12);
    expect((atlas.names as string[])[5 * 12 + 5]).toBe('stone.png');
    expect((atlas.names as string[])[0]).toBe('');
    // floor plane's tilesId arg is the atlas; ceiling's is still ""
    expect(planes[0][2]).toBe('rc_ff_floor_tiles');
    expect(planes[1][2]).toBe('');
  });

  test('fcol: markers feed the field too -- per-cell flat colour in the atlas, no strip-path colour exclusion', () => {
    const { render, mover, lights, tileAtlases, planes } = build([
      { row: 5, col: 5, tag: 'fcol:3366cc' },
      { row: 5, col: 6, tag: 'fcol:3366cc' },
    ]);
    lights.setambient(0.2);
    render.setfloorfield(1);
    mover.warpto(5.5, 2.5, Math.PI / 2);
    render.renderframe();

    expect(tileAtlases.map((a) => a.id)).toEqual(['rc_ff_floor_tiles']);
    const colors = tileAtlases[0].colors as number[];
    expect(colors[5 * 12 + 5]).toBe(0x3366cc); // packed rgb
    expect(colors[0]).toBe(-1); // no colour
    expect(planes[0][2]).toBe('rc_ff_floor_tiles');
  });

  test('lightmaps are baked once, not per frame', () => {
    const { render, mover, lights, lightmaps, planes } = build();
    lights.setambient(0.2);
    render.setfloorfield(1);
    mover.warpto(5.5, 2.5, Math.PI / 2);
    render.renderframe();
    render.renderframe();
    render.renderframe();
    expect(lightmaps).toEqual(['rc_ff_floor', 'rc_ff_ceil']); // still just the one bake
    expect(planes.length).toBe(6); // 2 planes x 3 frames
  });
});
