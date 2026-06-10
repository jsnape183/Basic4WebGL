import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace, compileOk } from '../../helpers';

function compileErr(src: string, name = 'Test'): string {
  const result = compiler.transpile({ lib: [], files: [{ name, source: src }] });
  return result.diagnostics.map((d) => d.message).join('; ');
}

// ── class X extends Y — output ──────────────────────────────────────────────

describe('class extends — transpiler output', () => {
  test.todo('class with extends emits class Boss extends Enemy — requires Tasks 4 and 6');

  test('class without extends still emits class X {}', () => {
    const src = ['Class Enemy', 'dim health'].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Enemy', source: src }] });
    expect(result).toContain('classenemy{');
    expect(result).not.toContain('extends');
  });
});

// ── compile errors — extends ─────────────────────────────────────────────────

describe('class extends — compile errors', () => {
  test('extending an unknown class throws compile error', () => {
    const src = 'Class Boss extends Unknown';
    const err = compileErr(src, 'Boss');
    expect(err).toMatch(/unknown.*has not been declared/i);
  });

  test('chained inheritance throws compile error', () => {
    const enemySrc = 'Class Enemy';
    const bossSrc = 'Class Boss extends Enemy';
    const minibossSrc = 'Class MiniBoss extends Boss';
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
      'Class Player',
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
      'Class Player',
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
      'Class Player',
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
});

// ── self. enforcement ────────────────────────────────────────────────────────

describe('self. enforcement — bare class property access is a compile error', () => {
  test('bare access to a class Variable property in a method throws compile error', () => {
    const src = [
      'Class Player',
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
      'Class Player',
      'dim health',
      'Constructor(h)',
      '  health = h',
      'EndConstructor',
    ].join('\n');
    const err = compileErr(src, 'Player');
    expect(err).toMatch(/'health' is a class property — use self\.health/i);
  });
});
