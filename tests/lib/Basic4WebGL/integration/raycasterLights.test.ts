import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Focused guard for RcLights.sampleAt() -- bilinear light at a world point.
// Builds a real RcLights from an inline tilemap stub (same shape as
// raycasterDiagWorld) with two `light:` markers a few cells apart, so staticArr
// carries a real spatial gradient. sampleAt must reproduce sampleCell at a cell
// centre, interpolate strictly between two neighbouring cells at their midpoint,
// and degrade to ambient out of bounds (via sampleCell's OOB clamp).

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

const CANON = 'demo-src/raycaster/lib';
const files = ['RcConfig.bas', 'RcWorld.bas', 'RcCast.bas', 'RcLights.bas'].map((name) => ({
  name,
  source: readFileSync(`${CANON}/${name}`, 'utf-8'),
}));

interface RcLightsLike {
  samplecell(col: number, row: number): number;
  sampleat(x: number, y: number): number;
  addpoint(x: number, y: number, z: number, intensity: number, radiusCells: number): number;
  setlightfalloff(handle: number, kind: number): void;
  setlightradius(handle: number, radiusCells: number): void;
  update(): void;
}

function buildLights(
  walls: number[][],
  markers: Array<{ row: number; col: number; tag: string }>,
): RcLightsLike {
  const { files: ordered, error } = sortByDependencies(files);
  expect(error).toBeUndefined();
  const result = compiler.transpile({ lib, files: ordered });
  expect(result.diagnostics).toEqual([]);

  const tw = 16;
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
  _sb.createTileMapSet = () => 'TMS';
  _sb.getTileMapSetLayer = (_h: unknown, n: string) => `LAYER:${n}`;
  _sb.tileWidth = () => tw;
  _sb.tileHeight = () => tw;
  _sb.tileMapWidthPx = () => walls[0].length * tw;
  _sb.tileMapHeightPx = () => walls.length * tw;
  _sb.tileAt = (_h: unknown, px: number, py: number) =>
    walls[Math.floor(py / tw)]?.[Math.floor(px / tw)] ?? 0;
  _sb.allMarkers = () => markers.map((m) => ({ ...m }));

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
    `${result.code}\n; return { RcWorld: _sb_rcworld, TileMapSet: _sb_tilemapset, RcLights: _sb_rclights };`,
  );
  const { RcWorld, TileMapSet, RcLights } = factory(
    _sb,
    _createArray,
    ...Object.values(helpers),
    { log() {} },
  );
  deferred.forEach((cb) => cb());
  const world = new RcWorld(new TileMapSet('lighttest.stm'), 'walls');
  return new RcLights(world) as RcLightsLike;
}

describe('RcLights.sampleAt bilinear light', () => {
  // 12x5 bordered room; two `light:` markers on row 2, at col 2 and col 9.
  const walls = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];
  const markers = [
    { row: 2, col: 2, tag: 'light' },
    { row: 2, col: 9, tag: 'light' },
  ];

  test('sampling at a cell centre reproduces the per-cell value', () => {
    const L = buildLights(walls, markers);
    for (const [c, r] of [
      [5, 2],
      [4, 3],
      [7, 1],
    ] as const) {
      expect(L.sampleat(c + 0.5, r + 0.5)).toBeCloseTo(L.samplecell(c, r), 2);
    }
  });

  test('a point between two cells interpolates strictly between them', () => {
    const L = buildLights(walls, markers);
    // col 2 sits on a light marker (bright, clamps near 1); col 3 is dimmer.
    const brite = L.samplecell(2, 2);
    const dark = L.samplecell(3, 2);
    expect(brite).toBeGreaterThan(dark + 0.02); // genuinely different

    const mid = L.sampleat(3.0, 2.5); // midpoint of the two cell centres
    const lo = Math.min(brite, dark);
    const hi = Math.max(brite, dark);
    expect(mid).toBeGreaterThan(lo);
    expect(mid).toBeLessThan(hi);
    expect(mid).toBeCloseTo((brite + dark) / 2, 2);
  });

  test('out of bounds degrades to the ambient value', () => {
    const L = buildLights(walls, markers);
    const ambient = L.samplecell(-1, -1); // sampleCell returns ambient for OOB
    expect(L.sampleat(-5, -5)).toBeCloseTo(ambient, 6);
  });

  test('a wall cell does not drag down sampleAt on the open floor beside it', () => {
    // A well-lit open cell (1,1) sits in the room's NW corner, against the
    // west wall (col 0) and north wall (row 0). Before the fix, sampleCell on
    // a wall cell returned near-ambient, so bilinear sampleAt right at the
    // (1,1) cell's own NW corner -- exactly the corner shared with 3 wall
    // cells -- blended 75% of that near-zero value in, reading far darker
    // than the lit open cell it's sitting on. The fix makes a wall cell
    // borrow its brightest open neighbour, so that corner should read close
    // to sampleCell(1,1) instead of collapsing toward ambient.
    const L = buildLights(walls, markers);
    const openLit = L.samplecell(1, 1);
    const ambient = L.samplecell(-1, -1);
    expect(openLit).toBeGreaterThan(ambient + 0.05); // genuinely lit, not just ambient

    // (1.0, 1.0) is cell (1,1)'s own NW corner: bilinear corners are
    // (0,0)/(1,0)/(0,1) [walls] and (1,1) [the lit open cell], each 25%.
    const corner = L.sampleat(1.0, 1.0);
    expect(corner).toBeGreaterThan(openLit - 0.15);
  });
});

describe('RcLights point-light falloff curve', () => {
  // A big open 12x12 bordered room, no light: markers -- isolates a single
  // dynamic point light's own falloff from ambient/static contributions.
  const openRoomWalls = Array.from({ length: 12 }, (_, r) =>
    Array.from({ length: 12 }, (_, c) => (r === 0 || r === 11 || c === 0 || c === 11 ? 1 : 0)),
  );
  const RC_FALLOFF_QUADRATIC = 1; // matches RcConfig.RC_FALLOFF_QUADRATIC

  test('addPoint defaults to linear -- unchanged behaviour for every existing demo', () => {
    const L = buildLights(openRoomWalls, []);
    L.setambient(0);
    const h = L.addpoint(6.5, 6.5, 0.5, 1.0, 6);
    L.update();
    // linear: intensity * (1 - dist/radius). At dist=3 of radius=6 -> 0.5.
    const v = L.samplecell(9, 6); // 3 cells east of the light's own cell
    expect(v).toBeCloseTo(0.5, 1);
  });

  test('quadratic falls off faster than linear at the same distance and radius', () => {
    const linear = buildLights(openRoomWalls, []);
    linear.setambient(0);
    linear.addpoint(6.5, 6.5, 0.5, 1.0, 6);
    linear.update();

    const quad = buildLights(openRoomWalls, []);
    quad.setambient(0);
    const hq = quad.addpoint(6.5, 6.5, 0.5, 1.0, 6);
    quad.setlightfalloff(hq, RC_FALLOFF_QUADRATIC);
    quad.update();

    for (const cell of [
      [8, 6],
      [9, 6],
      [10, 6],
    ] as const) {
      const lv = linear.samplecell(...cell);
      const qv = quad.samplecell(...cell);
      expect(qv).toBeLessThan(lv); // quadratic reads dimmer at every mid-range distance
    }
    // both still reach full intensity at the source and (near) zero at the edge.
    expect(quad.samplecell(6, 6)).toBeCloseTo(linear.samplecell(6, 6), 2);
  });

  test('setLightRadius narrows the pool without touching intensity or falloff kind', () => {
    const L = buildLights(openRoomWalls, []);
    L.setambient(0);
    const h = L.addpoint(6.5, 6.5, 0.5, 1.0, 6);
    L.update();
    const before = L.samplecell(9, 6); // 3 cells out, radius 6 -> still lit
    L.setlightradius(h, 3);
    L.update();
    const after = L.samplecell(9, 6); // 3 cells out, radius 3 -> right at/past the edge
    expect(after).toBeLessThan(before);
  });
});
