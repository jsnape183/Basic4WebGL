import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Direct empirical check of a very specific claim: "things appear light
// further away and grow darker as you approach" -- i.e. does the rendered
// floor/ceiling brightness ahead of the camera actually DECREASE as the
// camera walks toward a light source it's heading straight for? It must not
// -- approaching a light should only ever brighten (or hold steady), never
// dim, for a purely static light field.

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
  renderframe(): void;
}
interface RcMoverLike {
  warpto(x: number, y: number, angle: number): void;
}
interface RcLightsLike {
  setambient(v: number): void;
  addpoint(x: number, y: number, z: number, i: number, r: number): number;
  update(): void;
}

function build() {
  // A long, straight, open corridor: 30 cells long, 3 wide, bordered by walls.
  const W = 30;
  const H = 5;
  const walls: number[][] = Array.from({ length: H }, (_, r) =>
    Array.from({ length: W }, (_, c) => (r === 0 || r === H - 1 || c === 0 || c === W - 1 ? 1 : 0)),
  );

  const code = transpileP5();
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
  _sb.allMarkers = () => [];
  _sb.getStageWidth = () => 320;
  _sb.getStageHeight = () => 200;

  const events: Array<{ kind: 'color'; r: number; g: number; b: number } | { kind: 'rect'; a: unknown[] }> = [];
  _sb.setFillColor = (r: number, g: number, b: number) => {
    events.push({ kind: 'color', r, g, b });
  };
  _sb.drawRect = (...a: unknown[]) => {
    events.push({ kind: 'rect', a });
  };
  _sb.drawImageStrip = () => {
    events.push({ kind: 'rect', a: ['WALL'] });
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
  const world = new RcWorld(new TileMapSet('corridor.stm'), 'walls');
  const render = new RcRender(world) as RcRenderLike;
  const mover = new RcMover(world, 2.5, 2.5, 0.3, 0.6) as RcMoverLike;
  const lights = new RcLights(world) as RcLightsLike;
  render.bindlights(lights);
  render.bindcamera(mover);
  return { render, mover, lights, events };
}

function meanFloorBrightness(events: Array<{ kind: string; r?: number; g?: number; b?: number; a?: unknown[] }>): number {
  let curColor = { r: 0, g: 0, b: 0 };
  let total = 0;
  let count = 0;
  for (const e of events) {
    if (e.kind === 'color') curColor = e as { r: number; g: number; b: number };
    else if ((e.a as unknown[])[0] !== 'WALL') {
      total += curColor.r + curColor.g + curColor.b;
      count += 1;
    }
  }
  return count > 0 ? total / count : NaN;
}

describe('approaching a static light', () => {
  test('rendered brightness ahead increases (or holds), never decreases, as the camera gets closer', () => {
    const { render, mover, lights, events } = build();
    lights.setambient(0.05);
    // Light sits far down the corridor, near the far end (x=27), dead centre.
    const lightHandle = lights.addpoint(27.5, 2.5, 0.5, 0.95, 6);
    lights.update();

    // Walk the camera straight down the corridor toward the light, facing it
    // the whole time, sampling render brightness at each stop.
    const positions = [3.5, 8.5, 13.5, 18.5, 22.5, 25.5];
    const brightness: number[] = [];
    for (const x of positions) {
      mover.warpto(x, 2.5, 0); // angle 0 = facing +x, straight down the corridor
      events.length = 0;
      render.renderframe();
      brightness.push(meanFloorBrightness(events));
    }

    console.log('camera x -> mean floor/ceiling brightness:', positions.map((x, i) => `${x}:${brightness[i].toFixed(2)}`).join('  '));

    // Distance to the light strictly decreases across these stops, so mean
    // brightness of what's rendered must be non-decreasing at every step.
    for (let i = 1; i < brightness.length; i++) {
      expect(brightness[i]).toBeGreaterThanOrEqual(brightness[i - 1] - 0.001);
    }
  });
});
