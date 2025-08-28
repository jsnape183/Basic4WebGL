import { useEffect } from 'react';
import { LogItem, LogItemType } from '../../Types/LogItem';
import { useDispatch } from 'react-redux';
import { addLog } from '../../features/ui/uiSlice';

type ConsoleProps = {
  logs: Array<LogItem>;
};

type LogMessage = { type: string; message: string };

const TRUSTED_ORIGINS = new Set([
  'https://your-iframe-app.example',
  'http://localhost:5173', // dev
]);

function isLogMessage(x: any): x is LogMessage {
  return x && typeof x.type === 'string';
}

const getClassesForType = (type: LogItemType) => {
  switch (type) {
    case LogItemType.Notice:
      return 'text-green-400';
    case LogItemType.Warning:
      return 'text-orange-400';
    case LogItemType.Error:
      return 'text-red-400';
    case LogItemType.Output:
      return 'text-grey-400';
  }
};

const Console: React.FC<ConsoleProps> = ({ logs = new Array<LogItem>() }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      //if (!TRUSTED_ORIGINS.has(e.origin)) return;           // security
      if (!isLogMessage(e.data)) return;
      switch (e.data.type) {
        case 'console.log':
          dispatch(addLog({ type: LogItemType.Output, text: e.data.message }));
          break;
        case 'runtimeError':
          dispatch(addLog({ type: LogItemType.Error, text: e.data.message }));
          throw Error(e.data.message);
          break;
        default:
          dispatch(addLog({ type: LogItemType.Warning, text: e.data.message }));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <ul className="bg-black text-xs font-mono p-2 overflow-scroll">
      <li className="text-grey-400">Console log output...</li>
      {logs.map((log, index) => (
        <li
          key={index}
          className={`bg-black ${getClassesForType(
            log.type
          )} text-xs font-mono p-2`}
        >
          {log.text}
        </li>
      ))}
    </ul>
  );
};

export default Console;
