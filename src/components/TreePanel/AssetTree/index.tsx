// src/components/TreePanel/AssetTree/index.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RootState, AppDispatch } from '../../../store';
import { makeSelectFoldersBySection } from '../../../selectors/folderSelectors';
import { makeSelectAssetsByProject } from '../../../selectors/assetSelectors';
import { IAsset, addAsset, removeAsset, reorderAssets, setAssetFolder } from '../../../features/assets/assetsSlice';
import { IFolder, addFolder } from '../../../features/folders/foldersSlice';
import { renameFolderWithCascade, removeFolderWithCascade } from '../../../features/folders/folderThunks';
import { getFullName } from '../../../selectors/getFullName';
import FolderNode from '../../FileTree/FolderNode';
import ReactDOM from 'react-dom';
import { validateAssetName } from './validateAssetName';

type AssetTreeProps = { projectId: string; onOpenAsset?: (assetId: string) => void };

type SortableAssetItemProps = {
  asset: IAsset;
  depth: number;
  onRemove: (id: string) => void;
  onDoubleClick?: (id: string) => void;
};

const SortableAssetItem: React.FC<SortableAssetItemProps> = ({ asset, depth, onRemove, onDoubleClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: asset.id });

  const style: React.CSSProperties = {
    paddingLeft: depth * 12,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-center justify-between px-2 py-1 rounded text-xs text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text"
      onDoubleClick={() => onDoubleClick?.(asset.id)}
    >
      <button
        {...listeners}
        {...attributes}
        aria-label="Drag to reorder"
        tabIndex={-1}
        className="opacity-0 group-hover:opacity-100 text-ds-text-dim cursor-grab active:cursor-grabbing leading-none transition-opacity flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </button>
      <span className="truncate flex-1">{asset.name}</span>
      <button
        onClick={() => onRemove(asset.id)}
        className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error ml-1 leading-none transition-opacity"
        aria-label={`Remove ${asset.name}`}
      >
        ×
      </button>
    </li>
  );
};

const MAX_BYTES = 4 * 1024 * 1024;

function countAssets(folderId: string, folders: IFolder[], allAssets: IAsset[]): number {
  const direct = allAssets.filter((a) => a.folderId === folderId).length;
  const children = folders.filter((f) => f.parentId === folderId);
  return direct + children.reduce((sum, cf) => sum + countAssets(cf.id, folders, allAssets), 0);
}

const AssetTree: React.FC<AssetTreeProps> = ({ projectId, onOpenAsset }) => {
  const dispatch = useDispatch<AppDispatch>();

  const selectAssets = useMemo(() => makeSelectAssetsByProject(projectId), [projectId]);
  const allAssets = useSelector(selectAssets);

  const inputRef = useRef<HTMLInputElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const deleteInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [creatingFolderParent, setCreatingFolderParent] = useState<string | null | undefined>(undefined);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<IFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<IFolder | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newFileModalOpen, setNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileError, setNewFileError] = useState<string | null>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  const selectFolders = useMemo(() => makeSelectFoldersBySection(projectId, 'assets'), [projectId]);
  const folders: IFolder[] = useSelector(selectFolders);

  const assetOrder = useSelector((state: RootState) => state.assets.assetOrder);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (creatingFolderParent !== undefined) {
      setTimeout(() => newFolderInputRef.current?.focus(), 0);
    }
  }, [creatingFolderParent]);

  useEffect(() => {
    if (deletingFolder) setTimeout(() => deleteInputRef.current?.focus(), 0);
  }, [deletingFolder]);

  useEffect(() => {
    if (!deletingFolder) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDeletingFolder(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [deletingFolder]);

  useEffect(() => {
    if (!renamingFolder) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setRenamingFolder(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [renamingFolder]);

  useEffect(() => {
    if (dragOverFolderId === null) {
      if (autoExpandTimerRef.current) clearTimeout(autoExpandTimerRef.current);
      return;
    }
    autoExpandTimerRef.current = setTimeout(() => {
      setOpenFolders((prev) => ({ ...prev, [dragOverFolderId]: true }));
    }, 500);
    return () => { if (autoExpandTimerRef.current) clearTimeout(autoExpandTimerRef.current); };
  }, [dragOverFolderId]);

  useEffect(() => {
    if (newFileModalOpen) {
      setTimeout(() => newFileInputRef.current?.focus(), 0);
    }
  }, [newFileModalOpen]);

  useEffect(() => {
    if (!newFileModalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNewFileModalOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [newFileModalOpen]);

  const processFiles = async (fileList: FileList, targetFolderId: string | null = null) => {
    for (const f of Array.from(fileList)) {
      if (f.size > MAX_BYTES) { alert(`${f.name} is too large (max 4 MB).`); return; }
    }
    await Promise.all(
      Array.from(fileList).map(
        (file) =>
          new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const assetName = file.name;
              const fullName = getFullName(assetName, targetFolderId, folders);
              dispatch(addAsset({
                id: crypto.randomUUID(),
                name: assetName,
                content: reader.result as string,
                projectId,
                folderId: targetFolderId,
                fullName,
              }));
              resolve();
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    );
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) { setCreatingFolderParent(undefined); return; }
    dispatch(addFolder({ id: uuidv4(), name, projectId, parentId: creatingFolderParent ?? null, section: 'assets' }));
    setNewFolderName('');
    setCreatingFolderParent(undefined);
  };

  const handleCreateNewFile = () => {
    const name = newFileName.trim();
    const error = validateAssetName(name, allAssets, null);
    if (error) { setNewFileError(error); return; }
    const id = crypto.randomUUID();
    dispatch(addAsset({
      id,
      name,
      content: 'data:text/plain;base64,',
      projectId,
      folderId: null,
      fullName: name,
    }));
    onOpenAsset?.(id);
    setNewFileModalOpen(false);
    setNewFileName('');
    setNewFileError(null);
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setDragOverFolderId(null);
    if (!over || active.id === over.id) return;

    const activeAsset = allAssets.find((a) => a.id === active.id);
    if (!activeAsset) return;

    if (String(over.id).startsWith('folder-drop:')) {
      const targetFolderId = String(over.id).replace('folder-drop:', '');
      const newFullName = getFullName(activeAsset.name, targetFolderId, folders);
      dispatch(setAssetFolder({ assetId: activeAsset.id, folderId: targetFolderId, fullName: newFullName }));
      setOpenFolders((prev) => ({ ...prev, [targetFolderId]: true }));
      return;
    }

    const overAsset = allAssets.find((a) => a.id === over.id);
    if (!overAsset || overAsset.folderId !== activeAsset.folderId) return;
    const key = `${projectId}:${activeAsset.folderId ?? 'root'}`;
    // Use assetOrder to derive indices so they match what renderLevel renders
    const orderIds = assetOrder[key];
    const levelAssets = orderIds?.length
      ? (orderIds.map((id) => allAssets.find((a) => a.id === id)).filter(Boolean) as IAsset[])
      : allAssets.filter((a) => (a.folderId ?? null) === (activeAsset.folderId ?? null));
    const fromIndex = levelAssets.findIndex((a) => a.id === active.id);
    const toIndex = levelAssets.findIndex((a) => a.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      dispatch(reorderAssets({ orderKey: key, fromIndex, toIndex }));
    }
  }, [allAssets, assetOrder, folders, dispatch, projectId]);

  const renderLevel = (parentId: string | null, depth: number): React.ReactNode => {
    const levelFolders = folders.filter((f) => f.parentId === parentId);
    const scopedKey = `${projectId}:${parentId ?? 'root'}`;
    const orderIds = assetOrder[scopedKey];
    const levelAssets = orderIds?.length
      ? (orderIds.map((id) => allAssets.find((a) => a.id === id)).filter(Boolean) as IAsset[])
      : allAssets.filter((a) => (a.folderId ?? null) === parentId);
    const assetIds = levelAssets.map((a) => a.id);

    return (
      <>
        {levelFolders.map((folder) => {
          const isOpen = openFolders[folder.id] !== false;
          const count = countAssets(folder.id, folders, allAssets);
          return (
            <div key={folder.id}>
              <FolderNode
                folderId={folder.id}
                name={folder.name}
                isOpen={isOpen}
                itemCount={count}
                depth={depth}
                onToggle={() => setOpenFolders((prev) => ({ ...prev, [folder.id]: !isOpen }))}
                onRename={() => setRenamingFolder(folder)}
                onDelete={() => { setDeletingFolder(folder); setDeleteConfirmName(''); }}
              />
              {isOpen && (
                <div style={{ paddingLeft: (depth + 1) * 4 }}>
                  {renderLevel(folder.id, depth + 1)}
                </div>
              )}
            </div>
          );
        })}

        <SortableContext items={assetIds} strategy={verticalListSortingStrategy}>
          <ul className="space-y-0.5">
            {levelAssets.map((asset) => (
              <SortableAssetItem
                key={asset.id}
                asset={asset}
                depth={depth}
                onRemove={(id) => dispatch(removeAsset(id))}
                onDoubleClick={onOpenAsset}
              />
            ))}
          </ul>
        </SortableContext>

        {creatingFolderParent === parentId && (
          <div style={{ paddingLeft: depth * 12 }} className="flex items-center gap-1 px-2 py-1">
            <span className="text-xs">📁</span>
            <input
              ref={newFolderInputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setCreatingFolderParent(undefined);
              }}
              onBlur={handleCreateFolder}
              placeholder="Folder name"
              className="flex-1 bg-ds-bg border border-ds-border rounded px-2 py-0.5 text-xs text-ds-text focus:outline-none focus:ring-1 focus:ring-ds-accent"
            />
          </div>
        )}
      </>
    );
  };

  // Rename modal
  const renameModal = renamingFolder
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setRenamingFolder(null); }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="at-rename-folder-title" className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 id="at-rename-folder-title" className="text-ds-text text-lg font-semibold mb-4">Rename folder</h2>
            <input
              ref={renameInputRef}
              autoFocus
              defaultValue={renamingFolder.name}
              type="text"
              placeholder="Folder name"
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const name = (e.target as HTMLInputElement).value.trim();
                  if (name && name !== renamingFolder.name) {
                    dispatch(renameFolderWithCascade({ folderId: renamingFolder.id, name }));
                  }
                  setRenamingFolder(null);
                }
                if (e.key === 'Escape') setRenamingFolder(null);
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  const name = renameInputRef.current?.value.trim();
                  if (name && name !== renamingFolder!.name) {
                    dispatch(renameFolderWithCascade({ folderId: renamingFolder!.id, name }));
                  }
                  setRenamingFolder(null);
                }}
                className="bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition"
              >
                Rename
              </button>
              <button onClick={() => setRenamingFolder(null)} className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition">
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  // New file modal
  const newFileModal = newFileModalOpen
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setNewFileModalOpen(false); }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="at-new-file-title" className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 id="at-new-file-title" className="text-ds-text text-lg font-semibold mb-4">New text file</h2>
            <input
              ref={newFileInputRef}
              type="text"
              value={newFileName}
              onChange={(e) => {
                setNewFileName(e.target.value);
                setNewFileError(validateAssetName(e.target.value.trim(), allAssets, null));
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateNewFile(); }}
              placeholder="filename.txt"
              aria-describedby={newFileError ? 'at-new-file-error' : undefined}
              className={`w-full bg-ds-bg border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent ${
                newFileError ? 'border-ds-error mb-1' : 'border-ds-border mb-4'
              }`}
            />
            {newFileError && (
              <p id="at-new-file-error" className="text-ds-error text-xs mb-3">{newFileError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCreateNewFile}
                disabled={!!newFileError || !newFileName.trim()}
                className="bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                onClick={() => setNewFileModalOpen(false)}
                className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  // Delete modal
  const deleteModal = deletingFolder
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingFolder(null); }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="at-delete-folder-title" className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 id="at-delete-folder-title" className="text-ds-text text-lg font-semibold mb-2">Delete folder</h2>
            <p className="text-ds-text-muted text-sm mb-4">
              Items inside will move to the parent level. Type <span className="text-ds-text font-medium">{deletingFolder.name}</span> to confirm.
            </p>
            <input
              ref={deleteInputRef}
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && deleteConfirmName === deletingFolder.name) {
                  dispatch(removeFolderWithCascade({ folderId: deletingFolder.id }));
                  setDeletingFolder(null);
                }
              }}
              placeholder={deletingFolder.name}
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-error mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { dispatch(removeFolderWithCascade({ folderId: deletingFolder.id })); setDeletingFolder(null); }}
                disabled={deleteConfirmName !== deletingFolder.name}
                className="bg-ds-error text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete
              </button>
              <button onClick={() => setDeletingFolder(null)} className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition">
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div>
      {renameModal}
      {deleteModal}
      {newFileModal}

      {/* Section header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">Assets</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCreatingFolderParent(null); setNewFolderName(''); }}
            className="text-ds-text-muted hover:text-ds-text transition text-sm leading-none"
            aria-label="New folder"
            title="New folder"
          >
            📁+
          </button>
          <button
            onClick={() => { setNewFileModalOpen(true); setNewFileName(''); setNewFileError(null); }}
            className="text-ds-text-muted hover:text-ds-text transition text-sm leading-none"
            aria-label="New text file"
            title="New text file"
          >
            📄+
          </button>
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
            onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = ''; }}
          />
        </div>
      </div>

      {allAssets.length === 0 && folders.length === 0 ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`mt-1 border border-dashed rounded px-2 py-3 text-center cursor-pointer transition-colors
            ${dragging ? 'border-ds-accent text-ds-text-muted bg-ds-accent-subtle' : 'border-ds-border text-ds-text-dim hover:border-ds-accent hover:text-ds-text-muted'}`}
        >
          <span className="text-[10px] leading-relaxed">Drop files here<br />or click + to browse</span>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={(event) => {
            const overId = String(event.over?.id ?? '');
            if (overId.startsWith('folder-drop:')) {
              const fId = overId.replace('folder-drop:', '');
              setDragOverFolderId((prev) => (prev === fId ? prev : fId));
            } else {
              setDragOverFolderId(null);
            }
          }}
          onDragEnd={handleDragEnd}
        >
          {renderLevel(null, 0)}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={`mt-1 border border-dashed rounded px-2 py-1.5 text-center cursor-pointer transition-colors text-[10px]
              ${dragging ? 'border-ds-accent text-ds-text-muted' : 'border-ds-border text-ds-text-dim hover:border-ds-accent'}`}
          >
            Drop to add more
          </div>
        </DndContext>
      )}
    </div>
  );
};

export default AssetTree;
