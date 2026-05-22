// tests/ui/features/files/filesSlice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import filesReducer, {
  IFile,
  IFilesState,
  addFile,
  updateFile,
  removeFile,
  clearAllDirty,
} from '../../../../src/features/files/filesSlice';

const sampleFile: IFile = {
  id: 'f1',
  name: 'Main.bas',
  source: 'PRINT "hello"',
  projectId: 'p1',
};

const initial: IFilesState = { byId: {}, dirtyFileIds: [] };

test('initial state has no selectedFileId field', () => {
  const state = filesReducer(undefined, { type: '@@init' });
  expect(state).toEqual({ byId: {}, dirtyFileIds: [] });
  expect('selectedFileId' in state).toBe(false);
});

test('addFile stores file by id', () => {
  const state = filesReducer(initial, addFile(sampleFile));
  expect(state.byId['f1']).toEqual(sampleFile);
});

test('updateFile replaces file source', () => {
  const withFile = filesReducer(initial, addFile(sampleFile));
  const updated = filesReducer(withFile, updateFile({ ...sampleFile, source: 'PRINT "world"' }));
  expect(updated.byId['f1'].source).toBe('PRINT "world"');
});

test('removeFile deletes by id', () => {
  const withFile = filesReducer(initial, addFile(sampleFile));
  const removed = filesReducer(withFile, removeFile('f1'));
  expect(removed.byId['f1']).toBeUndefined();
});

describe('dirtyFileIds', () => {
  it('updateFile marks the file as dirty', () => {
    const store = configureStore({ reducer: { files: filesReducer } });
    store.dispatch(addFile({ id: 'f1', name: 'main.bas', source: '', projectId: 'p1' }));
    store.dispatch(updateFile({ id: 'f1', name: 'main.bas', source: 'PRINT "hi"', projectId: 'p1' }));
    expect(store.getState().files.dirtyFileIds).toContain('f1');
  });

  it('clearAllDirty removes all dirty ids', () => {
    const store = configureStore({ reducer: { files: filesReducer } });
    store.dispatch(addFile({ id: 'f1', name: 'main.bas', source: '', projectId: 'p1' }));
    store.dispatch(updateFile({ id: 'f1', name: 'main.bas', source: 'x', projectId: 'p1' }));
    store.dispatch(clearAllDirty());
    expect(store.getState().files.dirtyFileIds).toHaveLength(0);
  });

  // Note: dirtyFileIds is cleared on rehydration via a redux-persist transform
  // in store.ts (clearDirtyOnRehydrate), not by a reducer handler.
  // That behaviour is an integration concern, not a slice-level concern.
});
