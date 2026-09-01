import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// engine/assets.js is a plain script declaring a bare `const _sbAssets` IIFE,
// concatenated into the sandboxed iframe rather than imported. Evaluate it in
// a Function context with a PIXI stub, the same technique lifecycle.test.ts
// and bootstrapper.test.ts use.
//
// Texture/Rectangle stubs mirror the real PIXI v8 shapes closely enough for
// defineRegion's own logic to be exercised for real: a real PIXI.Texture
// built with { source, frame } exposes .width/.height derived from `frame`,
// and engine code elsewhere (tilemap.js, animatedSprite.js) already relies
// on that — so the stub tracks `frame` and derives width/height from it too,
// rather than hardcoding constants that would pass regardless of what
// defineRegion actually computed.
class FakeRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}
class FakeTexture {
  source: unknown;
  frame: FakeRectangle;
  width: number;
  height: number;
  constructor({ source, frame }: { source: unknown; frame: FakeRectangle }) {
    this.source = source;
    this.frame = frame;
    this.width = frame.width;
    this.height = frame.height;
  }
}

function fakePixi(loadResult?: unknown) {
  return {
    Assets: { add() {}, async load() { return loadResult; } },
    Texture: FakeTexture,
    Rectangle: FakeRectangle,
  };
}

function loadAssets(pixi: ReturnType<typeof fakePixi> = fakePixi()) {
  const src = readFileSync('src/components/Runner/engine/assets.js', 'utf-8');
  const factory = new Function('PIXI', `${src}\n return _sbAssets;`);
  return factory(pixi);
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

// ---------------------------------------------------------------------------
// Roadmap issue #9: no way to reference a sub-region of a combined sheet.
// defineRegion registers a new, named cropped texture — derived from an
// already-loaded image — into the same asset cache, so sprite/tilemap/
// animatedsprite need no changes at all: they already just call
// `_sbAssets.get(name)` and use whatever texture comes back.
// ---------------------------------------------------------------------------

const baseTexture = () =>
  new FakeTexture({
    source: { fake: 'pixels' },
    frame: new FakeRectangle(0, 0, 256, 256),
  });

/** Preloaded asset cache seeded with one real-shaped base texture under 'sheet.png'. */
async function preloadedAssets() {
  const texture = baseTexture();
  const assets = loadAssets(fakePixi(texture));
  await assets.preload([{ name: 'sheet.png', src: 'sheet.png' }]);
  return { assets, texture };
}

describe('defineRegion — deriving a named crop from an already-loaded image', () => {
  test('registers a texture whose frame is exactly the requested rectangle', async () => {
    const { assets, texture } = await preloadedAssets();

    assets.defineRegion('enemyframes', 'sheet.png', 0, 64, 128, 32);
    const region = assets.get('enemyframes');

    expect(region.source).toBe(texture.source);
    expect(region.frame).toEqual({ x: 0, y: 64, width: 128, height: 32 });
    expect(region.width).toBe(128);
    expect(region.height).toBe(32);
  });

  test('composes nested regions relative to the parent region, not the original image', async () => {
    const { assets, texture } = await preloadedAssets();

    // First crop: the enemy region, offset (10, 20) within the sheet.
    assets.defineRegion('enemyregion', 'sheet.png', 10, 20, 100, 60);
    // Second crop: a sub-region *within* the first crop, offset (5, 5)
    // relative to the enemy region — should land at (15, 25) in the
    // original image, not (5, 5), if offsets compose correctly.
    assets.defineRegion('enemyheadonly', 'enemyregion', 5, 5, 20, 20);

    const region = assets.get('enemyheadonly');
    expect(region.frame).toEqual({ x: 15, y: 25, width: 20, height: 20 });
    expect(region.source).toBe(texture.source);
  });

  test('throws when the source image has not been loaded', async () => {
    const { assets } = await preloadedAssets();
    expect(() => assets.defineRegion('crop', 'missing.png', 0, 0, 10, 10)).toThrow(
      'Asset "missing.png" not found. Make sure the filename is correct and included in your assets.'
    );
  });

  test('throws a friendly error when defined before assets finish loading', () => {
    const assets = loadAssets();
    expect(() => assets.defineRegion('crop', 'sheet.png', 0, 0, 10, 10)).toThrow(/oninit\(\)/);
  });

  test('throws when the new name collides with an existing asset', async () => {
    const { assets } = await preloadedAssets();
    expect(() => assets.defineRegion('sheet.png', 'sheet.png', 0, 0, 10, 10)).toThrow(
      /already exists/
    );
  });
});

// ---------------------------------------------------------------------------
// Roadmap issue #21: createTileMap/createAnimatedSprite re-sliced their full
// cell grid from scratch on every construction, even when multiple instances
// share the identical (name, cellW, cellH). getSlices memoizes the derived
// frame array so repeat callers get back the SAME array/texture objects
// instead of independently re-deriving them — cheap to verify with
// reference equality, since nothing downstream mutates the array in place.
// ---------------------------------------------------------------------------

describe('getSlices — memoized frame slicing', () => {
  test('slices the base image into the expected grid of textures', async () => {
    const { assets, texture } = await preloadedAssets();
    const frames = assets.getSlices('sheet.png', 32, 32);
    expect(frames).toHaveLength(64); // 256/32 = 8 cols x 8 rows
    expect(frames[0].frame).toEqual({ x: 0, y: 0, width: 32, height: 32 });
    expect(frames[1].frame).toEqual({ x: 32, y: 0, width: 32, height: 32 });
    expect(frames[8].frame).toEqual({ x: 0, y: 32, width: 32, height: 32 });
    frames.forEach((f: FakeTexture) => expect(f.source).toBe(texture.source));
  });

  test('returns the SAME array on a repeat call with identical (name, cellW, cellH)', async () => {
    const { assets } = await preloadedAssets();
    const first = assets.getSlices('sheet.png', 32, 32);
    const second = assets.getSlices('sheet.png', 32, 32);
    expect(second).toBe(first);
  });

  test('a different cell size for the same name produces an independent array', async () => {
    const { assets } = await preloadedAssets();
    const at32 = assets.getSlices('sheet.png', 32, 32);
    const at64 = assets.getSlices('sheet.png', 64, 64);
    expect(at64).not.toBe(at32);
    expect(at64).toHaveLength(16); // 256/64 = 4 cols x 4 rows
  });

  test('the same cell size for a different name produces an independent array', async () => {
    const { assets } = await preloadedAssets();
    assets.defineRegion('crop', 'sheet.png', 0, 0, 128, 128);
    const sheetSlices = assets.getSlices('sheet.png', 32, 32);
    const cropSlices = assets.getSlices('crop', 32, 32);
    expect(cropSlices).not.toBe(sheetSlices);
    expect(cropSlices).toHaveLength(16); // 128/32 = 4 cols x 4 rows
  });

  test('works on a defineRegion-derived name, offsetting frames by the region\'s own origin', async () => {
    const { assets } = await preloadedAssets();
    assets.defineRegion('crop', 'sheet.png', 64, 64, 64, 64);
    const frames = assets.getSlices('crop', 32, 32);
    expect(frames).toHaveLength(4); // 64/32 = 2 cols x 2 rows
    expect(frames[0].frame).toEqual({ x: 64, y: 64, width: 32, height: 32 });
  });
});

// ---------------------------------------------------------------------------
// A `.stm` / `.json` asset blob persisted without a MIME type (older app
// versions; an OS that assigns nothing to the `.stm` extension) reaches the
// runner as `data:application/octet-stream`. PIXI v8 has no loader parser for
// that, so `PIXI.Assets.load` resolves `null`, `_sbAssets` caches null, and
// `createTileMapSet` throws "Cannot read properties of null (reading
// 'tileWidth')". preload() must decode our own text formats directly.
// ---------------------------------------------------------------------------

describe('preload — text assets decoded without PIXI MIME sniffing', () => {
  const STM = JSON.stringify({ tileWidth: 16, tileHeight: 16, layers: { walls: [[1, 1]] } });
  const b64 = (s: string) => Buffer.from(s, 'utf-8').toString('base64');

  function trackingPixi() {
    const loadCalls: string[] = [];
    const pixi = {
      Assets: {
        add() {},
        async load(name: string) {
          loadCalls.push(name);
          return name.endsWith('.png') ? { width: 8, height: 8 } : null; // PIXI: unknown MIME -> null
        },
      },
      Texture: FakeTexture,
      Rectangle: FakeRectangle,
    };
    return { pixi, loadCalls };
  }

  test('a typeless .stm data URL is decoded + JSON-parsed, never handed to PIXI', async () => {
    const { pixi, loadCalls } = trackingPixi();
    const assets = loadAssets(pixi as never);
    await assets.preload([{ name: 'room.stm', src: `data:application/octet-stream;base64,${b64(STM)}` }]);
    expect(loadCalls).not.toContain('room.stm');
    expect(assets.get('room.stm')).toEqual(JSON.parse(STM));
  });

  test('a bare `data:;base64` .stm URL still decodes', async () => {
    const { pixi } = trackingPixi();
    const assets = loadAssets(pixi as never);
    await assets.preload([{ name: 'lvl.stm', src: `data:;base64,${b64(STM)}` }]);
    expect(assets.get('lvl.stm')).toEqual(JSON.parse(STM));
  });

  test('.json tilemap data is parsed to its array', async () => {
    const { pixi } = trackingPixi();
    const assets = loadAssets(pixi as never);
    const arr = JSON.stringify([[0, 1], [1, 0]]);
    await assets.preload([{ name: 'map.json', src: `data:application/json;base64,${b64(arr)}` }]);
    expect(assets.get('map.json')).toEqual([[0, 1], [1, 0]]);
  });

  test('image assets still load through PIXI.Assets.load', async () => {
    const { pixi, loadCalls } = trackingPixi();
    const assets = loadAssets(pixi as never);
    await assets.preload([{ name: 'tiles.png', src: 'data:image/png;base64,AAAA' }]);
    expect(loadCalls).toContain('tiles.png');
    expect(assets.get('tiles.png')).toEqual({ width: 8, height: 8 });
  });
});
