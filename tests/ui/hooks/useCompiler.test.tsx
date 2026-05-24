// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, afterEach } from 'vitest';
import sessionReducer from '../../../src/features/session/sessionSlice';
import filesReducer from '../../../src/features/files/filesSlice';
import projectsReducer from '../../../src/features/projects/projectsSlice';
import packagesReducer from '../../../src/features/packages/packagesSlice';
import assetsReducer from '../../../src/features/assets/assetsSlice';
import uiReducer from '../../../src/features/ui/uiSlice';
import { useCompiler } from '../../../src/hooks/useCompiler';
import Basic4WebGL from '../../../src/lib/Basic4WebGL';
import React from 'react';

const makeStore = () =>
  configureStore({
    reducer: {
      session: sessionReducer,
      files: filesReducer,
      projects: projectsReducer,
      packages: packagesReducer,
      assets: assetsReducer,
      ui: uiReducer,
    },
  });

const wrapper =
  (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

test('isRunning starts false', () => {
  const store = makeStore();
  const { result } = renderHook(() => useCompiler('p1'), {
    wrapper: wrapper(store),
  });
  expect(result.current.isRunning).toBe(false);
});

test('stop sets isRunning to false and clears logs and transpiled', () => {
  const store = makeStore();
  store.dispatch({ type: 'session/setIsRunning', payload: true });
  store.dispatch({ type: 'session/addLog', payload: { type: 0, text: 'old' } });
  store.dispatch({ type: 'session/setTranspiled', payload: 'var x = 1;' });

  const { result } = renderHook(() => useCompiler('p1'), {
    wrapper: wrapper(store),
  });

  act(() => {
    result.current.stop();
  });

  const state = store.getState();
  expect(state.session.isRunning).toBe(false);
  expect(state.session.logs).toHaveLength(0);
  expect(state.session.transpiled).toBe('');
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('run dispatches setIsRunning and setTranspiled on successful compile', () => {
  vi.spyOn(Basic4WebGL, 'transpile').mockReturnValue({ code: 'var x = 1;', diagnostics: [] });

  const store = makeStore();
  const { result } = renderHook(() => useCompiler('p1'), {
    wrapper: wrapper(store),
  });

  act(() => {
    result.current.run();
  });

  const state = store.getState();
  expect(state.session.isRunning).toBe(true);
  expect(state.session.transpiled).toBe('var x = 1;');
});

test('run dispatches error logs and resets isRunning on compile failure', () => {
  vi.spyOn(Basic4WebGL, 'transpile').mockReturnValue({
    code: undefined,
    diagnostics: [{ message: 'Undefined variable', loc: undefined }],
  });

  const store = makeStore();
  const { result } = renderHook(() => useCompiler('p1'), {
    wrapper: wrapper(store),
  });

  act(() => {
    result.current.run();
  });

  const state = store.getState();
  expect(state.session.isRunning).toBe(false);
  expect(state.session.logs.some((l) => l.text === 'Undefined variable')).toBe(true);
});
