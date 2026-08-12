// tests/ui/components/TileMapEditor/TileMapEditor.test.tsx
// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

  test('clicking Export downloads the current draft as a plain-JSON .stm file named after the asset', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: /export/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = createObjectURL.mock.calls[0][0] as Blob;
    // application/octet-stream, not application/json -- a MIME type the
    // browser's Save dialog associates with .json would otherwise override
    // or hide the .stm extension in the "download" attribute's filename.
    expect(blobArg.type).toBe('application/octet-stream');
    const text = await blobArg.text();
    expect(text.startsWith('data:')).toBe(false);
    expect(JSON.parse(text)).toMatchObject({ tileWidth: 8, tileHeight: 8, tileImage: 'tileset.png' });
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});

describe('TileMapEditor — marker layers', () => {
  test('adding a marker layer and painting a tag saves it in the new format', async () => {
    const { store } = renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.markers3).toEqual({ type: 'markers', markers: [{ row: 0, col: 1, tag: 'spawn' }] });
  });

  test('adding a marker layer does not disturb existing tile layer data on save', async () => {
    const { store } = renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.background).toEqual([[1, 1], [1, 1]]);
    expect(decoded.layers.foreground).toEqual([[0, 0], [0, 0]]);
  });

  test('switching to a marker layer shows the tag picker instead of the tile palette', async () => {
    renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    expect(screen.getByLabelText('New tag name')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tile 1')).not.toBeInTheDocument();
  });

  test('switching back to a tile layer shows the tile palette again', async () => {
    renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.click(screen.getByText('background'));
    expect(screen.getByLabelText('Eraser')).toBeInTheDocument();
    expect(screen.queryByLabelText('New tag name')).not.toBeInTheDocument();
  });

  test('placing an eraser click on an already-marked cell removes the marker', async () => {
    const { store } = renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByLabelText('Eraser'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.markers3).toEqual({ type: 'markers', markers: [] });
  });

  test('placing a second marker on an already-marked cell replaces the tag', async () => {
    const { store } = renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'pickup{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.markers3).toEqual({ type: 'markers', markers: [{ row: 0, col: 1, tag: 'pickup' }] });
  });

  test('a saved marker layer survives closing and reopening the asset, and stays editable', async () => {
    const { store } = renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    const saved = store.getState().assets.byId['m1'];
    expect(decodeContent(saved.content).layers.markers3).toEqual({
      type: 'markers',
      markers: [{ row: 0, col: 1, tag: 'spawn' }],
    });

    // Simulate closing and reopening the asset: unmount the current editor
    // entirely and mount a fresh TileMapEditor instance whose `asset` prop is
    // the just-saved asset object read back from the store. This forces a
    // real decode -> render cycle from the saved content (the component's
    // lazy useState initializer re-runs decodeStmContent on the new asset),
    // rather than continuing to edit the same in-memory draft state.
    cleanup();
    render(
      <Provider store={store}>
        <TileMapEditor asset={saved} onDirtyChange={vi.fn()} />
      </Provider>
    );

    // The marker layer survived the round trip and shows up in the Layers panel.
    expect(screen.getByText('markers3')).toBeInTheDocument();

    // Selecting it re-derives the tag picker from the decoded markers, and
    // the previously-saved marker is still painted at the correct cell.
    await userEvent.click(screen.getByText('markers3'));
    expect(screen.getByLabelText('Tag spawn')).toBeInTheDocument();
    expect(screen.getByLabelText('Row 0, Column 1')).toHaveAttribute('title', 'spawn');

    // It's genuinely editable, not a frozen snapshot: painting an additional
    // marker and saving again works and preserves the reloaded one.
    await userEvent.type(screen.getByLabelText('New tag name'), 'pickup{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 1, Column 0'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.markers3).toEqual({
      type: 'markers',
      markers: [
        { row: 0, col: 1, tag: 'spawn' },
        { row: 1, col: 0, tag: 'pickup' },
      ],
    });
  });
});
