// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import persistStorage from '../../../src/lib/storage/persistStore';
import projectsReducer, { addProject } from '../../../src/features/projects/projectsSlice';
import assetsReducer from '../../../src/features/assets/assetsSlice';

const rootReducer = combineReducers({ projects: projectsReducer, assets: assetsReducer });

function makePersistedStore() {
  const store = configureStore({
    reducer: persistReducer({ key: 'softBASIC-test', storage: persistStorage }, rootReducer),
    middleware: (gdm) => gdm({ serializableCheck: false }),
  });
  const persistor = persistStore(store);
  return { store, persistor };
}

// Resolve once redux-persist has finished its initial rehydration for this
// persistor. Unlike the synchronous localStorage engine, the IndexedDB-backed
// adapter is genuinely async, so writes only start flushing after the initial
// read completes — the app already gates on this via <PersistGate>.
function whenBootstrapped(persistor: ReturnType<typeof persistStore>) {
  return new Promise<void>((resolve) => {
    if (persistor.getState().bootstrapped) return resolve();
    const unsub = persistor.subscribe(() => {
      if (persistor.getState().bootstrapped) {
        unsub();
        resolve();
      }
    });
  });
}

beforeEach(async () => {
  await persistStorage.removeItem('persist:softBASIC-test');
});

describe('redux-persist over IndexedDB', () => {
  test('state written to one store is rehydrated into a fresh store', async () => {
    const { store, persistor } = makePersistedStore();
    await whenBootstrapped(persistor);
    store.dispatch(addProject({ id: 'p1', name: 'Persisted Game', packageIds: [] }));
    await persistor.flush();

    const { store: store2, persistor: persistor2 } = makePersistedStore();
    await whenBootstrapped(persistor2);
    expect(store2.getState().projects.items).toEqual([
      expect.objectContaining({ id: 'p1', name: 'Persisted Game' }),
    ]);
  });
});
