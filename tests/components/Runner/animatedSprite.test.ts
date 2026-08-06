import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/animatedSprite.js is a plain script concatenated into the sandboxed
// iframe, referencing the sibling `_sbAssets` global directly (issue #21's
// frame-slice cache) and `PIXI.AnimatedSprite`. Concatenate assets.js +
// animatedSprite.js together, the same cross-module technique
// stage.test.ts/tilemap.test.ts use, with a minimal PIXI stub.
class FakeRectangle {
  x: number; y: number; width: number; height: number;
  constructor(x: number, y: number, width: number, height: number) {
    this.x = x; this.y = y; this.width = width; this.height = height;
  }
}
class FakeTexture {
  source: unknown; frame: FakeRectangle; width: number; height: number;
  constructor({ source, frame }: { source: unknown; frame: FakeRectangle }) {
    this.source = source; this.frame = frame; this.width = frame.width; this.height = frame.height;
  }
}
class FakeAnimatedSprite {
  textures: unknown[];
  anchor = { set() {} };
  scale = { x: 1, y: 1, set() {} };
  constructor(textures: unknown[]) {
    this.textures = textures;
  }
  stop() {}
  gotoAndPlay() {}
}

/** loadResults maps asset name -> what the stubbed PIXI.Assets.load() resolves to. */
function loadAnimatedSpriteWithAssets(loadResults: Record<string, unknown>) {
  const assetsSrc = readFileSync('src/components/Runner/engine/assets.js', 'utf-8');
  const animatedSpriteSrc = readFileSync('src/components/Runner/engine/animatedSprite.js', 'utf-8');
  const PIXI = {
    Texture: FakeTexture,
    Rectangle: FakeRectangle,
    AnimatedSprite: FakeAnimatedSprite,
    Assets: { add() {}, async load(name: string) { return loadResults[name]; } },
  };
  const factory = new Function(
    'PIXI',
    `${assetsSrc}\n${animatedSpriteSrc}\n return { _sbAssets, _sbAnimatedSprites };`
  );
  return factory(PIXI);
}

async function withLoadedSheet(width = 256, height = 256) {
  const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, width, height) });
  const { _sbAssets, _sbAnimatedSprites } = loadAnimatedSpriteWithAssets({ 'sheet.png': texture });
  await _sbAssets.preload([{ name: 'sheet.png', src: 'sheet.png' }]);
  return { _sbAssets, _sbAnimatedSprites, texture };
}

// ---------------------------------------------------------------------------
// Roadmap issue #21: createAnimatedSprite/setAnimSpriteSheet used to
// re-slice their sheet into a fresh frames array on every call, even for
// two instances built from the identical (imagePath, frameW, frameH). They
// now route through _sbAssets.getSlices, verified here by reference
// equality on the underlying frames array.
// ---------------------------------------------------------------------------

describe('createAnimatedSprite — reuses the shared frame-slice cache (issue #21)', () => {
  test('two instances built from the same sheet+size share the same frames array', async () => {
    const { _sbAnimatedSprites } = await withLoadedSheet();
    const first = _sbAnimatedSprites.createAnimatedSprite('sheet.png', 32, 32);
    const second = _sbAnimatedSprites.createAnimatedSprite('sheet.png', 32, 32);
    expect(second._allFrames).toBe(first._allFrames);
    expect(first._allFrames).toHaveLength(64); // 256/32 = 8x8
  });

  test('a different frame size produces an independent frames array', async () => {
    const { _sbAnimatedSprites } = await withLoadedSheet();
    const at32 = _sbAnimatedSprites.createAnimatedSprite('sheet.png', 32, 32);
    const at64 = _sbAnimatedSprites.createAnimatedSprite('sheet.png', 64, 64);
    expect(at64._allFrames).not.toBe(at32._allFrames);
  });
});

describe('setAnimSpriteSheet — shares the same cache as createAnimatedSprite (issue #21)', () => {
  test('switching an instance to a sheet+size already used elsewhere reuses those frames', async () => {
    const { _sbAnimatedSprites } = await withLoadedSheet();
    const first = _sbAnimatedSprites.createAnimatedSprite('sheet.png', 32, 32);
    const second = _sbAnimatedSprites.createAnimatedSprite('sheet.png', 64, 64);

    _sbAnimatedSprites.setAnimSpriteSheet(second, 'sheet.png', 32, 32);

    expect(second._allFrames).toBe(first._allFrames);
  });
});
