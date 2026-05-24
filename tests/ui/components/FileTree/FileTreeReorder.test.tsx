// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import filesReducer, { addFile } from '../../../../src/features/files/filesSlice';
import uiReducer from '../../../../src/features/ui/uiSlice';
import projectsReducer, { addProject } from '../../../../src/features/projects/projectsSlice';
import packagesReducer, { seedPackages } from '../../../../src/features/packages/packagesSlice';
import { firstPartyPackages } from '../../../../src/constants/firstPartyPackages';
import FileTree from '../../../../src/components/FileTree';

// dnd-kit uses ResizeObserver internally — polyfill for jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const makeStore = () => {
  const store = configureStore({ reducer: { files: filesReducer, ui: uiReducer, projects: projectsReducer, packages: packagesReducer } });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: ['softcore', 'softgfx'] }));
  store.dispatch(addFile({ id: 'f1', name: 'Main.bas', source: '', projectId: 'p1' }));
  store.dispatch(addFile({ id: 'f2', name: 'Car.bas', source: '', projectId: 'p1' }));
  return store;
};

const wrap = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

test('drag handle button is rendered for each file', () => {
  const store = makeStore();
  render(<FileTree projectId="p1" />, { wrapper: wrap(store) });
  const handles = screen.getAllByRole('button', { name: 'Drag to reorder' });
  expect(handles).toHaveLength(2);
});
