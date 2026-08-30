# IndexedDB Asset Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move redux-persist off `localStorage` onto IndexedDB (via `localforage`), and store asset binaries as decoded bytes in their own IndexedDB store instead of base64 data URLs inside the persisted Redux blob — eliminating the `QuotaExceededError` that currently breaks asset-heavy projects like the Raycaster demo.

**Architecture:** A new `src/lib/storage/` layer holds three modules: a redux-persist storage adapter backed by `localforage`, an asset-blob key/value store keyed by asset id, and data-URL <-> bytes conversion helpers used only at the import/export boundary. The Redux `assets` slice keeps only metadata (`content` is removed from `IAsset`). Write paths (`upload`, `importProject`, tilemap/text editor saves) persist bytes via the blob store before dispatching metadata. Read paths use two new hooks (`useAssetObjectUrl`, `useAssetText`) for previews, and the runner resolves each project asset to a data URL just before Run. The `.b4wgl.json` export format is unchanged (base64 inline); demo JSON files become lazy dynamic imports so they leave the initial bundle.

**Tech Stack:** TypeScript, React 18, Redux Toolkit, redux-persist, `localforage` (new dep), `fake-indexeddb` (new dev dep), Vitest + `@testing-library/react`, Vite.

---

## Key facts verified against the codebase (read before starting)

- **`src/store.ts`** — `persistedConfig = { key: 'softBASIC', storage, blacklist: ['session','packages'], transforms: [clearDirtyOnRehydrate] }`. `storage` is the default import from `redux-persist/lib/storage`. `rootReducer` combines `projects, files, assets, folders, ui, session, packages`. `persistor = persistStore(store)` at module scope.
- **`src/features/assets/assetsSlice.ts`** — `IAsset = { id, name, content, projectId, folderId, fullName }`. `addAsset` payload is `Omit<IAsset,'folderId'|'fullName'> & Partial<Pick<IAsset,'folderId'|'fullName'>>`; body defaults `folderId:null`, `fullName:action.payload.name`, pushes id onto `assetOrder[orderKey]`. `updateAsset` payload is a full `IAsset`, replaces `byId[id]`. `removeAsset` payload is a string id; removes from `byId` + `assetOrder`. Also exports `setAssetFolder`, `batchSetAssetFolder`, `batchSetAssetFullNames`, `reorderAssets`.
- **`src/features/projects/importProject.ts`** — `importProject = (json, options?) => (dispatch): string` — **synchronous thunk, returns `newProjectId`**. Builds `assetIdMap` (old id -> fresh uuid). Dispatches assets twice: once walking `json.assetOrder` buckets, once for any asset not covered (defensive). Both call `dispatch(addAsset({ id: assetIdMap[oldId], name, content: asset.content, projectId: newProjectId, folderId: <mapped>, fullName }))`.
- **`src/features/projects/exportProject.ts`** — `buildExportJson(projectId, state): ProjectExportJson` — **synchronous**. `assets` mapped from `state.assets.byId` filtered by `projectId` to `{ id, name, content, folderId, fullName }`. `exportProject = (projectId) => (_dispatch, getState) => {...}` thunk calls `buildExportJson` then `triggerDownload`. `ProjectExportJson.assets[]` = `{ id, name, content, folderId, fullName }`. `buildExportJson` is **also imported by `src/hooks/useRunnerMessages.ts:8`** (Sentry payload, strips asset content).
- **Runner read path — IMPORTANT, spec's model is incomplete:** `src/components/Runner/index.tsx` accepts `assets?: Array<{ name: string; src: string }>` and injects `await _sb.preload(${JSON.stringify(assets)});` at the `//${inlineAssets}` marker. **`src/components/Preview/index.tsx` does NOT pass `assets`.** In the editor, assets currently reach the running game because `bootstrapper.html` calls `_sb.preloadFromLocalStorage(_sbProjectId)` and `_sb.preloadAudioFromLocalStorage(_sbProjectId)`, which read `window.localStorage.getItem('persist:softBASIC')` **from inside the iframe** and parse `state.assets.byId`. Those two calls break the moment assets leave localStorage. The only current caller of the `assets` prop is `src/components/Landing/LandingHero.tsx:209` (`DEMO_ASSETS`, public-path `src` values, images only).
- **`_sb.preload(manifest)`** (`engine/assets.js`) handles images via `PIXI.Assets` only. There is **no manifest-based audio preload** — audio only has `preloadAudioFromLocalStorage`. A new `preloadAudioManifest(manifest)` must be added.
- **Content consumers of `asset.content`:**
  - `src/components/AssetPreview/ImagePreview.tsx:17` — `<img src={asset.content}>`
  - `src/components/AssetPreview/AudioPreview.tsx:11` — `<audio src={asset.content}>`
  - `src/components/AssetPreview/TextEditor.tsx` — `decodeContent(asset.content)` (data URL -> text) in `useState` init, a `useMemo`, and an `[asset.id]` effect; `handleSave` re-encodes to `data:<mime>;base64,` and dispatches `updateAsset({ ...asset, content: encoded })`. MIME sniffed from `asset.content.slice(5, indexOf(';'))`.
  - `src/components/TileMapEditor/index.tsx` — `decodeStmContent(asset.content)` (line 93 `useState` init, line 105 `[asset.id]` effect); `tilesetAsset` looked up from `state.assets.byId` by `name === draftDoc.tileImage` (line 111), its `.content` fed to `useTilesetSlices` (line 117); `handleSave` (line 241) dispatches `updateAsset({ ...asset, content: encodeStmContent(draftDoc, asset.content) })`. `encodeStmContent(doc, originalContent)` sniffs MIME from `originalContent`.
  - `src/components/TileMapEditor/NewTilemapDialog.tsx` — `uploadTilesetFile` (`FileReader.readAsDataURL` -> `addAsset` with `content`), and `handleSubmit` creates the `.stm` asset with `content: 'data:application/json;base64,' + btoa(...)`.
  - `src/components/TreePanel/AssetTree/index.tsx` — `processFiles` (`FileReader.readAsDataURL` -> `dispatch(addAsset({ ..., content: reader.result }))`); `handleCreateNewFile` creates a text asset with `content: 'data:text/plain;base64,'`; `onRemove` -> `dispatch(removeAsset(id))`.
  - `src/components/TreePanel/FileInput/index.tsx` — **dead code**, not imported anywhere. Leave it; do not wire it.
  - `src/components/Landing/LandingHero.tsx` — `handleLaunch` fetches `/ship.png` + `/bullet.png` as data URLs and dispatches `addAsset` with `content`.
- **`removeAsset` callers (need blob cleanup):** `src/features/projects/deleteProjectAndFiles.ts` (`deleteProjectWithMainFile` cascade), `src/components/TreePanel/AssetTree/index.tsx` (`onRemove`). `removeFolderWithCascade` in `src/features/folders/folderThunks.ts` re-parents assets, never deletes them — no blob cleanup needed there.
- **`importProject` callers:** `src/pages/DemosPage.tsx:29` (`const newId = dispatch(importProject(demo.json, { tags: demo.tags }))` inside `handleTryDemo`), `src/components/Projects/index.tsx:421` and `:431` (inside `handleImportFileSelected` / `handleImportOverwrite`). **`src/components/Projects/index.tsx` does NOT reference `demoRegistry` or `demo.json`** — only `DemosPage.tsx` does.
- **`exportProject` callers:** `src/components/Projects/index.tsx:347`, `src/pages/EditPage.tsx:346` (inside an `onAction` arrow).
- **`src/features/demos/demoRegistry.ts`** — four static `import ... from '../../docs/demos/*.b4wgl.json'`. `Raycaster.b4wgl.json` is **3.4 MB**. `DemoEntry` has a `json: ProjectExportJson` field. Only consumer: `DemosPage.tsx`. `tsconfig.json` has `resolveJsonModule: true`.
- **Cypress:** `cypress/e2e/demos.cy.ts` `buildPersistedStateFromExport` hand-builds `localStorage['persist:softBASIC']` with `assets: JSON.stringify({ byId, assetOrder })` where each `byId` entry includes `content`. `cypress/e2e/tutorials.cy.ts` `buildPersistedState` does the same; its `assetNames` path stamps every asset `content: PIXEL_PNG` (a 1x1 data-URL PNG). Neither suite runs automatically; both need `npm run dev` on :5173 first.
- **Tests:** live in `tests/` mirroring `src/`. Vitest config: `environment: 'node'`, `setupFiles: ['./tests/ui/setup.ts']`, `include: ['tests/**/*.{test,spec}.{ts,tsx}']`, `exclude: [..., 'tests/scratch/**']`. UI/DOM tests opt in per-file with a `// @vitest-environment jsdom` first line. `tests/ui/setup.ts` currently only does `import '@testing-library/jest-dom'`.
- **Baseline:** `npx vitest run` = **1759 passed / 1 skipped**. Verify build with `npx vite build` (NOT `tsc`). `package.json` version is `0.6.17` (do not bump — this plan does not push).
- **`localforage` and `fake-indexeddb` are NOT installed.**

---

## Design decisions locked in here (deviations / clarifications vs. the spec)

1. **`assetBlobStore` stores `{ data: ArrayBuffer; type: string }`, not a raw `Blob`.** The public API is still `Blob`-in / `Blob`-out, but the on-disk representation is an `ArrayBuffer` plus a MIME string. Rationale: `fake-indexeddb` (test env) does not reliably structured-clone `Blob`, and older Safari/localforage historically mangle stored `Blob`s. `ArrayBuffer` round-trips everywhere. The spec's "stores Blobs natively" goal is met in spirit — no base64, decoded bytes — without the fragility.
2. **The runner resolves assets to data URLs, not blob URLs.** The spec offers this as the explicit fallback ("re-encodes on each Run — a user-initiated action, acceptable cost"). Taken as the primary approach because (a) `blob:` URLs minted by the parent resolving inside a `srcdoc` iframe cannot be verified by this plan's automated tests, and (b) data URLs are exactly what the engine consumes today. A blob-URL optimization for the runner is recorded as a deferred follow-up.
3. **In-app previews (`ImagePreview`, `AudioPreview`, tileset slicing) DO use blob URLs** via `useAssetObjectUrl` — those render in the top-level document, not a `srcdoc` iframe, so `blob:` URLs are safe there.
4. **`blobToDataUrl` / `dataUrlToBlob` are implemented without `FileReader`** (loop over `Uint8Array` + `btoa`/`atob`) so they work in Vitest's `node` environment as well as the browser.

---

## File structure

**New files:**
- `src/lib/storage/dataUrl.ts` — `dataUrlToBlob`, `blobToDataUrl`. Pure functions.
- `src/lib/storage/assetBlobStore.ts` — `putAssetBlob`, `getAssetBlob`, `deleteAssetBlob`, `deleteAssetBlobs`. Wraps a `localforage` instance.
- `src/lib/storage/persistStore.ts` — default export: a redux-persist storage adapter (`getItem`/`setItem`/`removeItem`) over a second `localforage` instance.
- `src/hooks/useAssetObjectUrl.ts` — `useAssetObjectUrl(assetId?): string | undefined`.
- `src/hooks/useAssetText.ts` — `useAssetText(assetId?): { text: string | undefined; loading: boolean }`.
- `src/hooks/useRunnerAssets.ts` — `useRunnerAssets(projectId, enabled): { assets: Array<{name,src}> | null }` — resolves every project asset to a data URL for the runner.
- Test files mirroring each of the above under `tests/`.

**Modified files:** `package.json`, `tests/ui/setup.ts`, `src/store.ts`, `src/main.tsx`, `src/features/assets/assetsSlice.ts`, `src/features/projects/importProject.ts`, `src/features/projects/exportProject.ts`, `src/hooks/useRunnerMessages.ts`, `src/features/projects/deleteProjectAndFiles.ts`, `src/pages/DemosPage.tsx`, `src/pages/EditPage.tsx`, `src/components/Projects/index.tsx`, `src/components/Preview/index.tsx`, `src/components/Runner/index.tsx`, `src/components/Runner/bootstrapper.html`, `src/components/Runner/engine/assets.js`, `src/components/Runner/engine/audio.js`, `src/components/AssetPreview/ImagePreview.tsx`, `src/components/AssetPreview/AudioPreview.tsx`, `src/components/AssetPreview/TextEditor.tsx`, `src/components/TileMapEditor/index.tsx`, `src/components/TileMapEditor/NewTilemapDialog.tsx`, `src/components/TileMapEditor/useTilesetSlices.ts`, `src/components/TreePanel/AssetTree/index.tsx`, `src/components/Landing/LandingHero.tsx`, `src/features/demos/demoRegistry.ts`, `cypress/e2e/demos.cy.ts`, `cypress/e2e/tutorials.cy.ts`, plus test-file updates and docs.

---

## Task 1: Add dependencies and wire `fake-indexeddb` into the test setup

**Files:**
- Modify: `package.json`
- Modify: `tests/ui/setup.ts`

- [ ] **Step 1: Install the packages**

Run:
```bash
npm install localforage@^1.10.0
npm install --save-dev fake-indexeddb@^6.0.0
```
Expected: `package.json` gains `"localforage"` under `dependencies` and `"fake-indexeddb"` under `devDependencies`; `package-lock.json` updated.

- [ ] **Step 2: Register a fake IndexedDB for every test**

`tests/ui/setup.ts` — replace the whole file with:
```ts
// This registers DOM matchers (toBeInTheDocument, toHaveTextContent, etc.)
// for all test files. Per-test jsdom environment is enabled via
// the `// @vitest-environment jsdom` comment at the top of each UI test file.
import '@testing-library/jest-dom';

// Provides a spec-compliant in-memory `indexedDB` global for both the `node`
// and `jsdom` Vitest environments, so anything that touches `localforage`
// (the persist adapter, the asset blob store) works in unit tests without a
// real browser. Harmless for tests that never use it.
import 'fake-indexeddb/auto';
```

- [ ] **Step 3: Run the full suite to confirm nothing regressed**

Run: `npx vitest run`
Expected: PASS — 1759 passed / 1 skipped (unchanged).

- [ ] **Step 4: Confirm the build still works**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tests/ui/setup.ts
git commit -m "chore: add localforage + fake-indexeddb, wire fake IndexedDB into test setup"
```

---

## Task 2: `dataUrl.ts` conversion helpers

**Files:**
- Create: `src/lib/storage/dataUrl.ts`
- Test: `tests/lib/storage/dataUrl.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/storage/dataUrl.test.ts`:
```ts
// @vitest-environment jsdom
import { describe, test, expect } from 'vitest';
import { dataUrlToBlob, blobToDataUrl } from '../../../src/lib/storage/dataUrl';

describe('dataUrlToBlob', () => {
  test('decodes MIME type and bytes from a base64 data URL', async () => {
    // "hi" -> base64 "aGk="
    const blob = dataUrlToBlob('data:text/plain;base64,aGk=');
    expect(blob.type).toBe('text/plain');
    expect(await blob.text()).toBe('hi');
  });

  test('handles an empty payload', async () => {
    const blob = dataUrlToBlob('data:text/plain;base64,');
    expect(blob.type).toBe('text/plain');
    expect(blob.size).toBe(0);
  });

  test('falls back to application/octet-stream when MIME is absent', () => {
    const blob = dataUrlToBlob('data:;base64,aGk=');
    expect(blob.type).toBe('application/octet-stream');
  });
});

describe('blobToDataUrl', () => {
  test('produces a base64 data URL that round-trips through dataUrlToBlob', async () => {
    const original = new Blob([new Uint8Array([0, 1, 2, 253, 254, 255])], { type: 'image/png' });
    const url = await blobToDataUrl(original);
    expect(url.startsWith('data:image/png;base64,')).toBe(true);
    const back = dataUrlToBlob(url);
    expect(new Uint8Array(await back.arrayBuffer())).toEqual(new Uint8Array([0, 1, 2, 253, 254, 255]));
    expect(back.type).toBe('image/png');
  });

  test('round-trips non-ASCII text content', async () => {
    const original = new Blob(['grüße 日本語 😀'], { type: 'text/plain' });
    const back = dataUrlToBlob(await blobToDataUrl(original));
    expect(await back.text()).toBe('grüße 日本語 😀');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/lib/storage/dataUrl.test.ts`
Expected: FAIL — cannot resolve `../../../src/lib/storage/dataUrl`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/storage/dataUrl.ts`:
```ts
// Conversion between base64 `data:` URLs (the shape assets take in .b4wgl.json
// exports and in legacy persisted state) and binary Blobs (what we store in
// IndexedDB). Implemented without FileReader so it runs in Node as well as the
// browser.

/** Decode a base64 `data:` URL into a Blob, preserving its MIME type. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) {
    throw new Error('dataUrlToBlob: not a data URL');
  }
  const header = dataUrl.slice(0, comma); // e.g. "data:image/png;base64"
  const semi = header.indexOf(';');
  const mime = header.slice(5, semi === -1 ? undefined : semi) || 'application/octet-stream';
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/** Encode a Blob as a base64 `data:` URL. */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const CHUNK = 0x8000; // avoid arg-count limits on String.fromCharCode
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  const mime = blob.type || 'application/octet-stream';
  return `data:${mime};base64,${btoa(binary)}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/lib/storage/dataUrl.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage/dataUrl.ts tests/lib/storage/dataUrl.test.ts
git commit -m "feat: add data URL <-> Blob conversion helpers"
```

---

## Task 3: `assetBlobStore.ts`

**Files:**
- Create: `src/lib/storage/assetBlobStore.ts`
- Test: `tests/lib/storage/assetBlobStore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/storage/assetBlobStore.test.ts`:
```ts
// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest';
import {
  putAssetBlob,
  getAssetBlob,
  deleteAssetBlob,
  deleteAssetBlobs,
  _clearAllAssetBlobsForTests,
} from '../../../src/lib/storage/assetBlobStore';

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
});

describe('assetBlobStore', () => {
  test('put then get round-trips a blob byte-for-byte and preserves MIME', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3, 250, 251, 252])], { type: 'image/png' });
    await putAssetBlob('asset-1', blob);
    const out = await getAssetBlob('asset-1');
    expect(out).toBeDefined();
    expect(out!.type).toBe('image/png');
    expect(new Uint8Array(await out!.arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3, 250, 251, 252]),
    );
  });

  test('getAssetBlob returns undefined for an unknown id', async () => {
    expect(await getAssetBlob('nope')).toBeUndefined();
  });

  test('deleteAssetBlob removes a single entry', async () => {
    await putAssetBlob('a', new Blob(['x']));
    await deleteAssetBlob('a');
    expect(await getAssetBlob('a')).toBeUndefined();
  });

  test('deleteAssetBlobs removes a batch and leaves others intact', async () => {
    await putAssetBlob('a', new Blob(['a']));
    await putAssetBlob('b', new Blob(['b']));
    await putAssetBlob('c', new Blob(['c']));
    await deleteAssetBlobs(['a', 'c']);
    expect(await getAssetBlob('a')).toBeUndefined();
    expect(await getAssetBlob('c')).toBeUndefined();
    expect(await getAssetBlob('b')).toBeDefined();
  });

  test('put overwrites an existing entry', async () => {
    await putAssetBlob('a', new Blob(['first'], { type: 'text/plain' }));
    await putAssetBlob('a', new Blob(['second'], { type: 'text/plain' }));
    expect(await (await getAssetBlob('a'))!.text()).toBe('second');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/lib/storage/assetBlobStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/storage/assetBlobStore.ts`:
```ts
import localforage from 'localforage';

// Asset binary content, keyed by asset id, in its own IndexedDB object store —
// kept out of the persisted Redux blob so a few MB of audio no longer blows the
// ~5 MB localStorage quota. Stored as { data: ArrayBuffer, type: string } rather
// than a raw Blob: ArrayBuffers structured-clone reliably in every engine
// (including fake-indexeddb under test), a raw Blob does not.

interface StoredBlob {
  data: ArrayBuffer;
  type: string;
}

const blobStore = localforage.createInstance({
  name: 'softBASIC',
  storeName: 'assetBlobs',
  description: 'asset binary content, keyed by asset id',
});

export async function putAssetBlob(id: string, blob: Blob): Promise<void> {
  const record: StoredBlob = { data: await blob.arrayBuffer(), type: blob.type };
  await blobStore.setItem(id, record);
}

export async function getAssetBlob(id: string): Promise<Blob | undefined> {
  const record = await blobStore.getItem<StoredBlob>(id);
  if (!record) return undefined;
  return new Blob([record.data], { type: record.type });
}

export async function deleteAssetBlob(id: string): Promise<void> {
  await blobStore.removeItem(id);
}

export async function deleteAssetBlobs(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => blobStore.removeItem(id)));
}

/** Test-only: wipe the store between cases. Not for production use. */
export async function _clearAllAssetBlobsForTests(): Promise<void> {
  await blobStore.clear();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/lib/storage/assetBlobStore.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage/assetBlobStore.ts tests/lib/storage/assetBlobStore.test.ts
git commit -m "feat: add IndexedDB asset blob store"
```

---

## Task 4: `persistStore.ts` redux-persist adapter

**Files:**
- Create: `src/lib/storage/persistStore.ts`
- Test: `tests/lib/storage/persistStore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/storage/persistStore.test.ts`:
```ts
// @vitest-environment jsdom
import { describe, test, expect } from 'vitest';
import persistStorage from '../../../src/lib/storage/persistStore';

describe('persistStorage (redux-persist adapter over localforage)', () => {
  test('setItem then getItem returns the stored string', async () => {
    await persistStorage.setItem('softBASIC', '{"a":1}');
    expect(await persistStorage.getItem('softBASIC')).toBe('{"a":1}');
  });

  test('getItem returns null for a missing key', async () => {
    expect(await persistStorage.getItem('does-not-exist')).toBeNull();
  });

  test('removeItem deletes the key', async () => {
    await persistStorage.setItem('k', 'v');
    await persistStorage.removeItem('k');
    expect(await persistStorage.getItem('k')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/lib/storage/persistStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/storage/persistStore.ts`:
```ts
import localforage from 'localforage';

// redux-persist storage adapter backed by IndexedDB via localforage. redux-persist
// calls getItem/setItem/removeItem and expects Promises — localforage satisfies
// that directly. It stores one string value (the serialized non-asset Redux
// state), which is now small because asset binaries live in a separate store.

const persistStore = localforage.createInstance({
  name: 'softBASIC',
  storeName: 'persist',
  description: 'redux-persist state',
});

export default {
  // localforage resolves missing keys to `null`, which is exactly what
  // redux-persist expects.
  getItem: (key: string): Promise<string | null> => persistStore.getItem<string>(key),
  setItem: (key: string, value: string): Promise<string> => persistStore.setItem(key, value),
  removeItem: (key: string): Promise<void> => persistStore.removeItem(key),
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/lib/storage/persistStore.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage/persistStore.ts tests/lib/storage/persistStore.test.ts
git commit -m "feat: add redux-persist storage adapter backed by IndexedDB"
```

---

## Task 5: Swap the persist storage engine + clear the dead localStorage key on boot

**Files:**
- Modify: `src/store.ts`
- Modify: `src/main.tsx`
- Test: `tests/lib/storage/persistIntegration.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `tests/lib/storage/persistIntegration.test.ts`:
```ts
// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import persistStorage from '../../../src/lib/storage/persistStore';
import projectsReducer, { addProject } from '../../../src/features/projects/projectsSlice';
import assetsReducer from '../../../src/features/assets/assetsSlice';

const rootReducer = combineReducers({ projects: projectsReducer, assets: assetsReducer });

function makePersistedStore() {
  const store = configureStore({
    reducer: persistReducer({ key: 'softBASIC-test', storage: persistStorage }, rootReducer),
    middleware: (gdm) => gdm({ serializableCheck: false }),
  });
  const persistor = persistStore(store);
  return { store, persistor };
}

beforeEach(async () => {
  await persistStorage.removeItem('persist:softBASIC-test');
});

describe('redux-persist over IndexedDB', () => {
  test('state written to one store is rehydrated into a fresh store', async () => {
    const { store, persistor } = makePersistedStore();
    store.dispatch(addProject({ id: 'p1', name: 'Persisted Game', packageIds: [] }));
    await persistor.flush();

    const { store: store2, persistor: persistor2 } = makePersistedStore();
    await new Promise<void>((resolve) => {
      const unsub = persistor2.subscribe(() => {
        if (persistor2.getState().bootstrapped) {
          unsub();
          resolve();
        }
      });
    });
    expect(store2.getState().projects.items).toEqual([
      expect.objectContaining({ id: 'p1', name: 'Persisted Game' }),
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/lib/storage/persistIntegration.test.ts`
Expected: this test actually PASSES already (it constructs its own store from `persistStorage`). Run it to confirm the adapter works end-to-end with redux-persist; it is a guard, not a red test. If it fails, fix `persistStore.ts` before continuing.

- [ ] **Step 3: Update `src/store.ts`**

Replace the `storage` import and its use:
```ts
// remove:  import storage from "redux-persist/lib/storage";
// add:
import persistStorage from "./lib/storage/persistStore";
```
```ts
const persistedConfig = {
  key: "softBASIC",
  storage: persistStorage,
  blacklist: ["session", "packages"],
  transforms: [clearDirtyOnRehydrate],
};
```

- [ ] **Step 4: Clear the dead localStorage key on boot**

`src/main.tsx` — immediately after the imports and before `Sentry.init(...)`, add:
```ts
// Assets and persisted state moved from localStorage to IndexedDB (see
// docs/superpowers/plans/2026-08-30-indexeddb-asset-storage.md). There is no
// migration — the pre-move key is simply dropped so it can't shadow anything
// or waste quota.
try {
  window.localStorage.removeItem("persist:softBASIC");
} catch {
  /* ignore — private browsing / storage disabled */
}
```

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: PASS — 1759 passed (+ the new storage tests), 1 skipped. No regressions.

- [ ] **Step 6: Build**

Run: `npx vite build`
Expected: success.

- [ ] **Step 7: Manual smoke (dev server)**

Run `npm run dev`, open the app, create a project, add a small text asset, refresh. Confirm the project and asset metadata survive the reload. In devtools Application tab: `localStorage` has **no** `persist:softBASIC` key; IndexedDB has a `softBASIC` database with a `persist` store.

- [ ] **Step 8: Commit**

```bash
git add src/store.ts src/main.tsx tests/lib/storage/persistIntegration.test.ts
git commit -m "feat: persist Redux state to IndexedDB, drop legacy localStorage key"
```

---

## Task 6: Remove `content` from `IAsset` and fix every compile break

This is the clean break. After this task the persisted state no longer carries asset binaries; write/read paths are repaired in Tasks 7–13. Between steps the build is red (expected for TDD); each **commit** is green.

**Files:**
- Modify: `src/features/assets/assetsSlice.ts`
- Modify: `src/features/projects/importProject.ts`
- Modify: `src/features/projects/exportProject.ts`
- Modify: `src/hooks/useRunnerMessages.ts`
- Modify: `src/components/AssetPreview/ImagePreview.tsx`
- Modify: `src/components/AssetPreview/AudioPreview.tsx`
- Modify: `src/components/AssetPreview/TextEditor.tsx`
- Modify: `src/components/TileMapEditor/index.tsx`
- Modify: `src/components/TileMapEditor/NewTilemapDialog.tsx`
- Modify: `src/components/TileMapEditor/useTilesetSlices.ts`
- Modify: `src/components/TreePanel/AssetTree/index.tsx`
- Modify: `src/components/Landing/LandingHero.tsx`
- Modify: `src/features/projects/deleteProjectAndFiles.ts`
- Modify: `src/pages/DemosPage.tsx`
- Test: `tests/ui/features/assets/assetsSlice.test.ts` (existing — update)

> **Note for the implementer:** Tasks 7–13 replace the temporary shims added here with real blob I/O. The shims here exist only to keep the app compiling and the slice tests green. Do not skip Tasks 7–13.

- [ ] **Step 1: Update the slice test to assert `content` is gone**

In `tests/ui/features/assets/assetsSlice.test.ts`, find every object passed to `addAsset` / `updateAsset` and remove the `content` property. Add this test to the `addAsset` describe block:
```ts
test('addAsset stores metadata only — no content field', () => {
  const state = reducer(undefined, addAsset({
    id: 'a1', name: 'hero.png', projectId: 'p1', folderId: null, fullName: 'hero.png',
  }));
  expect(state.byId.a1).toEqual({
    id: 'a1', name: 'hero.png', projectId: 'p1', folderId: null, fullName: 'hero.png',
  });
  expect('content' in state.byId.a1).toBe(false);
});
```
(Match the existing file's import name for the reducer — it may be `assetsReducer` or `reducer`.)

- [ ] **Step 2: Run the slice test — see it fail**

Run: `npx vitest run tests/ui/features/assets/assetsSlice.test.ts`
Expected: FAIL — type errors / the new test fails because `content` is still required.

- [ ] **Step 3: Edit `src/features/assets/assetsSlice.ts`**

```ts
export interface IAsset {
  id: string;
  name: string;
  projectId: string;
  folderId: string | null;
  fullName: string;
}
```
The `addAsset` payload type (`Omit<IAsset, 'folderId' | 'fullName'> & Partial<...>`) and body need no change beyond `content` no longer existing — the `Omit` already drops nothing else, and the spread `{ folderId: null, fullName: action.payload.name, ...action.payload }` still works. `updateAsset` payload is `PayloadAction<IAsset>` — unchanged, now metadata-only. `removeAsset` unchanged.

- [ ] **Step 4: Run the slice test — see it pass**

Run: `npx vitest run tests/ui/features/assets/assetsSlice.test.ts`
Expected: PASS.

- [ ] **Step 5: Repair `src/features/projects/exportProject.ts` (types only here)**

`ProjectExportJson.assets[]` — **keep `content: string`** (the export format is unchanged). Change `ExportableState.assets.byId` to `Record<string, IAsset>` (already is). In `buildExportJson`, the asset map currently destructures `content` from each `IAsset` — that no longer exists. Make `buildExportJson` async in Task 8; for now, to keep this task compiling, change the asset mapping to a placeholder that Task 8 replaces:
```ts
// TEMPORARY (Task 8 makes this async and reads real bytes from the blob store):
const assets = Object.values(state.assets.byId)
  .filter((a) => a.projectId === projectId)
  .map(({ id, name, folderId, fullName }) => ({ id, name, folderId, fullName, content: '' }));
```

- [ ] **Step 6: Repair `src/hooks/useRunnerMessages.ts`**

It destructures `{ id, name, fullName, folderId }` from `exportJson.assets` already (not `content`) — **no change needed** to the map. But `buildExportJson` becomes async in Task 8; for now it still returns synchronously, so this file compiles unchanged. Leave it.

- [ ] **Step 7: Repair `src/features/projects/importProject.ts` (shim)**

Both `dispatch(addAsset({ ... content: asset.content ... }))` calls: drop `content: asset.content`. Task 14 makes the thunk async and writes blobs. For now:
```ts
dispatch(addAsset({
  id: assetIdMap[oldId],
  name: asset.name,
  projectId: newProjectId,
  folderId: asset.folderId ? (folderIdMap[asset.folderId] ?? null) : null,
  fullName: asset.fullName,
}));
```
(and the same for the second, defensive loop.)

- [ ] **Step 8: Repair `src/features/projects/deleteProjectAndFiles.ts`**

No `content` reference — compiles unchanged. Task 16 adds blob cleanup. Leave it.

- [ ] **Step 9: Repair `src/components/AssetPreview/ImagePreview.tsx` (shim)**

Replace `src={asset.content}` with `src={''}` and add `// TODO(Task 12): useAssetObjectUrl`. The component still renders; the image just won't load until Task 12.

- [ ] **Step 10: Repair `src/components/AssetPreview/AudioPreview.tsx` (shim)**

Same: `src={''}` + `// TODO(Task 12)`.

- [ ] **Step 11: Repair `src/components/AssetPreview/TextEditor.tsx` (shim)**

Replace the three `decodeContent(asset.content)` call sites with `decodeContent('')` and the `handleSave` MIME sniff (`asset.content.startsWith('data:') ? ... : 'text/plain'`) with a name-based sniff:
```ts
function mimeFromName(name: string): string {
  if (name.endsWith('.json')) return 'application/json';
  if (name.endsWith('.stm')) return 'application/json';
  return 'text/plain';
}
```
`handleSave` for now: `dispatch(updateAsset({ ...asset }))` and a `// TODO(Task 9)`. Task 9 rewrites this to `putAssetBlob`.

- [ ] **Step 12: Repair `src/components/TileMapEditor/index.tsx` (shim)**

- `decodeStmContent(asset.content)` (2 sites) -> `decodeStmContent('')` + `// TODO(Task 13)`.
- `const tilesetAsset = useSelector(...)` — keep (it returns an `IAsset` with no `content`).
- `useTilesetSlices(tilesetAsset?.content, ...)` -> `useTilesetSlices(undefined, ...)` for now + `// TODO(Task 13)`.
- `handleSave`: `dispatch(updateAsset({ ...asset }))` + `// TODO(Task 13)`.
- `encodeStmContent(doc, originalContent)` — keep the function but Task 13 changes its call. Leave the function as-is.

- [ ] **Step 13: Repair `src/components/TileMapEditor/NewTilemapDialog.tsx` (shim)**

Both `dispatch(addAsset({ ... content: ... }))` -> drop `content`. `uploadTilesetFile` and `handleSubmit` get `// TODO(Task 13)`.

- [ ] **Step 14: Repair `src/components/TileMapEditor/useTilesetSlices.ts`**

No change — its param is already `imageContent: string | undefined`. Task 13 will pass it an object URL instead of a data URL; both are valid `img.src` values, so the hook body is unchanged. Leave it.

- [ ] **Step 15: Repair `src/components/TreePanel/AssetTree/index.tsx` (shim)**

- `processFiles`: drop `content: reader.result as string` from the `addAsset` payload; keep the `FileReader` for now (Task 7 removes it). `// TODO(Task 7)`.
- `handleCreateNewFile`: drop `content: 'data:text/plain;base64,'`. `// TODO(Task 8)`.

- [ ] **Step 16: Repair `src/components/Landing/LandingHero.tsx` (shim)**

`handleLaunch`: drop `content` from the `addAsset` payload. `// TODO(Task 17)`. `DEMO_ASSETS` (the `assets` prop for the live preview `<Runner>`) is unaffected — it uses public paths, not `content`.

- [ ] **Step 17: Repair `src/pages/DemosPage.tsx`**

No `content` reference — compiles unchanged. Task 14 adds `await`. Leave it.

- [ ] **Step 18: Search for any remaining `.content` on assets**

Run: `grep -rn "\.content" src --include='*.ts' --include='*.tsx' | grep -iv "textContent\|innerContent"`
Review every hit. Any referring to an `IAsset` must be shimmed. Also run:
Run: `grep -rn "content:" src --include='*.ts' --include='*.tsx' | grep -i asset`

- [ ] **Step 19: Fix broken existing tests**

Run: `npx vitest run`
Expect failures in: `tests/ui/features/projects/importProject.test.ts`, `tests/ui/features/projects/exportProject.test.ts`, `tests/ui/components/AssetPreview/*`, any TileMapEditor tests, any test constructing an `IAsset` literal with `content`.

For each:
- `importProject.test.ts`: remove `content` from `sampleJson.assets[].content`? **No** — `ProjectExportJson.assets[]` keeps `content`. Remove the `asset content is preserved` test (moved to the round-trip test in Task 15) and the `imports all assets with new IDs` test keeps working. Delete `test('asset content is preserved', ...)`.
- `exportProject.test.ts`: remove `content` from the `state.assets.byId` literal; the `buildExportJson` asset assertions that check `content` — update to expect `content: ''` for now, with a `// updated in Task 8` comment.
- `AssetPreview` component tests: remove `content` from `IAsset` literals; `ImagePreview.test.tsx` `src` assertion -> expect `''` for now (`// updated in Task 12`).
- Any `tests/ui/components/TileMapEditor/*` and `tests/ui/hooks/*` fixtures: strip `content`.

Fix them all until the suite is green (allowing the temporarily-weakened assertions noted above).

- [ ] **Step 20: Build**

Run: `npx vite build`
Expected: success (no type errors).

- [ ] **Step 21: Commit**

```bash
git add -A
git commit -m "feat!: drop content from IAsset — asset binaries no longer in Redux/persist"
```

---

## Task 7: Write path — asset upload via `AssetTree.processFiles`

**Files:**
- Modify: `src/components/TreePanel/AssetTree/index.tsx`
- Test: `tests/ui/components/TreePanel/AssetTree.upload.test.tsx` (new)

- [ ] **Step 1: Write the failing test**

Create `tests/ui/components/TreePanel/AssetTree.upload.test.tsx`:
```ts
// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach } from 'vitest';
import assetsReducer from '../../../../src/features/assets/assetsSlice';
import foldersReducer from '../../../../src/features/folders/foldersSlice';
import AssetTree from '../../../../src/components/TreePanel/AssetTree';
import { getAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

const makeStore = () =>
  configureStore({ reducer: { assets: assetsReducer, folders: foldersReducer } });

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
});

describe('AssetTree upload', () => {
  test('writes uploaded file bytes to the blob store and dispatches metadata', async () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <AssetTree projectId="p1" />
      </Provider>,
    );

    const file = new File([new Uint8Array([137, 80, 78, 71])], 'hero.png', { type: 'image/png' });
    const input = screen.getByTestId('uploader') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(Object.keys(store.getState().assets.byId)).toHaveLength(1);
    });
    const asset = Object.values(store.getState().assets.byId)[0];
    expect(asset.name).toBe('hero.png');
    expect('content' in asset).toBe(false);

    const blob = await getAssetBlob(asset.id);
    expect(blob).toBeDefined();
    expect(new Uint8Array(await blob!.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]));
    expect(blob!.type).toBe('image/png');
  });
});
```

- [ ] **Step 2: Run — see it fail**

Run: `npx vitest run tests/ui/components/TreePanel/AssetTree.upload.test.tsx`
Expected: FAIL — `getAssetBlob` returns `undefined` (upload only dispatches metadata after Task 6's shim).

- [ ] **Step 3: Implement — rewrite `processFiles`**

In `src/components/TreePanel/AssetTree/index.tsx`, add the import:
```ts
import { putAssetBlob } from '../../../lib/storage/assetBlobStore';
```
Replace `processFiles` with:
```ts
const processFiles = async (fileList: FileList, targetFolderId: string | null = null) => {
  for (const f of Array.from(fileList)) {
    if (f.size > MAX_BYTES) { alert(`${f.name} is too large (max ${MAX_BYTES / (1024 * 1024)} MB).`); return; }
  }
  await Promise.all(
    Array.from(fileList).map(async (file) => {
      const id = crypto.randomUUID();
      // A File is already a Blob — store the raw bytes directly, no base64.
      await putAssetBlob(id, file);
      const assetName = file.name;
      const fullName = getFullName(assetName, targetFolderId, folders);
      dispatch(addAsset({ id, name: assetName, projectId, folderId: targetFolderId, fullName }));
    }),
  );
};
```
Raise `MAX_BYTES` from `4 * 1024 * 1024` to `25 * 1024 * 1024` (IndexedDB, not the 5 MB localStorage cap). Update the module-level `const MAX_BYTES` near the top of the file.

- [ ] **Step 4: Run — see it pass**

Run: `npx vitest run tests/ui/components/TreePanel/AssetTree.upload.test.tsx`
Expected: PASS.

- [ ] **Step 5: Full suite + build**

Run: `npx vitest run` then `npx vite build`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src/components/TreePanel/AssetTree/index.tsx tests/ui/components/TreePanel/AssetTree.upload.test.tsx
git commit -m "feat: write uploaded asset bytes to the blob store"
```

---

## Task 8: Write path — new text file + new tilemap dialog + `buildExportJson` async

**Files:**
- Modify: `src/components/TreePanel/AssetTree/index.tsx` (`handleCreateNewFile`)
- Modify: `src/components/TileMapEditor/NewTilemapDialog.tsx`
- Modify: `src/features/projects/exportProject.ts` (`buildExportJson` -> async)
- Test: `tests/ui/features/projects/exportProject.test.ts` (update), `tests/ui/components/TileMapEditor/NewTilemapDialog.test.tsx` (new or update)

- [ ] **Step 1: Write the failing test for `buildExportJson`**

In `tests/ui/features/projects/exportProject.test.ts`: seed the blob store in a `beforeEach`, make every test `await buildExportJson(...)`, and assert real content. Add at the top:
```ts
import { putAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';
import { dataUrlToBlob } from '../../../../src/lib/storage/dataUrl';

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
  await putAssetBlob('a1', dataUrlToBlob('data:image/png;base64,abc='));
});
```
Change the `state.assets.byId.a1` literal to metadata-only (`{ id:'a1', name:'hero.png', projectId:'p1', folderId:null, fullName:'hero.png' }`). Add:
```ts
test('asset content is read from the blob store as a base64 data URL', async () => {
  const json = await buildExportJson('p1', state);
  expect(json.assets).toHaveLength(1);
  expect(json.assets[0].content).toBe('data:image/png;base64,abc=');
});
```
Convert the other `buildExportJson('p1', state)` calls to `await buildExportJson('p1', state)` and mark the describe block / tests `async`.

- [ ] **Step 2: Run — see it fail**

Run: `npx vitest run tests/ui/features/projects/exportProject.test.ts`
Expected: FAIL — `buildExportJson` is sync and returns `content: ''`.

- [ ] **Step 3: Implement `buildExportJson` async**

In `src/features/projects/exportProject.ts`:
```ts
import { getAssetBlob } from '../../lib/storage/assetBlobStore';
import { blobToDataUrl } from '../../lib/storage/dataUrl';
```
```ts
export async function buildExportJson(projectId: string, state: ExportableState): Promise<ProjectExportJson> {
  const project = state.projects.items.find((p) => p.id === projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  const folders = state.folders.items
    .filter((f) => f.projectId === projectId)
    .map(({ id, name, parentId, section }) => ({ id, name, parentId, section }));

  const files = Object.values(state.files.byId)
    .filter((f) => f.projectId === projectId)
    .map(({ id, name, source, folderId, fullName }) => ({ id, name, source, folderId, fullName }));

  const assets = await Promise.all(
    Object.values(state.assets.byId)
      .filter((a) => a.projectId === projectId)
      .map(async ({ id, name, folderId, fullName }) => {
        const blob = await getAssetBlob(id);
        const content = blob ? await blobToDataUrl(blob) : '';
        return { id, name, content, folderId, fullName };
      }),
  );

  const fileOrder: Record<string, string[]> = {};
  Object.entries(state.files.fileOrder).forEach(([key, ids]) => {
    if (key.startsWith(`${projectId}:`)) fileOrder[key.slice(projectId.length)] = ids;
  });
  const assetOrder: Record<string, string[]> = {};
  Object.entries(state.assets.assetOrder).forEach(([key, ids]) => {
    if (key.startsWith(`${projectId}:`)) assetOrder[key.slice(projectId.length)] = ids;
  });

  return { version: 1, project: { name: project.name }, folders, files, assets, fileOrder, assetOrder };
}
```
Update `exportProject` thunk:
```ts
export const exportProject =
  (projectId: string) => async (_dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const project = state.projects.items.find((p) => p.id === projectId);
    if (!project) return;
    const json = await buildExportJson(projectId, state);
    triggerDownload(json, `${project.name}.b4wgl.json`);
  };
```

- [ ] **Step 4: Fix `useRunnerMessages.ts` for the async signature**

`buildExportJson` is now async. In `src/hooks/useRunnerMessages.ts`, the `runtimeError` handler builds a Sentry payload synchronously inside `onMessage`. Make the Sentry branch fire-and-forget:
```ts
case 'runtimeError':
  dispatch(addLog({ type: LogItemType.Error, text: e.data.message }));
  if (projectId) {
    const message = e.data.message;
    void (async () => {
      try {
        const state = store.getState();
        const exportJson = await buildExportJson(projectId, state);
        const sanitized = {
          ...exportJson,
          assets: exportJson.assets.map(({ id, name, fullName, folderId }) => ({ id, name, fullName, folderId })),
        };
        Sentry.captureMessage(message, { level: 'error', extra: { project: sanitized } });
      } catch {
        Sentry.captureMessage(message, { level: 'error' });
      }
    })();
  }
  break;
```
Update `tests/ui/hooks/useRunnerMessages.test.tsx` if it asserts on synchronous Sentry calls — wrap those assertions in `await waitFor(...)`. Seed the blob store in a `beforeEach` there too if a test provides assets.

- [ ] **Step 5: Implement `handleCreateNewFile` (AssetTree) with a blob write**

In `src/components/TreePanel/AssetTree/index.tsx`, make `handleCreateNewFile` async:
```ts
const handleCreateNewFile = async () => {
  const name = newFileName.trim();
  const error = validateAssetName(name, allAssets, selectedFolderId);
  if (error) { setNewFileError(error); return; }
  const id = crypto.randomUUID();
  const fullName = getFullName(name, selectedFolderId, folders);
  await putAssetBlob(id, new Blob([''], { type: 'text/plain' }));
  dispatch(addAsset({ id, name, projectId, folderId: selectedFolderId, fullName }));
  if (selectedFolderId) setOpenFolders((prev) => ({ ...prev, [selectedFolderId]: true }));
  onOpenAsset?.(id);
  setNewFileModalOpen(false);
  setNewFileName('');
  setNewFileError(null);
};
```
The two `onClick`/`onKeyDown` callers of `handleCreateNewFile` can call it without `await` (fire-and-forget is fine for a UI action).

- [ ] **Step 6: Implement `NewTilemapDialog` with blob writes**

In `src/components/TileMapEditor/NewTilemapDialog.tsx`:
```ts
import { putAssetBlob } from '../../lib/storage/assetBlobStore';
```
`uploadTilesetFile`:
```ts
const uploadTilesetFile = async (file: File) => {
  const id = crypto.randomUUID();
  await putAssetBlob(id, file);
  dispatch(addAsset({ id, name: file.name, projectId, folderId: null, fullName: file.name }));
  setTileImageName(file.name);
};
```
(callers: `onDrop` handler — call without await.)
`handleSubmit`:
```ts
const handleSubmit = async () => {
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
  const id = crypto.randomUUID();
  await putAssetBlob(id, new Blob([JSON.stringify(doc)], { type: 'application/json' }));
  dispatch(addAsset({ id, name, projectId, folderId: null, fullName: name }));
  onCreated(id);
};
```
The `onClick={handleSubmit}` on the Create button works with an async handler as-is.

- [ ] **Step 7: Update `NewTilemapDialog` test**

If `tests/ui/components/TileMapEditor/NewTilemapDialog.test.tsx` exists, update it to `await` and assert `getAssetBlob(newId)` returns a JSON blob whose text parses to the expected doc. Seed / clear the blob store in `beforeEach`.

- [ ] **Step 8: Run affected tests, then the full suite**

Run: `npx vitest run tests/ui/features/projects/exportProject.test.ts tests/ui/hooks/useRunnerMessages.test.tsx tests/ui/components/TileMapEditor tests/ui/components/TreePanel`
then `npx vitest run`
Expected: green.

- [ ] **Step 9: Build**

Run: `npx vite build`
Expected: success.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: blob-backed writes for new text/tilemap assets; async buildExportJson"
```

---

## Task 9: `useAssetText` hook + wire `TextEditor` reads and saves

**Files:**
- Create: `src/hooks/useAssetText.ts`
- Modify: `src/components/AssetPreview/TextEditor.tsx`
- Test: `tests/ui/hooks/useAssetText.test.tsx` (new), `tests/ui/components/AssetPreview/TextEditor.test.tsx` (update)

- [ ] **Step 1: Write the failing hook test**

Create `tests/ui/hooks/useAssetText.test.tsx`:
```ts
// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { useAssetText } from '../../../src/hooks/useAssetText';
import { putAssetBlob, _clearAllAssetBlobsForTests } from '../../../src/lib/storage/assetBlobStore';

beforeEach(async () => { await _clearAllAssetBlobsForTests(); });

describe('useAssetText', () => {
  test('resolves the blob text for an id', async () => {
    await putAssetBlob('a1', new Blob(['level data'], { type: 'text/plain' }));
    const { result } = renderHook(() => useAssetText('a1'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.text).toBe('level data');
  });

  test('text is undefined for a missing blob', async () => {
    const { result } = renderHook(() => useAssetText('missing'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.text).toBeUndefined();
  });

  test('undefined id resolves immediately with no text', async () => {
    const { result } = renderHook(() => useAssetText(undefined));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.text).toBeUndefined();
  });

  test('re-resolves when the id changes', async () => {
    await putAssetBlob('a1', new Blob(['one']));
    await putAssetBlob('a2', new Blob(['two']));
    const { result, rerender } = renderHook(({ id }) => useAssetText(id), {
      initialProps: { id: 'a1' as string | undefined },
    });
    await waitFor(() => expect(result.current.text).toBe('one'));
    rerender({ id: 'a2' });
    await waitFor(() => expect(result.current.text).toBe('two'));
  });
});
```

- [ ] **Step 2: Run — see it fail**

Run: `npx vitest run tests/ui/hooks/useAssetText.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/hooks/useAssetText.ts`**

```ts
import { useEffect, useState } from 'react';
import { getAssetBlob } from '../lib/storage/assetBlobStore';

/**
 * Loads an asset's binary content from the blob store and decodes it as text.
 * Returns { text: undefined, loading: true } until it resolves; text stays
 * undefined if the blob is missing.
 */
export function useAssetText(assetId: string | undefined): { text: string | undefined; loading: boolean } {
  const [state, setState] = useState<{ text: string | undefined; loading: boolean }>({
    text: undefined,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ text: undefined, loading: true });
    if (!assetId) {
      setState({ text: undefined, loading: false });
      return;
    }
    getAssetBlob(assetId).then(async (blob) => {
      if (cancelled) return;
      setState({ text: blob ? await blob.text() : undefined, loading: false });
    });
    return () => { cancelled = true; };
  }, [assetId]);

  return state;
}
```

- [ ] **Step 4: Run — see it pass**

Run: `npx vitest run tests/ui/hooks/useAssetText.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Update `TextEditor.test.tsx`**

Rewrite so it seeds a blob (`await putAssetBlob(asset.id, new Blob(['hello'], { type: 'text/plain' }))` in `beforeEach`, clear too), renders, `await`s the textarea to show `hello`, edits it, clicks Save, and asserts `getAssetBlob(asset.id)` now contains the edited text. Remove the old `content`-based assertions.

- [ ] **Step 6: Run — see it fail**

Run: `npx vitest run tests/ui/components/AssetPreview/TextEditor.test.tsx`
Expected: FAIL — editor seeds from `decodeContent('')`, saves via `updateAsset` shim.

- [ ] **Step 7: Implement `TextEditor.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { IAsset } from '../../features/assets/assetsSlice';
import { useAssetText } from '../../hooks/useAssetText';
import { putAssetBlob } from '../../lib/storage/assetBlobStore';

type Props = { asset: IAsset; onDirtyChange?: (assetId: string, dirty: boolean) => void };

function mimeFromName(name: string): string {
  if (name.endsWith('.json') || name.endsWith('.stm')) return 'application/json';
  return 'text/plain';
}

const TextEditor: React.FC<Props> = ({ asset, onDirtyChange }) => {
  const { text: storedText, loading } = useAssetText(asset.id);
  const [draftText, setDraftText] = useState('');

  useEffect(() => {
    if (!loading) setDraftText(storedText ?? '');
  }, [asset.id, loading, storedText]);

  const isDirty = !loading && draftText !== (storedText ?? '');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftText(e.target.value);
    onDirtyChange?.(asset.id, e.target.value !== (storedText ?? ''));
  };

  const handleSave = async () => {
    await putAssetBlob(asset.id, new Blob([draftText], { type: mimeFromName(asset.name) }));
    onDirtyChange?.(asset.id, false);
    // storedText is re-read on next mount; force a local sync so the button disables now
    setDraftText(draftText);
  };

  return (
    <div className="flex flex-col h-full p-2 gap-2">
      <textarea
        aria-label="Asset text content"
        value={draftText}
        onChange={handleChange}
        disabled={loading}
        className="flex-1 resize-none bg-ds-bg text-ds-text border border-ds-border rounded p-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ds-accent"
      />
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!isDirty}
          onClick={handleSave}
          className="bg-accent-gradient text-white text-sm px-4 py-1.5 rounded hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default TextEditor;
```
> **Known limitation:** after Save, `useAssetText` does not re-fetch (the blob store is outside Redux), so `isDirty` relies on the local `setDraftText(draftText)` no-op keeping `draftText === storedText` false until remount. If a test needs the button to re-disable without remount, add a `savedText` state set on save and compare against `draftText`. Prefer that if it keeps the test simple:
```ts
const [savedText, setSavedText] = useState<string | null>(null);
const baseline = savedText ?? storedText ?? '';
const isDirty = !loading && draftText !== baseline;
// in handleSave: setSavedText(draftText);
// in the asset.id effect: setSavedText(null);
```

- [ ] **Step 8: Run — see it pass**

Run: `npx vitest run tests/ui/components/AssetPreview/TextEditor.test.tsx`
Expected: PASS.

- [ ] **Step 9: Full suite + build**

Run: `npx vitest run` then `npx vite build`
Expected: green.

- [ ] **Step 10: Commit**

```bash
git add src/hooks/useAssetText.ts src/components/AssetPreview/TextEditor.tsx tests/ui/hooks/useAssetText.test.tsx tests/ui/components/AssetPreview/TextEditor.test.tsx
git commit -m "feat: text assets read/write through the blob store via useAssetText"
```

---

## Task 10: `useAssetObjectUrl` hook

**Files:**
- Create: `src/hooks/useAssetObjectUrl.ts`
- Test: `tests/ui/hooks/useAssetObjectUrl.test.tsx` (new)

- [ ] **Step 1: Write the failing test**

Create `tests/ui/hooks/useAssetObjectUrl.test.tsx`:
```ts
// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAssetObjectUrl } from '../../../src/hooks/useAssetObjectUrl';
import { putAssetBlob, _clearAllAssetBlobsForTests } from '../../../src/lib/storage/assetBlobStore';

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
  let n = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:mock/${++n}`);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('useAssetObjectUrl', () => {
  test('returns undefined then a blob URL once loaded', async () => {
    await putAssetBlob('a1', new Blob(['x'], { type: 'image/png' }));
    const { result } = renderHook(() => useAssetObjectUrl('a1'));
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBe('blob:mock/1'));
  });

  test('revokes the URL on unmount', async () => {
    await putAssetBlob('a1', new Blob(['x']));
    const { result, unmount } = renderHook(() => useAssetObjectUrl('a1'));
    await waitFor(() => expect(result.current).toBe('blob:mock/1'));
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock/1');
  });

  test('revokes the old URL and mints a new one when the id changes', async () => {
    await putAssetBlob('a1', new Blob(['one']));
    await putAssetBlob('a2', new Blob(['two']));
    const { result, rerender } = renderHook(({ id }) => useAssetObjectUrl(id), {
      initialProps: { id: 'a1' as string | undefined },
    });
    await waitFor(() => expect(result.current).toBe('blob:mock/1'));
    rerender({ id: 'a2' });
    await waitFor(() => expect(result.current).toBe('blob:mock/2'));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock/1');
  });

  test('returns undefined for a missing blob or undefined id', async () => {
    const { result } = renderHook(() => useAssetObjectUrl(undefined));
    await waitFor(() => expect(result.current).toBeUndefined());
  });
});
```

- [ ] **Step 2: Run — see it fail**

Run: `npx vitest run tests/ui/hooks/useAssetObjectUrl.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/hooks/useAssetObjectUrl.ts`**

```ts
import { useEffect, useState } from 'react';
import { getAssetBlob } from '../lib/storage/assetBlobStore';

/**
 * Resolves an asset id to an object URL for its binary content, suitable for
 * <img src>, <audio src>, or `new Image().src`. Returns undefined while loading
 * or if the blob is missing. Revokes the URL on unmount and whenever the id
 * changes, so callers never leak.
 *
 * Only safe for use in the top-level document — object URLs minted here do not
 * reliably resolve inside a srcdoc iframe (see useRunnerAssets for that path).
 */
export function useAssetObjectUrl(assetId: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let created: string | undefined;
    setUrl(undefined);
    if (!assetId) return;
    getAssetBlob(assetId).then((blob) => {
      if (cancelled || !blob) return;
      created = URL.createObjectURL(blob);
      setUrl(created);
    });
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [assetId]);

  return url;
}
```

- [ ] **Step 4: Run — see it pass**

Run: `npx vitest run tests/ui/hooks/useAssetObjectUrl.test.tsx`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAssetObjectUrl.ts tests/ui/hooks/useAssetObjectUrl.test.tsx
git commit -m "feat: add useAssetObjectUrl hook"
```

---

## Task 11: Wire `ImagePreview` and `AudioPreview` to `useAssetObjectUrl`

**Files:**
- Modify: `src/components/AssetPreview/ImagePreview.tsx`
- Modify: `src/components/AssetPreview/AudioPreview.tsx`
- Test: `tests/ui/components/AssetPreview/ImagePreview.test.tsx` (update), `AudioPreview.test.tsx` (update or create)

- [ ] **Step 1: Update `ImagePreview.test.tsx`**

```ts
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import ImagePreview from '../../../../src/components/AssetPreview/ImagePreview';
import { IAsset } from '../../../../src/features/assets/assetsSlice';
import { putAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

const asset: IAsset = { id: 'a1', name: 'logo.png', projectId: 'p1', folderId: null, fullName: 'logo.png' };

beforeEach(async () => {
  await _clearAllAssetBlobsForTests();
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock/logo');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  await putAssetBlob('a1', new Blob(['x'], { type: 'image/png' }));
});
afterEach(() => vi.restoreAllMocks());

describe('ImagePreview', () => {
  test('renders image with a blob URL from the asset blob store', async () => {
    render(<ImagePreview asset={asset} />);
    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'logo.png' })).toHaveAttribute('src', 'blob:mock/logo'),
    );
  });

  test('shows an error message when the image fails to load', async () => {
    render(<ImagePreview asset={asset} />);
    await waitFor(() => screen.getByRole('img', { name: 'logo.png' }));
    fireEvent.error(screen.getByRole('img', { name: 'logo.png' }));
    expect(screen.getByText(/unable to display image/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — see it fail**

Run: `npx vitest run tests/ui/components/AssetPreview/ImagePreview.test.tsx`
Expected: FAIL — `src` is `''`.

- [ ] **Step 3: Implement `ImagePreview.tsx`**

```tsx
import React, { useState } from 'react';
import { IAsset } from '../../features/assets/assetsSlice';
import { useAssetObjectUrl } from '../../hooks/useAssetObjectUrl';

type Props = { asset: IAsset };

const ImagePreview: React.FC<Props> = ({ asset }) => {
  const [error, setError] = useState(false);
  const url = useAssetObjectUrl(asset.id);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {error ? (
        <p role="alert" className="text-ds-text-muted text-sm">Unable to display image.</p>
      ) : url ? (
        <img
          src={url}
          alt={asset.name}
          onError={() => setError(true)}
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <p className="text-ds-text-dim text-sm">Loading…</p>
      )}
    </div>
  );
};

export default ImagePreview;
```

- [ ] **Step 4: Implement `AudioPreview.tsx`**

```tsx
import React from 'react';
import { IAsset } from '../../features/assets/assetsSlice';
import { useAssetObjectUrl } from '../../hooks/useAssetObjectUrl';

type Props = { asset: IAsset };

const AudioPreview: React.FC<Props> = ({ asset }) => {
  const url = useAssetObjectUrl(asset.id);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-4">
      <p className="text-ds-text-muted text-sm font-mono">{asset.name}</p>
      {url ? (
        <audio controls src={url} className="w-full max-w-sm" />
      ) : (
        <p className="text-ds-text-dim text-sm">Loading…</p>
      )}
    </div>
  );
};

export default AudioPreview;
```

- [ ] **Step 5: Update/create `AudioPreview.test.tsx`** analogously to `ImagePreview.test.tsx` (assert `<audio>` gets `src="blob:mock/..."`).

- [ ] **Step 6: Run — see it pass**

Run: `npx vitest run tests/ui/components/AssetPreview`
Expected: PASS.

- [ ] **Step 7: Full suite + build**

Run: `npx vitest run` then `npx vite build`
Expected: green.

- [ ] **Step 8: Commit**

```bash
git add src/components/AssetPreview tests/ui/components/AssetPreview
git commit -m "feat: image/audio previews resolve content from the blob store"
```

---

## Task 12: Wire `TileMapEditor` reads and saves through the blob store

**Files:**
- Modify: `src/components/TileMapEditor/index.tsx`
- Modify: `src/components/TileMapEditor/useTilesetSlices.ts` (only if needed for object-URL cleanup)
- Test: `tests/ui/components/TileMapEditor/TileMapEditor.blob.test.tsx` (new or fold into existing)

- [ ] **Step 1: Write the failing test**

Create `tests/ui/components/TileMapEditor/TileMapEditor.blob.test.tsx`:
```ts
// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach } from 'vitest';
import assetsReducer, { addAsset } from '../../../../src/features/assets/assetsSlice';
import TileMapEditor from '../../../../src/components/TileMapEditor';
import { putAssetBlob, getAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

const stmDoc = { tileWidth: 16, tileHeight: 16, tileImage: '', layers: { background: [[0, 0], [0, 0]] } };

const makeStore = () => configureStore({ reducer: { assets: assetsReducer } });

beforeEach(async () => { await _clearAllAssetBlobsForTests(); });

describe('TileMapEditor blob storage', () => {
  test('loads the .stm doc from the blob store and saves edits back to it', async () => {
    const store = makeStore();
    await putAssetBlob('stm1', new Blob([JSON.stringify(stmDoc)], { type: 'application/json' }));
    store.dispatch(addAsset({ id: 'stm1', name: 'level.stm', projectId: 'p1', folderId: null, fullName: 'level.stm' }));
    const asset = store.getState().assets.byId.stm1;

    render(<Provider store={store}><TileMapEditor asset={asset} /></Provider>);

    // Wait for the editor to finish loading the doc (Save button present, grid rendered)
    const saveBtn = await screen.findByRole('button', { name: /^save$/i });
    // Make an edit that dirties the doc — click the first paintable cell, then Save.
    // (Use whatever interaction the existing TileMapEditor tests use to dirty state.)
    // ... perform a paint interaction ...
    await userEvent.click(saveBtn);

    await waitFor(async () => {
      const blob = await getAssetBlob('stm1');
      expect(blob).toBeDefined();
      const saved = JSON.parse(await blob!.text());
      expect(saved.tileWidth).toBe(16);
    });
  });
});
```
> If dirtying the doc through the UI is fiddly, assert instead that on mount the editor renders the doc's grid (2x2) that could only have come from the blob store — i.e. prove the read path — and cover the save path with a smaller unit test around `encodeStmContent` + a direct `putAssetBlob`.

- [ ] **Step 2: Run — see it fail**

Run: `npx vitest run tests/ui/components/TileMapEditor/TileMapEditor.blob.test.tsx`
Expected: FAIL — editor mounts from `decodeStmContent('')` (empty doc).

- [ ] **Step 3: Implement the read path in `TileMapEditor/index.tsx`**

```ts
import { useAssetText } from '../../hooks/useAssetText';
import { useAssetObjectUrl } from '../../hooks/useAssetObjectUrl';
import { putAssetBlob } from '../../lib/storage/assetBlobStore';
```
Replace the `draftDoc` init + `[asset.id]` effect:
```ts
const { text: stmText, loading: stmLoading } = useAssetText(asset.id);
const [draftDoc, setDraftDoc] = useState<StmDoc>(() => decodeStmContent(''));
// ... other useState calls unchanged ...

useEffect(() => {
  if (stmLoading) return;
  setDraftDoc(decodeStmContent(stmText ? `data:application/json;base64,${btoa(unescape(encodeURIComponent(stmText)))}` : ''));
  setActiveIndex(0);
  setIsDirty(false);
  setHiddenLayerKeys(new Set());
}, [asset.id, stmLoading, stmText]); // eslint-disable-line react-hooks/exhaustive-deps
```
> `decodeStmContent` expects a data URL (it does `content.indexOf(',')` + `atob`). Rather than round-tripping through base64, add a sibling helper `decodeStmText(text: string): StmDoc` next to `decodeStmContent` that skips the data-URL unwrap:
```ts
export function decodeStmText(raw: string): StmDoc {
  let parsed: { tileWidth?: number; tileHeight?: number; tileImage?: string; layers?: Record<string, StmLayerValue> };
  try { parsed = JSON.parse(raw || '{}'); } catch { parsed = {}; }
  const layerEntries = Object.entries(parsed.layers ?? {});
  return {
    tileWidth: parsed.tileWidth ?? 16,
    tileHeight: parsed.tileHeight ?? 16,
    tileImage: parsed.tileImage ?? '',
    layers: layerEntries.map(([name, value]): EditorLayer => {
      if (Array.isArray(value)) return { key: crypto.randomUUID(), name, kind: 'tile', data: value };
      if (value.type === 'collision') return { key: crypto.randomUUID(), name, kind: 'collision', data: value.data };
      return { key: crypto.randomUUID(), name, kind: 'marker', markers: value.markers };
    }),
  };
}
```
Refactor `decodeStmContent` to `decodeStmText(comma === -1 ? '{}' : decodeURIComponent(escape(atob(content.slice(comma + 1)))))` so the two share logic. Then the effect is just `setDraftDoc(decodeStmText(stmText ?? ''))`.

- [ ] **Step 4: Implement the tileset-image read path**

```ts
const tilesetAsset = useSelector((state: RootState) =>
  Object.values(state.assets.byId).find(
    (a) => a.projectId === asset.projectId && a.name === draftDoc.tileImage,
  ),
);
const tilesetUrl = useAssetObjectUrl(tilesetAsset?.id);
const { slices } = useTilesetSlices(tilesetUrl, draftDoc.tileWidth, draftDoc.tileHeight);
```
`useTilesetSlices` sets `img.src = imageContent` — an object URL works identically to a data URL there. No change to `useTilesetSlices.ts`.

- [ ] **Step 5: Implement the save path**

```ts
const handleSave = async () => {
  await putAssetBlob(asset.id, new Blob([exportStmDoc(draftDoc)], { type: 'application/json' }));
  setIsDirty(false);
};
```
`exportStmDoc(doc)` already returns the JSON string. `encodeStmContent` is now unused in this file — remove it if nothing else imports it (grep first: `grep -rn "encodeStmContent" src tests`).

- [ ] **Step 6: Show a loading state while `stmLoading`**

Near the top of the returned JSX, if `stmLoading` return a simple `<div className="p-4 text-ds-text-dim text-sm">Loading tilemap…</div>`.

- [ ] **Step 7: Run affected + full suite**

Run: `npx vitest run tests/ui/components/TileMapEditor` then `npx vitest run`
Expected: green (update any existing TileMapEditor tests that fed `asset.content` — seed the blob store instead).

- [ ] **Step 8: Build**

Run: `npx vite build`
Expected: success.

- [ ] **Step 9: Commit**

```bash
git add src/components/TileMapEditor tests/ui/components/TileMapEditor
git commit -m "feat: tilemap editor reads/writes .stm and tileset via the blob store"
```

---

## Task 13: `importProject` async + all callers

**Files:**
- Modify: `src/features/projects/importProject.ts`
- Modify: `src/pages/DemosPage.tsx`
- Modify: `src/components/Projects/index.tsx`
- Test: `tests/ui/features/projects/importProject.test.ts` (update)

- [ ] **Step 1: Update `importProject.test.ts`**

Add at top:
```ts
import { getAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

beforeEach(async () => { await _clearAllAssetBlobsForTests(); });
```
Make every `store.dispatch(importProject(sampleJson))` an `await store.dispatch(importProject(sampleJson))` and the tests `async`. Re-add the content test as a blob check:
```ts
test('asset bytes are written to the blob store, not the slice', async () => {
  await store.dispatch(importProject(sampleJson));
  const asset = Object.values(store.getState().assets.byId)[0];
  expect('content' in asset).toBe(false);
  const blob = await getAssetBlob(asset.id);
  expect(blob).toBeDefined();
  expect(await blob!.text()).toBe('hi'); // sampleJson a1 content must be "data:...;base64,aGk="
});
```
Change `sampleJson.assets[0].content` to `'data:image/png;base64,aGk='` (base64 "hi").

- [ ] **Step 2: Run — see it fail**

Run: `npx vitest run tests/ui/features/projects/importProject.test.ts`
Expected: FAIL — no blob written; `importProject` returns a string, not a Promise.

- [ ] **Step 3: Implement `importProject` async**

```ts
import { putAssetBlob } from '../../lib/storage/assetBlobStore';
import { dataUrlToBlob } from '../../lib/storage/dataUrl';
```
```ts
export const importProject =
  (json: ProjectExportJson, options?: { tags?: string[] }) =>
  async (dispatch: AppDispatch): Promise<string> => {
    const newProjectId = uuidv4();
    // ... folderIdMap, fileIdMap, assetIdMap, addProject, folders, files — UNCHANGED ...

    // Write every asset's bytes to the blob store first, then dispatch metadata.
    await Promise.all(
      json.assets.map((a) =>
        a.content ? putAssetBlob(assetIdMap[a.id], dataUrlToBlob(a.content)) : Promise.resolve(),
      ),
    );

    const dispatchedAssetIds = new Set<string>();
    Object.values(json.assetOrder).forEach((orderedIds) => {
      orderedIds.forEach((oldId) => {
        const asset = json.assets.find((a) => a.id === oldId);
        if (!asset) return;
        dispatch(addAsset({
          id: assetIdMap[oldId],
          name: asset.name,
          projectId: newProjectId,
          folderId: asset.folderId ? (folderIdMap[asset.folderId] ?? null) : null,
          fullName: asset.fullName,
        }));
        dispatchedAssetIds.add(oldId);
      });
    });
    json.assets.forEach((asset) => {
      if (dispatchedAssetIds.has(asset.id)) return;
      dispatch(addAsset({
        id: assetIdMap[asset.id],
        name: asset.name,
        projectId: newProjectId,
        folderId: asset.folderId ? (folderIdMap[asset.folderId] ?? null) : null,
        fullName: asset.fullName,
      }));
    });

    return newProjectId;
  };
```

- [ ] **Step 4: Update `DemosPage.tsx`**

```ts
const handleTryDemo = async () => {
  const newId = await dispatch(importProject(demo.json, { tags: demo.tags }));
  setJustAdded(newId);
};
```
(Task 18 changes `demo.json` -> `await loadDemoJson(demo.slug)`.)

- [ ] **Step 5: Update `Projects/index.tsx`**

Line ~421 (`handleImportFileSelected`): make the handler `async` and `await dispatch(importProject(json))`.
Line ~431 (`handleImportOverwrite`): make it `async`, `await dispatch(importProject(importPendingJson))`. If it deletes an existing project first (`deleteProjectWithMainFile`), keep that ordering; add `await` only on the import.

- [ ] **Step 6: Run — see it pass**

Run: `npx vitest run tests/ui/features/projects/importProject.test.ts`
Expected: PASS.

- [ ] **Step 7: Full suite + build**

Run: `npx vitest run` then `npx vite build`
Expected: green.

- [ ] **Step 8: Commit**

```bash
git add src/features/projects/importProject.ts src/pages/DemosPage.tsx src/components/Projects/index.tsx tests/ui/features/projects/importProject.test.ts
git commit -m "feat: importProject writes asset bytes to the blob store (async)"
```

---

## Task 14: Blob cleanup on asset + project delete

**Files:**
- Modify: `src/features/projects/deleteProjectAndFiles.ts`
- Modify: `src/components/TreePanel/AssetTree/index.tsx` (`onRemove`)
- Test: `tests/ui/features/projects/deleteProjectAndFiles.test.ts` (update or new), `tests/ui/components/TreePanel/AssetTree.remove.test.tsx` (new)

- [ ] **Step 1: Write the failing test for project delete**

Create/extend `tests/ui/features/projects/deleteProjectAndFiles.test.ts`:
```ts
// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer, { addProject } from '../../../../src/features/projects/projectsSlice';
import filesReducer from '../../../../src/features/files/filesSlice';
import assetsReducer, { addAsset } from '../../../../src/features/assets/assetsSlice';
import foldersReducer from '../../../../src/features/folders/foldersSlice';
import uiReducer from '../../../../src/features/ui/uiSlice';
import { deleteProjectWithMainFile } from '../../../../src/features/projects/deleteProjectAndFiles';
import { putAssetBlob, getAssetBlob, _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

const makeStore = () => configureStore({
  reducer: { projects: projectsReducer, files: filesReducer, assets: assetsReducer, folders: foldersReducer, ui: uiReducer },
});

beforeEach(async () => { await _clearAllAssetBlobsForTests(); });

describe('deleteProjectWithMainFile', () => {
  test('deletes the blob store entries for the project\'s assets', async () => {
    const store = makeStore();
    store.dispatch(addProject({ id: 'p1', name: 'Doomed', packageIds: [] }));
    store.dispatch(addAsset({ id: 'a1', name: 'x.png', projectId: 'p1', folderId: null, fullName: 'x.png' }));
    await putAssetBlob('a1', new Blob(['x']));

    await store.dispatch(deleteProjectWithMainFile('p1'));

    expect(await getAssetBlob('a1')).toBeUndefined();
    expect(store.getState().assets.byId.a1).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run — see it fail**

Run: `npx vitest run tests/ui/features/projects/deleteProjectAndFiles.test.ts`
Expected: FAIL — blob still present; thunk is sync.

- [ ] **Step 3: Implement in `deleteProjectAndFiles.ts`**

```ts
import { deleteAssetBlobs } from '../../lib/storage/assetBlobStore';
```
```ts
export const deleteProjectWithMainFile =
  (projectId: string) => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();

    const files = Object.values(state.files.byId).filter((f) => (f as IFile).projectId === projectId);
    files.forEach((file) => dispatch(removeFile((file as IFile).id)));

    const assets = Object.values(state.assets.byId).filter((a) => (a as IAsset).projectId === projectId);
    const assetIds = assets.map((a) => (a as IAsset).id);
    await deleteAssetBlobs(assetIds);
    assetIds.forEach((id) => dispatch(removeAsset(id)));

    const folders = state.folders.items.filter((folder) => folder.projectId === projectId);
    folders.forEach((folder) => dispatch(removeFolder(folder.id)));

    dispatch(clearProjectSelection(projectId));
    dispatch(removeProject(projectId));
  };
```
Check callers of `deleteProjectWithMainFile` (grep) — `src/components/Projects/index.tsx`. It is called in a click handler; `await` it or fire-and-forget (fine — UI state updates via Redux). Add `await` where the handler is already async; otherwise leave unawaited (the dispatches still run synchronously; only the blob delete is deferred).

- [ ] **Step 4: Write the failing test for single-asset remove**

Create `tests/ui/components/TreePanel/AssetTree.remove.test.tsx` — render `AssetTree` with one asset (metadata dispatched + blob seeded), click its "Remove" button (`aria-label={`Remove ${name}`}`), assert `getAssetBlob(id)` becomes `undefined`.

- [ ] **Step 5: Run — see it fail**

Run: `npx vitest run tests/ui/components/TreePanel/AssetTree.remove.test.tsx`
Expected: FAIL.

- [ ] **Step 6: Implement in `AssetTree/index.tsx`**

```ts
import { putAssetBlob, deleteAssetBlob } from '../../../lib/storage/assetBlobStore';
```
The `SortableAssetItem` `onRemove` prop is `(id) => dispatch(removeAsset(id))`. Change to:
```tsx
onRemove={(id) => { void deleteAssetBlob(id); dispatch(removeAsset(id)); }}
```

- [ ] **Step 7: Run — see it pass; full suite + build**

Run: `npx vitest run` then `npx vite build`
Expected: green.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: delete asset blobs when assets or projects are removed"
```

---

## Task 15: Import/export round-trip test (integration)

**Files:**
- Test: `tests/ui/features/projects/roundtrip.test.ts` (new)

- [ ] **Step 1: Write the test**

Create `tests/ui/features/projects/roundtrip.test.ts`:
```ts
// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from '../../../../src/features/projects/projectsSlice';
import foldersReducer from '../../../../src/features/folders/foldersSlice';
import filesReducer from '../../../../src/features/files/filesSlice';
import assetsReducer from '../../../../src/features/assets/assetsSlice';
import { importProject } from '../../../../src/features/projects/importProject';
import { buildExportJson, ProjectExportJson } from '../../../../src/features/projects/exportProject';
import { _clearAllAssetBlobsForTests } from '../../../../src/lib/storage/assetBlobStore';

const makeStore = () => configureStore({
  reducer: { projects: projectsReducer, folders: foldersReducer, files: filesReducer, assets: assetsReducer },
});

const fixture: ProjectExportJson = {
  version: 1,
  project: { name: 'Round Trip' },
  folders: [],
  files: [{ id: 'file1', name: 'Main', source: 'print 1', folderId: null, fullName: 'Main.bas' }],
  assets: [
    { id: 'a1', name: 'hero.png', content: 'data:image/png;base64,aGVsbG8=', folderId: null, fullName: 'hero.png' },
    { id: 'a2', name: 'level.json', content: 'data:application/json;base64,eyJ4IjoxfQ==', folderId: null, fullName: 'level.json' },
  ],
  fileOrder: { ':root': ['file1'] },
  assetOrder: { ':root': ['a1', 'a2'] },
};

beforeEach(async () => { await _clearAllAssetBlobsForTests(); });

describe('import -> export round trip', () => {
  test('exported JSON matches the fixture modulo id remapping', async () => {
    const store = makeStore();
    const newId = await store.dispatch(importProject(fixture));

    // metadata in the slice, no content
    const assets = Object.values(store.getState().assets.byId);
    expect(assets).toHaveLength(2);
    expect(assets.every((a) => !('content' in a))).toBe(true);

    const exported = await buildExportJson(newId, {
      projects: store.getState().projects,
      folders: store.getState().folders,
      files: store.getState().files,
      assets: store.getState().assets,
    } as never);

    const strip = (j: ProjectExportJson) =>
      j.assets.map((a) => ({ name: a.name, content: a.content, fullName: a.fullName })).sort((x, y) => x.name.localeCompare(y.name));
    expect(strip(exported)).toEqual(strip(fixture));
    expect(exported.files[0].source).toBe('print 1');
  });
});
```

- [ ] **Step 2: Run**

Run: `npx vitest run tests/ui/features/projects/roundtrip.test.ts`
Expected: PASS. If the base64 in `content` comes back re-padded differently, normalize both sides by decoding to bytes and comparing, or assert `dataUrlToBlob(exported).text()` equals `dataUrlToBlob(fixture).text()`.

- [ ] **Step 3: Commit**

```bash
git add tests/ui/features/projects/roundtrip.test.ts
git commit -m "test: import/export round-trip through the blob store"
```

---

## Task 16: Runner asset resolution — `useRunnerAssets` + engine audio manifest + bootstrapper

**Files:**
- Create: `src/hooks/useRunnerAssets.ts`
- Modify: `src/components/Preview/index.tsx`
- Modify: `src/pages/EditPage.tsx`
- Modify: `src/components/Runner/index.tsx`
- Modify: `src/components/Runner/bootstrapper.html`
- Modify: `src/components/Runner/engine/audio.js`
- Modify: `src/components/Runner/engine/assets.js`
- Modify: `src/components/Landing/LandingHero.tsx`
- Test: `tests/ui/hooks/useRunnerAssets.test.tsx` (new), `tests/components/Runner/bootstrapper.test.ts` (update), `tests/components/Runner/audio.test.ts` (new/update)

- [ ] **Step 1: Write the failing test for `useRunnerAssets`**

Create `tests/ui/hooks/useRunnerAssets.test.tsx`:
```ts
// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { describe, test, expect, beforeEach } from 'vitest';
import assetsReducer, { addAsset } from '../../../src/features/assets/assetsSlice';
import { useRunnerAssets } from '../../../src/hooks/useRunnerAssets';
import { putAssetBlob, _clearAllAssetBlobsForTests } from '../../../src/lib/storage/assetBlobStore';

const makeStore = () => configureStore({ reducer: { assets: assetsReducer } });

beforeEach(async () => { await _clearAllAssetBlobsForTests(); });

describe('useRunnerAssets', () => {
  test('resolves every project asset to a { name, src } data URL', async () => {
    const store = makeStore();
    store.dispatch(addAsset({ id: 'a1', name: 'hero.png', projectId: 'p1', folderId: null, fullName: 'hero.png' }));
    await putAssetBlob('a1', new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }));

    const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useRunnerAssets('p1', true), { wrapper });

    expect(result.current.assets).toBeNull();
    await waitFor(() => expect(result.current.assets).not.toBeNull());
    expect(result.current.assets).toEqual([
      { name: 'hero.png', src: expect.stringMatching(/^data:image\/png;base64,/) },
    ]);
  });

  test('returns null assets when disabled', () => {
    const store = makeStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;
    const { result } = renderHook(() => useRunnerAssets('p1', false), { wrapper });
    expect(result.current.assets).toBeNull();
  });
});
```

- [ ] **Step 2: Run — see it fail**

Run: `npx vitest run tests/ui/hooks/useRunnerAssets.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/hooks/useRunnerAssets.ts`**

```ts
import { useEffect, useState } from 'react';
import { useAssetsForProject } from './useAssetsForProject';
import { getAssetBlob } from '../lib/storage/assetBlobStore';
import { blobToDataUrl } from '../lib/storage/dataUrl';

export type RunnerAsset = { name: string; src: string };

/**
 * Resolves every asset in a project to a { name, src } entry for the runner
 * iframe, where `src` is a base64 data URL. Data URLs (not blob: URLs) because
 * the runner is a srcdoc iframe and parent-minted object URLs do not reliably
 * resolve across that boundary. Re-encoding on each Run is a user-initiated
 * cost and acceptable.
 *
 * Returns { assets: null } while resolving or when `enabled` is false, so the
 * caller can withhold the iframe until the manifest is ready.
 */
export function useRunnerAssets(projectId: string, enabled: boolean): { assets: RunnerAsset[] | null } {
  const metaAll = useAssetsForProject(projectId);
  // Also include assets in sub-folders — useAssetsForProject only returns one folder level.
  const [assets, setAssets] = useState<RunnerAsset[] | null>(null);

  // Serialize the identity of the asset list so the effect re-runs on real change.
  const key = metaAll.map((a) => `${a.id}:${a.fullName ?? a.name}`).join('|');

  useEffect(() => {
    if (!enabled) { setAssets(null); return; }
    let cancelled = false;
    setAssets(null);
    (async () => {
      const resolved = await Promise.all(
        metaAll.map(async (a) => {
          const blob = await getAssetBlob(a.id);
          if (!blob) return null;
          return { name: a.fullName ?? a.name, src: await blobToDataUrl(blob) };
        }),
      );
      if (!cancelled) setAssets(resolved.filter((x): x is RunnerAsset => x !== null));
    })();
    return () => { cancelled = true; };
  }, [enabled, key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { assets };
}
```
> **`useAssetsForProject` only returns root-level assets.** Verify whether demos put assets in sub-folders. If they do, replace `metaAll` with a selector over `state.assets.byId` filtered by `projectId` (all folders) — add `selectAllAssetsForProject` to `src/selectors/assetSelectors.ts` (`makeSelectAssetsByProject` already does exactly this: filters `byId` by `projectId` with no folder constraint). Use `makeSelectAssetsByProject(projectId)` here instead of `useAssetsForProject`.

**Decision:** use `makeSelectAssetsByProject` — it returns every asset for the project regardless of folder, which is what the runner needs. Rewrite the hook to `const metaAll = useSelector(useMemo(() => makeSelectAssetsByProject(projectId), [projectId]))`.

- [ ] **Step 4: Run — see it pass**

Run: `npx vitest run tests/ui/hooks/useRunnerAssets.test.tsx`
Expected: PASS.

- [ ] **Step 5: Thread the prop through `Preview` and `EditPage`**

`src/components/Preview/index.tsx`:
```tsx
import React from 'react';
import Runner from '../Runner';

type PreviewProps = {
  transpiled: string;
  projectId: string;
  assets?: Array<{ name: string; src: string }>;
};

const Preview = React.forwardRef<HTMLIFrameElement, PreviewProps>(({ transpiled, projectId, assets }, ref) => (
  <Runner ref={ref} transpiled={transpiled} projectId={projectId} width="100%" height="100%" assets={assets} />
));

Preview.displayName = 'Preview';
export default Preview;
```

`src/pages/EditPage.tsx` — add near the other hooks:
```ts
import { useRunnerAssets } from '../hooks/useRunnerAssets';
// ...
const { assets: runnerAssets } = useRunnerAssets(id ?? '', isRunning);
```
Change the `preview` prop of `ProjectShell`:
```tsx
preview={
  isRunning ? (
    runnerAssets === null ? (
      <div className="p-4 text-ds-text-dim text-sm">Loading assets…</div>
    ) : (
      <ErrorBoundary key={project.id} fallback={<p className="p-4 text-ds-error text-sm">Preview failed to load.</p>}>
        <Preview ref={previewIframeRef} transpiled={transpiled} projectId={project.id} assets={runnerAssets} />
      </ErrorBoundary>
    )
  ) : undefined
}
```
> Behavior note: a project with no assets resolves to `[]` (not `null`) quickly, so the "Loading assets…" flash is only for asset-heavy projects and only once per Run. Acceptable.

- [ ] **Step 6: Split the manifest by type in `Runner/index.tsx`**

The engine needs images through `_sb.preload` and audio through a new `_sb.preloadAudioManifest`. In `src/components/Runner/index.tsx`:
```tsx
const AUDIO_EXTS = ['.mp3', '.wav', '.ogg'];
const isAudio = (name: string) => AUDIO_EXTS.some((e) => name.toLowerCase().endsWith(e));
// ...
.replace('//${inlineAssets}', assets?.length
  ? [
      `await _sb.preload(${JSON.stringify(assets.filter((a) => !isAudio(a.name)))});`,
      `await _sb.preloadAudioManifest(${JSON.stringify(assets.filter((a) => isAudio(a.name)))});`,
    ].join('\n')
  : '')
```

- [ ] **Step 7: Update `bootstrapper.html`**

Remove these two lines:
```
          await _sb.preloadFromLocalStorage(_sbProjectId);
          await _sb.preloadAudioFromLocalStorage(_sbProjectId);
```
Leave the `//${inlineAssets}` marker (now the only asset-loading step). The surrounding sequence (fireInit -> inlineAssets -> runModuleBodies) is unchanged.

- [ ] **Step 8: Add `preloadAudioManifest` to `engine/audio.js`**

```js
async preloadAudioManifest(manifest) {
  await Promise.all((manifest || []).map((a) => new Promise((resolve) => {
    const sound = PIXI.sound.Sound.from({
      url: a.src,
      preload: true,
      loaded: () => resolve(),
      error: () => resolve(),
    });
    _cache.set(a.name, sound);
  })));
},
```
Delete `preloadAudioFromLocalStorage` (nothing calls it now — grep `preloadAudioFromLocalStorage` to confirm) and its `_isAudio` helper if unused elsewhere in the file.

- [ ] **Step 9: Clean up `engine/assets.js`**

Delete `preloadFromLocalStorage` (grep to confirm no callers remain). Keep `preload(manifest)` unchanged.

- [ ] **Step 10: Update `LandingHero.tsx` `handleLaunch`**

```ts
import { putAssetBlob } from '../../lib/storage/assetBlobStore';
// ...
const handleLaunch = async () => {
  setLaunching(true);
  const projectId = uuidv4();
  const fileId = uuidv4();
  dispatch(addProject({ id: projectId, name: 'Space Shooter Demo', packageIds: ['softcore', 'softgfx'] }));
  dispatch(addFile({ id: fileId, name: 'Main.bas', source: DEMO_SOURCE, projectId, folderId: null, fullName: 'Main.bas' }));

  const assetDefs = [
    { name: 'ship.png', src: '/ship.png' },
    { name: 'bullet.png', src: '/bullet.png' },
  ];
  for (const { name, src } of assetDefs) {
    const id = uuidv4();
    const blob = await (await fetch(src)).blob();
    await putAssetBlob(id, blob);
    dispatch(addAsset({ id, name, projectId, folderId: null, fullName: name }));
  }
  navigate(`/projects/${projectId}/edit`);
};
```
Delete the now-unused `fetchAsDataUrl` helper. `DEMO_ASSETS` (the live-preview `<Runner assets>` prop) stays as-is — those are public paths, and `Runner`'s new split still routes `.png` through `_sb.preload`.

- [ ] **Step 11: Update `bootstrapper.test.ts`**

The boot-sequence tests reference `_sb.preloadFromLocalStorage` and `_sb.preloadAudioFromLocalStorage`. Replace those assertions:
```ts
test('declares transpiled code and fires oninit before any preloading', () => {
  expect(at('//${transpiled}')).toBeLessThan(at('_sb._fireInit()'));
  expect(at('_sb._fireInit()')).toBeLessThan(at('//${inlineAssets}'));
});

test('runs deferred module bodies after preloading and before the scene switch', () => {
  expect(at('//${inlineAssets}')).toBeLessThan(at('_sb._runModuleBodies()'));
  expect(at('_sb._runModuleBodies()')).toBeLessThan(at('_sb._applySwitch()'));
});
```

- [ ] **Step 12: Add an `engine/audio.js` manifest test**

Create `tests/components/Runner/audio.test.ts` (or extend an existing audio test) that stubs `PIXI.sound.Sound.from`, calls `_sbAudio.preloadAudioManifest([{ name: 'boom.mp3', src: 'data:audio/mpeg;base64,AAAA' }])`, and asserts `createSound('boom.mp3')` returns the cached stub. Follow the pattern in `tests/components/Runner/assets.test.ts` for how the engine module is loaded/evaluated.

- [ ] **Step 13: Run the full suite + build**

Run: `npx vitest run` then `npx vite build`
Expected: green. The build's >500 kB chunk warning may still mention the demo JSON until Task 18.

- [ ] **Step 14: Manual verification (dev server) — critical for this task**

`npm run dev`. Import the Raycaster demo (Demos page -> Try Demo). Open it, click Run. Confirm:
- The maze renders with wall textures (images load).
- Enemy groans / footsteps / gunshot play (audio loads).
- No `ERR` entries in the bottom console panel.
If images or audio fail to load from data URLs in the iframe, check the browser console inside the iframe. Data URLs are what the engine consumed before this change, so this should work; if PIXI v8 rejects very large data URLs, that is a genuinely new finding — record it and consider the blob-URL path as a follow-up (would require the iframe to open IndexedDB itself, or an alternative transfer).

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "feat: runner resolves project assets to data URLs; drop localStorage asset reads from the engine"
```

---

## Task 17: Demos — lazy dynamic import of `.b4wgl.json`

**Files:**
- Modify: `src/features/demos/demoRegistry.ts`
- Modify: `src/pages/DemosPage.tsx`
- Test: `tests/ui/features/demos/demoRegistry.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `tests/ui/features/demos/demoRegistry.test.ts`:
```ts
import { describe, test, expect } from 'vitest';
import { demoRegistry, loadDemoJson } from '../../../../src/features/demos/demoRegistry';

describe('demoRegistry', () => {
  test('entries carry metadata but not inline json', () => {
    expect(demoRegistry.length).toBeGreaterThan(0);
    for (const d of demoRegistry) {
      expect(d).toHaveProperty('slug');
      expect(d).toHaveProperty('name');
      expect(d).not.toHaveProperty('json');
    }
  });

  test('loadDemoJson dynamically loads a demo export by slug', async () => {
    const json = await loadDemoJson('raycaster');
    expect(json.version).toBe(1);
    expect(Array.isArray(json.assets)).toBe(true);
  });
});
```

- [ ] **Step 2: Run — see it fail**

Run: `npx vitest run tests/ui/features/demos/demoRegistry.test.ts`
Expected: FAIL — `loadDemoJson` not exported; entries still have `json`.

- [ ] **Step 3: Implement `demoRegistry.ts`**

Remove the four static JSON imports. Change `DemoEntry` to drop `json`. Map each entry's static `slug` to its file basename:
```ts
import { ProjectExportJson } from '../projects/exportProject';

export interface DemoEntry {
  slug: string;
  name: string;
  tags: string[];
  description: string;
  docsSlug: string;
  /** basename of the .b4wgl.json under src/docs/demos/ */
  file: string;
}

export const demoRegistry: DemoEntry[] = [
  { slug: 'raycaster', name: 'Wolfenstein-Style Raycaster', tags: [...], description: `...`, docsSlug: 'raycaster', file: 'Raycaster' },
  { slug: 'coins-platformer', /* ... */ file: 'CoinsPlatformer' },
  { slug: 'bullet-hell-shooter', /* ... */ file: 'BulletHellShooter' },
  { slug: 'dungeon-explorer', /* ... */ file: 'DungeonExplorer' },
];

export async function loadDemoJson(slug: string): Promise<ProjectExportJson> {
  const entry = demoRegistry.find((d) => d.slug === slug);
  if (!entry) throw new Error(`Unknown demo slug: ${slug}`);
  const mod = await import(`../../docs/demos/${entry.file}.b4wgl.json`);
  return (mod.default ?? mod) as ProjectExportJson;
}
```
(Keep the existing `description` template strings verbatim — do not rewrite them.)
> Vite requires dynamic-import specifiers to be statically analyzable enough to glob. `` `../../docs/demos/${entry.file}.b4wgl.json` `` works — Vite builds a glob for `../../docs/demos/*.b4wgl.json`. Confirm at build time that each demo JSON becomes its own chunk.

- [ ] **Step 4: Implement `DemosPage.tsx`**

```ts
import { demoRegistry, DemoEntry, loadDemoJson } from '../features/demos/demoRegistry';
// ...
const [busy, setBusy] = useState(false);
const handleTryDemo = async () => {
  setBusy(true);
  try {
    const json = await loadDemoJson(demo.slug);
    const newId = await dispatch(importProject(json, { tags: demo.tags }));
    setJustAdded(newId);
  } finally {
    setBusy(false);
  }
};
```
Disable the "Try Demo →" button while `busy` and show `busy ? 'Adding…' : 'Try Demo →'`.

- [ ] **Step 5: Run — see it pass**

Run: `npx vitest run tests/ui/features/demos/demoRegistry.test.ts`
Expected: PASS.

- [ ] **Step 6: Full suite + build; confirm bundle shrinks**

Run: `npx vitest run` then `npx vite build`
Expected: green. In the build output, `Raycaster.b4wgl.json` (and the other three) appear as separate chunks; the main bundle drops by ~3.5 MB and the >500 kB warning clears or shrinks. Record the before/after main-bundle size in the commit message.

- [ ] **Step 7: Commit**

```bash
git add src/features/demos/demoRegistry.ts src/pages/DemosPage.tsx tests/ui/features/demos/demoRegistry.test.ts
git commit -m "perf: lazy-load demo .b4wgl.json files out of the initial bundle"
```

---

## Task 18: Cypress seed rewrite (manual verification only)

**Files:**
- Modify: `cypress/e2e/demos.cy.ts`
- Modify: `cypress/e2e/tutorials.cy.ts`
- Modify: `src/pages/DemosPage.tsx` (add a dev/test-only seed hook)

> **This plan cannot run Cypress.** These changes are written to be run manually per `CLAUDE.md` (`npm run dev` on :5173, then `npm run cypress:run`). Mark the task complete only after that manual run passes.

**Chosen approach: test hook (`window.__seedDemo`).** The UI-flow approach (click "Try Demo", wait for editor) adds an async `importProject` + `putAssetBlob` + a route change per test and is brittle under Cypress's default timeouts for the 3.4 MB Raycaster. The hook runs the real code path (`loadDemoJson` -> async `importProject` -> `putAssetBlob`) without the UI race.

- [ ] **Step 1: Add the seed hook to `DemosPage.tsx`**

At module scope in `src/pages/DemosPage.tsx`:
```ts
import { store } from '../store';
import { loadDemoJson } from '../features/demos/demoRegistry';
import { importProject } from '../features/projects/importProject';

if (import.meta.env.DEV || (typeof window !== 'undefined' && (window as unknown as { Cypress?: unknown }).Cypress)) {
  (window as unknown as { __seedDemo?: (slug: string) => Promise<string> }).__seedDemo = (slug) =>
    loadDemoJson(slug).then((j) => store.dispatch(importProject(j)));
}
```
> `store` is already exported from `src/store.ts`. This is dev/Cypress-only and tree-shakes out of production because `import.meta.env.DEV` is statically `false` there (the `window.Cypress` check remains but is harmless).

- [ ] **Step 2: Rewrite `cypress/e2e/demos.cy.ts`**

```ts
/// <reference types="cypress" />

// Seeds each demo by invoking the app's real import path via a dev/Cypress-only
// window hook, then Runs it and asserts no ERR appears in the console panel.
// Assets now live in IndexedDB (not localStorage) — the hook exercises
// loadDemoJson -> async importProject -> putAssetBlob for real.

const DEMOS: Array<{ slug: string; title: string; waitMs: number }> = [
  { slug: 'raycaster', title: 'Wolfenstein-Style Raycaster', waitMs: 4000 },
  { slug: 'coins-platformer', title: 'Collect the Coins: A Platformer', waitMs: 4000 },
  { slug: 'bullet-hell-shooter', title: 'Bullet-Hell Shooter', waitMs: 4000 },
  { slug: 'dungeon-explorer', title: 'Dungeon Explorer', waitMs: 4000 },
];

DEMOS.forEach(({ slug, title, waitMs }) => {
  describe(`Demo: ${title}`, () => {
    it('runs without runtime errors', () => {
      cy.visit('/demos');
      cy.window().its('__seedDemo').should('be.a', 'function');
      cy.window().then((win) =>
        (win as unknown as { __seedDemo: (s: string) => Promise<string> }).__seedDemo(slug),
      ).then((projectId) => {
        cy.visit(`/projects/${projectId}/edit`);
        cy.get('[aria-label="Run project"]', { timeout: 15000 }).click();
        cy.wait(waitMs);
        cy.get('span').contains('ERR').should('not.exist');
      });
    });
  });
});
```
Delete `buildPersistedStateFromExport` and the old interfaces.

- [ ] **Step 3: Update `cypress/e2e/tutorials.cy.ts`**

The tutorial seed writes `localStorage['persist:softBASIC']` with `assets.byId[...].content = PIXEL_PNG`. Two changes:
1. `_persist` / non-asset state still seeds fine through localStorage? **No** — persist is on IndexedDB now, and `redux-persist` won't read that localStorage key (and `main.tsx` deletes it on boot). The tutorial seed must move to IndexedDB too.
2. Asset bytes must go to the asset blob store.

Rewrite `buildPersistedState` to seed via a `window` hook instead. Add to `src/pages/EditPage.tsx` (or a small always-available module imported by `App`) a dev/Cypress-only hook:
```ts
if (import.meta.env.DEV || (typeof window !== 'undefined' && (window as unknown as { Cypress?: unknown }).Cypress)) {
  (window as unknown as { __seedProject?: (spec: unknown) => Promise<string> }).__seedProject = async (spec: {
    name: string;
    files: Array<{ name: string; source: string }>;
    assets?: Array<{ name: string; dataUrl: string }>;
  }) => {
    const { v4: uuidv4 } = await import('uuid');
    const { addProject } = await import('../features/projects/projectsSlice');
    const { addFile } = await import('../features/files/filesSlice');
    const { addAsset } = await import('../features/assets/assetsSlice');
    const { putAssetBlob } = await import('../lib/storage/assetBlobStore');
    const { dataUrlToBlob } = await import('../lib/storage/dataUrl');
    const { store } = await import('../store');
    const projectId = uuidv4();
    store.dispatch(addProject({ id: projectId, name: spec.name, packageIds: ['softcore', 'softgfx'] }));
    spec.files.forEach((f) =>
      store.dispatch(addFile({ id: uuidv4(), name: f.name, source: f.source, projectId, folderId: null, fullName: f.name })),
    );
    for (const a of spec.assets ?? []) {
      const id = uuidv4();
      await putAssetBlob(id, dataUrlToBlob(a.dataUrl));
      store.dispatch(addAsset({ id, name: a.name, projectId, folderId: null, fullName: a.name }));
    }
    return projectId;
  };
}
```
Then `runTutorial` becomes:
```ts
function runTutorial(projectName: string, files: FileSpec[], assetNames: string[] = [], waitMs = 3000) {
  cy.visit('/projects'); // any route that mounts the app + the hook
  cy.window().its('__seedProject').should('be.a', 'function');
  cy.window()
    .then((win) => (win as never as { __seedProject: (s: unknown) => Promise<string> }).__seedProject({
      name: projectName,
      files,
      assets: assetNames.map((name) => ({ name, dataUrl: PIXEL_PNG })),
    }))
    .then((projectId) => {
      cy.visit(`/projects/${projectId}/edit`);
      cy.get('[aria-label="Run project"]', { timeout: 10000 }).click();
      cy.wait(waitMs);
      cy.get('span').contains('ERR').should('not.exist');
    });
}
```
Update each `describe` block's `runTutorial(...)` call to drop the now-removed `projectId` first arg. Keep `PIXEL_PNG`.

- [ ] **Step 4: Manual run**

```bash
npm run dev        # terminal 1
npm run cypress:run   # terminal 2
```
Expected: `tutorials.cy.ts` and `demos.cy.ts` all green. If the Raycaster spec times out, raise its `waitMs` and the `Run project` timeout; if the seed hook isn't present, confirm `import.meta.env.DEV` is true under `npm run dev`.

- [ ] **Step 5: Commit**

```bash
git add cypress/e2e/demos.cy.ts cypress/e2e/tutorials.cy.ts src/pages/DemosPage.tsx src/pages/EditPage.tsx
git commit -m "test: seed Cypress specs through real IndexedDB import path (manual-run)"
```

---

## Task 19: Docs + roadmap updates

**Files:**
- Modify: `docs/roadmap.md`
- Modify: `docs/demo-authoring-guide.md` (if it documents the Cypress seed format)
- Modify: `src/docs/` — any Language Guide / API page that describes asset storage limits or the 5 MB cap
- Create: `src/docs/release-notes.md` entry? **No** — only when pushing. Skip.

- [ ] **Step 1: Update `docs/roadmap.md`**

Milestone 3's resolved bullet (line ~124) about storage quota, and line ~165's "Asset storage quota per account" — add a note that asset binaries and persisted state moved to IndexedDB on 2026-08-30 (ref this plan + the design spec), that the `QuotaExceededError`-on-persist failure mode is gone, and that `file.js`'s `save`/`file` modules still write to `localStorage` and still surface `QuotaExceededError` as a visible runtime error (unchanged — that is the game-save path, not the editor-asset path). Note the two deferred follow-ups (see Task 20).

- [ ] **Step 2: Update `docs/demo-authoring-guide.md`**

If it documents the `cypress/e2e/demos.cy.ts` seeding format (the `buildPersistedStateFromExport` localStorage shape), replace that section with the new `window.__seedDemo` hook approach.

- [ ] **Step 3: Grep the in-app docs for stale storage claims**

Run: `grep -rn "localStorage\|5 ?MB\|5-10 ?MB\|QuotaExceeded" src/docs`
Update any page that tells users assets are capped at ~5 MB or stored in localStorage. The asset-upload guidance (if any) should now say IndexedDB with a much higher practical limit.

- [ ] **Step 4: Build (docs are bundled) + full suite**

Run: `npx vite build` then `npx vitest run`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add docs src/docs
git commit -m "docs: asset + persist storage moved to IndexedDB"
```

---

## Task 20: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full unit suite**

Run: `npx vitest run`
Expected: PASS. Count should be **≥ 1759 + new tests**, 1 skipped. Zero failures. Record the new total.

- [ ] **Step 2: Production build**

Run: `npx vite build`
Expected: success. Note the main-bundle size vs. the pre-change baseline (should be ~3.5 MB smaller). Confirm each `*.b4wgl.json` is a separate chunk.

- [ ] **Step 3: `grep` for leftovers**

Run:
```bash
grep -rn "asset.content\|a\.content\|\.content =" src --include='*.ts' --include='*.tsx' | grep -vi "textContent\|innerHTML\|response.content"
grep -rn "preloadFromLocalStorage\|preloadAudioFromLocalStorage" src
grep -rn "redux-persist/lib/storage" src
grep -rn "TODO(Task" src
```
Expected: no hits (all shims replaced, all engine localStorage reads gone).

- [ ] **Step 4: Manual end-to-end (dev server)**

`npm run dev`:
1. Import the Raycaster demo. Open it, Run. Walls textured, audio plays, no `ERR`.
2. Export the same project. Diff the downloaded `.b4wgl.json` against `src/docs/demos/Raycaster.b4wgl.json` — should match modulo `id` values (`jq -S 'del(.. | .id?)' a.json` vs `b.json`, or compare asset `content` byte lengths).
3. Upload a new PNG asset (>4 MB, <25 MB) — confirm it uploads (old 4 MB guard is raised).
4. Open a `.stm` tilemap asset, paint a tile, Save, refresh — the edit persists.
5. Create a new text asset, type, Save, refresh — content persists.
6. Delete the project — confirm (devtools -> IndexedDB -> `softBASIC` -> `assetBlobs`) its blob entries are gone.
7. Reload the app with a populated project — confirm rehydration works and `localStorage` has no `persist:softBASIC` key.

- [ ] **Step 5: Manual Cypress**

`npm run dev` + `npm run cypress:run` — `tutorials.cy.ts` and `demos.cy.ts` all green.

- [ ] **Step 6: Final commit (if any verification fixups were needed)**

```bash
git add -A
git commit -m "fix: address IndexedDB asset storage verification findings"
```

---

## Deferred follow-ups (explicitly out of scope, per the spec)

1. **Quota-exceeded / storage-denied UX** — a friendly toast when IndexedDB is full or blocked (private browsing, Safari eviction). Wrap `putAssetBlob` and the persist write path; surface an error. Not built here. Track as a roadmap item.
2. **Orphaned-blob GC sweep** — a defensive pass deleting `assetBlobs` entries with no matching metadata, guarding against writes interrupted between `putAssetBlob` and `dispatch(addAsset)`. The delete cascades (Task 14) cover the normal case. Not built here. Track as a roadmap item.
3. **Blob-URL runner path** — replace the per-Run data-URL re-encode in `useRunnerAssets` with `blob:` URLs (parent-minted, revoked on iframe unmount), *if* verification confirms they resolve across the `srcdoc` boundary in the target browsers. Data URLs are correct and safe today; this is a pure optimization.
4. **Trimming the Raycaster's oversized audio** (`yd_Searching.ogg` 2.1 MB, etc.) — independent content fix, unblocked by this change but not required by it.

---

## Self-review

### 1. Spec coverage

| Spec section | Task(s) | Notes |
|---|---|---|
| `persistStore.ts` localforage instance + redux-persist adapter | 4, 5 | |
| `assetBlobStore.ts` put/get/delete/deleteBatch | 3 | Internal repr is `{data:ArrayBuffer,type}` not raw Blob — documented deviation |
| `dataUrl.ts` helpers | 2 | FileReader-free impl — documented deviation |
| `IAsset` loses `content`; `addAsset`/`updateAsset`/`removeAsset` reducer changes | 6 | |
| Write path: file upload | 7 | `AssetTree.processFiles` (spec's `FileInput` is dead code — noted) |
| Write path: project import (async) | 13 | |
| Write path: tilemap editor save | 12 | |
| Write path: new tilemap dialog | 8 | |
| Write path: text asset edit | 9 | |
| `importProject` async ripple (DemosPage, Projects x2) | 13 | |
| Read path: `useAssetObjectUrl` + Image/Audio/LandingHero consumers | 10, 11, 16 | LandingHero's launch path uses `putAssetBlob`; its live-preview uses public paths (unchanged) |
| Read path: `useAssetText` + TextEditor/TileMapEditor consumers | 9, 12 | |
| Runner asset resolution + blob-URL vs data-URL fallback | 16 | **Chose data URLs** (spec's sanctioned fallback) — documented, with blob-URL as deferred #3. Also had to add `preloadAudioManifest` + remove engine localStorage reads (spec's runner model was incomplete) |
| Export byte-identical (`buildExportJson` async, `exportProject`, `useRunnerMessages`) | 8 | `ProjectExportJson` unchanged |
| Demos lazy dynamic import | 17 | `DemoEntry.json` -> `DemoEntry.file` + `loadDemoJson(slug)` |
| redux-persist wiring + dead-key cleanup | 5 | `localStorage.removeItem` in `main.tsx` |
| Cypress demos.cy.ts + tutorials.cy.ts rewrite | 18 | Test-hook approach chosen; manual-run only |
| Add `localforage` + `fake-indexeddb`; wire `fake-indexeddb/auto` | 1 | |
| Testing 1–5 (blob store, dataUrl, round-trip, hooks, persist/rehydrate) | 2,3,4,5,10,15 | |
| Testing 6 (manual) | 20 | |
| Out-of-scope follow-ups | Deferred section | All 4 recorded |

No gaps.

### 2. Placeholder scan

No "TBD" / "add error handling" / "similar to Task N" / bare "write tests" remain. Every code step shows complete code. The two places that say "follow the existing test pattern" (Task 12 Step 1 paint interaction, Task 16 Step 12 audio-engine load pattern) point at a named existing file to copy from and give the assertion explicitly — acceptable because the exact Testing-Library interaction for the tilemap canvas and the exact engine-eval harness are established local conventions the implementer must match rather than reinvent.

### 3. Type consistency

- `putAssetBlob(id: string, blob: Blob): Promise<void>` — used consistently in Tasks 3, 7, 8, 9, 12, 13, 16, 18.
- `getAssetBlob(id): Promise<Blob | undefined>` — consistent.
- `deleteAssetBlobs(ids: string[])` (plural, batch) vs `deleteAssetBlob(id)` (singular) — Task 3 defines both; Task 14 uses `deleteAssetBlobs` for project delete and `deleteAssetBlob` for single-asset remove. Consistent.
- `blobToDataUrl(blob): Promise<string>` / `dataUrlToBlob(url): Blob` — consistent across Tasks 2, 8, 13, 16, 18.
- `buildExportJson` returns `Promise<ProjectExportJson>` after Task 8 — every caller (`exportProject`, `useRunnerMessages`, round-trip test) awaits it.
- `importProject(...)` returns `(dispatch) => Promise<string>` after Task 13 — `DemosPage`, `Projects` (x2), and tests all `await`.
- `useAssetText(id?) => { text: string | undefined; loading: boolean }` — Task 9 defines, Task 12 consumes with the same shape.
- `useAssetObjectUrl(id?) => string | undefined` — Task 10 defines, Tasks 11 & 12 consume.
- `useRunnerAssets(projectId, enabled) => { assets: RunnerAsset[] | null }` where `RunnerAsset = { name: string; src: string }` — matches `Runner`'s existing `assets?: Array<{ name: string; src: string }>` prop.
- `DemoEntry` loses `json`, gains `file: string`; `loadDemoJson(slug: string): Promise<ProjectExportJson>` — Task 17 defines, `DemosPage` + test consume.
- `decodeStmText(raw: string): StmDoc` — new in Task 12, used only there; `decodeStmContent` refactored to delegate to it.

Consistent.
