// @vitest-environment jsdom
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach } from 'vitest';
import assetsReducer, { addAsset } from '../../../../src/features/assets/assetsSlice';
import { useCrossMapTags } from '../../../../src/components/TileMapEditor/useCrossMapTags';
import { putAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
});

function makeStore() {
  return configureStore({ reducer: { assets: assetsReducer } });
}

function wrapperFor(store: ReturnType<typeof makeStore>) {
  return ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
}

describe('useCrossMapTags', () => {
  test('collects tags from other tilemap assets in the same project', async () => {
    const store = makeStore();
    store.dispatch(addAsset({ id: 'this', name: 'level1.stm', projectId: 'p1', folderId: null, fullName: 'level1.stm' }));
    store.dispatch(addAsset({ id: 'other', name: 'level2.stm', projectId: 'p1', folderId: null, fullName: 'level2.stm' }));
    await putAssetBlob('other', new Blob([JSON.stringify({ tags: ['ally'], layers: {} })]));

    const { result } = renderHook(() => useCrossMapTags('p1', 'this'), { wrapper: wrapperFor(store) });
    await waitFor(() => expect(result.current).toEqual([{ tag: 'ally', sources: ['level2.stm'] }]));
  });

  test('excludes the current asset', async () => {
    const store = makeStore();
    store.dispatch(addAsset({ id: 'this', name: 'level1.stm', projectId: 'p1', folderId: null, fullName: 'level1.stm' }));
    await putAssetBlob('this', new Blob([JSON.stringify({ tags: ['self'], layers: {} })]));

    const { result } = renderHook(() => useCrossMapTags('p1', 'this'), { wrapper: wrapperFor(store) });
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toEqual([]);
  });

  test('excludes non-tilemap assets and other projects', async () => {
    const store = makeStore();
    store.dispatch(addAsset({ id: 'this', name: 'level1.stm', projectId: 'p1', folderId: null, fullName: 'level1.stm' }));
    store.dispatch(addAsset({ id: 'img', name: 'sprite.png', projectId: 'p1', folderId: null, fullName: 'sprite.png' }));
    store.dispatch(addAsset({ id: 'other-proj', name: 'level9.stm', projectId: 'p2', folderId: null, fullName: 'level9.stm' }));
    await putAssetBlob('img', new Blob(['not json']));
    await putAssetBlob('other-proj', new Blob([JSON.stringify({ tags: ['far-away'], layers: {} })]));

    const { result } = renderHook(() => useCrossMapTags('p1', 'this'), { wrapper: wrapperFor(store) });
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toEqual([]);
  });

  test('aggregates one tag used by two other maps into one entry with two sources', async () => {
    const store = makeStore();
    store.dispatch(addAsset({ id: 'this', name: 'level1.stm', projectId: 'p1', folderId: null, fullName: 'level1.stm' }));
    store.dispatch(addAsset({ id: 'a', name: 'level2.stm', projectId: 'p1', folderId: null, fullName: 'level2.stm' }));
    store.dispatch(addAsset({ id: 'b', name: 'level3.stm', projectId: 'p1', folderId: null, fullName: 'level3.stm' }));
    await putAssetBlob('a', new Blob([JSON.stringify({ tags: ['boss'], layers: {} })]));
    await putAssetBlob('b', new Blob([JSON.stringify({ tags: ['boss'], layers: {} })]));

    const { result } = renderHook(() => useCrossMapTags('p1', 'this'), { wrapper: wrapperFor(store) });
    await waitFor(() =>
      expect(result.current).toEqual([{ tag: 'boss', sources: ['level2.stm', 'level3.stm'] }])
    );
  });

  test('a corrupt/missing blob for one asset does not hide the others tags', async () => {
    const store = makeStore();
    store.dispatch(addAsset({ id: 'this', name: 'level1.stm', projectId: 'p1', folderId: null, fullName: 'level1.stm' }));
    store.dispatch(addAsset({ id: 'good', name: 'level2.stm', projectId: 'p1', folderId: null, fullName: 'level2.stm' }));
    store.dispatch(addAsset({ id: 'missing', name: 'level3.stm', projectId: 'p1', folderId: null, fullName: 'level3.stm' }));
    await putAssetBlob('good', new Blob([JSON.stringify({ tags: ['ally'], layers: {} })]));
    // 'missing' deliberately has no blob at all.

    const { result } = renderHook(() => useCrossMapTags('p1', 'this'), { wrapper: wrapperFor(store) });
    await waitFor(() => expect(result.current).toEqual([{ tag: 'ally', sources: ['level2.stm'] }]));
  });
});
