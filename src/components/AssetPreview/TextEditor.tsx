// src/components/AssetPreview/TextEditor.tsx
import React, { useState } from 'react';
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
    return atob(content.slice(comma + 1));
  } catch {
    return '';
  }
}

const TextEditor: React.FC<Props> = ({ asset, onDirtyChange }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [draftText, setDraftText] = useState(() => decodeContent(asset.content));
  const storedText = decodeContent(asset.content);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setDraftText(newText);
    onDirtyChange?.(asset.id, newText !== storedText);
  };

  const handleSave = () => {
    const encoded = 'data:text/plain;base64,' + btoa(draftText);
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
          onClick={handleSave}
          className="bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-1.5 rounded hover:opacity-90 transition"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default TextEditor;
