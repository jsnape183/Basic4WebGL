// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer, { addProject } from '../../../../src/features/projects/projectsSlice';
import filesReducer from '../../../../src/features/files/filesSlice';
import assetsReducer, { addAsset } from '../../../../src/features/assets/assetsSlice';
import foldersReducer from '../../../../src/features/folders/foldersSlice';
import uiReducer from '../../../../src/features/ui/uiSlice';
import { deleteProjectWithMainFile } from '../../../../src/features/projects/deleteProjectAndFiles';
import { putAssetBlob, getAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

const makeStore = () => configureStore({
  reducer: { projects: projectsReducer, files: filesReducer, assets: assetsReducer, folders: foldersReducer, ui: uiReducer },
});

beforeEach(async () => { await _clearAllAssetBlobsForTests(); });

describe('deleteProjectWithMainFile', () => {
  test("deletes the blob store entries for the project's assets", async () => {
    const store = makeStore();
    store.dispatch(addProject({ id: 'p1', name: 'Doomed', packageIds: [] }));
    store.dispatch(addAsset({ id: 'a1', name: 'x.png', projectId: 'p1', folderId: null, fullName: 'x.png' }));
    await putAssetBlob('a1', new Blob(['x']));

    await store.dispatch(deleteProjectWithMainFile('p1'));

    expect(await getAssetBlob('a1')).toBeUndefined();
    expect(store.getState().assets.byId.a1).toBeUndefined();
  });
});
