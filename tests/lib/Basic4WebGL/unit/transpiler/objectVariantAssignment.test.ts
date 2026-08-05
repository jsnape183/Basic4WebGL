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
