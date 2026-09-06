import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
const DIR = 'demo-src/raycaster-p10-finale';

function transpileFinale(flatFill = true): string {
  const names = readdirSync(DIR)
    .filter((n) => n.endsWith('.bas') && n !== 'Main.bas' && n !== 'FinaleScene.bas')
    .sort();
  const raw = names.map((name) => {
    let source = readFileSync(`${DIR}/${name}`, 'utf-8');
    if (!flatFill && name === 'RcConfig.bas') {
      const patched = source.replace('RC_FLAT_FILL = 1', 'RC_FLAT_FILL = 0');
      if (patched === source) throw new Error('RC_FLAT_FILL pattern not found');
      source = patched;
    }
    if (process.env.SURF_STEP && name === 'RcConfig.bas') {
      const patched = source.replace('RC_SURF_LIGHT_STEP = 0.12', `RC_SURF_LIGHT_STEP = ${process.env.SURF_STEP}`);
      if (patched === source) throw new Error('RC_SURF_LIGHT_STEP pattern not found');
      source = patched;
    }
    return { name, source };
  });
  const { files, error } = sortByDependencies(raw);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics).toEqual([]);
  return String(result.code);
}

interface RcWorldLike {
  wallat(col: number, row: number): number;
  floorheightat(col: number, row: number): number;
  ceilheightat(col: number, row: number): number;
  floorcolat(col: number, row: number): number;
  hassurfacecolor(): number;
  diagat(col: number, row: number): number;
  widthcells(): number;
  heightcells(): number;
}
interface RcRenderLike {
  bindlights(l: unknown): void;
  bindcamera(m: unknown): void;
  setwalltexture(t: string): void;
  setflatfill(v: number): void;
  renderframe(): void;
  columncount(): number;
}
interface RcMoverLike {
  x(): number;
  y(): number;
  angle(): number;
  pitch(): number;
  z(): number;
}
interface RcLightsLike {
  setambient(v: number): void;
  addpoint(x: number, y: number, z: number, i: number, r: number): number;
  setlightfalloff(h: number, kind: number): void;
  movelight(h: number, x: number, y: number): void;
  update(): void;
}

describe('finale renderFrame probe (scratch)', () => {
  test('capture fill colours drawn while facing south out of the North room', () => {
    const stm = JSON.parse(readFileSync(`${DIR}/assets/finale.stm`, 'utf-8'));
    const walls: number[][] = stm.layers.walls;
    const markers: Array<{ row: number; col: number; tag: string }> = stm.layers.tags.markers;

    const code = transpileFinale(process.env.FLAT_FILL !== '0');
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
    _sb.allMarkers = () => markers.map((m) => ({ ...m }));
    _sb.getStageWidth = () => 320;
    _sb.getStageHeight = () => 200;

    const events: Array<{ kind: 'color'; r: number; g: number; b: number } | { kind: 'rect'; a: unknown[] }> = [];
    _sb.setFillColor = (r: number, g: number, b: number) => {
      events.push({ kind: 'color', r, g, b });
    };
    _sb.drawRect = (...a: unknown[]) => {
      events.push({ kind: 'rect', a });
    };
    _sb.drawImageStrip = (...a: unknown[]) => {
      events.push({ kind: 'rect', a: ['WALL', ...a] });
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
      `${code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcRender: _sb_rcrender, RcMover: _sb_rcmover, RcLights: _sb_rclights };`,
    );
    const { RcWorld, TileMapSet, RcRender, RcMover, RcLights } = factory(
      _sb,
      _createArray,
      ...Object.values(helpers),
      { log() {} },
    );
    deferred.forEach((cb) => cb());

    const world = new RcWorld(new TileMapSet('finale.stm'), 'walls') as RcWorldLike;
    const render = new RcRender(world) as RcRenderLike;
    const px = 15.5;
    const py = 8.5;
    const mover = new RcMover(world, px, py, 0.3, 0.6) as unknown as RcMoverLike & {
      turn(a: number): void;
    };
    const lights = new RcLights(world) as RcLightsLike;
    lights.setambient(0.05);
    const linearMode = process.env.LINEAR_MODE === '1';
    const torch = lights.addpoint(px, py, 0.5, 0.95, linearMode ? 6 : 4);
    if (!linearMode) lights.setlightfalloff(torch, 1); // RC_FALLOFF_QUADRATIC
    lights.update();

    render.bindlights(lights);
    render.bindcamera(mover);
    render.setwalltexture('rc_tex_concrete.png');
    render.setflatfill(0); // exactly what FinaleScene.bas now calls in onenter

    // Face south (increasing row) -- out of the North room toward the corridor.
    (mover as unknown as { turn(a: number): void }).turn(Math.PI / 2);

    events.length = 0;
    render.renderframe();

    // Pair each setFillColor with the rect/strip that follows it.
    let curColor = { r: 255, g: 255, b: 255 };
    const draws: Array<{ r: number; g: number; b: number; a: unknown[] }> = [];
    for (const e of events) {
      if (e.kind === 'color') curColor = e;
      else draws.push({ ...curColor, a: e.a });
    }

    const floorDraws = draws.filter((d) => d.a[0] !== 'WALL');
    const sorted = [...floorDraws].sort((a, b) => a.r + a.g + a.b - (b.r + b.g + b.b));
    console.log(`total draws: ${draws.length}, floor/ceil draws: ${floorDraws.length}`);
    console.log('darkest 25 floor/ceil draws (color, [destX, centerY, w, h]):');
    sorted.slice(0, 25).forEach((d) => console.log(`(${d.r.toFixed(1)},${d.g.toFixed(1)},${d.b.toFixed(1)})`, d.a));
    console.log('brightest 10 floor/ceil draws:');
    sorted.slice(-10).forEach((d) => console.log(`(${d.r.toFixed(1)},${d.g.toFixed(1)},${d.b.toFixed(1)})`, d.a));

    const nearBlack = floorDraws.filter((d) => d.r < 3 && d.g < 3 && d.b < 3);
    console.log(`near-black floor/ceil draws: ${nearBlack.length}`);

    const byHeight = [...floorDraws].sort((a, b) => (b.a[3] as number) - (a.a[3] as number));
    console.log('largest 10 rects by height (colour, [destX, centerY, w, h]):');
    byHeight.slice(0, 10).forEach((d) => console.log(`(${d.r.toFixed(1)},${d.g.toFixed(1)},${d.b.toFixed(1)})`, d.a));

    expect(true).toBe(true);
  });
});
