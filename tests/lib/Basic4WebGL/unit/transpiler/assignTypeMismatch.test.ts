import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

// A minimal standalone class, unrelated to any real library module.
const widgetSource = 'Class\ndim n\nEndClass';

const transpile = (source: string) =>
  compiler.transpile({
    lib: [],
    files: [
      { name: 'Widget.bas', source: widgetSource },
      { name: 'Main.bas',   source                },
    ],
  });

// ─── A genuine type mismatch on a plain `x = expr` assignment ─────────────
//
// BaseAssignableValidatorNode.validate()'s error-reporting branch assumed a
// two-child shape (children[1] = the assigned value), which matches
// ArrayAssignNode/DictionaryAssignNode but not plain AssignNode, which has
// exactly one child. Any real mismatch on `x = expr` crashed with
// "Cannot read properties of undefined (reading 'dataType')" instead of
// producing a SemanticTypeError diagnostic.
describe('Plain assignment — genuine type mismatch reports a clean diagnostic', () => {
  test('assigning a number to an Object-typed variable produces a SemanticTypeError, not a crash', () => {
    const result = transpile([
      'function test()',
      '  dim widget as Widget',
      '  widget = 5',
      'endfunction',
    ].join('\n'));

    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].message).not.toMatch(/Cannot read properties of undefined/);
    expect(result.diagnostics[0].message).toMatch(/Semantic Error/);
  });
});
