// Dev/Cypress-only seeding hook.
//
// Assets and persisted state now live in IndexedDB (see
// docs/superpowers/plans/2026-08-30-indexeddb-asset-storage.md), so the old
// Cypress approach of hand-writing `localStorage['persist:softBASIC']` no
// longer works. Instead the e2e specs call `window.__seedProject`, which runs
// the app's real project-creation code paths (including `putAssetBlob`) and
// then flushes redux-persist so a subsequent full-page navigation to the edit
// route rehydrates the seeded project from IndexedDB.
//
// This module is imported once by `src/App.tsx`. The whole body is behind an
// `import.meta.env.DEV` / `window.Cypress` guard. In a production `vite build`
// `import.meta.env.DEV` folds to `false`, so the hook body never executes in
// production (`window.Cypress` is undefined there); the leftover guard check
// itself is negligible.

interface SeedProjectSpec {
  name: string;
  files: Array<{ name: string; source: string }>;
  assets?: Array<{ name: string; dataUrl: string }>;
  /**
   * Optional explicit project id. Pass this when a spec needs the project's
   * per-project runtime storage (`save.*` / `file.*`, keyed by project id in
   * localStorage) to persist across separate seed calls or reloads. Re-seeding
   * an existing id replaces the project's files/assets while leaving that
   * runtime storage untouched.
   */
  id?: string;
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

  // Lazily imports the store, slice actions and blob-store helpers so the
  // guard costs ~nothing when the block is kept.
  w.__seedProject = async (spec: SeedProjectSpec): Promise<string> => {
    const { v4: uuidv4 } = await import('uuid');
    const { addProject, removeProject } = await import('./features/projects/projectsSlice');
    const { addFile, removeFile } = await import('./features/files/filesSlice');
    const { addAsset, removeAsset } = await import('./features/assets/assetsSlice');
    const { putAssetBlob } = await import('./lib/storage/assetBlobStore');
    const { dataUrlToBlob } = await import('./lib/storage/dataUrl');
    const { store, persistor } = await import('./store');

    const projectId = spec.id ?? uuidv4();

    // Re-seeding an explicit id: strip the previous project's files/assets and
    // the project entry itself, but not its localStorage-backed save/file
    // runtime storage (that's the point of reusing the id).
    if (spec.id) {
      const state = store.getState();
      Object.values(state.files.byId)
        .filter((f) => f.projectId === projectId)
        .forEach((f) => store.dispatch(removeFile(f.id)));
      Object.values(state.assets.byId)
        .filter((a) => a.projectId === projectId)
        .forEach((a) => store.dispatch(removeAsset(a.id)));
      if (state.projects.items.some((p) => p.id === projectId)) {
        store.dispatch(removeProject(projectId));
      }
    }

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

    // redux-persist writes on a debounce with no implicit flush; without this
    // the next `cy.visit(edit)` reload can rehydrate a store that predates
    // these dispatches, and the edit page then can't find the project.
    await persistor.flush();

    return projectId;
  };
}
