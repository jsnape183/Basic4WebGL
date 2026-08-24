import { readFileSync } from 'node:fs';
import { describe, test, expect, afterEach, vi } from 'vitest';

// engine/camera.js is a plain script (not an ES module) — it declares a bare
// `const _sbCamera` that the runner concatenates into the sandboxed iframe, and
// it reads two globals the bootstrapper owns: `app` and `worldContainer`.
// Evaluate it in a Function context with those supplied, the same technique
// lifecycle.test.ts uses.
function loadCamera() {
  const src = readFileSync('src/components/Runner/engine/camera.js', 'utf-8');
  const positions: Array<{ x: number; y: number }> = [];
  const worldContainer = {
    scale: { set: () => {} },
    position: { set: (x: number, y: number) => positions.push({ x, y }) },
  };
  const app = { renderer: { width: 640, height: 360 } };
  const factory = new Function('app', 'worldContainer', `${src}\n return _sbCamera;`);
  return { camera: factory(app, worldContainer), positions };
}

// One frame at 60fps, in milliseconds — the unit onupdate(delta) and therefore
// _cameraUpdate(delta) are both defined in.
const FRAME_MS = 1000 / 60;

function advance(
  camera: { _cameraUpdate: (d: number) => void; _cameraApply: (a: number) => void },
  seconds: number
) {
  const frames = Math.round((seconds * 1000) / FRAME_MS);
  for (let i = 0; i < frames; i += 1) {
    camera._cameraUpdate(FRAME_MS);
    // The engine applies the camera to worldContainer once per rendered frame,
    // after the last fixed step. At alpha 1 that is the post-step position,
    // which is what these timing tests assert against.
    camera._cameraApply(1);
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

// camera.shake(intensity, duration) documents `duration` as **seconds**, and
// _cameraUpdate is driven by the same per-frame delta the engine hands to
// onupdate. That delta is milliseconds, so converting to seconds is `/ 1000`.
//
// This originally read `delta / 60`, which was only correct while the frame loop
// was (wrongly) wired to PIXI's frame-normalised `ticker.deltaTime` — 1.0 per
// frame divided by 60 happens to be seconds. Fixing the delta units without
// fixing this too would have left shakes running 16.67x too short, which no
// existing test covered.
describe('camera shake timing', () => {
  test('treats the shake duration as seconds of real time', () => {
    const { camera } = loadCamera();
    camera.cameraShake(10, 0.5);

    advance(camera, 0.5);

    expect(camera._shakeElapsed).toBeCloseTo(0.5, 2);
  });

  test('a 1 second shake is still shaking at 0.5s and has stopped by 1s', () => {
    // Pin the jitter so the offset is exactly the current magnitude rather than
    // a random fraction of it — otherwise "is it still shaking" is flaky.
    vi.spyOn(Math, 'random').mockReturnValue(1);
    const { camera, positions } = loadCamera();
    camera.cameraShake(8, 1);

    advance(camera, 0.5);
    const midway = positions[positions.length - 1];
    expect(
      Math.abs(midway.x),
      'halfway through a 1 second shake the camera is still displaced'
    ).to.be.greaterThan(0);

    advance(camera, 0.5);
    const after = positions[positions.length - 1];
    expect(after.x, 'the shake has fully faded out after its duration').toBe(0);
    expect(after.y, 'the shake has fully faded out after its duration').toBe(0);
  });

  test('fades out rather than cutting off abruptly', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);
    const { camera, positions } = loadCamera();
    camera.cameraShake(20, 1);

    advance(camera, 0.25);
    const early = Math.abs(positions[positions.length - 1].x);
    advance(camera, 0.5);
    const late = Math.abs(positions[positions.length - 1].x);

    expect(late, 'shake magnitude decays over the duration').to.be.lessThan(early);
    expect(early, 'shake starts near the requested intensity').to.be.greaterThan(10);
  });
});

// The camera has to be interpolated for the same reason sprites are, and more
// urgently: with camera.follow(player, 0) it locks to the player each fixed
// step, so a camera that jumped in fixed steps while the player rendered
// interpolated would make the player visibly slide relative to the viewport —
// the exact artefact interpolation exists to remove.
describe('camera render interpolation', () => {
  test('applies the interpolated camera position at render time', () => {
    const { camera, positions } = loadCamera();
    camera._cameraSnapshot();
    camera._camX = 100;
    camera._camY = 0;
    camera._cameraApply(0.5);

    expect(positions[positions.length - 1].x).toBeCloseTo(-50, 6);
  });

  test('restores the authoritative camera transform after the render', () => {
    const { camera, positions } = loadCamera();
    camera._cameraSnapshot();
    camera._camX = 100;
    camera._cameraApply(0.5);
    camera._cameraRestore();

    expect(positions[positions.length - 1].x).toBeCloseTo(-100, 6);
  });

  test('camera.setPosition is a hard cut, never a smooth glide', () => {
    const { camera, positions } = loadCamera();
    camera._cameraSnapshot();
    camera._camX = 0;
    camera._cameraApply(1);
    positions.length = 0;

    // A room transition: snapshot, then a hard cut inside the same step.
    camera._cameraSnapshot();
    camera.cameraSetPosition(640, 0);
    camera._cameraApply(0.5);

    expect(positions[positions.length - 1].x).toBeCloseTo(-640, 6);
  });

  test('cameraX still reports the authoritative position, not the rendered one', () => {
    const { camera } = loadCamera();
    camera._cameraSnapshot();
    camera._camX = 100;
    camera._cameraApply(0.5);

    expect(camera.cameraX()).toBe(100);
  });
});
