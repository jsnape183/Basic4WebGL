import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';
import { packageModules } from '../../../../../src/constants/packageModules';

// ---------------------------------------------------------------------------
// Bug: a method call that TAKES ARGUMENTS, used in an EXPRESSION context, on a
// LOCAL VARIABLE holding an object (`dim a as RcActor` … `a = self.pool(i)` …
// `d = a.distanceTo(x, y)`) failed to parse with "Expected OpenParen got Comma".
//
// Root cause: VariableFactorRule's `obj.method(args)` branch pushed the
// instance's member scope (`symbolTable.setScope(name)`) around the WHOLE
// FunctionFactor parse, including the argument list. When an argument shared a
// name with a zero-arg accessor on the instance's class (parameter `x` vs. the
// class's `x()` method — as in the real RcActor), the bare `x` in the argument
// list resolved to that method and was parsed as a call `x(...)`, tripping on
// the comma. The toy repro missed it only because its helper class had no
// method named after an argument.
//
// Fix: parse the argument list in the caller's own scope (like the statement
// path in ObjectPropertyRule already does); use the instance scope only to
// resolve the method symbol itself.
// ---------------------------------------------------------------------------

const pkgLib = Object.entries(packageModules).map(([name, source]) => ({
  name,
  source,
}));

const actorFile = {
  name: 'RcActor',
  source: [
    'Class',
    '  dim ax',
    '  dim ay',
    '  function x()',
    '    return self.ax',
    '  endfunction',
    '  function y()',
    '    return self.ay',
    '  endfunction',
    '  function visible()',
    '    return 1',
    '  endfunction',
    '  function distanceTo(px, py)',
    '    dim dx',
    '    dim dy',
    '    dx = self.ax - px',
    '    dy = self.ay - py',
    '    return math.sqrt(dx * dx + dy * dy)',
    '  endfunction',
    'endclass',
  ].join('\n'),
};

const t = (files: { name: string; source: string }[], main: string) =>
  compiler.transpile({
    lib: pkgLib,
    files: [...files, { name: 'Main', source: main }],
  });

describe('method call with args on a local object, in expression context', () => {
  test('two-arg method call where arg names collide with zero-arg accessors', () => {
    const game = {
      name: 'Game',
      source: [
        'Class',
        '  dim pool(0)',
        '  function near(x, y, r)',
        '    dim i',
        '    dim a as RcActor',
        '    dim d',
        '    for i = 0 to 2',
        '      a = self.pool(i)',
        '      d = a.distanceTo(x, y)',
        '    next i',
        '  endfunction',
        'endclass',
      ].join('\n'),
    };
    const r = t([actorFile, game], 'dim g as Game()');
    expect(r.diagnostics).toEqual([]);
    expect(r.code).toContain('near_d = near_a.distanceto(near_x,near_y);');
  });

  test('single-arg method call on a local object', () => {
    const game = {
      name: 'Game',
      source: [
        'Class',
        '  dim pool(0)',
        '  function pick(x)',
        '    dim a as RcActor',
        '    dim d',
        '    a = self.pool(0)',
        '    d = a.distanceTo(x, x)',
        '  endfunction',
        'endclass',
      ].join('\n'),
    };
    const r = t([actorFile, game], 'dim g as Game()');
    expect(r.diagnostics).toEqual([]);
  });

  test('still works when receiver keeps its dim-as type without reassignment', () => {
    const game = {
      name: 'Game',
      source: [
        'Class',
        '  function measure(a as RcActor, x, y)',
        '    dim d',
        '    d = a.distanceTo(x, y)',
        '    return d',
        '  endfunction',
        'endclass',
      ].join('\n'),
    };
    const r = t([actorFile, game], 'dim g as Game()');
    expect(r.diagnostics).toEqual([]);
  });
});
