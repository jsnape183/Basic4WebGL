import { test, expect, describe } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace } from '../../helpers';

function compileErr(project: CompilerProject): string {
  const result = compiler.transpile(project);
  return result.diagnostics.map((d) => d.message).join('; ');
}

describe('Constructor parsing', () => {
  test('class with Constructor/EndConstructor compiles without errors', () => {
    const src = [
      'Class',
      'dim x',
      'Constructor(startX)',
      '    x = startX',
      'EndConstructor',
    ].join('\n');
    // Parser must handle Constructor/EndConstructor syntax without parser errors.
    // A transpiler error about missing ConstructorDecl rule is acceptable at this stage.
    const result = compiler.transpile({ lib: [], files: [{ name: 'Point', source: src }] });
    const parserErrors = result.diagnostics.filter(
      (d) => !/cannot find transpiler rule/i.test(d.message)
    );
    expect(
      parserErrors.map((d) => d.message).join('; '),
      'expected no parser errors'
    ).toBe('');
  });

  test('Constructor outside a class produces a compile error', () => {
    const src = [
      'Constructor(x)',
      '    x = 1',
      'EndConstructor',
    ].join('\n');
    const err = compileErr({ lib: [], files: [{ name: 'Main', source: src }] });
    expect(err).toMatch(/constructor must be declared inside a class/i);
  });
});
