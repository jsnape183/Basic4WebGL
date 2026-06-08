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
    expect(result.code).toContain('return');
  });
});
