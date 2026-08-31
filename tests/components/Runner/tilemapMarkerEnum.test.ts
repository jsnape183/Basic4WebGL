import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// tilemap.js is a plain script declaring bare `const _sbTilemaps` + reading
// `_sbAssets`/`PIXI`/`worldContainer`/`hudContainer` globals. Same harness as
// tests/components/Runner/tilemap.test.ts / tests/integration/tilemapMarkersRoundTrip.ts.
class FakeRectangle {
  constructor(public x: number, public y: number, public width: number, public height: number) {}
}
class FakeContainer {
  children: unknown[] = [];
  x = 0;
  y = 0;
  parent: unknown = null;
  addChild(c: unknown) { this.children.push(c); }
  removeChildren() { this.children = []; }
}
function loadTilemap() {
  const assetsSrc = readFileSync('src/components/Runner/engine/assets.js', 'utf-8');
  const tilemapSrc = readFileSync('src/components/Runner/engine/tilemap.js', 'utf-8');
  const PIXI = {
    Container: FakeContainer,
    Sprite: FakeContainer,
    Rectangle: FakeRectangle,
    Texture: class {},
    Assets: { add() {}, async load() { return {}; } },
  };
  const factory = new Function(
    'PIXI', 'worldContainer', 'hudContainer',
    `${assetsSrc}\n${tilemapSrc}\n return { _sbAssets, _sbTilemaps };`,
  );
  return factory(PIXI, new FakeContainer(), new FakeContainer()) as {
    _sbAssets: { get: (n: string) => unknown };
    _sbTilemaps: {
      createTileMapSet: (p: string) => unknown;
      allMarkers: (h: unknown) => Array<{ col: number; row: number; tag: string }>;
      tileWidth: (h: unknown) => number;
      tileHeight: (h: unknown) => number;
      markersByTag: (h: unknown, t: string) => Array<{ x: number; y: number }>;
      getTileMapSetLayer: (h: unknown, n: string) => unknown;
      tileMapWidthPx: (h: unknown) => number;
      tileAt: (h: unknown, x: number, y: number) => number;
    };
  };
}

const STM = JSON.stringify({
  tileWidth: 16,
  tileHeight: 24,
  tileImage: 'tiles.png',
  layers: {
    walls: [
      [1, 1, 1],
      [1, 0, 1],
    ],
    tags: {
      type: 'markers',
      markers: [
        { row: 0, col: 2, tag: 'floor:2 door' },
        { row: 1, col: 1, tag: 'light:spot' },
      ],
    },
  },
});

describe('tilemap — marker enumeration + tile metrics', () => {
  function makeSet() {
    const { _sbAssets, _sbTilemaps } = loadTilemap();
    (_sbAssets as unknown as { get: (n: string) => unknown }).get = (name: string) => {
      if (name === 'level.stm') return STM;
      if (name === 'tiles.png') {
        return { source: {}, frame: new FakeRectangle(0, 0, 16, 24), width: 16, height: 24 };
      }
      throw new Error(`unexpected asset ${name}`);
    };
    return { _sbTilemaps, handle: _sbTilemaps.createTileMapSet('level.stm') };
  }

  test('allMarkers returns every marker with col/row/tag', () => {
    const { _sbTilemaps, handle } = makeSet();
    const all = _sbTilemaps.allMarkers(handle);
    expect(all).toEqual([
      { col: 2, row: 0, tag: 'floor:2 door' },
      { col: 1, row: 1, tag: 'light:spot' },
    ]);
  });

  test('tileWidth / tileHeight report the .stm values', () => {
    const { _sbTilemaps, handle } = makeSet();
    expect(_sbTilemaps.tileWidth(handle)).toBe(16);
    expect(_sbTilemaps.tileHeight(handle)).toBe(24);
  });

  test('existing markersByTag is unchanged', () => {
    const { _sbTilemaps, handle } = makeSet();
    expect(_sbTilemaps.markersByTag(handle, 'light:spot')).toEqual([
      { x: 1 * 16 + 8, y: 1 * 24 + 12 },
    ]);
  });

  test('set-layer container supports widthPx / tileAt (Task 3 needs this)', () => {
    const { _sbTilemaps, handle } = makeSet();
    const walls = _sbTilemaps.getTileMapSetLayer(handle, 'walls');
    expect(_sbTilemaps.tileMapWidthPx(walls)).toBe(3 * 16);
    expect(_sbTilemaps.tileAt(walls, 0, 0)).toBe(1);
    expect(_sbTilemaps.tileAt(walls, 16 + 1, 24 + 1)).toBe(0);
  });
});
