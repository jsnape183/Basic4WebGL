import { describe, test, expect } from 'vitest';
import { resizeGrid } from '../../../../src/components/TileMapEditor/resize';

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
