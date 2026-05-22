import { LogItem, LogItemType } from '../../Types/LogItem';

type ConsoleProps = {
  logs: Array<LogItem>;
};

const getClassesForType = (type: LogItemType) => {
  switch (type) {
    case LogItemType.Notice:  return 'text-ds-success';
    case LogItemType.Warning: return 'text-ds-warning';
    case LogItemType.Error:   return 'text-ds-error';
    case LogItemType.Output:  return 'text-ds-text-muted';
  }
};

const Console: React.FC<ConsoleProps> = ({ logs = [] }) => {
  return (
    <ul className="bg-black text-xs font-mono p-2 overflow-scroll">
      <li className="text-ds-text-muted">Console log output...</li>
      {logs.map((log, index) => (
        <li
          key={index}
          className={`bg-black ${getClassesForType(log.type)} text-xs font-mono p-2`}
        >
          {log.text}
        </li>
      ))}
    </ul>
  );
};

export default Console;
