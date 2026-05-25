import React, { useEffect, useRef, useState } from 'react';
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
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { RootState } from '../../store';
import { useFilesForProject } from '../../hooks/useFilesForProject';
import { ModalWithInput } from '../Modal';
import { addFile, removeFile, reorderFiles } from '../../features/files/filesSlice';
import { validateFileName, normaliseFileName } from '../../utils/fileNameValidation';
import { selectFile, clearProjectSelection } from '../../features/ui/uiSlice';
import SortableFileItem from './SortableFileItem';
import PackagesSection from './PackagesSection';
import AddPackageModal from '../AddPackageModal';

type FileTreeProps = {
  projectId: string;
};

const FileTree: React.FC<FileTreeProps> = ({ projectId }) => {
  const dispatch = useDispatch();
  const files = useFilesForProject(projectId);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);

  const selectedFileId: string | undefined = useSelector(
    (state: RootState) => state.ui.selectedFileByProject[projectId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleFileSelected = (id: string) => {
    dispatch(selectFile({ projectId, fileId: id }));
  };

  useEffect(() => {
    if (!selectedFileId && files.length > 0) {
      dispatch(selectFile({ projectId, fileId: files[0].id }));
    }
  }, [selectedFileId, files, dispatch, projectId]);

  const handleNewFile = (filename: string) => {
    const file = {
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
    if (id === selectedFileId) {
      const remaining = files.filter((f) => f.id !== id);
      if (remaining.length > 0) {
        handleFileSelected(remaining[0].id);
      } else {
        dispatch(clearProjectSelection(projectId));
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = files.findIndex((f) => f.id === active.id);
    const toIndex = files.findIndex((f) => f.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      dispatch(reorderFiles({ projectId, fromIndex, toIndex }));
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

  const fileIds = files.map((f) => f.id);

  return (
    <div>
      <PackagesSection
        projectId={projectId}
        onAddClick={() => setIsAddPackageOpen(true)}
      />
      <AddPackageModal
        projectId={projectId}
        isOpen={isAddPackageOpen}
        onClose={() => setIsAddPackageOpen(false)}
      />
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={fileIds} strategy={verticalListSortingStrategy}>
          <ul
            role="listbox"
            aria-label="Files"
            className="space-y-0.5"
          >
            {files.map((file, index) => (
              <SortableFileItem
                key={file.id}
                file={file}
                isSelected={file.id === selectedFileId}
                showDelete={files.length > 1}
                onSelect={handleFileSelected}
                onDelete={handleDeleteFile}
                onKeyDown={(e) => handleKeyDown(e, index, file.id)}
                itemRef={(el) => { itemRefs.current[index] = el; }}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default FileTree;
