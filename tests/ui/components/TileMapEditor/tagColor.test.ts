import { describe, test, expect } from 'vitest';
import { tagColor } from '../../../../src/components/TileMapEditor/tagColor';

describe('tagColor', () => {
  test('returns the same color for the same tag every time', () => {
    expect(tagColor('spawn')).toBe(tagColor('spawn'));
  });

  test('returns different colors for two different tags', () => {
    expect(tagColor('spawn')).not.toBe(tagColor('pickup'));
  });

  test('returns a valid hsl() string', () => {
    expect(tagColor('spawn')).toMatch(/^hsl\(\d+, 70%, 55%\)$/);
  });

  test('handles an empty string without throwing', () => {
    expect(() => tagColor('')).not.toThrow();
  });
});
