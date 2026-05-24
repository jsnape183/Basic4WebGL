// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import projectsReducer, { addProject } from '../../../../src/features/projects/projectsSlice';
import packagesReducer, {
  seedPackages,
  IPackage,
} from '../../../../src/features/packages/packagesSlice';
import { firstPartyPackages } from '../../../../src/constants/firstPartyPackages';
import AddPackageModal from '../../../../src/components/AddPackageModal';

const extraPackage: IPackage = {
  id: 'softphysics',
  name: 'softPhysics',
  version: '1.0.0',
  isCore: false,
  isFirstParty: false,
  moduleNames: [],
};

// Project has only softcore — softgfx and softphysics are available to add
const makeStore = () => {
  const store = configureStore({
    reducer: { projects: projectsReducer, packages: packagesReducer },
  });
  store.dispatch(seedPackages([...firstPartyPackages, extraPackage]));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: ['softcore'] }));
  return store;
};

const wrap = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

test('modal is not visible initially', () => {
  const store = makeStore();
  render(<AddPackageModal projectId="p1" isOpen={false} onClose={() => {}} />, { wrapper: wrap(store) });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('modal renders when isOpen is true', () => {
  const store = makeStore();
  render(<AddPackageModal projectId="p1" isOpen={true} onClose={() => {}} />, { wrapper: wrap(store) });
  expect(screen.getByRole('dialog', { name: /add package/i })).toBeInTheDocument();
});

test('lists packages not yet in the project', () => {
  const store = makeStore();
  render(<AddPackageModal projectId="p1" isOpen={true} onClose={() => {}} />, { wrapper: wrap(store) });
  expect(screen.getByText('softGfx')).toBeInTheDocument();
  expect(screen.getByText('softPhysics')).toBeInTheDocument();
  expect(screen.queryByText('softCore')).not.toBeInTheDocument();
});

test('filters packages by search input', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<AddPackageModal projectId="p1" isOpen={true} onClose={() => {}} />, { wrapper: wrap(store) });
  await user.type(screen.getByPlaceholderText(/search/i), 'Physics');
  expect(screen.getByText('softPhysics')).toBeInTheDocument();
  expect(screen.queryByText('softGfx')).not.toBeInTheDocument();
});

test('shows empty message when no packages match search', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  render(<AddPackageModal projectId="p1" isOpen={true} onClose={() => {}} />, { wrapper: wrap(store) });
  await user.type(screen.getByPlaceholderText(/search/i), 'zzznomatch');
  expect(screen.getByText(/no packages available/i)).toBeInTheDocument();
});

test('dispatches addPackageToProject and calls onClose when Add is clicked', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  const onClose = vi.fn();
  render(<AddPackageModal projectId="p1" isOpen={true} onClose={onClose} />, { wrapper: wrap(store) });
  await user.click(screen.getByRole('button', { name: /add softgfx/i }));
  expect(store.getState().projects.items[0].packageIds).toContain('softgfx');
  expect(onClose).toHaveBeenCalledOnce();
});

test('calls onClose when Escape is pressed', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  const onClose = vi.fn();
  render(<AddPackageModal projectId="p1" isOpen={true} onClose={onClose} />, { wrapper: wrap(store) });
  await user.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledOnce();
});
