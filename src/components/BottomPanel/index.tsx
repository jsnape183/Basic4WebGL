import React, { useState } from 'react';
import { LogItem, LogItemType } from '../../Types/LogItem';

type BottomPanelProps = {
  logs: LogItem[];
};

const TAG_STYLES: Record<LogItemType, string> = {
  [LogItemType.Notice]:  'bg-ds-success-bg text-ds-success',
  [LogItemType.Error]:   'bg-ds-error-bg text-ds-error',
  [LogItemType.Warning]: 'bg-ds-warning-bg text-ds-warning',
  [LogItemType.Output]:  'bg-ds-surface-2 text-ds-text-muted',
};

const TAG_LABELS: Record<LogItemType, string> = {
  [LogItemType.Notice]:  'OK',
  [LogItemType.Error]:   'ERR',
  [LogItemType.Warning]: 'WARN',
  [LogItemType.Output]:  'OUT',
};

type Tab = 'console' | 'problems';

const BottomPanel: React.FC<BottomPanelProps> = ({ logs }) => {
  const [activeTab, setActiveTab] = useState<Tab>('console');
  const [collapsed, setCollapsed] = useState(false);

  const errorLogs = logs.filter((l) => l.type === LogItemType.Error);
  const visibleLogs = activeTab === 'console' ? logs : errorLogs;

  return (
    <div className="flex flex-col bg-ds-bg border-t border-ds-border" style={{ height: collapsed ? 'auto' : '180px' }}>
      {/* Tab bar */}
      <div role="tablist" className="flex items-center bg-ds-surface border-b border-ds-border flex-shrink-0 px-2">
        {(['console', 'problems'] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          const badge = tab === 'problems' ? errorLogs.length : logs.length;
          const badgeStyle = tab === 'problems' && errorLogs.length > 0
            ? 'bg-ds-error-bg text-ds-error'
            : 'bg-ds-surface-2 text-ds-text-dim';

          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab)}
              className={`
                flex items-center gap-1.5 px-3 py-2 text-xs border-b-2 transition-colors capitalize
                ${isActive
                  ? 'text-ds-text border-ds-accent'
                  : 'text-ds-text-muted border-transparent hover:text-ds-text'
                }
              `}
            >
              {tab}
              {badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${badgeStyle}`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto text-ds-text-dim hover:text-ds-text-muted px-2 py-1 text-xs transition-colors"
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? '▲' : '▼'}
        </button>
      </div>

      {/* Log list */}
      {!collapsed && (
        <ul className="flex-1 overflow-y-auto font-mono text-xs p-2 space-y-0.5">
          {visibleLogs.length === 0 && (
            <li className="text-ds-text-dim py-1 px-1">No output.</li>
          )}
          {visibleLogs.map((log, i) => (
            <li key={i} className="flex items-start gap-2 px-1 py-0.5">
              <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${TAG_STYLES[log.type]}`}>
                {TAG_LABELS[log.type]}
              </span>
              <span className="text-ds-text leading-relaxed">{log.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BottomPanel;
