import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

type Marker = { row: number; col: number; tag: string };
type TileAt = (h: unknown, px: number, py: number) => number;

// Transpile the whole softRaycaster package and hand back its classes,
// wired to a tilemap defined by `tileAt` (pixel coords) + `markers`.
function loadPkg(tileAt: TileAt, markers: Marker[], cols: number, rows: number) {
  const tw = 16;
  const { files: ordered, error } = sortByDependencies([]);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files: ordered });
  expect(result.diagnostics).toEqual([]);

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
  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.hasLayer = (_h: unknown, n: string) => n === 'walls';
  _sb.tileWidth = () => tw;
  _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => cols * tw;
  _sb.tileMapHeightPx = () => rows * tw;
  _sb.tileAt = tileAt;
  _sb.allMarkers = () => markers.map((m) => ({ ...m }));
  _sb.getStageWidth = () => 320;
  _sb.getStageHeight = () => 200;

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
    `${result.code}\n; return { RcSettings: _sb_rcsettings, RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcCast: _sb_rccast, RcMover: _sb_rcmover, RcLights: _sb_rclights, RcRender: _sb_rcrender };`,
  );
  const M = factory(_sb, _createArray, ...Object.values(helpers), { log() {}, warn() {}, error() {} });
  deferred.forEach((cb) => cb());
  return M as {
    RcSettings: new () => any;
    RcWorld: new (tm: any, layer: string) => any;
    TileMapSet: new (name: string) => any;
    RcCast: new () => any;
    RcMover: new (w: any, x: number, y: number, r: number, h: number) => any;
    RcLights: new (w: any) => any;
    RcRender: new (w: any) => any;
  };
}

const empty: TileAt = () => 0;

describe('RcSettings', () => {
  test('every getter returns the RcConfig default', () => {
    const { RcSettings } = loadPkg(empty, [], 12, 10);
    const s = new RcSettings();
    expect(s.movespeed()).toBe(2.6);
    expect(s.turnspeed()).toBe(2.4);
    expect(s.lookspeed()).toBe(400.0);
    expect(s.gravity()).toBe(14.0);
    expect(s.jumpvel()).toBe(5.0);
    expect(s.stepup()).toBe(0.35);
    expect(s.maxstepdt()).toBe(0.1);
    expect(s.maxpitch()).toBe(220);
    expect(s.eyez()).toBe(0.5);
    expect(s.maxdist()).toBe(32);
    expect(s.staticlightrange()).toBe(6);
    expect(s.lightcap()).toBe(4);
    expect(s.staticlightintensity()).toBe(0.9);
    expect(s.lightdefaultz()).toBe(0.85);
    expect(s.stdceil()).toBe(1.0);
    expect(s.surflightstep()).toBe(0.12);
    expect(s.surfsegmax()).toBe(6);
    expect(s.actorheight()).toBe(1.0);
  });

  test('each setter updates its getter (all 18 knobs)', () => {
    const { RcSettings } = loadPkg(empty, [], 12, 10);
    const knobs: Array<[string, string, number]> = [
      ['movespeed', 'setmovespeed', 3.4],
      ['turnspeed', 'setturnspeed', 1.1],
      ['lookspeed', 'setlookspeed', 250],
      ['gravity', 'setgravity', 40],
      ['jumpvel', 'setjumpvel', 7.5],
      ['stepup', 'setstepup', 0.2],
      ['maxstepdt', 'setmaxstepdt', 0.05],
      ['maxpitch', 'setmaxpitch', 180],
      ['eyez', 'seteyez', 1.5],
      ['maxdist', 'setmaxdist', 48],
      ['staticlightrange', 'setstaticlightrange', 9],
      ['lightcap', 'setlightcap', 8],
      ['staticlightintensity', 'setstaticlightintensity', 1.4],
      ['lightdefaultz', 'setlightdefaultz', 2.4],
      ['stdceil', 'setstdceil', 3.0],
      ['surflightstep', 'setsurflightstep', 0.2],
      ['surfsegmax', 'setsurfsegmax', 10],
      ['actorheight', 'setactorheight', 1.8],
    ];
    const s = new RcSettings() as Record<string, (v?: number) => number>;
    for (const [get, set, probe] of knobs) {
      s[set](probe);
      expect(s[get]()).toBe(probe);
    }
  });
});

describe('RcCast honours cfg.maxDist', () => {
  // 40-wide corridor, wall at col 20. Ray east from (1.5,1.5): perp dist ~18.5.
  const tileAt = (_h: unknown, px: number, py: number) => {
    const c = Math.floor(px / 16), r = Math.floor(py / 16);
    if (r === 0 || r === 2 || c === 0) return 1;
    return c === 20 ? 1 : 0;
  };

  test('the wall is seen at default maxDist, gone below it, back above it', () => {
    const { RcWorld, TileMapSet, RcCast, RcSettings } = loadPkg(tileAt, [], 40, 3);
    const world = new RcWorld(new TileMapSet('c.stm'), 'walls');
    const cast = new RcCast();

    cast.cast(world, 1.5, 1.5, 1, 0);
    expect(cast.spancount()).toBeGreaterThan(0);       // wall at ~18.5 < default 32

    const near = new RcSettings();
    near.setmaxdist(10);
    cast.bindsettings(near);
    cast.cast(world, 1.5, 1.5, 1, 0);
    expect(cast.spancount()).toBe(0);                  // ~18.5 > 10

    near.setmaxdist(50);
    cast.cast(world, 1.5, 1.5, 1, 0);
    expect(cast.spancount()).toBeGreaterThan(0);       // back in range
  });
});
