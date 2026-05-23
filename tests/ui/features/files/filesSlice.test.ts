// tests/ui/features/files/filesSlice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import filesReducer, {
  IFile,
  IFilesState,
  addFile,
  updateFile,
  removeFile,
  clearAllDirty,
  reorderFiles,
} from '../../../../src/features/files/filesSlice';

const sampleFile: IFile = {
  id: 'f1',
  name: 'Main.bas',
  source: 'PRINT "hello"',
  projectId: 'p1',
};

const initial: IFilesState = { byId: {}, dirtyFileIds: [], fileOrder: {} };

test('initial state shape is correct', () => {
  const state = filesReducer(undefined, { type: '@@init' });
  expect(state).toEqual({ byId: {}, dirtyFileIds: [], fileOrder: {} });
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

// --- fileOrder ---

describe('fileOrder', () => {
  const clean: IFilesState = { byId: {}, dirtyFileIds: [], fileOrder: {} };

  test('addFile appends the new file id to fileOrder for the project', () => {
    const s1 = filesReducer(clean, addFile({ id: 'f1', name: 'a.bas', source: '', projectId: 'p1' }));
    const s2 = filesReducer(s1, addFile({ id: 'f2', name: 'b.bas', source: '', projectId: 'p1' }));
    expect(s2.fileOrder['p1']).toEqual(['f1', 'f2']);
  });

  test('addFile creates the order array when the project has no files yet', () => {
    const s = filesReducer(clean, addFile({ id: 'f1', name: 'a.bas', source: '', projectId: 'p99' }));
    expect(s.fileOrder['p99']).toEqual(['f1']);
  });

  test('removeFile removes the id from fileOrder', () => {
    let s = filesReducer(clean, addFile({ id: 'f1', name: 'a.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, addFile({ id: 'f2', name: 'b.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, removeFile('f1'));
    expect(s.fileOrder['p1']).toEqual(['f2']);
  });

  test('reorderFiles moves a file id from one index to another', () => {
    let s = filesReducer(clean, addFile({ id: 'f1', name: 'a.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, addFile({ id: 'f2', name: 'b.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, addFile({ id: 'f3', name: 'c.bas', source: '', projectId: 'p1' }));
    s = filesReducer(s, reorderFiles({ projectId: 'p1', fromIndex: 0, toIndex: 2 }));
    expect(s.fileOrder['p1']).toEqual(['f2', 'f3', 'f1']);
  });

  test('reorderFiles does nothing when the project has no order entry', () => {
    const s = filesReducer(clean, reorderFiles({ projectId: 'no-such', fromIndex: 0, toIndex: 1 }));
    expect(s.fileOrder['no-such']).toBeUndefined();
  });
});
