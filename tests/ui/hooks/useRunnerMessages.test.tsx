// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, afterEach } from 'vitest';
import sessionReducer from '../../../src/features/session/sessionSlice';
import filesReducer from '../../../src/features/files/filesSlice';
import projectsReducer from '../../../src/features/projects/projectsSlice';
import assetsReducer from '../../../src/features/assets/assetsSlice';
import uiReducer from '../../../src/features/ui/uiSlice';
import { useRunnerMessages } from '../../../src/hooks/useRunnerMessages';
import { LogItemType } from '../../../src/Types/LogItem';
import React from 'react';

const makeStore = () =>
  configureStore({
    reducer: {
      session: sessionReducer,
      files: filesReducer,
      projects: projectsReducer,
      assets: assetsReducer,
      ui: uiReducer,
    },
  });

const wrapper =
  (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

afterEach(() => {
  vi.restoreAllMocks();
});

test('dispatches Output log for console.log message', () => {
  const store = makeStore();
  renderHook(() => useRunnerMessages(), { wrapper: wrapper(store) });

  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: window.location.origin,
        data: { type: 'console.log', message: 'hello' },
      }),
    );
  });

  const state = store.getState();
  expect(state.session.logs).toHaveLength(1);
  expect(state.session.logs[0].type).toBe(LogItemType.Output);
  expect(state.session.logs[0].text).toBe('hello');
});

test('dispatches Error log for runtimeError message', () => {
  const store = makeStore();
  renderHook(() => useRunnerMessages(), { wrapper: wrapper(store) });

  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: window.location.origin,
        data: { type: 'runtimeError', message: 'something went wrong' },
      }),
    );
  });

  const state = store.getState();
  expect(state.session.logs).toHaveLength(1);
  expect(state.session.logs[0].type).toBe(LogItemType.Error);
  expect(state.session.logs[0].text).toBe('something went wrong');
});

test('ignores messages from a different origin', () => {
  const store = makeStore();
  renderHook(() => useRunnerMessages(), { wrapper: wrapper(store) });

  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://evil.example.com',
        data: { type: 'console.log', message: 'attack' },
      }),
    );
  });

  const state = store.getState();
  expect(state.session.logs).toHaveLength(0);
});
