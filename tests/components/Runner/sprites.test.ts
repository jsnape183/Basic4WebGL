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

// createSprite additionally needs PIXI.Sprite and _sbAssets in scope.
class FakeSprite {
  texture: unknown;
  anchor = { x: 0, y: 0, set(v: number) { this.x = v; this.y = v; } };
  constructor(texture: unknown) {
    this.texture = texture;
  }
}

function loadSpritesWithPixi() {
  const src = readFileSync('src/components/Runner/engine/sprites.js', 'utf-8');
  const PIXI = { Sprite: FakeSprite };
  const _sbAssets = { get: (_path: string) => ({ fake: 'texture' }) };
  const factory = new Function(
    'PIXI',
    '_sbAssets',
    `${src}\n return _sbSprites;`
  );
  return factory(PIXI, _sbAssets);
}

// `sprite` must be centre-anchored to match `animatedsprite` (which already
// does `pixi.anchor.set(0.5)`) — see engine/animatedsprite.js. Before this,
// createSprite left PIXI's own top-left default in place, which is exactly
// the inconsistency this test guards against regressing.
describe('createSprite — anchor', () => {
  test('anchors the sprite at its centre (0.5, 0.5), matching animatedsprite', () => {
    const sprites = loadSpritesWithPixi();
    const sprite = sprites.createSprite('player.png') as FakeSprite;
    expect(sprite.anchor.x).toBe(0.5);
    expect(sprite.anchor.y).toBe(0.5);
  });
});

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

// setPosition needs to know whether it is being called from inside a fixed
// simulation step. It reads that from `this._inFixedStep`, which the assembled
// `_sb` carries from _sbFrameLoop — so a test host just supplies the flag.
function loadSpritesWithFrameLoop(inFixedStep: boolean) {
  return { ...loadSprites(), _inFixedStep: inFixedStep };
}

function makePositionHandle() {
  return {
    position: {
      x: 0,
      y: 0,
      set(nx: number, ny: number) {
        this.x = nx;
        this.y = ny;
      },
    },
  } as any;
}

describe('setPosition teleport marking', () => {
  test('marks a position set from outside a fixed step as a teleport', () => {
    const sprites = loadSpritesWithFrameLoop(false);
    const handle = makePositionHandle();
    sprites.setPosition(handle, 300, 200);
    expect(handle._sbNoInterp).toBe(true);
    expect(handle.position.x).toBe(300);
  });

  test('treats a move inside a fixed step as movement, not a teleport', () => {
    const sprites = loadSpritesWithFrameLoop(true);
    const handle = makePositionHandle();
    sprites.setPosition(handle, 4, 0);
    expect(handle._sbNoInterp).toBeFalsy();
  });

  test('still positions the sprite exactly, either way', () => {
    const sprites = loadSpritesWithFrameLoop(true);
    const handle = makePositionHandle();
    sprites.setPosition(handle, 12.5, 7.25);
    expect(handle.position.x).toBe(12.5);
    expect(handle.position.y).toBe(7.25);
  });
});
