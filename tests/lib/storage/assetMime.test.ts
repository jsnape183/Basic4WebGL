import { describe, test, expect } from 'vitest';
import { assetMimeFromName, blobWithAssetMime } from '../../../src/lib/storage/assetMime';

describe('assetMimeFromName', () => {
  test('.stm and .json map to application/json', () => {
    expect(assetMimeFromName('p5room.stm')).toBe('application/json');
    expect(assetMimeFromName('LEVEL1.STM')).toBe('application/json');
    expect(assetMimeFromName('tiles.json')).toBe('application/json');
  });

  test('image + audio extensions map to their standard types', () => {
    expect(assetMimeFromName('sheet.png')).toBe('image/png');
    expect(assetMimeFromName('jump.wav')).toBe('audio/wav');
  });

  test('unknown extensions fall back to text/plain', () => {
    expect(assetMimeFromName('notes.txt')).toBe('text/plain');
    expect(assetMimeFromName('README')).toBe('text/plain');
  });
});

describe('blobWithAssetMime', () => {
  test('rewraps a typeless .stm File with application/json', () => {
    const file = new File(['{"tileWidth":16}'], 'room.stm', { type: '' });
    const out = blobWithAssetMime(file);
    expect(out.type).toBe('application/json');
  });

  test('leaves a File that already has a type untouched', () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'tiles.png', { type: 'image/png' });
    expect(blobWithAssetMime(file)).toBe(file);
  });
});
