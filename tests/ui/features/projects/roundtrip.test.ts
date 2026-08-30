// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from '../../../../src/features/projects/projectsSlice';
import foldersReducer from '../../../../src/features/folders/foldersSlice';
import filesReducer from '../../../../src/features/files/filesSlice';
import assetsReducer from '../../../../src/features/assets/assetsSlice';
import { importProject } from '../../../../src/features/projects/importProject';
import { buildExportJson, ProjectExportJson } from '../../../../src/features/projects/exportProject';
import { _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

const makeStore = () => configureStore({
  reducer: { projects: projectsReducer, folders: foldersReducer, files: filesReducer, assets: assetsReducer },
});

const fixture: ProjectExportJson = {
  version: 1,
  project: { name: 'Round Trip' },
  folders: [],
  files: [{ id: 'file1', name: 'Main', source: 'print 1', folderId: null, fullName: 'Main.bas' }],
  assets: [
    { id: 'a1', name: 'hero.png', content: 'data:image/png;base64,aGVsbG8=', folderId: null, fullName: 'hero.png' },
    { id: 'a2', name: 'level.json', content: 'data:application/json;base64,eyJ4IjoxfQ==', folderId: null, fullName: 'level.json' },
  ],
  fileOrder: { ':root': ['file1'] },
  assetOrder: { ':root': ['a1', 'a2'] },
};

beforeEach(async () => { await _clearAllAssetBlobsForTests(); });

describe('import -> export round trip', () => {
  test('exported JSON matches the fixture modulo id remapping', async () => {
    const store = makeStore();
    const newId = await store.dispatch(importProject(fixture));

    const assets = Object.values(store.getState().assets.byId);
    expect(assets).toHaveLength(2);
    expect(assets.every((a) => !('content' in a))).toBe(true);

    const state = store.getState();
    const exported = await buildExportJson(newId, {
      projects: state.projects,
      folders: state.folders,
      files: state.files,
      assets: state.assets,
    });

    const strip = (j: ProjectExportJson) =>
      j.assets.map((a) => ({ name: a.name, content: a.content, fullName: a.fullName })).sort((x, y) => x.name.localeCompare(y.name));
    expect(strip(exported)).toEqual(strip(fixture));
    expect(exported.files[0].source).toBe('print 1');
  });
});
