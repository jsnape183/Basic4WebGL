import { describe, test, expect } from 'vitest';
import { scanEnclosingScope } from '../../src/monacoHelpers/scopeScanner';

const at = (text: string, line: number, col: number) => scanEnclosingScope(text, line, col);

describe('scanEnclosingScope', () => {
  test('top level of a file returns an empty stack', () => {
    expect(at('dim x = 1\nprint x\n', 2, 1)).toEqual([]);
  });

  test('inside a function body returns the function name', () => {
    const src = ['function takedamage(amount)', '  dim x = 1', 'endfunction'].join('\n');
    expect(at(src, 2, 3)).toEqual(['takedamage']);
  });

  test('after endfunction returns to the empty stack', () => {
    const src = ['function foo()', 'endfunction', 'print "done"'].join('\n');
    expect(at(src, 3, 1)).toEqual([]);
  });

  test('inside a constructor returns ["constructor"]', () => {
    const src = ['Class', 'constructor(hp)', '  self.hp = hp', 'endconstructor'].join('\n');
    expect(at(src, 3, 3)).toEqual(['constructor']);
  });

  test('cursor on the same line as the function open, before the block closes, is inside it', () => {
    const src = 'function foo(x, y)';
    expect(at(src, 1, 20)).toEqual(['foo']);
  });

  test('is case-insensitive for keywords', () => {
    const src = ['FUNCTION Foo()', 'ENDFUNCTION'].join('\n');
    expect(at(src, 1, 15)).toEqual(['foo']);
  });

  test('an unbalanced buffer (mid-edit, missing endfunction) does not throw', () => {
    const src = ['function foo()', '  dim x = 1'].join('\n');
    expect(() => at(src, 2, 3)).not.toThrow();
    expect(at(src, 2, 3)).toEqual(['foo']);
  });

  test('does not pop the constructor frame on a bare endfunction line', () => {
    const src = ['Class', 'constructor(hp)', 'endfunction', 'endconstructor'].join('\n');
    // malformed input (endfunction inside a constructor) — must not corrupt the stack
    expect(() => at(src, 4, 1)).not.toThrow();
  });
});
