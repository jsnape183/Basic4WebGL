import { describe, test, expect } from 'vitest';
import { decodeStmContent, encodeStmContent } from '../../../../src/components/TileMapEditor';

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
});
