import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

const COLS = 40, ROWS = 40;
const walls: number[][] = Array.from({ length: ROWS }, (_, r) =>
  Array.from({ length: COLS }, (_, c) => (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1 ? 1 : 0)),
);
const markers: Array<{ row: number; col: number; tag: string }> = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) markers.push({ row: r, col: c, tag: 'ceil:3' });

function build(scale: number | null) {
  const { files: ordered, error } = sortByDependencies([]);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files: ordered });
  expect(result.diagnostics).toEqual([]);

  const tw = 16;
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
  _sb.tileMapWidthPx = () => COLS * tw; _sb.tileMapHeightPx = () => ROWS * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) => walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => markers.map((m) => ({ ...m }));
  _sb.getStageWidth = () => 320; _sb.getStageHeight = () => 600;
  _sb.drawImageStrip = (...a: unknown[]) => { strips.push(a); };
  _sb.drawRect = () => {};
  _sb.registerLightmap = () => {}; _sb.registerFieldTiles = () => {}; _sb.drawPlaneField = () => {};

  const deferred: Array<() => void> = [];
  _sb._deferModuleBody = (cb: () => void) => deferred.push(cb);
  const _createArray = (init: unknown[]) => (Array.isArray(init) && init.length === 1 && init[0] === 0 ? [] : [...(init ?? [])]);
  const helpers: Record<string, unknown> = {
    _sbLength: (x: { length?: number }) => x?.length ?? 0, _sbJoin: (x: unknown[], s: string) => x.join(s),
    _sbContains: (x: unknown[], i: unknown) => x.includes(i), _sbRemove: () => {}, _sbClear: (x: unknown[]) => x.splice(0),
    _sbCheckedArrayGet: (a: unknown[], i: number) => a[i], _createDict: () => new Map(),
  };
  const factory = new Function('_sb', '_createArray', ...Object.keys(helpers), 'console',
    `${result.code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcRender: _sb_rcrender, RcMover: _sb_rcmover };`);
  const M = factory(_sb, _createArray, ...Object.values(helpers), { log() {}, warn() {}, error() {} });
  deferred.forEach((cb) => cb());

  const world = new M.RcWorld(new M.TileMapSet('c.stm'), 'walls');
  const ren = new M.RcRender(world);
  const me = new M.RcMover(world, 1.5, 1.5, 0.3, 0.6);
  me.warpto(20.5, 20.5, 0);
  ren.bindcamera(me);
  ren.setwalltexture('rc_wall.png');
  if (scale !== null) ren.setwalltexscale(scale);
  ren.renderframe();
  return strips;
}

describe('RcRender.setWallTexScale', () => {
  test('default (0): one texture copy stretched over the wall — V span ~= 1', () => {
    const strips = build(null);
    expect(strips.length).toBeGreaterThan(0);
    for (const s of strips) {
      // legacy stretch: exactly V 0 at the ceiling, V 1 at the floor.
      expect(s[7] as number).toBeCloseTo(0, 3);
      expect(s[8] as number).toBeCloseTo(1, 3);
    }
  });

  test('scale 1 on a ceil:3 wall: texture repeats 3x — V span 3, floor-anchored', () => {
    const strips = build(1);
    expect(strips.length).toBeGreaterThan(0);
    for (const s of strips) {
      const span = (s[8] as number) - (s[7] as number);
      expect(span).toBeCloseTo(3, 2);
      // floor-anchored: the bottom edge sits on an integer tile seam.
      const vb = s[8] as number;
      expect(Math.abs(vb - Math.round(vb))).toBeLessThan(0.01);
    }
  });

  test('scale 2 on a ceil:3 wall: V span 1.5', () => {
    const strips = build(2);
    for (const s of strips) {
      const span = (s[8] as number) - (s[7] as number);
      expect(span).toBeCloseTo(1.5, 2);
    }
  });
});
