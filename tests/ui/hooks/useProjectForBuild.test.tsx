// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import projectsReducer, { addProject } from '../../../src/features/projects/projectsSlice';
import packagesReducer, { seedPackages } from '../../../src/features/packages/packagesSlice';
import filesReducer, { addFile } from '../../../src/features/files/filesSlice';
import { useProjectForBuild } from '../../../src/hooks/useProjectForBuild';
import { firstPartyPackages } from '../../../src/constants/firstPartyPackages';

const makeStore = () => {
  const store = configureStore({
    reducer: {
      projects: projectsReducer,
      packages: packagesReducer,
      files: filesReducer,
    },
  });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: ['softcore', 'softgfx'] }));
  store.dispatch(addFile({ id: 'f1', name: 'Main.bas', source: 'print "hi"', projectId: 'p1' }));
  return store;
};

const wrap = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

test('returns lib modules for softcore package', () => {
  const store = makeStore();
  const { result } = renderHook(() => useProjectForBuild('p1'), { wrapper: wrap(store) });
  const moduleNames = result.current.lib.map((m) => m.name);
  expect(moduleNames).toContain('math');
  expect(moduleNames).toContain('string');
  expect(moduleNames).toContain('array');
});

test('returns lib modules for softgfx package', () => {
  const store = makeStore();
  const { result } = renderHook(() => useProjectForBuild('p1'), { wrapper: wrap(store) });
  const moduleNames = result.current.lib.map((m) => m.name);
  expect(moduleNames).toContain('gfx');
  expect(moduleNames).toContain('drawing');
});

test('returns project files', () => {
  const store = makeStore();
  const { result } = renderHook(() => useProjectForBuild('p1'), { wrapper: wrap(store) });
  expect(result.current.files).toHaveLength(1);
  expect(result.current.files[0].name).toBe('Main.bas');
});

test('softcore modules appear before softgfx modules in lib', () => {
  const store = makeStore();
  const { result } = renderHook(() => useProjectForBuild('p1'), { wrapper: wrap(store) });
  const names = result.current.lib.map((m) => m.name);
  const mathIdx = names.indexOf('math');
  const gfxIdx = names.indexOf('gfx');
  expect(mathIdx).toBeLessThan(gfxIdx);
});

test('falls back to softcore + softgfx when project has no packageIds (migration)', () => {
  const store = configureStore({
    reducer: { projects: projectsReducer, packages: packagesReducer, files: filesReducer },
  });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(
    addProject({ id: 'p2', name: 'Old', packageIds: undefined as unknown as string[] })
  );
  const { result } = renderHook(() => useProjectForBuild('p2'), { wrapper: wrap(store) });
  const names = result.current.lib.map((m) => m.name);
  expect(names).toContain('math');
  expect(names).toContain('gfx');
});
