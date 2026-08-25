import { readFileSync } from 'node:fs';
import { describe, test, expect, vi } from 'vitest';

// engine/scene.js is a plain script (not an ES module) — it declares a bare
// `const _sbScene` and reads a `_sbLifecycle` global the bootstrapper
// concatenates in. Evaluate it in a Function context with that supplied, the
// same technique camera.test.ts/lifecycle.test.ts use. The methods it calls
// on `this` (`_cameraUpdate`, `_pathfindingUpdate`, `_resetFrameInput`) come
// from other engine modules at runtime (via the `_sb` spread) — here they're
// stubbed directly on the returned object, the same way FakeContainer stubs
// PIXI in other engine tests.
function loadScene() {
  const src = readFileSync('src/components/Runner/engine/scene.js', 'utf-8');
  const lifecycle = { _update: vi.fn() };
  const factory = new Function('_sbLifecycle', `${src}\n return _sbScene;`);
  const scene = factory(lifecycle);
  scene._cameraUpdate = vi.fn();
  scene._pathfindingUpdate = vi.fn();
  scene._tweenUpdate = vi.fn();
  scene._particlesUpdate = vi.fn();
  scene._resetFrameInput = vi.fn();
  return scene;
}

describe('_sbScene._fixedStep — pathfinding movement wiring', () => {
  test('calls _pathfindingUpdate(delta) every frame, alongside _cameraUpdate', () => {
    const scene = loadScene();

    scene._fixedStep(16.67);

    expect(scene._pathfindingUpdate).toHaveBeenCalledWith(16.67);
    expect(scene._cameraUpdate).toHaveBeenCalledWith(16.67);
  });
});

describe('_sbScene._fixedStep — tween animation wiring', () => {
  test('calls _tweenUpdate(delta) every frame, alongside _cameraUpdate', () => {
    const scene = loadScene();

    scene._fixedStep(16.67);

    expect(scene._tweenUpdate).toHaveBeenCalledWith(16.67);
    expect(scene._cameraUpdate).toHaveBeenCalledWith(16.67);
  });
});

describe('_sbScene._fixedStep — particles wiring', () => {
  test('calls _particlesUpdate(delta) every frame, alongside _cameraUpdate', () => {
    const scene = loadScene();

    scene._fixedStep(16.67);

    expect(scene._particlesUpdate).toHaveBeenCalledWith(16.67);
    expect(scene._cameraUpdate).toHaveBeenCalledWith(16.67);
  });
});
