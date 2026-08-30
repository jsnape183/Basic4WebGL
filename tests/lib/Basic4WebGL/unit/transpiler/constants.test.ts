import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';

const transpile = (
  source: string,
  extraFiles: { name: string; source: string }[] = []
) =>
  compiler.transpile({
    files: [{ name: 'Main.bas', source }, ...extraFiles],
  });

// NOTE: Task 5 only guarantees that a `const` block/single-line declaration
// parses with zero diagnostics. Bare-word resolution of a constant reference
// (`x = MAX_HEALTH`) is Task 8, so the function bodies below deliberately do
// NOT reference the declared constants yet. Task 7/8 re-add the reference
// assertions and the commented-out `.code` expectations.

describe('const — block form', () => {
  test('block of literals compiles with no diagnostics', () => {
    const src = [
      'const',
      '  MAX_HEALTH = 100',
      '  GAME_TITLE = "Space Blaster"',
      '  DEBUG_MODE = false',
      '  GRAVITY = -9',
      'endconst',
      'function test()',
      '  dim x',
      '  x = 1',
      'endfunction',
    ].join('\n');
    const result = transpile(src);
    expect(result.diagnostics).toHaveLength(0);
    // TODO(Task 7): expect(result.code).toContain(
    //   'const _const_main = Object.freeze({ max_health: 100, game_title: "Space Blaster", debug_mode: false, gravity: -9 });'
    // );
  });

  test('single-constant block compiles', () => {
    const src = [
      'const',
      '  MAX_HEALTH = 100',
      'endconst',
      'function test()',
      '  dim x',
      '  x = 1',
      'endfunction',
    ].join('\n');
    const result = transpile(src);
    expect(result.diagnostics).toHaveLength(0);
    // TODO(Task 7/8): expect(result.code).toContain('_const_main.max_health');
  });
});

describe('const — single-line form', () => {
  test('single-line const compiles', () => {
    const src = [
      'const MAX_HEALTH = 100',
      'function test()',
      '  dim x',
      '  x = 1',
      'endfunction',
    ].join('\n');
    const result = transpile(src);
    expect(result.diagnostics).toHaveLength(0);
    // TODO(Task 7): expect(result.code).toContain('const _const_main = Object.freeze({ max_health: 100 });');
  });
});

describe('const — multiple blocks in one file', () => {
  test('two blocks parse with no diagnostics', () => {
    const src = [
      'const',
      '  A = 1',
      'endconst',
      'const',
      '  B = 2',
      'endconst',
      'function test()',
      '  dim x',
      '  x = 1',
      'endfunction',
    ].join('\n');
    const result = transpile(src);
    expect(result.diagnostics).toHaveLength(0);
    // TODO(Task 7): expect(result.code).toContain('const _const_main = Object.freeze({ a: 1, b: 2 });');
    // TODO(Task 7): expect(result.code.match(/_const_main =/g) ?? []).toHaveLength(1);
  });
});

describe('const — malformed block', () => {
  test('block with no endconst produces a diagnostic (does not hang)', () => {
    const result = compiler.transpile({
      files: [{ name: 'Main.bas', source: 'const\n  A = 1\n' }],
    });
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});
