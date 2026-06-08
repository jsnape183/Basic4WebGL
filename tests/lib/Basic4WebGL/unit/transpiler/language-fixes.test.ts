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
    // Note: the function body uses `return true` rather than `return n > 0`
    // because the type validator requires Number on both sides of arithmetic
    // comparisons, and parameters default to Variant. The call site is what
    // we are testing — that check(37) used as a bare if-condition compiles.
    const result = transpile([
      'function check(n)',
      '  return true',
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

// ─── Fix 4: Module function shadowing ────────────────────────────────────────

describe('module function lookup is scoped to the module', () => {
  test('user-defined clear(x) does not shadow stage.clear()', () => {
    // If the scope-priority search is used, the module-level clear(x) (outer scope)
    // wins over stage.clear() (inner scope), giving "expects 1 arguments, got 0".
    const result = compiler.transpile({
      lib: [],
      files: [
        {
          name: 'stage',
          source: [
            'function clear()',
            '  call("_sb.clear()")',
            'endfunction',
          ].join('\n'),
        },
        {
          name: 'Main.bas',
          source: [
            'function clear(x)',
            '  print x',
            'endfunction',
            'function game()',
            '  stage.clear()',
            'endfunction',
          ].join('\n'),
        },
      ],
    });
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── Fix 5: else / elseif ─────────────────────────────────────────────────────

describe('if/else/elseif', () => {
  test('if/else compiles and emits both branches', () => {
    const result = transpile([
      'function test(x)',
      '  if x = 1',
      '    print "one"',
      '  else',
      '    print "other"',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('else{');
  });

  test('if/elseif compiles and emits else if', () => {
    const result = transpile([
      'function test(x)',
      '  if x = 1',
      '    print "one"',
      '  elseif x = 2',
      '    print "two"',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('else if(');
  });

  test('if/elseif/else chain compiles and emits both else if and else', () => {
    const result = transpile([
      'function test(x)',
      '  if x = 1',
      '    print "one"',
      '  elseif x = 2',
      '    print "two"',
      '  else',
      '    print "other"',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('else if(');
    expect(result.code).toContain('else{');
  });

  test('== is accepted as an alias for = in conditions', () => {
    const result = transpile([
      'function test()',
      '  dim x',
      '  x = 1',
      '  if x == 1',
      '    print "one"',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('==');
  });

  test('plain if without else still works', () => {
    const result = transpile([
      'function test(x)',
      '  if x = 1',
      '    print "one"',
      '  endif',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).not.toContain('else');
  });
});
