import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// ---------------------------------------------------------------------------
// Bug: `self.someField.someOtherField`, where `someField`'s type is a
// user-defined class, resolved to a generic Object type instead of the
// inner field's own (inferred) type — because the parser loop that walks a
// self-rooted dotted chain (SelfFactorRule) built up the `chain` string for
// every segment but never updated which segment name it used to look up the
// final dataType, so it always resolved the *first* segment's name against
// the *outer* class's scope. For a two-level chain that first segment is an
// Object-kind symbol (`dim boss as Boss`), which a Variable-kind lookup
// never finds, so the field type resolution silently failed and fell back
// to `new ObjectType(chain)`.
//
// `self.someField.method()` (PropertyMethodTermNode) was never affected —
// it's always typed Variant regardless of return type. This is specific to
// a *field* read through a class-typed field.
// ---------------------------------------------------------------------------

const bossClass = [
  'Class',
  'dim dead',
  'dim health',
  'dim name_',
  'Constructor()',
  '  self.dead = false',
  '  self.health = 100',
  '  self.name_ = "boss"',
  'EndConstructor',
  'function hit()',
  '  self.dead = true',
  'endfunction',
  'EndClass',
].join('\n');

const arenaClassWithField = (line: string) =>
  [
    'Class',
    'dim boss as Boss',
    'Constructor()',
    '  self.boss = new Boss()',
    'EndConstructor',
    'function check()',
    `  ${line}`,
    'endfunction',
    'EndClass',
  ].join('\n');

const transpile = (arenaSource: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'Boss.bas', source: bossClass },
      { name: 'Arena.bas', source: arenaSource },
    ],
  });

describe('self.field.field type inference through a class-typed field', () => {
  test('bare `if self.boss.dead then` compiles without a type error', () => {
    const result = transpile(
      arenaClassWithField('if self.boss.dead then\n    print "dead"\n  endif')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('`self.boss.dead and true` (strict And) compiles without a type error', () => {
    const result = transpile(
      arenaClassWithField(
        'if self.boss.dead and true then\n    print "dead"\n  endif'
      )
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('`not self.boss.dead` still compiles (pre-existing behaviour, unaffected by the fix)', () => {
    const result = transpile(
      arenaClassWithField('if not self.boss.dead then\n    print "alive"\n  endif')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('a Number field reached through a class-typed field type-checks in a strict numeric comparison', () => {
    const result = transpile(
      arenaClassWithField('if self.boss.health > 0 then\n    print "alive"\n  endif')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('a String field reached through a class-typed field type-checks against a string literal', () => {
    const result = transpile(
      arenaClassWithField(
        'if self.boss.name_ = "boss" then\n    print "match"\n  endif'
      )
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('a genuine type mismatch through a class-typed field is still caught (sanity check against over-widening)', () => {
    // Assigning an Object-typed field where a Number is required should still error —
    // confirms the fix resolves the *real* field type rather than just always
    // returning something permissive like Variant.
    const badArena = [
      'Class',
      'dim boss as Boss',
      'Constructor()',
      '  self.boss = new Boss()',
      'EndConstructor',
      'function check()',
      '  if self.boss > 0 then',
      '    print "nonsense"',
      '  endif',
      'endfunction',
      'EndClass',
    ].join('\n');
    const result = transpile(badArena);
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});
