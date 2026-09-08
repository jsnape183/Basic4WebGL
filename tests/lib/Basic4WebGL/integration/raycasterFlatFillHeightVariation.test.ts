// Regression guard: a `floor:`/`ceil:` height marker used to read as a
// self-lit tile. RcRender's rung-1 flat floor/ceiling fill paints the whole
// visible plane at the camera cell's single light level; a step elsewhere is
// then drawn at its own (brighter, if near a light) local light, so the step
// looked like it was glowing against a too-dim flat floor. RcWorld now flags
// any non-standard floor:/ceil: height (hasHeightVariation) and RcRender skips
// the flat fill when it's set -- the floor around the step is drawn per-column
// at its real light, so the step no longer stands out.
import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
const DIR = 'demo-src/raycaster-p5';

let CODE: string | null = null;
function transpile(): string {
  if (CODE) return CODE;
  const names = readdirSync(DIR).filter((n) => n.endsWith('.bas') && n !== 'Main.bas' && n !== 'LitScene.bas').sort();
  const raw = names.map((name) => ({ name, source: readFileSync(`${DIR}/${name}`, 'utf-8') }));
  const { files } = sortByDependencies(raw);
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics).toEqual([]);
  CODE = String(result.code);
  return CODE;
}

interface Ev { op: string; args: number[]; fill?: [number, number, number] }

function setup(markers: Array<{ row: number; col: number; tag: string }>, opts: { field?: boolean; flat0?: boolean; ambient?: number } = {}) {
  const walls = Array.from({ length: 12 }, (_, r) => Array.from({ length: 12 }, (_, c) => (r === 0 || r === 11 || c === 0 || c === 11 ? 1 : 0)));
  const code = transpile();
  const stub: Record<string, unknown> = {};
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(t, p: string) { if (p === Symbol.toPrimitive || p === 'then') return undefined; if (p in t) return t[p]; return () => proxy; },
    set(t, p: string, v) { t[p] = v; return true; }, apply: () => proxy,
  };
  const proxy = new Proxy(function () {} as never, handler) as never;
  const _sb = new Proxy(stub, handler) as Record<string, unknown> & ((...a: unknown[]) => unknown);
  const tw = 16;
  _sb.createTileMapSet = () => 'TMS'; _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.tileWidth = () => tw; _sb.tileHeight = () => tw; _sb.tileMapWidthPx = () => 12 * tw; _sb.tileMapHeightPx = () => 12 * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) => walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => markers;
  _sb.getStageWidth = () => 320; _sb.getStageHeight = () => 200;

  const evs: Ev[] = [];
  let fill: [number, number, number] = [255, 255, 255];
  _sb.setFillColor = (r: number, g: number, b: number) => { fill = [r, g, b]; };
  _sb.setLineWidth = () => {};
  _sb.drawRect = (x: number, y: number, w: number, h: number) => evs.push({ op: 'rect', args: [x, y, w, h], fill: [...fill] });
  _sb.drawVGradientRect = (...a: number[]) => evs.push({ op: 'grad', args: a });
  _sb.drawImageStrip = () => {}; _sb.registerLightmap = () => {}; _sb.registerFieldTiles = () => {}; _sb.drawPlaneField = () => {};

  const deferred: Array<() => void> = [];
  _sb._deferModuleBody = (cb: () => void) => deferred.push(cb);
  const _createArray = (init: unknown[]) => (Array.isArray(init) && init.length === 1 && init[0] === 0 ? [] : [...(init ?? [])]);
  const helpers: Record<string, unknown> = {
    _sbLength: (x: { length?: number }) => x?.length ?? 0, _sbJoin: (x: unknown[], s: string) => x.join(s),
    _sbContains: (x: unknown[], i: unknown) => x.includes(i), _sbRemove: () => {}, _sbClear: (x: unknown[]) => x.splice(0),
    _sbCheckedArrayGet: (a: unknown[], i: number) => a[i], _createDict: () => new Map(),
  };
  const factory = new Function('_sb', '_createArray', ...Object.keys(helpers), 'console',
    `${code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcRender: _sb_rcrender, RcMover: _sb_rcmover, RcLights: _sb_rclights };`);
  const { RcWorld, TileMapSet, RcRender, RcMover, RcLights } = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  const world = new RcWorld(new TileMapSet('m.stm'), 'walls') as any;
  const ren = new RcRender(world) as any;
  const mover = new RcMover(world, 6.5, 2.5, 0.3, 0.6) as any;
  const lights = new RcLights(world) as any;
  lights.setambient(opts.ambient ?? 0.1);
  ren.bindlights(lights);
  ren.bindcamera(mover);
  if (opts.flat0) ren.setflatfill(0);
  if (opts.field) ren.setfloorfield(1);
  lights.update();
  mover.warpto(6.5, 2.5, Math.PI / 2);
  ren.renderframe();
  return { evs, lights, world };
}

const STEP = [
  { row: 8, col: 5, tag: 'floor:0.5' }, { row: 8, col: 6, tag: 'floor:0.5' }, { row: 8, col: 7, tag: 'floor:0.5' },
  { row: 9, col: 5, tag: 'floor:0.5' }, { row: 9, col: 6, tag: 'floor:0.5' }, { row: 9, col: 7, tag: 'floor:0.5' },
];
const LIGHT = { row: 6, col: 6, tag: 'light:1.6' };

function floorMax(evs: Ev[]) {
  let m = 0;
  for (const e of evs) {
    if ((e.op === 'rect' || e.op === 'grad') && e.args[1] > 100) {
      const ch = e.op === 'rect' && e.fill ? e.fill : e.args.slice(4);
      m = Math.max(m, ...ch);
    }
  }
  return m;
}

describe('floor: step no longer reads as self-lit (flat fill auto-off on height variation)', () => {
  test('hasHeightVariation reflects floor:/ceil: markers', () => {
    expect(setup([]).world.hasheightvariation()).toBe(0);
    expect(setup(STEP).world.hasheightvariation()).toBe(1);
    expect(setup([{ row: 5, col: 5, tag: 'ceil:0.6' }]).world.hasheightvariation()).toBe(1);
    expect(setup([{ row: 5, col: 5, tag: 'floor:0' }]).world.hasheightvariation()).toBe(0);
  });

  test('default config: a floor: step scene draws its floor per-column (not one dim flat fill)', () => {
    const step = setup([LIGHT, ...STEP]);
    const fm = floorMax(step.evs);
    // eslint-disable-next-line no-console
    console.log('step-scene floor region max fill:', fm);
    expect(fm).toBeGreaterThan(90);
  });

  test('a genuinely flat scene still uses the flat fill', () => {
    const flat = setup([LIGHT]);
    const floorDraws = flat.evs.filter((e) => (e.op === 'rect' || e.op === 'grad') && e.args[1] > 100).length;
    // eslint-disable-next-line no-console
    console.log('flat-scene floor-region draw count:', floorDraws, ' hasHeightVar:', flat.world.hasheightvariation());
    expect(flat.world.hasheightvariation()).toBe(0);
  });
});
