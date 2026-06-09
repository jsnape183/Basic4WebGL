// @vitest-environment jsdom
// tests/ui/components/AssetPreview/TextEditor.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import assetsReducer, { IAsset } from '../../../../src/features/assets/assetsSlice';
import TextEditor from '../../../../src/components/AssetPreview/TextEditor';

// "hello" in base64 = aGVsbG8=
const makeAsset = (content = 'data:text/plain;base64,aGVsbG8='): IAsset => ({
  id: 'a1', name: 'notes.txt', content,
  projectId: 'p1', folderId: null, fullName: 'notes.txt',
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
    expect(screen.getByRole('textbox')).toHaveValue('hello');
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
    const expectedContent = 'data:text/plain;base64,' + btoa('world');
    expect(state.assets.byId['a1']?.content).toBe(expectedContent);
  });

  test('calls onDirtyChange(id, false) after saving', async () => {
    const user = userEvent.setup();
    const onDirtyChange = vi.fn();
    renderEditor(makeAsset(), onDirtyChange);
    await user.type(screen.getByRole('textbox'), ' world');
    onDirtyChange.mockClear();
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onDirtyChange).toHaveBeenCalledWith('a1', false);
  });
});
