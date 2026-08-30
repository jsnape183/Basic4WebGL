// src/components/AssetPreview/TextEditor.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { IAsset, updateAsset } from '../../features/assets/assetsSlice';
import { AppDispatch } from '../../store';

type Props = {
  asset: IAsset;
  onDirtyChange?: (assetId: string, dirty: boolean) => void;
};

// TODO(Task 9): replaces the old data-URL MIME sniff; used when writing blobs back.
function mimeFromName(name: string): string {
  if (name.endsWith('.json')) return 'application/json';
  if (name.endsWith('.stm')) return 'application/json';
  return 'text/plain';
}

function decodeContent(content: string): string {
  const comma = content.indexOf(',');
  if (comma === -1) return '';
  try {
    return decodeURIComponent(escape(atob(content.slice(comma + 1))));
  } catch (e) {
    console.error('TextEditor: failed to decode asset content', e);
    return '';
  }
}

const TextEditor: React.FC<Props> = ({ asset, onDirtyChange }) => {
  const dispatch = useDispatch<AppDispatch>();
  // TODO(Task 9): decode real blob bytes instead of the empty shim
  const [draftText, setDraftText] = useState(() => decodeContent(''));

  // C1: memoize decoded content so it is not recomputed on every render
  // TODO(Task 9): decode real blob bytes instead of the empty shim
  const storedText = useMemo(() => decodeContent(''), [asset.id]);

  // I1: reset draft when the asset switches
  useEffect(() => {
    // TODO(Task 9): decode real blob bytes instead of the empty shim
    setDraftText(decodeContent(''));
  }, [asset.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // I2: explicit dirty flag
  const isDirty = draftText !== storedText;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setDraftText(newText);
    onDirtyChange?.(asset.id, newText !== storedText);
  };

  const handleSave = () => {
    // TODO(Task 9): putAssetBlob(asset.id, new Blob([draftText], { type: mimeFromName(asset.name) }))
    void mimeFromName(asset.name);
    dispatch(updateAsset({ ...asset }));
    onDirtyChange?.(asset.id, false);
  };

  return (
    <div className="flex flex-col h-full p-2 gap-2">
      <textarea
        aria-label="Asset text content"
        value={draftText}
        onChange={handleChange}
        className="flex-1 resize-none bg-ds-bg text-ds-text border border-ds-border rounded p-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ds-accent"
      />
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!isDirty}
          onClick={handleSave}
          className="bg-accent-gradient text-white text-sm px-4 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default TextEditor;
