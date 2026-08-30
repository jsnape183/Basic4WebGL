import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import compiler from '@Basic4WebGL/index';

const mathLib = {
  name: 'math',
  source: readFileSync('src/lib/Basic4WebGL/defs/math.bas', 'utf-8'),
};

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
    expect(result.code).toContain(
      'const _const_main = Object.freeze({ max_health: 100, game_title: "Space Blaster", debug_mode: false, gravity: -9 });'
    );
  });

  test('single-constant block compiles', () => {
    const src = [
      'const',
      '  MAX_HEALTH = 100',
      'endconst',
      'function test()',
      '  dim x',
      '  x = MAX_HEALTH',
      'endfunction',
    ].join('\n');
    const result = transpile(src);
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_main.max_health');
  });
});

describe('const — bare references', () => {
  test('bare reference in an expression compiles to _const_<module>.<name>', () => {
    const src = [
      'const MAX = 100',
      'function test()',
      '  dim x',
      '  x = MAX + 1',
      'endfunction',
    ].join('\n');
    const result = compiler.transpile({ files: [{ name: 'Main.bas', source: src }] });
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_main.max');
  });

  test('bare reference as a function argument compiles', () => {
    const src = [
      'const SPEED = 5',
      'function test()',
      '  dim x',
      '  x = math.max(SPEED, 1)',
      'endfunction',
    ].join('\n');
    const result = compiler.transpile({
      lib: [mathLib],
      files: [{ name: 'Main.bas', source: src }],
    });
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_main.speed');
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
    expect(result.code).toContain('const _const_main = Object.freeze({ max_health: 100 });');
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
    expect(result.code).toContain('const _const_main = Object.freeze({ a: 1, b: 2 });');
    expect(result.code.match(/_const_main =/g) ?? []).toHaveLength(1);
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

describe('const — diagnostics', () => {
  const expectError = (src: string, fragment: string) => {
    const result = compiler.transpile({ files: [{ name: 'Main.bas', source: src }] });
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message.toLowerCase()).toContain(fragment.toLowerCase());
  };

  test('non-literal RHS (another name) is rejected', () => {
    expectError('const A = 1\nconst B = A\n', 'const value must be');
  });

  test('non-literal RHS (expression) is rejected', () => {
    expectError('const\n  A = 1 + 2\nendconst\n', 'const value must be');
  });

  test('non-literal RHS (function call) is rejected', () => {
    expectError('const\n  A = math.pi()\nendconst\n', 'const value must be');
  });

  test('redeclaring a constant in the same block is rejected', () => {
    expectError('const\n  A = 1\n  A = 2\nendconst\n', 'already declared');
  });

  test('redeclaring a constant across blocks is rejected', () => {
    expectError('const\n  A = 1\nendconst\nconst\n  A = 2\nendconst\n', 'already declared');
  });

  test('const inside a function body is rejected', () => {
    expectError('function test()\n  const A = 1\nendfunction\n', 'top level');
  });

  test('const inside a class body is rejected', () => {
    // softBASIC classes are declared with a bare `class` (module name = filename);
    // `class Foo` is invalid syntax, so the const body is what must be rejected.
    expectError('class\n  const A = 1\nendclass\n', 'top level');
  });

  test('const inside a top-level if block is rejected', () => {
    expectError('if true then\n  const A = 1\nendif\n', 'top level');
  });
});

describe('const — namespaced references (cross-file)', () => {
  // A second user `.bas` file passed via `files:` does NOT auto-register as a
  // module namespace (verified: `keys.SPACE` then fails with "Variable keys ...
  // has not been declared"). Cross-file modules are supplied via `lib:` — the
  // same mechanism the `defs` modules (math, string, ...) use — where the entry
  // `name` is the module name directly. Mirrors the `mathLib` setup above.
  const keys = {
    name: 'keys',
    source: ['const', '  SPACE = 32', '  LEFT = 37', 'endconst'].join('\n'),
  };

  test('module.CONSTANT in an expression compiles to _const_keys.<name>', () => {
    const src = [
      'function test()',
      '  dim x',
      '  x = keys.SPACE',
      'endfunction',
    ].join('\n');
    const result = compiler.transpile({ lib: [keys], files: [{ name: 'Main.bas', source: src }] });
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_const_keys.space');
  });

  test('assigning to module.CONSTANT is rejected', () => {
    const src = [
      'function test()',
      '  keys.SPACE = 5',
      'endfunction',
    ].join('\n');
    const result = compiler.transpile({ lib: [keys], files: [{ name: 'Main.bas', source: src }] });
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message.toLowerCase()).toContain('constant');
  });
});

describe('const — assignment and shadowing rules', () => {
  const expectError = (src: string, fragment: string) => {
    const result = compiler.transpile({ files: [{ name: 'Main.bas', source: src }] });
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message.toLowerCase()).toContain(fragment.toLowerCase());
  };

  test('assigning to a bare constant name is rejected', () => {
    expectError('const MAX = 1\nfunction test()\n  MAX = 2\nendfunction\n', 'constant');
  });

  test('dim with a constant name at module level is rejected', () => {
    expectError('const MAX = 1\ndim MAX\n', 'constant');
  });

  test('dim shadowing a constant inside a function is rejected', () => {
    expectError('const MAX = 1\nfunction test()\n  dim MAX\nendfunction\n', 'constant');
  });
});
