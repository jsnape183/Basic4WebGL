import React, { useState } from 'react';
import { tagColor } from './tagColor';

type Props = {
  tags: string[];
  /** Paint mode: the set of tags currently loaded to stamp when painting. */
  selectedTags?: string[];
  /** Paint mode: true when the eraser is the active choice (mutually exclusive with loaded tags). */
  eraserActive?: boolean;
  /** Paint mode: add the tag to the loaded set if absent, remove it if present. */
  onToggleTag?: (tag: string) => void;
  /** Paint mode: choose the eraser (clears the loaded set). */
  onSelectEraser?: () => void;
  /** When provided, shows a Select-mode toggle. */
  selectMode?: boolean;
  onToggleSelectMode?: () => void;
  /** The cell currently selected on the canvas (select mode only). */
  selectedCell?: { row: number; col: number } | null;
  /** Every tag assigned to the selected cell — a cell can hold several. */
  cellTags?: string[];
  /** Add the tag to the selected cell if absent, remove it if present. */
  onToggleCellTag?: (tag: string) => void;
  /** Remove every tag from the selected cell. */
  onClearCell?: () => void;
  onDeselectCell?: () => void;
  /** Tags a marker somewhere still uses — these can't be removed from the registry. */
  tagsInUse?: string[];
  /** Delete a tag from the tilemap's registry (offered only for unused tags). */
  onRemoveTag?: (tag: string) => void;
};

const TagPicker: React.FC<Props> = ({
  tags,
  selectedTags = [],
  eraserActive = false,
  onToggleTag,
  onSelectEraser,
  selectMode = false,
  onToggleSelectMode,
  selectedCell = null,
  cellTags = [],
  onToggleCellTag,
  onClearCell,
  onDeselectCell,
  tagsInUse = [],
  onRemoveTag,
}) => {
  const [draftTag, setDraftTag] = useState('');
  const editingCell = selectMode && !!selectedCell;

  const commitNewTag = () => {
    const trimmed = draftTag.trim();
    if (!trimmed) return;
    if (editingCell) {
      if (!cellTags.includes(trimmed)) onToggleCellTag?.(trimmed);
    } else if (!selectedTags.includes(trimmed)) {
      onToggleTag?.(trimmed);
    }
    setDraftTag('');
  };

  return (
    <div className="flex flex-col h-full p-2 gap-2 overflow-y-auto">
      {onToggleSelectMode && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSelectMode}
            aria-label="Select tool"
            aria-pressed={selectMode}
            className={`text-xs px-2 py-1 rounded border ${
              selectMode
                ? 'border-ds-accent text-ds-accent bg-ds-accent-subtle'
                : 'border-ds-border text-ds-text-muted hover:text-ds-text'
            }`}
          >
            Select
          </button>
          {selectMode && (
            <span className="text-xs text-ds-text-muted">
              {selectedCell
                ? `Row ${selectedCell.row}, Col ${selectedCell.col} · ${cellTags.length} tag${cellTags.length === 1 ? '' : 's'}`
                : 'Click a cell to select it'}
            </span>
          )}
          {editingCell && (
            <button
              type="button"
              onClick={onDeselectCell}
              className="text-xs px-2 py-1 rounded border border-ds-border text-ds-text-muted hover:text-ds-text"
            >
              Deselect
            </button>
          )}
        </div>
      )}

      {editingCell ? (
        <>
          <div className="flex flex-wrap items-center gap-1">
            {cellTags.length === 0 && (
              <span className="text-xs text-ds-text-dim">No tags on this cell yet</span>
            )}
            {cellTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleCellTag?.(tag)}
                aria-label={`Remove tag ${tag}`}
                className="px-2 py-1 rounded-full text-xs text-white flex items-center gap-1"
                style={{ backgroundColor: tagColor(tag) }}
              >
                {tag} <span aria-hidden="true">×</span>
              </button>
            ))}
            {cellTags.length > 0 && (
              <button
                type="button"
                onClick={onClearCell}
                aria-label="Clear cell"
                className="text-xs px-2 py-1 rounded border border-ds-border text-ds-text-muted hover:text-ds-text"
              >
                Clear
              </button>
            )}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-ds-text-dim">Add a tag</div>
          <div className="flex flex-wrap gap-1">
            {tags.filter((t) => !cellTags.includes(t)).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleCellTag?.(tag)}
                aria-label={`Add tag ${tag}`}
                className="px-2 py-1 rounded-full text-xs border border-ds-border text-ds-text-muted hover:text-ds-text"
              >
                + {tag}
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
        </>
      ) : selectMode ? null : (
        <>
          <button
            type="button"
            onClick={() => onSelectEraser?.()}
            aria-label="Eraser"
            aria-pressed={eraserActive}
            className={`text-xs px-2 py-1 rounded border ${
              eraserActive
                ? 'border-ds-accent text-ds-accent bg-ds-accent-subtle'
                : 'border-ds-border text-ds-text-muted hover:text-ds-text'
            }`}
          >
            Eraser
          </button>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => {
              const removable = !!onRemoveTag && !tagsInUse.includes(tag);
              const loaded = selectedTags.includes(tag);
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center rounded-full text-xs border ${
                    loaded
                      ? 'border-ds-accent text-ds-accent bg-ds-accent-subtle'
                      : 'border-ds-border text-ds-text-muted'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleTag?.(tag)}
                    aria-label={`Tag ${tag}`}
                    aria-pressed={loaded}
                    className={`pl-2 py-1 hover:text-ds-text ${removable ? 'pr-1' : 'pr-2'}`}
                  >
                    {tag}
                  </button>
                  {removable && (
                    <button
                      type="button"
                      onClick={() => onRemoveTag?.(tag)}
                      aria-label={`Delete tag ${tag} from tilemap`}
                      title="Unused — delete from tilemap"
                      className="pr-2 pl-0.5 py-1 text-ds-text-dim hover:text-ds-error"
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })}
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
        </>
      )}
    </div>
  );
};

export default TagPicker;
