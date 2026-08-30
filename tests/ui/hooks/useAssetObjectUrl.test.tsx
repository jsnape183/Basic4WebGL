// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAssetObjectUrl } from '../../../src/hooks/useAssetObjectUrl';
import { putAssetBlob, _clearAllAssetBlobsForTests } from '../../../src/lib/storage/assetBlobStore';

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
  // jsdom does not implement the object-URL API; give spyOn something to wrap.
  (URL as unknown as { createObjectURL?: unknown }).createObjectURL ??= () => '';
  (URL as unknown as { revokeObjectURL?: unknown }).revokeObjectURL ??= () => {};
  let n = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:mock/${++n}`);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('useAssetObjectUrl', () => {
  test('returns undefined then a blob URL once loaded', async () => {
    await putAssetBlob('a1', new Blob(['x'], { type: 'image/png' }));
    const { result } = renderHook(() => useAssetObjectUrl('a1'));
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBe('blob:mock/1'));
  });

  test('revokes the URL on unmount', async () => {
    await putAssetBlob('a1', new Blob(['x']));
    const { result, unmount } = renderHook(() => useAssetObjectUrl('a1'));
    await waitFor(() => expect(result.current).toBe('blob:mock/1'));
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock/1');
  });

  test('revokes the old URL and mints a new one when the id changes', async () => {
    await putAssetBlob('a1', new Blob(['one']));
    await putAssetBlob('a2', new Blob(['two']));
    const { result, rerender } = renderHook(({ id }) => useAssetObjectUrl(id), {
      initialProps: { id: 'a1' as string | undefined },
    });
    await waitFor(() => expect(result.current).toBe('blob:mock/1'));
    rerender({ id: 'a2' });
    await waitFor(() => expect(result.current).toBe('blob:mock/2'));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock/1');
  });

  test('returns undefined for a missing blob or undefined id', async () => {
    const { result } = renderHook(() => useAssetObjectUrl(undefined));
    await waitFor(() => expect(result.current).toBeUndefined());
  });
});
