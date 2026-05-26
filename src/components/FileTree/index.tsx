import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import ReactDOM from 'react-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { RootState } from '../../store';
import { ModalWithInput } from '../Modal';
import { IFile, addFile, removeFile, reorderFiles } from '../../features/files/filesSlice';
import { useAllFilesForProject } from '../../hooks/useAllFilesForProject';
import { validateFileName, normaliseFileName } from '../../utils/fileNameValidation';
import { selectFile, clearProjectSelection } from '../../features/ui/uiSlice';
import { IFolder, addFolder } from '../../features/folders/foldersSlice';
import { renameFolderWithCascade, removeFolderWithCascade } from '../../features/folders/folderThunks';
import SortableFileItem from './SortableFileItem';
import FolderNode from './FolderNode';
import PackagesSection from './PackagesSection';
import AddPackageModal from '../AddPackageModal';

type FileTreeProps = {
  projectId: string;
};

function countFiles(folderId: string, folders: IFolder[], allFiles: IFile[]): number {
  const directFiles = allFiles.filter((f) => f.folderId === folderId).length;
  const childFolders = folders.filter((f) => f.parentId === folderId);
  return directFiles + childFolders.reduce((sum, cf) => sum + countFiles(cf.id, folders, allFiles), 0);
}

const FileTree: React.FC<FileTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch();

  // ALL files for the project (not just root)
  const allFiles = useAllFilesForProject(projectId);

  const folders: IFolder[] = useSelector((state: RootState) =>
    state.folders.items.filter((f) => f.projectId === projectId)
  );

  const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);

  // Folder open/close state
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  // Inline folder creation
  const [creatingFolderParent, setCreatingFolderParent] = useState<string | null | undefined>(undefined);
  const [newFolderName, setNewFolderName] = useState('');
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  // Rename folder modal
  const [renamingFolder, setRenamingFolder] = useState<IFolder | null>(null);

  // Delete folder modal
  const [deletingFolder, setDeletingFolder] = useState<IFolder | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const deleteInputRef = useRef<HTMLInputElement>(null);

  const selectedFileId: string | undefined = useSelector(
    (state: RootState) => state.ui.selectedFileByProject[projectId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Flat array of all file item refs across all levels (for keyboard navigation)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const handleFileSelected = (id: string) => {
    dispatch(selectFile({ projectId, fileId: id }));
  };

  // Auto-select first file when none selected
  useEffect(() => {
    if (!selectedFileId && allFiles.length > 0) {
      dispatch(selectFile({ projectId, fileId: allFiles[0].id }));
    }
  }, [selectedFileId, allFiles, dispatch, projectId]);

  // Auto-focus new folder input when creatingFolderParent changes
  useEffect(() => {
    if (creatingFolderParent !== undefined) {
      newFolderInputRef.current?.focus();
    }
  }, [creatingFolderParent]);

  // Auto-focus delete input when deletingFolder changes
  useEffect(() => {
    if (deletingFolder) {
      deleteInputRef.current?.focus();
    }
  }, [deletingFolder]);

  // Escape key handlers for modals
  useEffect(() => {
    if (!renamingFolder) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setRenamingFolder(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [renamingFolder]);

  useEffect(() => {
    if (!deletingFolder) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDeletingFolder(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [deletingFolder]);

  const handleNewFile = (filename: string) => {
    const name = normaliseFileName(filename);
    const file = {
      id: uuidv4(),
      name,
      source: '',
      projectId,
      folderId: null,
      fullName: name,
    };
    dispatch(addFile(file));
    handleFileSelected(file.id);
  };

  const handleDeleteFile = (id: string) => {
    dispatch(removeFile(id));
    if (id === selectedFileId) {
      const remaining = allFiles.filter((f) => f.id !== id);
      if (remaining.length > 0) {
        handleFileSelected(remaining[0].id);
      } else {
        dispatch(clearProjectSelection(projectId));
      }
    }
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) { setCreatingFolderParent(undefined); return; }
    dispatch(addFolder({
      id: uuidv4(),
      name,
      projectId,
      parentId: creatingFolderParent ?? null,
    }));
    setNewFolderName('');
    setCreatingFolderParent(undefined);
  };

  const handleDragEnd = useCallback((event: DragEndEvent, orderKey: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const filesAtLevel = allFiles.filter((f) => {
      const key = `${projectId}:${f.folderId ?? 'root'}`;
      return key === orderKey;
    });
    const fromIndex = filesAtLevel.findIndex((f) => f.id === active.id);
    const toIndex = filesAtLevel.findIndex((f) => f.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      dispatch(reorderFiles({ orderKey, fromIndex, toIndex }));
    }
  }, [allFiles, dispatch, projectId]);

  // Counter object shared across recursive calls so file items get unique indices
  // for keyboard navigation. Reset before each render pass.
  const fileIndexCounter = useRef({ value: 0 });

  const handleKeyDown = (e: React.KeyboardEvent, index: number, fileId: string) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = itemRefs.current[index + 1];
        if (next) next.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = itemRefs.current[index - 1];
        if (prev) prev.focus();
        break;
      }
      case 'Enter':
        e.preventDefault();
        handleFileSelected(fileId);
        break;
    }
  };

  // Reset counter and refs before each render pass
  fileIndexCounter.current.value = 0;
  itemRefs.current = [];

  const renderLevel = (parentId: string | null, depth: number): React.ReactNode => {
    const levelFolders = folders.filter((f) => f.parentId === parentId);
    const levelFiles = allFiles.filter((f) => (f.folderId ?? null) === parentId);
    const levelOrderKey = `${projectId}:${parentId ?? 'root'}`;
    const fileIds = levelFiles.map((f) => f.id);

    return (
      <>
        {/* Folder nodes at this level */}
        {levelFolders.map((folder) => {
          const isOpen = openFolders[folder.id] !== false; // default open
          const count = countFiles(folder.id, folders, allFiles);
          return (
            <div key={folder.id}>
              <FolderNode
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

        {/* Files at this level — each level gets its own DndContext+SortableContext */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => handleDragEnd(e, levelOrderKey)}
        >
          <SortableContext items={fileIds} strategy={verticalListSortingStrategy}>
            <ul role="listbox" aria-label="Files" className="space-y-0.5">
              {levelFiles.map((file) => {
                const index = fileIndexCounter.current.value++;
                return (
                  <SortableFileItem
                    key={file.id}
                    file={file}
                    isSelected={file.id === selectedFileId}
                    showDelete={allFiles.length > 1}
                    onSelect={handleFileSelected}
                    onDelete={handleDeleteFile}
                    onKeyDown={(e) => handleKeyDown(e, index, file.id)}
                    itemRef={(el) => { itemRefs.current[index] = el; }}
                  />
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>

        {/* Inline folder creation input */}
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

  // Rename folder modal (portal)
  const renameModal = renamingFolder
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setRenamingFolder(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-folder-modal-title"
            className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
          >
            <h2 id="rename-folder-modal-title" className="text-ds-text text-lg font-semibold mb-4">
              Rename folder
            </h2>
            <input
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
                onClick={(e) => {
                  const input = (e.currentTarget.closest('[role="dialog"]') as HTMLElement)?.querySelector('input') as HTMLInputElement;
                  const name = input?.value.trim();
                  if (name && name !== renamingFolder!.name) {
                    dispatch(renameFolderWithCascade({ folderId: renamingFolder!.id, name }));
                  }
                  setRenamingFolder(null);
                }}
                className="bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition"
              >
                Rename
              </button>
              <button
                onClick={() => setRenamingFolder(null)}
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

  // Delete folder modal (portal)
  const deleteModal = deletingFolder
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setDeletingFolder(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-folder-modal-title"
            className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
          >
            <h2 id="delete-folder-modal-title" className="text-ds-text text-lg font-semibold mb-2">
              Delete folder
            </h2>
            <p className="text-ds-text-muted text-sm mb-4">
              Items inside will move to the parent level. Type{' '}
              <span className="text-ds-text font-medium">{deletingFolder.name}</span> to confirm.
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
                onClick={() => {
                  dispatch(removeFolderWithCascade({ folderId: deletingFolder.id }));
                  setDeletingFolder(null);
                }}
                disabled={deleteConfirmName !== deletingFolder.name}
                className="bg-ds-error text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete
              </button>
              <button
                onClick={() => setDeletingFolder(null)}
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

  return (
    <div>
      {renameModal}
      {deleteModal}
      <PackagesSection projectId={projectId} onAddClick={() => setIsAddPackageOpen(true)} />
      <AddPackageModal projectId={projectId} isOpen={isAddPackageOpen} onClose={() => setIsAddPackageOpen(false)} />

      {/* Section header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">Files</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCreatingFolderParent(null); setNewFolderName(''); }}
            className="text-ds-text-muted hover:text-ds-text transition text-sm leading-none"
            aria-label="New folder"
            title="New folder"
          >
            📁+
          </button>
          <ModalWithInput
            onSubmit={handleNewFile}
            openText="+"
            saveText="Save"
            closeText="Close"
            title="New file"
            placeholder="e.g. Main"
            validate={validateFileName}
          />
        </div>
      </div>

      {renderLevel(null, 0)}
    </div>
  );
};

export default FileTree;
