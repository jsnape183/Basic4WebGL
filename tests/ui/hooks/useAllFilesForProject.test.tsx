// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import filesReducer, { addFile } from '../../../src/features/files/filesSlice';
import uiReducer from '../../../src/features/ui/uiSlice';
import projectsReducer, { addProject } from '../../../src/features/projects/projectsSlice';
import packagesReducer, { seedPackages } from '../../../src/features/packages/packagesSlice';
import foldersReducer from '../../../src/features/folders/foldersSlice';
import { firstPartyPackages } from '../../../src/constants/firstPartyPackages';
import { useAllFilesForProject } from '../../../src/hooks/useAllFilesForProject';

const makeStore = () => {
  const store = configureStore({
    reducer: {
      files: filesReducer,
      ui: uiReducer,
      projects: projectsReducer,
      packages: packagesReducer,
      folders: foldersReducer,
    },
  });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: [] }));
  // Add files in reverse alphabetical order
  store.dispatch(addFile({ id: 'f3', name: 'Zebra.bas', source: '', projectId: 'p1' }));
  store.dispatch(addFile({ id: 'f2', name: 'Main.bas', source: '', projectId: 'p1' }));
  store.dispatch(addFile({ id: 'f1', name: 'Ammo.bas', source: '', projectId: 'p1' }));
  return store;
};

const wrap = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

test('returns files sorted alphabetically regardless of insertion order', () => {
  const store = makeStore();
  const { result } = renderHook(() => useAllFilesForProject('p1'), { wrapper: wrap(store) });
  expect(result.current.map((f) => f.name)).toEqual(['Ammo.bas', 'Main.bas', 'Zebra.bas']);
});
