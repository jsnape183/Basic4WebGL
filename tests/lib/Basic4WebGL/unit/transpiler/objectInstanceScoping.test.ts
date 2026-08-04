import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// ---------------------------------------------------------------------------
// Regression matrix for: "method call on an object instance in EXPRESSION
// context emitted the instance's lexical declaration path instead of its real
// JS name".
//
// Root cause: the expression path (VariableFactorRule) delegated `obj.method()`
// to FunctionFactorRule, which builds a FunctionTermNode carrying only the
// *method* symbol. FunctionTermRule then re-derived the callee from
// `formatSymbol(methodSymbol)`, which for a Function symbol is
// `${fullScope}.${name}` — the lexical scope chain recorded by Symbols.clone()
// when the instance's members were cloned into its scope (e.g. `main.onenter.s`).
// That string is only a valid JS expression when the instance is module-scoped;
// for a function-scoped instance the real JS name is `onenter_s`, so the
// receiver evaluated to `undefined` at runtime.
//
// The statement path (ObjectPropertyRule) never had the bug because it builds
// the call target from `formatSymbol(ownerSymbol)` — the instance symbol, which
// is the only thing that actually knows the instance's JS name.
//
// Every test below asserts on the *receiver* of the emitted call, and each
// broken case additionally asserts the old wrong path is gone — otherwise a
// `toContain` on the right answer could pass while the wrong one is also
// emitted somewhere else in the file.
// ---------------------------------------------------------------------------

const transformSource = readFileSync('src/lib/Basic4WebGL/defs/transform.bas', 'utf-8');
const spriteSource = readFileSync('src/lib/Basic4WebGL/defs/sprite.bas', 'utf-8');
const tileMapSource = readFileSync('src/lib/Basic4WebGL/defs/tilemap.bas', 'utf-8');
const stringSource = readFileSync('src/lib/Basic4WebGL/defs/string.bas', 'utf-8');
const mathSource = readFileSync('src/lib/Basic4WebGL/defs/math.bas', 'utf-8');

const transpile = (source: string) =>
  compiler.transpile({
    lib: [
      { name: 'string', source: stringSource },
      { name: 'math', source: mathSource },
    ],
    files: [
      { name: 'ObjectTransform.bas', source: transformSource },
      { name: 'sprite.bas', source: spriteSource },
      { name: 'TileMap.bas', source: tileMapSource },
      { name: 'Main.bas', source },
    ],
  });

/** Only the user's own module, so assertions can't accidentally match library code. */
const userModule = (code: string) => code.slice(code.indexOf('const main = {}'));

const compile = (lines: string[]) => {
  const result = transpile(lines.join('\n'));
  expect(result.diagnostics).toHaveLength(0);
  return userModule(result.code as string);
};

// ─── The bug: function-scoped local, method return value in an expression ─────
//
// These are the four shapes that were broken. All four are the same underlying
// defect, but they enter the parser through different statement rules, so each
// is worth pinning separately: a regression in any one of them could reappear
// without touching the others.

describe('function-scoped object local — method return value used in an expression', () => {
  test('inline construction, used as a print argument', () => {
    // The original repro. `dim x as Class(args)` + reading a method's return value.
    const code = compile([
      'function onenter()',
      '  dim s as sprite("x.png")',
      '  print string.str(s.width())',
      'endfunction',
    ]);
    expect(code).toContain('onenter_s.width()');
    expect(code).not.toContain('main.onenter.s');
  });

  test('declare-then-assign construction, used as a print argument', () => {
    // Proves the fix is about how the *instance* is referenced, not about which
    // `dim` form declared it — `dim x as C` + `x = new C(...)` is the form the
    // shipped tutorials use for object fields.
    const code = compile([
      'function onenter()',
      '  dim s as sprite',
      '  s = new sprite("x.png")',
      '  print string.str(s.width())',
      'endfunction',
    ]);
    expect(code).toContain('onenter_s.width()');
    expect(code).not.toContain('main.onenter.s');
  });

  test('used as an assignment right-hand side', () => {
    // Enters via VariableRule's assignment branch rather than PrintRule.
    const code = compile([
      'function onenter()',
      '  dim s as sprite("x.png")',
      '  dim w = 0',
      '  w = s.width()',
      'endfunction',
    ]);
    expect(code).toContain('onenter_w = onenter_s.width()');
    expect(code).not.toContain('main.onenter.s');
  });

  test('nested inside another call', () => {
    // The receiver must stay correct when the call is an inner sub-expression,
    // not the whole RHS — this is the shape that first surfaced the bug
    // (reading tilemap.tileAt(...) inside a collision check).
    const code = compile([
      'function onenter()',
      '  dim s as sprite("x.png")',
      '  dim w = 0',
      '  w = math.floor(s.width())',
      'endfunction',
    ]);
    expect(code).toContain('math.floor(onenter_s.width())');
    expect(code).not.toContain('main.onenter.s');
  });

  test('not specific to one class — tilemap behaves identically', () => {
    // Confirms this is a general scoping defect, not something about sprite's
    // definition file. tilemap.tileAt() is the real-world case that found it.
    const code = compile([
      'function onenter()',
      '  dim m as TileMap("tiles.png", 8, 8)',
      '  dim t = 0',
      '  t = m.tileAt(3, 4)',
      'endfunction',
    ]);
    expect(code).toContain('onenter_m.tileat(3,4)');
    expect(code).not.toContain('main.onenter.m');
  });

  test('two different instances in the same function stay distinct', () => {
    // Guards against a fix that resolved the receiver from something shared
    // (e.g. the enclosing function) rather than per-instance.
    const code = compile([
      'function onenter()',
      '  dim a as sprite("a.png")',
      '  dim b as sprite("b.png")',
      '  dim w = 0',
      '  w = a.width() + b.height()',
      'endfunction',
    ]);
    expect(code).toContain('onenter_a.width()');
    expect(code).toContain('onenter_b.height()');
  });

  test('same variable name in two different functions resolves per-function', () => {
    // The wrong path (`main.<fn>.s`) and the right path (`<fn>_s`) both vary by
    // function, so a single-function test can't tell them apart in isolation.
    const code = compile([
      'function first()',
      '  dim s as sprite("a.png")',
      '  print string.str(s.width())',
      'endfunction',
      'function second()',
      '  dim s as sprite("b.png")',
      '  print string.str(s.width())',
      'endfunction',
    ]);
    expect(code).toContain('first_s.width()');
    expect(code).toContain('second_s.width()');
    expect(code).not.toContain('main.first.s');
    expect(code).not.toContain('main.second.s');
  });
});

// ─── Same defect, reached through other declaration forms ─────────────────────

describe('other function-scoped object declarations with the same defect', () => {
  test('typed function parameter — method return value in an expression', () => {
    // A typed scalar parameter (`s as sprite`) is registered as an *Object*
    // symbol via Symbols.clone(), exactly like a local `dim`, so it had the
    // identical bug. This was NOT covered by the original bug report, which
    // assumed parameters were safe (only the statement form was).
    const code = compile([
      'function useit(s as sprite)',
      '  print string.str(s.width())',
      'endfunction',
    ]);
    expect(code).toContain('useit_s.width()');
    expect(code).not.toContain('main.useit.s');
  });

  test('local inside a class method resolves to the method-scoped name', () => {
    // The enclosing scope here is a class method, not a module function, so the
    // emitted wrong path was `main.go.s`. Confirms the fix keys off the instance
    // symbol rather than assuming a module-function enclosing scope.
    const result = transpile([
      'Class',
      'function go()',
      '  dim s as sprite("x.png")',
      '  print string.str(s.width())',
      'endfunction',
      'EndClass',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    const code = (result.code as string).slice(
      (result.code as string).indexOf('_sb_main.prototype.go')
    );
    expect(code).toContain('go_s.width()');
    expect(code).not.toContain('main.go.s');
  });
});

// ─── Previously-correct paths: prove the fix didn't break them ────────────────
//
// Each of these already worked before the fix and goes through a *different*
// code path. They are the blast radius of the change.

describe('previously-correct paths remain correct', () => {
  test('module-level dim still resolves to the module-qualified name', () => {
    // This case was correct only by coincidence: for a module-scoped instance
    // the lexical fullScope (`main.s`) happens to equal the instance's JS name
    // (`main.s`). The fix must not disturb that agreement.
    const code = compile([
      'dim s as sprite("x.png")',
      'function onenter()',
      '  print string.str(s.width())',
      'endfunction',
    ]);
    expect(code).toContain('main.s.width()');
  });

  test('void method call as a bare statement on a function-scoped local', () => {
    // The statement path (ObjectPropertyRule → PropertyMethodCallNode) always
    // built the chain from the instance symbol and was never broken.
    const code = compile([
      'function onenter()',
      '  dim s as sprite("x.png")',
      '  s.setAngle(1)',
      'endfunction',
    ]);
    expect(code).toContain('onenter_s.setangle(1)');
    expect(code).not.toContain('main.onenter.s');
  });

  test('void method call as a bare statement on a typed parameter', () => {
    const code = compile([
      'function useit(s as sprite)',
      '  s.setAngle(1)',
      'endfunction',
    ]);
    expect(code).toContain('useit_s.setangle(1)');
  });

  test('self./constructor-scope field still resolves to this.', () => {
    // SelfFactorRule builds `this.<field>` directly — a wholly separate path.
    const result = transpile([
      'Class',
      'dim spr as sprite',
      'Constructor()',
      '  self.spr = new sprite("x.png")',
      'EndConstructor',
      'function go()',
      '  print string.str(self.spr.width())',
      'endfunction',
      'EndClass',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('this.spr.width()');
  });

  test('chained sub-object method in an expression still resolves', () => {
    // The property-chain branch of VariableFactorRule already used the instance
    // symbol; only the direct-method branch discarded it.
    const code = compile([
      'function onenter()',
      '  dim s as sprite("x.png")',
      '  dim w = 0',
      '  w = s.transform.x()',
      'endfunction',
    ]);
    expect(code).toContain('onenter_s.transform.x()');
  });

  test('module function calls are unaffected', () => {
    // ModuleFactorRule also emits a FunctionTermNode. For a module, the lexical
    // fullScope IS the JS path, so it must keep resolving via formatSymbol.
    const code = compile([
      'function onenter()',
      '  print string.str(math.floor(1.5))',
      'endfunction',
    ]);
    expect(code).toContain('math.floor(1.5)');
  });

  test('plain user-defined function calls are unaffected', () => {
    const code = compile([
      'function helper()',
      '  return 1',
      'endfunction',
      'function onenter()',
      '  print string.str(helper())',
      'endfunction',
    ]);
    expect(code).toContain('main.helper()');
  });
});

// ─── Validation must survive the fix ──────────────────────────────────────────

describe('argument validation still applies to instance method calls', () => {
  test('arity error is still reported for a function-scoped local', () => {
    // The fix must keep FunctionTermNode (which extends BaseParameterValidatorNode).
    // Swapping to an unvalidated node type would have silently dropped this.
    const result = transpile([
      'function onenter()',
      '  dim s as sprite("x.png")',
      '  print string.str(s.width(1, 2, 3))',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].message).toContain(
      'Function width expects 0 arguments, but got 3.'
    );
  });

  test('arity error is still reported for a module-level instance', () => {
    const result = transpile([
      'dim s as sprite("x.png")',
      'function onenter()',
      '  print string.str(s.width(1))',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].message).toContain('Function width expects 0 arguments');
  });
});
