import { LogItem, LogItemType } from '../../Types/LogItem';

type ConsoleProps = {
  logs: Array<LogItem>;
};

const getClassesForType = (type: LogItemType) => {
  switch (type) {
    case LogItemType.Notice:
      return 'text-green-400';
    case LogItemType.Warning:
      return 'text-orange-400';
    case LogItemType.Error:
      return 'text-red-400';
  }
};

const Console: React.FC<ConsoleProps> = ({ logs = new Array<LogItem>() }) => (
  <div className="h-40 bg-black text-green-400 text-xs font-mono p-2 overflow-auto">
    <div>Console log output...</div>
    {logs.map((log, index) => (
      <div
        key={index}
        className={`h-6 bg-black ${getClassesForType(
          log.type
        )} text-xs font-mono p-2`}
      >
        {log.text}
      </div>
    ))}
  </div>
);

export default Console;
