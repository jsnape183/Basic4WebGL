/// <reference types="cypress" />

// Shared seed helper for e2e specs.
//
// Assets and persisted state now live in IndexedDB, so specs can no longer
// hand-write the old redux-persist localStorage key. Instead they call the
// app's real project-creation path through the dev/Cypress-only
// `window.__seedProject` hook (registered in `src/devSeed.ts`), which also
// flushes redux-persist so the follow-up navigation to the edit route
// rehydrates the seeded project.

// Minimal 1x1 white-pixel PNG — stand-in for any image asset a spec needs.
export const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export interface SeedFile {
  name: string;
  source: string;
}

export interface SeedSpec {
  name: string;
  files: SeedFile[];
  /** Asset filenames — each seeded with PIXEL_PNG bytes in the blob store. */
  assets?: string[];
  /**
   * Optional explicit project id. Pass this only when the spec needs the
   * project's per-project runtime storage (`save.*` / `file.*`) to survive
   * across separate seed calls / reloads. Re-seeding an existing id replaces
   * its files/assets but leaves that runtime storage intact.
   */
  id?: string;
}

type SeedProjectHook = (spec: {
  name: string;
  files: SeedFile[];
  assets?: Array<{ name: string; dataUrl: string }>;
  id?: string;
}) => Promise<string>;

/**
 * Seed a project via `window.__seedProject` and return a Cypress chainable that
 * yields the new project id. Visits `/projects` first so the app (and the hook)
 * is mounted.
 */
export function seedProject(spec: SeedSpec): Cypress.Chainable<string> {
  cy.visit('/projects');
  cy.window().its('__seedProject').should('be.a', 'function');
  return cy.window().then((win) =>
    (win as unknown as { __seedProject: SeedProjectHook }).__seedProject({
      name: spec.name,
      id: spec.id,
      files: spec.files,
      assets: (spec.assets ?? []).map((name) => ({ name, dataUrl: PIXEL_PNG })),
    }),
  );
}

/**
 * Seed a project, open it in the editor, click Run, and wait `waitMs`.
 * The caller then makes its own assertions against the console panel / iframe.
 */
export function seedAndRun(spec: SeedSpec, waitMs = 3000): void {
  seedProject(spec).then((projectId) => {
    cy.visit(`/projects/${projectId}/edit`);
    cy.get('[aria-label="Run project"]', { timeout: 15000 }).click();
    cy.wait(waitMs);
  });
}
