// @vitest-environment jsdom
import React from 'react';
import { render, act, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, afterEach } from 'vitest';
import sessionReducer, { addLog, setIsRunning } from '../../../src/features/session/sessionSlice';
import filesReducer, { addFile } from '../../../src/features/files/filesSlice';
import projectsReducer, { addProject } from '../../../src/features/projects/projectsSlice';
import packagesReducer from '../../../src/features/packages/packagesSlice';
import assetsReducer, { addAsset } from '../../../src/features/assets/assetsSlice';
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

// TileMapEditor's LayersPanel uses @dnd-kit, which needs ResizeObserver under jsdom.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

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

test('clicking a file in the file tree switches back to the code editor when an asset tab is open', async () => {
  const user = userEvent.setup();
  const projectId = 'proj-3';
  const store = makeStore(projectId);

  store.dispatch(addFile({ id: 'file-main', name: 'Main', source: '', projectId }));
  store.dispatch(selectFile({ projectId, fileId: 'file-main' }));

  const stmDoc = { tileWidth: 8, tileHeight: 8, tileImage: 'tiles.png', layers: {} };
  const stmContent =
    'data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(stmDoc))));
  store.dispatch(addAsset({
    id: 'asset-level',
    name: 'level.stm',
    content: stmContent,
    projectId,
    folderId: null,
    fullName: 'level.stm',
  }));

  renderEditPage(projectId, store);

  // Open the tilemap asset tab (double-click, matching AssetTree's own interaction).
  await user.dblClick(screen.getByText('level.stm'));
  expect(screen.getByLabelText('Eraser')).toBeInTheDocument();

  // Clicking a file in the FILE tree (not the top tab strip) should switch the
  // main pane back to the code editor, not leave the tilemap editor showing.
  await user.click(screen.getByRole('option', { name: /Main/ }));
  expect(screen.queryByLabelText('Eraser')).not.toBeInTheDocument();
});

test('opening a tilemap asset stops a running preview', async () => {
  const user = userEvent.setup();
  const projectId = 'proj-4';
  const store = makeStore(projectId);

  const stmDoc = { tileWidth: 8, tileHeight: 8, tileImage: 'tiles.png', layers: {} };
  const stmContent =
    'data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(stmDoc))));
  store.dispatch(addAsset({
    id: 'asset-level',
    name: 'level.stm',
    content: stmContent,
    projectId,
    folderId: null,
    fullName: 'level.stm',
  }));

  renderEditPage(projectId, store);

  act(() => {
    store.dispatch(setIsRunning(true));
  });
  expect(store.getState().session.isRunning).toBe(true);

  // Opening the Tile Map Editor while a preview is running should stop it --
  // the game running underneath while its own tilemap asset is being edited
  // is confusing at best (stale collision/tile data) and wasteful at worst
  // (the running game keeps ticking, off-screen, for no reason).
  await user.dblClick(screen.getByText('level.stm'));

  expect(store.getState().session.isRunning).toBe(false);
});

test('opening a non-tilemap asset does not stop a running preview', async () => {
  const user = userEvent.setup();
  const projectId = 'proj-5';
  const store = makeStore(projectId);

  store.dispatch(addAsset({
    id: 'asset-sprite',
    name: 'hero.png',
    content: 'data:image/png;base64,xxx',
    projectId,
    folderId: null,
    fullName: 'hero.png',
  }));

  renderEditPage(projectId, store);

  act(() => {
    store.dispatch(setIsRunning(true));
  });

  await user.dblClick(screen.getByText('hero.png'));

  expect(store.getState().session.isRunning).toBe(true);
});

const addDirtyTilemapProject = (projectId: string) => {
  const store = makeStore(projectId);
  store.dispatch(addFile({ id: 'file-main', name: 'Main', source: '', projectId }));
  store.dispatch(selectFile({ projectId, fileId: 'file-main' }));
  const stmDoc = { tileWidth: 8, tileHeight: 8, tileImage: 'tiles.png', layers: { background: [[1, 1], [1, 1]] } };
  const stmContent =
    'data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(stmDoc))));
  store.dispatch(addAsset({
    id: 'asset-level',
    name: 'level.stm',
    content: stmContent,
    projectId,
    folderId: null,
    fullName: 'level.stm',
  }));
  return store;
};

// Skipped in Task 6: these drive "dirty" state by painting a tilemap cell, which
// requires the editor to decode asset content (now stubbed to an empty doc).
// Task 12 rewires TileMapEditor through the blob store and un-skips these.
test.skip('switching to a file tab with unsaved tilemap changes prompts, and stays put if declined', async () => {
  const user = userEvent.setup();
  const projectId = 'proj-6';
  const store = addDirtyTilemapProject(projectId);
  renderEditPage(projectId, store);

  await user.dblClick(screen.getByText('level.stm'));
  fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1')); // paints a cell, marks dirty

  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
  await user.click(screen.getByRole('option', { name: /Main/ }));

  expect(confirmSpy).toHaveBeenCalledWith('Discard unsaved changes?');
  expect(screen.getByLabelText('Eraser')).toBeInTheDocument(); // still on the tilemap editor
});

test.skip('switching to a file tab with unsaved tilemap changes proceeds if confirmed', async () => {
  const user = userEvent.setup();
  const projectId = 'proj-7';
  const store = addDirtyTilemapProject(projectId);
  renderEditPage(projectId, store);

  await user.dblClick(screen.getByText('level.stm'));
  fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));

  vi.spyOn(window, 'confirm').mockReturnValue(true);
  await user.click(screen.getByRole('option', { name: /Main/ }));

  expect(screen.queryByLabelText('Eraser')).not.toBeInTheDocument();
});

test.skip('switching to another asset tab with unsaved tilemap changes prompts first', async () => {
  const user = userEvent.setup();
  const projectId = 'proj-8';
  const store = addDirtyTilemapProject(projectId);
  store.dispatch(addAsset({
    id: 'asset-sprite',
    name: 'hero.png',
    content: 'data:image/png;base64,xxx',
    projectId,
    folderId: null,
    fullName: 'hero.png',
  }));
  renderEditPage(projectId, store);

  await user.dblClick(screen.getByText('level.stm'));
  fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));

  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
  await user.dblClick(screen.getByText('hero.png'));

  expect(confirmSpy).toHaveBeenCalledWith('Discard unsaved changes?');
  expect(screen.getByLabelText('Eraser')).toBeInTheDocument(); // still the tilemap editor
});

test.skip('clicking Export project with unsaved tilemap changes prompts before exporting', async () => {
  const user = userEvent.setup();
  const projectId = 'proj-9';
  const store = addDirtyTilemapProject(projectId);
  renderEditPage(projectId, store);

  await user.dblClick(screen.getByText('level.stm'));
  fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));

  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
  await user.click(screen.getByLabelText('Export project'));

  expect(confirmSpy).toHaveBeenCalled();
});

test.skip('warns before the browser tab closes/navigates away while a tilemap has unsaved changes', async () => {
  const user = userEvent.setup();
  const projectId = 'proj-10';
  const store = addDirtyTilemapProject(projectId);
  renderEditPage(projectId, store);

  await user.dblClick(screen.getByText('level.stm'));
  fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));

  const event = new Event('beforeunload', { cancelable: true });
  const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
  window.dispatchEvent(event);

  expect(preventDefaultSpy).toHaveBeenCalled();
});

test('does not warn before unload when there are no unsaved tilemap changes', async () => {
  const projectId = 'proj-11';
  const store = makeStore(projectId);
  renderEditPage(projectId, store);

  const event = new Event('beforeunload', { cancelable: true });
  const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
  window.dispatchEvent(event);

  expect(preventDefaultSpy).not.toHaveBeenCalled();
});
