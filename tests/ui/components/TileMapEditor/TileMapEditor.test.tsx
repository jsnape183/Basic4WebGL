// tests/ui/components/TileMapEditor/TileMapEditor.test.tsx
// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import assetsReducer, { addAsset, IAsset } from '../../../../src/features/assets/assetsSlice';
import TileMapEditor from '../../../../src/components/TileMapEditor';
import {
  putAssetBlob,
  getAssetBlob,
  _clearAllAssetBlobsForTests,
} from '../../../../src/lib/storage/assetBlobStore';

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

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
  // jsdom implements neither of these; useAssetObjectUrl needs them.
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = vi.fn();
  vi.stubGlobal('Image', MockImage as unknown as typeof Image);
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ clearRect: vi.fn(), drawImage: vi.fn() })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:tile');
});

const STM_JSON = JSON.stringify({
  tileWidth: 8, tileHeight: 8, tileImage: 'tileset.png',
  layers: { background: [[1, 1], [1, 1]], foreground: [[0, 0], [0, 0]] },
});

const makeStmAsset = (): IAsset => ({
  id: 'm1', name: 'level1.stm',
  projectId: 'p1', folderId: null, fullName: 'level1.stm',
});

const makeTilesetAsset = (): IAsset => ({
  id: 't1', name: 'tileset.png',
  projectId: 'p1', folderId: null, fullName: 'tileset.png',
});

// Reads the .stm doc the editor saved back to the blob store.
async function readSavedStm(id = 'm1') {
  const blob = await getAssetBlob(id);
  if (!blob) throw new Error(`no blob saved for ${id}`);
  return JSON.parse(await blob.text());
}

async function renderEditor(asset = makeStmAsset(), onDirtyChange = vi.fn(), stmJson = STM_JSON) {
  const store = configureStore({ reducer: { assets: assetsReducer } });
  await putAssetBlob(asset.id, new Blob([stmJson], { type: 'application/json' }));
  await putAssetBlob('t1', new Blob(['x'], { type: 'image/png' }));
  store.dispatch(addAsset(makeTilesetAsset()));
  store.dispatch(addAsset(asset));
  render(
    <Provider store={store}>
      <TileMapEditor asset={asset} onDirtyChange={onDirtyChange} />
    </Provider>
  );
  // Wait for useAssetText to resolve and the doc to render.
  await screen.findByText('background');
  return { store };
}

describe('TileMapEditor', () => {
  test('renders layer list from the decoded .stm file', async () => {
    await renderEditor();
    expect(screen.getByText('background')).toBeInTheDocument();
    expect(screen.getByText('foreground')).toBeInTheDocument();
  });

  test('painting a cell on the active layer marks the tab dirty', async () => {
    const onDirtyChange = vi.fn();
    await renderEditor(makeStmAsset(), onDirtyChange);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    expect(onDirtyChange).toHaveBeenCalledWith('m1', true);
  });

  test('painting only affects the active layer, others are unchanged on save', async () => {
    await renderEditor();
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.background).toEqual([[1, 1], [1, 1]]);
  });

  test('clicking Save writes the painted tile to the correct cell', async () => {
    await renderEditor();
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.background[0][1]).toBe(1);
  });

  test('switching active layer routes subsequent paints there', async () => {
    await renderEditor();
    await userEvent.click(screen.getByText('foreground'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.foreground[0][0]).toBe(1);
    expect(decoded.layers.background[0][0]).toBe(1);
  });

  test('calls onDirtyChange(id, false) after saving', async () => {
    const onDirtyChange = vi.fn();
    await renderEditor(makeStmAsset(), onDirtyChange);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    onDirtyChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith('m1', false));
  });

  test('hovering a cell shows its row/column and world x/y in the toolbar', async () => {
    await renderEditor(); // tileWidth 8, tileHeight 8
    fireEvent.mouseEnter(screen.getByLabelText('Row 0, Column 1'));
    // col 1 * tileWidth 8 = x 8; row 0 * tileHeight 8 = y 0
    expect(screen.getByText('Row 0, Col 1 · x 8, y 0')).toBeInTheDocument();
  });

  test('moving the mouse off the grid clears the readout', async () => {
    await renderEditor();
    fireEvent.mouseEnter(screen.getByLabelText('Row 0, Column 1'));
    expect(screen.getByText('Row 0, Col 1 · x 8, y 0')).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByRole('grid'));
    expect(screen.queryByText(/Row 0, Col 1/)).not.toBeInTheDocument();
  });

  test('clicking Export downloads the current draft as a plain-JSON .stm file named after the asset', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await renderEditor();
    await userEvent.click(screen.getByRole('button', { name: /export/i }));

    // useAssetObjectUrl also mints a URL for the tileset image; find the
    // Export download's own blob among the calls.
    const blobArg = createObjectURL.mock.calls
      .map((c) => c[0] as Blob)
      .find((b) => b.type === 'application/octet-stream') as Blob;
    expect(blobArg).toBeDefined();
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

  test('a non-active, visible layer renders dimmed and non-interactive alongside the active layer', async () => {
    await renderEditor();
    // Active layer ("background", index 0 by default) is interactive: its cells are labeled.
    expect(screen.getByLabelText('Row 0, Column 0')).toBeInTheDocument();
    // The non-active "foreground" layer is present (visible) but not labeled/interactive —
    // its wrapper is queryable by the layer-scoped aria-label instead.
    const foregroundWrapper = screen.getByLabelText('Layer foreground');
    expect(foregroundWrapper).toHaveStyle({ opacity: '0.35', pointerEvents: 'none' });
    const activeWrapper = screen.getByLabelText('Layer background');
    expect(activeWrapper).toHaveStyle({ opacity: '1', pointerEvents: 'auto' });
  });

  test('a hidden layer is not rendered at all', async () => {
    await renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Hide layer foreground' }));
    expect(screen.queryByLabelText('Layer foreground')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Layer background')).toBeInTheDocument();
  });

  test('selecting a hidden layer makes it active and un-hides it', async () => {
    await renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Hide layer foreground' }));
    expect(screen.queryByLabelText('Layer foreground')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('foreground'));

    const foregroundWrapper = screen.getByLabelText('Layer foreground');
    expect(foregroundWrapper).toHaveStyle({ opacity: '1', pointerEvents: 'auto' });
    expect(screen.getByRole('button', { name: 'Hide layer foreground' })).toBeInTheDocument();
  });

  test('painting still only affects the active layer with multiple layers composited on screen', async () => {
    await renderEditor();
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.background[0][1]).toBe(1);
    expect(decoded.layers.foreground).toEqual([[0, 0], [0, 0]]);
  });

  test('clicking the hide toggle on the currently active layer is a no-op', async () => {
    await renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Hide layer background' }));
    expect(screen.getByLabelText('Layer background')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide layer background' })).toBeInTheDocument();
  });

  test('removing every layer falls back to a blank grid instead of an empty pane', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Remove layer background'));
    await userEvent.click(screen.getByLabelText('Remove layer foreground'));
    expect(screen.queryByLabelText('Layer background')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Layer foreground')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Tilemap canvas')).toBeInTheDocument();
  });
});
describe('TileMapEditor — marker layers', () => {
  test('a marker layer composites on top of dimmed tile layers when active', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));

    // The new marker layer is active: its cells are interactive/labeled.
    expect(screen.getByLabelText('Marker canvas')).toBeInTheDocument();
    // Both original tile layers are still present, dimmed underneath it.
    const backgroundWrapper = screen.getByLabelText('Layer background');
    const foregroundWrapper = screen.getByLabelText('Layer foreground');
    expect(backgroundWrapper).toHaveStyle({ opacity: '0.35', pointerEvents: 'none' });
    expect(foregroundWrapper).toHaveStyle({ opacity: '0.35', pointerEvents: 'none' });
    // Only the marker layer's own tile-canvas label is absent from the dimmed
    // tile layers -- they never claim "Tilemap canvas" while non-interactive.
    expect(screen.queryAllByLabelText('Tilemap canvas')).toHaveLength(0);
  });

  test('adding a marker layer and painting a tag saves it in the new format', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.markers3).toEqual({ type: 'markers', markers: [{ row: 0, col: 1, tag: 'spawn' }] });
  });

  test('adding a marker layer does not disturb existing tile layer data on save', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.background).toEqual([[1, 1], [1, 1]]);
    expect(decoded.layers.foreground).toEqual([[0, 0], [0, 0]]);
  });

  test('switching to a marker layer shows the tag picker instead of the tile palette', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    expect(screen.getByLabelText('New tag name')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tile 1')).not.toBeInTheDocument();
  });

  test('switching back to a tile layer shows the tile palette again', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.click(screen.getByText('background'));
    expect(screen.getByLabelText('Eraser')).toBeInTheDocument();
    expect(screen.queryByLabelText('New tag name')).not.toBeInTheDocument();
  });

  test('placing an eraser click on an already-marked cell removes the marker', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByLabelText('Eraser'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.markers3).toEqual({ type: 'markers', markers: [] });
  });

  test('placing a second marker on an already-marked cell replaces the tag', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'pickup{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.markers3).toEqual({ type: 'markers', markers: [{ row: 0, col: 1, tag: 'pickup' }] });
  });

  test('a saved marker layer survives closing and reopening the asset, and stays editable', async () => {
    const { store } = await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    const saved = store.getState().assets.byId['m1'];
    expect((await readSavedStm()).layers.markers3).toEqual({
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
    expect(await screen.findByText('markers3')).toBeInTheDocument();

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

    const decoded = await readSavedStm();
    expect(decoded.layers.markers3).toEqual({
      type: 'markers',
      markers: [
        { row: 0, col: 1, tag: 'spawn' },
        { row: 1, col: 0, tag: 'pickup' },
      ],
    });
  });
});
describe('TileMapEditor — collision layers', () => {
  test('adding a collision layer and painting solid cells saves it in the new format', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add collision layer'));
    await userEvent.click(screen.getByText('collision3'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.collision3).toEqual({ type: 'collision', data: [[0, 1], [0, 0]] });
  });

  test('a collision layer composites on top of dimmed tile layers when active', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add collision layer'));
    await userEvent.click(screen.getByText('collision3'));

    expect(screen.getByLabelText('Collision canvas')).toBeInTheDocument();
    const backgroundWrapper = screen.getByLabelText('Layer background');
    expect(backgroundWrapper).toHaveStyle({ opacity: '0.35', pointerEvents: 'none' });
  });

  test('adding a collision layer does not disturb existing tile layer data on save', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add collision layer'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.background).toEqual([[1, 1], [1, 1]]);
    expect(decoded.layers.foreground).toEqual([[0, 0], [0, 0]]);
  });

  test('switching to a collision layer shows the solid/not-solid picker instead of the tile palette', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add collision layer'));
    await userEvent.click(screen.getByText('collision3'));
    expect(screen.getByLabelText('Not Solid')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tile 1')).not.toBeInTheDocument();
  });

  test('switching back to a tile layer shows the tile palette again', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add collision layer'));
    await userEvent.click(screen.getByText('collision3'));
    await userEvent.click(screen.getByText('background'));
    expect(screen.getByLabelText('Eraser')).toBeInTheDocument();
    expect(screen.queryByLabelText('Not Solid')).not.toBeInTheDocument();
  });

  test('painting defaults to Solid, matching prior behavior', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add collision layer'));
    await userEvent.click(screen.getByText('collision3'));
    expect(screen.getByLabelText('Solid')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.collision3).toEqual({ type: 'collision', data: [[0, 1], [0, 0]] });
  });

  test('selecting Not Solid clears an already-solid cell', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add collision layer'));
    await userEvent.click(screen.getByText('collision3'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1')); // solid by default

    await userEvent.click(screen.getByLabelText('Not Solid'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1')); // now clears it

    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.collision3).toEqual({ type: 'collision', data: [[0, 0], [0, 0]] });
  });
});
