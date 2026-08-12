// src/components/TileMapEditor/LayersPanel.tsx
import React, { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EditorLayer } from './types';

type Props = {
  layers: EditorLayer[];
  activeIndex: number;
  hiddenKeys: Set<string>;
  onSelect: (index: number) => void;
  onAdd: (name: string, kind: 'tile' | 'marker') => void;
  onRename: (index: number, name: string) => void;
  onRemove: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggleVisibility: (index: number) => void;
};

type ItemProps = {
  layer: EditorLayer;
  isActive: boolean;
  isHidden: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
  onToggleVisibility: () => void;
};

const SortableLayerItem: React.FC<ItemProps> = ({ layer, isActive, isHidden, onSelect, onRename, onRemove, onToggleVisibility }) => {
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
      {/* Always visible (unlike drag/remove below) -- hidden-state is something
          you want to scan at a glance across the whole layer list, not something
          you only discover by hovering one row at a time. */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
        aria-label={isHidden ? `Show layer ${layer.name}` : `Hide layer ${layer.name}`}
        className={`leading-none flex-shrink-0 mr-1 ${isHidden ? 'opacity-60' : ''}`}
      >
        {isHidden ? '🚫' : '👁'}
      </button>
      {layer.kind === 'marker' && (
        <span className="text-[9px] px-1 rounded bg-ds-surface-2 text-ds-text-dim uppercase tracking-wide mr-1 flex-shrink-0">
          tag
        </span>
      )}
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

const LayersPanel: React.FC<Props> = ({ layers, activeIndex, hiddenKeys, onSelect, onAdd, onRename, onRemove, onReorder, onToggleVisibility }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = layers.findIndex((l) => l.key === active.id);
    const toIndex = layers.findIndex((l) => l.key === over.id);
    if (fromIndex !== -1 && toIndex !== -1) onReorder(fromIndex, toIndex);
  };

  const handleAdd = (kind: 'tile' | 'marker') => {
    const prefix = kind === 'tile' ? 'layer' : 'markers';
    let n = 1;
    let name = `${prefix}${layers.length + n}`;
    while (layers.some((l) => l.name === name)) { n += 1; name = `${prefix}${layers.length + n}`; }
    onAdd(name, kind);
  };

  return (
    <div className="flex flex-col h-full p-2 gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ds-text-dim">Layers</span>
        <div className="flex gap-1">
          <button
            onClick={() => handleAdd('tile')}
            aria-label="Add tile layer"
            className="text-ds-text-muted hover:text-ds-text transition text-sm leading-none px-1"
          >
            +
          </button>
          <button
            onClick={() => handleAdd('marker')}
            aria-label="Add marker layer"
            className="text-ds-text-muted hover:text-ds-text transition text-[10px] leading-none px-1 border border-ds-border rounded"
          >
            +tag
          </button>
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layers.map((l) => l.key)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-0.5">
            {layers.map((layer, index) => (
              <SortableLayerItem
                key={layer.key}
                layer={layer}
                isActive={index === activeIndex}
                isHidden={hiddenKeys.has(layer.key)}
                onSelect={() => onSelect(index)}
                onRename={(name) => onRename(index, name)}
                onRemove={() => onRemove(index)}
                onToggleVisibility={() => onToggleVisibility(index)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default LayersPanel;
