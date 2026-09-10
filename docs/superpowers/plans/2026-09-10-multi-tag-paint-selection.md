# Multi-tag Paint Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the Tilemap Editor's marker-layer paint mode, let the user load several tags at once (click a chip to toggle, click again to deselect) and stamp all loaded tags when painting; keep an explicit, mutually-exclusive Eraser.

**Architecture:** Replace the single `selectedTag: string | null` with `selectedTags: string[]` + `eraserActive: boolean` in `index.tsx`. `TagPicker`'s paint branch swaps its two props (`selectedTag`/`onSelectTag`) for `selectedTags` / `eraserActive` / `onToggleTag` / `onSelectEraser`. The marker paint handler merges every loaded tag a cell lacks; the eraser clears a cell; neither → no-op. The Select-tool / cell-inspector branch of `TagPicker` is untouched (already multi-tag). No `.stm` format change.

**Tech Stack:** TypeScript, React 18 (every `.tsx` needs `import React from 'react';`), Vitest + `@testing-library/react` + `@testing-library/user-event`, Tailwind `ds-*` tokens.

---

## Background for the implementer

`TagPicker` (`src/components/TileMapEditor/TagPicker.tsx`) renders three mutually-exclusive UIs:
- **editing-cell** (`selectMode && selectedCell`) — cell inspector with removable chips. **Do not touch.**
- **select, no cell** (`selectMode && !selectedCell`) — renders `null` here. **Do not touch.**
- **paint** (`!selectMode`) — the Eraser button + tag chips + "new tag name" input. **This is what changes.**

The props `selectedTag` and `onSelectTag` are used **only** by the paint branch. `onToggleCellTag` / `cellTags` / `onClearCell` / `onDeselectCell` belong to the editing-cell branch and stay as-is. `tagsInUse` / `onRemoveTag` (the unused-tag delete `×`) also stay as-is.

`index.tsx` current paint-relevant code:
- `const [selectedTag, setSelectedTag] = useState<string | null>(null);` (line ~122)
- `handleSelectPaintTag(tag: string | null)` (line ~207) — registers the tag, `setSelectedTag(tag)`.
- `handleRemoveTag(tag)` (line ~212) — deletes from registry, `setSelectedTag(prev => prev === tag ? null : prev)`.
- `handlePaintCell` marker branch (lines ~264-283) — `!selectedTag` erases the cell, otherwise merges the one tag.
- `markerTags` (line ~375) — `Array.from(new Set([...(draftDoc.tags ?? []), ...tagsInUse, ...(selectedTag ? [selectedTag] : [])]))`.
- `<TagPicker tags={markerTags} selectedTag={selectedTag} onSelectTag={handleSelectPaintTag} ... />` (line ~484).

`handlePaintCell` structure: `if (!activeLayer) return; if (tile) {...} else if (collision) {...} else { <marker> } setIsDirty(true);` — a `return` inside the marker `else` skips the shared `setIsDirty(true)`.

**Existing marker tests keep passing unchanged** — they type one tag then paint. Under the new model, `type 'spawn{Enter}'` loads `['spawn']` and painting merges it: identical saved output. The Eraser tests still work (Eraser clears the loaded set and erases). Only `TagPicker.test.tsx` needs rewriting (it renders `TagPicker` directly with the old props).

## File Structure

- **Modify** `src/components/TileMapEditor/TagPicker.tsx` — paint-branch props + rendering.
- **Modify** `src/components/TileMapEditor/index.tsx` — state, handlers, paint logic, `markerTags`, `<TagPicker>` wiring.
- **Rewrite** `tests/ui/components/TileMapEditor/TagPicker.test.tsx` — paint-mode tests for the new props.
- **Modify** `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx` — 4 new integration tests in the marker describe block.

This is one coupled change (renaming a prop pair across a component and its only caller); it lands in **one commit** so the tree is never left un-buildable.

---

## Task 1: Multi-tag paint selection

**Files:**
- Modify: `src/components/TileMapEditor/TagPicker.tsx`
- Modify: `src/components/TileMapEditor/index.tsx`
- Rewrite: `tests/ui/components/TileMapEditor/TagPicker.test.tsx`
- Modify: `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`

### Step 1: Rewrite `TagPicker.test.tsx` (failing)

Replace the **entire** contents of `tests/ui/components/TileMapEditor/TagPicker.test.tsx` with:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import TagPicker from '../../../../src/components/TileMapEditor/TagPicker';

const base = {
  selectedTags: [] as string[],
  eraserActive: false,
  onToggleTag: vi.fn(),
  onSelectEraser: vi.fn(),
};

describe('TagPicker (paint mode)', () => {
  test('renders a chip per tag', () => {
    render(<TagPicker {...base} tags={['spawn', 'pickup']} onToggleTag={vi.fn()} />);
    expect(screen.getByLabelText('Tag spawn')).toBeInTheDocument();
    expect(screen.getByLabelText('Tag pickup')).toBeInTheDocument();
  });

  test('clicking a chip toggles that tag', async () => {
    const onToggleTag = vi.fn();
    render(<TagPicker {...base} tags={['spawn']} onToggleTag={onToggleTag} />);
    await userEvent.click(screen.getByLabelText('Tag spawn'));
    expect(onToggleTag).toHaveBeenCalledWith('spawn');
  });

  test('several tags can be pressed at once', () => {
    render(<TagPicker {...base} tags={['spawn', 'enemy', 'pickup']} selectedTags={['spawn', 'enemy']} />);
    expect(screen.getByLabelText('Tag spawn')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Tag enemy')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Tag pickup')).toHaveAttribute('aria-pressed', 'false');
  });

  test('the Eraser reflects eraserActive, and is not pressed when tags are loaded', () => {
    const { rerender } = render(<TagPicker {...base} tags={['spawn']} eraserActive />);
    expect(screen.getByLabelText('Eraser')).toHaveAttribute('aria-pressed', 'true');
    rerender(<TagPicker {...base} tags={['spawn']} selectedTags={['spawn']} eraserActive={false} />);
    expect(screen.getByLabelText('Eraser')).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking the Eraser calls onSelectEraser', async () => {
    const onSelectEraser = vi.fn();
    render(<TagPicker {...base} tags={['spawn']} selectedTags={['spawn']} onSelectEraser={onSelectEraser} />);
    await userEvent.click(screen.getByLabelText('Eraser'));
    expect(onSelectEraser).toHaveBeenCalled();
  });

  test('typing a new tag name and pressing Enter toggles it on', async () => {
    const onToggleTag = vi.fn();
    render(<TagPicker {...base} tags={[]} onToggleTag={onToggleTag} />);
    await userEvent.type(screen.getByLabelText('New tag name'), 'boss_spawn{Enter}');
    expect(onToggleTag).toHaveBeenCalledWith('boss_spawn');
  });

  test('pressing Enter with an empty input does nothing', async () => {
    const onToggleTag = vi.fn();
    render(<TagPicker {...base} tags={[]} onToggleTag={onToggleTag} />);
    await userEvent.type(screen.getByLabelText('New tag name'), '{Enter}');
    expect(onToggleTag).not.toHaveBeenCalled();
  });

  test('typing a name that is already loaded does not toggle it back off', async () => {
    const onToggleTag = vi.fn();
    render(<TagPicker {...base} tags={['spawn']} selectedTags={['spawn']} onToggleTag={onToggleTag} />);
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    expect(onToggleTag).not.toHaveBeenCalled();
  });

  test('an unused tag can be deleted from the registry via its × affordance', async () => {
    const onRemoveTag = vi.fn();
    render(<TagPicker {...base} tags={['ghost']} tagsInUse={[]} onRemoveTag={onRemoveTag} />);
    await userEvent.click(screen.getByLabelText('Delete tag ghost from tilemap'));
    expect(onRemoveTag).toHaveBeenCalledWith('ghost');
  });
});
```

### Step 2: Run, verify it fails

Run: `npx vitest run tests/ui/components/TileMapEditor/TagPicker.test.tsx`
Expected: FAIL — `TagPicker` still expects `selectedTag`/`onSelectTag`; `aria-pressed` assertions and `onToggleTag` calls don't line up.

### Step 3: Update `TagPicker.tsx`

3a. Replace the two prop declarations (lines ~6-8):
```ts
  /** Paint mode: the tag loaded to paint with. `null` means the eraser. */
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
```
with:
```ts
  /** Paint mode: the set of tags currently loaded to stamp when painting. */
  selectedTags?: string[];
  /** Paint mode: true when the eraser is the active choice (mutually exclusive with loaded tags). */
  eraserActive?: boolean;
  /** Paint mode: add the tag to the loaded set if absent, remove it if present. */
  onToggleTag?: (tag: string) => void;
  /** Paint mode: choose the eraser (clears the loaded set). */
  onSelectEraser?: () => void;
```

3b. Replace in the destructure (lines ~28-30):
```ts
  selectedTag,
  onSelectTag,
```
with:
```ts
  selectedTags = [],
  eraserActive = false,
  onToggleTag,
  onSelectEraser,
```

3c. In `commitNewTag`, replace the `else` branch (line ~50):
```ts
    } else {
      onSelectTag(trimmed);
    }
```
with:
```ts
    } else if (!selectedTags.includes(trimmed)) {
      onToggleTag?.(trimmed);
    }
```

3d. Replace the paint-branch Eraser button (lines ~146-158):
```tsx
          <button
            type="button"
            onClick={() => onSelectTag(null)}
            aria-label="Eraser"
            aria-pressed={selectedTag === null}
            className={`text-xs px-2 py-1 rounded border ${
              selectedTag === null
                ? 'border-ds-accent text-ds-accent bg-ds-accent-subtle'
                : 'border-ds-border text-ds-text-muted hover:text-ds-text'
            }`}
          >
            Eraser
          </button>
```
with:
```tsx
          <button
            type="button"
            onClick={() => onSelectEraser?.()}
            aria-label="Eraser"
            aria-pressed={eraserActive}
            className={`text-xs px-2 py-1 rounded border ${
              eraserActive
                ? 'border-ds-accent text-ds-accent bg-ds-accent-subtle'
                : 'border-ds-border text-ds-text-muted hover:text-ds-text'
            }`}
          >
            Eraser
          </button>
```

3e. In the paint-branch tag list (lines ~159-194), replace the three `selectedTag === tag` occurrences. The block becomes:
```tsx
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => {
              const removable = !!onRemoveTag && !tagsInUse.includes(tag);
              const loaded = selectedTags.includes(tag);
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center rounded-full text-xs border ${
                    loaded
                      ? 'border-ds-accent text-ds-accent bg-ds-accent-subtle'
                      : 'border-ds-border text-ds-text-muted'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleTag?.(tag)}
                    aria-label={`Tag ${tag}`}
                    aria-pressed={loaded}
                    className={`pl-2 py-1 hover:text-ds-text ${removable ? 'pr-1' : 'pr-2'}`}
                  >
                    {tag}
                  </button>
                  {removable && (
                    <button
                      type="button"
                      onClick={() => onRemoveTag?.(tag)}
                      aria-label={`Delete tag ${tag} from tilemap`}
                      title="Unused — delete from tilemap"
                      className="pr-2 pl-0.5 py-1 text-ds-text-dim hover:text-ds-error"
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })}
          </div>
```

### Step 4: Run TagPicker tests, verify pass

Run: `npx vitest run tests/ui/components/TileMapEditor/TagPicker.test.tsx`
Expected: PASS — 9 tests.

### Step 5: Update `index.tsx`

5a. Replace the state hook (line ~122):
```ts
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
```
with:
```ts
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [eraserActive, setEraserActive] = useState(false);
```

5b. Replace `handleSelectPaintTag` (lines ~207-210):
```ts
  const handleSelectPaintTag = (tag: string | null) => {
    if (tag) registerTag(tag);
    setSelectedTag(tag);
  };
```
with:
```ts
  const handleTogglePaintTag = (tag: string) => {
    setEraserActive(false);
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      registerTag(tag);
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSelectEraser = () => {
    setSelectedTags([]);
    setEraserActive(true);
  };
```

5c. In `handleRemoveTag` (line ~214), replace:
```ts
    setSelectedTag((prev) => (prev === tag ? null : prev));
```
with:
```ts
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
```

5d. Replace the marker branch of `handlePaintCell` (lines ~264-283). Current:
```ts
    } else {
      if (selectedTag) registerTag(selectedTag);
      setDraftDoc((prev) => ({
        ...prev,
        layers: prev.layers.map((l, i) => {
          if (i !== activeIndex || l.kind !== 'marker') return l;
          // Eraser (no tag loaded) clears the cell; painting a tag merges it
          // into whatever the cell already carries rather than replacing.
          let newMarkers: MarkerEntry[];
          if (!selectedTag) {
            newMarkers = l.markers.filter((m) => !(m.row === row && m.col === col));
          } else if (l.markers.some((m) => m.row === row && m.col === col && m.tag === selectedTag)) {
            newMarkers = l.markers;
          } else {
            newMarkers = [...l.markers, { row, col, tag: selectedTag }];
          }
          return { ...l, markers: newMarkers };
        }),
      }));
    }
```
Replace with:
```ts
    } else {
      // Neither the eraser nor any tag loaded -> painting does nothing.
      if (!eraserActive && selectedTags.length === 0) return;
      setDraftDoc((prev) => ({
        ...prev,
        layers: prev.layers.map((l, i) => {
          if (i !== activeIndex || l.kind !== 'marker') return l;
          if (eraserActive) {
            return { ...l, markers: l.markers.filter((m) => !(m.row === row && m.col === col)) };
          }
          // Merge every loaded tag the cell doesn't already carry.
          const onCell = new Set(
            l.markers.filter((m) => m.row === row && m.col === col).map((m) => m.tag)
          );
          const toAdd = selectedTags.filter((t) => !onCell.has(t));
          if (toAdd.length === 0) return l;
          return { ...l, markers: [...l.markers, ...toAdd.map((tag) => ({ row, col, tag }))] };
        }),
      }));
    }
```
(`MarkerEntry` is still imported for other uses; the `let newMarkers: MarkerEntry[]` line is gone, which is fine.)

5e. In `markerTags` (line ~381), replace:
```ts
            ...(selectedTag ? [selectedTag] : []),
```
with:
```ts
            ...selectedTags,
```

5f. In the `<TagPicker>` element (lines ~484-487), replace:
```tsx
              selectedTag={selectedTag}
              onSelectTag={handleSelectPaintTag}
```
with:
```tsx
              selectedTags={selectedTags}
              eraserActive={eraserActive}
              onToggleTag={handleTogglePaintTag}
              onSelectEraser={handleSelectEraser}
```

### Step 6: Add integration tests to `TileMapEditor.test.tsx`

In `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`, inside `describe('TileMapEditor — marker layers', ...)`, add these 4 tests (place them right after the existing `test('painting the same tag twice on a cell does not duplicate it', ...)`):

```tsx
  test('multiple tags can be loaded and are all stamped on a painted cell', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    await userEvent.type(screen.getByLabelText('New tag name'), 'enemy{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect((await readSavedStm()).layers.markers3).toEqual({
      type: 'markers',
      markers: [
        { row: 0, col: 1, tag: 'spawn' },
        { row: 0, col: 1, tag: 'enemy' },
      ],
    });
  });

  test('clicking a loaded tag again deselects it; later cells only get the rest', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    await userEvent.type(screen.getByLabelText('New tag name'), 'enemy{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0')); // both land here
    await userEvent.click(screen.getByLabelText('Tag spawn'));     // deselect spawn
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1')); // enemy only
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect((await readSavedStm()).layers.markers3).toEqual({
      type: 'markers',
      markers: [
        { row: 0, col: 0, tag: 'spawn' },
        { row: 0, col: 0, tag: 'enemy' },
        { row: 0, col: 1, tag: 'enemy' },
      ],
    });
  });

  test('selecting the Eraser clears the loaded tags and erases painted cells', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'spawn{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByLabelText('Eraser'));
    expect(screen.getByLabelText('Tag spawn')).toHaveAttribute('aria-pressed', 'false');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect((await readSavedStm()).layers.markers3).toEqual({ type: 'markers', markers: [] });
  });

  test('with nothing loaded and the eraser off, painting a marker cell does nothing', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    // No marker letter rendered in either cell.
    expect(screen.getByLabelText('Row 0, Column 1')).toHaveTextContent('');
    expect(screen.getByLabelText('Row 0, Column 0')).toHaveTextContent('');
  });
```

### Step 7: Run the editor test file

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`
Expected: PASS — every existing test plus the 4 new ones.

If an existing marker test fails, read it: the new model must produce the same saved output for "type one tag, then paint" flows. Fix the implementation, not the existing test (unless the existing test genuinely asserted single-tag-replace behavior — none should).

### Step 8: Run the folder + build

Run: `npx vitest run tests/ui/components/TileMapEditor tests/integration/tilemapMarkersRoundTrip.test.ts`
Expected: PASS.

Run: `npx vite build`
Expected: exit 0.

### Step 9: Commit

```bash
git add src/components/TileMapEditor/TagPicker.tsx src/components/TileMapEditor/index.tsx tests/ui/components/TileMapEditor/TagPicker.test.tsx tests/ui/components/TileMapEditor/TileMapEditor.test.tsx
git commit -m "$(cat <<'EOF'
feat(tilemap-editor): load multiple tags before painting markers

Marker paint mode now holds a set of tags instead of one. Click a chip
to toggle it into the loaded set, click again to remove it; painting a
cell stamps every loaded tag it doesn't already carry. The Eraser is an
explicit, mutually-exclusive choice — with nothing loaded and the eraser
off, painting does nothing.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Full verification

**Files:** none.

- [ ] **Step 1: Full suite** — Run: `npx vitest run`. Expected: exit 0, no failures (skips OK).
- [ ] **Step 2: Build** — Run: `npx vite build`. Expected: exit 0.
- [ ] **Step 3: Manual smoke (optional)** — `npm run dev`, open a marker layer, load two tags, paint a run of cells, verify both letters/badges appear; click one tag off, paint more; click Eraser, wipe a cell.

---

## Release / docs (only when the user asks to push)

- `src/docs/release-notes.md` entry under a new patch version:
  > ### Tilemap editor: paint with multiple tags at once
  > - On a marker layer you can now load several tags before painting — click a tag to add it to the brush, click again to remove it. Painting a cell stamps every loaded tag. The Eraser is a separate choice; with nothing selected, painting does nothing.
- Bump `package.json` `version` (patch), commit as `chore: bump version to x.y.z`.
- No API-reference / Language-Guide change (editor-only, `.stm` unchanged).

---

## Self-Review notes (already applied)

- **Spec coverage:** state model → Step 5a-5c; toggle/eraser exclusivity → 5b + TagPicker 3d-3e; paint merge / no-op → 5d; `markerTags` → 5e; wiring → 5f; TagPicker prop swap → 3a-3e; tests → Steps 1 + 6.
- **Prop-name consistency:** `selectedTags`, `eraserActive`, `onToggleTag`, `onSelectEraser` used identically in `TagPicker.tsx` (Task 1 Step 3), its test (Step 1), and `index.tsx` (Step 5f). The handler in `index.tsx` is `handleTogglePaintTag` (not `handleSelectPaintTag`); `handleSelectEraser` is new.
- **`MarkerEntry` import:** still used elsewhere in `index.tsx` (e.g. `mutateSelectedCellMarkers`), so the import line stays; only the local `let newMarkers: MarkerEntry[]` annotation is removed.
- **Existing tests:** audited lines 244-345 of `TileMapEditor.test.tsx` — every marker test uses "type one tag, then paint" or "type tag, paint, Eraser, paint"; all produce identical saved output under the new model. `TagPicker.test.tsx` is the only file whose existing tests break (old props), hence the full rewrite in Step 1.
- **`commitNewTag`:** the editing-cell path (`onToggleCellTag`) is unchanged; only the paint path switches to `onToggleTag` with an `includes` guard so Enter always adds.
