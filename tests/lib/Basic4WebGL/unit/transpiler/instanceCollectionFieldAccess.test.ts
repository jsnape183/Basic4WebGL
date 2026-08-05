import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// ---------------------------------------------------------------------------
// Roadmap deferred issue #14(b): array/dict fields accessed from OUTSIDE the
// owning class — `someInstance.items(0)` / `someInstance.scores["a"]`, both
// read and write — was unimplemented: read failed with "Function items ...
// has not been declared yet" (the parser assumed `name(args)` on an external
// object must be a method call), write failed with a parse error on `=`.
//
// Resolution mirrors self-field access (issue #13, #14a): `Symbols.clone()`
// (DimRule) already flattens every class member — including array/dict
// fields — into a scope keyed by the instance variable's own bare name, so
// the same `getInScope(member, kind, instanceName)` lookup that already
// resolves external method calls can resolve field kind too.
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

const enemyClass = [
  'Class',
  'dim hitpoints(0)',
  'dim flags[]',
  '',
  'function attack()',
  '  print "attack"',
  'endfunction',
  'EndClass',
].join('\n');

const compileMain = (lines: string[]) => {
  const result = transpile([
    { name: 'Enemy.bas', source: enemyClass },
    { name: 'Main.bas', source: lines.join('\n') },
  ]);
  expect(result.diagnostics).toHaveLength(0);
  const code = result.code as string;
  return code.slice(code.indexOf('const main = {}'));
};

describe('external instance array field — indexed read (expression context)', () => {
  test('read into a local', () => {
    const code = compileMain([
      'dim enemy as Enemy()',
      'dim v',
      'v = enemy.hitpoints(0)',
    ]);
    expect(code).toContain('main.v = main.enemy.hitpoints[0]');
  });

  test('a same-named method on a different instance still calls', () => {
    const code = compileMain(['dim enemy as Enemy()', 'enemy.attack()']);
    expect(code).toContain('main.enemy.attack()');
  });

  test('reading a genuinely undeclared member still throws the natural error', () => {
    const result = transpile([
      { name: 'Enemy.bas', source: enemyClass },
      {
        name: 'Main.bas',
        source: ['dim enemy as Enemy()', 'dim v', 'v = enemy.nope(0)'].join('\n'),
      },
    ]);
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});

describe('external instance dictionary field — indexed read (expression context)', () => {
  test('read into a local', () => {
    const code = compileMain([
      'dim enemy as Enemy()',
      'dim v',
      'v = enemy.flags["stunned"]',
    ]);
    expect(code).toContain('main.v = _sbDictGet(main.enemy.flags,"stunned")');
  });
});

describe('external instance array field — indexed write (statement context)', () => {
  test('write an index', () => {
    const code = compileMain(['dim enemy as Enemy()', 'enemy.hitpoints(0) = 50']);
    expect(code).toContain('main.enemy.hitpoints[0]=50;');
  });

  test('a plain method call statement is unaffected', () => {
    const code = compileMain(['dim enemy as Enemy()', 'enemy.attack()']);
    expect(code).toContain('main.enemy.attack()');
  });
});

describe('external instance dictionary field — indexed write (statement context)', () => {
  test('write a string key', () => {
    const code = compileMain([
      'dim enemy as Enemy()',
      'enemy.flags["stunned"] = true',
    ]);
    expect(code).toContain('main.enemy.flags.set("stunned",true);');
  });
});
