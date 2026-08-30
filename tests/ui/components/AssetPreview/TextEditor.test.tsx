// @vitest-environment jsdom
// tests/ui/components/AssetPreview/TextEditor.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import assetsReducer, { IAsset } from '../../../../src/features/assets/assetsSlice';
import TextEditor from '../../../../src/components/AssetPreview/TextEditor';
import {
  putAssetBlob,
  getAssetBlob,
  _clearAllAssetBlobsForTests,
} from '../../../../src/lib/storage/assetBlobStore';

const makeAsset = (id = 'a1', name = 'notes.txt'): IAsset => ({
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

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
  await putAssetBlob('a1', new Blob(['hello'], { type: 'text/plain' }));
});

describe('TextEditor', () => {
  test('renders the blob text in the textarea once it loads', async () => {
    renderEditor();
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('hello'));
  });

  test('does not call onDirtyChange on initial render', async () => {
    const onDirtyChange = vi.fn();
    renderEditor(makeAsset(), onDirtyChange);
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('hello'));
    expect(onDirtyChange).not.toHaveBeenCalled();
  });

  test('calls onDirtyChange(id, true) when textarea content changes', async () => {
    const user = userEvent.setup();
    const onDirtyChange = vi.fn();
    renderEditor(makeAsset(), onDirtyChange);
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('hello'));
    await user.type(screen.getByRole('textbox'), ' world');
    expect(onDirtyChange).toHaveBeenCalledWith('a1', true);
  });

  test('clicking Save writes the edited text to the blob store', async () => {
    const user = userEvent.setup();
    renderEditor();
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('hello'));
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'world');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(async () => {
      expect(await (await getAssetBlob('a1'))!.text()).toBe('world');
    });
  });

  test('calls onDirtyChange(id, false) after saving', async () => {
    const user = userEvent.setup();
    const onDirtyChange = vi.fn();
    renderEditor(makeAsset(), onDirtyChange);
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('hello'));
    await user.type(screen.getByRole('textbox'), ' world');
    onDirtyChange.mockClear();
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onDirtyChange).toHaveBeenLastCalledWith('a1', false);
  });

  it('resets draft text when asset prop changes', async () => {
    await putAssetBlob('a2', new Blob(['Second content'], { type: 'text/plain' }));
    const asset1 = makeAsset('a1', 'first.txt');
    const asset2 = makeAsset('a2', 'second.txt');
    const store = makeStore();
    const { rerender } = render(
      <Provider store={store}>
        <TextEditor asset={asset1} />
      </Provider>
    );
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('hello'));

    rerender(
      <Provider store={store}>
        <TextEditor asset={asset2} />
      </Provider>
    );
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('Second content'));
  });
});
