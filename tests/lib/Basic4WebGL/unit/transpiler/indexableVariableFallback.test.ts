import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transpile = (source: string) =>
  compiler.transpile({ lib: [], files: [{ name: 'Main.bas', source }] });

describe('Dictionary read fallback — plain dim variable holding a dict', () => {
  test('indexing a plain dim variable with [] compiles and emits the checked accessor', () => {
    const result = transpile([
      'function getstate()',
      '  dim d[]',
      '  d["level"] = 3',
      '  return d',
      'endfunction',
      'function test()',
      '  dim state',
      '  state = getstate()',
      '  print state["level"]',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbCheckedDictGet(test_state,"level","state")');
  });

  test('a real dim x[] dictionary keeps using the unguarded fast path', () => {
    const result = transpile('dim scores[]\nprint scores["Alice"]');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbDictGet(main.scores,"Alice")');
    expect(result.code).not.toContain('_sbCheckedDictGet');
  });

  test('indexing a bare function parameter with [] is still a compile error (no new scope for parameters)', () => {
    const result = transpile([
      'function readit(p)',
      '  print p["level"]',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message).toMatch(/Dictionary p .*has not been declared/);
  });
});

describe('Dictionary write fallback — plain dim variable holding a dict', () => {
  test('writing into a plain dim variable with [] compiles and emits the checked accessor', () => {
    const result = transpile([
      'function getstate()',
      '  dim d[]',
      '  return d',
      'endfunction',
      'function test()',
      '  dim state',
      '  state = getstate()',
      '  state["level"] = 5',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbCheckedDictSet(test_state,"level",5,"state")');
  });

  test('a real dim x[] dictionary keeps using the unguarded fast path for writes', () => {
    const result = transpile('dim scores[]\nscores["Alice"] = 100');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.scores.set("Alice",100)');
    expect(result.code).not.toContain('_sbCheckedDictSet');
  });

  test('plain dim assignment (x = 5) is unaffected by the dict fallback gate', () => {
    const result = transpile('dim x\nx = 5');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.x = 5;');
  });

  test('writing into a bare function parameter with [] is still a compile error (no new scope for parameters)', () => {
    const result = transpile([
      'function writeit(p)',
      '  p["level"] = 5',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message).toMatch(/Dictionary p .*has not been declared/);
  });
});

describe('Array read fallback — plain dim variable holding an array', () => {
  test('indexing a plain dim variable with () compiles and emits the checked accessor', () => {
    const result = transpile([
      'function getitems()',
      '  dim a(1)',
      '  a(0) = "sword"',
      '  return a',
      'endfunction',
      'function test()',
      '  dim items',
      '  items = getitems()',
      '  print items(0)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbCheckedArrayGet(test_items,0,"items")');
  });

  test('a real dim x(N) array keeps using the unguarded fast path', () => {
    const result = transpile('dim arr(2)\nprint arr(0)');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.arr[0]');
    expect(result.code).not.toContain('_sbCheckedArrayGet');
  });

  test('a real dim x(N,M) multi-dim array keeps using the unguarded fast path', () => {
    const result = transpile('dim grid(2,2)\nprint grid(0,1)');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.grid[0][1]');
    expect(result.code).not.toContain('_sbCheckedArrayGet');
  });

  test('indexing a bare function parameter with () is still a compile error (no new scope for parameters)', () => {
    const result = transpile([
      'function readit(p)',
      '  print p(0)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message).toMatch(/Array p .*has not been declared/);
  });
});
