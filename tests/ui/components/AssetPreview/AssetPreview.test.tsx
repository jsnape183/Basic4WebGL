// @vitest-environment jsdom
// tests/ui/components/AssetPreview/AssetPreview.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import assetsReducer, { IAsset } from '../../../../src/features/assets/assetsSlice';
import AssetPreview from '../../../../src/components/AssetPreview';

const makeStore = () => configureStore({ reducer: { assets: assetsReducer } });

const imageAsset: IAsset = {
  id: 'a1', name: 'photo.png',
  projectId: 'p1', folderId: null, fullName: 'photo.png',
};

const textAsset: IAsset = {
  id: 'a2', name: 'config.json',
  projectId: 'p1', folderId: null, fullName: 'config.json',
};

const tilemapAsset: IAsset = {
  id: 'a3', name: 'level1.stm',
  projectId: 'p1', folderId: null, fullName: 'level1.stm',
};

describe('AssetPreview', () => {
  test('renders ImagePreview for image assets', () => {
    render(
      <Provider store={makeStore()}>
        <AssetPreview asset={imageAsset} onDirtyChange={vi.fn()} />
      </Provider>
    );
    expect(screen.getByRole('img', { name: 'photo.png' })).toBeInTheDocument();
  });

  test('renders TextEditor for text assets', () => {
    render(
      <Provider store={makeStore()}>
        <AssetPreview asset={textAsset} onDirtyChange={vi.fn()} />
      </Provider>
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('renders TileMapEditor for .stm assets', () => {
    render(
      <Provider store={makeStore()}>
        <AssetPreview asset={tilemapAsset} onDirtyChange={vi.fn()} />
      </Provider>
    );
    expect(screen.getByLabelText('Tilemap canvas')).toBeInTheDocument();
  });
});
