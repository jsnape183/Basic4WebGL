# Cross-map Tag Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the tilemap editor's paint palette, show tags used by other tilemaps in the same project, so a name can be reused with one click instead of retyped (and typo'd).

**Architecture:** A pure `extractTagsFromStmJson` reads a raw `.stm`'s effective tag list. A `useCrossMapTags` hook scans every other tilemap asset in the project and aggregates `{tag, sources}`. `TagPicker` renders a new, purely additive "Seen in other maps" section in its paint branch whose chips call the **existing** `onToggleTag` callback — no new state or behavior anywhere else in the editor. `index.tsx` only gains one hook call and one new prop on `<TagPicker>`.

**Tech Stack:** TypeScript, React 18 (`.tsx` files need `import React from 'react';`), Vitest + `@testing-library/react` (`renderHook`, `waitFor`) + `@testing-library/user-event`, Redux (`react-redux`, `@reduxjs/toolkit`), Tailwind `ds-*` tokens.

---

## Background for the implementer

`src/components/TileMapEditor/index.tsx`'s `decodeStmText` already computes a
`.stm` doc's effective tag list this way (read it for the exact pattern, but
**do not modify it** — this feature deliberately keeps its own copy so it
can't affect that decode path):
```ts
const storedTags = Array.isArray(parsed.tags)
  ? parsed.tags.filter((t): t is string => typeof t === 'string')
  : [];
const usedTags = layerEntries.flatMap(([, value]) =>
  !Array.isArray(value) && value.type === 'markers' ? value.markers.map((m) => m.tag) : []
);
```

`src/features/assets/assetsSlice.ts` — `IAsset = { id, name, projectId, folderId, fullName }`; `state.assets.byId: Record<string, IAsset>`.

`src/components/AssetPreview/getAssetType.ts` — `getAssetType(name): 'image' | 'audio' | 'tilemap' | 'text'` (`.stm` → `'tilemap'`).

`src/lib/storage/assetBlobStore.ts` — `getAssetBlob(id): Promise<Blob | undefined>`, `putAssetBlob(id, blob): Promise<void>`, `_clearAllAssetBlobsForTests(): Promise<void>`.

`.stm` blobs are stored as **plain JSON text** (not a `data:` URL) — `blob.text()` gives you JSON directly, matching how `useAssetText` and the editor's own load path already read them.

`src/components/TileMapEditor/TagPicker.tsx`'s paint branch (the `else selectMode ? null : (...)` branch) currently ends with the tag-chip `<div className="flex flex-wrap gap-1">{tags.map(...)}</div>` immediately followed by the "new tag name" `<input>`. The new section goes between those two.

`tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`'s `renderEditor()` seeds one tilemap asset `id: 'm1'` and one tileset asset `id: 't1'`, both `projectId: 'p1'`, and returns `{ store }`. `makeStmAsset()` / `makeTilesetAsset()` build those. `putAssetBlob`, `addAsset`, `screen`, `userEvent`, `fireEvent`, `readSavedStm` are already imported/defined at the top of that file.

## File Structure

- **Create** `src/components/TileMapEditor/stmTags.ts` — pure tag extraction from raw `.stm` JSON.
- **Create** `tests/ui/components/TileMapEditor/stmTags.test.ts`.
- **Create** `src/components/TileMapEditor/useCrossMapTags.ts` — the scanning hook.
- **Create** `tests/ui/components/TileMapEditor/useCrossMapTags.test.tsx`.
- **Modify** `src/components/TileMapEditor/TagPicker.tsx` — new `crossMapTags` prop + "Seen in other maps" section.
- **Modify** `tests/ui/components/TileMapEditor/TagPicker.test.tsx` — 4 new tests.
- **Modify** `src/components/TileMapEditor/index.tsx` — call the hook, pass the prop.
- **Modify** `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx` — 2 new integration tests.

---

## Task 1: `extractTagsFromStmJson`

**Files:**
- Create: `src/components/TileMapEditor/stmTags.ts`
- Test: `tests/ui/components/TileMapEditor/stmTags.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/ui/components/TileMapEditor/stmTags.test.ts`:
```ts
import { describe, test, expect } from 'vitest';
import { extractTagsFromStmJson } from '../../../../src/components/TileMapEditor/stmTags';

describe('extractTagsFromStmJson', () => {
  test('returns the stored tags field as-is', () => {
    const raw = JSON.stringify({ tags: ['spawn', 'ally'], layers: {} });
    expect(extractTagsFromStmJson(raw)).toEqual(['spawn', 'ally']);
  });

  test('falls back to tags actually used by markers when there is no tags field', () => {
    const raw = JSON.stringify({
      layers: { spawns: { type: 'markers', markers: [{ row: 0, col: 0, tag: 'legacy' }] } },
    });
    expect(extractTagsFromStmJson(raw)).toEqual(['legacy']);
  });

  test('unions stored and used tags without duplicates', () => {
    const raw = JSON.stringify({
      tags: ['spawn'],
      layers: { spawns: { type: 'markers', markers: [{ row: 0, col: 0, tag: 'spawn' }, { row: 0, col: 1, tag: 'exit' }] } },
    });
    expect(extractTagsFromStmJson(raw)).toEqual(['spawn', 'exit']);
  });

  test('malformed JSON returns an empty list, never throws', () => {
    expect(extractTagsFromStmJson('{not json')).toEqual([]);
  });

  test('a non-string entry in tags is dropped', () => {
    const raw = JSON.stringify({ tags: ['spawn', 42, null], layers: {} });
    expect(extractTagsFromStmJson(raw)).toEqual(['spawn']);
  });

  test('empty or missing raw text returns an empty list', () => {
    expect(extractTagsFromStmJson('')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/stmTags.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/TileMapEditor/stmTags.ts`:
```ts
type StmMarkerEntry = { row: number; col: number; tag: string };
type StmLayerValue =
  | number[][]
  | { type: 'markers'; markers: StmMarkerEntry[] }
  | { type: 'collision'; data: number[][] };

/**
 * The effective tag list a raw .stm JSON string carries: whatever is in its
 * `tags` field, plus any tag actually used by a marker (covers a legacy file
 * saved before the tag registry existed). Malformed JSON or a missing field
 * yields an empty list, never throws.
 *
 * Deliberately NOT shared with decodeStmText's near-identical logic in
 * index.tsx — this is a small, standalone read for an additive, read-only
 * feature (cross-map tag suggestions), kept separate so it cannot affect the
 * decode path every other editor feature depends on.
 */
export function extractTagsFromStmJson(raw: string): string[] {
  let parsed: { tags?: unknown; layers?: Record<string, StmLayerValue> };
  try {
    parsed = JSON.parse(raw || '{}');
  } catch {
    return [];
  }
  const storedTags = Array.isArray(parsed.tags)
    ? parsed.tags.filter((t): t is string => typeof t === 'string')
    : [];
  const layerEntries = Object.entries(parsed.layers ?? {});
  const usedTags = layerEntries.flatMap(([, value]) =>
    !Array.isArray(value) && value.type === 'markers' ? value.markers.map((m) => m.tag) : []
  );
  return Array.from(new Set([...storedTags, ...usedTags]));
}
```

- [ ] **Step 4: Run, verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/stmTags.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/stmTags.ts tests/ui/components/TileMapEditor/stmTags.test.ts
git commit -m "$(cat <<'EOF'
feat(tilemap-editor): extractTagsFromStmJson — read a .stm's tag list

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `useCrossMapTags` hook

**Files:**
- Create: `src/components/TileMapEditor/useCrossMapTags.ts`
- Test: `tests/ui/components/TileMapEditor/useCrossMapTags.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/ui/components/TileMapEditor/useCrossMapTags.test.tsx`:
```tsx
// @vitest-environment jsdom
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach } from 'vitest';
import assetsReducer, { addAsset } from '../../../../src/features/assets/assetsSlice';
import { useCrossMapTags } from '../../../../src/components/TileMapEditor/useCrossMapTags';
import { putAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
});

function makeStore() {
  return configureStore({ reducer: { assets: assetsReducer } });
}

function wrapperFor(store: ReturnType<typeof makeStore>) {
  return ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
}

describe('useCrossMapTags', () => {
  test('collects tags from other tilemap assets in the same project', async () => {
    const store = makeStore();
    store.dispatch(addAsset({ id: 'this', name: 'level1.stm', projectId: 'p1', folderId: null, fullName: 'level1.stm' }));
    store.dispatch(addAsset({ id: 'other', name: 'level2.stm', projectId: 'p1', folderId: null, fullName: 'level2.stm' }));
    await putAssetBlob('other', new Blob([JSON.stringify({ tags: ['ally'], layers: {} })]));

    const { result } = renderHook(() => useCrossMapTags('p1', 'this'), { wrapper: wrapperFor(store) });
    await waitFor(() => expect(result.current).toEqual([{ tag: 'ally', sources: ['level2.stm'] }]));
  });

  test('excludes the current asset', async () => {
    const store = makeStore();
    store.dispatch(addAsset({ id: 'this', name: 'level1.stm', projectId: 'p1', folderId: null, fullName: 'level1.stm' }));
    await putAssetBlob('this', new Blob([JSON.stringify({ tags: ['self'], layers: {} })]));

    const { result } = renderHook(() => useCrossMapTags('p1', 'this'), { wrapper: wrapperFor(store) });
    // Nothing else exists to produce a result, so this settles immediately;
    // give it a tick to prove it settles on [] rather than including 'self'.
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toEqual([]);
  });

  test('excludes non-tilemap assets and other projects', async () => {
    const store = makeStore();
    store.dispatch(addAsset({ id: 'this', name: 'level1.stm', projectId: 'p1', folderId: null, fullName: 'level1.stm' }));
    store.dispatch(addAsset({ id: 'img', name: 'sprite.png', projectId: 'p1', folderId: null, fullName: 'sprite.png' }));
    store.dispatch(addAsset({ id: 'other-proj', name: 'level9.stm', projectId: 'p2', folderId: null, fullName: 'level9.stm' }));
    await putAssetBlob('img', new Blob(['not json']));
    await putAssetBlob('other-proj', new Blob([JSON.stringify({ tags: ['far-away'], layers: {} })]));

    const { result } = renderHook(() => useCrossMapTags('p1', 'this'), { wrapper: wrapperFor(store) });
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current).toEqual([]);
  });

  test('aggregates one tag used by two other maps into one entry with two sources', async () => {
    const store = makeStore();
    store.dispatch(addAsset({ id: 'this', name: 'level1.stm', projectId: 'p1', folderId: null, fullName: 'level1.stm' }));
    store.dispatch(addAsset({ id: 'a', name: 'level2.stm', projectId: 'p1', folderId: null, fullName: 'level2.stm' }));
    store.dispatch(addAsset({ id: 'b', name: 'level3.stm', projectId: 'p1', folderId: null, fullName: 'level3.stm' }));
    await putAssetBlob('a', new Blob([JSON.stringify({ tags: ['boss'], layers: {} })]));
    await putAssetBlob('b', new Blob([JSON.stringify({ tags: ['boss'], layers: {} })]));

    const { result } = renderHook(() => useCrossMapTags('p1', 'this'), { wrapper: wrapperFor(store) });
    await waitFor(() =>
      expect(result.current).toEqual([{ tag: 'boss', sources: ['level2.stm', 'level3.stm'] }])
    );
  });

  test('a corrupt/missing blob for one asset does not hide the others tags', async () => {
    const store = makeStore();
    store.dispatch(addAsset({ id: 'this', name: 'level1.stm', projectId: 'p1', folderId: null, fullName: 'level1.stm' }));
    store.dispatch(addAsset({ id: 'good', name: 'level2.stm', projectId: 'p1', folderId: null, fullName: 'level2.stm' }));
    store.dispatch(addAsset({ id: 'missing', name: 'level3.stm', projectId: 'p1', folderId: null, fullName: 'level3.stm' }));
    await putAssetBlob('good', new Blob([JSON.stringify({ tags: ['ally'], layers: {} })]));
    // 'missing' deliberately has no blob at all.

    const { result } = renderHook(() => useCrossMapTags('p1', 'this'), { wrapper: wrapperFor(store) });
    await waitFor(() => expect(result.current).toEqual([{ tag: 'ally', sources: ['level2.stm'] }]));
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/useCrossMapTags.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/TileMapEditor/useCrossMapTags.ts`:
```ts
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getAssetBlob } from '../../lib/storage/assetBlobStore';
import { getAssetType } from '../AssetPreview/getAssetType';
import { extractTagsFromStmJson } from './stmTags';

export type CrossMapTag = { tag: string; sources: string[] };

/**
 * Every tag used by another tilemap asset in the same project (excluding
 * `excludeAssetId`, the map currently open). Purely additive/read-only: it
 * never touches any asset's stored data. Re-scans when the project's set of
 * candidate tilemap assets changes, not on every render. A blob that fails
 * to load or parse is skipped, not thrown.
 */
export function useCrossMapTags(projectId: string | undefined, excludeAssetId: string): CrossMapTag[] {
  const otherTilemapAssets = useSelector((state: RootState) =>
    Object.values(state.assets.byId).filter(
      (a) => a.projectId === projectId && a.id !== excludeAssetId && getAssetType(a.name) === 'tilemap'
    )
  );
  // A stable primitive key so the effect only re-runs when the actual set of
  // candidate assets changes, not on every unrelated Redux update.
  const assetsKey = otherTilemapAssets.map((a) => `${a.id}:${a.name}`).sort().join(',');

  const [crossMapTags, setCrossMapTags] = useState<CrossMapTag[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (otherTilemapAssets.length === 0) {
      setCrossMapTags([]);
      return;
    }
    Promise.all(
      otherTilemapAssets.map(async (a) => {
        try {
          const blob = await getAssetBlob(a.id);
          if (!blob) return { name: a.name, tags: [] as string[] };
          const text = await blob.text();
          return { name: a.name, tags: extractTagsFromStmJson(text) };
        } catch {
          return { name: a.name, tags: [] as string[] };
        }
      })
    ).then((results) => {
      if (cancelled) return;
      const sourcesByTag = new Map<string, Set<string>>();
      for (const { name, tags } of results) {
        for (const tag of tags) {
          if (!sourcesByTag.has(tag)) sourcesByTag.set(tag, new Set());
          sourcesByTag.get(tag)!.add(name);
        }
      }
      const next = Array.from(sourcesByTag.entries())
        .map(([tag, sources]) => ({ tag, sources: Array.from(sources).sort() }))
        .sort((a, b) => a.tag.localeCompare(b.tag));
      setCrossMapTags(next);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetsKey]);

  return crossMapTags;
}
```

- [ ] **Step 4: Run, verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/useCrossMapTags.test.tsx`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/useCrossMapTags.ts tests/ui/components/TileMapEditor/useCrossMapTags.test.tsx
git commit -m "$(cat <<'EOF'
feat(tilemap-editor): useCrossMapTags — scan other project tilemaps for tags

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `TagPicker` — "Seen in other maps" section

**Files:**
- Modify: `src/components/TileMapEditor/TagPicker.tsx`
- Modify: `tests/ui/components/TileMapEditor/TagPicker.test.tsx`

- [ ] **Step 1: Add the failing tests**

Append to `tests/ui/components/TileMapEditor/TagPicker.test.tsx`, inside the `describe('TagPicker (paint mode)', ...)` block (before its closing `});`):

```tsx
  test('cross-map tags not already registered here are offered as suggestions', () => {
    render(<TagPicker {...base} tags={['spawn']} crossMapTags={[{ tag: 'ally', sources: ['level2.stm'] }]} />);
    expect(screen.getByLabelText('Use tag ally from another map')).toBeInTheDocument();
  });

  test('a cross-map tag already in this map\'s registry is not shown as a suggestion', () => {
    render(<TagPicker {...base} tags={['ally']} crossMapTags={[{ tag: 'ally', sources: ['level2.stm'] }]} />);
    expect(screen.queryByLabelText('Use tag ally from another map')).not.toBeInTheDocument();
  });

  test('clicking a cross-map suggestion calls onToggleTag with that tag', async () => {
    const onToggleTag = vi.fn();
    render(
      <TagPicker
        {...base}
        tags={[]}
        crossMapTags={[{ tag: 'ally', sources: ['level2.stm'] }]}
        onToggleTag={onToggleTag}
      />
    );
    await userEvent.click(screen.getByLabelText('Use tag ally from another map'));
    expect(onToggleTag).toHaveBeenCalledWith('ally');
  });

  test('no "Seen in other maps" section when there are no new cross-map tags', () => {
    render(<TagPicker {...base} tags={[]} crossMapTags={[]} />);
    expect(screen.queryByText('Seen in other maps')).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run, verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/TagPicker.test.tsx`
Expected: FAIL — `TagPicker` doesn't accept/render `crossMapTags` yet.

- [ ] **Step 3: Update `TagPicker.tsx`**

3a. Add the import at the top:
```ts
import { CrossMapTag } from './useCrossMapTags';
```

3b. Add the prop to the `Props` type (anywhere sensible, e.g. right after `onRemoveTag`):
```ts
  /** Tags used by other tilemaps in the same project, offered as one-click suggestions. */
  crossMapTags?: CrossMapTag[];
```

3c. Add it to the destructure with a default:
```ts
  crossMapTags = [],
```

3d. In the paint branch, insert this block between the existing tag-chip `<div className="flex flex-wrap gap-1">{tags.map(...)}</div>` and the "new tag name" `<input>`:
```tsx
          {(() => {
            const suggestions = crossMapTags.filter((c) => !tags.includes(c.tag));
            if (suggestions.length === 0) return null;
            return (
              <>
                <div className="text-[10px] uppercase tracking-wide text-ds-text-dim">Seen in other maps</div>
                <div className="flex flex-wrap gap-1">
                  {suggestions.map(({ tag, sources }) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onToggleTag?.(tag)}
                      aria-label={`Use tag ${tag} from another map`}
                      title={`Also used in: ${sources.join(', ')}`}
                      className="px-2 py-1 rounded-full text-xs border border-dashed border-ds-border text-ds-text-dim hover:text-ds-text hover:border-ds-accent"
                    >
                      {tag}{' '}
                      <span className="text-ds-text-dim">
                        ({sources.length === 1 ? sources[0] : `${sources.length} maps`})
                      </span>
                    </button>
                  ))}
                </div>
              </>
            );
          })()}
```

- [ ] **Step 4: Run, verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/TagPicker.test.tsx`
Expected: PASS — 13 tests (9 existing + 4 new).

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/TagPicker.tsx tests/ui/components/TileMapEditor/TagPicker.test.tsx
git commit -m "$(cat <<'EOF'
feat(tilemap-editor): TagPicker — offer tags seen in other maps

A new "Seen in other maps" row lists any crossMapTags not already in this
map's registry. Clicking one calls the existing onToggleTag callback -
the same action as typing a brand-new tag name - so no new state or
behavior is needed anywhere else.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Wire `useCrossMapTags` into the editor

**Files:**
- Modify: `src/components/TileMapEditor/index.tsx`
- Modify: `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`

- [ ] **Step 1: Add the failing integration tests**

Add a new `describe` block at the end of `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`:

```tsx
describe('TileMapEditor — cross-map tag suggestions', () => {
  test('a tag used in another tilemap in the same project is offered, and adopting it works like typing it', async () => {
    const { store } = await renderEditor();
    const otherMapJson = JSON.stringify({
      tileWidth: 8, tileHeight: 8, tileImage: 'tileset.png',
      tags: ['ally'],
      layers: { spawns: { type: 'markers', markers: [{ row: 0, col: 0, tag: 'ally' }] } },
    });
    await putAssetBlob('other-map', new Blob([otherMapJson], { type: 'application/json' }));
    store.dispatch(addAsset({ id: 'other-map', name: 'level2.stm', projectId: 'p1', folderId: null, fullName: 'level2.stm' }));

    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));

    expect(await screen.findByLabelText('Use tag ally from another map')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Use tag ally from another map'));
    fireEvent.mouseDown(screen.getByLabelText('Row 0, Column 1'));
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect((await readSavedStm()).layers.markers3).toEqual({
      type: 'markers',
      markers: [{ row: 0, col: 1, tag: 'ally' }],
    });
  });

  test("a tag already in this map's registry is not repeated as a suggestion", async () => {
    const { store } = await renderEditor();
    await userEvent.click(screen.getByLabelText('Add marker layer'));
    await userEvent.click(screen.getByText('markers3'));
    await userEvent.type(screen.getByLabelText('New tag name'), 'ally{Enter}');

    const otherMapJson = JSON.stringify({
      tileWidth: 8, tileHeight: 8, tileImage: 'tileset.png', tags: ['ally', 'scout'], layers: {},
    });
    await putAssetBlob('other-map', new Blob([otherMapJson], { type: 'application/json' }));
    store.dispatch(addAsset({ id: 'other-map', name: 'level2.stm', projectId: 'p1', folderId: null, fullName: 'level2.stm' }));

    // 'scout' proves the cross-map scan has completed; 'ally' must not also
    // appear as a suggestion, since it's already in this map's own registry.
    expect(await screen.findByLabelText('Use tag scout from another map')).toBeInTheDocument();
    expect(screen.queryByLabelText('Use tag ally from another map')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`
Expected: FAIL — `index.tsx` doesn't pass `crossMapTags` yet, so the suggestion never appears.

- [ ] **Step 3: Update `index.tsx`**

3a. Add the import near the other local hook imports (alongside e.g. `import { useTilesetSlices } from './useTilesetSlices';`):
```ts
import { useCrossMapTags } from './useCrossMapTags';
```

3b. Call the hook. Place it near where `tagsInUse`/`markerTags` are computed (anywhere after `asset` is in scope, which is from the component's props):
```ts
  const crossMapTags = useCrossMapTags(asset.projectId, asset.id);
```

3c. In the `<TagPicker ... />` element, add:
```tsx
              crossMapTags={crossMapTags}
```
(anywhere among its other props, e.g. right after `onRemoveTag={handleRemoveTagClick}`).

- [ ] **Step 4: Run, verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`
Expected: PASS — all existing tests plus the 2 new ones.

- [ ] **Step 5: Folder + build**

Run: `npx vitest run tests/ui/components/TileMapEditor tests/integration/tilemapMarkersRoundTrip.test.ts`
Expected: PASS.

Run: `npx vite build`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/components/TileMapEditor/index.tsx tests/ui/components/TileMapEditor/TileMapEditor.test.tsx
git commit -m "$(cat <<'EOF'
feat(tilemap-editor): show tags used by other maps in the paint palette

Wires useCrossMapTags into the editor: the paint palette's new "Seen in
other maps" row now reflects tags used by other tilemaps in the same
project. Purely additive - no change to this map's registry, the resize
flow, multi-tag paint, or the delete-tag confirm flow.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Full verification

**Files:** none.

- [ ] **Step 1:** `npx vitest run` → exit 0, no failures (skips OK).
- [ ] **Step 2:** `npx vite build` → exit 0.
- [ ] **Step 3 (optional manual smoke):** `npm run dev`, open a project with two tilemaps sharing a project id, one with a tag the other lacks; open the one without it, add/select a marker layer, confirm the "Seen in other maps" chip appears with the right source hint, click it, paint, save.

---

## Release / docs (only when the user asks to push)

- `src/docs/release-notes.md` entry, e.g.:
  > ### Tilemap editor: see tags used in your other maps
  > - The marker paint palette now shows a **Seen in other maps** row for any tag used by another tilemap in the same project but not yet in this one. Click it to adopt the name — exactly like typing a new tag, just without the risk of a typo drifting from what you already used elsewhere.
- Bump `package.json` `version` (patch), commit as `chore: bump version to x.y.z`.
- No API-reference / Language-Guide change — editor-only, `.stm` format unchanged, read-only.

---

## Self-Review notes (already applied)

- **Spec coverage:** `extractTagsFromStmJson` → Task 1; scanning hook → Task 2; UI section + one-click adopt reusing `onToggleTag` → Task 3; wiring → Task 4; explicit non-touch of `decodeStmText`, delete-tag flow, resize, multi-tag-paint → called out in Task 1's background and never referenced again in Tasks 2-4.
- **Naming consistency:** `extractTagsFromStmJson`, `useCrossMapTags`, `CrossMapTag { tag, sources }`, `crossMapTags` prop — identical across `stmTags.ts`, `useCrossMapTags.ts`, `TagPicker.tsx`, and `index.tsx`.
- **No new callback surface:** confirmed the cross-map chips call `onToggleTag`, the prop `TagPicker` already has — Task 3 does not add an `onAdoptTag` or similar, matching the spec's explicit low-risk framing.
- **Async test risk:** the "already registered, not repeated" tests (both hook-level and integration-level) use a second, definitely-new tag (`'scout'`) as a positive signal that the async scan has completed, rather than asserting an absence immediately after a dispatch (which could pass for the wrong reason — the scan simply not having run yet).
