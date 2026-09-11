# Delete an In-Use Tag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a tag be deleted from the tilemap editor's tag registry even while markers still use it, via a confirm dialog offering "delete from the list only" (registry-only) or "remove everywhere" (also strips it off every marker).

**Architecture:** A new, self-contained `DeleteTagDialog` (same portal/backdrop pattern as `ResizeTilemapDialog`) is opened from `index.tsx` when the paint-palette × is clicked on a tag that markers still use; an unused tag keeps deleting immediately with no dialog. `TagPicker`'s × stops being gated on "unused" and drops the now-unneeded `tagsInUse` prop. `markerTags` (the palette's tag list) drops its `tagsInUse` fallback so a registry-only deletion actually removes the tag from the palette. No `.stm` format change.

**Tech Stack:** TypeScript, React 18 (`.tsx` files need `import React from 'react';`), Vitest + `@testing-library/react` + `@testing-library/user-event`, Tailwind `ds-*` tokens.

---

## Background for the implementer

Current `src/components/TileMapEditor/TagPicker.tsx` paint branch (the `else selectMode ? null : (...)` branch) renders one `<span>` chip per tag with:
```tsx
const removable = !!onRemoveTag && !tagsInUse.includes(tag);
...
{removable && (
  <button ... aria-label={`Delete tag ${tag} from tilemap`} title="Unused — delete from tilemap" ...>×</button>
)}
```
`tagsInUse?: string[]` is a prop only used for that gate.

Current `src/components/TileMapEditor/index.tsx` (line numbers approximate — read the file to confirm):
- `const tagsInUse = new Set(draftDoc.layers.flatMap((l) => (l.kind === 'marker' ? l.markers.map((m) => m.tag) : [])));`
- `const markerTags = activeLayer?.kind === 'marker' ? Array.from(new Set([...(draftDoc.tags ?? []), ...tagsInUse, ...selectedTags])) : [];`
- `const handleRemoveTag = (tag: string) => { setDraftDoc((prev) => ({ ...prev, tags: (prev.tags ?? []).filter((t) => t !== tag) })); setSelectedTags((prev) => prev.filter((t) => t !== tag)); setIsDirty(true); };`
- `<TagPicker ... tagsInUse={Array.from(tagsInUse)} onRemoveTag={handleRemoveTag} ... />`
- The asset-load `useEffect` resets `activeIndex`, `isDirty`, `hiddenLayerKeys` when a new `.stm` loads.

Reference pattern — `src/components/TileMapEditor/ResizeTilemapDialog.tsx`: `ReactDOM.createPortal` into `document.body`, backdrop `<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>`, inner `<div role="dialog" aria-modal="true" aria-label="..." className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl">`, an `Escape`-key `useEffect`.

## File Structure

- **Create** `src/components/TileMapEditor/DeleteTagDialog.tsx` — the confirm dialog.
- **Create** `tests/ui/components/TileMapEditor/DeleteTagDialog.test.tsx`.
- **Modify** `src/components/TileMapEditor/TagPicker.tsx` — drop the unused-only gate and the `tagsInUse` prop.
- **Modify** `src/components/TileMapEditor/index.tsx` — rename/restructure the delete handler, add `pendingDeleteTag` state, wire the dialog.
- **Modify** `tests/ui/components/TileMapEditor/TagPicker.test.tsx` — update the one test that passed `tagsInUse`.
- **Modify** `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx` — new integration tests.

---

## Task 1: `DeleteTagDialog` component

**Files:**
- Create: `src/components/TileMapEditor/DeleteTagDialog.tsx`
- Test: `tests/ui/components/TileMapEditor/DeleteTagDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/ui/components/TileMapEditor/DeleteTagDialog.test.tsx`:

```tsx
// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import DeleteTagDialog from '../../../../src/components/TileMapEditor/DeleteTagDialog';

function setup(overrides: Partial<React.ComponentProps<typeof DeleteTagDialog>> = {}) {
  const onCancel = vi.fn();
  const onDeleteFromListOnly = vi.fn();
  const onRemoveEverywhere = vi.fn();
  render(
    <DeleteTagDialog
      tag="rogue"
      markerCount={7}
      layerCount={2}
      onCancel={onCancel}
      onDeleteFromListOnly={onDeleteFromListOnly}
      onRemoveEverywhere={onRemoveEverywhere}
      {...overrides}
    />
  );
  return { onCancel, onDeleteFromListOnly, onRemoveEverywhere };
}

describe('DeleteTagDialog', () => {
  test('names the tag and reports how many markers and layers use it', () => {
    setup();
    expect(screen.getByRole('dialog', { name: 'Delete tag rogue' })).toBeInTheDocument();
    expect(screen.getByText('"rogue" is used on 7 markers across 2 layers.')).toBeInTheDocument();
  });

  test('singular wording for exactly one marker on one layer', () => {
    setup({ markerCount: 1, layerCount: 1 });
    expect(screen.getByText('"rogue" is used on 1 marker across 1 layer.')).toBeInTheDocument();
  });

  test('clicking "Delete from list only" calls onDeleteFromListOnly', async () => {
    const { onDeleteFromListOnly } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Delete from list only' }));
    expect(onDeleteFromListOnly).toHaveBeenCalled();
  });

  test('clicking "Remove everywhere" calls onRemoveEverywhere', async () => {
    const { onRemoveEverywhere } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Remove everywhere' }));
    expect(onRemoveEverywhere).toHaveBeenCalled();
  });

  test('Cancel, backdrop click, and Escape all call onCancel', async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/DeleteTagDialog.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/TileMapEditor/DeleteTagDialog.tsx`:

```tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

type Props = {
  tag: string;
  markerCount: number;
  layerCount: number;
  onCancel: () => void;
  onDeleteFromListOnly: () => void;
  onRemoveEverywhere: () => void;
};

const DeleteTagDialog: React.FC<Props> = ({
  tag,
  markerCount,
  layerCount,
  onCancel,
  onDeleteFromListOnly,
  onRemoveEverywhere,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Delete tag ${tag}`}
        className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
      >
        <h2 className="text-ds-text text-lg font-semibold mb-4">Delete tag</h2>
        <p className="text-ds-text text-sm mb-4">
          &quot;{tag}&quot; is used on {markerCount} marker{markerCount === 1 ? '' : 's'} across{' '}
          {layerCount} layer{layerCount === 1 ? '' : 's'}.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDeleteFromListOnly}
            className="border border-ds-border text-ds-text text-sm px-4 py-2 rounded hover:bg-ds-surface transition"
          >
            Delete from list only
          </button>
          <button
            type="button"
            onClick={onRemoveEverywhere}
            className="border border-ds-error text-ds-error text-sm px-4 py-2 rounded hover:bg-ds-error-bg transition"
          >
            Remove everywhere
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteTagDialog;
```

- [ ] **Step 4: Run, verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/DeleteTagDialog.test.tsx`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/DeleteTagDialog.tsx tests/ui/components/TileMapEditor/DeleteTagDialog.test.tsx
git commit -m "$(cat <<'EOF'
feat(tilemap-editor): DeleteTagDialog — confirm before deleting an in-use tag

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Wire it up — allow deleting any tag, confirm when in use

**Files:**
- Modify: `src/components/TileMapEditor/TagPicker.tsx`
- Modify: `src/components/TileMapEditor/index.tsx`
- Modify: `tests/ui/components/TileMapEditor/TagPicker.test.tsx`
- Modify: `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`

### Step 1: Update `TagPicker.test.tsx` (failing)

Replace this existing test:
```tsx
  test('an unused tag can be deleted from the registry via its × affordance', async () => {
    const onRemoveTag = vi.fn();
    render(<TagPicker {...base} tags={['ghost']} tagsInUse={[]} onRemoveTag={onRemoveTag} />);
    await userEvent.click(screen.getByLabelText('Delete tag ghost from tilemap'));
    expect(onRemoveTag).toHaveBeenCalledWith('ghost');
  });
```
with:
```tsx
  test('any tag can be deleted via its × affordance, in use or not', async () => {
    const onRemoveTag = vi.fn();
    render(<TagPicker {...base} tags={['ghost']} onRemoveTag={onRemoveTag} />);
    await userEvent.click(screen.getByLabelText('Delete tag ghost from tilemap'));
    expect(onRemoveTag).toHaveBeenCalledWith('ghost');
  });
```
(`tagsInUse` is no longer a prop `TagPicker` reads — the test simply stops passing it. `index.tsx`, not `TagPicker`, now decides whether a delete is destructive.)

### Step 2: Run, verify it fails

Run: `npx vitest run tests/ui/components/TileMapEditor/TagPicker.test.tsx`
Expected: FAIL — `removable` is still gated on `tagsInUse`, so with no `tagsInUse` prop the × won't render (prop defaults to `[]`, `!tagsInUse.includes(tag)` is `true`... actually check: with no `tagsInUse` passed, the default is `[]`, so `!([]).includes('ghost')` is `true`, meaning the × **would** still render today). This particular test may already pass. That's fine — proceed to Step 3 regardless; the behavioral change this task makes is in `index.tsx`, and `TagPicker`'s own simplification (Step 3 below) has no observable effect on this test either way. The important new coverage is in `TileMapEditor.test.tsx` (Step 6).

### Step 3: Simplify `TagPicker.tsx`

3a. Remove the `tagsInUse` prop from the type:
```ts
  /** Tags a marker somewhere still uses — these can't be removed from the registry. */
  tagsInUse?: string[];
```
→ delete this block entirely.

3b. Remove it from the destructure: delete `tagsInUse = [],`.

3c. In the paint-branch tag list, replace:
```tsx
            {tags.map((tag) => {
              const removable = !!onRemoveTag && !tagsInUse.includes(tag);
              const loaded = selectedTags.includes(tag);
```
with:
```tsx
            {tags.map((tag) => {
              const removable = !!onRemoveTag;
              const loaded = selectedTags.includes(tag);
```

3d. Update the delete button's tooltip (the `×` button), replacing:
```tsx
                      title="Unused — delete from tilemap"
```
with:
```tsx
                      title="Delete tag from tilemap"
```

### Step 4: Run TagPicker tests, verify pass

Run: `npx vitest run tests/ui/components/TileMapEditor/TagPicker.test.tsx`
Expected: PASS — 9 tests (same count as before; the previous test was replaced, not added to).

### Step 5: Update `index.tsx`

5a. Add state right after `pendingDeleteTag`'s natural neighbors — place it next to `selectedTags`/`eraserActive`:
```ts
  const [pendingDeleteTag, setPendingDeleteTag] = useState<string | null>(null);
```

5b. In the asset-load `useEffect` (the one that does `setActiveIndex(0); setIsDirty(false); setHiddenLayerKeys(new Set());`), add:
```ts
    setPendingDeleteTag(null);
```

5c. Rename the current `handleRemoveTag` body to a plain helper, and add the click/dialog handlers. Replace:
```ts
  const handleRemoveTag = (tag: string) => {
    setDraftDoc((prev) => ({ ...prev, tags: (prev.tags ?? []).filter((t) => t !== tag) }));
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
    setIsDirty(true);
  };
```
with:
```ts
  const deleteTagFromRegistry = (tag: string) => {
    setDraftDoc((prev) => ({ ...prev, tags: (prev.tags ?? []).filter((t) => t !== tag) }));
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
    setIsDirty(true);
  };

  // Unused tags delete immediately (unchanged behavior); an in-use tag opens
  // a confirm dialog instead, since removing it can affect existing markers.
  const handleRemoveTagClick = (tag: string) => {
    if (tagsInUse.has(tag)) {
      setPendingDeleteTag(tag);
    } else {
      deleteTagFromRegistry(tag);
    }
  };

  const handleCancelDeleteTag = () => setPendingDeleteTag(null);

  const handleDeleteTagFromListOnly = () => {
    if (!pendingDeleteTag) return;
    deleteTagFromRegistry(pendingDeleteTag);
    setPendingDeleteTag(null);
  };

  const handleRemoveTagEverywhere = () => {
    if (!pendingDeleteTag) return;
    const tag = pendingDeleteTag;
    setDraftDoc((prev) => ({
      ...prev,
      tags: (prev.tags ?? []).filter((t) => t !== tag),
      layers: prev.layers.map((l) =>
        l.kind === 'marker' ? { ...l, markers: l.markers.filter((m) => m.tag !== tag) } : l
      ),
    }));
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
    setIsDirty(true);
    setPendingDeleteTag(null);
  };
```

(`tagsInUse` is declared later in the file, but since these are all function *declarations* invoked only from event handlers or JSX — never during this block's own evaluation — reading `tagsInUse` here is fine; it exists by the time any of these run. If you moved `tagsInUse`'s declaration earlier in a prior task, no action needed either way.)

5d. In `markerTags`, remove the `tagsInUse` fallback:
```ts
  const markerTags =
    activeLayer?.kind === 'marker'
      ? Array.from(
          new Set([
            ...(draftDoc.tags ?? []),
            ...tagsInUse,
            ...selectedTags,
          ])
        )
      : [];
```
→
```ts
  const markerTags =
    activeLayer?.kind === 'marker'
      ? Array.from(new Set([...(draftDoc.tags ?? []), ...selectedTags]))
      : [];
```
Update the comment above it (currently explains the `tagsInUse` fallback) to:
```ts
  // The registry plus the loaded paint tags, so picking/typing one gives
  // immediate visual confirmation. Deliberately NOT unioned with tagsInUse:
  // "delete from list only" removes a tag from here even though markers may
  // still carry it (see handleDeleteTagFromListOnly).
```

5e. Compute the pending-delete counts right before the return/JSX (near where `markerTags` is computed, or immediately before the dialog is rendered — either is fine as long as it's after `draftDoc` and `pendingDeleteTag` are in scope):
```ts
  const pendingDeleteTagStats = pendingDeleteTag
    ? (() => {
        const layersWithTag = draftDoc.layers.filter(
          (l): l is Extract<EditorLayer, { kind: 'marker' }> =>
            l.kind === 'marker' && l.markers.some((m) => m.tag === pendingDeleteTag)
        );
        const markerCount = layersWithTag.reduce(
          (sum, l) => sum + l.markers.filter((m) => m.tag === pendingDeleteTag).length,
          0
        );
        return { markerCount, layerCount: layersWithTag.length };
      })()
    : null;
```

5f. In the `<TagPicker>` element, replace:
```tsx
              tagsInUse={Array.from(tagsInUse)}
              onRemoveTag={handleRemoveTag}
```
with:
```tsx
              onRemoveTag={handleRemoveTagClick}
```

5g. Render the dialog. Add this near the other conditionally-rendered dialog (`{showResize && firstTileLayer && (<ResizeTilemapDialog .../>)}`), e.g. immediately after it:
```tsx
      {pendingDeleteTag && pendingDeleteTagStats && (
        <DeleteTagDialog
          tag={pendingDeleteTag}
          markerCount={pendingDeleteTagStats.markerCount}
          layerCount={pendingDeleteTagStats.layerCount}
          onCancel={handleCancelDeleteTag}
          onDeleteFromListOnly={handleDeleteTagFromListOnly}
          onRemoveEverywhere={handleRemoveTagEverywhere}
        />
      )}
```

5h. Add the import near the other local dialog import:
```ts
import DeleteTagDialog from './DeleteTagDialog';
```

### Step 6: Add integration tests to `TileMapEditor.test.tsx`

Add these tests inside `describe('TileMapEditor — marker layers', ...)`, after the existing tag-registry tests (e.g. right after `'an unused tag can be deleted from the registry; a used one cannot'`):

```tsx
  test('deleting an unused tag still has no confirm dialog', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'unused{Enter}');
    await userEvent.click(screen.getByLabelText('Delete tag unused from tilemap'));
    expect(screen.queryByRole('dialog', { name: /Delete tag/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Tag unused')).not.toBeInTheDocument();
  });

  test('deleting an in-use tag opens a confirm dialog with the right counts', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'rogue{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByLabelText('Delete tag rogue from tilemap'));
    expect(screen.getByRole('dialog', { name: 'Delete tag rogue' })).toBeInTheDocument();
    expect(screen.getByText('"rogue" is used on 2 markers across 1 layer.')).toBeInTheDocument();
  });

  test('Cancel on the delete-tag dialog changes nothing', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'rogue{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    await userEvent.click(screen.getByLabelText('Delete tag rogue from tilemap'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog', { name: 'Delete tag rogue' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Tag rogue')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect((await readSavedStm()).layers.markers3).toEqual({
      type: 'markers',
      markers: [{ row: 0, col: 0, tag: 'rogue' }],
    });
  });

  test('"Delete from list only" removes the tag from the palette but leaves markers alone', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'rogue{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));
    await userEvent.click(screen.getByLabelText('Delete tag rogue from tilemap'));
    await userEvent.click(screen.getByRole('button', { name: 'Delete from list only' }));

    expect(screen.queryByLabelText('Tag rogue')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect((await readSavedStm()).layers.markers3).toEqual({
      type: 'markers',
      markers: [{ row: 0, col: 0, tag: 'rogue' }],
    });
  });

  test('"Remove everywhere" deletes the tag and strips it from every marker layer', async () => {
    await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'rogue{Enter}');
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 0'));

    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers4'));
    await userEvent.click(screen.getByLabelText('Tag rogue'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));

    await userEvent.click(screen.getByLabelText('Delete tag rogue from tilemap'));
    expect(screen.getByText('"rogue" is used on 2 markers across 2 layers.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove everywhere' }));

    expect(screen.queryByLabelText('Tag rogue')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    const decoded = await readSavedStm();
    expect(decoded.layers.markers3).toEqual({ type: 'markers', markers: [] });
    expect(decoded.layers.markers4).toEqual({ type: 'markers', markers: [] });
  });
```

Notes on this test file:
- `renderEditor`, `readSavedStm`, `screen`, `userEvent`, `fireEvent` are already imported/defined at the top of the file — reuse them.
- The fifth test opens a second marker layer (`markers4` — `LayersPanel`'s auto-naming continues `markers3`, `markers4`, ... for each `Add marker layer` click) and switches to it while `rogue` is already registered from the first layer, so `Tag rogue` appears in its palette immediately (this is exactly the "tags coined on one marker layer are offered on another" behavior from an earlier feature — already covered elsewhere, reused here as setup).

### Step 7: Run the editor test file

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`
Expected: PASS — all existing tests plus the 5 new ones.

If an existing test that deletes a tag or checks `markerTags` contents fails, read it: the only intended behavior change is that a *registry-only* deletion no longer leaves the tag visible via the `tagsInUse` fallback — every other path (unused-tag delete, tags appearing after being painted/registered) must be identical to before.

### Step 8: Folder + build

Run: `npx vitest run tests/ui/components/TileMapEditor tests/integration/tilemapMarkersRoundTrip.test.ts`
Expected: PASS.

Run: `npx vite build`
Expected: exit 0.

### Step 9: Commit

```bash
git add src/components/TileMapEditor/TagPicker.tsx src/components/TileMapEditor/index.tsx tests/ui/components/TileMapEditor/TagPicker.test.tsx tests/ui/components/TileMapEditor/TileMapEditor.test.tsx
git commit -m "$(cat <<'EOF'
feat(tilemap-editor): delete an in-use tag, with a confirm dialog

The registry × now works on any tag, not just unused ones. Deleting an
unused tag is unchanged (immediate, no dialog). Deleting a tag markers
still use opens a confirm: "Delete from list only" removes it from the
paint palette without touching existing markers; "Remove everywhere"
also strips it from every marker on every layer that has it.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Full verification

**Files:** none.

- [ ] **Step 1:** `npx vitest run` → exit 0, no failures (skips OK).
- [ ] **Step 2:** `npx vite build` → exit 0.
- [ ] **Step 3 (optional manual smoke):** `npm run dev`, open a tilemap, coin a tag, paint it on a cell, try deleting it (confirm dialog appears with correct counts), try both "Delete from list only" and "Remove everywhere" on different tags to see each outcome.

---

## Release / docs (only when the user asks to push)

- `src/docs/release-notes.md` entry, e.g.:
  > ### Tilemap editor: delete a tag even if it's in use
  > - The registry delete (×) on a tag chip now works even when markers still use it. Deleting an unused tag is unchanged. Deleting an in-use tag asks first: **Delete from list only** stops offering it to paint with but leaves existing markers alone; **Remove everywhere** also strips it from every marker on every layer.
- Bump `package.json` `version` (patch), commit as `chore: bump version to x.y.z`.
- No API-reference / Language-Guide change — editor-only, `.stm` format unchanged.

---

## Self-Review notes (already applied)

- **Spec coverage:** unused-immediate / in-use-confirm split → Task 2 Step 5c; three dialog outcomes → Steps 5c + Task 1; palette must stop resurrecting a registry-deleted tag → Step 5d; dialog component → Task 1; tests → Steps 1, 4, 6, 7.
- **Naming consistency:** `handleRemoveTagClick` (passed as `onRemoveTag` to `TagPicker`), `deleteTagFromRegistry`, `handleCancelDeleteTag`, `handleDeleteTagFromListOnly`, `handleRemoveTagEverywhere`, `pendingDeleteTag`, `pendingDeleteTagStats` — used identically in Task 2's `index.tsx` edits and its own JSX wiring. `DeleteTagDialog`'s props (`tag`, `markerCount`, `layerCount`, `onCancel`, `onDeleteFromListOnly`, `onRemoveEverywhere`) match between Task 1's component and Task 2's usage.
- **`EditorLayer` import:** `index.tsx` already imports `EditorLayer` (used elsewhere, e.g. `firstTileLayer`'s type predicate) — Step 5e's type predicate reuses it, no new import needed.
- **Existing-test risk:** grepped for other tests asserting on `markerTags`/palette contents relying on `tagsInUse` — none found; every tag-visibility test types or paints a tag first (which registers it), so dropping the `tagsInUse` union term doesn't change their outcome.
