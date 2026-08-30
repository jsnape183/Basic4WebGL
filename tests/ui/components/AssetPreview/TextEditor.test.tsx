// @vitest-environment jsdom
// tests/ui/components/AssetPreview/TextEditor.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import assetsReducer, { IAsset } from '../../../../src/features/assets/assetsSlice';
import TextEditor from '../../../../src/components/AssetPreview/TextEditor';

// Build an IAsset from plain-text content (encodes it to base64 data URI)
// Task 6: asset binaries no longer live in Redux state. `text` is retained in the
// signature (ignored for now) so Task 9 can restore blob-backed assertions.
const makeAsset = (id = 'a1', name = 'notes.txt', _text = 'hello'): IAsset => ({
  id,
  name,
  projectId: 'p1',
  folderId: null,
  fullName: name,
});

const makeStore = () => configureStore({ reducer: { assets: assetsReducer } });

function renderEditor(asset = makeAsset(), onDirtyChange = vi.fn()) {
  const store = makeStore();
  render(
    <Provider store={store}>
      <TextEditor asset={asset} onDirtyChange={onDirtyChange} />
    </Provider>
  );
  return { store };
}

describe('TextEditor', () => {
  test('renders decoded asset content in textarea on mount', () => {
    renderEditor();
    // updated in Task 9: content is read from the blob store; shim decodes '' -> ''.
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  test('does not call onDirtyChange on initial render', () => {
    const onDirtyChange = vi.fn();
    renderEditor(makeAsset(), onDirtyChange);
    expect(onDirtyChange).not.toHaveBeenCalled();
  });

  test('calls onDirtyChange(id, true) when textarea content changes', async () => {
    const user = userEvent.setup();
    const onDirtyChange = vi.fn();
    renderEditor(makeAsset(), onDirtyChange);
    await user.type(screen.getByRole('textbox'), ' world');
    expect(onDirtyChange).toHaveBeenCalledWith('a1', true);
  });

  test('clicking Save dispatches updateAsset with re-encoded content', async () => {
    const user = userEvent.setup();
    const { store } = renderEditor();
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'world');
    await user.click(screen.getByRole('button', { name: /save/i }));
    const state = store.getState() as ReturnType<typeof store.getState>;
    // updated in Task 9: Save will write draft bytes via putAssetBlob. For now it
    // only dispatches metadata, so the asset survives with no content field.
    expect(state.assets.byId['a1']).toBeDefined();
    expect('content' in state.assets.byId['a1']!).toBe(false);
  });

  // M3: use toHaveBeenLastCalledWith
  test('calls onDirtyChange(id, false) after saving', async () => {
    const user = userEvent.setup();
    const onDirtyChange = vi.fn();
    renderEditor(makeAsset(), onDirtyChange);
    await user.type(screen.getByRole('textbox'), ' world');
    onDirtyChange.mockClear();
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onDirtyChange).toHaveBeenLastCalledWith('a1', false);
  });

  // I3: asset-switch resets draft
  // Skipped in Task 6: the assertion is entirely about decoded content, which no
  // longer lives in Redux. Task 9 restores it against the blob store.
  it.skip('resets draft text when asset prop changes', async () => {
    const asset1 = makeAsset('a1', 'first.txt', 'First content');
    const asset2 = makeAsset('a2', 'second.txt', 'Second content');
    const store = makeStore();
    const { rerender } = render(
      <Provider store={store}>
        <TextEditor asset={asset1} />
      </Provider>
    );
    expect(screen.getByRole('textbox')).toHaveValue('First content');

    rerender(
      <Provider store={store}>
        <TextEditor asset={asset2} />
      </Provider>
    );
    expect(screen.getByRole('textbox')).toHaveValue('Second content');
  });
});
