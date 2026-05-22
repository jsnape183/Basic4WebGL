// src/hooks/useRunnerMessages.ts
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addLog } from '../features/session/sessionSlice';
import { LogItemType } from '../Types/LogItem';

type LogMessage = { type: 'console.log' | 'runtimeError'; message: string };

function isLogMessage(x: unknown): x is LogMessage {
  return (
    !!x &&
    typeof (x as LogMessage).type === 'string' &&
    typeof (x as LogMessage).message === 'string'
  );
}

/**
 * Listens for postMessage events from the sandboxed runner iframe and
 * dispatches them as log entries. Origin-checks against window.location.origin
 * (valid because the iframe uses sandbox="allow-same-origin").
 */
export const useRunnerMessages = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (!isLogMessage(e.data)) return;
      switch (e.data.type) {
        case 'console.log':
          dispatch(addLog({ type: LogItemType.Output, text: e.data.message }));
          break;
        case 'runtimeError':
          dispatch(addLog({ type: LogItemType.Error, text: e.data.message }));
          break;
        default:
          return; // unknown message types are silently ignored
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [dispatch]);
};
