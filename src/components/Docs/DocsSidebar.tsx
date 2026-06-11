import React from 'react';
import { Link } from 'react-router-dom';
import { docsManifest, getSectionTopics, type DocTopic } from '../../docs/manifest';

interface DocsSidebarProps {
  sectionId: string;
  slug: string;
}

const DocsSidebar: React.FC<DocsSidebarProps> = ({ sectionId, slug }) => {
  const section = docsManifest.find(s => s.id === sectionId);

  const renderTopic = (topic: DocTopic) => (
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
  );

  if (!section || getSectionTopics(section).length === 0) {
    return (
      <aside className="w-52 flex-shrink-0 border-r border-ds-border bg-ds-surface overflow-y-auto">
        <div className="py-4">
          <p className="px-4 py-2 text-xs text-ds-text-dim">Coming soon.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-52 flex-shrink-0 border-r border-ds-border bg-ds-surface overflow-y-auto">
      <div className="py-4">
        {section.groups ? (
          section.groups.map(group => (
            <div key={group.label}>
              <p className="text-xs text-ds-text-dim uppercase tracking-wider px-4 pt-4 pb-1">
                {group.label}
              </p>
              {group.topics.map(renderTopic)}
            </div>
          ))
        ) : (
          section.topics.map(renderTopic)
        )}
      </div>
    </aside>
  );
};

export default DocsSidebar;
