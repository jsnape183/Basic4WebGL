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
