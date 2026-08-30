import localforage from 'localforage';

// redux-persist storage adapter backed by IndexedDB via localforage. redux-persist
// expects a WebStorage-shaped object — getItem(key): Promise<string | null>,
// setItem(key, value): Promise<void>, removeItem(key): Promise<void> — and
// localforage satisfies that directly (its getItem already resolves to null for a
// missing key). It stores one string value (the serialized non-asset Redux
// state), which is now small because asset binaries live in a separate store.

const persistStore = localforage.createInstance({
  name: 'softBASIC',
  storeName: 'persist',
  description: 'redux-persist state',
});

export default {
  getItem: (key: string): Promise<string | null> => persistStore.getItem<string>(key),
  setItem: async (key: string, value: string): Promise<void> => {
    await persistStore.setItem(key, value);
  },
  removeItem: (key: string): Promise<void> => persistStore.removeItem(key),
};
