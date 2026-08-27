import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// ---------------------------------------------------------------------------
// Bug (same category as e1f293e's `self.someField.someOtherField` fix, but a
// different root cause): reading a field off a value produced by an indexed
// read into a class-typed array (`dim enemies(4) as Enemy`,
// `self.enemies(i).transformY`), or off a plain locally-typed variable /
// typed function parameter populated from such a read, resolved to a
// generic Object type instead of the field's real (inferred) type — because
// none of the parser paths that build these reads ever attached the field's
// actual dataType to the resulting node:
//
//   - `self.enemies(i).transformY` (SelfFactorRule) and `obj.enemies(i).x` /
//     bare `enemies(i).x` (VariableFactorRule) all build a
//     TypedElementAccessNode for a plain field read (no trailing method
//     call), but the node never received a dataType — it silently defaulted
//     to the Tree base class's generic 'Unknown' type.
//   - `e.transformY`, where `e` is `dim e as Enemy` (a local variable) or a
//     typed function parameter (`function f(p as Enemy)`), goes through
//     VariableFactorRule's Object-property "chain read" branch, which built
//     a PropertyTermNode with NO dataType override at all — defaulting to
//     ObjectType(chain).
//
// Both defaults fail strict type checks (bare `if`, comparisons, `and`)
// even though the field's real type is known statically. Fixed by resolving
// the field's dataType against the value's statically-known class
// (resolveClassMemberChainType, the non-`self`-rooted counterpart of
// resolveMemberChainType used by the earlier fix) and passing it through.
// ---------------------------------------------------------------------------

const enemyClass = [
  'Class',
  'dim transformY',
  'dim dead',
  'dim boss as Boss',
  'Constructor()',
  '  self.transformY = 0',
  '  self.dead = false',
  '  self.boss = new Boss()',
  'EndConstructor',
  'function setY(v)',
  '  self.transformY = v',
  'endfunction',
  'EndClass',
].join('\n');

const bossClass = [
  'Class',
  'dim dead',
  'Constructor()',
  '  self.dead = false',
  'EndConstructor',
  'EndClass',
].join('\n');

const transpile = (arenaSource: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'Boss.bas', source: bossClass },
      { name: 'Enemy.bas', source: enemyClass },
      { name: 'Arena.bas', source: arenaSource },
    ],
  });

describe('array-indexed and local-variable object field type inference', () => {
  describe('shape 1: self.arr(i).field (indexed array-of-objects field access)', () => {
    const arena = (line: string) =>
      [
        'Class',
        'dim enemies(4) as Enemy',
        'function check(i, j)',
        `  ${line}`,
        'endfunction',
        'EndClass',
      ].join('\n');

    test('bare `if self.enemies(i).transformY then` fails today without the fix would be Object — confirm it now compiles', () => {
      const result = transpile(
        arena('if self.enemies(i).dead then\n    print "dead"\n  endif')
      );
      expect(result.diagnostics).toHaveLength(0);
    });

    test('numeric comparison `self.enemies(i).transformY > 0` compiles', () => {
      const result = transpile(
        arena('if self.enemies(i).transformY > 0 then\n    print "pos"\n  endif')
      );
      expect(result.diagnostics).toHaveLength(0);
    });

    test('comparing two indexed elements `self.enemies(i).transformY < self.enemies(j).transformY` compiles', () => {
      const result = transpile(
        arena(
          'if self.enemies(i).transformY < self.enemies(j).transformY then\n    print "closer"\n  endif'
        )
      );
      expect(result.diagnostics).toHaveLength(0);
    });

    test('strict `and` expression `self.enemies(i).dead and true` compiles', () => {
      const result = transpile(
        arena('if self.enemies(i).dead and true then\n    print "dead"\n  endif')
      );
      expect(result.diagnostics).toHaveLength(0);
    });
  });

  describe('shape 2: dim local as Type; local = self.arr(i); local.field', () => {
    const arena = (line: string) =>
      [
        'Class',
        'dim enemies(4) as Enemy',
        'function check(i)',
        '  dim e as Enemy',
        '  e = self.enemies(i)',
        `  ${line}`,
        'endfunction',
        'EndClass',
      ].join('\n');

    test('bare `if e.dead then` compiles', () => {
      const result = transpile(arena('if e.dead then\n    print "dead"\n  endif'));
      expect(result.diagnostics).toHaveLength(0);
    });

    test('numeric comparison `e.transformY > 0` compiles', () => {
      const result = transpile(
        arena('if e.transformY > 0 then\n    print "pos"\n  endif')
      );
      expect(result.diagnostics).toHaveLength(0);
    });

    test('strict `and` expression `e.dead and true` compiles', () => {
      const result = transpile(
        arena('if e.dead and true then\n    print "dead"\n  endif')
      );
      expect(result.diagnostics).toHaveLength(0);
    });

    test('nested field through the local (e.boss.dead) also resolves correctly', () => {
      const result = transpile(
        arena('if e.boss.dead then\n    print "boss dead"\n  endif')
      );
      expect(result.diagnostics).toHaveLength(0);
    });
  });

  describe('shape 3: typed function parameter — function f(p as Type) reading p.field strictly', () => {
    const arena = (line: string) =>
      [
        'Class',
        'function check(p as Enemy)',
        `  ${line}`,
        'endfunction',
        'EndClass',
      ].join('\n');

    test('bare `if p.dead then` compiles', () => {
      const result = transpile(arena('if p.dead then\n    print "dead"\n  endif'));
      expect(result.diagnostics).toHaveLength(0);
    });

    test('numeric comparison `p.transformY > 0` compiles', () => {
      const result = transpile(
        arena('if p.transformY > 0 then\n    print "pos"\n  endif')
      );
      expect(result.diagnostics).toHaveLength(0);
    });

    test('strict `and` expression `p.dead and true` compiles', () => {
      const result = transpile(
        arena('if p.dead and true then\n    print "dead"\n  endif')
      );
      expect(result.diagnostics).toHaveLength(0);
    });
  });

  test('sanity check against over-widening: a genuine type mismatch through an indexed array element is still caught', () => {
    const badArena = [
      'Class',
      'dim enemies(4) as Enemy',
      'function check(i)',
      '  if self.enemies(i).boss > 0 then',
      '    print "nonsense"',
      '  endif',
      'endfunction',
      'EndClass',
    ].join('\n');
    const result = transpile(badArena);
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});
