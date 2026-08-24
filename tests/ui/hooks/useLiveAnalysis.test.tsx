// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, afterEach, beforeEach, test, expect } from 'vitest';
import sessionReducer, { setIsRunning } from '../../../src/features/session/sessionSlice';
import filesReducer, { addFile, updateFile } from '../../../src/features/files/filesSlice';
import projectsReducer, { addProject } from '../../../src/features/projects/projectsSlice';
import packagesReducer, { seedPackages } from '../../../src/features/packages/packagesSlice';
import { firstPartyPackages } from '../../../src/constants/firstPartyPackages';
import { useLiveAnalysis } from '../../../src/hooks/useLiveAnalysis';
import Basic4WebGL from '../../../src/lib/Basic4WebGL';
import React from 'react';

const makeStore = () => {
  const store = configureStore({
    reducer: {
      session: sessionReducer,
      files: filesReducer,
      projects: projectsReducer,
      packages: packagesReducer,
    },
  });
  store.dispatch(seedPackages(firstPartyPackages));
  store.dispatch(addProject({ id: 'p1', name: 'Test', packageIds: ['softcore', 'softgfx'] }));
  store.dispatch(addFile({ id: 'f1', name: 'Main.bas', source: 'print "hi"', projectId: 'p1' }));
  return store;
};

const wrapper =
  (store: ReturnType<typeof makeStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test('does not compile before the debounce interval elapses', () => {
  const spy = vi.spyOn(Basic4WebGL, 'transpile');
  const store = makeStore();
  renderHook(() => useLiveAnalysis('p1'), { wrapper: wrapper(store) });

  act(() => {
    vi.advanceTimersByTime(200);
  });
  expect(spy).not.toHaveBeenCalled();
});

test('compiles silently after the debounce interval, without touching session state', () => {
  vi.spyOn(Basic4WebGL, 'transpile').mockReturnValue({
    diagnostics: [{ message: 'Undefined variable', severity: 'error', loc: { line: 1, col: 1, filename: 'Main' } }],
  });
  const store = makeStore();
  const { result } = renderHook(() => useLiveAnalysis('p1'), { wrapper: wrapper(store) });

  act(() => {
    vi.advanceTimersByTime(500);
  });

  expect(result.current.diagnostics).toHaveLength(1);
  expect(store.getState().session.logs).toHaveLength(0);
  expect(store.getState().session.transpiled).toBe('');
});

test('resets the timer on rapid successive changes (only compiles once)', () => {
  const spy = vi.spyOn(Basic4WebGL, 'transpile').mockReturnValue({ diagnostics: [] });
  const store = makeStore();
  const { rerender } = renderHook(() => useLiveAnalysis('p1'), { wrapper: wrapper(store) });

  act(() => {
    store.dispatch(
      updateFile({
        id: 'f1',
        projectId: 'p1',
        name: 'Main.bas',
        source: 'a',
        folderId: null,
        fullName: 'Main.bas',
      })
    );
    vi.advanceTimersByTime(200);
    store.dispatch(
      updateFile({
        id: 'f1',
        projectId: 'p1',
        name: 'Main.bas',
        source: 'ab',
        folderId: null,
        fullName: 'Main.bas',
      })
    );
    vi.advanceTimersByTime(200);
  });
  rerender();
  act(() => {
    vi.advanceTimersByTime(500);
  });

  expect(spy).toHaveBeenCalledTimes(1);
});

test('does not compile while a Run session is active, even after the debounce interval', () => {
  // A full project transpile is expensive enough (confirmed via a real
  // Chrome performance trace: ~90ms on the main thread) that firing it every
  // ~450ms while the game preview iframe is running visibly stalls the
  // running game -- the preview shares the same single JS thread as the
  // rest of the app. There's no reason to keep re-diagnosing source the
  // player isn't editing right now.
  const spy = vi.spyOn(Basic4WebGL, 'transpile');
  const store = makeStore();
  store.dispatch(setIsRunning(true));
  renderHook(() => useLiveAnalysis('p1'), { wrapper: wrapper(store) });

  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(spy).not.toHaveBeenCalled();
});

test('resumes compiling once the Run session stops', () => {
  const spy = vi.spyOn(Basic4WebGL, 'transpile').mockReturnValue({ diagnostics: [] });
  const store = makeStore();
  store.dispatch(setIsRunning(true));
  const { rerender } = renderHook(() => useLiveAnalysis('p1'), { wrapper: wrapper(store) });

  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(spy).not.toHaveBeenCalled();

  act(() => {
    store.dispatch(setIsRunning(false));
  });
  rerender();
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(spy).toHaveBeenCalledTimes(1);
});

test('a symbol snapshot from a clean compile survives a subsequent failing compile', () => {
  const spy = vi.spyOn(Basic4WebGL, 'transpile');
  spy.mockReturnValueOnce({
    diagnostics: [],
    symbols: [{ name: 'score', kind: 'Variable', scopeName: '', scopeType: '', fullScope: '' }],
  });

  const store = makeStore();
  const { result, rerender } = renderHook(() => useLiveAnalysis('p1'), { wrapper: wrapper(store) });
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(result.current.symbols).toHaveLength(1);

  spy.mockReturnValueOnce({ diagnostics: [{ message: 'oops', severity: 'error' }] });
  act(() => {
    store.dispatch(
      updateFile({
        id: 'f1',
        projectId: 'p1',
        name: 'Main.bas',
        source: 'broken',
        folderId: null,
        fullName: 'Main.bas',
      })
    );
    vi.advanceTimersByTime(500);
  });
  rerender();

  expect(result.current.diagnostics).toHaveLength(1);
  expect(result.current.symbols).toHaveLength(1); // unchanged — last-known-good
});
