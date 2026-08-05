// src/components/TileMapEditor/LayersPanel.tsx
import React, { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type EditorLayer = { key: string; name: string; data: number[][] };

type Props = {
  layers: EditorLayer[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd: (name: string) => void;
  onRename: (index: number, name: string) => void;
  onRemove: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
};

type ItemProps = {
  layer: EditorLayer;
  isActive: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
};

const SortableLayerItem: React.FC<ItemProps> = ({ layer, isActive, onSelect, onRename, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: layer.key });
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(layer.name);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const commitRename = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== layer.name) onRename(trimmed);
    setRenaming(false);
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer ${
        isActive ? 'bg-ds-accent-subtle text-ds-accent' : 'text-ds-text-muted hover:bg-ds-surface-2 hover:text-ds-text'
      }`}
      onClick={onSelect}
    >
      <button
        {...listeners}
        {...attributes}
        aria-label="Drag to reorder"
        tabIndex={-1}
        className="opacity-0 group-hover:opacity-100 text-ds-text-dim cursor-grab active:cursor-grabbing leading-none transition-opacity flex-shrink-0 mr-1"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </button>
      {renaming ? (
        <input
          autoFocus
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') { setDraftName(layer.name); setRenaming(false); }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-ds-bg border border-ds-border rounded px-1 text-xs text-ds-text focus:outline-none focus:ring-1 focus:ring-ds-accent"
        />
      ) : (
        <span
          className="truncate flex-1"
          onDoubleClick={(e) => { e.stopPropagation(); setDraftName(layer.name); setRenaming(true); }}
        >
          {layer.name}
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="opacity-0 group-hover:opacity-100 text-ds-text-dim hover:text-ds-error ml-1 leading-none transition-opacity"
        aria-label={`Remove layer ${layer.name}`}
      >
        ×
      </button>
    </li>
  );
};

const LayersPanel: React.FC<Props> = ({ layers, activeIndex, onSelect, onAdd, onRename, onRemove, onReorder }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = layers.findIndex((l) => l.key === active.id);
    const toIndex = layers.findIndex((l) => l.key === over.id);
    if (fromIndex !== -1 && toIndex !== -1) onReorder(fromIndex, toIndex);
  };

  const handleAdd = () => {
    let n = 1;
    let name = `layer${layers.length + n}`;
    while (layers.some((l) => l.name === name)) { n += 1; name = `layer${layers.length + n}`; }
    onAdd(name);
  };

  return (
    <div className="flex flex-col h-full p-2 gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">Layers</span>
        <button onClick={handleAdd} aria-label="Add layer" className="text-ds-text-muted hover:text-ds-text transition text-sm leading-none">
          +
        </button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layers.map((l) => l.key)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-0.5">
            {layers.map((layer, index) => (
              <SortableLayerItem
                key={layer.key}
                layer={layer}
                isActive={index === activeIndex}
                onSelect={() => onSelect(index)}
                onRename={(name) => onRename(index, name)}
                onRemove={() => onRemove(index)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default LayersPanel;
