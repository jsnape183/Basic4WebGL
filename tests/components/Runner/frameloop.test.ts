import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/frameloop.js is a plain script (not an ES module) — it declares a bare
// `const _sbFrameLoop` that the runner concatenates into the sandboxed iframe.
// Evaluate it in a Function context, the same technique camera.test.ts uses.
function loadFrameLoop() {
  const src = readFileSync('src/components/Runner/engine/frameloop.js', 'utf-8');
  const factory = new Function(`${src}\n return _sbFrameLoop;`);
  return factory();
}

// A minimal stand-in for the assembled `_sb`: the frame loop calls its siblings
// through `this`, so a test host only needs the members it actually touches.
function makeHost(overrides: Record<string, unknown> = {}) {
  const steps: number[] = [];
  const host = {
    ...loadFrameLoop(),
    _displaced: [],
    _sbInstances: [] as Array<{ _handle: unknown }>,
    _fixedStep(delta: number) {
      steps.push(delta);
    },
    _cameraSnapshot() {},
    _cameraApply() {},
    _cameraRestore() {},
    ...overrides,
  };
  return { host, steps };
}

const STEP = 1000 / 60;

describe('fixed-timestep accumulator', () => {
  test('a frame of exactly one step runs exactly one simulation step', () => {
    const { host, steps } = makeHost();
    host._update(STEP);
    expect(steps).toEqual([STEP]);
  });

  test('always steps with the constant timestep, never the real frame delta', () => {
    const { host, steps } = makeHost();
    host._update(23.4);
    expect(steps).toEqual([STEP]);
  });

  test('a short frame runs no steps and banks the time', () => {
    const { host, steps } = makeHost();
    host._update(8);
    expect(steps).toEqual([]);
    expect(host._accumulator).toBeCloseTo(8, 6);
  });

  test('two short frames that together exceed one step run one step', () => {
    const { host, steps } = makeHost();
    host._update(8);
    host._update(9);
    expect(steps).toEqual([STEP]);
  });

  test('a long frame catches up with multiple steps', () => {
    // 50.5ms is a little over three steps. Deliberately not `STEP * 3` — that
    // product lands a fraction of a float epsilon *below* three whole steps and
    // yields two, which says nothing about catch-up and everything about
    // binary floating point.
    const { host, steps } = makeHost();
    host._update(50.5);
    expect(steps).toEqual([STEP, STEP, STEP]);
  });

  test('leftover time carries over instead of being discarded', () => {
    const { host } = makeHost();
    host._update(STEP + 5);
    expect(host._accumulator).toBeCloseTo(5, 6);
  });

  test('simulated time tracks real time over a run of jittery frames', () => {
    const { host, steps } = makeHost();
    const frames = [16.6, 9.2, 31.7, 12.0, 18.3, 22.9, 5.4, 16.9];
    const realTotal = frames.reduce((a, b) => a + b, 0);
    frames.forEach((f) => host._update(f));
    const simulated = steps.reduce((a, b) => a + b, 0);
    // Every millisecond is either simulated or still banked in the accumulator.
    expect(simulated + host._accumulator).toBeCloseTo(realTotal, 6);
  });

  test('clamps an enormous frame delta so a backgrounded tab cannot burst', () => {
    const { host, steps } = makeHost();
    host._update(5000);
    expect(steps.length).toBeLessThanOrEqual(5);
  });

  test('drops the backlog rather than spiralling when it hits the step cap', () => {
    const { host, steps } = makeHost();
    host._update(5000);
    expect(host._accumulator).toBe(0);
    steps.length = 0;
    host._update(STEP);
    expect(steps).toEqual([STEP]);
  });

  test('ignores a negative or zero frame delta', () => {
    const { host, steps } = makeHost();
    host._update(-100);
    expect(steps).toEqual([]);
    expect(host._accumulator).toBe(0);
  });
});

describe('render alpha', () => {
  test('is zero immediately after a step consumes the whole accumulator', () => {
    const { host } = makeHost();
    host._update(STEP);
    expect(host._alpha).toBeCloseTo(0, 6);
  });

  test('is the leftover fraction of a step', () => {
    const { host } = makeHost();
    host._update(STEP + STEP / 4);
    expect(host._alpha).toBeCloseTo(0.25, 6);
  });

  test('never reaches or exceeds one', () => {
    const { host } = makeHost();
    host._update(STEP * 1.999);
    expect(host._alpha).toBeLessThan(1);
  });
});

// A stand-in for a PIXI display object: the frame loop only ever touches
// `position.x`, `position.y`, and its own `_sb*` bookkeeping fields.
function makeHandle(x = 0, y = 0) {
  return {
    position: {
      x,
      y,
      set(nx: number, ny: number) {
        this.x = nx;
        this.y = ny;
      },
    },
  } as any;
}

// Builds a host whose _fixedStep moves `handle` by (dx, dy) each step.
function makeMovingHost(handle: any, dx: number, dy: number) {
  const inst = { _handle: handle };
  const host: any = {
    ...loadFrameLoop(),
    _displaced: [],
    _sbInstances: [inst],
    _cameraSnapshot() {},
    _cameraApply() {},
    _cameraRestore() {},
    _fixedStep() {
      handle.position.x += dx;
      handle.position.y += dy;
    },
  };
  return host;
}

describe('render interpolation', () => {
  test('renders a moving object between its last two simulation samples', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 10, 0);
    // One full step, then a quarter-step of leftover time.
    host._update(STEP + STEP / 4);
    // Simulation is at 10; the render shows a quarter of the way from the
    // previous sample toward it. Interpolation is backward-looking — it never
    // extrapolates past the position the simulation has actually reached.
    expect(handle.position.x).toBeCloseTo(2.5, 6);
  });

  test('restores the authoritative simulation position after the render', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 10, 0);
    host._update(STEP + STEP / 4);
    host._afterRender();
    expect(handle.position.x).toBeCloseTo(10, 6);
  });

  test('game logic inside a fixed step always sees the authoritative position', () => {
    const handle = makeHandle(0, 0);
    const seen: number[] = [];
    const host = makeMovingHost(handle, 10, 0);
    const move = host._fixedStep;
    host._fixedStep = function () {
      seen.push(handle.position.x);
      move.call(this);
    };
    host._update(STEP + STEP / 2);
    host._afterRender();
    host._update(STEP);
    // The second step starts from 10, not from the 5 that was rendered.
    expect(seen).toEqual([0, 10]);
  });

  test('leaves a stationary object completely alone', () => {
    const handle = makeHandle(100, 50);
    const host = makeMovingHost(handle, 0, 0);
    host._update(STEP + STEP / 2);
    expect(handle.position.x).toBe(100);
    expect(handle.position.y).toBe(50);
  });

  test('interpolates the y axis as well', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 0, 8);
    host._update(STEP + STEP / 2);
    expect(handle.position.y).toBeCloseTo(4, 6);
  });

  test('interpolates from the second-to-last step when a frame runs several', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 10, 0);
    host._update(STEP * 2 + STEP / 2);
    // Three samples are in play: 0, 10, 20. Blending must use 10 -> 20, not
    // 0 -> 20, or a catch-up frame renders the object half a screen behind.
    expect(handle.position.x).toBeCloseTo(15, 6);
  });

  test('does not smear an object that was teleported during the step', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 0, 0);
    host._fixedStep = function () {
      handle.position.set(500, 300);
      handle._sbNoInterp = true;
    };
    host._update(STEP + STEP / 2);
    expect(handle.position.x).toBe(500);
    expect(handle.position.y).toBe(300);
  });

  test('clears the teleport flag so the next step interpolates again', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 0, 0);
    host._fixedStep = function () {
      handle.position.set(500, 300);
      handle._sbNoInterp = true;
    };
    host._update(STEP);
    host._afterRender();
    host._fixedStep = function () {
      handle.position.x += 10;
    };
    host._update(STEP + STEP / 2);
    expect(handle.position.x).toBeCloseTo(505, 6);
  });

  test('snaps rather than smears a jump larger than the interpolation limit', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 400, 0);
    host._update(STEP + STEP / 2);
    expect(handle.position.x).toBe(400);
  });

  test('an object added mid-run is not interpolated from a stale sample', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 10, 0);
    host._update(STEP);
    host._afterRender();
    const late = makeHandle(999, 999);
    host._sbInstances.push({ _handle: late });
    host._update(STEP + STEP / 2);
    expect(late.position.x).toBe(999);
    expect(late.position.y).toBe(999);
  });

  test('a restore with nothing displaced is a harmless no-op', () => {
    const handle = makeHandle(7, 7);
    const host = makeMovingHost(handle, 0, 0);
    host._afterRender();
    host._afterRender();
    expect(handle.position.x).toBe(7);
  });
});

describe('frame loop reset', () => {
  // A scene switch happens *inside* a fixed step: _fixedStep calls _applySwitch,
  // which calls stage.clear(), which calls _frameLoopReset. That zeroes the
  // accumulator mid-loop, and the `_accumulator -= FIXED_STEP_MS` that follows
  // the step then drives it negative — which would make alpha negative and
  // render every surviving object a full step BEHIND its previous sample.
  test('never produces a negative alpha when a step resets it mid-loop', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 1, 0);
    host._fixedStep = function () {
      this._frameLoopReset();
    };
    host._update(STEP * 1.5);

    expect(host._alpha).toBeGreaterThanOrEqual(0);
  });

  test('clears banked time and displaced handles', () => {
    const handle = makeHandle(0, 0);
    const host = makeMovingHost(handle, 10, 0);
    host._update(STEP + STEP / 2);
    expect(host._displaced.length).toBe(1);

    host._frameLoopReset();

    expect(host._accumulator).toBe(0);
    expect(host._alpha).toBe(0);
    expect(host._displaced.length).toBe(0);
    expect(host._inFixedStep).toBe(false);
  });
});
