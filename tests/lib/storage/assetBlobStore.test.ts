// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest';
import {
  putAssetBlob,
  getAssetBlob,
  deleteAssetBlob,
  deleteAssetBlobs,
  _clearAllAssetBlobsForTests,
} from '../../../src/lib/storage/assetBlobStore';

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
});

describe('assetBlobStore', () => {
  test('put then get round-trips a blob byte-for-byte and preserves MIME', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3, 250, 251, 252])], { type: 'image/png' });
    await putAssetBlob('asset-1', blob);
    const out = await getAssetBlob('asset-1');
    expect(out).toBeDefined();
    expect(out!.type).toBe('image/png');
    expect(new Uint8Array(await out!.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 250, 251, 252]));
  });
  test('getAssetBlob returns undefined for an unknown id', async () => {
    expect(await getAssetBlob('nope')).toBeUndefined();
  });
  test('deleteAssetBlob removes a single entry', async () => {
    await putAssetBlob('a', new Blob(['x']));
    await deleteAssetBlob('a');
    expect(await getAssetBlob('a')).toBeUndefined();
  });
  test('deleteAssetBlobs removes a batch and leaves others intact', async () => {
    await putAssetBlob('a', new Blob(['a']));
    await putAssetBlob('b', new Blob(['b']));
    await putAssetBlob('c', new Blob(['c']));
    await deleteAssetBlobs(['a', 'c']);
    expect(await getAssetBlob('a')).toBeUndefined();
    expect(await getAssetBlob('c')).toBeUndefined();
    expect(await getAssetBlob('b')).toBeDefined();
  });
  test('put overwrites an existing entry', async () => {
    await putAssetBlob('a', new Blob(['first'], { type: 'text/plain' }));
    await putAssetBlob('a', new Blob(['second'], { type: 'text/plain' }));
    expect(await (await getAssetBlob('a'))!.text()).toBe('second');
  });
});
