// tests/ui/components/AssetTree/validateAssetName.test.ts
import { describe, test, expect } from 'vitest';
import { validateAssetName } from '../../../../src/components/TreePanel/AssetTree/validateAssetName';

const existingAssets = [
  { name: 'hero.png', folderId: null },
  { name: 'config.json', folderId: 'folder1' },
];

describe('validateAssetName', () => {
  test('empty name returns an error', () => {
    expect(validateAssetName('', existingAssets, null)).not.toBeNull();
  });

  test('whitespace-only name returns an error', () => {
    expect(validateAssetName('   ', existingAssets, null)).not.toBeNull();
  });

  test('duplicate name in the SAME folder returns an error', () => {
    expect(validateAssetName('hero.png', existingAssets, null)).not.toBeNull();
  });

  test('error message includes the filename', () => {
    const err = validateAssetName('hero.png', existingAssets, null);
    expect(err).toContain('hero.png');
  });

  test('duplicate name in a DIFFERENT folder returns null (allowed)', () => {
    // 'config.json' exists in folder1, not in root (null)
    expect(validateAssetName('config.json', existingAssets, null)).toBeNull();
  });

  test('unique name returns null', () => {
    expect(validateAssetName('newfile.txt', existingAssets, null)).toBeNull();
  });

  test('duplicate name in a non-null folder returns an error', () => {
    // 'config.json' exists in folder1
    expect(validateAssetName('config.json', existingAssets, 'folder1')).not.toBeNull();
  });

  test('same filename in a different non-null folder returns null', () => {
    // 'config.json' is only in folder1, not in folder2
    expect(validateAssetName('config.json', existingAssets, 'folder2')).toBeNull();
  });
});
