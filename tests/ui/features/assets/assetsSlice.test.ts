import { describe, test, expect } from 'vitest';
import assetsReducer, {
  IAssetsState,
  addAsset,
  removeAsset,
  setAssetFolder,
  batchSetAssetFolder,
  batchSetAssetFullNames,
} from '../../../../src/features/assets/assetsSlice';

const initial: IAssetsState = { byId: {} };

describe('addAsset', () => {
  test('defaults folderId to null and fullName to name', () => {
    const s = assetsReducer(initial, addAsset({ id: 'a1', name: 'bunny.png', content: 'data:...', projectId: 'p1' }));
    expect(s.byId['a1'].folderId).toBeNull();
    expect(s.byId['a1'].fullName).toBe('bunny.png');
  });

  test('accepts explicit folderId and fullName', () => {
    const s = assetsReducer(initial, addAsset({
      id: 'a1', name: 'bunny.png', content: 'data:...', projectId: 'p1',
      folderId: 'sprites', fullName: 'sprites/bunny.png',
    }));
    expect(s.byId['a1'].folderId).toBe('sprites');
    expect(s.byId['a1'].fullName).toBe('sprites/bunny.png');
  });
});

describe('setAssetFolder', () => {
  test('updates folderId and fullName', () => {
    let s = assetsReducer(initial, addAsset({ id: 'a1', name: 'bunny.png', content: '', projectId: 'p1' }));
    s = assetsReducer(s, setAssetFolder({ assetId: 'a1', folderId: 'f1', fullName: 'Sprites/bunny.png' }));
    expect(s.byId['a1'].folderId).toBe('f1');
    expect(s.byId['a1'].fullName).toBe('Sprites/bunny.png');
  });
});

describe('batchSetAssetFolder', () => {
  test('updates multiple assets', () => {
    let s = assetsReducer(initial, addAsset({ id: 'a1', name: 'a.png', content: '', projectId: 'p1' }));
    s = assetsReducer(s, addAsset({ id: 'a2', name: 'b.png', content: '', projectId: 'p1' }));
    s = assetsReducer(s, batchSetAssetFolder([
      { id: 'a1', folderId: 'f1', fullName: 'Sprites/a.png' },
      { id: 'a2', folderId: null, fullName: 'b.png' },
    ]));
    expect(s.byId['a1'].fullName).toBe('Sprites/a.png');
    expect(s.byId['a2'].folderId).toBeNull();
  });
});

describe('batchSetAssetFullNames', () => {
  test('updates fullName only', () => {
    let s = assetsReducer(initial, addAsset({ id: 'a1', name: 'a.png', content: '', projectId: 'p1', folderId: 'f1', fullName: 'Old/a.png' }));
    s = assetsReducer(s, batchSetAssetFullNames([{ id: 'a1', fullName: 'New/a.png' }]));
    expect(s.byId['a1'].fullName).toBe('New/a.png');
    expect(s.byId['a1'].folderId).toBe('f1');
  });
});
