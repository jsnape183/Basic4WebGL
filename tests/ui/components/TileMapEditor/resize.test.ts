import { describe, test, expect } from 'vitest';
import { resizeGrid, resizeStmDoc, describeResizeLoss } from '../../../../src/components/TileMapEditor/resize';
import { StmDoc } from '../../../../src/components/TileMapEditor/types';

describe('resizeGrid', () => {
  test('growing rows pads new rows with zeros, keeps existing rows', () => {
    expect(resizeGrid([[1, 2], [3, 4]], 3, 2)).toEqual([[1, 2], [3, 4], [0, 0]]);
  });

  test('growing columns pads new columns with zeros', () => {
    expect(resizeGrid([[1, 2], [3, 4]], 2, 4)).toEqual([[1, 2, 0, 0], [3, 4, 0, 0]]);
  });

  test('growing both dimensions', () => {
    expect(resizeGrid([[5]], 2, 3)).toEqual([[5, 0, 0], [0, 0, 0]]);
  });

  test('shrinking rows trims from the bottom', () => {
    expect(resizeGrid([[1, 2], [3, 4], [5, 6]], 2, 2)).toEqual([[1, 2], [3, 4]]);
  });

  test('shrinking columns trims from the right', () => {
    expect(resizeGrid([[1, 2, 3], [4, 5, 6]], 2, 2)).toEqual([[1, 2], [4, 5]]);
  });

  test('top-left values are preserved on any resize', () => {
    expect(resizeGrid([[9, 8], [7, 6]], 1, 1)).toEqual([[9]]);
  });

  test('shrink then grow does not resurrect trimmed values', () => {
    const shrunk = resizeGrid([[1, 2], [3, 4]], 1, 1);
    expect(resizeGrid(shrunk, 2, 2)).toEqual([[1, 0], [0, 0]]);
  });

  test('returns a fresh nested array (no shared row references)', () => {
    const src = [[1, 2]];
    const out = resizeGrid(src, 1, 2);
    out[0][0] = 99;
    expect(src[0][0]).toBe(1);
  });
});

describe('resizeStmDoc', () => {
  const doc: StmDoc = {
    tileWidth: 8, tileHeight: 8, tileImage: 'tiles.png', tags: ['spawn', 'exit'],
    layers: [
      { key: 'k1', name: 'ground', kind: 'tile', data: [[1, 2], [3, 4]] },
      { key: 'k2', name: 'solid', kind: 'collision', data: [[1, 0], [0, 1]] },
      { key: 'k3', name: 'marks', kind: 'marker', markers: [
        { row: 0, col: 0, tag: 'spawn' },
        { row: 1, col: 1, tag: 'exit' },
      ] },
    ],
  };

  test('reshapes every dense layer to the new size', () => {
    const out = resizeStmDoc(doc, 3, 3);
    expect((out.layers[0] as { data: number[][] }).data).toEqual([[1, 2, 0], [3, 4, 0], [0, 0, 0]]);
    expect((out.layers[1] as { data: number[][] }).data).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 0]]);
  });

  test('drops markers that fall outside the new bounds, keeps the rest', () => {
    const out = resizeStmDoc(doc, 1, 1);
    expect((out.layers[2] as { markers: unknown[] }).markers).toEqual([{ row: 0, col: 0, tag: 'spawn' }]);
  });

  test('a marker exactly on the new edge is dropped (indices are 0-based)', () => {
    const out = resizeStmDoc(doc, 1, 2);
    expect((out.layers[2] as { markers: unknown[] }).markers).toEqual([{ row: 0, col: 0, tag: 'spawn' }]);
  });

  test('preserves tags, tile size, image, and every layer key/name/kind', () => {
    const out = resizeStmDoc(doc, 2, 2);
    expect(out.tags).toEqual(['spawn', 'exit']);
    expect(out.tileWidth).toBe(8);
    expect(out.tileHeight).toBe(8);
    expect(out.tileImage).toBe('tiles.png');
    expect(out.layers.map((l) => [l.key, l.name, l.kind])).toEqual([
      ['k1', 'ground', 'tile'], ['k2', 'solid', 'collision'], ['k3', 'marks', 'marker'],
    ]);
  });

  test('resizing to the current size is a no-op in content terms', () => {
    const out = resizeStmDoc(doc, 2, 2);
    expect((out.layers[0] as { data: number[][] }).data).toEqual([[1, 2], [3, 4]]);
    expect((out.layers[2] as { markers: unknown[] }).markers).toEqual(doc.layers[2].kind === 'marker' ? doc.layers[2].markers : []);
  });

  test('does not mutate the input doc', () => {
    resizeStmDoc(doc, 1, 1);
    expect((doc.layers[0] as { data: number[][] }).data).toEqual([[1, 2], [3, 4]]);
    expect((doc.layers[2] as { markers: unknown[] }).markers).toHaveLength(2);
  });
});

describe('describeResizeLoss', () => {
  const doc: StmDoc = {
    tileWidth: 8, tileHeight: 8, tileImage: 'tiles.png',
    layers: [
      { key: 'k1', name: 'ground', kind: 'tile', data: [[1, 1, 0], [1, 0, 0], [0, 0, 0]] },
      { key: 'k2', name: 'solid', kind: 'collision', data: [[0, 0, 1], [0, 0, 0], [0, 0, 0]] },
      { key: 'k3', name: 'marks', kind: 'marker', markers: [
        { row: 0, col: 0, tag: 'a' },
        { row: 2, col: 2, tag: 'b' },
      ] },
    ],
  };

  test('growing in both dimensions discards nothing', () => {
    expect(describeResizeLoss(doc, 5, 5)).toEqual({ tiles: 0, collisionCells: 0, markers: 0 });
  });

  test('shrinking counts non-zero tiles outside the new bounds', () => {
    // marker 'b' at (2,2) is also outside rows=1, so markers:1 (plan text said 0 — impossible:
    // a marker lost at rows=2 is necessarily lost at rows=1; T3/T4/T5 all require b to count).
    expect(describeResizeLoss(doc, 1, 3)).toEqual({ tiles: 1, collisionCells: 0, markers: 1 });
  });

  test('empty (zero) cells outside the new bounds are not counted', () => {
    expect(describeResizeLoss(doc, 2, 2)).toEqual({ tiles: 0, collisionCells: 1, markers: 1 });
  });

  test('counts collision cells and markers independently', () => {
    // ground has two non-zero cells outside 1x1: (0,1) and (1,0) — so tiles:2
    // (plan text said 1, undercounting one of them).
    expect(describeResizeLoss(doc, 1, 1)).toEqual({ tiles: 2, collisionCells: 1, markers: 1 });
  });

  test('a marker exactly on the new edge counts as lost', () => {
    expect(describeResizeLoss(doc, 2, 3).markers).toBe(1);
  });
});
