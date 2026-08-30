import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { importProject } from '../features/projects/importProject';
import { demoRegistry, DemoEntry } from '../features/demos/demoRegistry';
import type { Components } from 'react-markdown';

const descComponents: Components = {
  p: ({ children }) => <p className="text-ds-text-muted text-sm leading-relaxed mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-ds-text">{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  code: ({ children }) => (
    <code className="bg-ds-surface text-ds-accent px-1 py-0.5 rounded text-xs font-mono">{children}</code>
  ),
  a: ({ children }) => <span className="text-ds-accent">{children}</span>,
};

const DemoRow: React.FC<{ demo: DemoEntry }> = ({ demo }) => {
  const dispatch = useDispatch<AppDispatch>();
  const projects = useSelector((state: RootState) => state.projects.items);

  const existing = projects.find((p) => p.name === demo.name);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const handleTryDemo = async () => {
    const newId = await dispatch(importProject(demo.json, { tags: demo.tags }));
    setJustAdded(newId);
  };

  const targetId = justAdded ?? existing?.id;

  return (
    <div className="border border-ds-border rounded-xl bg-ds-surface p-6 flex flex-col gap-4 hover:border-ds-accent transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-ds-text font-bold text-lg leading-tight mb-2">{demo.name}</h2>
          <div className="flex flex-wrap gap-1.5">
            {demo.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-ds-bg border border-ds-border text-ds-text-dim"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* CTA cluster */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {targetId ? (
            <Link
              to={`/projects/${targetId}/edit`}
              className="bg-accent-gradient text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition whitespace-nowrap"
            >
              {justAdded ? '✓ Added — Open in Editor →' : 'Open in Editor →'}
            </Link>
          ) : (
            <button
              onClick={handleTryDemo}
              className="bg-accent-gradient text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition whitespace-nowrap"
            >
              Try Demo →
            </button>
          )}
          <Link
            to={`/docs/tutorials/${demo.docsSlug}`}
            className="text-xs text-ds-text-dim hover:text-ds-text-muted transition-colors whitespace-nowrap"
          >
            How it works →
          </Link>
        </div>
      </div>

      {/* Description */}
      <div>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={descComponents}>
          {demo.description}
        </ReactMarkdown>
      </div>
    </div>
  );
};

const DemosPage: React.FC = () => (
  <div className="min-h-screen bg-ds-bg text-ds-text">
    <header className="h-11 px-6 flex items-center justify-between border-b border-ds-border bg-ds-surface">
      <Link to="/" className="font-bold text-base tracking-wide text-gradient-accent hover:opacity-80 transition-opacity">
        softBASIC
      </Link>
      <nav className="flex items-center gap-6">
        <Link to="/demos" className="text-sm text-ds-text hover:text-ds-text-muted transition-colors">
          Demos
        </Link>
        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ds-text-muted hover:text-ds-text transition-colors"
        >
          Docs
        </a>
        <Link
          to="/projects"
          className="text-sm text-ds-text-muted hover:text-ds-text transition-colors"
        >
          My Projects
        </Link>
      </nav>
    </header>
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-ds-text mb-1">Demos</h1>
      <p className="text-ds-text-muted text-sm mb-8">
        Ready-to-run softBASIC projects. Click <strong className="text-ds-text">Try Demo</strong> to add a copy to your projects and open it in the editor.
      </p>
      <div className="flex flex-col gap-6">
        {demoRegistry.map((demo) => (
          <DemoRow key={demo.slug} demo={demo} />
        ))}
      </div>
    </main>
  </div>
);

export default DemosPage;
