// src/components/AssetPreview/TextEditor.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { IAsset, updateAsset } from '../../features/assets/assetsSlice';
import { AppDispatch } from '../../store';

type Props = {
  asset: IAsset;
  onDirtyChange?: (assetId: string, dirty: boolean) => void;
};

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
  const [draftText, setDraftText] = useState(() => decodeContent(asset.content));

  // C1: memoize decoded content so it is not recomputed on every render
  const storedText = useMemo(() => decodeContent(asset.content), [asset.content]);

  // I1: reset draft when the asset switches
  useEffect(() => {
    setDraftText(decodeContent(asset.content));
  }, [asset.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // I2: explicit dirty flag
  const isDirty = draftText !== storedText;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setDraftText(newText);
    onDirtyChange?.(asset.id, newText !== storedText);
  };

  // M2: preserve original MIME type; C2: Unicode-safe encoding
  const handleSave = () => {
    const mime = asset.content.startsWith('data:')
      ? asset.content.slice(5, asset.content.indexOf(';'))
      : 'text/plain';
    const encoded = `data:${mime};base64,` + btoa(unescape(encodeURIComponent(draftText)));
    dispatch(updateAsset({ ...asset, content: encoded }));
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
          className="bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default TextEditor;
