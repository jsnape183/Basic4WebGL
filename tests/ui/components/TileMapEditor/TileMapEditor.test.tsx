// tests/ui/components/TileMapEditor/TileMapEditor.test.tsx
// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import assetsReducer, { addAsset, IAsset } from '../../../../src/features/assets/assetsSlice';
import TileMapEditor from '../../../../src/components/TileMapEditor';

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

class MockImage {
  onload: (() => void) | null = null;
  width = 16;
  height = 16;
  set src(_v: string) { setTimeout(() => this.onload?.(), 0); }
}

beforeEach(() => {
  vi.stubGlobal('Image', MockImage as unknown as typeof Image);
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ clearRect: vi.fn(), drawImage: vi.fn() })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:tile');
});

const makeStmAsset = (): IAsset => {
  const doc = {
    tileWidth: 8, tileHeight: 8, tileImage: 'tileset.png',
    layers: { background: [[1, 1], [1, 1]], foreground: [[0, 0], [0, 0]] },
  };
  const json = JSON.stringify(doc);
  return {
    id: 'm1', name: 'level1.stm',
    content: 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(json))),
    projectId: 'p1', folderId: null, fullName: 'level1.stm',
  };
};

const makeTilesetAsset = (): IAsset => ({
  id: 't1', name: 'tileset.png', content: 'data:image/png;base64,xxx',
  projectId: 'p1', folderId: null, fullName: 'tileset.png',
});

const decodeContent = (content: string) =>
  JSON.parse(decodeURIComponent(escape(atob(content.split(',')[1]))));

function renderEditor(asset = makeStmAsset(), onDirtyChange = vi.fn()) {
  const store = configureStore({ reducer: { assets: assetsReducer } });
  store.dispatch(addAsset(makeTilesetAsset()));
  store.dispatch(addAsset(asset));
  render(
    <Provider store={store}>
      <TileMapEditor asset={asset} onDirtyChange={onDirtyChange} />
    </Provider>
  );
  return { store };
}

describe('TileMapEditor', () => {
  test('renders layer list from the decoded .stm file', () => {
    renderEditor();
    expect(screen.getByText('background')).toBeInTheDocument();
    expect(screen.getByText('foreground')).toBeInTheDocument();
  });

  test('painting a cell on the active layer marks the tab dirty', () => {
    const onDirtyChange = vi.fn();
    renderEditor(makeStmAsset(), onDirtyChange);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    expect(onDirtyChange).toHaveBeenCalledWith('m1', true);
  });

  test('painting only affects the active layer, others are unchanged on save', async () => {
    const { store } = renderEditor();
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.background).toEqual([[1, 1], [1, 1]]);
  });

  test('clicking Save writes the painted tile to the correct cell', async () => {
    const { store } = renderEditor();
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.background[0][1]).toBe(1);
  });

  test('switching active layer routes subsequent paints there', async () => {
    const { store } = renderEditor();
    await userEvent.click(screen.getByText('foreground'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.foreground[0][0]).toBe(1);
    expect(decoded.layers.background[0][0]).toBe(1);
  });

  test('calls onDirtyChange(id, false) after saving', async () => {
    const onDirtyChange = vi.fn();
    renderEditor(makeStmAsset(), onDirtyChange);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    onDirtyChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onDirtyChange).toHaveBeenLastCalledWith('m1', false);
  });
});
