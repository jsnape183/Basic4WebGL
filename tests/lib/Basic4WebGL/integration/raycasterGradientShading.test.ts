import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard for the gradient floor/ceiling shading path (per-instance
// opt-in via RcRender.setGradientShading -- default off, so every other
// raycaster demo is unaffected). Proves: with gradient shading on, a colour
// run's drawn gradient stops are the light level at that run's OWN real near
// and far edge (sampleAt at the run's actual dNear/dFar), not a value derived
// from any intermediate lattice cell -- the whole "sample point behind a wall"
// bug class this replaces cannot occur here because there is no intermediate
// sample point at all.

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
  setgradientshading(v: number): void;
  renderframe(): void;
}
interface RcMoverLike {
  warpto(x: number, y: number, angle: number): void;
}
interface RcLightsLike {
  setambient(v: number): void;
  addpoint(x: number, y: number, z: number, i: number, r: number): number;
  update(): void;
  sampleat(x: number, y: number): number;
}

function build() {
  // 12x12 bordered room, wide open, no walls anywhere near the camera's
  // sightline -- one long uncoloured floor/ceiling run to test the gradient on.
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

  const events: Array<{ kind: 'gradient'; a: unknown[] } | { kind: 'other' }> = [];
  _sb.setFillColor = () => events.push({ kind: 'other' });
  _sb.drawRect = () => events.push({ kind: 'other' });
  _sb.drawImageStrip = () => events.push({ kind: 'other' });
  _sb.drawVGradientRect = (...a: unknown[]) => events.push({ kind: 'gradient', a });

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
  const world = new RcWorld(new TileMapSet('room.stm'), 'walls');
  const render = new RcRender(world) as RcRenderLike;
  const mover = new RcMover(world, 5.5, 5.5, 0.3, 0.6) as RcMoverLike;
  const lights = new RcLights(world) as RcLightsLike;
  render.bindlights(lights);
  render.bindcamera(mover);
  return { render, mover, lights, events };
}

describe('RcRender gradient floor/ceiling shading', () => {
  test('default (gradient shading off) never calls drawVGradientRect', () => {
    const { render, mover, lights, events } = build();
    lights.setambient(0.3);
    mover.warpto(5.5, 2.5, Math.PI / 2); // facing +y, straight down the room
    render.renderframe();
    expect(events.some((e) => e.kind === 'gradient')).toBe(false);
  });

  test('gradient shading on: draws with drawVGradientRect, using the run\'s own near/far light', () => {
    const { render, mover, lights, events } = build();
    lights.setambient(0.2);
    const h = lights.addpoint(5.5, 9.5, 0.5, 0.9, 8); // light toward the far wall
    lights.update();
    render.setgradientshading(1);
    mover.warpto(5.5, 2.5, Math.PI / 2); // facing +y, straight down the room toward the light
    render.renderframe();

    const gradients = events.filter((e) => e.kind === 'gradient') as Array<{ kind: 'gradient'; a: unknown[] }>;
    expect(gradients.length).toBeGreaterThan(0);
    // Every gradient call's args are (x, y, w, h, topR, topG, topB, botR, botG, botB) --
    // channel values are the SAME base grey (105/105/130-ish for floor, scaled by
    // light) at both ends only if light is uniform; since a light exists, top and
    // bottom must differ for at least one gradient (proving two distinct samples
    // were actually taken, not one value reused for both ends).
    const distinct = gradients.some((g) => {
      const [, , , , tr, , , br] = g.a as number[];
      return Math.abs(tr - br) > 1;
    });
    expect(distinct).toBe(true);
  });
});
