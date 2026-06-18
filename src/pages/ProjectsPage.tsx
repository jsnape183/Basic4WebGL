// src/pages/ProjectsPage.tsx
import React from 'react';
import ProjectList from '../components/Projects';

const ProjectsPage: React.FC = () => (
  <div className="min-h-screen bg-ds-bg text-ds-text">
    <header className="h-11 px-6 flex items-center justify-between border-b border-ds-border bg-ds-surface">
      <span className="font-bold text-base tracking-wide text-gradient-accent">
        softBASIC
      </span>
      <a
        href="/docs"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-ds-text-muted hover:text-ds-text transition-colors"
      >
        Docs
      </a>
    </header>
    <main className="max-w-5xl mx-auto px-6 py-8">
      <ProjectList />
    </main>
  </div>
);

export default ProjectsPage;
