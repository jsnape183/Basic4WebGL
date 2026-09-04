import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard: the full-screen backdrop rect drawn at the top of every
// renderFrame() represents the unlit far distance (what a very long open
// sightline's floor/ceiling coverage doesn't quite reach) -- it must be a
// fixed value, not tied to wherever the camera currently stands. Before this
// fix, `bgLite` was RcLights.sampleCell(camCol, camRow) -- the CAMERA's own
// cell -- so the backdrop visibly brightened/dimmed as the player walked
// between differently-lit cells, even though nothing in front of them had
// actually changed. Reported as "the light source hasn't moved, the player
// has -- so this isn't static lighting".

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

function build(): { render: RcRenderLike; mover: RcMoverLike; lights: RcLightsLike; colors: Array<[number, number, number]> } {
  // 10x10 bordered room, wide open -- no walls anywhere near the two camera
  // spots below, so the very first backdrop rect is the thing under test.
  const walls = Array.from({ length: 10 }, (_, r) =>
    Array.from({ length: 10 }, (_, c) => (r === 0 || r === 9 || c === 0 || c === 9 ? 1 : 0)),
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

  const colors: Array<[number, number, number]> = [];
  _sb.setFillColor = (r: number, g: number, b: number) => {
    colors.push([r, g, b]);
  };
  _sb.drawRect = () => {};
  _sb.drawImageStrip = () => {};

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
  return { render, mover, lights, colors };
}

describe('renderFrame backdrop colour', () => {
  test('is independent of the camera cell -- not tied to wherever the player is standing', () => {
    const { render, mover, lights, colors } = build();
    lights.setambient(0.2);
    // A bright light at (2,2) -- far from the second camera spot below.
    lights.addpoint(2.5, 2.5, 0.5, 0.9, 3);
    lights.update();

    mover.warpto(2.5, 2.5, 0); // standing right in the bright light's own cell
    render.renderframe();
    const brightSpotBackdrop = colors[0];

    colors.length = 0;
    mover.warpto(7.5, 7.5, 0); // standing far from any light, near-ambient only
    render.renderframe();
    const darkSpotBackdrop = colors[0];

    expect(brightSpotBackdrop).toEqual(darkSpotBackdrop);
  });
});
