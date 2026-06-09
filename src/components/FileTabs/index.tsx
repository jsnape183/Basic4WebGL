import React from 'react';
import { IFile } from '../../features/files/filesSlice';

type AssetTabDescriptor = { id: string; name: string };

type FileTabsProps = {
  files: IFile[];
  selectedFileId: string | undefined;
  dirtyFileIds: string[];
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  // optional asset tabs
  assetTabs?: AssetTabDescriptor[];
  selectedAssetTabId?: string | undefined;
  dirtyAssetIds?: string[];
  onSelectAsset?: (id: string) => void;
  onCloseAsset?: (id: string) => void;
};

const FileTabs: React.FC<FileTabsProps> = ({
  files,
  selectedFileId,
  dirtyFileIds,
  onSelect,
  onClose,
  assetTabs = [],
  selectedAssetTabId,
  dirtyAssetIds = [],
  onSelectAsset,
  onCloseAsset,
}) => {
  const canClose = files.length > 1;

  return (
    <div
      role="tablist"
      aria-label="Open files"
      className="flex items-end bg-ds-bg border-b border-ds-border overflow-x-auto flex-shrink-0"
    >
      {files.map((file) => {
        const isActive = file.id === selectedFileId;
        const isDirty = dirtyFileIds.includes(file.id);

        return (
          <div
            key={file.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(file.id)}
            className={`
              group relative flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer
              select-none whitespace-nowrap border-b-2 transition-colors
              ${isActive
                ? 'text-ds-text border-ds-accent bg-ds-surface'
                : 'text-ds-text-muted border-transparent hover:text-ds-text hover:bg-ds-surface-2'
              }
            `}
          >
            {isDirty && (
              <span className="text-ds-accent" aria-label="unsaved changes">●</span>
            )}
            <span>{file.name}</span>
            {canClose && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(file.id); }}
                className="ml-1 text-ds-text-dim hover:text-ds-error opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                aria-label={`Close ${file.name}`}
                tabIndex={-1}
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      {assetTabs.map((asset) => {
        const isActive = asset.id === selectedAssetTabId;
        const isDirty = dirtyAssetIds.includes(asset.id);

        return (
          <div
            key={`asset:${asset.id}`}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectAsset?.(asset.id)}
            className={`
              group relative flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer
              select-none whitespace-nowrap border-b-2 transition-colors
              ${isActive
                ? 'text-ds-text border-ds-accent bg-ds-surface'
                : 'text-ds-text-muted border-transparent hover:text-ds-text hover:bg-ds-surface-2'
              }
            `}
          >
            {isDirty && (
              <span className="text-ds-accent" aria-label="unsaved changes">●</span>
            )}
            <span>{asset.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onCloseAsset?.(asset.id); }}
              className="ml-1 text-ds-text-dim hover:text-ds-error opacity-0 group-hover:opacity-100 transition-opacity leading-none"
              aria-label={`Close ${asset.name}`}
              tabIndex={-1}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default FileTabs;
