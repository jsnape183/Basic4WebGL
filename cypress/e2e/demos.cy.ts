/// <reference types="cypress" />

// ---------------------------------------------------------------------------
// Seeds each demo by invoking the app's real import path via a dev/Cypress-only
// window hook (`window.__seedDemo`, registered in src/pages/DemosPage.tsx),
// then Runs the project and asserts no ERR appears in the console panel.
//
// Assets now live in IndexedDB (not localStorage), so the hook is the only
// sane way to seed: it exercises loadDemoJson -> async importProject ->
// putAssetBlob for real, exactly as clicking "Try Demo" would.
// ---------------------------------------------------------------------------

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
      cy.window()
        .then((win) =>
          (win as unknown as { __seedDemo: (s: string) => Promise<string> }).__seedDemo(slug),
        )
        .then((projectId) => {
          cy.visit(`/projects/${projectId}/edit`);
          cy.get('[aria-label="Run project"]', { timeout: 15000 }).click();
          cy.wait(waitMs);
          cy.get('span').contains('ERR').should('not.exist');
        });
    });
  });
});

const DEV_DEMOS: Array<{ slug: string; title: string; waitMs: number }> = [
  { slug: 'raycaster-p1-mapload', title: 'Raycaster P1 — Map Load', waitMs: 3000 },
  { slug: 'raycaster-p2-spancast', title: 'Raycaster P2 — Span Cast', waitMs: 3000 },
];

DEV_DEMOS.forEach(({ slug, title, waitMs }) => {
  describe(`Dev demo: ${title}`, () => {
    it('runs without runtime errors', () => {
      cy.visit('/demos');
      cy.window().its('__seedDemo').should('be.a', 'function');
      cy.window()
        .then((win) =>
          (win as unknown as { __seedDemo: (s: string) => Promise<string> }).__seedDemo(slug),
        )
        .then((projectId) => {
          cy.visit(`/projects/${projectId}/edit`);
          cy.get('[aria-label="Run project"]', { timeout: 15000 }).click();
          cy.wait(waitMs);
          cy.get('span').contains('ERR').should('not.exist');
        });
    });
  });
});
