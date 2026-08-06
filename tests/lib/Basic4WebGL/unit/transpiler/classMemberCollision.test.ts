import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// ---------------------------------------------------------------------------
// Roadmap issue #15: a class could declare an array field and a method of
// the same name with no diagnostic at either declaration site, and it
// crashed at runtime ("X is not a function") regardless of which one the
// compiler resolved self.X(...) to — the class body's inline method
// assignment always runs first, the field's deferred initializer always
// runs second (RootRule's two-phase init split), so the field silently
// clobbers the method's prototype slot no matter what order they're
// declared in the source.
//
// Fixed by an injected cross-kind collision check consulted by
// Symbols.add()/addTyped(), which walks the class's own scope and its
// parentClassName chain looking for an existing symbol of the same name but
// a different kind.
// ---------------------------------------------------------------------------

const errMessages = (result: ReturnType<typeof compiler.transpile>) =>
  result.diagnostics.map((d) => d.message).join('; ');

const compile = (source: string) => compiler.transpile({ lib: [], files: [{ name: 'Main.bas', source }] });

const compileMulti = (files: { name: string; source: string }[]) =>
  compiler.transpile({ lib: [], files });

describe('class member cross-kind collision — same class', () => {
  test('array field declared before a same-named method is rejected', () => {
    const result = compile(
      ['Class', 'dim items(3)', '', 'function items()', '  print "hi"', 'endfunction', 'EndClass'].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/items/i);
  });

  test('method declared before a same-named array field is rejected', () => {
    const result = compile(
      ['Class', 'function items()', '  print "hi"', 'endfunction', '', 'dim items(3)', 'EndClass'].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/items/i);
  });

  test('dictionary field colliding with a same-named method is also rejected', () => {
    const result = compile(
      ['Class', 'dim scores[]', '', 'function scores()', '  print "hi"', 'endfunction', 'EndClass'].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/scores/i);
  });

  test('a plain dim field colliding with a same-named method is also rejected', () => {
    const result = compile(
      ['Class', 'dim health', '', 'function health()', '  print "hi"', 'endfunction', 'EndClass'].join('\n')
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/health/i);
  });
});

describe('class member cross-kind collision — across inheritance', () => {
  test('a child class field colliding with a parent class method is rejected', () => {
    const result = compileMulti([
      {
        name: 'Base.bas',
        source: ['Class', 'function items()', '  print "hi"', 'endfunction', 'EndClass'].join('\n'),
      },
      {
        name: 'Child.bas',
        source: ['Class extends Base', 'dim items(3)', 'EndClass'].join('\n'),
      },
    ]);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/items/i);
  });

  test('a child class method colliding with a parent class field is rejected', () => {
    const result = compileMulti([
      {
        name: 'Base.bas',
        source: ['Class', 'dim items(3)', 'EndClass'].join('\n'),
      },
      {
        name: 'Child.bas',
        source: ['Class extends Base', 'function items()', '  print "hi"', 'endfunction', 'EndClass'].join('\n'),
      },
    ]);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(errMessages(result)).toMatch(/items/i);
  });
});

describe('class member cross-kind collision — does not affect legitimate programs', () => {
  test('a child class overriding a parent method (same kind) still compiles', () => {
    const result = compileMulti([
      {
        name: 'Base.bas',
        source: ['Class', 'function greet()', '  print "hi from base"', 'endfunction', 'EndClass'].join('\n'),
      },
      {
        name: 'Child.bas',
        source: ['Class extends Base', 'function greet()', '  print "hi from child"', 'endfunction', 'EndClass'].join('\n'),
      },
    ]);
    expect(result.diagnostics).toHaveLength(0);
  });

  test('two unrelated classes each declaring their own "items" member do not collide', () => {
    const result = compileMulti([
      {
        name: 'Enemy.bas',
        source: ['Class', 'dim items(3)', 'EndClass'].join('\n'),
      },
      {
        name: 'Shop.bas',
        source: ['Class', 'function items()', '  print "hi"', 'endfunction', 'EndClass'].join('\n'),
      },
    ]);
    expect(result.diagnostics).toHaveLength(0);
  });

  test('a class with distinctly-named fields and methods compiles normally', () => {
    const result = compile(
      ['Class', 'dim coins(3)', '', 'function attack()', '  print "hi"', 'endfunction', 'EndClass'].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });

  test('a module-level (non-class) function and array of the same name still compile — out of scope for this fix', () => {
    // Module scope has the identical deferred-init clobbering bug (tracked
    // as a separate follow-up), but this fix is deliberately scoped to
    // class members only, matching how issue #15 was reported.
    const result = compile(
      ['function items()', '  print "hi"', 'endfunction', '', 'dim items(3)'].join('\n')
    );
    expect(result.diagnostics).toHaveLength(0);
  });
});
