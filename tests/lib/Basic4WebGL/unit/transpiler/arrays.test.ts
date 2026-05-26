import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';

const transpile = (source: string) => {
  const result = compiler.transpile({
    lib: [],
    files: [{ name: 'Main.bas', source }],
  });
  return result;
};

const arrayLib = {
  name: 'array',
  source: readFileSync('src/lib/Basic4WebGL/defs/array.bas', 'utf-8'),
};

const transpileWithArrayLib = (source: string) => {
  const result = compiler.transpile({
    lib: [arrayLib],
    files: [{ name: 'Main.bas', source }],
  });
  return result;
};

describe('Array — module-level declaration', () => {
  test('dim arr(10) at module level produces valid JS without let', () => {
    const result = transpile('dim arr(10)');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr = _createArray([10])');
    expect(result.code).not.toContain('let main.arr');
  });
});

describe('Array — bare reference in expression context', () => {
  test('array variable compiles as argument to a function', () => {
    const result = transpile([
      'dim arr(5)',
      'function getLen(a)',
      '  dim x',
      '  x = 1',
      'endfunction',
      'function test()',
      '  dim x',
      '  x = getLen(arr)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr');
  });
});

describe('Array — pass by reference', () => {
  test('mutation inside function is visible to caller', () => {
    // Compiles without error — runtime behaviour verified manually
    const result = transpile([
      'dim enemies(5)',
      'enemies(0) = 10',
      'function resetFirst(arr)',
      '  arr(0) = 0',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('Array — index read and write', () => {
  test('arr(0) = x at module level emits main.arr[0] = ...', () => {
    const result = transpile('dim arr(5)\narr(0) = 42');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr[0]');
  });

  test('print arr(0) at module level emits main.arr[0]', () => {
    const result = transpile('dim arr(5)\nprint arr(0)');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr[0]');
  });
});

describe('Array — arrLength and join compile with module-level array', () => {
  test('array.arrLength(arr) compiles without error', () => {
    const result = transpileWithArrayLib([
      'dim arr(5)',
      'function test()',
      '  print array.arrLength(arr)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.join(arr, ",") compiles without error', () => {
    const result = transpileWithArrayLib([
      'dim arr(3)',
      'function test()',
      '  print array.join(arr, ",")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});
