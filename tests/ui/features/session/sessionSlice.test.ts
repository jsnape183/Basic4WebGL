// tests/ui/features/session/sessionSlice.test.ts
import sessionReducer, {
  addLog,
  clearLogs,
  setTranspiled,
  setIsRunning,
  SessionState,
} from '../../../../src/features/session/sessionSlice';
import { LogItemType } from '../../../../src/Types/LogItem';

const initial: SessionState = {
  logs: [],
  transpiled: '',
  isRunning: false,
};

test('initial state', () => {
  expect(sessionReducer(undefined, { type: '@@init' })).toEqual(initial);
});

test('addLog appends a log entry', () => {
  const state = sessionReducer(initial, addLog({ type: LogItemType.Notice, text: 'hi' }));
  expect(state.logs).toHaveLength(1);
  expect(state.logs[0].text).toBe('hi');
});

test('clearLogs empties the log array', () => {
  const withLog = sessionReducer(initial, addLog({ type: LogItemType.Output, text: 'x' }));
  const cleared = sessionReducer(withLog, clearLogs());
  expect(cleared.logs).toHaveLength(0);
});

test('setTranspiled stores the code string', () => {
  const state = sessionReducer(initial, setTranspiled('var x = 1;'));
  expect(state.transpiled).toBe('var x = 1;');
});

test('setIsRunning toggles running flag', () => {
  const running = sessionReducer(initial, setIsRunning(true));
  expect(running.isRunning).toBe(true);
  const stopped = sessionReducer(running, setIsRunning(false));
  expect(stopped.isRunning).toBe(false);
});
