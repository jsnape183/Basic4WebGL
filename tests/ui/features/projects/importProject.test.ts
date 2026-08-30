import { describe, test, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from '../../../../src/features/projects/projectsSlice';
import foldersReducer from '../../../../src/features/folders/foldersSlice';
import filesReducer from '../../../../src/features/files/filesSlice';
import assetsReducer from '../../../../src/features/assets/assetsSlice';
import { importProject } from '../../../../src/features/projects/importProject';
import { ProjectExportJson } from '../../../../src/features/projects/exportProject';
import { getAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

beforeEach(async () => { await _clearAllAssetBlobsForTests(); });

function makeStore() {
  return configureStore({
    reducer: {
      projects: projectsReducer,
      folders: foldersReducer,
      files: filesReducer,
      assets: assetsReducer,
    },
  });
}

const sampleJson: ProjectExportJson = {
  version: 1,
  project: { name: 'My Game' },
  folders: [
    { id: 'f1', name: 'Classes', parentId: null, section: 'files' },
  ],
  files: [
    { id: 'file1', name: 'Main', source: 'print 1', folderId: null, fullName: 'Main.bas' },
    { id: 'file2', name: 'Player', source: 'class', folderId: 'f1', fullName: 'Classes/Player.bas' },
  ],
  assets: [
    { id: 'a1', name: 'hero.png', content: 'data:image/png;base64,aGk=', folderId: null, fullName: 'hero.png' },
  ],
  fileOrder: { ':root': ['file1'], ':f1': ['file2'] },
  assetOrder: { ':root': ['a1'] },
};

describe('importProject', () => {
  test('creates a project with the correct name', async () => {
    const store = makeStore();
    await store.dispatch(importProject(sampleJson));
    expect(store.getState().projects.items[0].name).toBe('My Game');
  });

  test('assigns a new projectId (not the original)', async () => {
    const store = makeStore();
    await store.dispatch(importProject(sampleJson));
    const projectId = store.getState().projects.items[0].id;
    expect(projectId).toBeTruthy();
    // The JSON has no projectId — any new unique id is correct
  });

  test('imports all files with new IDs', async () => {
    const store = makeStore();
    await store.dispatch(importProject(sampleJson));
    const fileIds = Object.keys(store.getState().files.byId);
    expect(fileIds).toHaveLength(2);
    expect(fileIds).not.toContain('file1');
    expect(fileIds).not.toContain('file2');
  });

  test('file source is preserved', async () => {
    const store = makeStore();
    await store.dispatch(importProject(sampleJson));
    const files = Object.values(store.getState().files.byId);
    const main = files.find((f) => f.name === 'Main');
    expect(main?.source).toBe('print 1');
  });

  test('file order is preserved for root bucket', async () => {
    const store = makeStore();
    await store.dispatch(importProject(sampleJson));
    const projectId = store.getState().projects.items[0].id;
    const order = store.getState().files.fileOrder[`${projectId}:root`];
    expect(order).toHaveLength(1);
    const mainFile = Object.values(store.getState().files.byId).find((f) => f.name === 'Main');
    expect(order[0]).toBe(mainFile?.id);
  });

  test('file in folder is assigned the new folderId', async () => {
    const store = makeStore();
    await store.dispatch(importProject(sampleJson));
    const folder = store.getState().folders.items.find((f) => f.name === 'Classes');
    const playerFile = Object.values(store.getState().files.byId).find((f) => f.name === 'Player');
    expect(playerFile?.folderId).toBe(folder?.id);
  });

  test('imports all assets with new IDs', async () => {
    const store = makeStore();
    await store.dispatch(importProject(sampleJson));
    const assetIds = Object.keys(store.getState().assets.byId);
    expect(assetIds).toHaveLength(1);
    expect(assetIds).not.toContain('a1');
  });

  test('asset bytes are written to the blob store, not the slice', async () => {
    const store = makeStore();
    await store.dispatch(importProject(sampleJson));
    const asset = Object.values(store.getState().assets.byId)[0];
    expect('content' in asset).toBe(false);
    const blob = await getAssetBlob(asset.id);
    expect(blob).toBeDefined();
    expect(await blob!.text()).toBe('hi');
  });

  test('project packageIds default to softcore + softgfx', async () => {
    const store = makeStore();
    await store.dispatch(importProject(sampleJson));
    expect(store.getState().projects.items[0].packageIds).toEqual(['softcore', 'softgfx']);
  });

  test('two imports of the same JSON create two independent projects', async () => {
    const store = makeStore();
    await store.dispatch(importProject(sampleJson));
    await store.dispatch(importProject(sampleJson));
    expect(store.getState().projects.items).toHaveLength(2);
    const [id1, id2] = store.getState().projects.items.map((p) => p.id);
    expect(id1).not.toBe(id2);
  });
});
