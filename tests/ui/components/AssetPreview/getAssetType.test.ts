import { describe, test, expect } from 'vitest';
import { getAssetType } from '../../../../src/components/AssetPreview/getAssetType';

describe('getAssetType', () => {
  test.each(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'])(
    'extension %s → image',
    (ext) => expect(getAssetType(`photo${ext}`)).toBe('image')
  );

  test('PNG in uppercase → image', () => expect(getAssetType('photo.PNG')).toBe('image'));

  test.each(['.json', '.txt', '.csv', '.bas', '.xml'])(
    'extension %s → text',
    (ext) => expect(getAssetType(`file${ext}`)).toBe('text')
  );

  test('unknown extension → text', () => expect(getAssetType('file.unknown')).toBe('text'));
  test('no extension → text', () => expect(getAssetType('nodotfile')).toBe('text'));
});
