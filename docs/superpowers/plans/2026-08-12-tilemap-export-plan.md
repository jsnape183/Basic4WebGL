# Tilemap Editor: export single `.stm` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Export" button to the Tilemap Editor toolbar that downloads the currently-open tilemap as a standalone, plain-JSON `.stm` file named after its asset.

**Architecture:** Extract the layer-serialization logic already inside `encodeStmContent` (`src/components/TileMapEditor/index.tsx`) into a new pure function `exportStmDoc(doc: StmDoc): string` that returns unwrapped JSON (not the `data:...;base64,...` format `IAsset.content` uses). `encodeStmContent` is refactored to call it, so there's one source of truth for the `{tileWidth, tileHeight, tileImage, layers}` shape. A small `downloadStmFile` helper wraps that string in a `Blob` and triggers a browser download, following the same four-step pattern (`Blob` → `createObjectURL` → temporary `<a download>` → click → revoke) already used by `src/features/projects/exportProject.ts`'s `triggerDownload`. A new toolbar button wires `downloadStmFile(draftDoc, asset.name)` to an `onClick`.

**Tech Stack:** React (TSX), Vitest + Testing Library (existing test conventions in `tests/ui/components/TileMapEditor/`).

**Design doc:** `docs/superpowers/specs/2026-08-12-tilemap-export-design.md`

---

### Task 1: Extract `exportStmDoc` and refactor `encodeStmContent` to use it

**Files:**
- Modify: `src/components/TileMapEditor/index.tsx:43-58` (the `encodeStmContent` function and the `StmLayerValue` type just above it)
- Test: `tests/ui/components/TileMapEditor/stmCodec.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to the bottom of `tests/ui/components/TileMapEditor/stmCodec.test.ts` (it already imports `decodeStmContent, encodeStmContent` from `'../../../../src/components/TileMapEditor'` — add `exportStmDoc` to that same import, and add `StmDoc` from the types module):

```ts
import { describe, test, expect } from 'vitest';
import { decodeStmContent, encodeStmContent, exportStmDoc } from '../../../../src/components/TileMapEditor';
import { StmDoc } from '../../../../src/components/TileMapEditor/types';
```

(Update the existing `import` line at the top of the file to include `exportStmDoc`, and add the new `StmDoc` import line right after it.)

Then append this new `describe` block at the end of the file:

```ts
describe('exportStmDoc', () => {
  test('produces plain JSON, not a data: URL', () => {
    const doc: StmDoc = {
      tileWidth: 16,
      tileHeight: 16,
      tileImage: 'a.png',
      layers: [{ key: 'k1', name: 'background', kind: 'tile', data: [[1, 0]] }],
    };
    const exported = exportStmDoc(doc);
    expect(exported.startsWith('data:')).toBe(false);
    expect(() => JSON.parse(exported)).not.toThrow();
  });

  test('serializes tile layers as bare arrays and marker layers as { type: "markers" }', () => {
    const doc: StmDoc = {
      tileWidth: 8,
      tileHeight: 8,
      tileImage: 'tileset.png',
      layers: [
        { key: 'k1', name: 'background', kind: 'tile', data: [[1, 1], [0, 0]] },
        { key: 'k2', name: 'spawns', kind: 'marker', markers: [{ row: 0, col: 1, tag: 'spawn' }] },
      ],
    };
    const parsed = JSON.parse(exportStmDoc(doc));
    expect(parsed).toEqual({
      tileWidth: 8,
      tileHeight: 8,
      tileImage: 'tileset.png',
      layers: {
        background: [[1, 1], [0, 0]],
        spawns: { type: 'markers', markers: [{ row: 0, col: 1, tag: 'spawn' }] },
      },
    });
  });

  test('round-trips through decodeStmContent back to the same layer shape', () => {
    const doc: StmDoc = {
      tileWidth: 8,
      tileHeight: 8,
      tileImage: 'tileset.png',
      layers: [
        { key: 'k1', name: 'background', kind: 'tile', data: [[1, 1], [0, 0]] },
        { key: 'k2', name: 'spawns', kind: 'marker', markers: [{ row: 0, col: 1, tag: 'spawn' }] },
      ],
    };
    const exported = exportStmDoc(doc);
    const asDataUrl = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(exported)));
    const decoded = decodeStmContent(asDataUrl);

    expect(decoded.tileWidth).toBe(8);
    expect(decoded.tileHeight).toBe(8);
    expect(decoded.tileImage).toBe('tileset.png');
    expect(decoded.layers).toHaveLength(2);
    expect(decoded.layers[0]).toMatchObject({ name: 'background', kind: 'tile', data: [[1, 1], [0, 0]] });
    expect(decoded.layers[1]).toMatchObject({
      name: 'spawns',
      kind: 'marker',
      markers: [{ row: 0, col: 1, tag: 'spawn' }],
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/stmCodec.test.ts`
Expected: FAIL — `exportStmDoc` is not exported from `src/components/TileMapEditor` (import error / `undefined is not a function`).

- [ ] **Step 3: Implement `exportStmDoc` and refactor `encodeStmContent`**

In `src/components/TileMapEditor/index.tsx`, replace the existing `encodeStmContent` function (and the block right above it) with:

```ts
function buildStmLayers(doc: StmDoc): Record<string, StmLayerValue> {
  const layers: Record<string, StmLayerValue> = {};
  doc.layers.forEach((l) => {
    layers[l.name] = l.kind === 'tile' ? l.data : { type: 'markers', markers: l.markers };
  });
  return layers;
}

export function exportStmDoc(doc: StmDoc): string {
  return JSON.stringify({
    tileWidth: doc.tileWidth,
    tileHeight: doc.tileHeight,
    tileImage: doc.tileImage,
    layers: buildStmLayers(doc),
  });
}

export function encodeStmContent(doc: StmDoc, originalContent: string): string {
  const mime = originalContent.startsWith('data:')
    ? originalContent.slice(5, originalContent.indexOf(';'))
    : 'application/json';
  return `data:${mime};base64,` + btoa(unescape(encodeURIComponent(exportStmDoc(doc))));
}
```

This removes the duplicated layer-building loop that used to live directly inside `encodeStmContent` — both functions now go through `buildStmLayers`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/ui/components/TileMapEditor/stmCodec.test.ts`
Expected: PASS (all tests in the file, including the pre-existing `decodeStmContent`/`encodeStmContent` tests, which must still pass unchanged since `encodeStmContent`'s output format didn't change).

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/index.tsx tests/ui/components/TileMapEditor/stmCodec.test.ts
git commit -m "refactor: extract exportStmDoc from encodeStmContent in Tilemap Editor"
```

---

### Task 2: Add the Export button to the toolbar

**Files:**
- Modify: `src/components/TileMapEditor/index.tsx` (toolbar div, currently lines 192-202)
- Test: `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`

- [ ] **Step 1: Write the failing test**

Add this test to `tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`, inside the existing `describe('TileMapEditor', ...)` block (after the last test, before its closing `});`):

```ts
  test('clicking Export downloads the current draft as a plain-JSON .stm file named after the asset', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: /export/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = createObjectURL.mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe('application/json');
    const text = await blobArg.text();
    expect(text.startsWith('data:')).toBe(false);
    expect(JSON.parse(text)).toMatchObject({ tileWidth: 8, tileHeight: 8, tileImage: 'tileset.png' });
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    clickSpy.mockRestore();
  });
```

This asserts on the `Blob` passed to `createObjectURL` rather than the anchor's `download` attribute at click time, since jsdom's `HTMLAnchorElement` doesn't reliably expose `download` through the spy — the important, testable behavior is: correct MIME type, correct (unwrapped) content, and that the temporary anchor's `click()`/cleanup actually ran.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx -t "clicking Export"`
Expected: FAIL — no button with accessible name matching `/export/i` exists yet (`TestingLibraryElementError: Unable to find role="button" and name...`).

- [ ] **Step 3: Add `downloadStmFile` and the Export button**

In `src/components/TileMapEditor/index.tsx`, add this function directly below `exportStmDoc` (defined in Task 1):

```ts
function downloadStmFile(doc: StmDoc, filename: string): void {
  const blob = new Blob([exportStmDoc(doc)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

Then update the toolbar (currently):

```tsx
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
```

to:

```tsx
        <div className="flex justify-end gap-2 p-2 border-b border-ds-border">
          <button
            type="button"
            onClick={() => downloadStmFile(draftDoc, asset.name)}
            className="border border-ds-border text-ds-text text-sm px-4 py-1.5 rounded hover:bg-ds-surface transition"
          >
            Export
          </button>
          <button
            type="button"
            disabled={!isDirty}
            onClick={handleSave}
            className="bg-accent-gradient text-white text-sm px-4 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
```

Export always exports `draftDoc` — the current in-editor state, including unsaved edits — and is never disabled, unlike Save.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.test.tsx`
Expected: PASS — the new test and all pre-existing tests in this file (the toolbar layout change must not break the existing `getByRole('button', { name: /save/i })` lookups used throughout the file).

- [ ] **Step 5: Commit**

```bash
git add src/components/TileMapEditor/index.tsx tests/ui/components/TileMapEditor/TileMapEditor.test.tsx
git commit -m "feat: add Export button to Tilemap Editor toolbar"
```

---

### Task 3: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full Vitest suite**

Run: `npx vitest run`
Expected: all tests pass, no regressions outside the two files touched above.

- [ ] **Step 2: Run the production build**

Run: `npx vite build`
Expected: builds cleanly with no TypeScript/build errors.

- [ ] **Step 3: Manually verify in the running app**

Start the dev server (`npm run dev`), open any project containing a `.stm` asset in the Tilemap Editor, click **Export**, and confirm:
- A file downloads named exactly like the asset (e.g. `map1.stm`).
- Opening it shows plain JSON (`{"tileWidth":...,"layers":{...}}`), not a `data:` URL.
- Painting a few cells *without* clicking Save, then clicking Export, downloads a file reflecting the unsaved paint (confirms Export reads `draftDoc`, not the last-saved asset content).

- [ ] **Step 4: Update `docs/roadmap.md` / release notes — not needed**

This is an editor-UI feature (new capability, not a fix to existing behavior), so per `CLAUDE.md`'s versioning rule it **does** need a release-notes entry and version bump — but only when explicitly asked to push. No action here; flag it to the user at that time rather than bumping now.
