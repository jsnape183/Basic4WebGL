// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import React from 'react';
import filesReducer, { addFile, updateFile } from '../../../src/features/files/filesSlice';
import { useAutoSave } from '../../../src/hooks/useAutoSave';

const makeStore = () =>
  configureStore({ reducer: { files: filesReducer } });

const wrapper = (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('clears dirty files 500ms after last update', async () => {
  const store = makeStore();
  store.dispatch(addFile({ id: 'f1', name: 'main.bas', source: '', projectId: 'p1' }));
  store.dispatch(updateFile({ id: 'f1', name: 'main.bas', source: 'PRINT', projectId: 'p1' }));

  renderHook(() => useAutoSave(), { wrapper: wrapper(store) });

  expect(store.getState().files.dirtyFileIds).toContain('f1');

  act(() => { vi.advanceTimersByTime(500); });

  expect(store.getState().files.dirtyFileIds).toHaveLength(0);
});

test('resets debounce timer when another update arrives', async () => {
  const store = makeStore();
  store.dispatch(addFile({ id: 'f1', name: 'main.bas', source: '', projectId: 'p1' }));
  store.dispatch(updateFile({ id: 'f1', name: 'main.bas', source: 'A', projectId: 'p1' }));

  const { rerender } = renderHook(() => useAutoSave(), { wrapper: wrapper(store) });

  act(() => { vi.advanceTimersByTime(300); });
  // Another update before 500ms
  act(() => {
    store.dispatch(updateFile({ id: 'f1', name: 'main.bas', source: 'AB', projectId: 'p1' }));
  });
  rerender();

  // Still dirty at 300ms after second update
  act(() => { vi.advanceTimersByTime(300); });
  expect(store.getState().files.dirtyFileIds).toContain('f1');

  // Clean at 500ms after second update
  act(() => { vi.advanceTimersByTime(200); });
  expect(store.getState().files.dirtyFileIds).toHaveLength(0);
});
