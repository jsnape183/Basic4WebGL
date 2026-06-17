// src/hooks/useRunnerMessages.ts
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useStore } from 'react-redux';
import * as Sentry from '@sentry/react';
import { addLog } from '../features/session/sessionSlice';
import { LogItemType } from '../Types/LogItem';
import { buildExportJson } from '../features/projects/exportProject';
import { RootState } from '../store';

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
 *
 * When a runtimeError arrives and a projectId is provided, the event is also
 * forwarded to Sentry with the full project source attached (asset binary
 * content is stripped to keep the payload small).
 */
export const useRunnerMessages = (projectId?: string) => {
  const dispatch = useDispatch();
  const store = useStore<RootState>();

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
          if (projectId) {
            try {
              const state = store.getState();
              const exportJson = buildExportJson(projectId, state);
              // Strip asset binary content — source files are what matter for reproduction
              const sanitized = {
                ...exportJson,
                assets: exportJson.assets.map(({ id, name, fullName, folderId }) => ({ id, name, fullName, folderId })),
              };
              Sentry.captureMessage(e.data.message, {
                level: 'error',
                extra: { project: sanitized },
              });
            } catch {
              Sentry.captureMessage(e.data.message, { level: 'error' });
            }
          }
          break;
        default:
          return;
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [dispatch, store, projectId]);
};
