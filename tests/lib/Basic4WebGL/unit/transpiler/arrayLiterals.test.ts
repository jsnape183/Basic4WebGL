import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transpile = (source: string) =>
  compiler.transpile({ lib: [], files: [{ name: 'Main.bas', source }] });

describe('array literals — basic values', () => {
  test('empty literal {} compiles to an empty array', () => {
    const result = transpile('function onenter()\n  dim a = {}\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('onenter_a = []');
  });

  test('numeric literal elements compile to a JS array', () => {
    const result = transpile('function onenter()\n  dim a = {1, 2, 3}\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('onenter_a = [1,2,3]');
  });

  test('string literal elements compile to a JS array', () => {
    const result = transpile('function onenter()\n  dim a = {"walls", "obstacles"}\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('onenter_a = ["walls","obstacles"]');
  });

  test('mixed-type elements compile without diagnostics (arrays are untyped)', () => {
    const result = transpile('function onenter()\n  dim a = {1, "two", true}\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('onenter_a = [1,"two",true]');
  });
});

describe('array literals — nesting', () => {
  test('nested literals compile to nested JS arrays', () => {
    const result = transpile('function onenter()\n  dim grid = {{1, 2}, {3, 4}}\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('onenter_grid = [[1,2],[3,4]]');
  });

  test('a nested literal supports 2D-style grid(i, j) indexing', () => {
    const result = transpile(
      'function onenter()\n  dim grid = {{0, 0}, {1, 0}, {0, 1}}\n  print grid(1, 0)\nendfunction'
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('grid[1][0]');
  });
});

describe('array literals — module scope', () => {
  test('module-level dim arr = {1,2,3} compiles without let', () => {
    const result = transpile('dim arr = {1, 2, 3}');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr = [1,2,3]');
    expect(result.code).not.toContain('let main.arr');
  });
});

describe('array literals — used directly as a call argument', () => {
  test('a literal can be passed inline without an intermediate dim', () => {
    const result = transpile([
      'function getFirst(a)',
      '  dim x',
      '  x = a',
      'endfunction',
      'function test()',
      '  dim x',
      '  x = getFirst({1, 2, 3})',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('[1,2,3]');
  });
});

describe('array literals — indexing after literal init', () => {
  test('a literal-initialized array supports arr(i) reads via the checked accessor', () => {
    const result = transpile('function onenter()\n  dim a = {10, 20}\n  print a(0)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbCheckedArrayGet(');
  });
});
