import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Scratch probe: does the real finale render actually vary floor/ceiling
// brightness ACROSS screen columns (lateral, left-to-right) when looking down
// a corridor, or does it draw one uniform value per colour run regardless of
// column? Diagnosing "light flows down the corridor as a straight rectangle,
// not fanning out."

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));
const DIR = 'demo-src/raycaster-p10-finale';

function transpile(): string {
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
  setgradientshading(v: number): void;
  renderframe(): void;
}
interface RcMoverLike {
  warpto(x: number, y: number, angle: number): void;
}
interface RcLightsLike {
  setheightaware(v: number): void;
}

function build() {
  const stm = JSON.parse(readFileSync(`${DIR}/assets/finale.stm`, 'utf-8'));
  const walls: number[][] = stm.layers.walls;
  const markers: Array<{ row: number; col: number; tag: string }> = stm.layers.tags.markers;

  const code = transpile();
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
  _sb.allMarkers = () => markers;
  _sb.getStageWidth = () => 640;
  _sb.getStageHeight = () => 360;

  const gradientCalls: number[][] = [];
  _sb.setFillColor = () => {};
  _sb.drawRect = () => {};
  _sb.drawImageStrip = () => {};
  _sb.drawVGradientRect = (...a: unknown[]) => gradientCalls.push(a as number[]);

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
  const mover = new RcMover(world, 15.5, 7.5, 0.3, 0.6) as RcMoverLike;
  const lights = new RcLights(world) as RcLightsLike;
  render.bindlights(lights);
  render.bindcamera(mover);
  render.setgradientshading(1);
  lights.setheightaware(1);
  return { render, mover, gradientCalls };
}

describe('scratch: lateral (per-column) variation looking down the North-room-to-Hub corridor', () => {
  test('gradient calls at the SAME screen row (same depth run) across different columns', () => {
    const { render, mover, gradientCalls } = build();
    mover.warpto(15.5, 7.5, Math.PI / 2); // facing +y, straight down the corridor toward the Hub
    render.renderframe();

    // Group by rounded y (the band's vertical centre) to find calls drawing
    // "the same depth" across different destX (first arg) columns.
    const byY = new Map<number, number[][]>();
    for (const call of gradientCalls) {
      const y = Math.round((call[1] as number) / 4) * 4;
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y)!.push(call);
    }
    const debugCalls = gradientCalls.filter((c) => c[0] === -999);
    // eslint-disable-next-line no-console
    console.log(`debug calls: ${debugCalls.length}`);
    for (const c of debugCalls.slice(0, 40)) {
      const [, destX, hh, rayX, rayY, dNear, dFar, nearLite, farLite, kind] = c;
      // eslint-disable-next-line no-console
      console.log(
        `destX=${destX} hh=${hh} rayX=${rayX.toFixed(4)} rayY=${rayY.toFixed(4)} dNear=${dNear.toFixed(2)} dFar=${dFar.toFixed(2)} nearLite=${nearLite.toFixed(3)} farLite=${farLite.toFixed(3)} kind=${kind}`,
      );
    }
    // eslint-disable-next-line no-console
    console.log(`total gradient calls: ${gradientCalls.length}`);
    const rows = [...byY.entries()].sort((a, b) => a[0] - b[0]);
    for (const [y, calls] of rows) {
      const xs = calls.map((c) => c[0] as number).sort((a, b) => a - b);
      const topRs = calls.map((c) => c[4] as number);
      const min = Math.min(...topRs);
      const max = Math.max(...topRs);
      // eslint-disable-next-line no-console
      console.log(
        `y=${y} cols=${calls.length} xRange=[${xs[0]},${xs[xs.length - 1]}] topR range=[${min},${max}] distinctTopR=${new Set(topRs).size}`,
      );
    }
    expect(gradientCalls.length).toBeGreaterThan(0);
  });
});
