import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// ---------------------------------------------------------------------------
// Roadmap deferred issue #14(a): a class-scope DICTIONARY field indexed
// through `self.` — both read (expression context, SelfFactorRule) and write
// (statement context, SelfRule) — was an unimplemented parser branch, not a
// miscompile: `self.scores["a"]` failed to parse at all.
//
// Mirrors the existing class-scope ARRAY field support for `self.` (issue
// #13, see selfArrayFieldAccess.test.ts) but for dictionaries, which use
// `[...]` instead of `(...)` — so, unlike the array case, there is no
// call-vs-index ambiguity to resolve against the symbol table; the bracket
// token alone is enough to know this is an index, not a method call.
// ---------------------------------------------------------------------------

const arraySource = readFileSync('src/lib/Basic4WebGL/defs/array.bas', 'utf-8');
const stringSource = readFileSync('src/lib/Basic4WebGL/defs/string.bas', 'utf-8');

const transpile = (files: { name: string; source: string }[]) =>
  compiler.transpile({
    lib: [
      { name: 'array', source: arraySource },
      { name: 'string', source: stringSource },
    ],
    files,
  });

/** Compile a single class file and return only the emitted class code. */
const compileClass = (lines: string[]) => {
  const result = transpile([{ name: 'Scene.bas', source: lines.join('\n') }]);
  expect(result.diagnostics).toHaveLength(0);
  const code = result.code as string;
  return code.slice(code.indexOf('class _sb_scene'));
};

describe('class-scope dictionary field — indexed read via self (expression context)', () => {
  test('read into a local', () => {
    const code = compileClass([
      'Class',
      'dim scores[]',
      '',
      'function readIt()',
      '  dim v',
      '  v = self.scores["alice"]',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('readit_v = _sbDictGet(this.scores,"alice")');
  });

  test('read as a print argument', () => {
    const code = compileClass([
      'Class',
      'dim scores[]',
      '',
      'function readIt()',
      '  print self.scores["alice"]',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('_print(_sbDictGet(this.scores,"alice"))');
  });

  test('read of a field declared on an ancestor class resolves through the inheritance chain', () => {
    const result = transpile([
      {
        name: 'Base.bas',
        source: ['Class', 'dim scores[]', 'EndClass'].join('\n'),
      },
      {
        name: 'Child.bas',
        source: [
          'Class extends Base',
          'function readIt()',
          '  dim v',
          '  v = self.scores["alice"]',
          'endfunction',
          'EndClass',
        ].join('\n'),
      },
    ]);
    expect(result.diagnostics).toHaveLength(0);
    const code = result.code as string;
    expect(code).toContain('readit_v = _sbDictGet(this.scores,"alice")');
  });

  test('does not affect an existing self.method(args) call', () => {
    const code = compileClass([
      'Class',
      'function greet()',
      '  print "hi"',
      'endfunction',
      '',
      'function readIt()',
      '  self.greet()',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.greet()');
  });

  test('does not affect an existing self.arr(i) indexed read (issue #13)', () => {
    const code = compileClass([
      'Class',
      'dim coins(0)',
      '',
      'function readIt()',
      '  dim v',
      '  v = self.coins(0)',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('readit_v = this.coins[0]');
  });
});

describe('class-scope dictionary field — indexed write via self (statement context)', () => {
  test('write a string key', () => {
    const code = compileClass([
      'Class',
      'dim scores[]',
      '',
      'function writeIt()',
      '  self.scores["alice"] = 100',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.scores.set("alice",100);');
  });

  test('does not affect an existing self.property = expr assignment', () => {
    const code = compileClass([
      'Class',
      'dim health',
      '',
      'function hurt()',
      '  self.health = 5',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.health = 5;');
  });

  test('does not affect an existing self.arr(i) = value assignment (issue #13)', () => {
    const code = compileClass([
      'Class',
      'dim coins(0)',
      '',
      'function writeIt()',
      '  self.coins(0) = 5',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.coins[0]=5;');
  });

  test('does not affect an existing self.method(args) call statement', () => {
    const code = compileClass([
      'Class',
      'function greet()',
      '  print "hi"',
      'endfunction',
      '',
      'function writeIt()',
      '  self.greet()',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.greet()');
  });
});
