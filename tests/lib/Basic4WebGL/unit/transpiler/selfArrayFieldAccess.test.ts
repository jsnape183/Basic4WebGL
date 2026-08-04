import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// ---------------------------------------------------------------------------
// Regression matrix for: "a class-scope ARRAY field indexed through `self.` in
// EXPRESSION context transpiled to a JavaScript function call instead of an
// array index".
//
//   dim coins(0)            ' class field
//   v = self.coins(i)       ' emitted `this.coins(i)`  — should be `this.coins[i]`
//
// Root cause: softBASIC spells array indexing and method calls identically —
// `name(args)`. In STATEMENT context `SelfRule` can tell them apart purely
// syntactically, because only an array write can be followed by `=`
// (`self.coins(i) = 5`), so writes were always emitted correctly. In EXPRESSION
// context `SelfFactorRule` has no such trailing token to look at, and it simply
// assumed every `self.member(` was a method call, unconditionally returning a
// PropertyMethodTermNode. The only way to disambiguate is to ask the symbol
// table what kind of member `member` actually is — which it never did.
//
// The fix resolves `member` against the class scope (walking the inheritance
// chain, exactly as the pre-existing dataType lookup in the same rule already
// did) and emits an index only when the member is an Array-kind symbol and is
// NOT a method. Method calls therefore keep their existing behaviour in every
// case, which is what makes the change safe.
//
// Each "was broken" test asserts BOTH that the correct `[...]` form is emitted
// AND that the wrong `(...)` call form is gone — a bare toContain on the right
// answer would otherwise pass while the wrong form was still emitted elsewhere.
// ---------------------------------------------------------------------------

const arraySource = readFileSync('src/lib/Basic4WebGL/defs/array.bas', 'utf-8');
const stringSource = readFileSync('src/lib/Basic4WebGL/defs/string.bas', 'utf-8');
const mathSource = readFileSync('src/lib/Basic4WebGL/defs/math.bas', 'utf-8');

const transpile = (files: { name: string; source: string }[]) =>
  compiler.transpile({
    lib: [
      { name: 'array', source: arraySource },
      { name: 'string', source: stringSource },
      { name: 'math', source: mathSource },
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

const compileFiles = (files: { name: string; source: string }[]) => {
  const result = transpile(files);
  expect(result.diagnostics).toHaveLength(0);
  const code = result.code as string;
  return code.slice(code.indexOf('class _sb_'));
};

// ─── The bug: indexed READ of a class array field through `self.` ─────────────
//
// All of these are the same defect, but each reaches SelfFactorRule through a
// different surrounding expression rule, so a regression could reappear in one
// without touching the others.

describe('class-scope array field — indexed read via self (was broken)', () => {
  test('read into a local, the original repro', () => {
    const code = compileClass([
      'Class',
      'dim coins(0)',
      '',
      'function readIt()',
      '  dim i',
      '  dim v',
      '  i = 0',
      '  v = self.coins(i)',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('readit_v = this.coins[readit_i]');
    expect(code).not.toContain('this.coins(');
  });

  test('read as a print argument', () => {
    const code = compileClass([
      'Class',
      'dim coins(0)',
      '',
      'function readIt()',
      '  print self.coins(0)',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('_print(this.coins[0])');
    expect(code).not.toContain('this.coins(');
  });

  test('read nested as its own index expression', () => {
    const code = compileClass([
      'Class',
      'dim coins(0)',
      '',
      'function readIt()',
      '  print self.coins(self.coins(0))',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.coins[this.coins[0]]');
    expect(code).not.toContain('this.coins(');
  });

  test('read inside an arithmetic expression', () => {
    const code = compileClass([
      'Class',
      'dim coins(0)',
      '',
      'function readIt()',
      '  dim v',
      '  v = self.coins(0) + self.coins(1) * 2',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.coins[0]');
    expect(code).toContain('this.coins[1]');
    expect(code).not.toContain('this.coins(');
  });

  test('read inside a comparison in an if', () => {
    const code = compileClass([
      'Class',
      'dim coins(0)',
      '',
      'function readIt()',
      '  if self.coins(0) > 5 then',
      '    print "big"',
      '  endif',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.coins[0]');
    expect(code).not.toContain('this.coins(');
  });

  test('read as an argument to a module function', () => {
    const code = compileClass([
      'Class',
      'dim coins(0)',
      '',
      'function readIt()',
      '  print string.str(self.coins(0))',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.coins[0]');
    expect(code).not.toContain('this.coins(');
  });

  test('read in a return statement', () => {
    const code = compileClass([
      'Class',
      'dim coins(0)',
      '',
      'function readIt()',
      '  return self.coins(0)',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('return this.coins[0]');
    expect(code).not.toContain('this.coins(');
  });

  test('read of a multi-dimensional array field', () => {
    // Multi-dim must chain separate subscripts: this.grid[1][2], not this.grid[1,2].
    const code = compileClass([
      'Class',
      'dim grid(4,4)',
      '',
      'function readIt()',
      '  print self.grid(1,2)',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.grid[1][2]');
    expect(code).not.toContain('this.grid(');
  });

  test('read using an expression as the index', () => {
    const code = compileClass([
      'Class',
      'dim coins(0)',
      '',
      'function readIt()',
      '  dim i',
      '  i = 1',
      '  print self.coins(i + 1)',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.coins[readit_i+1]');
    expect(code).not.toContain('this.coins(');
  });

  test('read inside a constructor', () => {
    // Constructors are a different execution scope from methods; the class-scope
    // lookup must work there too.
    const code = compileClass([
      'Class',
      'dim coins(3)',
      '',
      'constructor()',
      '  print self.coins(0)',
      'endconstructor',
      'EndClass',
    ]);
    expect(code).toContain('this.coins[0]');
    expect(code).not.toContain('this.coins(');
  });

  test('read inside a while loop condition', () => {
    const code = compileClass([
      'Class',
      'dim coins(0)',
      '',
      'function readIt()',
      '  while self.coins(0) < 10',
      '    print "x"',
      '  endwhile',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.coins[0]');
    expect(code).not.toContain('this.coins(');
  });
});

// ─── Inheritance ─────────────────────────────────────────────────────────────
//
// The array field may be declared on an ancestor class. The pre-existing
// dataType lookup in SelfFactorRule already walked the inheritance chain; the
// kind lookup must walk it identically or inherited fields stay broken.

describe('inherited array field — indexed read via self (was broken)', () => {
  test('field declared on the parent class', () => {
    const code = compileFiles([
      { name: 'Base.bas', source: ['Class', 'dim items(3)', 'EndClass'].join('\n') },
      {
        name: 'Scene.bas',
        source: [
          'Class extends Base',
          '',
          'function readIt()',
          '  return self.items(0)',
          'endfunction',
          'EndClass',
        ].join('\n'),
      },
    ]);
    expect(code).toContain('return this.items[0]');
    expect(code).not.toContain('this.items(');
  });

  test('inherited array field and an inherited method of the same class', () => {
    // Pins that the kind lookup keeps walking the chain for BOTH kinds: the
    // inherited array must index, the inherited method must still call.
    const code = compileFiles([
      {
        name: 'Base.bas',
        source: [
          'Class',
          'dim items(3)',
          'function ping()',
          '  return 1',
          'endfunction',
          'EndClass',
        ].join('\n'),
      },
      {
        name: 'Scene.bas',
        source: [
          'Class extends Base',
          '',
          'function readIt()',
          '  return self.items(0) + self.ping()',
          'endfunction',
          'EndClass',
        ].join('\n'),
      },
    ]);
    expect(code).toContain('this.items[0]');
    expect(code).toContain('this.ping()');
    expect(code).not.toContain('this.items(');
    expect(code).not.toContain('this.ping[');
  });

  test('a child-class array field shadowing a parent field of the same name', () => {
    const code = compileFiles([
      { name: 'Base.bas', source: ['Class', 'dim items(3)', 'EndClass'].join('\n') },
      {
        name: 'Scene.bas',
        source: [
          'Class extends Base',
          'dim items(9)',
          '',
          'function readIt()',
          '  return self.items(0)',
          'endfunction',
          'EndClass',
        ].join('\n'),
      },
    ]);
    expect(code).toContain('return this.items[0]');
    expect(code).not.toContain('this.items(');
  });
});

// ─── Language limit, pinned so the fix is not blamed for it ───────────────────

describe('multi-level inheritance is rejected by the language, not by this fix', () => {
  test('chained inheritance is a compile error regardless of array access', () => {
    const result = transpile([
      { name: 'Root.bas', source: ['Class', 'dim items(3)', 'EndClass'].join('\n') },
      { name: 'Mid.bas', source: ['Class extends Root', 'EndClass'].join('\n') },
      { name: 'Scene.bas', source: ['Class extends Mid', 'EndClass'].join('\n') },
    ]);
    expect(result.diagnostics[0].message).toContain('inheritance cannot be chained');
  });
});

// ─── Shadowing ───────────────────────────────────────────────────────────────

describe('shadowing — self. always means the class field', () => {
  test('a local array of the same name does not steal the self. lookup', () => {
    // `self.coins` must resolve against the CLASS scope even when a local named
    // `coins` is in scope. Both must be emitted, each against its own storage.
    const code = compileClass([
      'Class',
      'dim coins(4)',
      '',
      'function readIt()',
      '  dim coins(2)',
      '  print coins(0)',
      '  print self.coins(0)',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.coins[0]');
    expect(code).not.toContain('this.coins(');
  });
});

// ─── Regression guards: these were ALREADY correct and must stay correct ──────
//
// The fix narrows which `self.x(...)` forms become method calls. These pin the
// forms that must NOT change.

describe('method calls via self must remain calls (regression guard)', () => {
  test('no-argument method call in expression context', () => {
    const code = compileClass([
      'Class',
      'dim hp',
      '',
      'function getHp()',
      '  return self.hp',
      'endfunction',
      '',
      'function show()',
      '  dim v',
      '  v = self.getHp()',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('show_v = this.gethp()');
    expect(code).not.toContain('this.gethp[');
  });

  test('method call with arguments in expression context', () => {
    const code = compileClass([
      'Class',
      '',
      'function add(a, b)',
      '  return a + b',
      'endfunction',
      '',
      'function show()',
      '  dim v',
      '  v = self.add(1, 2)',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('show_v = this.add(1,2)');
    expect(code).not.toContain('this.add[');
  });

  test('method call as a statement still emits a call', () => {
    const code = compileClass([
      'Class',
      '',
      'function doIt()',
      '  print "x"',
      'endfunction',
      '',
      'function go()',
      '  self.doIt()',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.doit()');
    expect(code).not.toContain('this.doit[');
  });

  test('chained method call through a sub-object is unaffected', () => {
    const code = compileClass([
      'Class',
      'dim other',
      '',
      'function go()',
      '  dim v',
      '  v = self.other.getValue()',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.other.getvalue()');
  });
});

describe('non-indexed and non-self array access must stay correct (regression guard)', () => {
  test('bare self.arrayField passed whole to a module function', () => {
    // No parens follow the field, so this never went near the ambiguous path —
    // but it is the form the fix must not accidentally start indexing.
    const code = compileClass([
      'Class',
      'dim coins(0)',
      '',
      'function spawn()',
      '  dim n',
      '  n = 5',
      '  array.push(self.coins, n)',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('array.push(this.coins,spawn_n)');
    expect(code).not.toContain('this.coins[');
  });

  test('bare self.arrayField as an array.arrLength argument', () => {
    const code = compileClass([
      'Class',
      'dim coins(0)',
      '',
      'function count()',
      '  return array.arrLength(self.coins)',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('array.arrlength(this.coins)');
  });

  test('indexed WRITE via self was already correct and stays correct', () => {
    // SelfRule disambiguates writes syntactically via the trailing `=`, so this
    // path never had the bug. Pinned so the fix cannot disturb it.
    const code = compileClass([
      'Class',
      'dim coins(0)',
      '',
      'function writeIt()',
      '  dim i',
      '  i = 0',
      '  self.coins(i) = 99',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.coins[writeit_i]=99');
  });

  test('multi-dimensional indexed write via self stays correct', () => {
    const code = compileClass([
      'Class',
      'dim grid(4,4)',
      '',
      'function writeIt()',
      '  self.grid(1,2) = 7',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.grid[1][2]=7');
  });

  test('round trip: write then read the same element', () => {
    const code = compileClass([
      'Class',
      'dim coins(4)',
      '',
      'function go()',
      '  self.coins(2) = 41',
      '  print self.coins(2) + 1',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.coins[2]=41');
    expect(code).toContain('this.coins[2]+1');
    expect(code).not.toContain('this.coins(');
  });

  test('module-level array indexing is unaffected', () => {
    const result = transpile([
      {
        name: 'Main.bas',
        source: ['dim arr(3)', 'arr(0) = 5', 'print arr(0)'].join('\n'),
      },
    ]);
    expect(result.diagnostics).toHaveLength(0);
    const code = result.code as string;
    expect(code).toContain('main.arr[0]');
  });

  test('function-scope local array indexing is unaffected', () => {
    const result = transpile([
      {
        name: 'Main.bas',
        source: [
          'function go()',
          '  dim local(3)',
          '  local(0) = 5',
          '  print local(0)',
          'endfunction',
        ].join('\n'),
      },
    ]);
    expect(result.diagnostics).toHaveLength(0);
    const code = result.code as string;
    expect(code).toContain('go_local[0]');
  });

  test('a local array inside a class method is unaffected', () => {
    const code = compileClass([
      'Class',
      '',
      'function go()',
      '  dim local(3)',
      '  local(0) = 5',
      '  print local(0)',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('go_local[0]');
  });

  test('plain scalar self property read is unaffected', () => {
    const code = compileClass([
      'Class',
      'dim hp',
      '',
      'function go()',
      '  dim v',
      '  v = self.hp + 1',
      'endfunction',
      'EndClass',
    ]);
    expect(code).toContain('this.hp+1');
  });
});
