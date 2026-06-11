import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transpile = (source: string) =>
  compiler.transpile({ lib: [], files: [{ name: 'Main.bas', source }] });

const arrayLib = {
  name: 'array',
  source: readFileSync('src/lib/Basic4WebGL/defs/array.bas', 'utf-8'),
};

// dict.bas doesn't exist yet — these tests will fail until Task 6
const dictLib = () => ({
  name: 'dict',
  source: readFileSync('src/lib/Basic4WebGL/defs/dict.bas', 'utf-8'),
});

const transpileWith = (libs: { name: string; source: string }[], source: string) =>
  compiler.transpile({ lib: libs, files: [{ name: 'Main.bas', source }] });

describe('Dictionary — declaration', () => {
  test('dim scores[] at module level produces _createDict()', () => {
    const result = transpile('dim scores[]');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.scores = _createDict()');
  });

  test('dim scores[] inside function produces let with _createDict()', () => {
    const result = transpile('function test()\n  dim scores[]\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('let test_scores = _createDict()');
  });

  test('dim scores[] = value is a compile error', () => {
    const result = transpile('dim scores[] = 5');
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});

describe('Dictionary — assignment', () => {
  test('scores["Alice"] = 100 emits .set("Alice",100)', () => {
    const result = transpile('dim scores[]\nscores["Alice"] = 100');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.scores.set("Alice",100)');
  });

  test('scores[42] = "hello" emits .set(42,"hello")', () => {
    const result = transpile('dim scores[]\nscores[42] = "hello"');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.scores.set(42,"hello")');
  });

  test('scores["Alice"] = 100 inside function uses function-scoped symbol', () => {
    const result = transpile([
      'function test()',
      '  dim scores[]',
      '  scores["Alice"] = 100',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('test_scores.set("Alice",100)');
  });
});

describe('Dictionary — lookup', () => {
  test('print scores["Alice"] emits _sbDictGet', () => {
    const result = transpile('dim scores[]\nprint scores["Alice"]');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbDictGet(main.scores,"Alice")');
  });

  test('print scores[42] emits _sbDictGet with number key', () => {
    const result = transpile('dim scores[]\nprint scores[42]');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbDictGet(main.scores,42)');
  });

  test('dict lookup inside function uses function-scoped variable', () => {
    const result = transpile([
      'function test()',
      '  dim scores[]',
      '  print scores["key"]',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbDictGet(test_scores,"key")');
  });

  test('dict value can be assigned to a variable', () => {
    const result = transpile([
      'dim scores[]',
      'function test()',
      '  dim x',
      '  x = scores["Alice"]',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbDictGet(main.scores,"Alice")');
  });
});

describe('Dictionary — dict.bas API', () => {
  test('dict.keys(d) compiles', () => {
    const result = transpileWith([dictLib()], [
      'dim d[]',
      'function test()',
      '  dim k',
      '  k = dict.keys(d)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('dict.values(d) compiles', () => {
    const result = transpileWith([dictLib()], [
      'dim d[]',
      'function test()',
      '  dim v',
      '  v = dict.values(d)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('dict.joinKeys(d, ",") compiles', () => {
    const result = transpileWith([dictLib()], [
      'dim d[]',
      'function test()',
      '  dim s',
      '  s = dict.joinKeys(d, ",")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});

describe('array.bas — updated shared functions still work for arrays', () => {
  const withArray = (body: string) =>
    transpileWith([arrayLib], ['dim arr(0)', body].join('\n'));

  test('array.length(arr) compiles', () => {
    const result = withArray('function test()\n  dim x\n  x = array.length(arr)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.join(arr, ",") still compiles after update', () => {
    const result = withArray('function test()\n  print array.join(arr, ",")\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.contains(arr, 42) still compiles', () => {
    const result = withArray('function test()\n  dim x\n  x = array.contains(arr, 42)\nendfunction');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.remove(arr, 0) still compiles', () => {
    const result = withArray('array.remove(arr, 0)');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.clear(arr) still compiles', () => {
    const result = withArray('array.clear(arr)');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.length(d) compiles with a dictionary', () => {
    const result = transpileWith([arrayLib], [
      'dim d[]',
      'function test()',
      '  dim x',
      '  x = array.length(d)',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('array.contains(d, "key") compiles with a dictionary', () => {
    const result = transpileWith([arrayLib], [
      'dim d[]',
      'function test()',
      '  dim x',
      '  x = array.contains(d, "key")',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});
