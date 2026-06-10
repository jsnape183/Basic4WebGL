import React from 'react';
import { Link } from 'react-router-dom';
import { docsManifest } from '../../docs/manifest';

interface DocsTabsProps {
  sectionId: string;
}

const DocsTabs: React.FC<DocsTabsProps> = ({ sectionId }) => (
  <div className="flex border-b border-ds-border bg-ds-surface px-4">
    {docsManifest.map(section => {
      const isActive = section.id === sectionId;
      const firstSlug = section.topics[0]?.slug;
      const href = firstSlug
        ? `/docs/${section.id}/${firstSlug}`
        : `/docs/${section.id}`;

      return (
        <Link
          key={section.id}
          to={href}
          className={[
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
            isActive
              ? 'border-ds-accent text-ds-accent'
              : 'border-transparent text-ds-text-muted hover:text-ds-text',
          ].join(' ')}
        >
          {section.label}
        </Link>
      );
    })}
  </div>
);

export default DocsTabs;
