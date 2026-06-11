import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// Minimal class fixtures — file name = class name
const enemyFile = {
  name: 'Enemy',
  source: [
    'Class',
    '  function update()',
    '  endfunction',
    '  function getHealth()',
    '    return 100',
    '  endfunction',
    'endclass',
  ].join('\n'),
};

const spriteFile = {
  name: 'Sprite',
  source: [
    'Class',
    '  function setPosition(x, y)',
    '  endfunction',
    'endclass',
  ].join('\n'),
};

// Class with a 1-arg constructor
const pointFile = {
  name: 'Point',
  source: [
    'Class',
    'dim x',
    'Constructor(startX)',
    '  self.x = startX',
    'EndConstructor',
    'endclass',
  ].join('\n'),
};

const transpile = (source: string) =>
  compiler.transpile({ lib: [], files: [{ name: 'Main', source }] });

const transpileWith = (
  files: { name: string; source: string }[],
  mainSource: string
) =>
  compiler.transpile({
    lib: [],
    files: [...files, { name: 'Main', source: mainSource }],
  });

const errMessages = (result: ReturnType<typeof transpile>) =>
  result.diagnostics.map((d) => d.message).join('; ');

// ─── new keyword — expression ──────────────────────────────────────────────

describe('new keyword — expression', () => {
  test('new Enemy() emits new enemy() in assignment', () => {
    const result = transpileWith(
      [enemyFile],
      ['dim e as Enemy', 'e = new Enemy()'].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('new enemy()');
  });

  test('new Enemy("goblin") emits new enemy("goblin")', () => {
    const result = transpileWith(
      [enemyFile],
      ['dim e as Enemy', 'e = new Enemy("goblin")'].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('new enemy("goblin")');
  });
});

// ─── dim a as ClassName — null init / explicit construction ───────────────

describe('dim a as ClassName — null init and explicit construction', () => {
  test('dim e as Enemy (no args) emits = null', () => {
    const result = transpileWith([enemyFile], 'dim e as Enemy');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.e = null');
    expect(result.code).not.toContain('new enemy()');
  });

  test('dim e as Enemy = new Enemy() emits new enemy()', () => {
    const result = transpileWith([enemyFile], 'dim e as Enemy = new Enemy()');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('new enemy()');
  });

  test('dim e as Enemy = new Sprite() is a type error', () => {
    const result = transpileWith(
      [enemyFile, spriteFile],
      'dim e as Enemy = new Sprite()'
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/type mismatch/i);
  });

  test('dim e as Enemy("img") (with args) still emits new Enemy("img")', () => {
    const result = transpileWith([enemyFile], 'dim e as Enemy("img")');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('new enemy("img")');
  });
});

// ─── dim a = new ClassName(args) — type inference ─────────────────────────

describe('dim a = new ClassName(args) — type inference', () => {
  test('dim e = new Enemy() emits main.e = new enemy()', () => {
    const result = transpileWith([enemyFile], 'dim e = new Enemy()');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.e = new enemy()');
  });

  test('dim e = new Enemy() — subsequent method call compiles', () => {
    const result = transpileWith(
      [enemyFile],
      ['dim e = new Enemy()', 'e.update()'].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('dim e = new Enemy() then e = new Sprite() is a type error', () => {
    const result = transpileWith(
      [enemyFile, spriteFile],
      ['dim e = new Enemy()', 'e = new Sprite()'].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/type mismatch/i);
  });

  test('dim n = 5 remains a plain variant (no type inference for primitives)', () => {
    const result = transpile('dim n = 5');
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── typed variable assignment type checking ───────────────────────────────

describe('typed variable assignment — type checking', () => {
  test('assigning wrong type to typed var is a compile error', () => {
    const result = transpileWith(
      [enemyFile, spriteFile],
      ['dim e as Enemy', 'e = new Sprite()'].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/type mismatch/i);
  });

  test('assigning new to a variant variable is a compile error', () => {
    const result = transpileWith(
      [enemyFile],
      ['dim x', 'x = new Enemy()'].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/variant/i);
  });
});

// ─── typed arrays — declaration ────────────────────────────────────────────

describe('typed array — declaration', () => {
  test('dim enemies(10) as Enemy emits _createTypedArray([10], () => null)', () => {
    const result = transpileWith([enemyFile], 'dim enemies(10) as Enemy');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_createTypedArray([10], () => null)');
    expect(result.code).not.toContain('new Enemy()');
  });

  test('dim enemies(10) as Enemy("img") is a compile error (removed form)', () => {
    const result = transpileWith(
      [enemyFile],
      'dim enemies(10) as Enemy("img")'
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/constructor/i);
  });
});

// ─── typed array — element assignment ──────────────────────────────────────

describe('typed array — element assignment', () => {
  test('enemies(0) = new Enemy() emits array[0]=new enemy()', () => {
    const result = transpileWith(
      [enemyFile],
      ['dim enemies(10) as Enemy', 'enemies(0) = new Enemy()'].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.enemies[0]=new enemy()');
  });

  test('enemies(0) = new Sprite() is a type error (wrong class)', () => {
    const result = transpileWith(
      [enemyFile, spriteFile],
      ['dim enemies(10) as Enemy', 'enemies(0) = new Sprite()'].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/type mismatch/i);
  });
});

// ─── typed array — member access ───────────────────────────────────────────

describe('typed array — member access', () => {
  test('enemies(0).update() emits _sbRequireInit(...).update()', () => {
    const result = transpileWith(
      [enemyFile],
      ['dim enemies(10) as Enemy', 'enemies(0).update()'].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain(
      '_sbRequireInit(main.enemies[0],"enemies(0)").update()'
    );
  });

  test('enemies(i).update() uses variable index in null-check wrapper', () => {
    const result = transpileWith(
      [enemyFile],
      [
        'dim enemies(10) as Enemy',
        'dim i',
        'i = 3',
        'enemies(i).update()',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbRequireInit(main.enemies[main.i]');
  });
});

// ─── typed dict — declaration ───────────────────────────────────────────────

describe('typed dict — declaration', () => {
  test('dim players[] as Sprite emits _createDict()', () => {
    const result = transpileWith([spriteFile], 'dim players[] as Sprite');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.players = _createDict()');
    expect(result.code).not.toContain('new Sprite()');
  });
});

// ─── typed dict — element assignment ───────────────────────────────────────

describe('typed dict — element assignment', () => {
  test('players["Alice"] = new Sprite() emits .set("Alice",new sprite())', () => {
    const result = transpileWith(
      [spriteFile],
      [
        'dim players[] as Sprite',
        'players["Alice"] = new Sprite()',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('main.players.set("Alice",new sprite())');
  });

  test('players["Alice"] = new Enemy() is a type error (wrong class)', () => {
    const result = transpileWith(
      [enemyFile, spriteFile],
      [
        'dim players[] as Sprite',
        'players["Alice"] = new Enemy()',
      ].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/type mismatch/i);
  });
});

// ─── typed dict — member access ─────────────────────────────────────────────

describe('typed dict — member access', () => {
  test('players["Alice"].setPosition(0,0) emits _sbRequireInit(_sbDictGet(...)).setPosition(0,0)', () => {
    const result = transpileWith(
      [spriteFile],
      [
        'dim players[] as Sprite',
        'players["Alice"].setPosition(0, 0)',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain(
      '_sbRequireInit(_sbDictGet(main.players,"Alice"),"players[Alice]").setPosition(0,0)'
    );
  });
});

// ─── typed parameters ──────────────────────────────────────────────────────

describe('typed function parameters', () => {
  test('typed scalar param — member access compiles', () => {
    const result = transpileWith(
      [enemyFile],
      [
        'function spawn(e as Enemy)',
        '  e.update()',
        'endfunction',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('untyped array param f(arr()) — arr treated as array inside function', () => {
    const result = transpile(
      [
        'function sum(arr())',
        '  dim x',
        '  x = arr(0)',
        'endfunction',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('typed array param f(arr() as Enemy) — element member access compiles', () => {
    const result = transpileWith(
      [enemyFile],
      [
        'function processAll(arr() as Enemy)',
        '  arr(0).update()',
        'endfunction',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('untyped dict param f(d[]) — d treated as dict inside function', () => {
    const result = transpile(
      [
        'dim scores[]',
        'function read(d[])',
        '  dim x',
        '  x = d["key"]',
        'endfunction',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('typed dict param f(d[] as Sprite) — value member access compiles', () => {
    const result = transpileWith(
      [spriteFile],
      [
        'function process(d[] as Sprite)',
        '  d["Alice"].setPosition(0, 0)',
        'endfunction',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── call-site type checking ───────────────────────────────────────────────

describe('call-site type checking', () => {
  test('passing new Enemy() to typed Sprite param is a compile error', () => {
    const result = transpileWith(
      [enemyFile, spriteFile],
      [
        'function spawn(s as Sprite)',
        '  s.setPosition(0, 0)',
        'endfunction',
        'spawn(new Enemy())',
      ].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/type mismatch/i);
  });

  test('passing new Sprite() to typed Sprite param is OK', () => {
    const result = transpileWith(
      [spriteFile],
      [
        'function spawn(s as Sprite)',
        '  s.setPosition(0, 0)',
        'endfunction',
        'spawn(new Sprite())',
      ].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('passing typed var of wrong class to typed param is compile error', () => {
    const result = transpileWith(
      [enemyFile, spriteFile],
      [
        'function spawn(s as Sprite)',
        '  s.setPosition(0, 0)',
        'endfunction',
        'dim e as Enemy("img")',
        'spawn(e)',
      ].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/type mismatch/i);
  });
});

// ─── constructor arg-count checking ────────────────────────────────────────

describe('constructor arg-count checking', () => {
  test('new Point() with no args when constructor needs 1 is a compile error', () => {
    const result = transpileWith([pointFile], 'dim p as Point = new Point()');
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/expects 1 argument/i);
  });

  test('new Point(10) with correct arg count compiles', () => {
    const result = transpileWith([pointFile], 'dim p as Point = new Point(10)');
    expect(result.diagnostics).toHaveLength(0);
  });

  test('new Point(10, 20) with too many args is a compile error', () => {
    const result = transpileWith([pointFile], 'dim p as Point = new Point(10, 20)');
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/expects 1 argument/i);
  });

  test('type-inferring dim p = new Point() with wrong arg count is a compile error', () => {
    const result = transpileWith([pointFile], 'dim p = new Point()');
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/expects 1 argument/i);
  });

  test('expression-context new Point() with wrong arg count is a compile error', () => {
    const result = transpileWith(
      [pointFile],
      ['dim p as Point', 'p = new Point()'].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/expects 1 argument/i);
  });

  test('new Enemy() with no constructor and no args compiles', () => {
    const result = transpileWith([enemyFile], 'dim e as Enemy = new Enemy()');
    expect(result.diagnostics).toHaveLength(0);
  });
});
