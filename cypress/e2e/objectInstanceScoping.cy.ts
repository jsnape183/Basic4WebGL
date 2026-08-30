/// <reference types="cypress" />

// ---------------------------------------------------------------------------
// Runtime proof for the function-scoped object-instance scoping fix.
//
// The bug: calling a method on a function-scoped object local and *using its
// return value in an expression* emitted the instance's lexical declaration
// path (`main.onenter.a`) instead of its real JS name (`onenter_a`). That name
// is `undefined` at runtime, so the call threw
// "Cannot read properties of undefined (reading 'value')".
//
// Why this spec has to exist: the Vitest suite deliberately checks transpiler
// *output* — it can prove the emitted string changed, but not that the emitted
// program actually runs. This is the only layer that executes the compiled game
// in a real browser.
//
// Why it asserts on printed values rather than only "no ERR": an absent ERR
// would also be satisfied by a program that silently computed the wrong thing.
// Every value below is a compile-time constant flowing through a real method
// call, so the expected output is exact and asset-independent — nothing here
// depends on texture dimensions or load timing.
// ---------------------------------------------------------------------------

import { seedAndRun } from '../support/seedProject';

interface FileSpec {
  name: string;
  source: string;
}

function run(
  projectName: string,
  files: FileSpec[],
  assetNames: string[] = [],
  waitMs = 3000
) {
  seedAndRun({ name: projectName, files, assets: assetNames }, waitMs);
}

// A plain user-defined class: no engine/asset dependency, so every value the
// game prints is a pure compile-time constant travelling through a real method
// call. If the receiver is wrong the call throws; if it is right the arithmetic
// is exact.
const COUNTER = `
Class

dim n

Constructor(start)
  self.n = start
EndConstructor

function value()
  return self.n
endfunction

function plus(k)
  return self.n + k
endfunction

EndClass
`.trim();

describe('function-scoped object locals: method return values work at runtime', () => {
  const MAIN = `
dim modLevel as Counter(100)

function readFrom(c as Counter)
  return c.value()
endfunction

function onenter()
  dim a as Counter(7)
  dim b as Counter
  b = new Counter(20)

  print "A=" + string.str(a.value())
  print "B=" + string.str(b.value())

  dim rhs = 0
  rhs = a.value()
  print "RHS=" + string.str(rhs)

  print "NESTED=" + string.str(math.floor(a.plus(1)))
  print "PARAM=" + string.str(readFrom(a))
  print "MODULE=" + string.str(modLevel.value())
  print "DONE"
endfunction
`.trim();

  it('reads method return values from every declaration form without throwing', () => {
    run('Object Scoping', [
      { name: 'Counter', source: COUNTER },
      { name: 'Main', source: MAIN },
    ]);

    // Pre-fix this failed here: "Cannot read properties of undefined (reading 'value')".
    cy.get('span').contains('ERR').should('not.exist');

    // Inline construction — `dim a as Counter(7)`, the original repro shape.
    cy.contains('A=7').should('exist');
    // Declare-then-assign — `dim b as Counter` + `b = new Counter(20)`.
    cy.contains('B=20').should('exist');
    // Return value as an assignment right-hand side.
    cy.contains('RHS=7').should('exist');
    // Return value nested inside another call (7 + 1, floored).
    cy.contains('NESTED=8').should('exist');
    // Typed function parameter — an Object symbol created by the same clone
    // path as a local `dim`, and broken in exactly the same way before the fix.
    cy.contains('PARAM=7').should('exist');
    // Module-level instance — the one case that was already correct; proves the
    // fix did not disturb it.
    cy.contains('MODULE=100').should('exist');

    cy.contains('DONE').should('exist');
  });
});

describe('function-scoped object locals: distinct instances stay distinct', () => {
  // Guards the failure mode where a receiver is resolved from something shared
  // (the enclosing function) rather than per-instance: both calls would then
  // hit the same object and print the same number without erroring.
  const MAIN = `
function onenter()
  dim a as Counter(1)
  dim b as Counter(2)
  print "SUM=" + string.str(a.plus(b.value()))
  print "A=" + string.str(a.value())
  print "B=" + string.str(b.value())
endfunction
`.trim();

  it('keeps two same-typed locals in one function independent', () => {
    run('Object Scoping Two', [
      { name: 'Counter', source: COUNTER },
      { name: 'Main', source: MAIN },
    ]);

    cy.get('span').contains('ERR').should('not.exist');
    cy.contains('SUM=3').should('exist');
    cy.contains('A=1').should('exist');
    cy.contains('B=2').should('exist');
  });
});

describe('function-scoped object locals: same name in different functions', () => {
  // The wrong path (`main.<fn>.c`) and the right path (`<fn>_c`) both vary with
  // the enclosing function, so this shape is what distinguishes a real
  // per-instance fix from one that merely happens to work in a single function.
  const MAIN = `
function first()
  dim c as Counter(11)
  return c.value()
endfunction

function second()
  dim c as Counter(22)
  return c.value()
endfunction

function onenter()
  print "FIRST=" + string.str(first())
  print "SECOND=" + string.str(second())
endfunction
`.trim();

  it('resolves a shared local name per enclosing function', () => {
    run('Object Scoping Names', [
      { name: 'Counter', source: COUNTER },
      { name: 'Main', source: MAIN },
    ]);

    cy.get('span').contains('ERR').should('not.exist');
    cy.contains('FIRST=11').should('exist');
    cy.contains('SECOND=22').should('exist');
  });
});

describe('function-scoped object locals: engine classes, not just user classes', () => {
  // The bug was first hit with `tilemap`, and reproduced with `sprite` — it is a
  // general scoping defect, so at least one engine-backed class belongs here.
  // `sprite.width()` on a 1x1 asset is deterministic once preloading has run.
  const MAIN = `
function onenter()
  dim s as sprite("ship.png")
  dim w = 0
  w = s.width()
  print "W=" + string.str(w)
  print "H=" + string.str(s.height())
endfunction
`.trim();

  it('reads a sprite method return value from a function-scoped local', () => {
    run(
      'Object Scoping Sprite',
      [{ name: 'Main', source: MAIN }],
      ['ship.png']
    );

    cy.get('span').contains('ERR').should('not.exist');
    cy.contains('W=1').should('exist');
    cy.contains('H=1').should('exist');
  });
});
