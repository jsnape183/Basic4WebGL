// tests/ui/features/files/filesSlice.test.ts
import filesReducer, {
  IFile,
  IFilesState,
  addFile,
  updateFile,
  removeFile,
} from '../../../../src/features/files/filesSlice';

const sampleFile: IFile = {
  id: 'f1',
  name: 'Main.bas',
  source: 'PRINT "hello"',
  projectId: 'p1',
};

const initial: IFilesState = { byId: {} };

test('initial state has no selectedFileId field', () => {
  const state = filesReducer(undefined, { type: '@@init' });
  expect(state).toEqual({ byId: {} });
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
