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

// ---------------------------------------------------------------------------
// Roadmap issue #20: chaining a method call onto an element read from a
// TYPED array field, accessed through an EXTERNAL instance — the one shape
// deliberately left out of #14(c), which only fixed this for `self`
// (self.bullets(0).getX()). `someInstance.bullets(0).getX()` failed to
// parse until this fix: the external-instance branch in VariableFactorRule
// returned a plain indexed read without checking for a typed element or a
// following Dot, unlike the self path.
// ---------------------------------------------------------------------------

const bulletClass = [
  'Class',
  '  dim x',
  '  Constructor(startX)',
  '    self.x = startX',
  '  EndConstructor',
  '  function getX()',
  '    return self.x',
  '  endfunction',
  '  function explode()',
  '  endfunction',
  'endclass',
].join('\n');

const shipClass = [
  'Class',
  '  dim bullets(1) as Bullet',
  '  Constructor()',
  '    self.bullets(0) = new Bullet(42)',
  '  EndConstructor',
  'endclass',
].join('\n');

const compileMainWithShip = (lines: string[]) => {
  const result = transpile([
    { name: 'Bullet.bas', source: bulletClass },
    { name: 'Ship.bas', source: shipClass },
    { name: 'Main.bas', source: lines.join('\n') },
  ]);
  expect(result.diagnostics).toHaveLength(0);
  const code = result.code as string;
  return code.slice(code.indexOf('const main = {}'));
};

describe('external instance typed-array element — chained call (issue #20)', () => {
  test('expression context: ship.bullets(0).getX() used as a return value', () => {
    const code = compileMainWithShip([
      'dim ship as Ship()',
      'dim v',
      'v = ship.bullets(0).getX()',
    ]);
    expect(code).toContain(
      'main.v = _sbRequireInit(main.ship.bullets[0],"bullets(0)").getx()'
    );
  });

  test('statement context: ship.bullets(0).explode() as a bare statement', () => {
    const code = compileMainWithShip(['dim ship as Ship()', 'ship.bullets(0).explode()']);
    expect(code).toContain(
      '_sbRequireInit(main.ship.bullets[0],"bullets(0)").explode();'
    );
  });

  test('does not affect a plain external indexed read with no chained call', () => {
    const code = compileMainWithShip([
      'dim ship as Ship()',
      'dim v',
      'v = ship.bullets(0)',
    ]);
    expect(code).toContain('main.v = main.ship.bullets[0]');
  });
});

// ---------------------------------------------------------------------------
// Sibling write-side bug to #20's read-side chaining: `ship.bullets(0).x =
// value` (writing a FIELD on a typed array-of-objects element through an
// EXTERNAL instance) used the same ObjectPropertyRule branch that only
// handled a chained *method call* after the inner Dot. With no following
// '(' it fell through with `.x` already consumed, landed on the
// SelfArrayAssignNode branch below (which now saw a bare '=' and matched
// it), and silently emitted `main.ship.bullets[0]=value` — clobbering the
// whole element instead of setting its field.
// ---------------------------------------------------------------------------

describe('external instance typed-array element — field write', () => {
  test('ship.bullets(0).x = 99 sets the field, not the whole slot', () => {
    const code = compileMainWithShip(['dim ship as Ship()', 'ship.bullets(0).x = 99']);
    expect(code).toContain(
      '_sbRequireInit(main.ship.bullets[0],"bullets(0)").x=99;'
    );
    expect(code).not.toContain('main.ship.bullets[0]=99');
  });
});
