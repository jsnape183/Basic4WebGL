// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach } from 'vitest';
import assetsReducer, { addAsset } from '../../../../src/features/assets/assetsSlice';
import foldersReducer from '../../../../src/features/folders/foldersSlice';
import projectsReducer, { addProject } from '../../../../src/features/projects/projectsSlice';
import AssetTree from '../../../../src/components/TreePanel/AssetTree';
import { putAssetBlob, getAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

const makeStore = () =>
  configureStore({
    reducer: { assets: assetsReducer, folders: foldersReducer, projects: projectsReducer },
  });

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
});

describe('AssetTree remove', () => {
  test('deletes the blob store entry when an asset is removed', async () => {
    const store = makeStore();
    store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: [] }));
    store.dispatch(addAsset({ id: 'a1', name: 'hero.png', projectId: 'p1', folderId: null, fullName: 'hero.png' }));
    await putAssetBlob('a1', new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }));

    render(
      <Provider store={store}>
        <AssetTree projectId="p1" />
      </Provider>,
    );

    await userEvent.click(screen.getByLabelText('Remove hero.png'));

    await waitFor(() => {
      expect(store.getState().assets.byId.a1).toBeUndefined();
    });
    await waitFor(async () => {
      expect(await getAssetBlob('a1')).toBeUndefined();
    });
  });
});
