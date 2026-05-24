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
import { firstPartyPackages } from '../../../../src/constants/firstPartyPackages';
import FileTree from '../../../../src/components/FileTree';

const makeStore = () => {
  const store = configureStore({ reducer: { files: filesReducer, ui: uiReducer, projects: projectsReducer, packages: packagesReducer } });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: ['softcore', 'softgfx'] }));
  store.dispatch(addFile({ id: 'f1', name: 'main.bas', source: '', projectId: 'p1' }));
  return store;
};

const wrap = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

// Open the "New file" modal
async function openNewFileModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: '+' }));
}

test('rejects a filename starting with a number', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  await openNewFileModal(user);
  await user.type(screen.getByRole('textbox'), '1Bad');
  expect(screen.getByText(/must start with a letter/i)).toBeInTheDocument();
});

test('does not add file when name is invalid', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  await openNewFileModal(user);
  await user.type(screen.getByRole('textbox'), '1Bad');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  // Only the original file should be present
  expect(screen.getAllByRole('option')).toHaveLength(1);
});

test('appends .bas when user types name without extension', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  await openNewFileModal(user);
  await user.type(screen.getByRole('textbox'), 'Player');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByText('Player.bas')).toBeInTheDocument();
});

test('does not double-append .bas when user already typed it', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  await openNewFileModal(user);
  await user.type(screen.getByRole('textbox'), 'Enemy.bas');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByText('Enemy.bas')).toBeInTheDocument();
  expect(screen.queryByText('Enemy.bas.bas')).not.toBeInTheDocument();
});

test('rejects a filename with an underscore', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  await openNewFileModal(user);
  await user.type(screen.getByRole('textbox'), 'my_file');
  expect(screen.getByText(/letters and numbers/i)).toBeInTheDocument();
});
