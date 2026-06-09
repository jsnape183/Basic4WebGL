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
  content: 'data:image/png;base64,abc',
  projectId: 'p1', folderId: null, fullName: 'photo.png',
};

// "{}" in base64 = e30=
const textAsset: IAsset = {
  id: 'a2', name: 'config.json',
  content: 'data:text/plain;base64,e30=',
  projectId: 'p1', folderId: null, fullName: 'config.json',
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
});
