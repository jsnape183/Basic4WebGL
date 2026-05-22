// @vitest-environment jsdom
import React from 'react';
import { render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, afterEach } from 'vitest';
import sessionReducer from '../../../src/features/session/sessionSlice';
import filesReducer from '../../../src/features/files/filesSlice';
import projectsReducer, { addProject } from '../../../src/features/projects/projectsSlice';
import assetsReducer from '../../../src/features/assets/assetsSlice';
import uiReducer from '../../../src/features/ui/uiSlice';
import EditPage from '../../../src/pages/EditPage';
import { LogItemType } from '../../../src/Types/LogItem';

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
      assets: assetsReducer,
      ui: uiReducer,
    },
  });
  store.dispatch(addProject({ id: projectId, name: 'Test Project', fileIds: [] }));
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
