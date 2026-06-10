import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import type { Components } from 'react-markdown';
import { useNavigate, useParams } from 'react-router-dom';

const InternalLink: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children, ...props }) => {
  const navigate = useNavigate();
  const { section } = useParams<{ section: string }>();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/docs/${section ?? 'language-guide'}/${href}`);
  };

  return (
    <a href={href} onClick={handleClick} className="text-ds-accent hover:underline cursor-pointer" {...props}>
      {children}
    </a>
  );
};

const components: Components = {
  a: ({ href, children, ...props }) => {
    if (!href) return <a {...props}>{children}</a>;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-ds-accent hover:underline" {...props}>
          {children}
        </a>
      );
    }
    return <InternalLink href={href} {...props}>{children}</InternalLink>;
  },
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-ds-surface text-ds-accent px-1 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }
    return <code className={className} {...props}>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="bg-ds-surface rounded-md p-4 overflow-x-auto my-4 text-sm border border-ds-border">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="text-left px-3 py-2 border border-ds-border bg-ds-surface text-ds-text font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border border-ds-border text-ds-text-muted">{children}</td>
  ),
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-ds-text mb-4 mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold text-ds-text mt-8 mb-3 border-b border-ds-border pb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-ds-text mt-6 mb-2">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-ds-text-muted leading-relaxed mb-4">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-ds-text-muted mb-4 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-ds-text-muted mb-4 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="text-ds-text-muted">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-ds-accent pl-4 my-4 text-ds-text-dim italic">
      {children}
    </blockquote>
  ),
};

interface MarkdownContentProps {
  content: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeHighlight]}
    components={components}
  >
    {content}
  </ReactMarkdown>
);

export default MarkdownContent;
