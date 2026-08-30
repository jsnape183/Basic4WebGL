// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import assetsReducer, { addAsset } from '../../../../src/features/assets/assetsSlice';
import TileMapEditor from '../../../../src/components/TileMapEditor';
import {
  putAssetBlob,
  getAssetBlob,
  _clearAllAssetBlobsForTests,
} from '../../../../src/lib/storage/assetBlobStore';

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

class MockImage {
  onload: (() => void) | null = null;
  width = 16;
  height = 16;
  set src(_v: string) { setTimeout(() => this.onload?.(), 0); }
}

const stmDoc = {
  tileWidth: 16,
  tileHeight: 16,
  tileImage: '',
  layers: { background: [[0, 0], [0, 0]] },
};

const makeStore = () => configureStore({ reducer: { assets: assetsReducer } });

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = vi.fn();
  vi.stubGlobal('Image', MockImage as unknown as typeof Image);
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ clearRect: vi.fn(), drawImage: vi.fn() })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:tile');
});

describe('TileMapEditor blob storage', () => {
  test('loads the .stm doc from the blob store and saves edits back to it', async () => {
    const store = makeStore();
    await putAssetBlob('stm1', new Blob([JSON.stringify(stmDoc)], { type: 'application/json' }));
    store.dispatch(addAsset({ id: 'stm1', name: 'level.stm', projectId: 'p1', folderId: null, fullName: 'level.stm' }));
    const asset = store.getState().assets.byId.stm1;

    render(<Provider store={store}><TileMapEditor asset={asset} /></Provider>);

    // Read path: the 2x2 grid could only have come from the blob-store doc —
    // the editor's initial shim doc has no layers/cells.
    const saveBtn = await screen.findByRole('button', { name: /^save$/i });
    expect(await screen.findByText('background')).toBeInTheDocument();
    expect(screen.getByLabelText('Row 1, Column 1')).toBeInTheDocument();

    // Save path: paint a cell to dirty the doc, then Save.
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(saveBtn);

    await waitFor(async () => {
      const blob = await getAssetBlob('stm1');
      expect(blob).toBeDefined();
      const saved = JSON.parse(await blob!.text());
      expect(saved.tileWidth).toBe(16);
      expect(saved.layers.background[0][1]).toBe(1);
    });
  });

  test('shows a loading state before the doc resolves', async () => {
    const store = makeStore();
    await putAssetBlob('stm2', new Blob([JSON.stringify(stmDoc)], { type: 'application/json' }));
    store.dispatch(addAsset({ id: 'stm2', name: 'a.stm', projectId: 'p1', folderId: null, fullName: 'a.stm' }));
    const asset = store.getState().assets.byId.stm2;

    render(<Provider store={store}><TileMapEditor asset={asset} /></Provider>);
    expect(screen.getByText('Loading tilemap…')).toBeInTheDocument();
    await screen.findByText('background');
  });
});
