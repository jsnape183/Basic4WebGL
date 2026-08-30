// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import assetsReducer, { addAsset } from '../../../src/features/assets/assetsSlice';
import { useRunnerAssets } from '../../../src/hooks/useRunnerAssets';
import { putAssetBlob, _clearAllAssetBlobsForTests } from '../../../src/lib/storage/assetBlobStore';
import * as dataUrl from '../../../src/lib/storage/dataUrl';

const makeStore = () => configureStore({ reducer: { assets: assetsReducer } });

beforeEach(async () => { await _clearAllAssetBlobsForTests(); });
afterEach(() => { vi.restoreAllMocks(); });

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

  test('skips an asset that fails to encode instead of hanging forever', async () => {
    const store = makeStore();
    store.dispatch(addAsset({ id: 'good', name: 'good.png', projectId: 'p1', folderId: null, fullName: 'good.png' }));
    store.dispatch(addAsset({ id: 'bad', name: 'bad.png', projectId: 'p1', folderId: null, fullName: 'bad.png' }));
    await putAssetBlob('good', new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }));
    await putAssetBlob('bad', new Blob([new Uint8Array([4, 5, 6])], { type: 'image/png' }));

    vi.spyOn(dataUrl, 'blobToDataUrl').mockImplementation(async (blob: Blob) => {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (bytes[0] === 4) throw new Error('corrupt blob');
      return 'data:image/png;base64,AQID';
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useRunnerAssets('p1', true), { wrapper });

    await waitFor(() => expect(result.current.assets).not.toBeNull());
    expect(result.current.assets).toEqual([{ name: 'good.png', src: 'data:image/png;base64,AQID' }]);
  });

  test('resolves the assets whose blobs exist when another asset has no blob', async () => {
    const store = makeStore();
    store.dispatch(addAsset({ id: 'has', name: 'has.png', projectId: 'p1', folderId: null, fullName: 'has.png' }));
    store.dispatch(addAsset({ id: 'missing', name: 'missing.png', projectId: 'p1', folderId: null, fullName: 'missing.png' }));
    await putAssetBlob('has', new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }));

    const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useRunnerAssets('p1', true), { wrapper });

    await waitFor(() => expect(result.current.assets).not.toBeNull());
    expect(result.current.assets).toEqual([
      { name: 'has.png', src: expect.stringMatching(/^data:image\/png;base64,/) },
    ]);
  });

  test('returns null assets when disabled', () => {
    const store = makeStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useRunnerAssets('p1', false), { wrapper });
    expect(result.current.assets).toBeNull();
  });
});
