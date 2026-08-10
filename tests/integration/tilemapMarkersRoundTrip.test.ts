// tests/integration/tilemapMarkersRoundTrip.test.ts
// @vitest-environment jsdom
//
// Closes an integration gap flagged in the tilemap-markers holistic review:
// the editor's encodeStmContent (src/components/TileMapEditor/index.tsx) and
// the engine's createTileMapSet/markersByTag (src/components/Runner/engine/
// tilemap.js) were built and tested in separate tasks, each against
// hand-built fixture JSON on its own side — nothing fed the REAL editor
// output into the REAL engine parser. This test wires the two together, so
// future drift between the two independently-maintained sides of the `.stm`
// contract gets caught here instead of silently.
import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import { encodeStmContent } from '../../src/components/TileMapEditor';
import { EditorLayer, StmDoc } from '../../src/components/TileMapEditor/types';

// Same engine-loading harness as tests/components/Runner/tilemap.test.ts —
// tilemap.js is a plain script (not an ES module): it declares bare globals
// (_sbAssets, _sbTilemaps) meant to be concatenated into the sandboxed
// runner iframe alongside assets.js, and reads `worldContainer`/
// `hudContainer` that stage.js normally supplies. Evaluate both scripts
// together in a Function context with a minimal PIXI stub, exactly as that
// file does — reusing the technique rather than reinventing it.
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
class FakeContainer {
  children: unknown[] = [];
  x = 0; y = 0; parent: unknown = null;
  addChild(c: unknown) { this.children.push(c); }
  removeChildren() { this.children = []; }
}

/** loadResults maps asset name -> what the stubbed PIXI.Assets.load() resolves to. */
function loadTilemapWithAssets(loadResults: Record<string, unknown>) {
  const assetsSrc = readFileSync('src/components/Runner/engine/assets.js', 'utf-8');
  const tilemapSrc = readFileSync('src/components/Runner/engine/tilemap.js', 'utf-8');
  const PIXI = {
    Container: FakeContainer,
    Texture: FakeTexture,
    Rectangle: FakeRectangle,
    Sprite: FakeContainer,
    Assets: { add() {}, async load(name: string) { return loadResults[name]; } },
  };
  const factory = new Function(
    'PIXI', 'worldContainer', 'hudContainer',
    `${assetsSrc}\n${tilemapSrc}\n return { _sbAssets, _sbTilemaps };`
  );
  return factory(PIXI, {}, {});
}

// Generic base64/UTF-8-safe decode of a `data:` URL's payload — this is the
// same plumbing a real browser fetch of a `data:` URL performs, not the
// encode/decode domain logic under test (that's encodeStmContent's
// layer-shape mapping). tilemap.js's createTileMapSet comment explains why
// this matters: PIXI has no parser registered for the custom `.stm`
// extension, so a real asset load resolves to the raw decoded text, not a
// parsed object — createTileMapSet does its own JSON.parse on a string. So
// the fake loader here is fed decoded text, exercising that exact branch.
function decodeDataUrlToText(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  const base64 = dataUrl.slice(comma + 1);
  return decodeURIComponent(escape(atob(base64)));
}

describe('tilemap markers — editor encode -> engine parse round trip', () => {
  test('markersByTag on the real encodeStmContent output returns the painted markers\' world positions', async () => {
    const groundLayer: EditorLayer = {
      key: 'ground-key', name: 'ground', kind: 'tile',
      data: [[1, 2], [3, 4]],
    };
    const spawnsLayer: EditorLayer = {
      key: 'spawns-key', name: 'spawns', kind: 'marker',
      markers: [
        { row: 0, col: 1, tag: 'spawn' },
        { row: 1, col: 0, tag: 'enemy' },
      ],
    };
    const doc: StmDoc = {
      tileWidth: 16, tileHeight: 16, tileImage: 'tileset.png',
      layers: [groundLayer, spawnsLayer],
    };

    // The REAL editor encode path — exactly what TileMapEditor's Save button
    // calls (src/components/TileMapEditor/index.tsx handleSave).
    const encoded = encodeStmContent(doc, 'data:application/json;base64,');
    const decodedText = decodeDataUrlToText(encoded);

    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 64, 64) });
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({
      'tileset.png': texture,
      'level.stm': decodedText,
    });
    await _sbAssets.preload([
      { name: 'tileset.png', src: 'tileset.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    // The REAL engine parse path.
    const set = _sbTilemaps.createTileMapSet('level.stm');

    // The tile layer rendered as a normal layer container; the marker layer
    // produced no container and its entries were accumulated onto the set.
    expect(Object.keys(set._layerContainers)).toEqual(['ground']);
    expect(set._markers).toEqual([
      { row: 0, col: 1, tag: 'spawn' },
      { row: 1, col: 0, tag: 'enemy' },
    ]);

    // World-space cell-center positions for each tag, proving the full
    // chain: editor data model -> encodeStmContent -> real .stm JSON ->
    // engine parse -> markersByTag query.
    expect(_sbTilemaps.markersByTag(set, 'spawn')).toEqual([{ x: 24, y: 8 }]);
    expect(_sbTilemaps.markersByTag(set, 'enemy')).toEqual([{ x: 8, y: 24 }]);
    expect(_sbTilemaps.markersByTag(set, 'nonexistent')).toEqual([]);
  });
});
