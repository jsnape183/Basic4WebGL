import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IFile } from '../../features/files/filesSlice';

type SortableFileItemProps = {
  file: IFile;
  isSelected: boolean;
  showDelete: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  itemRef: (el: HTMLLIElement | null) => void;
};

const SortableFileItem: React.FC<SortableFileItemProps> = ({
  file,
  isSelected,
  showDelete,
  onSelect,
  onDelete,
  onKeyDown,
  itemRef,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={(el) => { setNodeRef(el); itemRef(el); }}
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      style={style}
      onClick={() => onSelect(file.id)}
      onKeyDown={onKeyDown}
      className={`
        group flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-ds-accent
        ${isSelected
          ? 'bg-ds-accent-subtle text-ds-text font-semibold'
          : 'text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text'
        }
      `}
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
      <span className="truncate flex-1">{file.name}</span>
      {showDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
          className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error ml-1 leading-none transition-opacity flex-shrink-0"
          aria-label={`Delete ${file.name}`}
          tabIndex={-1}
        >
          ×
        </button>
      )}
    </li>
  );
};

export default SortableFileItem;
