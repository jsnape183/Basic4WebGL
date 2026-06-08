import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transpile = (source: string) =>
  compiler.transpile({ lib: [], files: [{ name: 'Main.bas', source }] });

// ─── Fix 1: Bare return ───────────────────────────────────────────────────────

describe('bare return — early exit from void function', () => {
  test('compiles without error', () => {
    const result = transpile([
      'function guard(x)',
      '  if x = 0',
      '    return',
      '  endif',
      '  print x',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('emits "return;" with no expression', () => {
    const result = transpile([
      'function guard(x)',
      '  if x = 0',
      '    return',
      '  endif',
      '  print x',
      'endfunction',
    ].join('\n'));
    expect(result.code).toContain('return;');
  });

  test('return with expression still works', () => {
    const result = transpile([
      'function double(n)',
      '  return n * 2',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('return double_n');
  });

  test('return at top level emits a diagnostic error', () => {
    const result = transpile('return\n');
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});

// ─── Fix 2: For loop with already-declared variable ───────────────────────────

describe('for loop — auto-declares loop variable', () => {
  test('for loop without prior dim compiles', () => {
    const result = transpile([
      'function test()',
      '  for i = 0 to 9',
      '    print i',
      '  next',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('for loop with prior dim i compiles (no duplicate declaration error)', () => {
    const result = transpile([
      'function test()',
      '  dim i',
      '  for i = 0 to 9',
      '    print i',
      '  next',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('for loop variable is accessible inside loop body', () => {
    const result = transpile([
      'function test()',
      '  for i = 0 to 9',
      '    print i',
      '  next',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('test_i');
  });

  test('module-scope dim i and function for i produce distinct symbols', () => {
    const result = compiler.transpile({
      lib: [],
      files: [{ name: 'Main.bas', source: [
        'dim i',
        'function test()',
        '  for i = 0 to 9',
        '    print i',
        '  next',
        'endfunction',
      ].join('\n') }],
    });
    expect(result.diagnostics).toHaveLength(0);
    // function-scoped i emits as test_i, confirming it's distinct from module-level i
    expect(result.code).toContain('test_i');
  });
});

// ─── Fix 3: Truthy if — no = true required ────────────────────────────────────

describe('truthy if — function call result as condition', () => {
  test('if functioncall() compiles without = true', () => {
    const result = transpile([
      'function isReady()',
      '  return true',
      'endfunction',
      'function test()',
      '  if isReady()',
      '    print "yes"',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('if functioncall(arg) compiles without = true', () => {
    const result = transpile([
      'function check(n)',
      '  return n > 0',
      'endfunction',
      'function test()',
      '  if check(37)',
      '    print "key"',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});
