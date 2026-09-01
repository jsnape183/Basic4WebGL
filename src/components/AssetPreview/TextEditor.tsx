// src/components/AssetPreview/TextEditor.tsx
import React, { useState, useEffect } from 'react';
import { IAsset } from '../../features/assets/assetsSlice';
import { useAssetText } from '../../hooks/useAssetText';
import { putAssetBlob } from '../../lib/storage/assetBlobStore';
import { assetMimeFromName as mimeFromName } from '../../lib/storage/assetMime';

const TextEditor: React.FC<Props> = ({ asset, onDirtyChange }) => {
  const { text: storedText, loading } = useAssetText(asset.id);
  const [draftText, setDraftText] = useState('');
  // Tracks the last-saved text so the dirty flag clears after Save without a
  // remount — the blob store lives outside Redux, so useAssetText will not
  // re-fetch on its own.
  const [savedText, setSavedText] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) setDraftText(storedText ?? '');
    setSavedText(null);
  }, [asset.id, loading, storedText]);

  const baseline = savedText ?? storedText ?? '';
  const isDirty = !loading && draftText !== baseline;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setDraftText(newText);
    onDirtyChange?.(asset.id, newText !== baseline);
  };

  const handleSave = async () => {
    await putAssetBlob(asset.id, new Blob([draftText], { type: mimeFromName(asset.name) }));
    setSavedText(draftText);
    onDirtyChange?.(asset.id, false);
  };

  return (
    <div className="flex flex-col h-full p-2 gap-2">
      <textarea
        aria-label="Asset text content"
        value={draftText}
        onChange={handleChange}
        disabled={loading}
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
