# IndexedDB Asset Storage — Design

**Date:** 2026-08-30
**Status:** Approved. Plan: `docs/superpowers/plans/2026-08-30-indexeddb-asset-storage.md` (20 tasks). The plan corrects several details this spec got wrong about the current runner asset path and the sync→async ripple — where they differ, the plan is authoritative.

## Problem

The whole persisted Redux state — `projects`, `files`, **`assets`**, `folders`, `ui` — is serialized to a single `localStorage` key (`persist:softBASIC`) by `redux-persist`, using `redux-persist/lib/storage` (a thin localStorage wrapper). Each `IAsset.content` is a **base64 data URL** (from `FileReader.readAsDataURL`), which is ~33% larger than the raw bytes.

`localStorage` is capped at roughly 5 MB per origin. The shipped Raycaster demo carries ~2.5 MB of audio; base64-encoded and embedded in the one JSON string it already exceeds the cap. The result: `QuotaExceededError` on persist, the project fails to save, and on reload the rehydrated state is missing or truncated — the demo appears broken. This happens at a project size that is not large.

We are effectively the only users, and export/re-import (`.b4wgl.json`) is an available manual fallback, so **no data migration is required** — a clean break is acceptable.

## Solution overview

Move persistence off `localStorage` and onto IndexedDB via `localforage`, and split asset **binaries** out of the Redux store into their own IndexedDB object store as native `Blob`s (no base64). The Redux `assets` slice keeps only metadata. The `.b4wgl.json` export/import format is unchanged (base64 assets inline) — conversion happens at that boundary. Demo `.b4wgl.json` files become lazy dynamic imports so they leave the initial JS bundle.

## Storage architecture

New directory `src/lib/storage/`:

### `persistStore.ts`

A `localforage` instance:

```ts
import localforage from 'localforage';

const persistStore = localforage.createInstance({
  name: 'softBASIC',
  storeName: 'persist',
  description: 'redux-persist state',
});

// redux-persist storage interface
export default {
  getItem: (key: string) => persistStore.getItem<string>(key),
  setItem: (key: string, value: string) => persistStore.setItem(key, value),
  removeItem: (key: string) => persistStore.removeItem(key),
};
```

`redux-persist` calls `getItem`/`setItem`/`removeItem` and expects a Promise — `localforage` satisfies this directly. It stores one string value (the serialized non-asset state), now tiny.

### `assetBlobStore.ts`

A second `localforage` instance in the same database, plus a typed API:

```ts
const blobStore = localforage.createInstance({
  name: 'softBASIC',
  storeName: 'assetBlobs',
  description: 'asset binary content, keyed by asset id',
});

export async function putAssetBlob(id: string, blob: Blob): Promise<void>;
export async function getAssetBlob(id: string): Promise<Blob | undefined>;   // undefined if absent
export async function deleteAssetBlob(id: string): Promise<void>;
export async function deleteAssetBlobs(ids: string[]): Promise<void>;        // bulk, Promise.all
```

`localforage` stores `Blob`s natively on IndexedDB (its default driver). No base64 anywhere in the internal representation.

### Helpers (`src/lib/storage/dataUrl.ts`)

```ts
export function dataUrlToBlob(dataUrl: string): Blob;   // decode base64 → Blob, preserve MIME
export function blobToDataUrl(blob: Blob): Promise<string>;  // FileReader.readAsDataURL
```

Used only at the export/import boundary and any legacy-string path.

## Data model change

`src/features/assets/assetsSlice.ts`:

```ts
export interface IAsset {
  id: string;
  name: string;
  projectId: string;
  folderId: string | null;
  fullName: string;
  // `content` removed
}
```

- `addAsset` reducer: drops `content` from its payload type and body. **Callers must `await putAssetBlob(id, blob)` before dispatching `addAsset`.**
- `updateAsset` reducer: unchanged for metadata; it no longer carries `content`. Content updates go through `putAssetBlob` directly (see write paths).
- `removeAsset` reducer: unchanged (metadata only). The **caller** is responsible for `deleteAssetBlob(id)` — see write paths. (A slice reducer can't do async I/O.)
- Selectors (`assetSelectors.ts`, `useAssetsForProject.ts`): unchanged — they already return metadata only.

The slice stays in the persisted Redux state (now small).

## Write paths

| Path | File | Change |
|---|---|---|
| **File upload** | `src/components/TreePanel/FileInput/index.tsx` + `AssetTree` upload handler | A `File` **is** a `Blob`. `await putAssetBlob(newId, file)` then dispatch `addAsset` with metadata. Drop `readAsDataURL`. Keep the existing size guard but raise the threshold (IndexedDB, not 5 MB). |
| **Project import** | `src/features/projects/importProject.ts` | Thunk becomes **async** (`async (dispatch) => { ... return newProjectId }`). For each `json.assets[a]`: `await putAssetBlob(assetIdMap[a.id], dataUrlToBlob(a.content))`, then dispatch `addAsset` with metadata. |
| **Tilemap editor save** | `src/components/TileMapEditor/index.tsx:241` | `dispatch(updateAsset({ ...asset, content: encodeStmContent(...) }))` → `await putAssetBlob(asset.id, new Blob([encodeStmContent(...)], { type: mime }))`. If a metadata field also changed, dispatch `updateAsset` with metadata only. |
| **New tilemap dialog** | `src/components/TileMapEditor/NewTilemapDialog.tsx` | Same pattern — `putAssetBlob` for the initial `.stm` content, then `addAsset` metadata. |
| **Text asset edit** | `src/components/AssetPreview/TextEditor.tsx` | Save handler: `await putAssetBlob(asset.id, new Blob([text], { type: mimeFromName }))` instead of `updateAsset({...content})`. |

### `importProject` async ripple

Callers to `await`:
- `src/components/Projects/index.tsx:421` and `:431` — inside click handlers, straightforward `await`.
- `src/pages/DemosPage.tsx:29` — `const newId = await dispatch(importProject(demo.json, ...))`; already inside an async handler after `loadDemoJson` (see Demos section).

## Read paths

Efficiency goal: object URLs, no re-encoding.

### `src/hooks/useAssetObjectUrl.ts` (new)

```ts
export function useAssetObjectUrl(assetId: string | undefined): string | undefined
```

`getAssetBlob(assetId)` → `URL.createObjectURL(blob)`; `URL.revokeObjectURL` in the effect cleanup and whenever `assetId` changes; returns `undefined` while loading or if the blob is missing.

Consumers:
- `src/components/AssetPreview/ImagePreview.tsx` — `<img src={url}>`
- `src/components/AssetPreview/AudioPreview.tsx` — `<audio src={url}>`
- `src/components/Landing/LandingHero.tsx` — whatever it renders from `content`

### `src/hooks/useAssetText.ts` (new)

```ts
export function useAssetText(assetId: string | undefined): { text: string | undefined; loading: boolean }
```

`getAssetBlob` → `await blob.text()`. Consumers:
- `src/components/AssetPreview/TextEditor.tsx` — seed the editor draft once loaded
- `src/components/TileMapEditor/index.tsx` — `decodeStmContent(text)` once loaded; show a loading state until then

### Runner

**Correction (found during planning): the runner does not take an `assets` prop today.** `bootstrapper.html` calls `_sb.preloadFromLocalStorage(projectId)` / `_sb.preloadAudioFromLocalStorage(projectId)` — engine methods that read `localStorage['persist:softBASIC']` **from inside the iframe** and parse `state.assets.byId` for base64 content. Those two methods break the moment assets leave localStorage, so the whole runtime delivery path is replaced:

- New `useRunnerAssets(projectId)` hook — selects all project assets (all folders, via `makeSelectAssetsByProject`), `await getAssetBlob(id)` for each, converts to a manifest `Array<{ name, src }>`. Runner path uses **data URLs** (`blobToDataUrl`) as the primary representation — that is exactly what the engine consumes today, and a parent-minted `blob:` URL crossing the `srcdoc` + `sandbox="allow-scripts allow-same-origin"` boundary cannot be verified by the automated suite (PIXI's loader / `@pixi/sound` add further failure surface). Blob-URL optimization for the runner is a deferred follow-up.
- Thread the manifest as a prop through `Preview` → `EditPage` → `Runner`, with a "loading assets" gate so the iframe does not mount until the manifest resolves.
- `Runner` splits the manifest by file extension: images/other → `_sb.preload(...)`; audio → a **new** `_sb.preloadAudioManifest(...)` method in `engine/audio.js` (there is no manifest-based audio preload today — only the localStorage one).
- Delete `_sb.preloadFromLocalStorage` / `_sb.preloadAudioFromLocalStorage` from the engine; update `tests/components/Runner/bootstrapper.test.ts`, which asserts on their presence / call order.
- `LandingHero` already passes an `assets` prop (public-path URLs, images only) — reconcile with the new prop shape.

**Residual risk for manual check:** PIXI v8 choking on very large (multi-MB) data URLs. If that surfaces it is a genuinely new problem, not covered here.

### In-app previews (top document, not the iframe)

`ImagePreview`, `AudioPreview`, and the TileMapEditor tileset slicing render in the top document, so they safely use `blob:` object URLs via `useAssetObjectUrl` (below).

## Export — byte-identical output

`src/features/projects/exportProject.ts`:

- `buildExportJson` becomes **async**: for each project asset, `getAssetBlob(id)` → `blobToDataUrl(blob)` → `assets[].content`. Everything else unchanged.
- `exportProject` thunk becomes async and awaits `buildExportJson`.
- `src/hooks/useRunnerMessages.ts:8` uses `buildExportJson` for the runner's "export to parent" message — make that handler async.
- `ProjectExportJson` interface: **unchanged**. Existing `.b4wgl.json` files (demos, user exports) import and export identically.

## Demos — lazy dynamic import

`src/features/demos/demoRegistry.ts`:

- Remove the four static `import ... from '../../docs/demos/*.b4wgl.json'` lines.
- `DemoEntry` drops the `json` field; keeps `slug`, `name`, `tags`, `description`, `docsSlug`.
- Add:
  ```ts
  export async function loadDemoJson(slug: string): Promise<ProjectExportJson> {
    const mod = await import(`../../docs/demos/${slug}.b4wgl.json`);
    return (mod.default ?? mod) as ProjectExportJson;
  }
  ```
  Vite resolves the dynamic-import glob and code-splits each JSON into its own chunk, loaded only when requested.

Callers:
- `src/pages/DemosPage.tsx` — `const json = await loadDemoJson(demo.slug); const newId = await dispatch(importProject(json, { tags: demo.tags }));` Add a loading indicator on the demo card while the chunk + import run.
- `src/components/Projects/index.tsx` — same, wherever it reads `demo.json`.

Net effect: ~3.5 MB removed from the initial bundle; the >500 kB chunk-size warning should clear or shrink substantially.

## redux-persist wiring + dead-key cleanup

`src/store.ts`:

```ts
import persistStorage from './lib/storage/persistStore';
// ...
const persistedConfig = {
  key: 'softBASIC',
  storage: persistStorage,          // was: redux-persist/lib/storage
  blacklist: ['session', 'packages'],
  transforms: [clearDirtyOnRehydrate],
};
```

On boot (once, e.g. top of `main.tsx` before `persistStore(store)` runs, or a module side-effect in `store.ts`):

```ts
try { window.localStorage.removeItem('persist:softBASIC'); } catch { /* ignore */ }
```

No migration. The old key is simply cleared.

## Cypress — `cypress/e2e/demos.cy.ts`

The current `buildPersistedState` helper hand-builds `localStorage['persist:softBASIC']` with base64 assets inline. That representation no longer exists.

Rewrite the seeding to exercise the real path:

- **Preferred:** navigate to the demos page, click the target demo's "open/try" control, and wait for the editor to load — this runs `loadDemoJson` → async `importProject` → `putAssetBlob`. Then click Run and assert no `ERR` span appears (the existing assertion).
- If the UI flow is too slow/brittle for the suite, expose a narrow test hook: `if (import.meta.env.DEV || window.Cypress) window.__seedDemo = (slug) => loadDemoJson(slug).then(j => store.dispatch(importProject(j)))`. The spec calls `cy.window().then(w => w.__seedDemo('raycaster'))`.

Each demo's `describe` block still reads its real `.b4wgl.json` via `cy.readFile` for any content assertions it makes; only the *seeding* mechanism changes.

`cypress/e2e/tutorials.cy.ts` seeds a hardcoded project with **no assets**, so its `buildPersistedState` path only needs the same storage-key change (it writes `persist:softBASIC` today) — point it at the IndexedDB seed hook or the same reduced flow. Confirm during implementation which tutorial specs actually carry assets (most don't).

## Testing

1. **`assetBlobStore` unit tests** (`tests/lib/storage/assetBlobStore.test.ts`) — with `fake-indexeddb`: put/get round-trips a Blob byte-for-byte; `getAssetBlob` returns `undefined` for a missing id; `deleteAssetBlobs` removes a batch.
2. **`dataUrl` helpers** — `dataUrlToBlob`/`blobToDataUrl` round-trip preserves bytes and MIME.
3. **Import/export round-trip** (`tests/features/projects/roundtrip.test.ts`) — import a small fixture `.b4wgl.json` → assert blobs in the store + metadata (no `content`) in the slice → `buildExportJson` → assert the produced JSON equals the fixture (modulo id remapping).
4. **`useAssetObjectUrl` / `useAssetText`** (`@testing-library/react` + `fake-indexeddb`) — resolves the URL/text; revokes the object URL on unmount and on id change (spy `URL.revokeObjectURL`).
5. **Persist/rehydrate** — `store.ts` with the localforage engine over `fake-indexeddb`: dispatch, flush, re-create store, rehydrate, assert state restored.
6. **Manual** — full `cypress:run` (demos + tutorials); in-app: import the Raycaster demo, confirm it Runs with no console errors and assets load; export it and diff the JSON against the shipped file (should match modulo ids).

## Out of scope / tracked follow-ups

- **Quota-exceeded / storage-denied UX** — a friendly error when IndexedDB is full or blocked (private browsing, Safari eviction). Wrap `putAssetBlob` / persist writes; surface a toast. Tracked, not built here.
- **Orphaned-blob GC sweep** — a defensive pass that deletes `assetBlobs` entries with no matching metadata. The project-delete and asset-delete cascades cover the normal case; a sweep guards against interrupted writes. Tracked.
- **Trimming the Raycaster's oversized audio** (`yd_Searching.ogg` 2.1 MB, `dragon-studio-zombie-sound-357975.mp3` 259 KB) — independent content fix.
- **`useLocalStorage` hook** (theme, small prefs) — stays on localStorage; those values are tiny and synchronous access is convenient. Not touched.
