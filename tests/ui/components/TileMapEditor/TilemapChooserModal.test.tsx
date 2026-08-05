// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import assetsReducer, { addAsset } from '../../../../src/features/assets/assetsSlice';
import TilemapChooserModal from '../../../../src/components/TileMapEditor/TilemapChooserModal';

function renderModal(onOpenAsset = vi.fn(), onClose = vi.fn()) {
  const store = configureStore({ reducer: { assets: assetsReducer } });
  store.dispatch(addAsset({
    id: 'm1', name: 'level1.stm', content: 'data:application/json;base64,e30=',
    projectId: 'p1', folderId: null, fullName: 'level1.stm',
  }));
  render(
    <Provider store={store}>
      <TilemapChooserModal projectId="p1" isOpen onClose={onClose} onOpenAsset={onOpenAsset} />
    </Provider>
  );
}

describe('TilemapChooserModal', () => {
  test('renders nothing when isOpen is false', () => {
    const store = configureStore({ reducer: { assets: assetsReducer } });
    render(
      <Provider store={store}>
        <TilemapChooserModal projectId="p1" isOpen={false} onClose={vi.fn()} onOpenAsset={vi.fn()} />
      </Provider>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('"Open existing" lists .stm assets; clicking one calls onOpenAsset and closes', async () => {
    const onOpenAsset = vi.fn();
    const onClose = vi.fn();
    renderModal(onOpenAsset, onClose);
    await userEvent.click(screen.getByRole('button', { name: /open existing/i }));
    await userEvent.click(screen.getByRole('button', { name: 'level1.stm' }));
    expect(onOpenAsset).toHaveBeenCalledWith('m1');
    expect(onClose).toHaveBeenCalled();
  });

  test('"New Tilemap" shows the creation form', async () => {
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'New Tilemap' }));
    expect(screen.getByDisplayValue('untitled.stm')).toBeInTheDocument();
  });

  test('"Open existing" is disabled when there are no .stm assets yet', () => {
    const store = configureStore({ reducer: { assets: assetsReducer } });
    render(
      <Provider store={store}>
        <TilemapChooserModal projectId="p1" isOpen onClose={vi.fn()} onOpenAsset={vi.fn()} />
      </Provider>
    );
    expect(screen.getByRole('button', { name: /open existing/i })).toBeDisabled();
  });
});
