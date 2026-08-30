// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { describe, test, expect, beforeEach } from 'vitest';
import assetsReducer, { addAsset } from '../../../src/features/assets/assetsSlice';
import { useRunnerAssets } from '../../../src/hooks/useRunnerAssets';
import { putAssetBlob, _clearAllAssetBlobsForTests } from '../../../src/lib/storage/assetBlobStore';

const makeStore = () => configureStore({ reducer: { assets: assetsReducer } });

beforeEach(async () => { await _clearAllAssetBlobsForTests(); });

describe('useRunnerAssets', () => {
  test('resolves every project asset to a { name, src } data URL', async () => {
    const store = makeStore();
    store.dispatch(addAsset({ id: 'a1', name: 'hero.png', projectId: 'p1', folderId: null, fullName: 'hero.png' }));
    await putAssetBlob('a1', new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }));

    const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useRunnerAssets('p1', true), { wrapper });

    expect(result.current.assets).toBeNull();
    await waitFor(() => expect(result.current.assets).not.toBeNull());
    expect(result.current.assets).toEqual([
      { name: 'hero.png', src: expect.stringMatching(/^data:image\/png;base64,/) },
    ]);
  });

  test('returns null assets when disabled', () => {
    const store = makeStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useRunnerAssets('p1', false), { wrapper });
    expect(result.current.assets).toBeNull();
  });
});
