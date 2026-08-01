// @vitest-environment jsdom
import React from 'react';
import { render, act, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, afterEach } from 'vitest';
import sessionReducer, { addLog } from '../../../src/features/session/sessionSlice';
import filesReducer, { addFile } from '../../../src/features/files/filesSlice';
import projectsReducer, { addProject } from '../../../src/features/projects/projectsSlice';
import packagesReducer from '../../../src/features/packages/packagesSlice';
import assetsReducer from '../../../src/features/assets/assetsSlice';
import uiReducer, { selectFile } from '../../../src/features/ui/uiSlice';
import foldersReducer from '../../../src/features/folders/foldersSlice';
import EditPage from '../../../src/pages/EditPage';
import { LogItemType } from '../../../src/Types/LogItem';
import userEvent from '@testing-library/user-event';

vi.mock('@monaco-editor/react', () => ({
  default: () => null,
  useMonaco: () => null,
}));

vi.mock('../../../src/components/Runner/index', () => ({
  default: () => null,
}));

const makeStore = (projectId: string) => {
  const store = configureStore({
    reducer: {
      session: sessionReducer,
      files: filesReducer,
      projects: projectsReducer,
      packages: packagesReducer,
      assets: assetsReducer,
      ui: uiReducer,
      folders: foldersReducer,
    },
  });
  store.dispatch(addProject({ id: projectId, name: 'Test Project', packageIds: [] }));
  return store;
};

const renderEditPage = (projectId: string, store: ReturnType<typeof makeStore>) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/edit/${projectId}`]}>
        <Routes>
          <Route path="/edit/:id" element={<EditPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

afterEach(() => {
  vi.restoreAllMocks();
});

test('captures window messages while not running', async () => {
  const projectId = 'proj-1';
  const store = makeStore(projectId);

  renderEditPage(projectId, store);

  // isRunning is false so Preview is not mounted — but EditPage should still
  // have registered the message listener unconditionally via useRunnerMessages.
  await act(async () => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: window.location.origin,
        data: { type: 'console.log', message: 'final frame' },
      }),
    );
  });

  const state = store.getState();
  expect(state.session.logs).toHaveLength(1);
  expect(state.session.logs[0].type).toBe(LogItemType.Output);
  expect(state.session.logs[0].text).toBe('final frame');
});

test('clicking a BottomPanel error entry with a loc switches the selected file and sets the jump target', async () => {
  const user = userEvent.setup();
  const projectId = 'proj-2';
  const store = makeStore(projectId);

  store.dispatch(addFile({ id: 'file-main', name: 'Main', source: '', projectId }));
  store.dispatch(addFile({ id: 'file-other', name: 'Other', source: '', projectId }));
  store.dispatch(selectFile({ projectId, fileId: 'file-main' }));

  const loc = { line: 4, col: 1, filename: 'Other' };
  store.dispatch(
    addLog({ type: LogItemType.Error, text: 'Other:4 undefined variable', loc })
  );

  renderEditPage(projectId, store);

  await user.click(screen.getByText('Other:4 undefined variable'));

  expect(store.getState().ui.selectedFileByProject[projectId]).toBe('file-other');
});
