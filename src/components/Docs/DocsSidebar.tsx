import React from 'react';
import { Link } from 'react-router-dom';
import { docsManifest } from '../../docs/manifest';

interface DocsSidebarProps {
  sectionId: string;
  slug: string;
}

const DocsSidebar: React.FC<DocsSidebarProps> = ({ sectionId, slug }) => {
  const section = docsManifest.find(s => s.id === sectionId);

  return (
    <aside className="w-52 flex-shrink-0 border-r border-ds-border bg-ds-surface overflow-y-auto">
      <div className="py-4">
        {section && section.topics.length > 0 ? (
          section.topics.map(topic => (
            <Link
              key={topic.slug}
              to={`/docs/${sectionId}/${topic.slug}`}
              className={[
                'block px-4 py-1.5 text-sm transition-colors',
                topic.slug === slug
                  ? 'border-l-2 border-ds-accent text-ds-text bg-ds-bg font-medium'
                  : 'border-l-2 border-transparent text-ds-text-muted hover:text-ds-text',
              ].join(' ')}
            >
              {topic.title}
            </Link>
          ))
        ) : (
          <p className="px-4 py-2 text-xs text-ds-text-dim">Coming soon.</p>
        )}
      </div>
    </aside>
  );
};

export default DocsSidebar;
