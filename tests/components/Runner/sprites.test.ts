import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/sprites.js is a plain script (not an ES module) — it declares a bare
// `const _sbSprites`. Evaluate it in a Function context, the same technique
// pathfinding.test.ts/lifecycle.test.ts use for their sibling engine files.
function loadSprites() {
  const src = readFileSync('src/components/Runner/engine/sprites.js', 'utf-8');
  const factory = new Function(`${src}\n return _sbSprites;`);
  return factory();
}

describe('setVelocity / getVelocityX / getVelocityY', () => {
  test('stores velocity components, readable back via the getters', () => {
    const sprites = loadSprites();
    const handle: Record<string, unknown> = {};
    sprites.setVelocity(handle, 100, -50);
    expect(sprites.getVelocityX(handle)).toBe(100);
    expect(sprites.getVelocityY(handle)).toBe(-50);
  });

  test('coerces string arguments to numbers, matching every other setter in this file', () => {
    const sprites = loadSprites();
    const handle: Record<string, unknown> = {};
    sprites.setVelocity(handle, '30', '-20');
    expect(sprites.getVelocityX(handle)).toBe(30);
    expect(sprites.getVelocityY(handle)).toBe(-20);
  });

  test('defaults to 0 on a handle that never had setVelocity called', () => {
    const sprites = loadSprites();
    const handle: Record<string, unknown> = {};
    expect(sprites.getVelocityX(handle)).toBe(0);
    expect(sprites.getVelocityY(handle)).toBe(0);
  });

  test('setting velocity on one handle does not affect another', () => {
    const sprites = loadSprites();
    const a: Record<string, unknown> = {};
    const b: Record<string, unknown> = {};
    sprites.setVelocity(a, 10, 10);
    expect(sprites.getVelocityX(b)).toBe(0);
    expect(sprites.getVelocityY(b)).toBe(0);
  });
});
