import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { RootState } from '../../store';
import { useFilesForProject } from '../../hooks/useFilesForProject';
import { ModalWithInput } from '../Modal';
import { IFile, addFile, removeFile } from '../../features/files/filesSlice';
import { validateFileName, normaliseFileName } from '../../utils/fileNameValidation';
import { selectFile, clearProjectSelection } from '../../features/ui/uiSlice';

type FileTreeProps = {
  projectId: string;
};

const FileTree: React.FC<FileTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch();
  const files = useFilesForProject(projectId);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const selectedFileId: string | undefined = useSelector(
    (state: RootState) => state.ui.selectedFileByProject[projectId]
  );

  const handleFileSelected = (id: string) => {
    dispatch(selectFile({ projectId, fileId: id }));
  };

  // Auto-select first file when none is selected for this project
  useEffect(() => {
    if (!selectedFileId && files.length > 0) {
      dispatch(selectFile({ projectId, fileId: files[0].id }));
    }
  }, [selectedFileId, files, dispatch, projectId]);

  const handleNewFile = (filename: string) => {
    const file: IFile = {
      id: uuidv4(),
      name: normaliseFileName(filename),
      source: '',
      projectId,
    };
    dispatch(addFile(file));
    handleFileSelected(file.id);
  };

  const handleDeleteFile = (id: string) => {
    dispatch(removeFile(id));
    // If we just deleted the selected file, select the next available file
    if (id === selectedFileId) {
      const remaining = files.filter((f) => f.id !== id);
      if (remaining.length > 0) {
        handleFileSelected(remaining[0].id);
      } else {
        dispatch(clearProjectSelection(projectId));
      }
    }
  };

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

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">
          Files
        </span>
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
      <ul
        role="listbox"
        aria-label="Files"
        className="space-y-0.5"
      >
        {files.map((file, index) => (
          <li
            key={file.id}
            ref={(el) => { itemRefs.current[index] = el; }}
            role="option"
            aria-selected={file.id === selectedFileId}
            tabIndex={0}
            onClick={() => handleFileSelected(file.id)}
            onKeyDown={(e) => handleKeyDown(e, index, file.id)}
            className={`
              group flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-ds-accent
              ${file.id === selectedFileId
                ? 'bg-ds-accent-subtle text-ds-text font-semibold'
                : 'text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text'
              }
            `}
          >
            <span className="truncate">{file.name}</span>
            {files.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error ml-1 leading-none transition-opacity"
                aria-label={`Delete ${file.name}`}
                tabIndex={-1}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileTree;
