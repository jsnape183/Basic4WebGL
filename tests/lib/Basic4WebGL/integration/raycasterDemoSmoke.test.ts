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
function makeSbStub(overrides: Record<string, unknown> = {}) {
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
  const stub = new Proxy(function () {} as never, handler) as Record<string, unknown> &
    ((...a: unknown[]) => unknown);
  Object.assign(stub, overrides);
  return stub;
}

function evalDemo(code: string, sbOverrides: Record<string, unknown> = {}) {
  const _sb = makeSbStub(sbOverrides);
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
  spanside(i: number): number;
  spandist(i: number): number;
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
  surfacecount(): number;
}

// Open corridor with a wall at column >= 6 (and the col-0 border).
const stubWorld = {
  floorheightat: () => 0,
  ceilheightat: () => 1,
  wallat: (c: number) => (c <= 0 || c >= 6 ? 1 : 0),
  diagat: () => 0,
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
      A.add('x.png', 2, 2, 0, 32, 32);
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

  // The per-column occlusion predicate (`depth < self.depthAt(c)`) is the one
  // piece of drawActors that no other test or Cypress "no ERR" check exercises —
  // a `<`/`>` inversion or column off-by-one would pass everything. Drive a real
  // renderFrame (real stage size so the column loop runs) with a drawImageStrip
  // spy: move ONE billboard from the open corridor to behind the col-6 wall and
  // watch the strip count go to zero. (One RcActors instance — see the
  // dim-x(0)-is-prototype-shared transpiler bug, roadmap #35.)
  test.each(phaseDirs)('%s: drawActors clips a billboard behind a wall', (dirName) => {
    const strips: unknown[][] = [];
    const overrides = {
      getStageWidth: () => 320,
      getStageHeight: () => 200,
      drawImageStrip: (...a: unknown[]) => {
        strips.push(a);
        return undefined;
      },
    };
    const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`), overrides);
    if (!mod.RcActors || !mod.RcRender) return;

    const r = new mod.RcRender(stubWorld);
    r.setcamera(2, 2, 0, 0); // in the corridor (open cols 1..5), looking +x

    const actors = new mod.RcActors(stubWorld);
    const npc = actors.add('npc.png', 4, 2, 0, 32, 32) as { setposition(x: number, y: number): void };
    r.bindactors(actors);

    strips.length = 0;
    r.renderframe();
    expect(strips.length).toBeGreaterThan(0); // dead ahead in the open → draws

    npc.setposition(9, 2); // behind the wall that starts at col 6
    strips.length = 0;
    r.renderframe();
    expect(strips.length).toBe(0); // occluded → no strips
  });

  // Phase 6b: renderFrame draws flat horizontal-surface strips (step tops, pit
  // floors) between the risers. Drive a real renderFrame with a stepped corridor
  // and a drawRect spy; the two full-screen background fills have w === 320, the
  // per-column strips have w === 4.
  // Deviation from plan Step 13: the plan orders the corridor "step up (0.3) then
  // pit (-0.25)", but a forward-facing camera can never see that pit floor — the
  // near lip of the raised step occludes it (winBot clamps at the step), so the
  // "pit floor below the rim" / dark-grey assertions would be unsatisfiable. Order
  // it "pit (-0.3) then step up (0.3)" instead: same surface kinds exercised
  // (PIT_FLOOR, FLOOR_TOP, CEIL_UNDER), pit now genuinely visible.
  const stubWorld2 = {
    floorheightat: (c: number) => (c < 4 ? 0 : c < 6 ? -0.3 : 0.3),
    ceilheightat: (c: number) => (c < 5 ? 1 : 1.4),
    wallat: (c: number) => (c <= 0 || c >= 8 ? 1 : 0),
    diagat: () => 0,
    walltexat: () => '',
    floortexat: () => '',
    ceiltexat: () => '',
    widthcells: () => 12,
    heightcells: () => 4,
    lightat: () => 0,
  };

  // A single SE-solid diagonal at cell (3,3) in an 8x8 bordered room.
  const stubWorldDiag = {
    floorheightat: () => 0,
    ceilheightat: () => 1,
    wallat: (c: number, r: number) => (c <= 0 || c >= 7 || r <= 0 || r >= 7 ? 1 : 0),
    diagat: (c: number, r: number) => (c === 3 && r === 3 ? 3 : 0), // 3 = RC_DIAG_SE
    walltexat: () => '',
    floortexat: () => '',
    ceiltexat: () => '',
    widthcells: () => 8,
    heightcells: () => 8,
    lightat: () => 0,
  };

  // Center cell (3,3) is a diagonal of the given code; everything else open,
  // bordered at 0 and 7.
  function makeDiagStub(code: number) {
    return {
      floorheightat: () => 0,
      ceilheightat: () => 1,
      wallat: (c: number, r: number) => (c <= 0 || c >= 7 || r <= 0 || r >= 7 ? 1 : 0),
      diagat: (c: number, r: number) => (c === 3 && r === 3 ? code : 0),
      walltexat: () => '',
      floortexat: () => '',
      ceiltexat: () => '',
      widthcells: () => 8,
      heightcells: () => 8,
      lightat: () => 0,
    };
  }

  // For each corner code: spawn point on the OPEN side near the chord, a drive
  // angle straight into the wedge, and the signed-distance predicate that must
  // stay true — the body centre never crosses to the solid side. Chord of cell
  // (3,3) is world x+y=7 (nw/se) or x-y=0 (ne/sw).
  const DIAG_MOVER_CASES = [
    // nw solid (x+y<=7 solid): spawn SE of the chord, drive NW.
    { code: 1, x: 4.4, y: 3.6, ang: Math.atan2(-1, -1), ok: (x: number, y: number) => x + y > 7.0 },
    // ne solid (x-y>=0 solid): spawn NW of the chord (x<y), drive toward -x+y... i.e. NW.
    { code: 2, x: 3.4, y: 3.7, ang: Math.atan2(1, -1), ok: (x: number, y: number) => x - y < 0.0 },
    // se solid (x+y>=7 solid): spawn NW of the chord, drive SE.
    { code: 3, x: 3.4, y: 3.4, ang: Math.atan2(1, 1), ok: (x: number, y: number) => x + y < 7.0 },
    // sw solid (x-y<=0 solid): spawn SE of the chord (x>y), drive SE.
    { code: 4, x: 3.7, y: 3.4, ang: Math.atan2(-1, 1), ok: (x: number, y: number) => x - y > 0.0 },
  ];

  test.each(phaseDirs)('%s: RcMover slides along a diagonal face instead of tunnelling', (dirName) => {
    const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`));
    if (!mod.RcMover) return;

    for (const cs of DIAG_MOVER_CASES) {
      const m = new mod.RcMover(makeDiagStub(cs.code) as unknown, cs.x, cs.y, 0.3, 0.6) as unknown as RcMoverLike;
      m.turn(cs.ang);
      for (let i = 0; i < 40; i++) {
        m.move(2.6, 0); // RC_MOVE_SPEED
        m.step(50);
      }
      expect(
        cs.ok(m.x(), m.y()),
        `code ${cs.code}: ended (${m.x().toFixed(2)},${m.y().toFixed(2)}) — must stay on the open side`,
      ).toBe(true);
      expect(Math.hypot(m.x() - cs.x, m.y() - cs.y)).toBeGreaterThan(0.05); // actually moved
    }

    // Free walk: no diagonal on the path -> travels far.
    const free = new mod.RcMover(makeDiagStub(3) as unknown, 1.5, 1.5, 0.3, 0.6) as unknown as RcMoverLike;
    free.turn(0); // +x, row 1, never touches the (3,3) diagonal
    for (let i = 0; i < 40; i++) {
      free.move(2.6, 0);
      free.step(50);
    }
    expect(free.x()).toBeGreaterThan(4.0);
  });

  test.each(phaseDirs)('%s: RcCast resolves a diagonal tile as a wall span', (dirName) => {
    const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`));
    if (!mod.RcCast) return; // phase 1 has no RcCast
    const rc = new mod.RcCast() as RcCastLike & {
      spanside(i: number): number;
      spandist(i: number): number;
    };

    // Ray SE from (1.5,1.5) straight at the SE-solid chord of cell (3,3):
    // crosses the chord at world (3.5,3.5), ray param s = 2.0.
    rc.cast(stubWorldDiag, 1.5, 1.5, 1, 1);
    const n = rc.spancount();
    expect(n).toBeGreaterThan(0);
    expect(rc.spanside(n - 1)).toBe(2); // RC_SPAN_SIDE_DIAG
    expect(rc.spandist(n - 1)).toBeCloseTo(2.0, 1);

    // los agrees with cast on the diagonal (spec: light/bullets match the eye).
    expect(rc.los(stubWorldDiag, 1.5, 1.5, 1, 1)).toBeCloseTo(2.0, 1);

    // Control: a ray that never meets the diagonal cell hits a normal border
    // wall — side is NOT the diagonal value.
    rc.cast(stubWorldDiag, 1.5, 5.5, 1, 0);
    const m = rc.spancount();
    expect(rc.spanside(m - 1)).not.toBe(2);
    expect(rc.los(stubWorldDiag, 1.5, 5.5, 1, 0)).toBeCloseTo(5.5, 1);
  });

  // A diagonal wall span carries side = RC_SPAN_SIDE_DIAG (2), which collides with
  // drawStrip's shadeKind 2 (floor-step riser, grey 90). renderFrame must remap it
  // to the y-face wall grey (115) before drawing.
  test.each(phaseDirs)('%s: renderFrame shades a diagonal wall as a wall, not a floor riser', (dirName) => {
    const fills: number[][] = [];
    const rects: unknown[][] = [];
    const overrides = {
      getStageWidth: () => 320,
      getStageHeight: () => 200,
      setFillColor: (...a: unknown[]) => {
        fills.push(a as number[]);
        return undefined;
      },
      drawRect: (...a: unknown[]) => {
        rects.push([...(a as unknown[]), fills[fills.length - 1]]);
        return undefined;
      },
    };
    const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`), overrides);
    if (!mod.RcRender) return;

    const r = new mod.RcRender(stubWorldDiag);
    r.setcamera(1.5, 1.5, Math.PI / 4, 0); // looking SE straight at the diagonal
    r.renderframe();

    // Per-column strips have w === 4 (RC_STRIP_W); backgrounds have w === 320.
    const greys = rects
      .filter((a) => a[2] === 4)
      .map((a) => (a[4] as number[] | undefined)?.[1])
      .filter((g): g is number => typeof g === 'number');

    expect(greys.length).toBeGreaterThan(0);
    expect(greys).toContain(115); // y-face wall grey — the remapped diagonal
    expect(greys).not.toContain(90); // floor-riser grey — the un-remapped bug
  });

  test.each(phaseDirs)('%s: renderFrame draws floor/pit surfaces', (dirName) => {
    const rects: any[][] = [];
    const fills: number[][] = [];
    const overrides = {
      getStageWidth: () => 320,
      getStageHeight: () => 200,
      setFillColor: (...a: unknown[]) => {
        fills.push(a as number[]);
        return undefined;
      },
      drawRect: (...a: unknown[]) => {
        rects.push([...(a as number[]), fills[fills.length - 1]]);
        return undefined;
      },
    };
    const mod = evalDemo(transpileDemo(`${DEMO_SRC}/${dirName}`), overrides);
    if (!mod.RcRender) return;

    const r = new mod.RcRender(stubWorld2);
    r.setcamera(2, 2, 0, 0);
    r.renderframe();

    expect(r.surfacecount()).toBeGreaterThan(3);

    // drawRect args: (destX, midY, w, h, [r,g,b]). Background fills have w === 320.
    // Isolate the horizontal-SURFACE strips by their drawStrip greys (index 1 of
    // setFillColor, lightLevel 1.0): FLOOR_TOP=105, PIT_FLOOR=60, CEIL_UNDER=80,
    // SOFFIT=50 — distinct from risers (90/65) and walls (150/115).
    const SURF_GREYS = new Set([105, 60, 80, 50]);
    const surf = rects
      .filter((a) => a[2] === 4 && SURF_GREYS.has((a[4] as number[])?.[1]))
      .map((a) => ({ midY: a[1] as number, grey: (a[4] as number[])[1] }));

    // Step-top of floor height 0.3 projects to ≈ 100 + 0.2 * (200 / d); d ≈ 4–6 → ≈ 107–110.
    const stepTop = surf.find((s) => s.grey === 105 && Math.abs(s.midY - 113) <= 25);
    expect(stepTop, 'a FLOOR_TOP surface near the step rim').toBeDefined();
    // Pit floor (PIT_FLOOR grey, height -0.3) is drawn lower on screen than the rim.
    expect(surf.some((s) => s.grey === 60 && s.midY > (stepTop as { midY: number }).midY + 10)).toBe(
      true,
    );
    // Ceiling underside (rising ceiling → CEIL_UNDER) draws above the horizon.
    // Regression guard for the Critical bug: silently skipped before the ordering
    // fix in drawSurface (drawStrip's `b <= t` guard drops the inverted strip).
    expect(surf.some((s) => s.grey === 80 && s.midY < 100)).toBe(true);
  });
});
