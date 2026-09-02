import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard: `raycasterDemoTranspile` only checks that the phase demos
// produce zero diagnostics. It does NOT execute them, so a demo whose .bas
// *compiles* but throws at runtime slips through — this actually happened when a
// method parameter was named `world` (a builtin module name): the transpiler
// silently emitted a broken `rccast.cast.world.<method>` reference chain and the
// demo died with `ReferenceError: rccast is not defined` only under Cypress.
//
// This test transpiles each phase demo, evaluates the emitted JS in a stubbed
// runtime, runs the deferred module bodies, and (where the class exists) drives
// RcCast.cast/los against a duck-typed world — catching load-time and
// cast-path ReferenceErrors in the committed suite.

const DEMO_SRC = 'demo-src';
const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

const phaseDirs = readdirSync(DEMO_SRC, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^raycaster-p\d+$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

function transpileDemo(dir: string): string {
  const names = readdirSync(dir)
    .filter((n) => n.endsWith('.bas'))
    .sort();
  const raw = names.map((name) => ({ name, source: readFileSync(`${dir}/${name}`, 'utf-8') }));
  const { files, error } = sortByDependencies(raw);
  expect(error, `${dir} dependency sort`).toBeUndefined();
  const result = compiler.transpile({ lib, files });
  expect(result.diagnostics, `${dir} diagnostics`).toEqual([]);
  return String(result.code);
}

// Auto-vivifying stub for the _sb runtime: every access yields a callable that is
// also an object, so arbitrarily deep `_sb.a.b.c()` chains never throw. Real
// properties assigned by the harness (e.g. `_sb._deferModuleBody`) win over the
// auto-vivified ones.
function makeSbStub() {
  const cache = new Map<string, unknown>();
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop: string) {
      if (prop === Symbol.toPrimitive || prop === 'then') return undefined;
      if (prop in target) return target[prop];
      if (!cache.has(prop)) {
        const fn = (..._a: unknown[]) => stub;
        cache.set(prop, new Proxy(fn as never, handler));
      }
      return cache.get(prop);
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
    apply() {
      return stub;
    },
  };
  const stub = new Proxy(function () {} as never, handler);
  return stub as Record<string, unknown> & ((...a: unknown[]) => unknown);
}

function evalDemo(code: string) {
  const _sb = makeSbStub();
  const deferred: Array<() => void> = [];
  (_sb as Record<string, unknown>)._deferModuleBody = (cb: () => void) => deferred.push(cb);

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
    `${code}\n; return {
       RcCast: typeof _sb_rccast !== 'undefined' ? _sb_rccast : null,
       RcWorld: typeof _sb_rcworld !== 'undefined' ? _sb_rcworld : null,
       RcRender: typeof _sb_rcrender !== 'undefined' ? _sb_rcrender : null,
       RcMover: typeof _sb_rcmover !== 'undefined' ? _sb_rcmover : null,
       RcLights: typeof _sb_rclights !== 'undefined' ? _sb_rclights : null,
       RcActors: typeof _sb_rcactors !== 'undefined' ? _sb_rcactors : null,
     };`,
  );
  const mod = factory(_sb, _createArray, ...Object.values(helpers), { log() {} });
  deferred.forEach((cb) => cb());
  return mod as {
    RcCast: (new () => RcCastLike) | null;
    RcWorld: unknown;
    RcRender: (new (w: unknown) => RcRenderLike) | null;
    RcMover:
      | (new (w: unknown, x: number, y: number, radius: number, bodyHeight: number) => RcMoverLike)
      | null;
    RcLights: (new (w: unknown) => RcLightsLike) | null;
    RcActors: (new (w: unknown) => RcActorsLike) | null;
  };
}

interface RcActorsLike {
  add(imageName: string, x: number, y: number, z: number, frameW: number, frameH: number): unknown;
  remove(act: unknown): void;
  near(x: number, y: number, r: number): unknown;
  los(x: number, y: number, dx: number, dy: number): number;
  hitscan(x: number, y: number, dx: number, dy: number, rng: number): unknown;
  hitkind(): number;
  hitdist(): number;
  hitactor(): unknown;
  activecount(): number;
  actorat(i: number): unknown;
  poolsize(): number;
}

interface RcLightsLike {
  addpoint(x: number, y: number, z: number, intensity: number, radiusCells: number): number;
  movelight(handle: number, x: number, y: number): void;
  setlightintensity(handle: number, intensity: number): void;
  removelight(handle: number): void;
  update(): void;
  samplecell(col: number, row: number): number;
  setambient(level: number): void;
  bakestatic(): void;
}

interface RcMoverLike {
  step(dt: number): void;
  x(): number;
  y(): number;
  z(): number;
  angle(): number;
  pitch(): number;
  onground(): number;
  move(fwd: number, strafe: number): void;
  turn(dAngle: number): void;
  look(dPitch: number): void;
  jump(): void;
}

interface RcCastLike {
  cast(w: unknown, ox: number, oy: number, dx: number, dy: number): void;
  los(w: unknown, ox: number, oy: number, dx: number, dy: number): number;
  spancount(): number;
}

interface RcRenderLike {
  setcamera(x: number, y: number, angle: number, pitch: number): void;
  renderframe(): void;
  bindcamera(mover: unknown): void;
  bindlights(lights: unknown): void;
  projecty(h: number, d: number): number;
  columncount(): number;
  depthat(col: number): number;
  worldtoscreenx(x: number, y: number): number;
  bindactors(a: unknown): void;
}

// Open corridor with a wall at column >= 6 (and the col-0 border).
const stubWorld = {
  floorheightat: () => 0,
  ceilheightat: () => 1,
  wallat: (c: number) => (c <= 0 || c >= 6 ? 1 : 0),
  walltexat: () => '',
  floortexat: () => '',
  ceiltexat: () => '',
  widthcells: () => 8,
  heightcells: () => 4,
  lightat: () => 0,
};

describe('raycaster phase demos smoke-execute', () => {
  test('at least one raycaster-p* demo directory exists', () => {
    expect(phaseDirs.length).toBeGreaterThan(0);
  });

  test.each(phaseDirs)('%s loads + runs deferred bodies without ReferenceError', (dirName) => {
    expect(() => evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`))).not.toThrow();
  });

  test.each(phaseDirs)('%s: RcCast (if present) cast/los run against a stub world', (dirName) => {
    const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`));
    if (!mod.RcCast) return; // phase 1 has no RcCast
    const rc = new mod.RcCast();
    expect(() => rc.cast(stubWorld, 1.5, 1.5, 1, 0)).not.toThrow();
    expect(() => rc.los(stubWorld, 1.5, 1.5, 1, 0)).not.toThrow();
    expect(rc.spancount()).toBeGreaterThan(0);
    expect(rc.los(stubWorld, 1.5, 1.5, 1, 0)).toBeCloseTo(4.5, 1);
  });

  test.each(phaseDirs)('%s: RcRender (if present) renderFrame runs', (dirName) => {
    const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`));
    if (!mod.RcRender) return; // phases without RcRender.bas
    const r = new mod.RcRender(stubWorld);
    r.setcamera(2, 2, 0, 0);
    // stage.width()/height() resolve to the chainable _sb stub, so cols is NaN
    // and the column loop is inert. The point is: no ReferenceError.
    expect(() => r.renderframe()).not.toThrow();
    if (mod.RcRender && mod.RcMover) {
      const m = new mod.RcMover(stubWorld, 2, 2, 0.3, 0.6);
      r.bindcamera(m);
      expect(() => r.renderframe()).not.toThrow();
    }
    if (mod.RcRender && mod.RcLights) {
      const L = new mod.RcLights(stubWorld);
      r.bindlights(L);
      expect(() => r.renderframe()).not.toThrow();
    }
    if (mod.RcActors) {
      const A = new mod.RcActors(stubWorld);
      r.bindactors(A);
      expect(() => r.renderframe()).not.toThrow();
    }
    expect(() => r.depthat(0)).not.toThrow();
    expect(typeof r.worldtoscreenx(3, 3)).toBe('number');
    // Camera at (2,2) looking +x (angle 0); a point at x=1 is behind the plane.
    expect(r.worldtoscreenx(1, 2)).toBe(-1);
    expect(() => r.projecty(0.5, 5)).not.toThrow();
    const p = r.projecty(0.5, 5);
    expect(Number.isNaN(p) || p === r.projecty(0.5, 99)).toBe(true);
  });

  test.each(phaseDirs)('%s: RcMover (if present) step runs', (dirName) => {
    const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`));
    if (!mod.RcMover) return; // phases without RcMover.bas
    const m = new mod.RcMover(stubWorld, 2, 2, 0.3, 0.6);
    m.move(1, 0);
    m.turn(0.1);
    m.look(10);
    m.jump();
    expect(() => m.step(16)).not.toThrow();
    expect(typeof m.x()).toBe('number');
    expect(typeof m.onground()).toBe('number');
  });

  test.each(phaseDirs)('%s: RcLights (if present) update/sample run', (dirName) => {
    const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`));
    if (!mod.RcLights) return; // phases without RcLights.bas
    const L = new mod.RcLights(stubWorld);
    const h = L.addpoint(2, 2, 0.5, 1, 5);
    L.movelight(h, 3, 3);
    L.setlightintensity(h, 0.8);
    L.update();
    expect(typeof L.samplecell(2, 2)).toBe('number');
    expect(() => L.removelight(h)).not.toThrow();
  });

  test.each(phaseDirs)('%s: RcActors (if present) pool + queries run', (dirName) => {
    const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`));
    if (!mod.RcActors) return;
    const A = new mod.RcActors(stubWorld);
    const act = A.add('barrel.png', 2, 2, 0, 32, 32) as { visible(): number } | 0;
    expect(act).not.toBe(0);
    expect(A.activecount()).toBe(1);
    expect(() => A.near(2, 2, 5)).not.toThrow();
    expect(() => A.los(1.5, 1.5, 1, 0)).not.toThrow();
    expect(() => A.hitscan(1.5, 1.5, 1, 0, 20)).not.toThrow();
    expect(typeof A.hitkind()).toBe('number');
    expect(A.hitscan(1.5, 1.5, 1, 0, 20)).toBe(0); // marches to the stub wall, no actor on the ray
    expect(A.hitkind()).toBe(1); // RC_HIT_WALL
    expect(A.near(2, 2, 5)).toBe(act); // the barrel we added
  });
});
