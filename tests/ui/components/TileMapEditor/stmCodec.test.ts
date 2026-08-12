import { describe, test, expect } from 'vitest';
import { decodeStmContent, encodeStmContent, exportStmDoc } from '../../../../src/components/TileMapEditor';
import { StmDoc } from '../../../../src/components/TileMapEditor/types';

function toDataUrl(json: unknown): string {
  return 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(json))));
}

describe('decodeStmContent', () => {
  test('decodes a bare-array layer as a tile layer', () => {
    const content = toDataUrl({ tileWidth: 16, tileHeight: 16, tileImage: 'a.png', layers: { background: [[1, 0], [0, 1]] } });
    const doc = decodeStmContent(content);
    expect(doc.layers).toHaveLength(1);
    expect(doc.layers[0]).toMatchObject({ name: 'background', kind: 'tile', data: [[1, 0], [0, 1]] });
  });

  test('decodes a { type: "markers" } layer as a marker layer', () => {
    const content = toDataUrl({
      tileWidth: 16, tileHeight: 16, tileImage: 'a.png',
      layers: { spawns: { type: 'markers', markers: [{ row: 1, col: 2, tag: 'spawn' }] } },
    });
    const doc = decodeStmContent(content);
    expect(doc.layers).toHaveLength(1);
    expect(doc.layers[0]).toMatchObject({ name: 'spawns', kind: 'marker', markers: [{ row: 1, col: 2, tag: 'spawn' }] });
  });

  test('decodes a file mixing tile and marker layers, preserving order', () => {
    const content = toDataUrl({
      tileWidth: 16, tileHeight: 16, tileImage: 'a.png',
      layers: {
        background: [[1, 0]],
        spawns: { type: 'markers', markers: [] },
      },
    });
    const doc = decodeStmContent(content);
    expect(doc.layers.map((l) => l.kind)).toEqual(['tile', 'marker']);
  });

  test('decodes a { type: "collision" } layer as a collision layer', () => {
    const content = toDataUrl({
      tileWidth: 16, tileHeight: 16, tileImage: 'a.png',
      layers: { solidmask: { type: 'collision', data: [[1, 0], [0, 1]] } },
    });
    const doc = decodeStmContent(content);
    expect(doc.layers).toHaveLength(1);
    expect(doc.layers[0]).toMatchObject({ name: 'solidmask', kind: 'collision', data: [[1, 0], [0, 1]] });
  });

  test('decodes a file mixing tile, marker, and collision layers, preserving order', () => {
    const content = toDataUrl({
      tileWidth: 16, tileHeight: 16, tileImage: 'a.png',
      layers: {
        background: [[1, 0]],
        spawns: { type: 'markers', markers: [] },
        solidmask: { type: 'collision', data: [[0, 0]] },
      },
    });
    const doc = decodeStmContent(content);
    expect(doc.layers.map((l) => l.kind)).toEqual(['tile', 'marker', 'collision']);
  });
});

describe('encodeStmContent', () => {
  test('round-trips a tile layer as a bare array', () => {
    const content = toDataUrl({ tileWidth: 16, tileHeight: 16, tileImage: 'a.png', layers: { background: [[1, 0]] } });
    const doc = decodeStmContent(content);
    const reEncoded = encodeStmContent(doc, content);
    const decoded = JSON.parse(decodeURIComponent(escape(atob(reEncoded.split(',')[1]))));
    expect(decoded.layers.background).toEqual([[1, 0]]);
  });

  test('round-trips a marker layer as { type: "markers" }', () => {
    const content = toDataUrl({
      tileWidth: 16, tileHeight: 16, tileImage: 'a.png',
      layers: { spawns: { type: 'markers', markers: [{ row: 1, col: 2, tag: 'spawn' }] } },
    });
    const doc = decodeStmContent(content);
    const reEncoded = encodeStmContent(doc, content);
    const decoded = JSON.parse(decodeURIComponent(escape(atob(reEncoded.split(',')[1]))));
    expect(decoded.layers.spawns).toEqual({ type: 'markers', markers: [{ row: 1, col: 2, tag: 'spawn' }] });
  });

  test('round-trips a collision layer as { type: "collision" }', () => {
    const content = toDataUrl({
      tileWidth: 16, tileHeight: 16, tileImage: 'a.png',
      layers: { solidmask: { type: 'collision', data: [[1, 0]] } },
    });
    const doc = decodeStmContent(content);
    const reEncoded = encodeStmContent(doc, content);
    const decoded = JSON.parse(decodeURIComponent(escape(atob(reEncoded.split(',')[1]))));
    expect(decoded.layers.solidmask).toEqual({ type: 'collision', data: [[1, 0]] });
  });
});

describe('exportStmDoc', () => {
  test('produces plain JSON, not a data: URL', () => {
    const doc: StmDoc = {
      tileWidth: 16,
      tileHeight: 16,
      tileImage: 'a.png',
      layers: [{ key: 'k1', name: 'background', kind: 'tile', data: [[1, 0]] }],
    };
    const exported = exportStmDoc(doc);
    expect(exported.startsWith('data:')).toBe(false);
    expect(() => JSON.parse(exported)).not.toThrow();
  });

  test('serializes tile layers as bare arrays and marker layers as { type: "markers" }', () => {
    const doc: StmDoc = {
      tileWidth: 8,
      tileHeight: 8,
      tileImage: 'tileset.png',
      layers: [
        { key: 'k1', name: 'background', kind: 'tile', data: [[1, 1], [0, 0]] },
        { key: 'k2', name: 'spawns', kind: 'marker', markers: [{ row: 0, col: 1, tag: 'spawn' }] },
      ],
    };
    const parsed = JSON.parse(exportStmDoc(doc));
    expect(parsed).toEqual({
      tileWidth: 8,
      tileHeight: 8,
      tileImage: 'tileset.png',
      layers: {
        background: [[1, 1], [0, 0]],
        spawns: { type: 'markers', markers: [{ row: 0, col: 1, tag: 'spawn' }] },
      },
    });
  });

  test('round-trips through decodeStmContent back to the same layer shape', () => {
    const doc: StmDoc = {
      tileWidth: 8,
      tileHeight: 8,
      tileImage: 'tileset.png',
      layers: [
        { key: 'k1', name: 'background', kind: 'tile', data: [[1, 1], [0, 0]] },
        { key: 'k2', name: 'spawns', kind: 'marker', markers: [{ row: 0, col: 1, tag: 'spawn' }] },
      ],
    };
    const exported = exportStmDoc(doc);
    const asDataUrl = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(exported)));
    const decoded = decodeStmContent(asDataUrl);

    expect(decoded.tileWidth).toBe(8);
    expect(decoded.tileHeight).toBe(8);
    expect(decoded.tileImage).toBe('tileset.png');
    expect(decoded.layers).toHaveLength(2);
    expect(decoded.layers[0]).toMatchObject({ name: 'background', kind: 'tile', data: [[1, 1], [0, 0]] });
    expect(decoded.layers[1]).toMatchObject({
      name: 'spawns',
      kind: 'marker',
      markers: [{ row: 0, col: 1, tag: 'spawn' }],
    });
  });

  test('serializes a collision layer as { type: "collision", data }', () => {
    const doc: StmDoc = {
      tileWidth: 8,
      tileHeight: 8,
      tileImage: 'tileset.png',
      layers: [
        { key: 'k1', name: 'background', kind: 'tile', data: [[1, 1], [0, 0]] },
        { key: 'k2', name: 'solidmask', kind: 'collision', data: [[1, 0], [0, 0]] },
      ],
    };
    const parsed = JSON.parse(exportStmDoc(doc));
    expect(parsed.layers).toEqual({
      background: [[1, 1], [0, 0]],
      solidmask: { type: 'collision', data: [[1, 0], [0, 0]] },
    });
  });
});
