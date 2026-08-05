// tests/ui/components/TileMapEditor/useTilesetSlices.test.ts
// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useTilesetSlices } from '../../../../src/components/TileMapEditor/useTilesetSlices';

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 32;
  height = 16;
  set src(_v: string) {
    setTimeout(() => this.onload?.(), 0);
  }
}

beforeEach(() => {
  vi.stubGlobal('Image', MockImage as unknown as typeof Image);
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    drawImage: vi.fn(),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  let callCount = 0;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => `data:tile-${callCount++}`);
});

describe('useTilesetSlices', () => {
  test('slices a 32x16 image into 4x2 tiles of 8x8', async () => {
    const { result } = renderHook(() => useTilesetSlices('data:image/png;base64,xxx', 8, 8));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cols).toBe(4);
    expect(result.current.rows).toBe(2);
    expect(result.current.slices).toHaveLength(8);
  });

  test('returns empty state when imageContent is undefined', () => {
    const { result } = renderHook(() => useTilesetSlices(undefined, 8, 8));
    expect(result.current.slices).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });

  test('returns empty state when tileWidth or tileHeight is zero', () => {
    const { result } = renderHook(() => useTilesetSlices('data:image/png;base64,xxx', 0, 8));
    expect(result.current.slices).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });
});
