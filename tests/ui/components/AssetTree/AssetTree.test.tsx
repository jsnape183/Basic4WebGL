// @vitest-environment jsdom
import { describe, test, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import foldersReducer, { addFolder } from '../../../../src/features/folders/foldersSlice';
import assetsReducer, { addAsset } from '../../../../src/features/assets/assetsSlice';
import filesReducer from '../../../../src/features/files/filesSlice';
import uiReducer from '../../../../src/features/ui/uiSlice';
import projectsReducer, { addProject } from '../../../../src/features/projects/projectsSlice';
import packagesReducer from '../../../../src/features/packages/packagesSlice';
import AssetTree from '../../../../src/components/TreePanel/AssetTree';

function makeStore() {
  return configureStore({
    reducer: {
      folders: foldersReducer,
      assets: assetsReducer,
      files: filesReducer,
      ui: uiReducer,
      projects: projectsReducer,
      packages: packagesReducer,
    },
  });
}

describe('AssetTree section filtering', () => {
  test('does not render folders with section: files', () => {
    const store = makeStore();
    store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: [] }));
    store.dispatch(addFolder({ id: 'ff1', name: 'Scripts', projectId: 'p1', parentId: null, section: 'files' }));

    const { queryByText } = render(
      <Provider store={store}>
        <AssetTree projectId="p1" />
      </Provider>
    );

    expect(queryByText('Scripts')).toBeNull();
  });

  test('renders folders with section: assets', () => {
    const store = makeStore();
    store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: [] }));
    store.dispatch(addFolder({ id: 'af1', name: 'Sprites', projectId: 'p1', parentId: null, section: 'assets' }));

    const { getByText } = render(
      <Provider store={store}>
        <AssetTree projectId="p1" />
      </Provider>
    );

    expect(getByText('Sprites')).toBeInTheDocument();
  });
});

test('double-clicking an asset item calls onOpenAsset with its id', async () => {
  const user = userEvent.setup();
  const store = makeStore();
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: [] }));
  store.dispatch(addAsset({ id: 'a1', name: 'data.json', content: '', projectId: 'p1', folderId: null, fullName: 'data.json' }));
  const onOpenAsset = vi.fn();

  const { getByText } = render(
    <Provider store={store}>
      <AssetTree projectId="p1" onOpenAsset={onOpenAsset} />
    </Provider>
  );

  await user.dblClick(getByText('data.json'));
  expect(onOpenAsset).toHaveBeenCalledWith('a1');
});
