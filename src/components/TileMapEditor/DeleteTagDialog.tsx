import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

type Props = {
  tag: string;
  markerCount: number;
  layerCount: number;
  onCancel: () => void;
  onDeleteFromListOnly: () => void;
  onRemoveEverywhere: () => void;
};

const DeleteTagDialog: React.FC<Props> = ({
  tag,
  markerCount,
  layerCount,
  onCancel,
  onDeleteFromListOnly,
  onRemoveEverywhere,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Delete tag ${tag}`}
        className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
      >
        <h2 className="text-ds-text text-lg font-semibold mb-4">Delete tag</h2>
        <p className="text-ds-text text-sm mb-4">
          &quot;{tag}&quot; is used on {markerCount} marker{markerCount === 1 ? '' : 's'} across{' '}
          {layerCount} layer{layerCount === 1 ? '' : 's'}.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDeleteFromListOnly}
            className="border border-ds-border text-ds-text text-sm px-4 py-2 rounded hover:bg-ds-surface transition"
          >
            Delete from list only
          </button>
          <button
            type="button"
            onClick={onRemoveEverywhere}
            className="border border-ds-error text-ds-error text-sm px-4 py-2 rounded hover:bg-ds-error-bg transition"
          >
            Remove everywhere
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteTagDialog;
