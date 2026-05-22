// tests/ui/features/ui/uiSlice.test.ts
import { configureStore } from '@reduxjs/toolkit';
import uiReducer, { selectFile, clearProjectSelection, UIState } from '../../../../src/features/ui/uiSlice';
import projectsReducer, { addProject } from '../../../../src/features/projects/projectsSlice';
import filesReducer, { addFile } from '../../../../src/features/files/filesSlice';
import assetsReducer from '../../../../src/features/assets/assetsSlice';
import sessionReducer from '../../../../src/features/session/sessionSlice';
import { deleteProjectWithMainFile } from '../../../../src/features/projects/deleteProjectAndFiles';

const initial: UIState = { selectedFileByProject: {} };

function makeStore() {
  return configureStore({
    reducer: {
      projects: projectsReducer,
      files: filesReducer,
      assets: assetsReducer,
      ui: uiReducer,
      session: sessionReducer,
    },
  });
}

test('initial state has empty selectedFileByProject', () => {
  expect(uiReducer(undefined, { type: '@@init' })).toEqual(initial);
});

test('selectFile stores fileId under projectId', () => {
  const state = uiReducer(initial, selectFile({ projectId: 'p1', fileId: 'f1' }));
  expect(state.selectedFileByProject['p1']).toBe('f1');
});

test('clearProjectSelection removes the projectId key', () => {
  const withSelection = uiReducer(initial, selectFile({ projectId: 'p1', fileId: 'f1' }));
  const cleared = uiReducer(withSelection, clearProjectSelection('p1'));
  expect('p1' in cleared.selectedFileByProject).toBe(false);
});

test('clearProjectSelection leaves unrelated project entries intact', () => {
  let state = uiReducer(initial, selectFile({ projectId: 'p1', fileId: 'f1' }));
  state = uiReducer(state, selectFile({ projectId: 'p2', fileId: 'f2' }));
  state = uiReducer(state, clearProjectSelection('p1'));
  expect('p1' in state.selectedFileByProject).toBe(false);
  expect(state.selectedFileByProject['p2']).toBe('f2');
});

test('deleteProjectWithMainFile clears selectedFileByProject entry for the deleted project', () => {
  const store = makeStore();

  store.dispatch(addProject({ id: 'p1', name: 'Project 1' }));
  store.dispatch(addFile({ id: 'f1', name: 'Main.bas', source: '', projectId: 'p1' }));
  store.dispatch(selectFile({ projectId: 'p1', fileId: 'f1' }));

  expect(store.getState().ui.selectedFileByProject['p1']).toBe('f1');

  (store.dispatch as any)(deleteProjectWithMainFile('p1'));

  expect('p1' in store.getState().ui.selectedFileByProject).toBe(false);
});

test('deleteProjectWithMainFile does not affect selections for other projects', () => {
  const store = makeStore();

  store.dispatch(addProject({ id: 'p1', name: 'Project 1' }));
  store.dispatch(addFile({ id: 'f1', name: 'Main.bas', source: '', projectId: 'p1' }));
  store.dispatch(addProject({ id: 'p2', name: 'Project 2' }));
  store.dispatch(addFile({ id: 'f2', name: 'Main.bas', source: '', projectId: 'p2' }));
  store.dispatch(selectFile({ projectId: 'p1', fileId: 'f1' }));
  store.dispatch(selectFile({ projectId: 'p2', fileId: 'f2' }));

  (store.dispatch as any)(deleteProjectWithMainFile('p1'));

  expect('p1' in store.getState().ui.selectedFileByProject).toBe(false);
  expect(store.getState().ui.selectedFileByProject['p2']).toBe('f2');
});
