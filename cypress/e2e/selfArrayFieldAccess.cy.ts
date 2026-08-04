/// <reference types="cypress" />

// ---------------------------------------------------------------------------
// Runtime proof for the class-scope array field indexing fix.
//
// The bug: a class-scope array field indexed through `self` in expression
// context — `v = self.coins(i)` — emitted a JavaScript *function call*
// (`this.coins(i)`) instead of an array index (`this.coins[i]`), because
// softBASIC spells array indexing and method calls identically and the
// expression-context rule assumed every `self.name(...)` was a call. At runtime
// that threw "this.coins is not a function".
//
// The write direction (`self.coins(i) = 5`) was always correct — the statement
// rule can disambiguate on the trailing `=` — which is why the two appear
// together throughout this spec: writes set up the values that the reads must
// then return, so a regression in either direction changes the printed output.
//
// Why this spec has to exist: the Vitest suite checks transpiler *output*. It
// can prove the emitted string changed but not that the emitted program runs.
// This is the only layer that executes the compiled game in a real browser.
//
// Why it asserts on printed values rather than only "no ERR": an absent ERR
// would also be satisfied by a program that ran but computed the wrong thing.
// Every value below is a compile-time constant flowing through real indexed
// reads, so the expected output is exact and asset-independent.
// ---------------------------------------------------------------------------

interface FileSpec {
  name: string;
  source: string;
}

function buildPersistedState(
  projectId: string,
  projectName: string,
  files: FileSpec[]
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

  const state = {
    projects: JSON.stringify({
      items: [{ id: projectId, name: projectName, packageIds: ['softcore', 'softgfx'] }],
    }),
    files: JSON.stringify({
      byId: filesById,
      dirtyFileIds: [],
      fileOrder: { [`${projectId}:root`]: fileOrder },
    }),
    assets: JSON.stringify({ byId: {}, assetOrder: { [`${projectId}:root`]: [] } }),
    folders: JSON.stringify({ items: [] }),
    _persist: JSON.stringify({ version: -1, rehydrated: true }),
  };
  return JSON.stringify(state);
}

function run(projectId: string, projectName: string, files: FileSpec[], waitMs = 3000) {
  const persistedState = buildPersistedState(projectId, projectName, files);
  cy.visit(`/projects/${projectId}/edit`, {
    onBeforeLoad(win) {
      win.localStorage.setItem('persist:softBASIC', persistedState);
    },
  });
  cy.get('[aria-label="Run project"]', { timeout: 10000 }).click();
  cy.wait(waitMs);
}

describe('class-scope array fields: indexed reads via self work at runtime', () => {
  // No engine or asset dependency — every printed value is a pure constant that
  // was written through `self.arr(i) = v` and read back through `self.arr(i)`.
  const BAG = `
Class

dim coins(3)
dim grid(2,2)

Constructor()
  self.coins(0) = 10
  self.coins(1) = 20
  self.coins(2) = 30
  self.grid(1,1) = 77
EndConstructor

function at(i)
  return self.coins(i)
endfunction

function firstPlusSecond()
  return self.coins(0) + self.coins(1)
endfunction

function indirect()
  return self.coins(self.coins(2) - 28)
endfunction

function gridMiddle()
  return self.grid(1,1)
endfunction

function biggerThan(n)
  if self.coins(2) > n then
    return 1
  endif
  return 0
endfunction

function count()
  return array.arrLength(self.coins)
endfunction

function addOne(v)
  array.push(self.coins, v)
endfunction

EndClass
`.trim();

  const MAIN = `
dim bag as Bag()

function onenter()
  print "AT0=" + string.str(bag.at(0))
  print "AT2=" + string.str(bag.at(2))
  print "SUM=" + string.str(bag.firstPlusSecond())
  print "NESTED=" + string.str(bag.indirect())
  print "GRID=" + string.str(bag.gridMiddle())
  print "CMP=" + string.str(bag.biggerThan(25))
  print "COUNT=" + string.str(bag.count())
  bag.addOne(99)
  print "AFTER=" + string.str(bag.count())
  print "PUSHED=" + string.str(bag.at(3))
  print "DONE"
endfunction
`.trim();

  it('reads class array fields by index from every expression position', () => {
    run('selfarr01', 'Self Array Fields', [
      { name: 'Bag', source: BAG },
      { name: 'Main', source: MAIN },
    ]);

    // Pre-fix this failed here: "this.coins is not a function".
    cy.get('span').contains('ERR').should('not.exist');

    // Plain indexed read returned from a method — the original repro shape.
    cy.contains('AT0=10').should('exist');
    cy.contains('AT2=30').should('exist');
    // Two indexed reads inside one arithmetic expression.
    cy.contains('SUM=30').should('exist');
    // An indexed read used as the index of another indexed read (30 - 28 = 2).
    cy.contains('NESTED=30').should('exist');
    // Multi-dimensional field: must chain subscripts, not emit a 2-arg call.
    cy.contains('GRID=77').should('exist');
    // Indexed read inside a comparison.
    cy.contains('CMP=1').should('exist');
    // Regression guard: the BARE field (no index) must still pass the whole
    // array, so arrLength sees 3 elements rather than throwing.
    cy.contains('COUNT=3').should('exist');
    // Regression guard: bare field passed to array.push still mutates the field,
    // and the newly pushed element is then readable by index.
    cy.contains('AFTER=4').should('exist');
    cy.contains('PUSHED=99').should('exist');

    cy.contains('DONE').should('exist');
  });
});

describe('class-scope array fields: inherited fields and method calls stay distinct', () => {
  // Two things could regress in opposite directions: an inherited array field
  // must start indexing, and a method must NOT start indexing. Both are
  // exercised on one object so a single run proves the disambiguation.
  const BASE = `
Class

dim items(2)

Constructor()
  self.items(0) = 5
  self.items(1) = 6
EndConstructor

function ping()
  return 42
endfunction

EndClass
`.trim();

  const CHILD = `
Class extends Base

function readInherited(i)
  return self.items(i)
endfunction

function callInherited()
  return self.ping()
endfunction

function both()
  return self.items(1) + self.ping()
endfunction

EndClass
`.trim();

  const MAIN = `
dim c as Child()

function onenter()
  print "INH0=" + string.str(c.readInherited(0))
  print "INH1=" + string.str(c.readInherited(1))
  print "CALL=" + string.str(c.callInherited())
  print "BOTH=" + string.str(c.both())
  print "DONE"
endfunction
`.trim();

  it('indexes an inherited array field while still calling an inherited method', () => {
    run('selfarr02', 'Self Array Inherited', [
      { name: 'Base', source: BASE },
      { name: 'Child', source: CHILD },
      { name: 'Main', source: MAIN },
    ]);

    cy.get('span').contains('ERR').should('not.exist');

    // Inherited array field, indexed — was broken.
    cy.contains('INH0=5').should('exist');
    cy.contains('INH1=6').should('exist');
    // Inherited method — must remain a call, not become an index.
    cy.contains('CALL=42').should('exist');
    // Both kinds resolved correctly within a single expression (6 + 42).
    cy.contains('BOTH=48').should('exist');

    cy.contains('DONE').should('exist');
  });
});

describe('class-scope array fields: self. is not shadowed by a local of the same name', () => {
  // `self.coins` must always mean the class field even when a local array named
  // `coins` is in scope. If the lookup ever fell back to ordinary (innermost)
  // symbol resolution, both reads would return the local's value.
  const HOLDER = `
Class

dim coins(2)

Constructor()
  self.coins(0) = 100
EndConstructor

function compare()
  dim coins(2)
  coins(0) = 7
  return string.str(coins(0)) + "/" + string.str(self.coins(0))
endfunction

EndClass
`.trim();

  const MAIN = `
dim h as Holder()

function onenter()
  print "SHADOW=" + h.compare()
  print "DONE"
endfunction
`.trim();

  it('resolves self.field against the class, and the bare name against the local', () => {
    run('selfarr03', 'Self Array Shadowing', [
      { name: 'Holder', source: HOLDER },
      { name: 'Main', source: MAIN },
    ]);

    cy.get('span').contains('ERR').should('not.exist');
    cy.contains('SHADOW=7/100').should('exist');
    cy.contains('DONE').should('exist');
  });
});
