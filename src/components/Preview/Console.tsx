import { LogItem, LogItemType } from '../../Types/LogItem';

type ConsoleProps = {
  logs: Array<LogItem>;
};

const getClassesForType = (type: LogItemType) => {
  switch (type) {
    case LogItemType.Notice:  return 'text-green-400';
    case LogItemType.Warning: return 'text-orange-400';
    case LogItemType.Error:   return 'text-red-400';
    case LogItemType.Output:  return 'text-gray-400';
  }
};

const Console: React.FC<ConsoleProps> = ({ logs = [] }) => {
  return (
    <ul className="bg-black text-xs font-mono p-2 overflow-scroll">
      <li className="text-gray-400">Console log output...</li>
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
