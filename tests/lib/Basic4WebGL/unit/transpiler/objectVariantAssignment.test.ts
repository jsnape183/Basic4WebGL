import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// A minimal standalone class, unrelated to any real library module — this bug
// is a general type-checker gap, not specific to any one class.
const widgetSource = 'Class\ndim n\nEndClass';

const transpile = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'Widget.bas', source: widgetSource },
      { name: 'Main.bas',   source                },
    ],
  });

// ─── Assigning a function's return value to an object-typed variable ──────────
//
// Every softBASIC function has an implicit `Variant` return type (there is no
// return-type declaration syntax), so any function call's static dataType is
// always Variant. `dim x as ClassName` declares an Object-typed variable.
// Previously, ObjectType never listed 'Variant' among its acceptsTypes (unlike
// every other concrete type — Number, String, Boolean all explicitly accept
// Variant), so this assignment could never type-check — it crashed instead of
// producing a clean diagnostic, because the validator's error-reporting path
// assumes two children (matching ArrayAssignNode/DictionaryAssignNode's
// [index, value] shape) but a plain AssignNode only ever has one.

describe('Object-typed variable — assignment from a function call', () => {
  test('dim x as ClassName, then x = someFunction() compiles without error', () => {
    const result = transpile([
      'function makeWidget()',
      '  dim w as Widget()',
      '  return w',
      'endfunction',
      '',
      'function test()',
      '  dim widget as Widget',
      '  widget = makeWidget()',
      'endfunction',
    ].join('\n'));
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });

  test('the assigned variable supports member access afterwards', () => {
    const result = transpile([
      'function makeWidget()',
      '  dim w as Widget()',
      '  return w',
      'endfunction',
      '',
      'function test()',
      '  dim widget as Widget',
      '  widget = makeWidget()',
      '  dim n',
      '  n = widget.n',
      'endfunction',
    ].join('\n'));
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });
});

// ─── Combined `dim x as ClassName = <expr>` with a non-`new` expression ───────
//
// The combined declare-and-assign form (`dim x as ClassName = ...`) previously
// only accepted a literal `new ClassName(args)` on the right-hand side — the
// parser unconditionally required the `new` keyword immediately after `=`, so
// `dim x as ClassName = someFunction()` failed with "Expected New got Variable"
// even though the equivalent two-statement form (`dim x as ClassName` then a
// separate `x = someFunction()`) already worked. This was a real inconsistency:
// the same assignment is legal on its own but not when combined with the `dim`.

describe('Object-typed variable — combined dim...as...= with a non-new expression', () => {
  test('dim x as ClassName = someFunction() compiles without error', () => {
    const result = transpile([
      'function makeWidget()',
      '  dim w as Widget()',
      '  return w',
      'endfunction',
      '',
      'function test()',
      '  dim widget as Widget = makeWidget()',
      'endfunction',
    ].join('\n'));
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });

  test('the combined form still supports member access afterwards', () => {
    const result = transpile([
      'function makeWidget()',
      '  dim w as Widget()',
      '  return w',
      'endfunction',
      '',
      'function test()',
      '  dim widget as Widget = makeWidget()',
      '  dim n',
      '  n = widget.n',
      'endfunction',
    ].join('\n'));
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });

  test('dim x as ClassName = new ClassName(args) still works (existing behavior unchanged)', () => {
    const result = transpile([
      'function test()',
      '  dim widget as Widget = new Widget()',
      'endfunction',
    ].join('\n'));
    if (result.diagnostics.length > 0) {
      console.log('DIAGNOSTICS:', JSON.stringify(result.diagnostics, null, 2));
    }
    expect(result.diagnostics).toHaveLength(0);
  });

  test('dim x as ClassName = new WrongClassName(args) still raises a type-mismatch error', () => {
    const otherSource = 'Class\ndim m\nEndClass';
    const result = compiler.transpile({
      lib: [],
      files: [
        { name: 'Widget.bas', source: widgetSource },
        { name: 'Other.bas',  source: otherSource },
        { name: 'Main.bas',   source: [
          'function test()',
          '  dim widget as Widget = new Other()',
          'endfunction',
        ].join('\n') },
      ],
    });
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].message).toMatch(/Type mismatch/);
  });
});
