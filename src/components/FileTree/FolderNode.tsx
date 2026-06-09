// src/components/FileTree/FolderNode.tsx
import React from 'react';
import { useDroppable } from '@dnd-kit/core';

type FolderNodeProps = {
  folderId: string;   // used to register droppable
  name: string;
  isOpen: boolean;
  itemCount: number;         // total descendant count — shown in badge when collapsed
  depth: number;             // indentation level (0 = root)
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  /** dnd-kit drag handle props passed through from useSortable */
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  isDragging?: boolean;
  /** Whether this folder row is currently selected as the new-file target */
  isSelected?: boolean;
};

const FolderNode: React.FC<FolderNodeProps> = ({
  folderId,
  name,
  isOpen,
  itemCount,
  depth,
  onToggle,
  onRename,
  onDelete,
  dragHandleProps,
  isDragging,
  isSelected = false,
}) => {
  const indent = depth * 12; // px per level
  const { setNodeRef, isOver } = useDroppable({ id: `folder-drop:${folderId}` });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent bubbling to parent deselect handlers
    onToggle();
  };

  return (
    <div
      ref={setNodeRef}
      style={{ paddingLeft: indent, opacity: isDragging ? 0.5 : 1 }}
      className={`group flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer select-none transition-colors
        ${isOver
          ? 'bg-ds-accent-subtle text-ds-text border border-ds-accent'
          : isSelected
            ? 'bg-ds-accent/15 text-ds-text border border-ds-accent/40'
            : 'text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text'
        }`}
      onClick={handleClick}
    >
      {/* Drag handle */}
      <button
        {...dragHandleProps}
        aria-label="Drag folder"
        tabIndex={-1}
        className="opacity-0 group-hover:opacity-100 text-ds-text-dim cursor-grab active:cursor-grabbing leading-none transition-opacity flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </button>

      {/* Chevron */}
      <span className="text-ds-text-dim text-[9px] w-2 flex-shrink-0">
        {isOpen ? '▼' : '▶'}
      </span>

      {/* Folder icon */}
      <span className="flex-shrink-0">📁</span>

      {/* Name */}
      <span className="truncate flex-1 font-medium">{name}</span>

      {/* Collapsed item-count badge */}
      {!isOpen && itemCount > 0 && (
        <span className="text-[9px] text-ds-text-dim bg-ds-surface rounded px-1">
          {itemCount}
        </span>
      )}

      {/* Hover actions */}
      <button
        onClick={(e) => { e.stopPropagation(); onRename(); }}
        className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-text transition-opacity flex-shrink-0 p-0.5"
        aria-label={`Rename folder ${name}`}
        title="Rename"
        tabIndex={-1}
      >
        ✏️
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error transition-opacity flex-shrink-0"
        aria-label={`Delete folder ${name}`}
        title="Delete"
        tabIndex={-1}
      >
        🗑
      </button>
    </div>
  );
};

export default FolderNode;
