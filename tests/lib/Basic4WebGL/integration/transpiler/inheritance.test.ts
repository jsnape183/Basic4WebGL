import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace, compileOk, loadSampleFile } from '../../helpers';

function compileErr(src: string, name = 'Test'): string {
  const result = compiler.transpile({ lib: [], files: [{ name, source: src }] });
  return result.diagnostics.map((d) => d.message).join('; ');
}

// ── sample files ─────────────────────────────────────────────────────────────

const folder = 'inheritance';
const enemyFile = { name: 'Enemy', source: loadSampleFile('Enemy', folder) };
const bossFile = { name: 'Boss', source: loadSampleFile('Boss', folder) };
const mainFile = { name: 'Main', source: loadSampleFile('Main', folder) };

// ── class X extends Y — output ──────────────────────────────────────────────

describe('class extends — transpiler output', () => {
  test('class with extends emits class Boss extends Enemy {}', () => {
    const result = compileOk({ lib: [], files: [enemyFile, bossFile, mainFile] });
    expect(result).toContain('class_sb_bossextends_sb_enemy');
  });

  test('class without extends still emits class X {}', () => {
    const src = ['Class', 'dim health'].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Enemy', source: src }] });
    expect(result).toContain('class_sb_enemy{');
    expect(result).not.toContain('extends');
  });
});

// ── compile errors — extends ─────────────────────────────────────────────────

describe('class extends — compile errors', () => {
  test('extending an unknown class throws compile error', () => {
    const src = 'Class extends Unknown';
    const err = compileErr(src, 'Boss');
    expect(err).toMatch(/unknown.*has not been declared/i);
  });

  test('chained inheritance throws compile error', () => {
    const enemySrc = 'Class';
    const bossSrc = 'Class extends Enemy';
    const minibossSrc = 'Class extends Boss';
    const result = compiler.transpile({
      lib: [],
      files: [
        { name: 'Enemy', source: enemySrc },
        { name: 'Boss', source: bossSrc },
        { name: 'MiniBoss', source: minibossSrc },
      ],
    });
    expect(result.diagnostics[0].message).toMatch(/already extends.*cannot be chained/i);
  });
});

// ── self. keyword ────────────────────────────────────────────────────────────

describe('self. keyword — transpiler output', () => {
  test('self.property = expr emits this.property = rhs', () => {
    const src = [
      'Class',
      'dim health',
      'Constructor(h)',
      '  self.health = h',
      'EndConstructor',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Player', source: src }] });
    expect(result).toContain('this.health=constructor_h');
  });

  test('self.property in expression emits this.property', () => {
    const src = [
      'Class',
      'dim health',
      'function getHealth()',
      '  return self.health',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Player', source: src }] });
    expect(result).toContain('returnthis.health');
  });

  test('self.method(args) in statement emits this.method(args)', () => {
    const src = [
      'Class',
      'dim health',
      'Constructor(h)',
      '  self.health = h',
      'EndConstructor',
      'function reset()',
      '  self.init(100)',
      'endfunction',
      'function init(h)',
      '  self.health = h',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Player', source: src }] });
    expect(result).toContain('this.init(');
  });

  test('self.sub.method(args) in statement emits this.sub.method(args) — 2-level chain', () => {
    const src = [
      'Class',
      'Constructor(x, y)',
      '  self.transform.setPosition(x, y)',
      'EndConstructor',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Sprite', source: src }] });
    expect(result).toContain('this.transform.setposition(');
  });

  test('self.sub.method(args) in expression emits this.sub.method(args) — 2-level chain', () => {
    const src = [
      'Class',
      'function getX()',
      '  return self.transform.x()',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Sprite', source: src }] });
    expect(result).toContain('this.transform.x(');
  });

  test('self.a.b = expr in statement emits this.a.b = rhs — 2-level chain assignment', () => {
    const src = [
      'Class',
      'Constructor()',
      '  self.config.speed = 100',
      'EndConstructor',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Ship', source: src }] });
    expect(result).toContain('this.config.speed=');
  });

  test('self.a.b in expression emits this.a.b — 2-level chain property read', () => {
    const src = [
      'Class',
      'function getSpeed()',
      '  return self.config.speed',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Ship', source: src }] });
    expect(result).toContain('this.config.speed');
  });

  test('self.a.b.method(args) in statement — 3-level chain', () => {
    const src = [
      'Class',
      'Constructor()',
      '  self.body.transform.setPosition(0, 0)',
      'EndConstructor',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Enemy', source: src }] });
    expect(result).toContain('this.body.transform.setposition(');
  });

  test('self.a.b.c.method(args) in statement — 4-level chain', () => {
    const src = [
      'Class',
      'Constructor()',
      '  self.a.b.c.doThing(1)',
      'EndConstructor',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Deep', source: src }] });
    expect(result).toContain('this.a.b.c.dothing(');
  });
});

// ── self. enforcement ────────────────────────────────────────────────────────

describe('self. enforcement — bare class property access is a compile error', () => {
  test('bare access to a class Variable property in a method throws compile error', () => {
    const src = [
      'Class',
      'dim health',
      'function takeDamage(amount)',
      '  health = health - amount',
      'endfunction',
    ].join('\n');
    const err = compileErr(src, 'Player');
    expect(err).toMatch(/'health' is a class property — use self\.health/i);
  });

  test('bare access to a class Variable property in a constructor throws compile error', () => {
    const src = [
      'Class',
      'dim health',
      'Constructor(h)',
      '  health = h',
      'EndConstructor',
    ].join('\n');
    const err = compileErr(src, 'Player');
    expect(err).toMatch(/'health' is a class property — use self\.health/i);
  });
});

// ── super ────────────────────────────────────────────────────────────────────

describe('super() in constructor', () => {
  test('explicit super(args) emits super(args) at start of constructor', () => {
    const result = compileOk({ lib: [], files: [enemyFile, bossFile, mainFile] });
    expect(result).toContain('constructor(constructor_startHealth){super(constructor_startHealth)');
  });

  test('child with no super() call auto-emits super() at top of constructor', () => {
    const childSrc = [
      'Class extends Enemy',
      'Constructor(h)',
      '  self.phase = 1',
      'EndConstructor',
    ].join('\n');
    const childMainSrc = [
      'function onenter()',
      '  dim c as Child(100)',
      'endfunction',
    ].join('\n');
    const result = compileOk({
      lib: [],
      files: [
        enemyFile,
        { name: 'Child', source: childSrc },
        { name: 'ChildMain', source: childMainSrc },
      ],
    });
    expect(result).toContain('constructor(constructor_h){super()');
  });
});

describe('super.method() — transpiler output', () => {
  test('super.takeDamage(amount) emits Enemy.prototype.takeDamage.call(this, amount)', () => {
    const result = compileOk({ lib: [], files: [enemyFile, bossFile, mainFile] });
    expect(result).toContain('_sb_enemy.prototype.takedamage.call(this');
  });
});

describe('super — compile errors', () => {
  test('super() in a method (not constructor) throws compile error', () => {
    const childSrc = [
      'Class extends Enemy',
      'function reset()',
      '  super(100)',
      'endfunction',
    ].join('\n');
    const err = compiler.transpile({
      lib: [],
      files: [enemyFile, { name: 'Child', source: childSrc }, mainFile],
    }).diagnostics[0]?.message ?? '';
    expect(err).toMatch(/super\(\) can only be called in a constructor/i);
  });

  test('super.missingMethod() throws compile error', () => {
    const childSrc = [
      'Class extends Enemy',
      'function reset()',
      '  super.nonexistent()',
      'endfunction',
    ].join('\n');
    const err = compiler.transpile({
      lib: [],
      files: [enemyFile, { name: 'Child', source: childSrc }, mainFile],
    }).diagnostics[0]?.message ?? '';
    expect(err).toMatch(/nonexistent.*not defined on parent/i);
  });

  test('super in class with no parent throws compile error', () => {
    const src = [
      'Class',
      'function reset()',
      '  super.someMethod()',
      'endfunction',
    ].join('\n');
    const err = compileErr(src, 'Lone');
    expect(err).toMatch(/which has no parent/i);
  });

  test('calling super() twice in constructor throws compile error', () => {
    const childSrc = [
      'Class extends Enemy',
      'Constructor(h)',
      '  super(h)',
      '  super(h)',
      'EndConstructor',
    ].join('\n');
    const childMainSrc = [
      'function onenter()',
      '  dim c as Child(100)',
      'endfunction',
    ].join('\n');
    const err = compiler.transpile({
      lib: [],
      files: [
        enemyFile,
        { name: 'Child', source: childSrc },
        { name: 'ChildMain', source: childMainSrc },
      ],
    }).diagnostics[0]?.message ?? '';
    expect(err).toMatch(/super\(\) called more than once/i);
  });
});

// ── remaining error cases ────────────────────────────────────────────────────

describe('self — additional error cases', () => {
  test('self used in a module (no class declaration) throws compile error', () => {
    const src = [
      'function doThing()',
      '  self.x = 5',
      'endfunction',
    ].join('\n');
    const err = compileErr(src, 'Main');
    expect(err).toMatch(/'self' can only be used inside a class/i);
  });

  test('self.property in expression in a module throws compile error', () => {
    const src = [
      'function doThing()',
      '  dim n',
      '  n = self.health',
      'endfunction',
    ].join('\n');
    const err = compileErr(src, 'Main');
    expect(err).toMatch(/'self' can only be used inside a class/i);
  });
});
