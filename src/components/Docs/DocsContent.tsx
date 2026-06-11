import React from 'react';
import { Link } from 'react-router-dom';
import { docsManifest, getSectionTopics, type DocTopic } from '../../docs/manifest';
import MarkdownContent from './MarkdownContent';

const allFiles = import.meta.glob<string>('../../docs/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

interface DocsContentProps {
  sectionId: string;
  slug: string;
}

const DocsContent: React.FC<DocsContentProps> = ({ sectionId, slug }) => {
  const section = docsManifest.find(s => s.id === sectionId);

  if (!section) {
    return (
      <div className="flex-1 p-8 text-ds-text-dim text-sm">
        Section not found.
      </div>
    );
  }

  if (getSectionTopics(section).length === 0) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <p className="text-ds-text-dim text-sm">Coming soon.</p>
      </div>
    );
  }

  const topics = getSectionTopics(section);
  const topicIndex = topics.findIndex(t => t.slug === slug);
  const topic: DocTopic | undefined = topics[topicIndex];

  if (!topic) {
    return (
      <div className="flex-1 p-8 text-ds-text-dim text-sm">
        Topic not found.
      </div>
    );
  }

  const fileKey = `../../docs/${topic.file}`;
  const content = allFiles[fileKey];

  const prevTopic = topicIndex > 0 ? topics[topicIndex - 1] : undefined;
  const nextTopic = topicIndex < topics.length - 1 ? topics[topicIndex + 1] : undefined;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-6">
        <div className="text-xs text-ds-text-dim mb-6">
          {section.label} › {topic.title}
        </div>

        {content ? (
          <MarkdownContent content={content} />
        ) : (
          <p className="text-ds-text-dim text-sm">Content not available.</p>
        )}

        <div className="flex justify-between mt-12 pt-6 border-t border-ds-border">
          <div>
            {prevTopic && (
              <Link
                to={`/docs/${sectionId}/${prevTopic.slug}`}
                className="text-sm text-ds-text-muted hover:text-ds-text transition-colors"
              >
                ← {prevTopic.title}
              </Link>
            )}
          </div>
          <div>
            {nextTopic && (
              <Link
                to={`/docs/${sectionId}/${nextTopic.slug}`}
                className="text-sm text-ds-text-muted hover:text-ds-text transition-colors"
              >
                {nextTopic.title} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsContent;
