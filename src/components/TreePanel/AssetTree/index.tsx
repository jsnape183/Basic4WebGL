import React, { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAssetsForProject } from '../../../hooks/useAssetsForProject';
import { addAsset, removeAsset } from '../../../features/assets/assetsSlice';

type AssetTreeProps = {
  projectId: string;
};

const MAX_BYTES = 4 * 1024 * 1024;

const AssetTree: React.FC<AssetTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch();
  const assets = useAssetsForProject(projectId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFiles = async (fileList: FileList) => {
    for (const f of Array.from(fileList)) {
      if (f.size > MAX_BYTES) {
        alert(`${f.name} is too large (max 4 MB).`);
        return;
      }
    }
    await Promise.all(
      Array.from(fileList).map(
        (file) =>
          new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              dispatch(
                addAsset({
                  id: crypto.randomUUID(),
                  name: file.name,
                  content: reader.result as string,
                  projectId,
                })
              );
              resolve();
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">
          Assets
        </span>
        <button
          onClick={() => inputRef.current?.click()}
          className="text-ds-text-muted hover:text-ds-text transition text-sm leading-none"
          aria-label="Upload asset"
          title="Upload asset"
        >
          +
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          data-testid="uploader"
          aria-label="Upload asset"
          onChange={handleInputChange}
        />
      </div>

      {assets.length === 0 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            mt-1 border border-dashed rounded px-2 py-3 text-center cursor-pointer transition-colors
            ${dragging
              ? 'border-ds-accent text-ds-text-muted bg-ds-accent-subtle'
              : 'border-ds-border text-ds-text-dim hover:border-ds-accent hover:text-ds-text-muted'
            }
          `}
        >
          <span className="text-[10px] leading-relaxed">Drop files here<br />or click + to browse</span>
        </div>
      ) : (
        <ul className="space-y-0.5">
          {assets.map((asset) => (
            <li
              key={asset.id}
              className="group flex items-center justify-between px-2 py-1 rounded text-xs text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text"
            >
              <span className="truncate">{asset.name}</span>
              <button
                onClick={() => dispatch(removeAsset(asset.id))}
                className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error ml-1 leading-none transition-opacity"
                aria-label={`Remove ${asset.name}`}
              >
                ×
              </button>
            </li>
          ))}
          <li
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              mt-1 border border-dashed rounded px-2 py-1.5 text-center cursor-pointer transition-colors text-[10px]
              ${dragging
                ? 'border-ds-accent text-ds-text-muted'
                : 'border-ds-border text-ds-text-dim hover:border-ds-accent'
              }
            `}
          >
            Drop to add more
          </li>
        </ul>
      )}
    </div>
  );
};

export default AssetTree;
