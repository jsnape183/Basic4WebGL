// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach } from 'vitest';
import assetsReducer from '../../../../src/features/assets/assetsSlice';
import foldersReducer from '../../../../src/features/folders/foldersSlice';
import projectsReducer, { addProject } from '../../../../src/features/projects/projectsSlice';
import AssetTree from '../../../../src/components/TreePanel/AssetTree';
import { getAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

const makeStore = () =>
  configureStore({
    reducer: { assets: assetsReducer, folders: foldersReducer, projects: projectsReducer },
  });

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
});

describe('AssetTree upload', () => {
  test('writes uploaded file bytes to the blob store and dispatches metadata', async () => {
    const store = makeStore();
    store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: [] }));
    render(
      <Provider store={store}>
        <AssetTree projectId="p1" />
      </Provider>,
    );

    const file = new File([new Uint8Array([137, 80, 78, 71])], 'hero.png', { type: 'image/png' });
    const input = screen.getByTestId('uploader') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(Object.keys(store.getState().assets.byId)).toHaveLength(1);
    });
    const asset = Object.values(store.getState().assets.byId)[0];
    expect(asset.name).toBe('hero.png');
    expect('content' in asset).toBe(false);

    const blob = await getAssetBlob(asset.id);
    expect(blob).toBeDefined();
    expect(new Uint8Array(await blob!.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]));
    expect(blob!.type).toBe('image/png');
  });
});
