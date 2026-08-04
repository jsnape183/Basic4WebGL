/// <reference types="cypress" />

// ---------------------------------------------------------------------------
// `oninit` is entirely a feature about *ordering* across an async boot
// sequence: declare user code → fire oninit → preload assets → run module
// top-level statements → onenter. Vitest can only check transpiler output and
// the source order of bootstrapper.html; this spec is the only thing that
// proves the real sequence in a real browser.
// ---------------------------------------------------------------------------

const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

interface FileSpec {
  name: string;
  source: string;
}

function buildPersistedState(
  projectId: string,
  projectName: string,
  files: FileSpec[],
  assetNames: string[] = []
): string {
  const filesById: Record<string, object> = {};
  const fileOrder: string[] = [];
  files.forEach((f) => {
    const id = `file-${f.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    filesById[id] = {
      id,
      name: f.name,
      source: f.source,
      projectId,
      folderId: null,
      fullName: f.name,
    };
    fileOrder.push(id);
  });

  const assetsById: Record<string, object> = {};
  const assetOrder: string[] = [];
  assetNames.forEach((name) => {
    const id = `asset-${name.replace('.', '-')}`;
    assetsById[id] = {
      id,
      name,
      content: PIXEL_PNG,
      projectId,
      folderId: null,
      fullName: name,
    };
    assetOrder.push(id);
  });

  const state = {
    projects: JSON.stringify({
      items: [{ id: projectId, name: projectName, packageIds: ['softcore', 'softgfx'] }],
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

function run(
  projectId: string,
  projectName: string,
  files: FileSpec[],
  assetNames: string[] = [],
  waitMs = 3000
) {
  const persistedState = buildPersistedState(projectId, projectName, files, assetNames);
  cy.visit(`/projects/${projectId}/edit`, {
    onBeforeLoad(win) {
      win.localStorage.setItem('persist:softBASIC', persistedState);
    },
  });
  cy.get('[aria-label="Run project"]', { timeout: 10000 }).click();
  cy.wait(waitMs);
}

// Reads the bottom console panel as an ordered list of log lines.
function consoleLines(): Cypress.Chainable<string[]> {
  return cy.get('ul li').then(($items) =>
    Cypress._.map($items.toArray(), (el) => (el as HTMLElement).innerText.trim())
  );
}

function indexOfLine(lines: string[], needle: string): number {
  return lines.findIndex((l) => l.includes(needle));
}

describe('oninit: fires before assets preload and before onenter', () => {
  const MAIN = `
print "phase-body"

function oninit()
  print "phase-init"
endfunction

function onenter()
  print "phase-enter"
endfunction
`.trim();

  it('runs oninit, then the module top-level statements, then onenter', () => {
    run('oninit01', 'OnInit Order', [{ name: 'Main', source: MAIN }], ['ship.png']);

    cy.get('span').contains('ERR').should('not.exist');
    consoleLines().then((lines) => {
      const init = indexOfLine(lines, 'phase-init');
      const body = indexOfLine(lines, 'phase-body');
      const enter = indexOfLine(lines, 'phase-enter');

      expect(init, 'oninit ran').to.be.greaterThan(-1);
      expect(body, 'module top-level statements ran').to.be.greaterThan(-1);
      expect(enter, 'onenter ran').to.be.greaterThan(-1);

      expect(init, 'oninit before module body').to.be.lessThan(body);
      expect(body, 'module body before onenter').to.be.lessThan(enter);
    });
  });
});

describe('oninit: really is before asset preloading', () => {
  // The proof that oninit runs ahead of preload, not merely ahead of onenter:
  // reaching for a loaded asset from inside oninit must fail with the
  // timing-specific message, while the identical call from onenter succeeds.
  const TOO_EARLY = `
function oninit()
  dim tex = assetmanager.loadImage("ship.png")
endfunction
`.trim();

  const IN_TIME = `
function onenter()
  dim tex = assetmanager.loadImage("ship.png")
  print "asset-ok"
endfunction
`.trim();

  it('reports a timing error for an asset used inside oninit', () => {
    run('oninit02', 'OnInit Too Early', [{ name: 'Main', source: TOO_EARLY }], ['ship.png']);

    cy.get('span').contains('ERR').should('exist');
    cy.contains('cannot be used inside oninit()').should('exist');
  });

  it('loads the very same asset without error from onenter', () => {
    run('oninit03', 'OnInit In Time', [{ name: 'Main', source: IN_TIME }], ['ship.png']);

    cy.get('span').contains('ERR').should('not.exist');
    cy.contains('asset-ok').should('exist');
  });
});

describe('oninit: fires on every module that defines it', () => {
  const SETTINGS = `
function oninit()
  print "settings-init"
endfunction
`.trim();

  const MAIN = `
function oninit()
  print "main-init"
endfunction

function onenter()
  print "main-enter"
endfunction
`.trim();

  it('fires on each module, all of them before onenter', () => {
    run(
      'oninit04',
      'OnInit Multi Module',
      [
        { name: 'Settings', source: SETTINGS },
        { name: 'Main', source: MAIN },
      ],
      ['ship.png']
    );

    cy.get('span').contains('ERR').should('not.exist');
    consoleLines().then((lines) => {
      const settings = indexOfLine(lines, 'settings-init');
      const main = indexOfLine(lines, 'main-init');
      const enter = indexOfLine(lines, 'main-enter');

      expect(settings, 'settings module oninit ran').to.be.greaterThan(-1);
      expect(main, 'main module oninit ran').to.be.greaterThan(-1);
      expect(settings, 'settings oninit before onenter').to.be.lessThan(enter);
      expect(main, 'main oninit before onenter').to.be.lessThan(enter);
    });
  });
});

describe('oninit: projects that do not define it are unaffected', () => {
  // Classes are instantiated in the deferred module-body phase now — this is
  // the shape most tutorials use, and it must behave exactly as before.
  const PLAYER = `
Class
Extends sprite

Constructor()
  super("ship.png")
  self.transform.setPosition(320, 180)
  stage.add(self)
EndConstructor
`.trim();

  const MAIN = `
dim player = new Player()

function onenter()
  stage.setBackground(10, 10, 30)
  print "no-oninit-ok"
endfunction
`.trim();

  it('creates a sprite from a module top-level statement with no oninit anywhere', () => {
    run(
      'oninit05',
      'No OnInit',
      [
        { name: 'Player', source: PLAYER },
        { name: 'Main', source: MAIN },
      ],
      ['ship.png']
    );

    cy.get('span').contains('ERR').should('not.exist');
    cy.contains('no-oninit-ok').should('exist');
  });
});
