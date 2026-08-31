// @vitest-environment jsdom
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { useAssetText } from '../../../src/hooks/useAssetText';
import { putAssetBlob, _clearAllAssetBlobsForTests } from '../../../src/lib/storage/assetBlobStore';

beforeEach(async () => { await _clearAllAssetBlobsForTests(); });

describe('useAssetText', () => {
  test('resolves the blob text for an id', async () => {
    await putAssetBlob('a1', new Blob(['level data'], { type: 'text/plain' }));
    const { result } = renderHook(() => useAssetText('a1'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.text).toBe('level data');
  });

  test('text is undefined for a missing blob', async () => {
    const { result } = renderHook(() => useAssetText('missing'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.text).toBeUndefined();
  });

  test('undefined id resolves immediately with no text', async () => {
    const { result } = renderHook(() => useAssetText(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.text).toBeUndefined();
  });

  test('re-resolves when the id changes', async () => {
    await putAssetBlob('a1', new Blob(['one']));
    await putAssetBlob('a2', new Blob(['two']));
    const { result, rerender } = renderHook(({ id }) => useAssetText(id), {
      initialProps: { id: 'a1' as string | undefined },
    });
    await waitFor(() => expect(result.current.text).toBe('one'));
    rerender({ id: 'a2' });
    await waitFor(() => expect(result.current.text).toBe('two'));
  });
});
