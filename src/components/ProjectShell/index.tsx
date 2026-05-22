import React from 'react';

type ProjectShellProps = {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  editor: React.ReactNode;
  preview?: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * 3-pane IDE layout: fixed header + footer, collapsible sidebar,
 * main editor pane, and an optional preview pane.
 * Owns no state — purely structural.
 */
const ProjectShell: React.FC<ProjectShellProps> = ({
  header,
  sidebar,
  editor,
  preview,
  footer,
}) => (
  <div className="h-screen w-screen flex flex-col bg-gray-900 text-white">
    <header className="h-12 px-4 flex items-center justify-between bg-gray-800 shadow">
      {header}
    </header>

    <div className="flex flex-1 overflow-hidden">
      <nav className="w-64 flex-shrink-0 bg-gray-800 text-gray-300 p-4 border-r border-gray-700 overflow-y-auto">
        {sidebar}
      </nav>

      <main
        className={`flex-1 bg-gray-900 ${
          preview ? 'w-1/2' : 'w-full'
        } transition-all duration-300`}
      >
        {editor}
      </main>

      {preview && (
        <aside className="w-1/2 bg-gray-950 border-l border-gray-700 flex flex-col">
          {preview}
        </aside>
      )}
    </div>

    {footer && (
      <footer className="h-8 px-4 bg-gray-800 text-xs text-gray-400 flex items-center justify-between">
        {footer}
      </footer>
    )}
  </div>
);

export default ProjectShell;
