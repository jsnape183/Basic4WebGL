# Tilemap Collision Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `'collision'` layer kind to the Tilemap Editor and `.stm` format — a paintable, boolean solid/not-solid grid, distinct from tile-art and marker layers, that the runtime engine loads as data-only (no rendered sprites) and that `pathfinding.setup()` can already consume as a blocking layer with zero changes on its side.

**Architecture:** This is Component 1 of `docs/superpowers/specs/2026-08-12-kinematic-tile-collision-design.md` — independently shippable and useful on its own (paired with `pathfinding.setup`) before Component 2 (kinematic sprite movement, a separate follow-up plan) exists. Follows the exact precedent already established for marker layers: a distinct on-disk shape (`{type: 'collision', data: number[][]}`, not a bare array) so the `.stm` loader doesn't mistake it for tile art, a dedicated paint-canvas component mirroring `MarkerCanvas`, and `LayersPanel`/`index.tsx` wiring mirroring the existing tile/marker dual-kind handling exactly.

**Tech Stack:** React (TSX), Vitest + Testing Library, the existing `.stm` JSON format and `tilemap.js` engine loader.

**Design doc:** `docs/superpowers/specs/2026-08-12-kinematic-tile-collision-design.md` (Component 1 only)

---

### Task 1: `.stm` format + codec support for the `'collision'` layer kind

**Files:**
- Modify: `src/components/TileMapEditor/types.ts`
- Modify: `src/components/TileMapEditor/index.tsx`
- Test: `tests/ui/components/TileMapEditor/stmCodec.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `tests/ui/components/TileMapEditor/stmCodec.test.ts`, inside the existing `describe('decodeStmContent', ...)` block (after the last test, before its closing `});`):

```ts
  test('decodes a { type: "collision" } layer as a collision layer', () => {
    const content = toDataUrl({
      tileWidth: 16, tileHeight: 16, tileImage: 'a.png',
      layers: { solidmask: { type: 'collision', data: [[1, 0], [0, 1]] } },
    });
    const doc = decodeStmContent(content);
    expect(doc.layers).toHaveLength(1);
    expect(doc.layers[0]).toMatchObject({ name: 'solidmask', kind: 'collision', data: [[1, 0], [0, 1]] });
  });

  test('decodes a file mixing tile, marker, and collision layers, preserving order', () => {
    const content = toDataUrl({
      tileWidth: 16, tileHeight: 16, tileImage: 'a.png',
      layers: {
        background: [[1, 0]],
        spawns: { type: 'markers', markers: [] },
        solidmask: { type: 'collision', data: [[0, 0]] },
      },
    });
    const doc = decodeStmContent(content);
    expect(doc.layers.map((l) => l.kind)).toEqual(['tile', 'marker', 'collision']);
  });
```

Append to the existing `describe('encodeStmContent', ...)` block:

```ts
  test('round-trips a collision layer as { type: "collision" }', () => {
    const content = toDataUrl({
      tileWidth: 16, tileHeight: 16, tileImage: 'a.png',
      layers: { solidmask: { type: 'collision', data: [[1, 0]] } },
    });
    const doc = decodeStmContent(content);
    const reEncoded = encodeStmContent(doc, content);
    const decoded = JSON.parse(decodeURIComponent(escape(atob(reEncoded.split(',')[1]))));
    expect(decoded.layers.solidmask).toEqual({ type: 'collision', data: [[1, 0]] });
  });
```

Append to the existing `describe('exportStmDoc', ...)` block:

```ts
  test('serializes a collision layer as { type: "collision", data }', () => {
    const doc: StmDoc = {
      tileWidth: 8,
      tileHeight: 8,
      tileImage: 'tileset.png',
      layers: [
        { key: 'k1', name: 'background', kind: 'tile', data: [[1, 1], [0, 0]] },
        { key: 'k2', name: 'solidmask', kind: 'collision', data: [[1, 0], [0, 0]] },
      ],
    };
    const parsed = JSON.parse(exportStmDoc(doc));
    expect(parsed.layers).toEqual({
      background: [[1, 1], [0, 0]],
      solidmask: { type: 'collision', data: [[1, 0], [0, 0]] },
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/stmCodec.test.ts`
Expected: the 4 new tests FAIL — `kind: 'collision'` doesn't exist on `EditorLayer` yet (TypeScript wouldn't catch this at test-runtime since `vitest run` doesn't type-check, but `decodeStmContent` will actually mis-decode a `{type: 'collision', ...}` value as a marker layer today, since its current logic is `Array.isArray(value) ? tile : marker` — anything non-array falls into the marker branch and reads `value.markers`, which is `undefined` for a collision layer, so these tests fail on the `kind`/`data` assertions).

- [ ] **Step 3: Add `'collision'` to `EditorLayer` and `StmLayerValue`**

In `src/components/TileMapEditor/types.ts`, replace the full file content:

```ts
export type MarkerEntry = { row: number; col: number; tag: string };

export type EditorLayer =
  | { key: string; name: string; kind: 'tile'; data: number[][] }
  | { key: string; name: string; kind: 'marker'; markers: MarkerEntry[] }
  | { key: string; name: string; kind: 'collision'; data: number[][] };

export type StmDoc = {
  tileWidth: number;
  tileHeight: number;
  tileImage: string;
  layers: EditorLayer[];
};
```

- [ ] **Step 4: Update `decodeStmContent`/`buildStmLayers`/`exportStmDoc` in `index.tsx`**

In `src/components/TileMapEditor/index.tsx`, change the `StmLayerValue` type. Replace:

```ts
type StmLayerValue = number[][] | { type: 'markers'; markers: MarkerEntry[] };
```

with:

```ts
type StmLayerValue =
  | number[][]
  | { type: 'markers'; markers: MarkerEntry[] }
  | { type: 'collision'; data: number[][] };
```

Replace the `decodeStmContent` function's layer-mapping line. Change:

```ts
    layers: layerEntries.map(([name, value]): EditorLayer =>
      Array.isArray(value)
        ? { key: crypto.randomUUID(), name, kind: 'tile', data: value }
        : { key: crypto.randomUUID(), name, kind: 'marker', markers: value.markers }
    ),
```

to:

```ts
    layers: layerEntries.map(([name, value]): EditorLayer => {
      if (Array.isArray(value)) return { key: crypto.randomUUID(), name, kind: 'tile', data: value };
      if (value.type === 'collision') return { key: crypto.randomUUID(), name, kind: 'collision', data: value.data };
      return { key: crypto.randomUUID(), name, kind: 'marker', markers: value.markers };
    }),
```

Replace `buildStmLayers`. Change:

```ts
function buildStmLayers(doc: StmDoc): Record<string, StmLayerValue> {
  const layers: Record<string, StmLayerValue> = {};
  doc.layers.forEach((l) => {
    layers[l.name] = l.kind === 'tile' ? l.data : { type: 'markers', markers: l.markers };
  });
  return layers;
}
```

to:

```ts
function buildStmLayers(doc: StmDoc): Record<string, StmLayerValue> {
  const layers: Record<string, StmLayerValue> = {};
  doc.layers.forEach((l) => {
    if (l.kind === 'tile') layers[l.name] = l.data;
    else if (l.kind === 'collision') layers[l.name] = { type: 'collision', data: l.data };
    else layers[l.name] = { type: 'markers', markers: l.markers };
  });
  return layers;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/stmCodec.test.ts`
Expected: PASS — all pre-existing tests plus the 4 new ones.

Also run the full `TileMapEditor` test directory, since `EditorLayer`'s type change is used throughout:

Run: `npx vitest run tests/ui/components/TileMapEditor/`
Expected: all files PASS unchanged (nothing else constructs or reads `kind: 'collision'` yet).

- [ ] **Step 6: Commit**

```bash
git add src/components/TileMapEditor/types.ts src/components/TileMapEditor/index.tsx tests/ui/components/TileMapEditor/stmCodec.test.ts
git commit -m "feat: add collision layer kind to .stm codec"
```

---

### Task 2: `CollisionCanvas` paint component

**Files:**
- Create: `src/components/TileMapEditor/CollisionCanvas.tsx`
- Test: `tests/ui/components/TileMapEditor/CollisionCanvas.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/components/TileMapEditor/CollisionCanvas.test.tsx`:

```tsx
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import CollisionCanvas from '../../../../src/components/TileMapEditor/CollisionCanvas';

describe('CollisionCanvas', () => {
  test('renders a grid of the given rows/cols', () => {
    render(<CollisionCanvas rows={2} cols={2} data={[[0, 0], [0, 0]]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 0')).toBeInTheDocument();
    expect(screen.getByLabelText('Row 1, Column 1')).toBeInTheDocument();
  });

  test('a solid cell (non-zero) gets the solid fill class', () => {
    render(<CollisionCanvas rows={1} cols={2} data={[[0, 1]]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 0')).not.toHaveClass('bg-ds-error/70');
    expect(screen.getByLabelText('Row 0, Column 1')).toHaveClass('bg-ds-error/70');
  });

  test('mouse down paints a cell', () => {
    const onPaintCell = vi.fn();
    render(<CollisionCanvas rows={2} cols={2} data={[[0, 0], [0, 0]]} onPaintCell={onPaintCell} />);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).toHaveBeenCalledWith(0, 1);
  });

  test('drag (mouse down then enter another cell) paints both cells', () => {
    const onPaintCell = vi.fn();
    render(<CollisionCanvas rows={2} cols={2} data={[[0, 0], [0, 0]]} onPaintCell={onPaintCell} />);
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    fireEvent.mouseEnter(screen.getByLabelText('Row 0, Column 1'));
    expect(onPaintCell).toHaveBeenCalledTimes(2);
  });

  test('interactive=false renders cell content but no aria-label, role, or mouse handlers', () => {
    const onPaintCell = vi.fn();
    render(<CollisionCanvas rows={2} cols={2} data={[[0, 1], [0, 0]]} onPaintCell={onPaintCell} interactive={false} />);
    expect(screen.queryByLabelText('Row 0, Column 1')).not.toBeInTheDocument();
    expect(screen.queryByRole('gridcell')).not.toBeInTheDocument();
  });

  test('interactive=false also drops the outer grid role/label', () => {
    const onPaintCell = vi.fn();
    render(<CollisionCanvas rows={2} cols={2} data={[[0, 0], [0, 0]]} onPaintCell={onPaintCell} interactive={false} />);
    expect(screen.queryByLabelText('Collision canvas')).not.toBeInTheDocument();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  test('interactive defaults to true when the prop is omitted', () => {
    render(<CollisionCanvas rows={2} cols={2} data={[[0, 0], [0, 0]]} onPaintCell={vi.fn()} />);
    expect(screen.getByLabelText('Row 0, Column 0')).toBeInTheDocument();
    expect(screen.getByLabelText('Collision canvas')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/CollisionCanvas.test.tsx`
Expected: FAIL — `src/components/TileMapEditor/CollisionCanvas.tsx` doesn't exist yet (module not found).

- [ ] **Step 3: Implement `CollisionCanvas.tsx`**

Create `src/components/TileMapEditor/CollisionCanvas.tsx`:

```tsx
import React from 'react';
import { CELL_SIZE } from './constants';
import { usePaintDrag } from './usePaintDrag';

type Props = {
  rows: number;
  cols: number;
  data: number[][];
  onPaintCell: (row: number, col: number) => void;
  /** When false, renders the same solid/not-solid fill with no aria-label/role/mouse handlers — used for dimmed, non-active reference layers so their cells never collide with the active layer's "Row X, Column Y" labels. Defaults to true. */
  interactive?: boolean;
};

const CollisionCanvas: React.FC<Props> = ({ rows, cols, data, onPaintCell, interactive = true }) => {
  const { startPaint, continuePaint } = usePaintDrag(onPaintCell);

  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const isSolid = Boolean(data[row]?.[col]);
      cells.push(
        <div
          key={`${row}-${col}`}
          role={interactive ? 'gridcell' : undefined}
          aria-label={interactive ? `Row ${row}, Column ${col}` : undefined}
          onMouseDown={interactive ? () => startPaint(row, col) : undefined}
          onMouseEnter={interactive ? () => continuePaint(row, col) : undefined}
          className={`border border-ds-border ${interactive ? 'hover:ring-2 hover:ring-inset hover:ring-ds-accent' : ''} ${isSolid ? 'bg-ds-error/70' : ''}`}
          style={{ width: CELL_SIZE, height: CELL_SIZE }}
        />
      );
    }
  }

  return (
    <div
      role={interactive ? 'grid' : undefined}
      aria-label={interactive ? 'Collision canvas' : undefined}
      style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)` }}
    >
      {cells}
    </div>
  );
};

export default CollisionCanvas;
```

`onPaintCell` painting a solid value (always `1`, no eraser distinction at the component level — matching how `TileMapCanvas`'s "Eraser" is really just painting tile id `0` via the palette, see Task 4 for how `index.tsx` decides what value to paint) is decided by the caller, not this component — this component only renders `data` and reports which cell was clicked.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/CollisionCanvas.test.tsx`
Expected: PASS — all 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/CollisionCanvas.tsx tests/ui/components/TileMapEditor/CollisionCanvas.test.tsx
git commit -m "feat: add CollisionCanvas paint component"
```

---

### Task 3: `LayersPanel` — add-collision-layer control + badge

**Files:**
- Modify: `src/components/TileMapEditor/LayersPanel.tsx`
- Test: `tests/ui/components/TileMapEditor/LayersPanel.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add to `tests/ui/components/TileMapEditor/LayersPanel.test.tsx`, inside the existing `describe('LayersPanel', ...)` block (after the last test, before its closing `});`):

```tsx
  test('clicking "Add collision layer" calls onAdd with a unique default name and kind "collision"', async () => {
    const onAdd = vi.fn();
    render(<LayersPanel layers={makeLayers()} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={onAdd} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    await userEvent.click(screen.getByLabelText('Add collision layer'));
    expect(onAdd).toHaveBeenCalledWith('collision3', 'collision');
  });

  test('a collision layer shows a distinguishing badge in the list', () => {
    const layers: EditorLayer[] = [
      { key: 'k1', name: 'background', kind: 'tile', data: [[0]] },
      { key: 'k2', name: 'solidmask', kind: 'collision', data: [[0]] },
    ];
    render(<LayersPanel layers={layers} activeIndex={0} hiddenKeys={noHidden} onSelect={vi.fn()} onAdd={vi.fn()} onRename={vi.fn()} onRemove={vi.fn()} onReorder={vi.fn()} onToggleVisibility={vi.fn()} />);
    expect(screen.getByText('solid')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/LayersPanel.test.tsx`
Expected: the 2 new tests FAIL — no "Add collision layer" control exists yet, and `Props['onAdd']`'s `kind` parameter doesn't accept `'collision'` (a design-time gap, not yet a runtime one — the second test fails because no "solid" badge is rendered for a `kind: 'collision'` layer).

- [ ] **Step 3: Implement in `LayersPanel.tsx`**

In `src/components/TileMapEditor/LayersPanel.tsx`, update the `Props` type's `onAdd` signature. Change:

```ts
  onAdd: (name: string, kind: 'tile' | 'marker') => void;
```

to:

```ts
  onAdd: (name: string, kind: 'tile' | 'marker' | 'collision') => void;
```

Add a collision-layer badge in `SortableLayerItem`, alongside the existing marker badge. Change:

```tsx
      {layer.kind === 'marker' && (
        <span className="text-[9px] px-1 rounded bg-ds-surface-2 text-ds-text-dim uppercase tracking-wide mr-1 flex-shrink-0">
          tag
        </span>
      )}
```

to:

```tsx
      {layer.kind === 'marker' && (
        <span className="text-[9px] px-1 rounded bg-ds-surface-2 text-ds-text-dim uppercase tracking-wide mr-1 flex-shrink-0">
          tag
        </span>
      )}
      {layer.kind === 'collision' && (
        <span className="text-[9px] px-1 rounded bg-ds-surface-2 text-ds-text-dim uppercase tracking-wide mr-1 flex-shrink-0">
          solid
        </span>
      )}
```

Update `handleAdd` and the header buttons in the main `LayersPanel` component. Change:

```ts
  const handleAdd = (kind: 'tile' | 'marker') => {
    const prefix = kind === 'tile' ? 'layer' : 'markers';
    let n = 1;
    let name = `${prefix}${layers.length + n}`;
    while (layers.some((l) => l.name === name)) { n += 1; name = `${prefix}${layers.length + n}`; }
    onAdd(name, kind);
  };
```

to:

```ts
  const handleAdd = (kind: 'tile' | 'marker' | 'collision') => {
    const prefix = kind === 'tile' ? 'layer' : kind === 'marker' ? 'markers' : 'collision';
    let n = 1;
    let name = `${prefix}${layers.length + n}`;
    while (layers.some((l) => l.name === name)) { n += 1; name = `${prefix}${layers.length + n}`; }
    onAdd(name, kind);
  };
```

Change the header button group. Replace:

```tsx
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
```

with:

```tsx
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
          <button
            onClick={() => handleAdd('collision')}
            aria-label="Add collision layer"
            className="text-ds-text-muted hover:text-ds-text transition text-[10px] leading-none px-1 border border-ds-border rounded"
          >
            +solid
          </button>
        </div>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/LayersPanel.test.tsx`
Expected: PASS — all pre-existing tests (12) plus the 2 new ones (14 total).

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/LayersPanel.tsx tests/ui/components/TileMapEditor/LayersPanel.test.tsx
git commit -m "feat: add collision layer control and badge to LayersPanel"
```

---

### Task 4: `index.tsx` wiring — add + composite render for collision layers

**Files:**
- Modify: `src/components/TileMapEditor/index.tsx`
- Test: `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add this new `describe` block to `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`, after the existing `describe('TileMapEditor — marker layers', ...)` block's closing `});` (at the end of the file):

```tsx
describe('TileMapEditor — collision layers', () => {
  test('adding a collision layer and painting solid cells saves it in the new format', async () => {
    const { store } = renderEditor();
    await userEvent.click(screen.getByLabelText('Add collision layer'));
    await userEvent.click(screen.getByText('collision3'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.collision3).toEqual({ type: 'collision', data: [[0, 1], [0, 0]] });
  });

  test('a collision layer composites on top of dimmed tile layers when active', async () => {
    renderEditor();
    await userEvent.click(screen.getByLabelText('Add collision layer'));
    await userEvent.click(screen.getByText('collision3'));

    expect(screen.getByLabelText('Collision canvas')).toBeInTheDocument();
    const backgroundWrapper = screen.getByLabelText('Layer background');
    expect(backgroundWrapper).toHaveStyle({ opacity: '0.35', pointerEvents: 'none' });
  });

  test('adding a collision layer does not disturb existing tile layer data on save', async () => {
    const { store } = renderEditor();
    await userEvent.click(screen.getByLabelText('Add collision layer'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = decodeContent(store.getState().assets.byId['m1'].content);
    expect(decoded.layers.background).toEqual([[1, 1], [1, 1]]);
    expect(decoded.layers.foreground).toEqual([[0, 0], [0, 0]]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx -t "collision layers"`
Expected: the 3 new tests FAIL — `screen.getByLabelText('Add collision layer')` finds nothing (`LayersPanel` isn't wired with a `'collision'`-aware `handleAddLayer` from `TileMapEditor` yet, and the composite render loop has no branch for `kind === 'collision'`).

- [ ] **Step 3: Implement in `index.tsx`**

Add the `CollisionCanvas` import. Change:

```ts
import TileMapCanvas from './Canvas';
import MarkerCanvas from './MarkerCanvas';
```

to:

```ts
import TileMapCanvas from './Canvas';
import MarkerCanvas from './MarkerCanvas';
import CollisionCanvas from './CollisionCanvas';
```

Update `handleAddLayer` to accept and construct a `'collision'` layer. Change:

```ts
  const handleAddLayer = (name: string, kind: 'tile' | 'marker') => {
    const newLayer: EditorLayer =
      kind === 'tile'
        ? {
            key: crypto.randomUUID(),
            name,
            kind: 'tile',
            data: Array.from({ length: gridRows }, () => Array.from({ length: gridCols }, () => 0)),
          }
        : { key: crypto.randomUUID(), name, kind: 'marker', markers: [] };
    setDraftDoc((prev) => ({ ...prev, layers: [...prev.layers, newLayer] }));
  };
```

to:

```ts
  const handleAddLayer = (name: string, kind: 'tile' | 'marker' | 'collision') => {
    const emptyGrid = () => Array.from({ length: gridRows }, () => Array.from({ length: gridCols }, () => 0));
    const newLayer: EditorLayer =
      kind === 'tile'
        ? { key: crypto.randomUUID(), name, kind: 'tile', data: emptyGrid() }
        : kind === 'collision'
        ? { key: crypto.randomUUID(), name, kind: 'collision', data: emptyGrid() }
        : { key: crypto.randomUUID(), name, kind: 'marker', markers: [] };
    setDraftDoc((prev) => ({ ...prev, layers: [...prev.layers, newLayer] }));
  };
```

Update `handlePaintCell` to handle painting a collision layer (always paints solid `1`; there is no "eraser" tool concept for this layer kind in this increment — painting the same cell again still just sets `1`, matching the simplest possible "one brush" interaction described in the design). Change:

```ts
  const handlePaintCell = (row: number, col: number) => {
    if (!activeLayer) return;
    if (activeLayer.kind === 'tile') {
      const tileId = selectedTile ?? 0;
      setDraftDoc((prev) => ({
        ...prev,
        layers: prev.layers.map((l, i) => {
          if (i !== activeIndex || l.kind !== 'tile') return l;
          const newData = l.data.map((r) => r.slice());
          newData[row][col] = tileId;
          return { ...l, data: newData };
        }),
      }));
    } else {
      setDraftDoc((prev) => ({
        ...prev,
        layers: prev.layers.map((l, i) => {
          if (i !== activeIndex || l.kind !== 'marker') return l;
          const withoutCell = l.markers.filter((m) => !(m.row === row && m.col === col));
          const newMarkers = selectedTag ? [...withoutCell, { row, col, tag: selectedTag }] : withoutCell;
          return { ...l, markers: newMarkers };
        }),
      }));
    }
    setIsDirty(true);
  };
```

to:

```ts
  const handlePaintCell = (row: number, col: number) => {
    if (!activeLayer) return;
    if (activeLayer.kind === 'tile') {
      const tileId = selectedTile ?? 0;
      setDraftDoc((prev) => ({
        ...prev,
        layers: prev.layers.map((l, i) => {
          if (i !== activeIndex || l.kind !== 'tile') return l;
          const newData = l.data.map((r) => r.slice());
          newData[row][col] = tileId;
          return { ...l, data: newData };
        }),
      }));
    } else if (activeLayer.kind === 'collision') {
      setDraftDoc((prev) => ({
        ...prev,
        layers: prev.layers.map((l, i) => {
          if (i !== activeIndex || l.kind !== 'collision') return l;
          const newData = l.data.map((r) => r.slice());
          newData[row][col] = 1;
          return { ...l, data: newData };
        }),
      }));
    } else {
      setDraftDoc((prev) => ({
        ...prev,
        layers: prev.layers.map((l, i) => {
          if (i !== activeIndex || l.kind !== 'marker') return l;
          const withoutCell = l.markers.filter((m) => !(m.row === row && m.col === col));
          const newMarkers = selectedTag ? [...withoutCell, { row, col, tag: selectedTag }] : withoutCell;
          return { ...l, markers: newMarkers };
        }),
      }));
    }
    setIsDirty(true);
  };
```

Add a `CollisionCanvas` branch to the composite render loop. Change:

```tsx
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
```

to:

```tsx
                  {layer.kind === 'marker' ? (
                    <MarkerCanvas
                      rows={gridRows}
                      cols={gridCols}
                      markers={layer.markers}
                      onPaintCell={handlePaintCell}
                      interactive={isActive}
                    />
                  ) : layer.kind === 'collision' ? (
                    <CollisionCanvas
                      rows={gridRows}
                      cols={gridCols}
                      data={layer.data}
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`
Expected: PASS — every pre-existing test plus the 3 new ones.

Also run the full `TileMapEditor` test directory:

Run: `npx vitest run tests/ui/components/TileMapEditor/`
Expected: all files PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/index.tsx tests/ui/components/TileMapEditor/TileMapEditor.test.tsx
git commit -m "feat: wire collision layers into TileMapEditor add/paint/composite render"
```

---

### Task 5: Runtime loader support (`tilemap.js`) + pathfinding-compatibility proof

**Files:**
- Modify: `src/components/Runner/engine/tilemap.js`
- Test: `tests/components/Runner/tilemap.test.ts`

- [ ] **Step 1: Write the failing tests**

Add these `describe` blocks to `tests/components/Runner/tilemap.test.ts`, after the existing `describe('createTileMapSet — marker layers ...', ...)` block's closing `});` (before the `describe('markersByTag', ...)` block, or at the end of the file — placement relative to other blocks doesn't matter, Vitest runs all top-level `describe`s regardless of order):

```ts
describe('createTileMapSet — collision layers (no rendering, no tile-art parsing)', () => {
  test('a collision layer produces a layer container with no rendered sprites', async () => {
    const stm = {
      tileWidth: 16, tileHeight: 16, tileImage: 'sheet.png',
      layers: {
        background: [[1, 1]],
        solidmask: { type: 'collision', data: [[1, 0]] },
      },
    };
    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 256, 256) });
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({ 'sheet.png': texture, 'level.stm': stm });
    await _sbAssets.preload([
      { name: 'sheet.png', src: 'sheet.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    const set = _sbTilemaps.createTileMapSet('level.stm');

    expect(Object.keys(set._layerContainers)).toEqual(['background', 'solidmask']);
    expect(set._layerContainers.solidmask.children).toEqual([]);
    expect(set._layerContainers.solidmask._map).toEqual([[1, 0]]);
  });

  test('a collision layer with a tile-id-like value (e.g. 5) does not attempt to render tile art', async () => {
    // The collision grid's values are opaque booleans (0/non-zero), not tile
    // indices into `frames` -- confirms the loader never treats collision
    // data as tile art, even if a value happens to look like a valid tile id.
    const stm = {
      tileWidth: 16, tileHeight: 16, tileImage: 'sheet.png',
      layers: { solidmask: { type: 'collision', data: [[5]] } },
    };
    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 16, 16) });
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({ 'sheet.png': texture, 'level.stm': stm });
    await _sbAssets.preload([
      { name: 'sheet.png', src: 'sheet.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    const set = _sbTilemaps.createTileMapSet('level.stm');

    expect(set._layerContainers.solidmask.children).toEqual([]);
  });

  test('a file mixing tile, marker, and collision layers accumulates each correctly', async () => {
    const stm = {
      tileWidth: 16, tileHeight: 16, tileImage: 'sheet.png',
      layers: {
        background: [[1]],
        spawns: { type: 'markers', markers: [{ row: 0, col: 0, tag: 'spawn' }] },
        solidmask: { type: 'collision', data: [[1]] },
      },
    };
    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 16, 16) });
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({ 'sheet.png': texture, 'level.stm': stm });
    await _sbAssets.preload([
      { name: 'sheet.png', src: 'sheet.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    const set = _sbTilemaps.createTileMapSet('level.stm');

    expect(Object.keys(set._layerContainers)).toEqual(['background', 'solidmask']);
    expect(set._markers).toEqual([{ row: 0, col: 0, tag: 'spawn' }]);
  });
});

describe('createTileMapSet — a collision layer is directly usable by pathfinding.setup with zero pathfinding-side changes', () => {
  test('pathfinding.setupNavGrid treats a real, loader-parsed collision layer as a blocking layer', async () => {
    const stm = {
      tileWidth: 16, tileHeight: 16, tileImage: 'sheet.png',
      layers: { solidmask: { type: 'collision', data: [[0, 1], [0, 0]] } },
    };
    const texture = new FakeTexture({ source: { fake: 'pixels' }, frame: new FakeRectangle(0, 0, 16, 16) });
    const { _sbAssets, _sbTilemaps } = loadTilemapWithAssets({ 'sheet.png': texture, 'level.stm': stm });
    await _sbAssets.preload([
      { name: 'sheet.png', src: 'sheet.png' },
      { name: 'level.stm', src: 'level.stm' },
    ]);

    const setHandle = _sbTilemaps.createTileMapSet('level.stm');

    // Load the real pathfinding module the same way pathfinding.test.ts does,
    // and hand it the real object this test just built with the real
    // tilemap.js loader -- proving compatibility empirically, not by
    // assumption. setupNavGrid receives a softBASIC TileMapSet *instance*
    // shape (`{ _handle: ... }`), matching the .bas call convention.
    const pathfindingSrc = readFileSync('src/components/Runner/engine/pathfinding.js', 'utf-8');
    const pfFactory = new Function('worldContainer', 'hudContainer', `${pathfindingSrc}\n return _sbPathfinding;`);
    const pf = pfFactory({}, {});

    pf.setupNavGrid({ _handle: setHandle }, ['solidmask']);

    expect(pf._isBlocked(0, 0)).toBe(false);
    expect(pf._isBlocked(0, 1)).toBe(true);
  });
});
```

Add the `readFileSync` import if it isn't already imported at the top of the file (it already is, per the file's existing `loadTilemap` helper — no change needed there).

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/components/Runner/tilemap.test.ts`
Expected: the 4 new tests FAIL. The `createTileMapSet` loader currently has exactly two branches (`Array.isArray(layerValue)` → tile, else → assumed marker, reading `layerValue.markers`), so a `{type: 'collision', data: [[...]]}` value falls into the marker branch, where `layerValue.markers` is `undefined` — `for (const m of layerValue.markers)` throws a `TypeError: Cannot read properties of undefined`, failing every test that constructs a collision layer via the real loader (all 4).

- [ ] **Step 3: Add the `'collision'` branch to `tilemap.js`'s loader**

In `src/components/Runner/engine/tilemap.js`, find the layer-parsing loop inside `createTileMapSet` (the `for (const name of Object.keys(data.layers))` loop). Change:

```js
    for (const name of Object.keys(data.layers)) {
      const layerValue = data.layers[name];
      if (!Array.isArray(layerValue)) {
        // Marker layer: never rendered, no PIXI.Container child — just
        // accumulate its entries into the set-level marker list, which
        // markersByTag searches across every marker layer at once (not
        // scoped to one named layer).
        for (const m of layerValue.markers) {
          markers.push({ row: m.row, col: m.col, tag: m.tag });
        }
        continue;
      }
```

to:

```js
    for (const name of Object.keys(data.layers)) {
      const layerValue = data.layers[name];
      if (!Array.isArray(layerValue)) {
        if (layerValue.type === 'collision') {
          // Collision layer: data-only, no tile art, no PIXI sprite
          // children -- but stored in `layerContainers` with a `_map` the
          // same shape a tile layer's is, so `pathfinding.setup()` can
          // treat it as a blocking layer with zero changes on that side.
          const container = new PIXI.Container();
          container._map = layerValue.data;
          layerContainers[name] = container;
          continue;
        }
        // Marker layer: never rendered, no PIXI.Container child — just
        // accumulate its entries into the set-level marker list, which
        // markersByTag searches across every marker layer at once (not
        // scoped to one named layer).
        for (const m of layerValue.markers) {
          markers.push({ row: m.row, col: m.col, tag: m.tag });
        }
        continue;
      }
```

Note: the collision layer's container is deliberately **not** appended to `handle` via `handle.addChild(container)` (unlike tile layers) — it has no visual representation and doesn't need to participate in the display tree, only in `layerContainers` for data lookup.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/components/Runner/tilemap.test.ts`
Expected: PASS — all pre-existing tests plus the 4 new ones.

- [ ] **Step 5: Self-review**

Before committing, confirm:
- The new branch is checked **before** the existing marker-layer `for (const m of layerValue.markers)` loop, not after (a collision layer's `layerValue.markers` is `undefined`, so if this branch were ordered after, it would throw before ever reaching the collision check).
- `container._map` is the collision grid directly (`layerValue.data`), not wrapped — `pathfinding.js`'s `_isBlocked`/`setupNavGrid` read `layer._map` directly, confirmed by re-reading `pathfinding.js`'s `setupNavGrid` implementation.
- No PIXI sprite children are ever created for a collision layer's cells, regardless of the numeric value stored (confirmed by the "tile-id-like value" test).

- [ ] **Step 6: Commit**

```bash
git add src/components/Runner/engine/tilemap.js tests/components/Runner/tilemap.test.ts
git commit -m "feat: load collision layers as data-only, pathfinding-compatible layer containers"
```

---

### Task 6: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full Vitest suite**

Run: `npx vitest run`
Expected: all tests pass, no regressions outside the files touched above.

- [ ] **Step 2: Run the production build**

Run: `npx vite build`
Expected: builds cleanly with no TypeScript/build errors.

- [ ] **Step 3: Manually verify in the running app**

Start the dev server (`npm run dev`), open a project with a `.stm` asset in the Tilemap Editor (e.g. `demo-bullet-hell-shooter`'s `map1.stm`), and confirm:
- Clicking "+solid" in the Layers panel adds a new collision layer, badged "solid" in the list.
- Selecting it shows a `CollisionCanvas` — clicking/dragging paints cells with a translucent red fill; other layers are visible dimmed underneath, matching the existing layer-compositing behavior.
- Saving, then reopening the tilemap (close and reopen the asset), the painted collision cells persist.
- Exporting the tilemap (the Export button from the earlier single-`.stm`-export feature) downloads a `.stm` file whose JSON shows `{"type":"collision","data":[[...]]}` for the new layer — confirm by inspecting the downloaded file's contents directly.

- [ ] **Step 4: Release notes / version bump — not needed yet**

This is an editor-UI feature and will need a `src/docs/release-notes.md` entry and `package.json` patch bump per `CLAUDE.md`'s versioning rule — but only when explicitly asked to push. No action here.

- [ ] **Step 5: Note for the next plan**

Component 2 (kinematic sprite movement — `setVelocity`, `collision.setupTileCollision`, `isBlockedUp/Down/Left/Right`) depends on this collision layer existing and is a separate, follow-up implementation plan per `docs/superpowers/specs/2026-08-12-kinematic-tile-collision-design.md`'s sequencing note. Not part of this plan.
