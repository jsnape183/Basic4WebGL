import React, { useState } from 'react';

// Inline SVG icons — no external dependency needed
const FilesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const AssetsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const ExportIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

export type ActivitySection = {
  id: string;
  icon: React.ReactNode;
  ariaLabel: string;
  content?: React.ReactNode;
  onAction?: () => void;
};

type ProjectShellProps = {
  header: React.ReactNode;
  activitySections: ActivitySection[];
  editor: React.ReactNode;
  preview?: React.ReactNode;
  panel: React.ReactNode;
  footer?: React.ReactNode;
};

const ProjectShell: React.FC<ProjectShellProps> = ({
  header,
  activitySections,
  editor,
  preview,
  panel,
  footer,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    activitySections[0]?.id ?? null
  );

  const activeSection = activitySections.find((s) => s.id === activeSectionId);
  const sidebarOpen = activeSectionId !== null && (activeSection?.content != null);

  const toggleSection = (id: string) => {
    setActiveSectionId((current) => (current === id ? null : id));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-ds-bg text-ds-text overflow-hidden">
      {/* Header */}
      <header className="h-11 flex-shrink-0 flex items-center px-4 bg-ds-surface border-b border-ds-border">
        {header}
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Activity bar */}
        <div className="w-10 flex-shrink-0 flex flex-col items-center py-2 gap-1 bg-ds-surface border-r border-ds-border">
          {activitySections.map((section) => (
            <button
              key={section.id}
              onClick={() => section.onAction ? section.onAction() : toggleSection(section.id)}
              aria-label={section.ariaLabel}
              title={section.ariaLabel}
              className={`
                w-8 h-8 flex items-center justify-center rounded transition-colors
                focus:outline-none focus:ring-2 focus:ring-ds-accent focus:ring-offset-1 focus:ring-offset-ds-surface
                ${activeSectionId === section.id && !section.onAction
                  ? 'text-ds-accent bg-ds-accent-subtle'
                  : 'text-ds-text-dim hover:text-ds-text-muted'
                }
              `}
            >
              {section.icon}
            </button>
          ))}
        </div>

        {/* Sidebar panel */}
        {sidebarOpen && (
          <div className="w-56 flex-shrink-0 flex flex-col bg-ds-surface border-r border-ds-border overflow-y-auto">
            <div className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">
              {activeSection?.ariaLabel}
            </div>
            <div className="flex-1 px-2 pb-3">
              {activeSection?.content}
            </div>
          </div>
        )}

        {/* Editor area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-ds-bg">
          {editor}
        </main>

        {/* Preview pane */}
        {preview && (
          <aside className="w-2/5 flex-shrink-0 bg-ds-bg border-l border-ds-border flex flex-col overflow-hidden">
            <div className="px-3 py-1 text-[10px] text-ds-text-dim uppercase tracking-wider bg-ds-surface border-b border-ds-border flex-shrink-0">
              Preview
            </div>
            <div className="flex-1 overflow-hidden">
              {preview}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom panel */}
      {panel}

      {/* Status bar */}
      {footer && (
        <footer className="h-7 flex-shrink-0 flex items-center justify-between px-4 bg-ds-surface border-t border-ds-border text-[11px] text-ds-text-dim">
          {footer}
        </footer>
      )}
    </div>
  );
};

export { FilesIcon, AssetsIcon, ExportIcon };
export default ProjectShell;
