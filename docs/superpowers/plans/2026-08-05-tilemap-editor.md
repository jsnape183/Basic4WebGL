# Visual Tilemap Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the visual `.stm` tilemap editor UI: a tileset palette, a paintable per-layer grid canvas, a reorderable layers panel, a "New Tilemap" creation flow, and the entry points (asset-click + sidebar) to reach it.

**Architecture:** A new `src/components/TileMapEditor/` component tree, wired into the existing `AssetPreview` dispatcher exactly like `ImagePreview`/`TextEditor` already are — no changes to tab management, dirty tracking, or persistence mechanisms, since those are already asset-id-based and type-agnostic. Bottom-up build order: leaf components first (`useTilesetSlices`, `Palette`, `Canvas`, `LayersPanel`), then the owner component (`TileMapEditor/index.tsx`) that composes them and wires save/load, then the creation flow (`NewTilemapDialog`, `TilemapChooserModal`), then the sidebar entry point.

**Tech Stack:** React + TypeScript, Redux Toolkit, `@dnd-kit` (already used elsewhere in this repo for reorder), Vitest + React Testing Library.

---

### Task 1: `useTilesetSlices` hook — slices a tileset image into per-tile data URLs

**Files:**
- Create: `src/components/TileMapEditor/useTilesetSlices.ts`
- Test: `tests/ui/components/TileMapEditor/useTilesetSlices.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/ui/components/TileMapEditor/useTilesetSlices.test.ts
// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useTilesetSlices } from '../../../../src/components/TileMapEditor/useTilesetSlices';

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 32;
  height = 16;
  set src(_v: string) {
    setTimeout(() => this.onload?.(), 0);
  }
}

beforeEach(() => {
  vi.stubGlobal('Image', MockImage as unknown as typeof Image);
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    drawImage: vi.fn(),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  let callCount = 0;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => `data:tile-${callCount++}`);
});

describe('useTilesetSlices', () => {
  test('slices a 32x16 image into 4x2 tiles of 8x8', async () => {
    const { result } = renderHook(() => useTilesetSlices('data:image/png;base64,xxx', 8, 8));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cols).toBe(4);
    expect(result.current.rows).toBe(2);
    expect(result.current.slices).toHaveLength(8);
  });

  test('returns empty state when imageContent is undefined', () => {
    const { result } = renderHook(() => useTilesetSlices(undefined, 8, 8));
    expect(result.current.slices).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });

  test('returns empty state when tileWidth or tileHeight is zero', () => {
    const { result } = renderHook(() => useTilesetSlices('data:image/png;base64,xxx', 0, 8));
    expect(result.current.slices).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/useTilesetSlices.test.ts`
Expected: FAIL — `src/components/TileMapEditor/useTilesetSlices.ts` does not exist yet.

- [ ] **Step 3: Write the hook**

```typescript
// src/components/TileMapEditor/useTilesetSlices.ts
import { useEffect, useState } from 'react';

export type TilesetSlices = {
  /** Data URLs, one per tile, row-major order. slices[i] corresponds to tile id (i + 1). */
  slices: string[];
  cols: number;
  rows: number;
  loading: boolean;
};

export function useTilesetSlices(
  imageContent: string | undefined,
  tileWidth: number,
  tileHeight: number
): TilesetSlices {
  const [state, setState] = useState<TilesetSlices>({ slices: [], cols: 0, rows: 0, loading: true });

  useEffect(() => {
    if (!imageContent || tileWidth <= 0 || tileHeight <= 0) {
      setState({ slices: [], cols: 0, rows: 0, loading: false });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const cols = Math.floor(img.width / tileWidth);
      const rows = Math.floor(img.height / tileHeight);
      const canvas = document.createElement('canvas');
      canvas.width = tileWidth;
      canvas.height = tileHeight;
      const ctx = canvas.getContext('2d');
      const slices: string[] = [];
      if (ctx) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.clearRect(0, 0, tileWidth, tileHeight);
            ctx.drawImage(
              img,
              c * tileWidth, r * tileHeight, tileWidth, tileHeight,
              0, 0, tileWidth, tileHeight
            );
            slices.push(canvas.toDataURL());
          }
        }
      }
      setState({ slices, cols, rows, loading: false });
    };
    img.onerror = () => {
      if (!cancelled) setState({ slices: [], cols: 0, rows: 0, loading: false });
    };
    img.src = imageContent;

    return () => { cancelled = true; };
  }, [imageContent, tileWidth, tileHeight]);

  return state;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/useTilesetSlices.test.ts`
Expected: PASS (all 3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/useTilesetSlices.ts tests/ui/components/TileMapEditor/useTilesetSlices.test.ts
git commit -m "feat: add useTilesetSlices hook (slices a tileset image into per-tile data URLs)"
```

---

### Task 2: `Palette` component

**Files:**
- Create: `src/components/TileMapEditor/constants.ts`
- Create: `src/components/TileMapEditor/Palette.tsx`
- Test: `tests/ui/components/TileMapEditor/Palette.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/ui/components/TileMapEditor/Palette.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import Palette from '../../../../src/components/TileMapEditor/Palette';

describe('Palette', () => {
  test('renders one thumbnail button per slice, labeled by 1-based tile id', () => {
    render(<Palette slices={['data:a', 'data:b', 'data:c']} selectedTile={1} onSelectTile={vi.fn()} />);
    expect(screen.getByLabelText('Tile 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Tile 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Tile 3')).toBeInTheDocument();
  });

  test('clicking a tile calls onSelectTile with its 1-based id', async () => {
    const onSelectTile = vi.fn();
    render(<Palette slices={['data:a', 'data:b']} selectedTile={1} onSelectTile={onSelectTile} />);
    await userEvent.click(screen.getByLabelText('Tile 2'));
    expect(onSelectTile).toHaveBeenCalledWith(2);
  });

  test('the selected tile has aria-pressed=true', () => {
    render(<Palette slices={['data:a', 'data:b']} selectedTile={2} onSelectTile={vi.fn()} />);
    expect(screen.getByLabelText('Tile 2')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Tile 1')).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking Eraser calls onSelectTile(null), and it is pressed when selectedTile is null', async () => {
    const onSelectTile = vi.fn();
    render(<Palette slices={['data:a']} selectedTile={null} onSelectTile={onSelectTile} />);
    expect(screen.getByLabelText('Eraser')).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByLabelText('Eraser'));
    expect(onSelectTile).toHaveBeenCalledWith(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/Palette.test.tsx`
Expected: FAIL — `src/components/TileMapEditor/Palette.tsx` does not exist yet.

- [ ] **Step 3: Write `constants.ts` and `Palette.tsx`**

```typescript
// src/components/TileMapEditor/constants.ts
/** Fixed on-screen size (px) for every palette thumbnail and canvas cell, regardless of the tileset's native tile size — actual tile dimensions like 8x8 are too small to click precisely. */
export const CELL_SIZE = 32;
```

```tsx
// src/components/TileMapEditor/Palette.tsx
import React from 'react';
import { CELL_SIZE } from './constants';

type Props = {
  slices: string[];
  /** 1-based tile id, or null when the Eraser is active */
  selectedTile: number | null;
  onSelectTile: (tileId: number | null) => void;
};

const Palette: React.FC<Props> = ({ slices, selectedTile, onSelectTile }) => {
  return (
    <div className="flex flex-col h-full p-2 gap-2 overflow-y-auto">
      <button
        type="button"
        onClick={() => onSelectTile(null)}
        aria-label="Eraser"
        aria-pressed={selectedTile === null}
        className={`text-xs px-2 py-1 rounded border ${
          selectedTile === null
            ? 'border-ds-accent text-ds-accent bg-ds-accent-subtle'
            : 'border-ds-border text-ds-text-muted hover:text-ds-text'
        }`}
      >
        Eraser
      </button>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(auto-fill, ${CELL_SIZE}px)` }}>
        {slices.map((src, index) => {
          const tileId = index + 1;
          return (
            <button
              key={tileId}
              type="button"
              onClick={() => onSelectTile(tileId)}
              aria-label={`Tile ${tileId}`}
              aria-pressed={selectedTile === tileId}
              style={{ width: CELL_SIZE, height: CELL_SIZE }}
              className={`border ${
                selectedTile === tileId ? 'border-ds-accent' : 'border-ds-border hover:border-ds-text-muted'
              }`}
            >
              <img src={src} alt="" style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Palette;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/Palette.test.tsx`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/constants.ts src/components/TileMapEditor/Palette.tsx tests/ui/components/TileMapEditor/Palette.test.tsx
git commit -m "feat: add tilemap editor Palette component"
```

---

### Task 3: `Canvas` component — paintable grid for the active layer

**Files:**
- Create: `src/components/TileMapEditor/Canvas.tsx`
- Test: `tests/ui/components/TileMapEditor/Canvas.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/ui/components/TileMapEditor/Canvas.test.tsx
// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import TileMapCanvas from '../../../../src/components/TileMapEditor/Canvas';

describe('TileMapCanvas', () => {
  test('mouse down paints a single cell', () => {
    const onPaintCell = vi.fn();
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={onPaintCell} />);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).toHaveBeenCalledWith(0, 1);
    expect(onPaintCell).toHaveBeenCalledTimes(1);
  });

  test('drag (mouse down then enter another cell) paints both cells', () => {
    const onPaintCell = vi.fn();
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={onPaintCell} />);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    fireEvent.mouseEnter(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).toHaveBeenCalledWith(0, 0);
    expect(onPaintCell).toHaveBeenCalledWith(0, 1);
    expect(onPaintCell).toHaveBeenCalledTimes(2);
  });

  test('mouse enter without a prior mouse down does not paint', () => {
    const onPaintCell = vi.fn();
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={onPaintCell} />);
    fireEvent.mouseEnter(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).not.toHaveBeenCalled();
  });

  test('mouseup on window stops painting', () => {
    const onPaintCell = vi.fn();
    render(<TileMapCanvas layerData={[[0, 0], [0, 0]]} slices={[]} onPaintCell={onPaintCell} />);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    fireEvent.mouseUp(window);
    fireEvent.mouseEnter(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/Canvas.test.tsx`
Expected: FAIL — `src/components/TileMapEditor/Canvas.tsx` does not exist yet.

- [ ] **Step 3: Write `Canvas.tsx`**

```tsx
// src/components/TileMapEditor/Canvas.tsx
import React, { useEffect, useState } from 'react';
import { CELL_SIZE } from './constants';

type Props = {
  layerData: number[][];
  /** slices[i] is the thumbnail for tile id (i + 1) */
  slices: string[];
  onPaintCell: (row: number, col: number) => void;
};

const TileMapCanvas: React.FC<Props> = ({ layerData, slices, onPaintCell }) => {
  const [isPainting, setIsPainting] = useState(false);

  useEffect(() => {
    const stop = () => setIsPainting(false);
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  const cols = layerData[0]?.length ?? 0;

  return (
    <div className="h-full overflow-auto p-2">
      <div
        role="grid"
        aria-label="Tilemap canvas"
        style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)` }}
      >
        {layerData.map((rowData, row) =>
          rowData.map((tileId, col) => (
            <div
              key={`${row}-${col}`}
              role="gridcell"
              aria-label={`Row ${row}, Column ${col}`}
              onMouseDown={() => { setIsPainting(true); onPaintCell(row, col); }}
              onMouseEnter={() => { if (isPainting) onPaintCell(row, col); }}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                border: '1px solid var(--ds-border)',
                backgroundImage: tileId > 0 && slices[tileId - 1] ? `url(${slices[tileId - 1]})` : undefined,
                backgroundSize: 'cover',
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TileMapCanvas;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/Canvas.test.tsx`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/Canvas.tsx tests/ui/components/TileMapEditor/Canvas.test.tsx
git commit -m "feat: add tilemap editor Canvas component (click/drag paint)"
```

---

### Task 4: `LayersPanel` component — list, select, add, rename, remove, reorder

**Files:**
- Create: `src/components/TileMapEditor/LayersPanel.tsx`
- Test: `tests/ui/components/TileMapEditor/LayersPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/ui/components/TileMapEditor/LayersPanel.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import LayersPanel, { EditorLayer } from '../../../../src/components/TileMapEditor/LayersPanel';

// dnd-kit uses ResizeObserver internally — polyfill for jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const makeLayers = (): EditorLayer[] => [
  { key: 'k1', name: 'background', data: [[0]] },
  { key: 'k2', name: 'foreground', data: [[0]] },
];

describe('LayersPanel', () => {
  test('renders a drag handle per layer', () => {
    render(<LayersPanel layers={makeLayers()} activeIndex={0} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: 'Drag to reorder' })).toHaveLength(2);
  });

  test('clicking a layer name calls onSelect with its index', async () => {
    const onSelect = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} onSelect={onSelect} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} />);
    await userEvent.click(screen.getByText('foreground'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  test('clicking + calls onAdd with a unique default name', async () => {
    const onAdd = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} onSelect={vi.fn()} onAdd={onAdd} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Add layer'));
    expect(onAdd).toHaveBeenCalledWith('layer3');
  });

  test('clicking remove calls onRemove with the layer index', async () => {
    const onRemove = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={onRemove} onReorder={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Remove layer foreground'));
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  test('double-click, edit, and Enter renames the layer', async () => {
    const onRename = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} onSelect={vi.fn()} onAdd={vi.fn()} onRename={onRename} onRemove={vi.fn()} onReorder={vi.fn()} />);
    await userEvent.dblClick(screen.getByText('background'));
    const input = screen.getByDisplayValue('background');
    await userEvent.clear(input);
    await userEvent.type(input, 'solid{Enter}');
    expect(onRename).toHaveBeenCalledWith(0, 'solid');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/LayersPanel.test.tsx`
Expected: FAIL — `src/components/TileMapEditor/LayersPanel.tsx` does not exist yet.

- [ ] **Step 3: Write `LayersPanel.tsx`**

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/LayersPanel.test.tsx`
Expected: PASS (all 5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/LayersPanel.tsx tests/ui/components/TileMapEditor/LayersPanel.test.tsx
git commit -m "feat: add tilemap editor LayersPanel component (select/add/rename/remove/reorder)"
```

---

### Task 5: `TileMapEditor` owner component + wiring into `AssetPreview`

**Files:**
- Create: `src/components/TileMapEditor/index.tsx`
- Modify: `src/components/AssetPreview/getAssetType.ts`
- Modify: `src/components/AssetPreview/index.tsx`
- Test: `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`
- Test: `tests/ui/components/AssetPreview/getAssetType.test.ts`
- Test: `tests/ui/components/AssetPreview/AssetPreview.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add to `tests/ui/components/AssetPreview/getAssetType.test.ts` (append inside the existing `describe` block, after the audio tests):

```typescript
  test.each(['.stm'])(
    'extension %s → tilemap',
    (ext) => expect(getAssetType(`level1${ext}`)).toBe('tilemap')
  );

  test('uppercase tilemap extension → tilemap', () => {
    expect(getAssetType('level1.STM')).toBe('tilemap');
  });
```

Add to `tests/ui/components/AssetPreview/AssetPreview.test.tsx` (a new fixture + test, inside the existing `describe` block):

```typescript
// Add alongside the existing imageAsset/textAsset fixtures:
const tilemapAsset: IAsset = {
  id: 'a3', name: 'level1.stm',
  content: 'data:application/json;base64,' + btoa(JSON.stringify({ tileWidth: 8, tileHeight: 8, tileImage: '', layers: {} })),
  projectId: 'p1', folderId: null, fullName: 'level1.stm',
};

// Add inside describe('AssetPreview', ...):
  test('renders TileMapEditor for .stm assets', () => {
    render(
      <Provider store={makeStore()}>
        <AssetPreview asset={tilemapAsset} onDirtyChange={vi.fn()} />
      </Provider>
    );
    expect(screen.getByLabelText('Tilemap canvas')).toBeInTheDocument();
  });
```

Create `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`:

```tsx
// tests/ui/components/TileMapEditor/TileMapEditor.test.tsx
// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import assetsReducer, { addAsset, IAsset } from '../../../../src/features/assets/assetsSlice';
import TileMapEditor from '../../../../src/components/TileMapEditor';

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

class MockImage {
  onload: (() => void) | null = null;
  width = 16;
  height = 16;
  set src(_v: string) { setTimeout(() => this.onload?.(), 0); }
}

beforeEach(() => {
  vi.stubGlobal('Image', MockImage as unknown as typeof Image);
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ clearRect: vi.fn(), drawImage: vi.fn() })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:tile');
});

const makeStmAsset = (): IAsset => {
  const doc = {
    tileWidth: 8, tileHeight: 8, tileImage: 'tileset.png',
    layers: { background: [[1, 1], [1, 1]], foreground: [[0, 0], [0, 0]] },
  };
  const json = JSON.stringify(doc);
  return {
    id: 'm1', name: 'level1.stm',
    content: 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(json))),
    projectId: 'p1', folderId: null, fullName: 'level1.stm',
  };
};

const makeTilesetAsset = (): IAsset => ({
  id: 't1', name: 'tileset.png', content: 'data:image/png;base64,xxx',
  projectId: 'p1', folderId: null, fullName: 'tileset.png',
});

const decodeContent = (content: string) =>
  JSON.parse(decodeURIComponent(escape(atob(content.split(',')[1]))));

function renderEditor(asset = makeStmAsset(), onDirtyChange = vi.fn()) {
  const store = configureStore({ reducer: { assets: assetsReducer } });
  store.dispatch(addAsset(makeTilesetAsset()));
  store.dispatch(addAsset(asset));
  render(
    <Provider store={store}>
      <TileMapEditor asset={asset} onDirtyChange={onDirtyChange} />
    </Provider>
  );
  return { store };
}

describe('TileMapEditor', () => {
  test('renders layer list from the decoded .stm file', () => {
    renderEditor();
    expect(screen.getByText('background')).toBeInTheDocument();
    expect(screen.getByText('foreground')).toBeInTheDocument();
  });

  test('painting a cell on the active layer marks the tab dirty', () => {
    const onDirtyChange = vi.fn();
    renderEditor(makeStmAsset(), onDirtyChange);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    expect(onDirtyChange).toHaveBeenCalledWith('m1', true);
  });

  test('painting only affects the active layer, others are unchanged on save', async () => {
    const { store } = renderEditor();
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.background).toEqual([[1, 1], [1, 1]]);
  });

  test('clicking Save writes the painted tile to the correct cell', async () => {
    const { store } = renderEditor();
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.background[0][1]).toBe(1);
  });

  test('switching active layer routes subsequent paints there', async () => {
    const { store } = renderEditor();
    await userEvent.click(screen.getByText('foreground'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.foreground[0][0]).toBe(1);
    expect(decoded.layers.background[0][0]).toBe(1);
  });

  test('calls onDirtyChange(id, false) after saving', async () => {
    const onDirtyChange = vi.fn();
    renderEditor(makeStmAsset(), onDirtyChange);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    onDirtyChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onDirtyChange).toHaveBeenLastCalledWith('m1', false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx tests/ui/components/AssetPreview/getAssetType.test.ts tests/ui/components/AssetPreview/AssetPreview.test.tsx`
Expected: FAIL — `src/components/TileMapEditor/index.tsx` doesn't exist, and `getAssetType`/`AssetPreview` don't recognize `.stm` yet.

- [ ] **Step 3: Update `getAssetType.ts`**

```typescript
// src/components/AssetPreview/getAssetType.ts
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']);
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg']);
const TILEMAP_EXTENSIONS = new Set(['.stm']);

export function getAssetType(name: string): 'image' | 'audio' | 'tilemap' | 'text' {
  const dot = name.lastIndexOf('.');
  if (dot === -1) return 'text';
  const ext = name.slice(dot).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio';
  if (TILEMAP_EXTENSIONS.has(ext)) return 'tilemap';
  return 'text';
}
```

- [ ] **Step 4: Write `TileMapEditor/index.tsx`**

```tsx
// src/components/TileMapEditor/index.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IAsset, updateAsset } from '../../features/assets/assetsSlice';
import { AppDispatch, RootState } from '../../store';
import { useTilesetSlices } from './useTilesetSlices';
import Palette from './Palette';
import TileMapCanvas from './Canvas';
import LayersPanel, { EditorLayer } from './LayersPanel';

type Props = {
  asset: IAsset;
  onDirtyChange?: (assetId: string, dirty: boolean) => void;
};

type StmDoc = {
  tileWidth: number;
  tileHeight: number;
  tileImage: string;
  layers: EditorLayer[];
};

function decodeStmContent(content: string): StmDoc {
  const comma = content.indexOf(',');
  const raw = comma === -1 ? '{}' : decodeURIComponent(escape(atob(content.slice(comma + 1))));
  let parsed: { tileWidth?: number; tileHeight?: number; tileImage?: string; layers?: Record<string, number[][]> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }
  const layerEntries = Object.entries(parsed.layers ?? {});
  return {
    tileWidth: parsed.tileWidth ?? 16,
    tileHeight: parsed.tileHeight ?? 16,
    tileImage: parsed.tileImage ?? '',
    layers: layerEntries.map(([name, data]) => ({ key: crypto.randomUUID(), name, data })),
  };
}

function encodeStmContent(doc: StmDoc, originalContent: string): string {
  const mime = originalContent.startsWith('data:')
    ? originalContent.slice(5, originalContent.indexOf(';'))
    : 'application/json';
  const layers: Record<string, number[][]> = {};
  doc.layers.forEach((l) => { layers[l.name] = l.data; });
  const json = JSON.stringify({
    tileWidth: doc.tileWidth,
    tileHeight: doc.tileHeight,
    tileImage: doc.tileImage,
    layers,
  });
  return `data:${mime};base64,` + btoa(unescape(encodeURIComponent(json)));
}

const layersEqual = (a: EditorLayer[], b: EditorLayer[]) =>
  JSON.stringify(a.map(({ name, data }) => ({ name, data }))) ===
  JSON.stringify(b.map(({ name, data }) => ({ name, data })));

const TileMapEditor: React.FC<Props> = ({ asset, onDirtyChange }) => {
  const dispatch = useDispatch<AppDispatch>();

  const storedDoc = useMemo(() => decodeStmContent(asset.content), [asset.content]);
  const [draftDoc, setDraftDoc] = useState<StmDoc>(() => decodeStmContent(asset.content));
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTile, setSelectedTile] = useState<number | null>(1);

  useEffect(() => {
    setDraftDoc(decodeStmContent(asset.content));
    setActiveIndex(0);
  }, [asset.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const tilesetAsset = useSelector((state: RootState) =>
    Object.values(state.assets.byId).find(
      (a) => a.projectId === asset.projectId && a.name === draftDoc.tileImage
    )
  );

  const { slices } = useTilesetSlices(tilesetAsset?.content, draftDoc.tileWidth, draftDoc.tileHeight);

  const isDirty =
    !layersEqual(draftDoc.layers, storedDoc.layers) ||
    draftDoc.tileWidth !== storedDoc.tileWidth ||
    draftDoc.tileHeight !== storedDoc.tileHeight ||
    draftDoc.tileImage !== storedDoc.tileImage;

  useEffect(() => {
    onDirtyChange?.(asset.id, isDirty);
  }, [isDirty, asset.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeLayer = draftDoc.layers[activeIndex];

  const handlePaintCell = (row: number, col: number) => {
    if (!activeLayer) return;
    const tileId = selectedTile ?? 0;
    setDraftDoc((prev) => ({
      ...prev,
      layers: prev.layers.map((l, i) => {
        if (i !== activeIndex) return l;
        if (l.data[row]?.[col] === tileId) return l;
        const newData = l.data.map((r) => r.slice());
        newData[row][col] = tileId;
        return { ...l, data: newData };
      }),
    }));
  };

  const handleAddLayer = (name: string) => {
    const rows = activeLayer?.data.length ?? 1;
    const cols = activeLayer?.data[0]?.length ?? 1;
    const data = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
    setDraftDoc((prev) => ({ ...prev, layers: [...prev.layers, { key: crypto.randomUUID(), name, data }] }));
  };

  const handleRenameLayer = (index: number, name: string) => {
    setDraftDoc((prev) => ({
      ...prev,
      layers: prev.layers.map((l, i) => (i === index ? { ...l, name } : l)),
    }));
  };

  const handleRemoveLayer = (index: number) => {
    setDraftDoc((prev) => ({ ...prev, layers: prev.layers.filter((_, i) => i !== index) }));
    setActiveIndex((prev) => {
      if (index < prev) return prev - 1;
      if (index === prev) return Math.max(0, prev - 1);
      return prev;
    });
  };

  const handleReorderLayers = (fromIndex: number, toIndex: number) => {
    setDraftDoc((prev) => {
      const layers = prev.layers.slice();
      const [moved] = layers.splice(fromIndex, 1);
      layers.splice(toIndex, 0, moved);
      return { ...prev, layers };
    });
    setActiveIndex((prev) => {
      if (prev === fromIndex) return toIndex;
      if (fromIndex < prev && toIndex >= prev) return prev - 1;
      if (fromIndex > prev && toIndex <= prev) return prev + 1;
      return prev;
    });
  };

  const handleSave = () => {
    dispatch(updateAsset({ ...asset, content: encodeStmContent(draftDoc, asset.content) }));
    onDirtyChange?.(asset.id, false);
  };

  return (
    <div className="flex h-full">
      <div className="w-40 flex-shrink-0 border-r border-ds-border">
        <Palette slices={slices} selectedTile={selectedTile} onSelectTile={setSelectedTile} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-end p-2 border-b border-ds-border">
          <button
            type="button"
            disabled={!isDirty}
            onClick={handleSave}
            className="bg-accent-gradient text-white text-sm px-4 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
        <div className="flex-1 min-h-0">
          {activeLayer && (
            <TileMapCanvas layerData={activeLayer.data} slices={slices} onPaintCell={handlePaintCell} />
          )}
        </div>
      </div>
      <div className="w-48 flex-shrink-0 border-l border-ds-border">
        <LayersPanel
          layers={draftDoc.layers}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
          onAdd={handleAddLayer}
          onRename={handleRenameLayer}
          onRemove={handleRemoveLayer}
          onReorder={handleReorderLayers}
        />
      </div>
    </div>
  );
};

export default TileMapEditor;
```

- [ ] **Step 5: Update `AssetPreview/index.tsx`**

```tsx
// src/components/AssetPreview/index.tsx
import React from 'react';
import { IAsset } from '../../features/assets/assetsSlice';
import { getAssetType } from './getAssetType';
import ImagePreview from './ImagePreview';
import AudioPreview from './AudioPreview';
import TextEditor from './TextEditor';
import TileMapEditor from '../TileMapEditor';

type Props = {
  asset: IAsset;
  onDirtyChange?: (assetId: string, dirty: boolean) => void;
};

const AssetPreview: React.FC<Props> = ({ asset, onDirtyChange }) => {
  const type = getAssetType(asset.name);
  if (type === 'image') return <ImagePreview asset={asset} />;
  if (type === 'audio') return <AudioPreview asset={asset} />;
  if (type === 'tilemap') return <TileMapEditor asset={asset} onDirtyChange={onDirtyChange} />;
  return <TextEditor asset={asset} onDirtyChange={onDirtyChange} />;
};

export default AssetPreview;
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx tests/ui/components/AssetPreview/getAssetType.test.ts tests/ui/components/AssetPreview/AssetPreview.test.tsx`
Expected: PASS (all tests, including the pre-existing ones in the two `AssetPreview` test files)

- [ ] **Step 7: Run the full test suite to check for regressions**

Run: `npx vitest run`
Expected: all tests pass — no other file references `getAssetType`'s return type in a way that would break on the new `'tilemap'` union member (it's additive).

- [ ] **Step 8: Commit**

```bash
git add src/components/TileMapEditor/index.tsx src/components/AssetPreview/getAssetType.ts src/components/AssetPreview/index.tsx tests/ui/components/TileMapEditor/TileMapEditor.test.tsx tests/ui/components/AssetPreview/getAssetType.test.ts tests/ui/components/AssetPreview/AssetPreview.test.tsx
git commit -m "feat: add TileMapEditor owner component, wire .stm assets into AssetPreview"
```

---

### Task 6: `NewTilemapDialog` — the creation form

**Files:**
- Create: `src/components/TileMapEditor/NewTilemapDialog.tsx`
- Test: `tests/ui/components/TileMapEditor/NewTilemapDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/ui/components/TileMapEditor/NewTilemapDialog.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import assetsReducer, { addAsset } from '../../../../src/features/assets/assetsSlice';
import NewTilemapDialog from '../../../../src/components/TileMapEditor/NewTilemapDialog';

const decodeContent = (content: string) =>
  JSON.parse(decodeURIComponent(escape(atob(content.split(',')[1]))));

function makeStoreWithTileset() {
  const store = configureStore({ reducer: { assets: assetsReducer } });
  store.dispatch(addAsset({
    id: 'img1', name: 'tileset.png', content: 'data:image/png;base64,xx',
    projectId: 'p1', folderId: null, fullName: 'tileset.png',
  }));
  return store;
}

describe('NewTilemapDialog', () => {
  test('lists existing image assets in the tileset picker', () => {
    const store = makeStoreWithTileset();
    render(
      <Provider store={store}>
        <NewTilemapDialog projectId="p1" onCreated={vi.fn()} onCancel={vi.fn()} />
      </Provider>
    );
    expect(screen.getByRole('option', { name: 'tileset.png' })).toBeInTheDocument();
  });

  test('rejects a filename that already exists in the project', async () => {
    const store = makeStoreWithTileset();
    store.dispatch(addAsset({
      id: 'm1', name: 'level1.stm', content: '', projectId: 'p1', folderId: null, fullName: 'level1.stm',
    }));
    const onCreated = vi.fn();
    render(
      <Provider store={store}>
        <NewTilemapDialog projectId="p1" onCreated={onCreated} onCancel={vi.fn()} />
      </Provider>
    );
    const filenameInput = screen.getByDisplayValue('untitled.stm');
    await userEvent.clear(filenameInput);
    await userEvent.type(filenameInput, 'level1.stm');
    await userEvent.selectOptions(screen.getByLabelText('Tileset image'), 'tileset.png');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByText(/already exists/)).toBeInTheDocument();
  });

  test('submitting valid fields creates a .stm asset with the expected shape and calls onCreated', async () => {
    const store = makeStoreWithTileset();
    const onCreated = vi.fn();
    render(
      <Provider store={store}>
        <NewTilemapDialog projectId="p1" onCreated={onCreated} onCancel={vi.fn()} />
      </Provider>
    );
    await userEvent.selectOptions(screen.getByLabelText('Tileset image'), 'tileset.png');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreated).toHaveBeenCalledTimes(1);
    const createdId = onCreated.mock.calls[0][0];
    const asset = store.getState().assets.byId[createdId];
    expect(asset.name).toBe('untitled.stm');
    const decoded = decodeContent(asset.content);
    expect(decoded).toEqual({
      tileWidth: 16,
      tileHeight: 16,
      tileImage: 'tileset.png',
      layers: { background: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 0)) },
    });
  });

  test('shows an error when no tileset image is chosen', async () => {
    const store = configureStore({ reducer: { assets: assetsReducer } });
    const onCreated = vi.fn();
    render(
      <Provider store={store}>
        <NewTilemapDialog projectId="p1" onCreated={onCreated} onCancel={vi.fn()} />
      </Provider>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByText(/tileset image/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/NewTilemapDialog.test.tsx`
Expected: FAIL — `src/components/TileMapEditor/NewTilemapDialog.tsx` does not exist yet.

- [ ] **Step 3: Write `NewTilemapDialog.tsx`**

```tsx
// src/components/TileMapEditor/NewTilemapDialog.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { addAsset } from '../../features/assets/assetsSlice';
import { validateAssetName } from '../TreePanel/AssetTree/validateAssetName';
import { getAssetType } from '../AssetPreview/getAssetType';

type Props = {
  projectId: string;
  onCreated: (assetId: string) => void;
  onCancel: () => void;
};

const NewTilemapDialog: React.FC<Props> = ({ projectId, onCreated, onCancel }) => {
  const dispatch = useDispatch<AppDispatch>();

  const allAssets = useSelector((state: RootState) =>
    Object.values(state.assets.byId).filter((a) => a.projectId === projectId)
  );
  const imageAssets = allAssets.filter((a) => getAssetType(a.name) === 'image');

  const [filename, setFilename] = useState('untitled.stm');
  const [tileImageName, setTileImageName] = useState<string>('');
  const [tileWidth, setTileWidth] = useState(16);
  const [tileHeight, setTileHeight] = useState(16);
  const [cols, setCols] = useState(10);
  const [rows, setRows] = useState(10);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadTilesetFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const id = crypto.randomUUID();
      dispatch(addAsset({
        id,
        name: file.name,
        content: reader.result as string,
        projectId,
        folderId: null,
        fullName: file.name,
      }));
      setTileImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const name = filename.trim();
    const nameError = validateAssetName(name, allAssets, null);
    if (nameError) { setError(nameError); return; }
    if (!tileImageName) { setError('Choose or drop a tileset image.'); return; }
    if (tileWidth <= 0 || tileHeight <= 0 || cols <= 0 || rows <= 0) {
      setError('Tile size and grid dimensions must be greater than zero.');
      return;
    }
    const data = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
    const doc = { tileWidth, tileHeight, tileImage: tileImageName, layers: { background: data } };
    const json = JSON.stringify(doc);
    const id = crypto.randomUUID();
    dispatch(addAsset({
      id,
      name,
      content: 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(json))),
      projectId,
      folderId: null,
      fullName: name,
    }));
    onCreated(id);
  };

  return (
    <div>
      <h2 className="text-ds-text text-lg font-semibold mb-4">New Tilemap</h2>

      <label className="block text-xs text-ds-text-muted mb-1">Filename</label>
      <input
        type="text"
        value={filename}
        onChange={(e) => setFilename(e.target.value)}
        className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent mb-3"
      />

      <label className="block text-xs text-ds-text-muted mb-1">Tileset image</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) uploadTilesetFile(file);
        }}
        className={`border border-dashed rounded px-2 py-2 mb-3 text-xs ${
          dragging ? 'border-ds-accent bg-ds-accent-subtle' : 'border-ds-border'
        }`}
      >
        <select
          aria-label="Tileset image"
          value={tileImageName}
          onChange={(e) => setTileImageName(e.target.value)}
          className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-ds-text text-sm mb-1"
        >
          <option value="">Choose an image asset…</option>
          {imageAssets.map((a) => (
            <option key={a.id} value={a.name}>{a.name}</option>
          ))}
        </select>
        <p className="text-ds-text-dim">…or drag and drop an image file here</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-ds-text-muted mb-1">Tile width</label>
          <input type="number" min={1} value={tileWidth} onChange={(e) => setTileWidth(Number(e.target.value))}
            className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-ds-text text-sm" />
        </div>
        <div>
          <label className="block text-xs text-ds-text-muted mb-1">Tile height</label>
          <input type="number" min={1} value={tileHeight} onChange={(e) => setTileHeight(Number(e.target.value))}
            className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-ds-text text-sm" />
        </div>
        <div>
          <label className="block text-xs text-ds-text-muted mb-1">Grid columns</label>
          <input type="number" min={1} value={cols} onChange={(e) => setCols(Number(e.target.value))}
            className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-ds-text text-sm" />
        </div>
        <div>
          <label className="block text-xs text-ds-text-muted mb-1">Grid rows</label>
          <input type="number" min={1} value={rows} onChange={(e) => setRows(Number(e.target.value))}
            className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-ds-text text-sm" />
        </div>
      </div>

      {error && <p className="text-ds-error text-xs mb-3">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          onClick={handleSubmit}
          className="bg-accent-gradient text-white text-sm px-4 py-2 rounded hover:opacity-90 transition"
        >
          Create
        </button>
        <button onClick={onCancel} className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default NewTilemapDialog;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/NewTilemapDialog.test.tsx`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/NewTilemapDialog.tsx tests/ui/components/TileMapEditor/NewTilemapDialog.test.tsx
git commit -m "feat: add NewTilemapDialog (tileset picker, grid fields, create .stm asset)"
```

---

### Task 7: `TilemapChooserModal` + sidebar entry point

**Files:**
- Create: `src/components/TileMapEditor/TilemapChooserModal.tsx`
- Modify: `src/components/ProjectShell/index.tsx`
- Modify: `src/pages/EditPage.tsx`
- Test: `tests/ui/components/TileMapEditor/TilemapChooserModal.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/ui/components/TileMapEditor/TilemapChooserModal.test.tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import assetsReducer, { addAsset } from '../../../../src/features/assets/assetsSlice';
import TilemapChooserModal from '../../../../src/components/TileMapEditor/TilemapChooserModal';

function renderModal(onOpenAsset = vi.fn(), onClose = vi.fn()) {
  const store = configureStore({ reducer: { assets: assetsReducer } });
  store.dispatch(addAsset({
    id: 'm1', name: 'level1.stm', content: 'data:application/json;base64,e30=',
    projectId: 'p1', folderId: null, fullName: 'level1.stm',
  }));
  render(
    <Provider store={store}>
      <TilemapChooserModal projectId="p1" isOpen onClose={onClose} onOpenAsset={onOpenAsset} />
    </Provider>
  );
}

describe('TilemapChooserModal', () => {
  test('renders nothing when isOpen is false', () => {
    const store = configureStore({ reducer: { assets: assetsReducer } });
    render(
      <Provider store={store}>
        <TilemapChooserModal projectId="p1" isOpen={false} onClose={vi.fn()} onOpenAsset={vi.fn()} />
      </Provider>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('"Open existing" lists .stm assets; clicking one calls onOpenAsset and closes', async () => {
    const onOpenAsset = vi.fn();
    const onClose = vi.fn();
    renderModal(onOpenAsset, onClose);
    await userEvent.click(screen.getByRole('button', { name: /open existing/i }));
    await userEvent.click(screen.getByRole('button', { name: 'level1.stm' }));
    expect(onOpenAsset).toHaveBeenCalledWith('m1');
    expect(onClose).toHaveBeenCalled();
  });

  test('"New Tilemap" shows the creation form', async () => {
    renderModal();
    await userEvent.click(screen.getByRole('button', { name: 'New Tilemap' }));
    expect(screen.getByDisplayValue('untitled.stm')).toBeInTheDocument();
  });

  test('"Open existing" is disabled when there are no .stm assets yet', () => {
    const store = configureStore({ reducer: { assets: assetsReducer } });
    render(
      <Provider store={store}>
        <TilemapChooserModal projectId="p1" isOpen onClose={vi.fn()} onOpenAsset={vi.fn()} />
      </Provider>
    );
    expect(screen.getByRole('button', { name: /open existing/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/TilemapChooserModal.test.tsx`
Expected: FAIL — `src/components/TileMapEditor/TilemapChooserModal.tsx` does not exist yet.

- [ ] **Step 3: Write `TilemapChooserModal.tsx`**

```tsx
// src/components/TileMapEditor/TilemapChooserModal.tsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getAssetType } from '../AssetPreview/getAssetType';
import NewTilemapDialog from './NewTilemapDialog';

type Props = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenAsset: (assetId: string) => void;
};

const TilemapChooserModal: React.FC<Props> = ({ projectId, isOpen, onClose, onOpenAsset }) => {
  const [step, setStep] = useState<'choose' | 'new' | 'open'>('choose');

  const tilemapAssets = useSelector((state: RootState) =>
    Object.values(state.assets.byId).filter(
      (a) => a.projectId === projectId && getAssetType(a.name) === 'tilemap'
    )
  );

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('choose');
    onClose();
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-label="Tilemap editor" className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl">
        {step === 'choose' && (
          <>
            <h2 className="text-ds-text text-lg font-semibold mb-4">Tilemap editor</h2>
            <div className="flex flex-col gap-2 mb-4">
              <button
                onClick={() => setStep('new')}
                className="bg-accent-gradient text-white text-sm px-4 py-2 rounded hover:opacity-90 transition"
              >
                New Tilemap
              </button>
              <button
                onClick={() => setStep('open')}
                disabled={tilemapAssets.length === 0}
                className="bg-ds-surface-2 text-ds-text text-sm px-4 py-2 rounded hover:bg-ds-border transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Open existing{tilemapAssets.length === 0 ? ' (none yet)' : ''}
              </button>
            </div>
            <div className="flex justify-end">
              <button onClick={handleClose} className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition">
                Cancel
              </button>
            </div>
          </>
        )}

        {step === 'new' && (
          <NewTilemapDialog
            projectId={projectId}
            onCreated={(id) => { onOpenAsset(id); handleClose(); }}
            onCancel={() => setStep('choose')}
          />
        )}

        {step === 'open' && (
          <>
            <h2 className="text-ds-text text-lg font-semibold mb-4">Open existing</h2>
            <ul className="space-y-1 mb-4">
              {tilemapAssets.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => { onOpenAsset(a.id); handleClose(); }}
                    className="w-full text-left text-ds-text text-sm px-2 py-1.5 rounded hover:bg-ds-surface-2 transition"
                  >
                    {a.name}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <button onClick={() => setStep('choose')} className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition">
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default TilemapChooserModal;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/TilemapChooserModal.test.tsx`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Add the `TilemapIcon` to `ProjectShell/index.tsx`**

Add after the `ExportIcon` definition (line 25):

```tsx
const TilemapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
```

Update the export line at the bottom:

```tsx
export { FilesIcon, AssetsIcon, ExportIcon, TilemapIcon };
```

- [ ] **Step 6: Wire it into `EditPage.tsx`**

Update the import line (currently `import ProjectShell, { FilesIcon, ExportIcon } from '../components/ProjectShell';`):

```tsx
import ProjectShell, { FilesIcon, ExportIcon, TilemapIcon } from '../components/ProjectShell';
```

Add a new import for the modal, alongside the existing `AssetPreview` import:

```tsx
import TilemapChooserModal from '../components/TileMapEditor/TilemapChooserModal';
```

Add new state, alongside the other `useState` declarations (near `openAssetTabs`):

```tsx
const [isTilemapModalOpen, setIsTilemapModalOpen] = useState(false);
```

Add a new entry to the `activitySections` array, after the `'export'` section:

```tsx
{
  id: 'tilemap',
  icon: <TilemapIcon />,
  ariaLabel: 'Tilemap editor',
  onAction: () => setIsTilemapModalOpen(true),
},
```

Wrap the returned JSX in a fragment and render the modal as a sibling of `<ProjectShell>`:

```tsx
return (
  <>
    <ProjectShell
      header={ /* unchanged */ }
      activitySections={[ /* unchanged, with the new 'tilemap' entry added */ ]}
      editor={ /* unchanged */ }
      preview={ /* unchanged */ }
      panel={ /* unchanged */ }
      footer={ /* unchanged */ }
    />
    <TilemapChooserModal
      projectId={project.id}
      isOpen={isTilemapModalOpen}
      onClose={() => setIsTilemapModalOpen(false)}
      onOpenAsset={handleOpenAsset}
    />
  </>
);
```

- [ ] **Step 7: Verify the build**

Run: `npx vite build`
Expected: build succeeds (confirms all the new imports/wiring are valid TypeScript).

- [ ] **Step 8: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/components/TileMapEditor/TilemapChooserModal.tsx src/components/ProjectShell/index.tsx src/pages/EditPage.tsx tests/ui/components/TileMapEditor/TilemapChooserModal.test.tsx
git commit -m "feat: add tilemap editor sidebar entry point (TilemapChooserModal + TilemapIcon)"
```

---

### Task 8: Manual runtime verification

Vitest/RTL tests prove the components behave correctly in isolation with mocked `Image`/canvas, but don't prove the real browser rendering, real tileset image decoding, or that a game built with `TileMapSet` can actually load and render a file this editor produced. This task closes that gap — don't skip it.

**Files:** none (scratch verification only — nothing here is committed)

- [ ] **Step 1: Start the dev server and open the app**

Use the Browser pane's `preview_start` with `{name: "Basic4WebGL Dev"}` (check `.claude/launch.json` for the exact configured name), or attach to an already-running dev server on port 5173.

- [ ] **Step 2: Create a scratch project and open the Tilemap editor**

Create a new project. Click the new Tilemap sidebar icon. Confirm the chooser modal shows "New Tilemap" and a disabled "Open existing (none yet)".

- [ ] **Step 3: Create a new tilemap**

Click "New Tilemap". Drag-and-drop a small tileset PNG onto the picker (or use a pre-uploaded one if you upload one via the assets panel first). Set tile width/height to something like 8/8, grid columns/rows to 4/4. Click Create.

Confirm: the editor tab opens, the palette shows sliced tile thumbnails, the canvas shows a 4x4 empty grid, and the layers panel shows one layer named "background".

- [ ] **Step 4: Paint and verify layer isolation**

Click a palette tile, then click-and-drag across a few canvas cells — confirm tiles appear and dragging paints continuously. Click "Add layer", switch to it, and paint different cells — confirm the first layer's paint is untouched when you switch back to it.

- [ ] **Step 5: Save and inspect the underlying asset**

Click Save. Using `read_network_requests` or the browser console isn't needed — instead, close and reopen the tab (click the `.stm` file again in the assets tree) and confirm the painted tiles persisted.

- [ ] **Step 6: Confirm a `TileMapSet`-based game can load the saved file**

In the same project's `Main.bas`, write a small program using `TileMapSet` (per `src/docs/api-reference/tilemapset.md`) pointing at the `.stm` file you just created and painted. Run it. Using `read_console_messages` or the in-app console panel, confirm no `ERR` entries appear and the painted layer renders visibly in the preview — this is the full round-trip proof that the editor and the runtime agree on the file format.

- [ ] **Step 7: Test layer reordering**

Drag a layer to a different position in the Layers panel. Confirm the canvas view doesn't break and the active layer selection follows sensibly. Save, reopen, and confirm the new layer order persisted (re-running the Step 6 program should show the reordered render order if the layers have overlapping visible tiles).

If any step fails, use `systematic-debugging` to root-cause before considering this task done.

---

### Task 9: Final full-suite verification

**Files:** none

- [ ] **Step 1: Run the full Vitest suite**

Run: `npx vitest run`
Expected: all tests pass, including every test added in Tasks 1–7.

- [ ] **Step 2: Run a final build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 3: Confirm working tree is clean**

Run: `git status`
Expected: nothing to commit (every task above already committed its own changes).
