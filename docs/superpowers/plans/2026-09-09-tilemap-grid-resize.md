# Tilemap Grid Resize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user change a tilemap's grid dimensions (rows × columns) from inside the Tilemap Editor, top-left anchored, with a confirmation step when shrinking would discard painted content.

**Architecture:** A pure `resize.ts` module reshapes every dense layer (`resizeGrid`), reshapes a whole doc (`resizeStmDoc`), and reports what a shrink would discard (`describeResizeLoss`). A self-contained `ResizeTilemapDialog` portal component (same pattern as `TilemapChooserModal`) drives the form → confirm flow. `index.tsx` adds a toolbar button, one state flag, and one handler. No `.stm` file-format change — dimensions stay implicit in each layer's array shape.

**Tech Stack:** TypeScript, React 18 (no JSX transform — every `.tsx` needs `import React from 'react'`), Vitest + `@testing-library/react` + `@testing-library/user-event`, Tailwind with `ds-*` design tokens.

---

## Background for the implementer

- The editor derives the grid size from the **first tile layer's** array shape:
  `gridRows = firstTileLayer?.data.length ?? 1`, `gridCols = firstTileLayer?.data[0]?.length ?? 1`
  (`src/components/TileMapEditor/index.tsx` ~line 230).
- Layer shapes (`src/components/TileMapEditor/types.ts`):
  ```ts
  export type MarkerEntry = { row: number; col: number; tag: string };
  export type EditorLayer =
    | { key: string; name: string; kind: 'tile'; data: number[][] }
    | { key: string; name: string; kind: 'marker'; markers: MarkerEntry[] }
    | { key: string; name: string; kind: 'collision'; data: number[][] };
  export type StmDoc = {
    tileWidth: number; tileHeight: number; tileImage: string;
    tags?: string[]; layers: EditorLayer[];
  };
  ```
- Tile `0` means "empty". Collision `0` means "not solid".
- Modal pattern to copy: `src/components/TileMapEditor/TilemapChooserModal.tsx` — `ReactDOM.createPortal` into `document.body`, a `fixed inset-0 bg-black/60` backdrop that calls the close handler when the click target is the backdrop itself, and an inner `<div role="dialog" aria-modal="true" aria-label="…" className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl">`.
- Number-input pattern to copy: `src/components/TileMapEditor/NewTilemapDialog.tsx` — `type="number" min={1}`, `onChange={(e) => setX(Number(e.target.value))}`, clamped/validated only on submit.
- Design tokens available: `ds-bg`, `ds-surface`, `ds-surface-2`, `ds-border`, `ds-text`, `ds-text-muted`, `ds-text-dim`, `ds-accent`, `ds-accent-subtle`, `ds-error`, `ds-error-bg`. Primary buttons use `bg-accent-gradient text-white`.
- Test helpers in `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`:
  - `STM_JSON` — a doc with `tileWidth/tileHeight: 8`, `tileImage: 'tileset.png'`, and two 2×2 tile layers `background` (`[[1,1],[1,1]]`) and `foreground` (`[[0,0],[0,0]]`).
  - `renderEditor(asset?, onDirtyChange?, stmJson?)` — mounts the editor in a Redux provider, seeds the blob store, awaits `findByText('background')`, returns `{ store }`.
  - `readSavedStm(id = 'm1')` — parses the `.stm` JSON the editor saved back to the blob store.
  - `beforeEach` stubs `Image`, `ResizeObserver`, canvas context, `URL.createObjectURL`.

## File Structure

- **Create** `src/components/TileMapEditor/resize.ts` — pure grid/doc reshaping + loss reporting. No React.
- **Create** `src/components/TileMapEditor/ResizeTilemapDialog.tsx` — the portal dialog (form + confirm steps). Owns its own input state; calls back with final numbers.
- **Modify** `src/components/TileMapEditor/index.tsx` — import the two new modules, add `showResize` state, `handleResize`, a `Resize` toolbar button, and render the dialog.
- **Create** `tests/ui/components/TileMapEditor/resize.test.ts` — unit tests for `resize.ts`.
- **Create** `tests/ui/components/TileMapEditor/ResizeTilemapDialog.test.tsx` — component tests for the dialog in isolation.
- **Modify** `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx` — integration tests for the wired-up button.

---

## Task 1: `resizeGrid` — reshape a dense grid

**Files:**
- Create: `src/components/TileMapEditor/resize.ts`
- Test: `tests/ui/components/TileMapEditor/resize.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/ui/components/TileMapEditor/resize.test.ts`:

```ts
import { describe, test, expect } from 'vitest';
import { resizeGrid } from '../../../../src/components/TileMapEditor/resize';

describe('resizeGrid', () => {
  test('growing rows pads new rows with zeros, keeps existing rows', () => {
    expect(resizeGrid([[1, 2], [3, 4]], 3, 2)).toEqual([[1, 2], [3, 4], [0, 0]]);
  });

  test('growing columns pads new columns with zeros', () => {
    expect(resizeGrid([[1, 2], [3, 4]], 2, 4)).toEqual([[1, 2, 0, 0], [3, 4, 0, 0]]);
  });

  test('growing both dimensions', () => {
    expect(resizeGrid([[5]], 2, 3)).toEqual([[5, 0, 0], [0, 0, 0]]);
  });

  test('shrinking rows trims from the bottom', () => {
    expect(resizeGrid([[1, 2], [3, 4], [5, 6]], 2, 2)).toEqual([[1, 2], [3, 4]]);
  });

  test('shrinking columns trims from the right', () => {
    expect(resizeGrid([[1, 2, 3], [4, 5, 6]], 2, 2)).toEqual([[1, 2], [4, 5]]);
  });

  test('top-left values are preserved on any resize', () => {
    expect(resizeGrid([[9, 8], [7, 6]], 1, 1)).toEqual([[9]]);
  });

  test('shrink then grow does not resurrect trimmed values', () => {
    const shrunk = resizeGrid([[1, 2], [3, 4]], 1, 1);
    expect(resizeGrid(shrunk, 2, 2)).toEqual([[1, 0], [0, 0]]);
  });

  test('returns a fresh nested array (no shared row references)', () => {
    const src = [[1, 2]];
    const out = resizeGrid(src, 1, 2);
    out[0][0] = 99;
    expect(src[0][0]).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/resize.test.ts`
Expected: FAIL — `resizeGrid` is not exported / module not found.

- [ ] **Step 3: Implement `resizeGrid`**

Create `src/components/TileMapEditor/resize.ts`:

```ts
import { StmDoc } from './types';

/**
 * Reshape a dense grid to `rows` x `cols`. Existing values are kept where their
 * row and column still fit (top-left anchored); every new cell is `0`.
 */
export function resizeGrid(data: number[][], rows: number, cols: number): number[][] {
  const out: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const srcRow = data[r] ?? [];
    const row: number[] = [];
    for (let c = 0; c < cols; c++) row.push(srcRow[c] ?? 0);
    out.push(row);
  }
  return out;
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/resize.test.ts`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/resize.ts tests/ui/components/TileMapEditor/resize.test.ts
git commit -m "$(cat <<'EOF'
feat(tilemap-editor): resizeGrid — top-left-anchored dense grid reshape

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `resizeStmDoc` — reshape a whole doc

**Files:**
- Modify: `src/components/TileMapEditor/resize.ts`
- Test: `tests/ui/components/TileMapEditor/resize.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/ui/components/TileMapEditor/resize.test.ts` (add `resizeStmDoc` and `StmDoc` to imports):

```ts
import { resizeGrid, resizeStmDoc } from '../../../../src/components/TileMapEditor/resize';
import { StmDoc } from '../../../../src/components/TileMapEditor/types';
```

```ts
describe('resizeStmDoc', () => {
  const doc: StmDoc = {
    tileWidth: 8, tileHeight: 8, tileImage: 'tiles.png', tags: ['spawn', 'exit'],
    layers: [
      { key: 'k1', name: 'ground', kind: 'tile', data: [[1, 2], [3, 4]] },
      { key: 'k2', name: 'solid', kind: 'collision', data: [[1, 0], [0, 1]] },
      { key: 'k3', name: 'marks', kind: 'marker', markers: [
        { row: 0, col: 0, tag: 'spawn' },
        { row: 1, col: 1, tag: 'exit' },
      ] },
    ],
  };

  test('reshapes every dense layer to the new size', () => {
    const out = resizeStmDoc(doc, 3, 3);
    expect((out.layers[0] as { data: number[][] }).data).toEqual([[1, 2, 0], [3, 4, 0], [0, 0, 0]]);
    expect((out.layers[1] as { data: number[][] }).data).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 0]]);
  });

  test('drops markers that fall outside the new bounds, keeps the rest', () => {
    const out = resizeStmDoc(doc, 1, 1);
    expect((out.layers[2] as { markers: unknown[] }).markers).toEqual([{ row: 0, col: 0, tag: 'spawn' }]);
  });

  test('a marker exactly on the new edge is dropped (indices are 0-based)', () => {
    const out = resizeStmDoc(doc, 1, 2);
    expect((out.layers[2] as { markers: unknown[] }).markers).toEqual([{ row: 0, col: 0, tag: 'spawn' }]);
  });

  test('preserves tags, tile size, image, and every layer key/name/kind', () => {
    const out = resizeStmDoc(doc, 2, 2);
    expect(out.tags).toEqual(['spawn', 'exit']);
    expect(out.tileWidth).toBe(8);
    expect(out.tileHeight).toBe(8);
    expect(out.tileImage).toBe('tiles.png');
    expect(out.layers.map((l) => [l.key, l.name, l.kind])).toEqual([
      ['k1', 'ground', 'tile'], ['k2', 'solid', 'collision'], ['k3', 'marks', 'marker'],
    ]);
  });

  test('resizing to the current size is a no-op in content terms', () => {
    const out = resizeStmDoc(doc, 2, 2);
    expect((out.layers[0] as { data: number[][] }).data).toEqual([[1, 2], [3, 4]]);
    expect((out.layers[2] as { markers: unknown[] }).markers).toEqual(doc.layers[2].kind === 'marker' ? doc.layers[2].markers : []);
  });

  test('does not mutate the input doc', () => {
    resizeStmDoc(doc, 1, 1);
    expect((doc.layers[0] as { data: number[][] }).data).toEqual([[1, 2], [3, 4]]);
    expect((doc.layers[2] as { markers: unknown[] }).markers).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/resize.test.ts`
Expected: FAIL — `resizeStmDoc` is not exported.

- [ ] **Step 3: Implement `resizeStmDoc`**

Append to `src/components/TileMapEditor/resize.ts`:

```ts
/**
 * Reshape every layer of a doc to the new grid size. Tile and collision layers
 * go through `resizeGrid`; marker layers drop any marker whose row or column
 * now falls outside the grid. All other fields (tags, tile size, image, layer
 * identity) are carried through unchanged. The input doc is not mutated.
 */
export function resizeStmDoc(doc: StmDoc, rows: number, cols: number): StmDoc {
  return {
    ...doc,
    layers: doc.layers.map((l) => {
      if (l.kind === 'tile') return { ...l, data: resizeGrid(l.data, rows, cols) };
      if (l.kind === 'collision') return { ...l, data: resizeGrid(l.data, rows, cols) };
      return { ...l, markers: l.markers.filter((m) => m.row < rows && m.col < cols) };
    }),
  };
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/resize.test.ts`
Expected: PASS — 14 tests total.

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/resize.ts tests/ui/components/TileMapEditor/resize.test.ts
git commit -m "$(cat <<'EOF'
feat(tilemap-editor): resizeStmDoc — reshape all layers, crop out-of-bounds markers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `describeResizeLoss` — what a shrink would discard

**Files:**
- Modify: `src/components/TileMapEditor/resize.ts`
- Test: `tests/ui/components/TileMapEditor/resize.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/ui/components/TileMapEditor/resize.test.ts` (add `describeResizeLoss` to the import from `resize`):

```ts
describe('describeResizeLoss', () => {
  const doc: StmDoc = {
    tileWidth: 8, tileHeight: 8, tileImage: 'tiles.png',
    layers: [
      { key: 'k1', name: 'ground', kind: 'tile', data: [[1, 1, 0], [1, 0, 0], [0, 0, 0]] },
      { key: 'k2', name: 'solid', kind: 'collision', data: [[0, 0, 1], [0, 0, 0], [0, 0, 0]] },
      { key: 'k3', name: 'marks', kind: 'marker', markers: [
        { row: 0, col: 0, tag: 'a' },
        { row: 2, col: 2, tag: 'b' },
      ] },
    ],
  };

  test('growing in both dimensions discards nothing', () => {
    expect(describeResizeLoss(doc, 5, 5)).toEqual({ tiles: 0, collisionCells: 0, markers: 0 });
  });

  test('shrinking counts non-zero tiles outside the new bounds', () => {
    // Cols -> 2 drops the tile at (0,2)? it is 0, so not counted; tile at (0,1)=1 stays.
    // Rows -> 1 drops row 1 which has a 1 at (1,0).
    expect(describeResizeLoss(doc, 1, 3)).toEqual({ tiles: 1, collisionCells: 0, markers: 0 });
  });

  test('empty (zero) cells outside the new bounds are not counted', () => {
    expect(describeResizeLoss(doc, 2, 2)).toEqual({ tiles: 0, collisionCells: 1, markers: 1 });
  });

  test('counts collision cells and markers independently', () => {
    expect(describeResizeLoss(doc, 1, 1)).toEqual({ tiles: 1, collisionCells: 1, markers: 1 });
  });

  test('a marker exactly on the new edge counts as lost', () => {
    expect(describeResizeLoss(doc, 2, 3).markers).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/resize.test.ts`
Expected: FAIL — `describeResizeLoss` is not exported.

- [ ] **Step 3: Implement `describeResizeLoss`**

Append to `src/components/TileMapEditor/resize.ts`:

```ts
export type ResizeLoss = { tiles: number; collisionCells: number; markers: number };

/**
 * Count what resizing to `rows` x `cols` would permanently discard: non-zero
 * tiles, non-zero collision cells, and markers whose row/col is now outside the
 * grid. Growing (or keeping) both dimensions always returns all zeros.
 */
export function describeResizeLoss(doc: StmDoc, rows: number, cols: number): ResizeLoss {
  const loss: ResizeLoss = { tiles: 0, collisionCells: 0, markers: 0 };
  for (const l of doc.layers) {
    if (l.kind === 'marker') {
      loss.markers += l.markers.filter((m) => m.row >= rows || m.col >= cols).length;
      continue;
    }
    for (let r = 0; r < l.data.length; r++) {
      const dataRow = l.data[r] ?? [];
      for (let c = 0; c < dataRow.length; c++) {
        if ((r >= rows || c >= cols) && dataRow[c] !== 0) {
          if (l.kind === 'tile') loss.tiles += 1;
          else loss.collisionCells += 1;
        }
      }
    }
  }
  return loss;
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/resize.test.ts`
Expected: PASS — 19 tests total.

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/resize.ts tests/ui/components/TileMapEditor/resize.test.ts
git commit -m "$(cat <<'EOF'
feat(tilemap-editor): describeResizeLoss — count content a shrink would discard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `ResizeTilemapDialog` component

**Files:**
- Create: `src/components/TileMapEditor/ResizeTilemapDialog.tsx`
- Test: `tests/ui/components/TileMapEditor/ResizeTilemapDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/ui/components/TileMapEditor/ResizeTilemapDialog.test.tsx`:

```tsx
// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import ResizeTilemapDialog from '../../../../src/components/TileMapEditor/ResizeTilemapDialog';

const noLoss = () => ({ tiles: 0, collisionCells: 0, markers: 0 });

function setup(overrides: Partial<React.ComponentProps<typeof ResizeTilemapDialog>> = {}) {
  const onApply = vi.fn();
  const onCancel = vi.fn();
  render(
    <ResizeTilemapDialog
      currentRows={4}
      currentCols={5}
      describeLoss={noLoss}
      onApply={onApply}
      onCancel={onCancel}
      {...overrides}
    />
  );
  return { onApply, onCancel };
}

describe('ResizeTilemapDialog', () => {
  test('prefills the inputs with the current size', () => {
    setup();
    expect(screen.getByLabelText('Rows')).toHaveValue(4);
    expect(screen.getByLabelText('Columns')).toHaveValue(5);
  });

  test('Apply is disabled until a value changes', async () => {
    setup();
    const apply = screen.getByRole('button', { name: 'Apply' });
    expect(apply).toBeDisabled();
    await userEvent.clear(screen.getByLabelText('Rows'));
    await userEvent.type(screen.getByLabelText('Rows'), '6');
    expect(apply).toBeEnabled();
  });

  test('a non-destructive Apply calls onApply immediately with clamped integers', async () => {
    const { onApply } = setup();
    await userEvent.clear(screen.getByLabelText('Rows'));
    await userEvent.type(screen.getByLabelText('Rows'), '8');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith(8, 5);
  });

  test('a destructive Apply shows a confirm step naming only non-zero losses', async () => {
    const { onApply } = setup({ describeLoss: () => ({ tiles: 4, collisionCells: 0, markers: 1 }) });
    await userEvent.clear(screen.getByLabelText('Rows'));
    await userEvent.type(screen.getByLabelText('Rows'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByText('This removes 4 painted tiles and 1 marker. Continue?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onApply).toHaveBeenCalledWith(2, 5);
  });

  test('Back returns from the confirm step without applying', async () => {
    const { onApply } = setup({ describeLoss: () => ({ tiles: 1, collisionCells: 0, markers: 0 }) });
    await userEvent.clear(screen.getByLabelText('Rows'));
    await userEvent.type(screen.getByLabelText('Rows'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText('Rows')).toHaveValue(1);
    expect(onApply).not.toHaveBeenCalled();
  });

  test('Cancel and Escape call onCancel', async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  test('values below 1 or blank are clamped to 1 on Apply', async () => {
    const { onApply } = setup();
    await userEvent.clear(screen.getByLabelText('Rows'));
    await userEvent.type(screen.getByLabelText('Rows'), '0');
    await userEvent.clear(screen.getByLabelText('Columns'));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledWith(1, 1);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/ResizeTilemapDialog.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/components/TileMapEditor/ResizeTilemapDialog.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { ResizeLoss } from './resize';

type Props = {
  currentRows: number;
  currentCols: number;
  describeLoss: (rows: number, cols: number) => ResizeLoss;
  onApply: (rows: number, cols: number) => void;
  onCancel: () => void;
};

const clampDim = (n: number) => Math.max(1, Math.floor(Number.isFinite(n) && n > 0 ? n : 1));

function lossSentence(loss: ResizeLoss): string {
  const parts: string[] = [];
  if (loss.tiles) parts.push(`${loss.tiles} painted tile${loss.tiles === 1 ? '' : 's'}`);
  if (loss.collisionCells) parts.push(`${loss.collisionCells} collision cell${loss.collisionCells === 1 ? '' : 's'}`);
  if (loss.markers) parts.push(`${loss.markers} marker${loss.markers === 1 ? '' : 's'}`);
  const joined =
    parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return `This removes ${joined}. Continue?`;
}

const ResizeTilemapDialog: React.FC<Props> = ({ currentRows, currentCols, describeLoss, onApply, onCancel }) => {
  const [rows, setRows] = useState(currentRows);
  const [cols, setCols] = useState(currentCols);
  const [step, setStep] = useState<'form' | 'confirm'>('form');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const applyRows = clampDim(rows);
  const applyCols = clampDim(cols);
  const unchanged = applyRows === currentRows && applyCols === currentCols;
  const loss = describeLoss(applyRows, applyCols);
  const isDestructive = loss.tiles + loss.collisionCells + loss.markers > 0;

  const handleApply = () => {
    if (unchanged) return;
    if (isDestructive) { setStep('confirm'); return; }
    onApply(applyRows, applyCols);
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Resize tilemap"
        className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
      >
        <h2 className="text-ds-text text-lg font-semibold mb-4">Resize tilemap</h2>

        {step === 'form' ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-ds-text-muted mb-1" htmlFor="resize-rows">Rows</label>
                <input
                  id="resize-rows"
                  type="number"
                  min={1}
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-ds-text text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-ds-text-muted mb-1" htmlFor="resize-cols">Columns</label>
                <input
                  id="resize-cols"
                  type="number"
                  min={1}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full bg-ds-bg border border-ds-border rounded px-2 py-1 text-ds-text text-sm"
                />
              </div>
            </div>
            <p className="text-ds-text-dim text-xs mb-4">
              Content stays anchored to the top-left. Larger pads empty cells; smaller trims from the bottom and right.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleApply}
                disabled={unchanged}
                className="bg-accent-gradient text-white text-sm px-4 py-2 rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-ds-text text-sm mb-4">{lossSentence(loss)}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => onApply(applyRows, applyCols)}
                className="border border-ds-error text-ds-error text-sm px-4 py-2 rounded hover:bg-ds-error-bg transition"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
              >
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

export default ResizeTilemapDialog;
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/ResizeTilemapDialog.test.tsx`
Expected: PASS — 7 tests.

Note: `toHaveValue(4)` matches a number input whose value is `4`. `userEvent.clear` then `type('0')` leaves the input at `0`; `clampDim` maps it to `1` at Apply time. A blank input yields `Number('') === 0` → also `1`.

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/ResizeTilemapDialog.tsx tests/ui/components/TileMapEditor/ResizeTilemapDialog.test.tsx
git commit -m "$(cat <<'EOF'
feat(tilemap-editor): ResizeTilemapDialog — form + destructive-confirm flow

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Wire the Resize button into the editor

**Files:**
- Modify: `src/components/TileMapEditor/index.tsx`
- Test: `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`

- [ ] **Step 1: Write the failing integration tests**

In `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`, add a new `describe` block at the end of the file (before the final closing brace of the file if there is a top-level `describe` — otherwise as a new top-level block). Place it after the existing `describe('TileMapEditor — marker layers', ...)` block:

```tsx
describe('TileMapEditor — resize', () => {
  test('the Resize button opens a dialog prefilled with the current grid size', async () => {
    await renderEditor(); // STM_JSON is a 2x2 grid
    await userEvent.click(screen.getByRole('button', { name: 'Resize' }));
    expect(screen.getByRole('dialog', { name: 'Resize tilemap' })).toBeInTheDocument();
    expect(screen.getByLabelText('Rows')).toHaveValue(2);
    expect(screen.getByLabelText('Columns')).toHaveValue(2);
  });

  test('growing the grid makes the new cells paintable and saves the new shape', async () => {
    await renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Resize' }));
    await userEvent.clear(screen.getByLabelText('Rows'));
    await userEvent.type(screen.getByLabelText('Rows'), '3');
    await userEvent.clear(screen.getByLabelText('Columns'));
    await userEvent.type(screen.getByLabelText('Columns'), '3');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    // New bottom-right cell now exists on the active tile layer.
    expect(screen.getByLabelText('Row 2, Column 2')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.background).toEqual([[1, 1, 0], [1, 1, 0], [0, 0, 0]]);
    expect(decoded.layers.foreground).toEqual([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
  });

  test('shrinking over painted tiles shows a confirm step; Confirm applies it', async () => {
    await renderEditor(); // background is [[1,1],[1,1]] — every cell painted
    await userEvent.click(screen.getByRole('button', { name: 'Resize' }));
    await userEvent.clear(screen.getByLabelText('Rows'));
    await userEvent.type(screen.getByLabelText('Rows'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByText('This removes 2 painted tiles. Continue?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.background).toEqual([[1, 1]]);
  });

  test('Back then Cancel leaves the grid untouched', async () => {
    const onDirtyChange = vi.fn();
    await renderEditor(makeStmAsset(), onDirtyChange);
    await userEvent.click(screen.getByRole('button', { name: 'Resize' }));
    await userEvent.clear(screen.getByLabelText('Rows'));
    await userEvent.type(screen.getByLabelText('Rows'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog', { name: 'Resize tilemap' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Row 1, Column 1')).toBeInTheDocument(); // 2x2 grid intact
    expect(onDirtyChange).not.toHaveBeenCalledWith('m1', true);
  });

  test('shrinking that only drops empty cells applies with no confirm step', async () => {
    // A 2x3 grid whose right-hand column is entirely empty.
    const emptyRightCol = JSON.stringify({
      tileWidth: 8, tileHeight: 8, tileImage: 'tileset.png',
      layers: { background: [[1, 1, 0], [1, 1, 0]] },
    });
    await renderEditor(makeStmAsset(), vi.fn(), emptyRightCol);
    await userEvent.click(screen.getByRole('button', { name: 'Resize' }));
    await userEvent.clear(screen.getByLabelText('Columns'));
    await userEvent.type(screen.getByLabelText('Columns'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    // No confirm step — dialog closed straight away.
    expect(screen.queryByText(/Continue\?/)).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Resize tilemap' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.background).toEqual([[1, 1], [1, 1]]);
  });

  test('the Resize button is disabled when the tilemap has no tile layer', async () => {
    const markersOnly = JSON.stringify({
      tileWidth: 8, tileHeight: 8, tileImage: 'tileset.png',
      layers: { marks: { type: 'markers', markers: [] } },
    });
    await renderEditor(makeStmAsset(), vi.fn(), markersOnly);
    expect(screen.getByRole('button', { name: 'Resize' })).toBeDisabled();
  });
});
```

Note on the fifth test: `renderEditor` awaits `findByText('background')`, so a `markersOnly` doc would hang that helper. The sixth test therefore cannot use the standard `renderEditor`. Replace the sixth test body with a direct render:

```tsx
  test('the Resize button is disabled when the tilemap has no tile layer', async () => {
    const markersOnly = JSON.stringify({
      tileWidth: 8, tileHeight: 8, tileImage: 'tileset.png',
      layers: { marks: { type: 'markers', markers: [{ row: 0, col: 0, tag: 'x' }] } },
    });
    const store = configureStore({ reducer: { assets: assetsReducer } });
    const asset = makeStmAsset();
    await putAssetBlob(asset.id, new Blob([markersOnly], { type: 'application/json' }));
    await putAssetBlob('t1', new Blob(['x'], { type: 'image/png' }));
    store.dispatch(addAsset(makeTilesetAsset()));
    store.dispatch(addAsset(asset));
    render(
      <Provider store={store}>
        <TileMapEditor asset={asset} onDirtyChange={vi.fn()} />
      </Provider>
    );
    expect(await screen.findByRole('button', { name: 'Resize' })).toBeDisabled();
  });
```

(`configureStore`, `assetsReducer`, `addAsset`, `Provider`, `makeTilesetAsset`, `putAssetBlob` are already imported at the top of this test file.)

- [ ] **Step 2: Run the tests, verify they fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`
Expected: FAIL — no button named "Resize".

- [ ] **Step 3: Wire it into `index.tsx`**

3a. Add imports near the other local imports (after `import LayersPanel from './LayersPanel';`):

```tsx
import ResizeTilemapDialog from './ResizeTilemapDialog';
import { resizeStmDoc, describeResizeLoss } from './resize';
```

3b. Add state next to the other `useState` calls (after the `hoverCell` line):

```tsx
  const [showResize, setShowResize] = useState(false);
```

3c. Add the handler immediately after `handleSave` (the `const handleSave = async () => { ... };` block):

```tsx
  const handleResize = (rows: number, cols: number) => {
    setDraftDoc((prev) => resizeStmDoc(prev, rows, cols));
    setIsDirty(true);
    setSelectedCell((prev) => (prev && (prev.row >= rows || prev.col >= cols) ? null : prev));
    setHoverCell(null);
    setShowResize(false);
  };
```

3d. Add the `Resize` button in the toolbar, immediately before the `Export` button:

```tsx
            <button
              type="button"
              onClick={() => setShowResize(true)}
              disabled={!firstTileLayer}
              title={firstTileLayer ? undefined : 'Add a tile layer to resize'}
              className="border border-ds-border text-ds-text text-sm px-4 py-1.5 rounded hover:bg-ds-surface transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resize
            </button>
```

3e. Render the dialog. Immediately before the final `</div>` that closes the root `<div className="flex h-full">` (i.e. right after the closing `</div>` of the `<div className="w-48 flex-shrink-0 border-l border-ds-border">` that wraps `<LayersPanel />`):

```tsx
      {showResize && firstTileLayer && (
        <ResizeTilemapDialog
          currentRows={gridRows}
          currentCols={gridCols}
          describeLoss={(rows, cols) => describeResizeLoss(draftDoc, rows, cols)}
          onApply={handleResize}
          onCancel={() => setShowResize(false)}
        />
      )}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`
Expected: PASS — all existing tests plus the 6 new ones.

- [ ] **Step 5: Run the whole editor test folder + build**

Run: `npx vitest run tests/ui/components/TileMapEditor tests/integration/tilemapMarkersRoundTrip.test.ts`
Expected: PASS.

Run: `npx vite build`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/TileMapEditor/index.tsx tests/ui/components/TileMapEditor/TileMapEditor.test.tsx
git commit -m "$(cat <<'EOF'
feat(tilemap-editor): Resize button — change grid dimensions in-editor

Adds a Resize control to the editor toolbar. Enter new total rows/cols
(top-left anchored); larger pads empty cells, smaller trims from the
bottom/right. A confirm step lists any painted tiles / collision cells /
markers a shrink would discard, since the editor has no undo yet.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the entire test suite**

Run: `npx vitest run`
Expected: exit 0, no failures. (Skipped tests are fine.)

- [ ] **Step 2: Build**

Run: `npx vite build`
Expected: exit 0.

- [ ] **Step 3: Manual smoke (optional, if a dev server is convenient)**

`npm run dev`, open a tilemap, click **Resize**, grow to a larger grid, paint a new cell, shrink back with the confirm step, Save. Confirm the saved `.stm` reflects the new shape.

---

## Release / docs (only when the user asks to push)

Per `CLAUDE.md`:
- Add a `src/docs/release-notes.md` entry under a new patch version, e.g.:
  > ### Tilemap editor: resize the grid
  > - A **Resize** button in the toolbar changes a tilemap's rows and columns. Enter the new totals — content stays anchored to the top-left, larger pads empty cells, smaller trims from the bottom and right. Shrinking that would discard painted tiles, collision cells, or markers asks for confirmation first.
- Bump `package.json` `version` (patch) and commit both as `chore: bump version to x.y.z`.
- No API-reference / Language-Guide change — this is editor-only and the `.stm` format is unchanged.
- Optional: add a one-line note to `docs/roadmap.md` under tilemap-editor work.

---

## Self-Review notes (for the implementer, already applied)

- **Spec coverage:** UX flow → Task 4 + Task 5; `resizeStmDoc`/`resizeGrid`/`describeResizeLoss` → Tasks 1-3; editor wiring + `selectedCell`/`hoverCell` clearing + no-tile-layer disable → Task 5; testing → every task; docs/release → final section.
- **Type consistency:** `ResizeLoss` is defined in Task 3 and imported by name in Task 4. `resizeStmDoc` / `describeResizeLoss` / `resizeGrid` names are used identically in `index.tsx` (Task 5) and tests.
- **`describeLoss` prop vs `describeResizeLoss` function:** the dialog prop is deliberately named `describeLoss` (a pre-bound closure over `draftDoc`); the module function is `describeResizeLoss`. Task 5 step 3e binds one to the other.
- **Known nuance:** `describeResizeLoss` runs against `draftDoc` (all layers), not just the active layer — so shrinking while a blank layer is active still warns about painted tiles on other layers. The "shrinking over painted tiles" test in Task 5 covers the destructive path; the "only drops empty cells" test covers the non-destructive path with a purpose-built fixture whose trimmed column is empty across every layer.
