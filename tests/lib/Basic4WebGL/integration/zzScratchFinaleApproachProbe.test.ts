import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Scratch probe: walk the REAL camera path through the REAL finale.stm (hub
// corridor -> Torch Hall entrance -> staircase trough -> dais), using the
// REAL baked static lights, and track mean rendered brightness at each stop.
// Investigating: "things appear light further away and grow darker as you
// approach" -- reproduce on the actual map + actual lights, not a synthetic
// single-light corridor (which showed no inversion).

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
const DIR = 'demo-src/raycaster-p10-finale';

function transpileFinale(): string {
  const names = readdirSync(DIR)
    .filter((n) => n.endsWith('.bas') && n !== 'Main.bas' && n !== 'FinaleScene.bas')
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
  setwalltexture(t: string): void;
  setflatfill(v: number): void;
  renderframe(): void;
}
interface RcMoverLike {
  warpto(x: number, y: number, angle: number): void;
}

function meanBrightness(events: Array<{ kind: string; r?: number; g?: number; b?: number; a?: unknown[] }>): number {
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

describe('finale real-map approach probe (scratch)', () => {
  test('walking hub -> torch hall -> dais: does brightness ever dip then peak unexpectedly ahead of schedule', () => {
    const stm = JSON.parse(readFileSync(`${DIR}/assets/finale.stm`, 'utf-8'));
    const walls: number[][] = stm.layers.walls;
    const markers: Array<{ row: number; col: number; tag: string }> = stm.layers.tags.markers;

    const code = transpileFinale();
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
    const world = new RcWorld(new TileMapSet('finale.stm'), 'walls');
    const render = new RcRender(world) as RcRenderLike;
    const mover = new RcMover(world, 18.5, 15.5, 0.3, 0.6) as RcMoverLike;
    const lights = new RcLights(world);
    render.bindlights(lights);
    render.bindcamera(mover);
    render.setwalltexture('rc_tex_concrete.png');
    render.setflatfill(0);

    // Walk east along row 15.5 from the hub corridor, through Torch Hall's
    // entrance (light at col23), across the staircase trough (24-26), to the
    // dais (light at col28). angle=0 => facing +x (east), matches direction
    // of travel exactly.
    const positions = [17.5, 19.5, 21.5, 22.5, 23.5, 24.5, 25.5, 26.5, 27.5, 28.5];
    const brightness: number[] = [];
    for (const x of positions) {
      mover.warpto(x, 15.5, 0);
      events.length = 0;
      render.renderframe();
      brightness.push(meanBrightness(events));
    }
    console.log(
      'x -> mean brightness:',
      positions.map((x, i) => `${x}:${brightness[i].toFixed(2)}`).join('  '),
    );
    expect(true).toBe(true);
  });
});
