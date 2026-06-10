import React from 'react';
import DocsTabs from './DocsTabs';
import DocsSidebar from './DocsSidebar';
import DocsContent from './DocsContent';

interface DocsLayoutProps {
  sectionId: string;
  slug: string;
}

const DocsLayout: React.FC<DocsLayoutProps> = ({ sectionId, slug }) => (
  <div className="min-h-screen flex flex-col bg-ds-bg text-ds-text">
    <header className="h-11 flex-shrink-0 flex items-center px-6 bg-ds-surface border-b border-ds-border">
      <span className="font-bold text-base tracking-wide text-ds-accent-btn-text">
        softBASIC Docs
      </span>
    </header>

    <DocsTabs sectionId={sectionId} />

    <div className="flex flex-1 overflow-hidden">
      <DocsSidebar sectionId={sectionId} slug={slug} />
      <DocsContent sectionId={sectionId} slug={slug} />
    </div>
  </div>
);

export default DocsLayout;
