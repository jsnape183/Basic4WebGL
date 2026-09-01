import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { describe, test, expect } from 'vitest';

// Regression guard: the raycaster phase demos (demo-src/raycaster-p*/) each ship
// their OWN copy of the actively-developed raycaster library (RcWorld.bas and
// successors), because scripts/buildDemo.ts is non-recursive and cannot pull in
// demo-src/raycaster/lib/. Those copies must stay byte-identical to the canonical
// files under demo-src/raycaster/lib/ or the phase demos silently drift.
// This test asserts that. New phase directories are picked up automatically.

const DEMO_SRC = 'demo-src';
const CANON_LIB = `${DEMO_SRC}/raycaster/lib`;

const canonNames = new Set(
  readdirSync(CANON_LIB, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.bas'))
    .map((entry) => entry.name),
);

const phaseDirs = readdirSync(DEMO_SRC, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^raycaster-p\d+$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

describe('raycaster phase demos keep their copied library in sync', () => {
  test('at least one raycaster-p* demo directory exists', () => {
    expect(phaseDirs.length).toBeGreaterThan(0);
  });

  const cases: Array<{ dirName: string; basName: string }> = [];
  for (const dirName of phaseDirs) {
    const dir = `${DEMO_SRC}/${dirName}`;
    for (const basName of readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.bas'))
      .map((entry) => entry.name)
      .sort()) {
      if (canonNames.has(basName)) {
        cases.push({ dirName, basName });
      }
    }
  }

  test('every phase demo has at least one library file to check', () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  test.each(cases)('$dirName/$basName matches demo-src/raycaster/lib/$basName', ({ dirName, basName }) => {
    const copyPath = `${DEMO_SRC}/${dirName}/${basName}`;
    const canonPath = `${CANON_LIB}/${basName}`;
    expect(existsSync(canonPath)).toBe(true);
    const copy = readFileSync(copyPath, 'utf-8');
    const canon = readFileSync(canonPath, 'utf-8');
    expect(
      copy,
      `${copyPath} has drifted from ${canonPath} — re-copy it (cp ${canonPath} ${copyPath})`,
    ).toBe(canon);
  });
});
