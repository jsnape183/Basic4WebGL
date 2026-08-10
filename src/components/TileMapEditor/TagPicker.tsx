import React, { useState } from 'react';

type Props = {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
};

const TagPicker: React.FC<Props> = ({ tags, selectedTag, onSelectTag }) => {
  const [draftTag, setDraftTag] = useState('');

  const commitNewTag = () => {
    const trimmed = draftTag.trim();
    if (!trimmed) return;
    onSelectTag(trimmed);
    setDraftTag('');
  };

  return (
    <div className="flex flex-col h-full p-2 gap-2 overflow-y-auto">
      <button
        type="button"
        onClick={() => onSelectTag(null)}
        aria-label="Eraser"
        aria-pressed={selectedTag === null}
        className={`text-xs px-2 py-1 rounded border ${
          selectedTag === null
            ? 'border-ds-accent text-ds-accent bg-ds-accent-subtle'
            : 'border-ds-border text-ds-text-muted hover:text-ds-text'
        }`}
      >
        Eraser
      </button>
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onSelectTag(tag)}
            aria-label={`Tag ${tag}`}
            aria-pressed={selectedTag === tag}
            className={`px-2 py-1 rounded-full text-xs border ${
              selectedTag === tag
                ? 'border-ds-accent text-ds-accent bg-ds-accent-subtle'
                : 'border-ds-border text-ds-text-muted hover:text-ds-text'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={draftTag}
        onChange={(e) => setDraftTag(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commitNewTag(); }}
        placeholder="+ new tag name..."
        aria-label="New tag name"
        className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-xs text-ds-text focus:outline-none focus:ring-1 focus:ring-ds-accent"
      />
    </div>
  );
};

export default TagPicker;
