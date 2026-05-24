// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import projectsReducer, { addProject } from '../../../../src/features/projects/projectsSlice';
import packagesReducer, { seedPackages } from '../../../../src/features/packages/packagesSlice';
import { firstPartyPackages } from '../../../../src/constants/firstPartyPackages';
import PackagesSection from '../../../../src/components/FileTree/PackagesSection';

const makeStore = () => {
  const store = configureStore({
    reducer: { projects: projectsReducer, packages: packagesReducer },
  });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: ['softcore', 'softgfx'] }));
  return store;
};

const wrap = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

test('renders a collapsed section by default showing package count badge', () => {
  const store = makeStore();
  render(<PackagesSection projectId="p1" />, { wrapper: wrap(store) });
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.queryByText('softCore')).not.toBeInTheDocument();
});

test('expands to show package names when header button is clicked', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<PackagesSection projectId="p1" />, { wrapper: wrap(store) });
  await user.click(screen.getByRole('button', { name: /packages/i }));
  expect(screen.getByText('softCore')).toBeInTheDocument();
  expect(screen.getByText('softGfx')).toBeInTheDocument();
});

test('shows "core" label for isCore package and no remove button', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<PackagesSection projectId="p1" />, { wrapper: wrap(store) });
  await user.click(screen.getByRole('button', { name: /packages/i }));
  expect(screen.getByText('core')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /remove softcore/i })).not.toBeInTheDocument();
});

test('shows remove button for non-core package', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<PackagesSection projectId="p1" />, { wrapper: wrap(store) });
  await user.click(screen.getByRole('button', { name: /packages/i }));
  expect(screen.getByRole('button', { name: /remove softgfx/i })).toBeInTheDocument();
});

test('dispatches removePackageFromProject when remove button is clicked', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<PackagesSection projectId="p1" />, { wrapper: wrap(store) });
  await user.click(screen.getByRole('button', { name: /packages/i }));
  await user.click(screen.getByRole('button', { name: /remove softgfx/i }));
  const project = store.getState().projects.items.find((p) => p.id === 'p1');
  expect(project?.packageIds).not.toContain('softgfx');
});

test('calls onAddClick when the + header button is clicked', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  const onAddClick = vi.fn();
  render(<PackagesSection projectId="p1" onAddClick={onAddClick} />, { wrapper: wrap(store) });
  await user.click(screen.getByRole('button', { name: /add package/i }));
  expect(onAddClick).toHaveBeenCalledOnce();
});
