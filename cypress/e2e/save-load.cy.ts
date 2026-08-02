/// <reference types="cypress" />

interface FileSpec {
  name: string;
  source: string;
}

function buildPersistedState(projectId: string, projectName: string, files: FileSpec[]): string {
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

  const state = {
    projects: JSON.stringify({
      items: [{ id: projectId, name: projectName, packageIds: ['softcore', 'softgfx'] }],
    }),
    files: JSON.stringify({
      byId: filesById,
      dirtyFileIds: [],
      fileOrder: { [`${projectId}:root`]: fileOrder },
    }),
    assets: JSON.stringify({ byId: {}, assetOrder: {} }),
    folders: JSON.stringify({ items: [] }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  };
  return JSON.stringify(state);
}

function visitAndRun(projectId: string, projectName: string, source: string) {
  cy.visit(`/projects/${projectId}/edit`, {
    onBeforeLoad(win) {
      win.localStorage.setItem('persist:softBASIC', buildPersistedState(projectId, projectName, [
        { name: 'Main', source },
      ]));
    },
  });
  cy.get('[aria-label="Run project"]', { timeout: 10000 }).click();
  cy.wait(1500);
}

const VISIT_COUNTER_SOURCE = `
function onenter()
  dim visits
  visits = save.get("visits")
  if visits == ""
    visits = 0
  endif
  visits = visits + 1
  save.set("visits", visits)
  print "visits: " + string.str(visits)
endfunction
`.trim();

describe('save/load: persists across a real page reload', () => {
  it('increments a saved counter each time the same project runs, surviving reload', () => {
    visitAndRun('save01', 'Save Test', VISIT_COUNTER_SOURCE);
    cy.get('span').contains('visits: 1').should('exist');

    cy.reload();
    cy.get('[aria-label="Run project"]', { timeout: 10000 }).click();
    cy.wait(1500);
    cy.get('span').contains('visits: 2').should('exist');
  });
});

describe('save/load: setAll/getAll round-trips a nested dict+array, and setAll replaces', () => {
  const SOURCE = `
function onenter()
  save.set("leftover", "should be gone after setAll")

  dim state[]
  state["level"] = 3
  dim items(1)
  items(0) = "sword"
  state["items"] = items
  save.setAll(state)

  ' Note: save.getAll() returns a dict, but softBASIC's bracket-index syntax
  ' (dict["key"]) only works on a variable declared as a dictionary with
  ' dim x[] and built up in place — not on a plain variable holding a dict
  ' handed back from a function call. So instead of indexing into "loaded"
  ' directly, read it back with the shared array.* functions, which accept
  ' any expression as their argument and special-case dictionaries: length
  ' is key count, join concatenates the values in insertion order (level was
  ' set before items, so this also proves the nested array came back intact).
  dim loaded
  loaded = save.getAll()

  print "count: " + string.str(array.length(loaded))
  print "values: " + array.join(loaded, " | ")
  print "leftover exists: " + string.str(save.exists("leftover"))
endfunction
`.trim();

  it('round-trips a dict containing an array, and setAll wipes prior individually-set keys', () => {
    visitAndRun('save02', 'Save Test 2', SOURCE);
    cy.get('span').contains('count: 2').should('exist');
    cy.get('span').contains('values: 3 | sword').should('exist');
    cy.get('span').contains('leftover exists: false').should('exist');
  });
});

describe('save/load: two different projects never see each other\'s data', () => {
  it('a fresh project has no saved visits even though save01 does', () => {
    visitAndRun('save03', 'Save Test 3', VISIT_COUNTER_SOURCE);
    // A brand-new project id has never saved "visits" — should start at 1, not
    // pick up save01's count from the earlier test in this same describe block.
    cy.get('span').contains('visits: 1').should('exist');
  });
});

describe('save/load: __proto__ is a safe file path (regression guard)', () => {
  const SOURCE = `
function onenter()
  file.write("__proto__", "hello")
  dim readBack
  readBack = file.read("__proto__")
  dim existsBefore
  existsBefore = file.exists("__proto__")
  file.delete("__proto__")
  dim existsAfter
  existsAfter = file.exists("__proto__")
  print "proto readback: " + readBack
  print "proto exists before delete: " + string.str(existsBefore)
  print "proto exists after delete: " + string.str(existsAfter)
endfunction
`.trim();

  it('writes, reads, checks existence of, and deletes a "__proto__" path correctly', () => {
    visitAndRun('save04', 'Save Test 4', SOURCE);
    cy.get('span').contains('proto readback: hello').should('exist');
    cy.get('span').contains('proto exists before delete: true').should('exist');
    cy.get('span').contains('proto exists after delete: false').should('exist');
  });
});

describe('save/load: save.setAll rejects a non-dict value without wiping existing data', () => {
  const BAD_SETALL_SOURCE = `
function onenter()
  save.set("survivor", "should still be here")
  save.setAll(123)
endfunction
`.trim();

  const READ_SURVIVOR_SOURCE = `
function onenter()
  print "survivor: " + save.get("survivor")
endfunction
`.trim();

  it('errors visibly and leaves previously-saved data intact', () => {
    // First run: save a key, then call setAll with a plain number instead of
    // a dictionary. This should throw — surfacing as a visible ERR entry —
    // and, critically, must NOT reach writeBlob, so "survivor" must survive.
    visitAndRun('save05', 'Save Test 5', BAD_SETALL_SOURCE);
    cy.get('span').contains('ERR').should('exist');
    cy.contains('span', 'save.setAll requires a dictionary').should('exist');

    // Second run of the SAME project (same underlying save storage), with a
    // different Main source that only reads "survivor" back. If the bad
    // setAll call had silently wiped storage (the old, buggy behavior), this
    // would come back empty instead.
    visitAndRun('save05', 'Save Test 5', READ_SURVIVOR_SOURCE);
    cy.get('span').contains('survivor: should still be here').should('exist');
  });
});
