import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/assets.js is a plain script declaring a bare `const _sbAssets` IIFE,
// concatenated into the sandboxed iframe rather than imported. Evaluate it in
// a Function context with a PIXI stub, the same technique lifecycle.test.ts
// and bootstrapper.test.ts use.
function loadAssets() {
  const src = readFileSync('src/components/Runner/engine/assets.js', 'utf-8');
  const factory = new Function('PIXI', `${src}\n return _sbAssets;`);
  return factory({ Assets: { add() {}, async load() {} } });
}

describe('asset lookup before preloading has finished', () => {
  test('points at oninit as the likely cause while assets are not ready', () => {
    const assets = loadAssets();
    expect(assets.isReady()).toBe(false);
    expect(() => assets.get('hero.png')).toThrow(/oninit\(\)/);
    expect(() => assets.get('hero.png')).toThrow(/onenter\(\)/);
  });

  test('does not blame a correct filename for being missing', () => {
    const assets = loadAssets();
    expect(() => assets.get('hero.png')).not.toThrow(/filename is correct/);
  });

  test('keeps the not-found wording once assets are ready', async () => {
    const assets = loadAssets();
    await assets.preload([]);
    expect(assets.isReady()).toBe(true);
    expect(() => assets.get('hero.png')).toThrow(
      'Asset "hero.png" not found. Make sure the filename is correct and included in your assets.'
    );
  });
});
