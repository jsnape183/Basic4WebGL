# Tilemap Editor: layer visibility toggling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** While editing a tilemap, show every visible layer composited together — the active layer at full opacity, other visible layers dimmed underneath for reference — plus a per-layer hide/show toggle, with hidden layers rendered not at all and selecting a hidden layer auto-unhiding it.

**Architecture:** `TileMapCanvas`/`MarkerCanvas` gain an optional `interactive` prop (default `true`, so every existing call site and test is unaffected). When `interactive=false`, a layer's grid cells render the same tile art / marker chips but drop `role`/`aria-label`/mouse handlers — this is what lets multiple layers' grids share the DOM simultaneously without colliding on the `Row X, Column Y` labels every existing test queries by (only one grid is ever "interactive" — i.e. labeled — at a time, exactly matching what those tests already assume). `TileMapEditor` (`index.tsx`) replaces its single-canvas render with a stack of absolutely-positioned layer wrappers (one per non-hidden layer, sized from the shared grid dimensions), each dimmed (35% opacity, `pointer-events: none`) unless it's the active layer. `LayersPanel` gets a hide/show toggle button per row.

**Tech Stack:** React (TSX), Vitest + Testing Library (existing conventions in `tests/ui/components/TileMapEditor/`).

**Design doc:** `docs/superpowers/specs/2026-08-12-tilemap-layer-visibility-design.md`

**Note on one implementation detail vs. the design doc:** the design doc's "Rendering approach" section describes dimmed layers as "given a no-op paint handler" on the same interactive component. While writing this plan, reusing the fully-interactive component for dimmed layers turned out to create a real bug: every dimmed layer's cells would carry the *same* `aria-label="Row X, Column Y"` as the active layer's cells, making every existing `screen.getByLabelText('Row 0, Column 1')`-style query in `TileMapEditor.test.tsx` ambiguous (matches N elements instead of 1) the moment more than one layer is on screen — which is now always, by default. The `interactive` prop below fixes this at the root (non-active layers simply don't emit those attributes) without changing any user-facing behavior described in the design doc — the dimmed layers still aren't paintable, exactly as specified, they're now provably so, structurally.

---

### Task 1: `interactive` prop on `TileMapCanvas` and `MarkerCanvas`

**Files:**
- Modify: `src/components/TileMapEditor/Canvas.tsx`
- Modify: `src/components/TileMapEditor/MarkerCanvas.tsx`
- Test: `tests/ui/components/TileMapEditor/Canvas.test.tsx`
- Test: `tests/ui/components/TileMapEditor/MarkerCanvas.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append to `tests/ui/components/TileMapEditor/Canvas.test.tsx`, inside the existing `describe('TileMapCanvas', ...)` block (after the last test, before the closing `});`):

```tsx
  test('interactive=false renders cell content but no aria-label, role, or mouse handlers', () => {
    const onPaintCell = vi.fn();
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={onPaintCell} interactive={false} />);
    expect(screen.queryByLabelText('Row 0, Column 1')).not.toBeInTheDocument();
    expect(screen.queryByRole('gridcell')).not.toBeInTheDocument();
  });

  test('interactive defaults to true when the prop is omitted', () => {
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 1')).toBeInTheDocument();
  });
```

Append to `tests/ui/components/TileMapEditor/MarkerCanvas.test.tsx`, inside the existing `describe('MarkerCanvas', ...)` block:

```tsx
  test('interactive=false renders marker content but no aria-label, role, or mouse handlers', () => {
    const onPaintCell = vi.fn();
    render(<MarkerCanvas rows={2} cols={2} markers={[{ row: 0, col: 1, tag: 'spawn' }]} onPaintCell={onPaintCell} interactive={false} />);
    expect(screen.queryByLabelText('Row 0, Column 1')).not.toBeInTheDocument();
    expect(screen.queryByRole('gridcell')).not.toBeInTheDocument();
  });

  test('interactive defaults to true when the prop is omitted', () => {
    render(<MarkerCanvas rows={2} cols={2} markers={[]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 0')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/Canvas.test.tsx tests/ui/components/TileMapEditor/MarkerCanvas.test.tsx`
Expected: the 4 new tests FAIL (`interactive` prop doesn't exist yet, so cells always render with `aria-label`/`role`/handlers regardless of what's passed — the `not.toBeInTheDocument()` assertions fail because the elements ARE found). The pre-existing tests in both files still PASS.

- [ ] **Step 3: Implement `interactive` on `TileMapCanvas`**

Replace the full content of `src/components/TileMapEditor/Canvas.tsx`:

```tsx
import React from 'react';
import { CELL_SIZE } from './constants';
import { usePaintDrag } from './usePaintDrag';

type Props = {
  layerData: number[][];
  /** slices[i] is the thumbnail for tile id (i + 1) */
  slices: string[];
  onPaintCell: (row: number, col: number) => void;
  /** When false, renders the same tile art with no aria-label/role/mouse handlers — used for dimmed, non-active reference layers so their cells never collide with the active layer's "Row X, Column Y" labels. Defaults to true. */
  interactive?: boolean;
};

const TileMapCanvas: React.FC<Props> = ({ layerData, slices, onPaintCell, interactive = true }) => {
  const { startPaint, continuePaint } = usePaintDrag(onPaintCell);
  const cols = layerData[0]?.length ?? 0;

  return (
    <div
      role="grid"
      aria-label="Tilemap canvas"
      style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)` }}
    >
      {layerData.map((rowData, row) =>
        rowData.map((tileId, col) => (
          <div
            key={`${row}-${col}`}
            role={interactive ? 'gridcell' : undefined}
            aria-label={interactive ? `Row ${row}, Column ${col}` : undefined}
            onMouseDown={interactive ? () => startPaint(row, col) : undefined}
            onMouseEnter={interactive ? () => continuePaint(row, col) : undefined}
            className={`border border-ds-border ${interactive ? 'hover:ring-2 hover:ring-inset hover:ring-ds-accent' : ''}`}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundImage: tileId > 0 && slices[tileId - 1] ? `url(${slices[tileId - 1]})` : undefined,
              backgroundSize: 'cover',
            }}
          />
        ))
      )}
    </div>
  );
};

export default TileMapCanvas;
```

Note this also removes the outer `<div className="h-full overflow-auto p-2">` scroll wrapper — `TileMapEditor` (Task 3) provides one shared scroll container instead, since multiple layers now need to share a single scroll area rather than each owning its own.

- [ ] **Step 4: Implement `interactive` on `MarkerCanvas`**

Replace the full content of `src/components/TileMapEditor/MarkerCanvas.tsx`:

```tsx
import React from 'react';
import { CELL_SIZE } from './constants';
import { usePaintDrag } from './usePaintDrag';
import { tagColor } from './tagColor';
import { MarkerEntry } from './types';

type Props = {
  rows: number;
  cols: number;
  markers: MarkerEntry[];
  onPaintCell: (row: number, col: number) => void;
  /** When false, renders the same marker chips with no aria-label/role/mouse handlers — used for dimmed, non-active reference layers so their cells never collide with the active layer's "Row X, Column Y" labels. Defaults to true. */
  interactive?: boolean;
};

const MarkerCanvas: React.FC<Props> = ({ rows, cols, markers, onPaintCell, interactive = true }) => {
  const { startPaint, continuePaint } = usePaintDrag(onPaintCell);

  const markerAt = (row: number, col: number) => markers.find((m) => m.row === row && m.col === col);

  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const marker = markerAt(row, col);
      cells.push(
        <div
          key={`${row}-${col}`}
          role={interactive ? 'gridcell' : undefined}
          aria-label={interactive ? `Row ${row}, Column ${col}` : undefined}
          title={marker?.tag}
          onMouseDown={interactive ? () => startPaint(row, col) : undefined}
          onMouseEnter={interactive ? () => continuePaint(row, col) : undefined}
          className={`border border-ds-border flex items-center justify-center text-[10px] font-bold text-white ${interactive ? 'hover:ring-2 hover:ring-inset hover:ring-ds-accent' : ''}`}
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: marker ? tagColor(marker.tag) : undefined,
          }}
        >
          {marker ? marker.tag.charAt(0).toUpperCase() : ''}
        </div>
      );
    }
  }

  return (
    <div role="grid" aria-label="Marker canvas" style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)` }}>
      {cells}
    </div>
  );
};

export default MarkerCanvas;
```

Same outer-wrapper removal as `Canvas.tsx`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/Canvas.test.tsx tests/ui/components/TileMapEditor/MarkerCanvas.test.tsx`
Expected: PASS — all pre-existing tests in both files (unaffected, since `interactive` defaults to `true`, preserving prior behavior exactly) plus the 4 new tests.

Also run the full component's other test files, since `TileMapEditor.test.tsx` renders both of these components indirectly and its outer-wrapper removal could theoretically affect layout-dependent assertions (it won't — no test asserts on the wrapper — but confirm):

Run: `npx vitest run tests/ui/components/TileMapEditor/`
Expected: `TileMapEditor.test.tsx` still PASSES unchanged at this point (Task 3 hasn't touched `index.tsx` yet, so it still renders exactly one `TileMapCanvas`/`MarkerCanvas` with `interactive` omitted — defaults to `true`, identical to before).

- [ ] **Step 6: Commit**

```bash
git add src/components/TileMapEditor/Canvas.tsx src/components/TileMapEditor/MarkerCanvas.tsx tests/ui/components/TileMapEditor/Canvas.test.tsx tests/ui/components/TileMapEditor/MarkerCanvas.test.tsx
git commit -m "feat: add interactive prop to TileMapCanvas/MarkerCanvas for layer compositing"
```

---

### Task 2: Hide/show toggle in `LayersPanel`

**Files:**
- Modify: `src/components/TileMapEditor/LayersPanel.tsx`
- Test: `tests/ui/components/TileMapEditor/LayersPanel.test.tsx`

- [ ] **Step 1: Write the failing tests (and update existing render calls)**

Replace the full content of `tests/ui/components/TileMapEditor/LayersPanel.test.tsx`:

```tsx
// tests/ui/components/TileMapEditor/LayersPanel.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import LayersPanel from '../../../../src/components/TileMapEditor/LayersPanel';
import { EditorLayer } from '../../../../src/components/TileMapEditor/types';

// dnd-kit uses ResizeObserver internally — polyfill for jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const makeLayers = (): EditorLayer[] => [
  { key: 'k1', name: 'background', kind: 'tile', data: [[0]] },
  { key: 'k2', name: 'foreground', kind: 'tile', data: [[0]] },
];

const noHidden = new Set<string>();

describe('LayersPanel', () => {
  test('renders a drag handle per layer', () => {
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: 'Drag to reorder' })).toHaveLength(2);
  });

  test('clicking a layer name calls onSelect with its index', async () => {
    const onSelect = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={onSelect} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    await userEvent.click(screen.getByText('foreground'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  test('clicking "Add tile layer" calls onAdd with a unique default name and kind "tile"', async () => {
    const onAdd = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={onAdd} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Add tile layer'));
    expect(onAdd).toHaveBeenCalledWith('layer3', 'tile');
  });

  test('clicking "Add marker layer" calls onAdd with a unique default name and kind "marker"', async () => {
    const onAdd = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={onAdd} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    expect(onAdd).toHaveBeenCalledWith('markers3', 'marker');
  });

  test('a marker layer shows a distinguishing badge in the list', () => {
    const layers: EditorLayer[] = [
      { key: 'k1', name: 'background', kind: 'tile', data: [[0]] },
      { key: 'k2', name: 'spawns', kind: 'marker', markers: [] },
    ];
    render(<LayersPanel layers={layers} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    expect(screen.getByText('tag')).toBeInTheDocument();
  });

  test('clicking remove calls onRemove with the layer index', async () => {
    const onRemove = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={onRemove} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Remove layer foreground'));
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  test('double-click, edit, and Enter renames the layer', async () => {
    const onRename = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={vi.fn()} onRename={onRename} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    await userEvent.dblClick(screen.getByText('background'));
    const input = screen.getByDisplayValue('background');
    await userEvent.clear(input);
    await userEvent.type(input, 'solid{Enter}');
    expect(onRename).toHaveBeenCalledWith(0, 'solid');
  });

  test('renders a visibility toggle per layer, defaulting to "Hide layer" when nothing is hidden', () => {
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Hide layer background' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide layer foreground' })).toBeInTheDocument();
  });

  test('a hidden layer shows a "Show layer" toggle instead', () => {
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={new Set(['k2'])} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Hide layer background' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show layer foreground' })).toBeInTheDocument();
  });

  test('clicking the visibility toggle calls onToggleVisibility with the layer index, not onSelect', async () => {
    const onToggleVisibility = vi.fn();
    const onSelect = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={onSelect} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={onToggleVisibility} />);
    await userEvent.click(screen.getByRole('button', { name: 'Hide layer foreground' }));
    expect(onToggleVisibility).toHaveBeenCalledWith(1);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/LayersPanel.test.tsx`
Expected: the 3 new visibility-toggle tests FAIL (no such button exists yet). The pre-existing tests, now passing `hiddenKeys`/`onToggleVisibility` props the component doesn't yet declare, still PASS (extra props on a React element that the component doesn't destructure are simply ignored at runtime — this is a JS/JSX runtime characteristic, not a type-checked one, since `vitest run` doesn't type-check `.tsx` files, matching this project's established `vite build`-based verification convention).

- [ ] **Step 3: Implement the toggle in `LayersPanel.tsx`**

Replace the full content of `src/components/TileMapEditor/LayersPanel.tsx`:

```tsx
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
      <button
        onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
        aria-label={isHidden ? `Show layer ${layer.name}` : `Hide layer ${layer.name}`}
        className={`leading-none flex-shrink-0 mr-1 ${isHidden ? 'text-ds-text-dim opacity-60' : 'text-ds-text-muted'}`}
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/LayersPanel.test.tsx`
Expected: PASS — all 10 tests (7 pre-existing, 3 new).

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/LayersPanel.tsx tests/ui/components/TileMapEditor/LayersPanel.test.tsx
git commit -m "feat: add per-layer hide/show toggle to LayersPanel"
```

---

### Task 3: Composite layer stack + visibility state in `TileMapEditor`

**Files:**
- Modify: `src/components/TileMapEditor/index.tsx`
- Test: `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add these tests to `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`, inside the existing `describe('TileMapEditor', ...)` block (after the last test currently there, before its closing `});`):

```tsx
  test('a non-active, visible layer renders dimmed and non-interactive alongside the active layer', () => {
    renderEditor();
    // Active layer ("background", index 0 by default) is interactive: its cells are labeled.
    expect(screen.getByLabelText('Row 0, Column 0')).toBeInTheDocument();
    // The non-active "foreground" layer is present (visible) but not labeled/interactive —
    // its wrapper is queryable by the layer-scoped aria-label instead.
    const foregroundWrapper = screen.getByLabelText('Layer foreground');
    expect(foregroundWrapper).toHaveStyle({ opacity: '0.35', pointerEvents: 'none' });
    const activeWrapper = screen.getByLabelText('Layer background');
    expect(activeWrapper).toHaveStyle({ opacity: '1', pointerEvents: 'auto' });
  });

  test('a hidden layer is not rendered at all', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Hide layer foreground' }));
    expect(screen.queryByLabelText('Layer foreground')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Layer background')).toBeInTheDocument();
  });

  test('selecting a hidden layer makes it active and un-hides it', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Hide layer foreground' }));
    expect(screen.queryByLabelText('Layer foreground')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('foreground'));

    const foregroundWrapper = screen.getByLabelText('Layer foreground');
    expect(foregroundWrapper).toHaveStyle({ opacity: '1', pointerEvents: 'auto' });
    expect(screen.getByRole('button', { name: 'Hide layer foreground' })).toBeInTheDocument();
  });

  test('painting still only affects the active layer with multiple layers composited on screen', async () => {
    const { store } = renderEditor();
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.background[0][1]).toBe(1);
    expect(decoded.layers.foreground).toEqual([[0, 0], [0, 0]]);
  });
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx -t "composited|hidden|selecting a hidden|only affects the active layer"`
Expected: the 4 new tests FAIL — `screen.getByLabelText('Layer foreground')` finds nothing (no such wrapper exists yet), and `screen.getByRole('button', { name: 'Hide layer foreground' })` finds nothing (`LayersPanel` isn't wired with `hiddenKeys`/`onToggleVisibility` from `TileMapEditor` yet). The last test (painting still works) should currently PASS already, since only one layer is rendered today — that's fine, it's here as a regression guard for the change about to be made, not a new-behavior test.

- [ ] **Step 3: Implement the composite rendering and visibility state**

In `src/components/TileMapEditor/index.tsx`:

**3a.** Add the `CELL_SIZE` import, alongside the existing imports:

```ts
import { CELL_SIZE } from './constants';
```

(Add this as a new line right after `import { useTilesetSlices } from './useTilesetSlices';`.)

**3b.** Add `hiddenLayerKeys` state, right after the existing `isDirty` state declaration:

```ts
  const [isDirty, setIsDirty] = useState(false);
  const [hiddenLayerKeys, setHiddenLayerKeys] = useState<Set<string>>(() => new Set());
```

**3c.** Reset `hiddenLayerKeys` whenever the asset changes, alongside the existing reset effect. Change:

```ts
  useEffect(() => {
    setDraftDoc(decodeStmContent(asset.content));
    setActiveIndex(0);
    setIsDirty(false);
  }, [asset.id]); // eslint-disable-line react-hooks/exhaustive-deps
```

to:

```ts
  useEffect(() => {
    setDraftDoc(decodeStmContent(asset.content));
    setActiveIndex(0);
    setIsDirty(false);
    setHiddenLayerKeys(new Set());
  }, [asset.id]); // eslint-disable-line react-hooks/exhaustive-deps
```

**3d.** Add a `toggleLayerVisibility` handler and a `handleSelectLayer` wrapper (which auto-unhides), placed right after the existing `handleReorderLayers` function and before `handleSave`:

```ts
  const toggleLayerVisibility = (index: number) => {
    const layer = draftDoc.layers[index];
    if (!layer) return;
    setHiddenLayerKeys((prev) => {
      const next = new Set(prev);
      if (next.has(layer.key)) next.delete(layer.key); else next.add(layer.key);
      return next;
    });
  };

  const handleSelectLayer = (index: number) => {
    setActiveIndex(index);
    const layer = draftDoc.layers[index];
    if (layer) {
      setHiddenLayerKeys((prev) => {
        if (!prev.has(layer.key)) return prev;
        const next = new Set(prev);
        next.delete(layer.key);
        return next;
      });
    }
  };
```

**3e.** Replace the single-canvas render block. Change:

```tsx
        <div className="flex-1 min-h-0">
          {activeLayer?.kind === 'marker' ? (
            <MarkerCanvas rows={gridRows} cols={gridCols} markers={activeLayer.markers} onPaintCell={handlePaintCell} />
          ) : (
            <TileMapCanvas layerData={activeLayer?.kind === 'tile' ? activeLayer.data : []} slices={slices} onPaintCell={handlePaintCell} />
          )}
        </div>
```

to:

```tsx
        <div className="flex-1 min-h-0 overflow-auto p-2">
          <div style={{ position: 'relative', width: gridCols * CELL_SIZE, height: gridRows * CELL_SIZE }}>
            {draftDoc.layers.map((layer, index) => {
              if (hiddenLayerKeys.has(layer.key)) return null;
              const isActive = index === activeIndex;
              return (
                <div
                  key={layer.key}
                  aria-label={`Layer ${layer.name}`}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: isActive ? 1 : 0.35,
                    pointerEvents: isActive ? 'auto' : 'none',
                  }}
                >
                  {layer.kind === 'marker' ? (
                    <MarkerCanvas
                      rows={gridRows}
                      cols={gridCols}
                      markers={layer.markers}
                      onPaintCell={handlePaintCell}
                      interactive={isActive}
                    />
                  ) : (
                    <TileMapCanvas
                      layerData={layer.data}
                      slices={slices}
                      onPaintCell={handlePaintCell}
                      interactive={isActive}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
```

**3f.** Wire the new props into `LayersPanel` and swap in `handleSelectLayer`. Change:

```tsx
        <LayersPanel
          layers={draftDoc.layers}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
          onAdd={handleAddLayer}
          onRename={handleRenameLayer}
          onRemove={handleRemoveLayer}
          onReorder={handleReorderLayers}
        />
```

to:

```tsx
        <LayersPanel
          layers={draftDoc.layers}
          activeIndex={activeIndex}
          hiddenKeys={hiddenLayerKeys}
          onSelect={handleSelectLayer}
          onAdd={handleAddLayer}
          onRename={handleRenameLayer}
          onRemove={handleRemoveLayer}
          onReorder={handleReorderLayers}
          onToggleVisibility={toggleLayerVisibility}
        />
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`
Expected: PASS — every pre-existing test in the file (painting, saving, layer switching, marker layers, the Export test from the previous feature) plus the 4 new ones. This is the critical regression check: every existing `screen.getByLabelText('Row X, Column Y')` call must resolve to exactly one element, meaning exactly one layer is ever `interactive` at a time.

Also run the full `TileMapEditor` test directory to be safe:

Run: `npx vitest run tests/ui/components/TileMapEditor/`
Expected: all files PASS (12 files).

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/index.tsx tests/ui/components/TileMapEditor/TileMapEditor.test.tsx
git commit -m "feat: composite visible layers with dimmed opacity in Tilemap Editor"
```

---

### Task 4: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full Vitest suite**

Run: `npx vitest run`
Expected: all tests pass, no regressions outside the files touched above.

- [ ] **Step 2: Run the production build**

Run: `npx vite build`
Expected: builds cleanly with no TypeScript/build errors.

- [ ] **Step 3: Manually verify in the running app**

Start the dev server (`npm run dev`), open a project with a multi-layer `.stm` asset in the Tilemap Editor (e.g. `demo-bullet-hell-shooter`'s `map1.stm`, which has `floor`, `walls`, `spawns`, `pickups` layers), and confirm:
- With `floor` active, the other layers (`walls`, `spawns`, `pickups`) are visibly dimmed underneath it, not fully hidden.
- Clicking the eye/hide toggle on a layer removes it from view entirely (not just dimmed).
- Clicking it again brings it back, dimmed (since it's not the active layer).
- Hiding a layer, then clicking its name in the Layers panel to make it active, makes it reappear at full opacity and its hide toggle now reads "Hide" again (i.e. it auto-unhid).
- Painting on the active layer only changes that layer — switch to another layer afterward and confirm the previous layer's paint stuck, and the newly active layer is unaffected.
- A marker layer (`spawns`/`pickups`) composites correctly on top of dimmed tile layers — the colored tag chips are visible against the dimmed floor/walls art.

- [ ] **Step 4: Release notes / version bump — not needed yet**

This is an editor-UI feature and will need a `src/docs/release-notes.md` entry and `package.json` patch bump per `CLAUDE.md`'s versioning rule — but only when explicitly asked to push. No action here.
