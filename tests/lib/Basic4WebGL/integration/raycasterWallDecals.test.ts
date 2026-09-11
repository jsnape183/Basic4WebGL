import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

// 5x5 room: perimeter walls, one decal on the north wall at (2,0), one plain
// wall at (3,0) with no decal.
const COLS = 5, ROWS = 5;
const walls: number[][] = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1 ? 1 : 0)),
);
const markers = [{ row: 0, col: 2, tag: 'decal:door.png' }];

function buildWorld(worldMarkers: Array<{ row: number; col: number; tag: string }> = markers) {
  const { files: ordered, error } = sortByDependencies([]);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files: ordered });
  expect(result.diagnostics).toEqual([]);

  const tw = 16;
  const stub: Record<string, unknown> = {};
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(t, p: string) { if (p === Symbol.toPrimitive || p === 'then') return undefined; if (p in t) return t[p]; return (..._a: unknown[]) => proxy; },
    set(t, p: string, v) { t[p] = v; return true; }, apply: () => proxy,
  };
  const proxy = new Proxy(function () {} as never, handler) as never;
  const _sb = new Proxy(stub, handler) as Record<string, unknown> & ((...a: unknown[]) => unknown);
  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.hasLayer = (_h: unknown, n: string) => n === 'walls';
  _sb.tileWidth = () => tw; _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => COLS * tw; _sb.tileMapHeightPx = () => ROWS * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) => walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => worldMarkers.map((m) => ({ ...m }));

  const deferred: Array<() => void> = [];
  _sb._deferModuleBody = (cb: () => void) => deferred.push(cb);
  const _createArray = (init: unknown[]) => (Array.isArray(init) && init.length === 1 && init[0] === 0 ? [] : [...(init ?? [])]);
  const helpers: Record<string, unknown> = {
    _sbLength: (x: { length?: number }) => x?.length ?? 0, _sbJoin: (x: unknown[], s: string) => x.join(s),
    _sbContains: (x: unknown[], i: unknown) => x.includes(i), _sbRemove: () => {}, _sbClear: (x: unknown[]) => x.splice(0),
    _sbCheckedArrayGet: (a: unknown[], i: number) => a[i], _createDict: () => new Map(),
  };
  const factory = new Function('_sb', '_createArray', ...Object.keys(helpers), 'console',
    `${result.code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset };`);
  const M = factory(_sb, _createArray, ...Object.values(helpers), { log() {}, warn() {}, error() {} });
  deferred.forEach((cb) => cb());

  return new M.RcWorld(new M.TileMapSet('c.stm'), 'walls');
}

describe('RcWorld — decal: marker', () => {
  test('decalAt returns the image name for a tagged cell', () => {
    const world = buildWorld();
    expect(world.decalat(2, 0)).toBe('door.png');
  });

  test('decalAt returns "" for a cell with no decal', () => {
    const world = buildWorld();
    expect(world.decalat(3, 0)).toBe('');
  });

  test('decalAt returns "" out of bounds', () => {
    const world = buildWorld();
    expect(world.decalat(-1, 0)).toBe('');
    expect(world.decalat(99, 99)).toBe('');
  });

  test('hasDecals is 1 when any cell carries a decal', () => {
    const world = buildWorld();
    expect(world.hasdecals()).toBe(1);
  });

  test('hasDecals is 0 when no cell carries a decal', () => {
    const world = buildWorld([]);
    expect(world.hasdecals()).toBe(0);
  });
});

function buildScene(decalTag: string | null, imgW: number, imgH: number) {
  const { files: ordered, error } = sortByDependencies([]);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files: ordered });
  expect(result.diagnostics).toEqual([]);

  // 40x40, camera far from the decal wall (not adjacent to it) -- mirrors
  // raycasterWallTexScale.test.ts's pose, needed for the same reason: a
  // camera right next to the wall saturates/clips the projected span against
  // the screen edges before the aspect-ratio math can be observed.
  const COLS2 = 40, ROWS2 = 40, tw = 16;
  const walls2: number[][] = Array.from({ length: ROWS2 }, (_, r) =>
    Array.from({ length: COLS2 }, (_, c) => (r === 0 || r === ROWS2 - 1 || c === 0 || c === COLS2 - 1 ? 1 : 0)),
  );
  // East wall, directly ahead of the camera's +x facing below.
  const markers2 = decalTag ? [{ row: 20, col: 39, tag: decalTag }] : [];

  const stub: Record<string, unknown> = {};
  const strips: unknown[][] = [];
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(t, p: string) { if (p === Symbol.toPrimitive || p === 'then') return undefined; if (p in t) return t[p]; return (..._a: unknown[]) => proxy; },
    set(t, p: string, v) { t[p] = v; return true; }, apply: () => proxy,
  };
  const proxy = new Proxy(function () {} as never, handler) as never;
  const _sb = new Proxy(stub, handler) as Record<string, unknown> & ((...a: unknown[]) => unknown);
  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.hasLayer = (_h: unknown, n: string) => n === 'walls';
  _sb.tileWidth = () => tw; _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => COLS2 * tw; _sb.tileMapHeightPx = () => ROWS2 * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) => walls2[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => markers2.map((m) => ({ ...m }));
  _sb.getStageWidth = () => 320; _sb.getStageHeight = () => 600;
  _sb.drawImageStrip = (...a: unknown[]) => { strips.push(a); };
  _sb.drawRect = () => {};
  _sb.registerLightmap = () => {}; _sb.registerFieldTiles = () => {}; _sb.drawPlaneField = () => {};
  _sb.imageWidth = (_n: string) => imgW;
  _sb.imageHeight = (_n: string) => imgH;

  const deferred: Array<() => void> = [];
  _sb._deferModuleBody = (cb: () => void) => deferred.push(cb);
  const _createArray = (init: unknown[]) => (Array.isArray(init) && init.length === 1 && init[0] === 0 ? [] : [...(init ?? [])]);
  const helpers: Record<string, unknown> = {
    _sbLength: (x: { length?: number }) => x?.length ?? 0, _sbJoin: (x: unknown[], s: string) => x.join(s),
    _sbContains: (x: unknown[], i: unknown) => x.includes(i), _sbRemove: () => {}, _sbClear: (x: unknown[]) => x.splice(0),
    _sbCheckedArrayGet: (a: unknown[], i: number) => a[i], _createDict: () => new Map(),
  };
  const factory = new Function('_sb', '_createArray', ...Object.keys(helpers), 'console',
    `${result.code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcRender: _sb_rcrender, RcMover: _sb_rcmover, RcSettings: _sb_rcsettings };`);
  const M = factory(_sb, _createArray, ...Object.values(helpers), { log() {}, warn() {}, error() {} });
  deferred.forEach((cb) => cb());

  // Raise the whole map's standard ceiling to 3 (instead of tagging just the
  // decal cell ceil:3): every other cell along the ray's path is standard
  // height, and a per-column occlusion window is clamped to the *lowest*
  // ceiling crossed en route -- a low corridor ceiling would clip the decal
  // strip before the aspect-ratio math could be observed, regardless of how
  // tall the decal's own wall is.
  const settings = new M.RcSettings();
  settings.setstdceil(3);

  const world = new M.RcWorld(new M.TileMapSet('c.stm'), 'walls');
  world.bindsettings(settings);
  const ren = new M.RcRender(world);
  ren.bindsettings(settings);
  const me = new M.RcMover(world, 1.5, 1.5, 0.3, 0.6);
  me.warpto(20.5, 20.5, 0); // angle 0 = facing +x, straight at the decal wall ~18.5 units away
  ren.bindcamera(me);
  ren.setwalltexture('rc_wall.png');
  ren.renderframe();
  return strips;
}

describe('RcRender — decal strips', () => {
  test('a square decal image draws a 1x1 co-planar strip, floor-anchored', () => {
    const strips = buildScene('decal:door.png', 64, 64);
    const decalStrips = strips.filter((s) => s[0] === 'door.png');
    expect(decalStrips.length).toBeGreaterThan(0);
    for (const s of decalStrips) {
      // srcVTop/srcVBot (indices 7, 8) span the whole image top-to-bottom.
      expect(s[7] as number).toBeCloseTo(0, 2);
      expect(s[8] as number).toBeCloseTo(1, 2);
    }
  });

  test('a taller-than-wide image scales the decal height by its aspect ratio', () => {
    const wideStrips = buildScene('decal:door.png', 64, 64);
    const tallStrips = buildScene('decal:door.png', 64, 128); // 2x taller
    // drawImageStrip's argument order is (image, srcX, destX, centerY, width,
    // height, tint, srcVTop, srcVBot) -- index 5 is the height, which grows
    // with decalH; a 2x taller image should project to roughly twice the
    // screen height at the same d. (Index 4 is RcConfig.RC_STRIP_W, a fixed
    // column width, not the decal's screen height.)
    const wideSpan = (wideStrips.find((s) => s[0] === 'door.png')?.[5] as number);
    const tallSpan = (tallStrips.find((s) => s[0] === 'door.png')?.[5] as number);
    expect(tallSpan).toBeGreaterThan(wideSpan * 1.7);
  });

  test('no decal markers -> no decal strips drawn', () => {
    const strips = buildScene(null, 64, 64);
    const decalStrips = strips.filter((s) => s[0] === 'door.png');
    expect(decalStrips.length).toBe(0);
  });
});
