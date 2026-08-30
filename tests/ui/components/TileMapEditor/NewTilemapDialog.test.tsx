// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import assetsReducer, { addAsset } from '../../../../src/features/assets/assetsSlice';
import NewTilemapDialog from '../../../../src/components/TileMapEditor/NewTilemapDialog';
import { getAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
});

function makeStoreWithTileset() {
  const store = configureStore({ reducer: { assets: assetsReducer } });
  store.dispatch(addAsset({
    id: 'img1', name: 'tileset.png',
    projectId: 'p1', folderId: null, fullName: 'tileset.png',
  }));
  return store;
}

describe('NewTilemapDialog', () => {
  test('lists existing image assets in the tileset picker', () => {
    const store = makeStoreWithTileset();
    render(
      <Provider store={store}>
        <NewTilemapDialog projectId="p1" onCreated={vi.fn()} onCancel={vi.fn()} />
      </Provider>
    );
    expect(screen.getByRole('option', { name: 'tileset.png' })).toBeInTheDocument();
  });

  test('rejects a filename that already exists in the project', async () => {
    const store = makeStoreWithTileset();
    store.dispatch(addAsset({
      id: 'm1', name: 'level1.stm', projectId: 'p1', folderId: null, fullName: 'level1.stm',
    }));
    const onCreated = vi.fn();
    render(
      <Provider store={store}>
        <NewTilemapDialog projectId="p1" onCreated={onCreated} onCancel={vi.fn()} />
      </Provider>
    );
    const filenameInput = screen.getByDisplayValue('untitled.stm');
    await userEvent.clear(filenameInput);
    await userEvent.type(filenameInput, 'level1.stm');
    await userEvent.selectOptions(screen.getByLabelText('Tileset image'), 'tileset.png');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByText(/already exists/)).toBeInTheDocument();
  });

  test('submitting valid fields creates a .stm asset with the expected shape and calls onCreated', async () => {
    const store = makeStoreWithTileset();
    const onCreated = vi.fn();
    render(
      <Provider store={store}>
        <NewTilemapDialog projectId="p1" onCreated={onCreated} onCancel={vi.fn()} />
      </Provider>
    );
    await userEvent.selectOptions(screen.getByLabelText('Tileset image'), 'tileset.png');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreated).toHaveBeenCalledTimes(1);
    const createdId = onCreated.mock.calls[0][0];
    const asset = store.getState().assets.byId[createdId];
    expect(asset.name).toBe('untitled.stm');
    expect('content' in asset).toBe(false);

    const blob = await getAssetBlob(createdId);
    expect(blob).toBeDefined();
    expect(blob!.type).toBe('application/json');
    const doc = JSON.parse(await blob!.text());
    expect(doc).toEqual({
      tileWidth: 16,
      tileHeight: 16,
      tileImage: 'tileset.png',
      layers: {
        background: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 0)),
      },
    });
  });

  test('shows an error when no tileset image is chosen', async () => {
    const store = configureStore({ reducer: { assets: assetsReducer } });
    const onCreated = vi.fn();
    render(
      <Provider store={store}>
        <NewTilemapDialog projectId="p1" onCreated={onCreated} onCancel={vi.fn()} />
      </Provider>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByText(/tileset image/i)).toBeInTheDocument();
  });
});
