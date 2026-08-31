import { readFileSync, readdirSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { sortByDependencies } from '@Basic4WebGL/sortByDependencies';
import { packageModules } from '../../../../src/constants/packageModules';

// Regression guard: the raycaster phase demos (demo-src/raycaster-p*/) ship a
// copied-in, actively-developed raycaster library (RcWorld.bas and successors).
// Nothing else in the committed Vitest suite catches a transpile break in these
// demo .bas files — only a manual, non-CI Cypress run does. This test transpiles
// each phase demo against the full standard library and asserts no diagnostics.
// New phase directories are picked up automatically.

const DEMO_SRC = 'demo-src';

const lib = Object.entries(packageModules).map(([name, source]) => ({ name, source }));

const phaseDirs = readdirSync(DEMO_SRC, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^raycaster-p\d+$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

describe('raycaster phase demos transpile clean', () => {
  test('at least one raycaster-p* demo directory exists', () => {
    expect(phaseDirs.length).toBeGreaterThan(0);
  });

  test.each(phaseDirs)('%s compiles with no diagnostics', (dirName) => {
    const dir = `${DEMO_SRC}/${dirName}`;

    // Top-level .bas files only — matches buildDemo's non-recursive readdir.
    const basNames = readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.bas'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    const rawFiles = basNames.map((name) => ({
      name,
      source: readFileSync(`${dir}/${name}`, 'utf-8'),
    }));

    // Dependency-order the files exactly as the app does before transpiling.
    const { files, error: dependencyError } = sortByDependencies(rawFiles);
    expect(dependencyError, `${dirName} dependency sort`).toBeUndefined();

    const result = compiler.transpile({ lib, files });

    expect(result.diagnostics, `${dirName} transpile diagnostics`).toEqual([]);
  });
});
