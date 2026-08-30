// Dev/Cypress-only seeding hooks.
//
// Assets and persisted state now live in IndexedDB (see
// docs/superpowers/plans/2026-08-30-indexeddb-asset-storage.md), so the old
// Cypress approach of hand-writing `localStorage['persist:softBASIC']` no
// longer works. Instead the e2e specs call these `window` hooks, which run the
// app's real import / project-creation code paths (including `putAssetBlob`).
//
// This module is imported once by `src/App.tsx`. The whole body is behind an
// `import.meta.env.DEV` / `window.Cypress` guard: `import.meta.env.DEV` is
// statically `false` in a production `vite build`, so the guarded block (and
// its lazily-imported dependencies) tree-shakes out of the prod bundle. The
// `window.Cypress` clause remains but is tiny and harmless.

interface SeedProjectSpec {
  name: string;
  files: Array<{ name: string; source: string }>;
  assets?: Array<{ name: string; dataUrl: string }>;
}

type SeedWindow = {
  Cypress?: unknown;
  __seedProject?: (spec: SeedProjectSpec) => Promise<string>;
};

if (
  import.meta.env.DEV ||
  (typeof window !== 'undefined' && (window as unknown as SeedWindow).Cypress)
) {
  const w = window as unknown as SeedWindow;

  // Seed an ad-hoc project (used by tutorials.cy.ts). Lazily imports the store,
  // slice actions and blob-store helpers so the guard costs ~nothing when the
  // block is kept.
  w.__seedProject = async (spec: SeedProjectSpec): Promise<string> => {
    const { v4: uuidv4 } = await import('uuid');
    const { addProject } = await import('./features/projects/projectsSlice');
    const { addFile } = await import('./features/files/filesSlice');
    const { addAsset } = await import('./features/assets/assetsSlice');
    const { putAssetBlob } = await import('./lib/storage/assetBlobStore');
    const { dataUrlToBlob } = await import('./lib/storage/dataUrl');
    const { store } = await import('./store');

    const projectId = uuidv4();
    store.dispatch(
      addProject({ id: projectId, name: spec.name, packageIds: ['softcore', 'softgfx'] }),
    );
    spec.files.forEach((f) =>
      store.dispatch(
        addFile({
          id: uuidv4(),
          name: f.name,
          source: f.source,
          projectId,
          folderId: null,
          fullName: f.name,
        }),
      ),
    );
    for (const a of spec.assets ?? []) {
      const id = uuidv4();
      await putAssetBlob(id, dataUrlToBlob(a.dataUrl));
      store.dispatch(
        addAsset({ id, name: a.name, projectId, folderId: null, fullName: a.name }),
      );
    }
    return projectId;
  };
}
