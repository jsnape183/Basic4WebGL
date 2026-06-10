import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import DocsLayout from '../components/Docs/DocsLayout';
import { docsManifest } from '../docs/manifest';

const DEFAULT_SECTION = 'language-guide';
const DEFAULT_SLUG = docsManifest.find(s => s.id === DEFAULT_SECTION)?.topics[0]?.slug ?? 'modules';

const DocsPage: React.FC = () => {
  const { section, slug } = useParams<{ section?: string; slug?: string }>();

  const resolvedSection = section ?? DEFAULT_SECTION;
  const resolvedSlug = slug ?? DEFAULT_SLUG;

  if (!section || !slug) {
    return <Navigate to={`/docs/${resolvedSection}/${resolvedSlug}`} replace />;
  }

  return <DocsLayout sectionId={resolvedSection} slug={resolvedSlug} />;
};

export default DocsPage;
