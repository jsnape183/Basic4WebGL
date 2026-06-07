import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import { readFileSync } from 'fs';

const stringLib = { name: 'string', source: readFileSync('src/lib/Basic4WebGL/defs/string.bas', 'utf-8') };

const transpile = (source: string) =>
  compiler.transpile({ lib: [stringLib], files: [{ name: 'Main.bas', source }] });

describe('string — new utility functions compile', () => {
  const fn = (body: string) =>
    transpile(`function test()\n  dim x\n  ${body}\nendfunction`);

  test('replace compiles', () => {
    expect(fn('x = string.replace("hello", "l", "r")').diagnostics).toHaveLength(0);
  });
  test('contains compiles', () => {
    expect(fn('x = string.contains("hello", "ell")').diagnostics).toHaveLength(0);
  });
  test('indexof compiles', () => {
    expect(fn('x = string.indexof("hello", "l")').diagnostics).toHaveLength(0);
  });
  test('char compiles', () => {
    expect(fn('x = string.char(65)').diagnostics).toHaveLength(0);
  });
  test('asc compiles', () => {
    expect(fn('x = string.asc("A")').diagnostics).toHaveLength(0);
  });
});

describe('string — output correctness', () => {
  const fn = (body: string) =>
    transpile(`function test()\n  dim x\n  ${body}\nendfunction`);

  test('replace emits replaceAll', () => {
    const result = fn('x = string.replace("hello", "l", "r")');
    expect(result.code).toContain('replaceAll(');
  });
  test('contains emits includes', () => {
    const result = fn('x = string.contains("hello", "ell")');
    expect(result.code).toContain('.includes(');
  });
  test('indexof emits indexOf', () => {
    const result = fn('x = string.indexof("hello", "l")');
    expect(result.code).toContain('.indexOf(');
  });
  test('char emits String.fromCharCode', () => {
    const result = fn('x = string.char(65)');
    expect(result.code).toContain('String.fromCharCode(');
  });
  test('asc emits charCodeAt(0)', () => {
    const result = fn('x = string.asc("A")');
    expect(result.code).toContain('charCodeAt(0)');
  });
});
