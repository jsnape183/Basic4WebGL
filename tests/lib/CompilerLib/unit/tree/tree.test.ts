import { describe, test, expect } from 'vitest';
import { Tree, node } from '@CompilerLib/tree';
import type { SourceLocation } from '@CompilerLib/compiler/types';

const loc: SourceLocation = { line: 2, col: 5, filename: 'test.bas' };

describe('Tree.loc', () => {
  test('is undefined by default', () => {
    const t = new Tree(1, null, []);
    expect(t.loc).toBeUndefined();
  });

  test('can be assigned directly', () => {
    const t = new Tree(1, null, []);
    t.loc = loc;
    expect(t.loc).toEqual(loc);
  });
});

describe('node() factory', () => {
  test('sets loc when provided as fourth argument', () => {
    const t = node(1, 'data', [], loc);
    expect(t.loc).toEqual(loc);
  });

  test('loc is undefined when not provided', () => {
    const t = node(1, 'data', []);
    expect(t.loc).toBeUndefined();
  });

  test('loc does not affect type, data, or children', () => {
    const t = node(7, 'hello', [], loc);
    expect(t.type).toBe(7);
    expect(t.data).toBe('hello');
    expect(t.children).toEqual([]);
  });
});
