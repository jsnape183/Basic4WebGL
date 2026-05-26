// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import filesReducer, { addFile } from '../../../../src/features/files/filesSlice';
import uiReducer from '../../../../src/features/ui/uiSlice';
import projectsReducer, { addProject } from '../../../../src/features/projects/projectsSlice';
import packagesReducer, { seedPackages } from '../../../../src/features/packages/packagesSlice';
import foldersReducer, { addFolder } from '../../../../src/features/folders/foldersSlice';
import { firstPartyPackages } from '../../../../src/constants/firstPartyPackages';
import FileTree from '../../../../src/components/FileTree';

const makeStore = () => {
  const store = configureStore({ reducer: { files: filesReducer, ui: uiReducer, projects: projectsReducer, packages: packagesReducer, folders: foldersReducer } });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: ['softcore', 'softgfx'] }));
  store.dispatch(addFile({ id: 'f1', name: 'main.bas', source: '', projectId: 'p1' }));
  store.dispatch(addFile({ id: 'f2', name: 'utils.bas', source: '', projectId: 'p1' }));
  return store;
};

const wrap = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

test('renders file list with role="listbox"', () => {
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  expect(screen.getByRole('listbox', { name: /files/i })).toBeInTheDocument();
});

test('ArrowDown moves focus to next file', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  const items = screen.getAllByRole('option');
  items[0].focus();
  await user.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(items[1]);
});

test('ArrowUp moves focus to previous file', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  const items = screen.getAllByRole('option');
  items[1].focus();
  await user.keyboard('{ArrowUp}');
  expect(document.activeElement).toBe(items[0]);
});

test('Enter selects focused file', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  const items = screen.getAllByRole('option');
  items[1].focus();
  await user.keyboard('{Enter}');
  expect(store.getState().ui.selectedFileByProject['p1']).toBe('f2');
});

test('does not render folders with section: assets', async () => {
  const store = configureStore({
    reducer: {
      files: filesReducer,
      ui: uiReducer,
      projects: projectsReducer,
      packages: packagesReducer,
      folders: foldersReducer,
    },
  });

  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: [] }));
  store.dispatch(addFolder({ id: 'af1', name: 'Sprites', projectId: 'p1', parentId: null, section: 'assets' }));
  store.dispatch(addFile({ id: 'file1', name: 'Main.bas', source: '', projectId: 'p1' }));

  const { queryByText } = render(
    <Provider store={store}>
      <FileTree projectId="p1" />
    </Provider>
  );

  expect(queryByText('Sprites')).toBeNull();
});
