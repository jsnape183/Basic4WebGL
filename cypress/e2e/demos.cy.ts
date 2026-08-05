/// <reference types="cypress" />

// ---------------------------------------------------------------------------
// Seeds a demo's real .b4wgl.json export (read straight from src/docs/demos/,
// including its real assets) into localStorage, the same way tutorials.cy.ts
// seeds hardcoded snippets — but sourced from the actual shipped export
// instead of duplicating the source in this file.
// ---------------------------------------------------------------------------

interface ExportedFile {
  id: string;
  name: string;
  source: string;
  folderId: string | null;
  fullName: string;
}

interface ExportedAsset {
  id: string;
  name: string;
  content: string;
  folderId: string | null;
  fullName: string;
}

interface ProjectExportJson {
  version: 1;
  project: { name: string };
  files: ExportedFile[];
  assets: ExportedAsset[];
  fileOrder: Record<string, string[]>;
  assetOrder: Record<string, string[]>;
}

function buildPersistedStateFromExport(projectId: string, json: ProjectExportJson): string {
  const filesById: Record<string, object> = {};
  json.files.forEach((f) => {
    filesById[f.id] = { ...f, projectId };
  });
  const fileOrder = json.fileOrder[':root'] ?? json.files.map((f) => f.id);

  const assetsById: Record<string, object> = {};
  json.assets.forEach((a) => {
    assetsById[a.id] = { ...a, projectId };
  });
  const assetOrder = json.assetOrder[':root'] ?? json.assets.map((a) => a.id);

  const state = {
    projects: JSON.stringify({
      items: [{ id: projectId, name: json.project.name, packageIds: ['softcore', 'softgfx'] }],
    }),
    files: JSON.stringify({
      byId: filesById,
      dirtyFileIds: [],
      fileOrder: { [`${projectId}:root`]: fileOrder },
    }),
    assets: JSON.stringify({
      byId: assetsById,
      assetOrder: { [`${projectId}:root`]: assetOrder },
    }),
    folders: JSON.stringify({ items: [] }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  };
  return JSON.stringify(state);
}

function runDemo(projectId: string, jsonPath: string, waitMs: number) {
  cy.readFile(jsonPath).then((json: ProjectExportJson) => {
    const persistedState = buildPersistedStateFromExport(projectId, json);
    cy.visit(`/projects/${projectId}/edit`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('persist:softBASIC', persistedState);
      },
    });
  });

  cy.get('[aria-label="Run project"]', { timeout: 10000 }).click();
  cy.wait(waitMs);
  cy.get('span').contains('ERR').should('not.exist');
}

describe('Demo: Wolfenstein-Style Raycaster', () => {
  it('runs without runtime errors', () => {
    runDemo('demo-raycaster', 'src/docs/demos/Raycaster.b4wgl.json', 4000);
  });
});

describe('Demo: Collect the Coins: A Platformer', () => {
  it('runs without runtime errors', () => {
    runDemo('demo-coins-platformer', 'src/docs/demos/CoinsPlatformer.b4wgl.json', 4000);
  });
});
