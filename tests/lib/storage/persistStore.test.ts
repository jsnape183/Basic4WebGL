// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest';
import localforage from 'localforage';
import persistStorage from '../../../src/lib/storage/persistStore';

beforeEach(async () => {
  await localforage.createInstance({ name: 'softBASIC', storeName: 'persist' }).clear();
});

describe('persistStorage (redux-persist adapter over localforage)', () => {
  test('setItem then getItem returns the stored string', async () => {
    await persistStorage.setItem('softBASIC', '{"a":1}');
    expect(await persistStorage.getItem('softBASIC')).toBe('{"a":1}');
  });
  test('getItem returns null for a missing key', async () => {
    expect(await persistStorage.getItem('does-not-exist')).toBeNull();
  });
  test('removeItem deletes the key', async () => {
    await persistStorage.setItem('k', 'v');
    await persistStorage.removeItem('k');
    expect(await persistStorage.getItem('k')).toBeNull();
  });
});
