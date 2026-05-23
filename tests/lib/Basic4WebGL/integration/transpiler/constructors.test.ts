import { test, expect, describe } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace, compileOk, loadSampleFile } from '../../helpers';

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

describe('dim x as Type(args) — constructor call site', () => {
  test('dim with args emits new Type(args)', () => {
    const pointFile = { name: 'Point', source: loadSampleFile('Point', 'constructor') };
    const mainSrc = [
      'function onenter()',
      '    dim p as Point(10, 20)',
      'endfunction',
    ].join('\n');
    const result = compileOk({ lib: [], files: [pointFile, { name: 'Main', source: mainSrc }] });
    expect(result).toContain('onenter_p=newpoint(10,20)');
  });

  test('dim without args still emits new Type()', () => {
    const src = ['Class', 'dim x'].join('\n');
    const main = 'function onenter()\n    dim b as Box\nendfunction';
    const result = compileOk({
      lib: [],
      files: [{ name: 'Box', source: src }, { name: 'Main', source: main }],
    });
    expect(result).toContain('onenter_b=newbox()');
  });
});

describe('Constructor transpiled output', () => {
  test('class with constructor emits inline constructor in class declaration', () => {
    const src = [
      'Class',
      'dim x',
      'dim y',
      'Constructor(startX, startY)',
      '    x = startX',
      '    y = startY',
      'EndConstructor',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Point', source: src }] });
    expect(result).toContain('classpoint{');
    expect(result).toContain('constructor(constructor_startX,constructor_startY)');
    expect(result).toContain('this.x=constructor_startX');
    expect(result).toContain('this.y=constructor_startY');
  });

  test('class without constructor still emits bare class declaration', () => {
    const src = ['Class', 'dim x'].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Box', source: src }] });
    expect(result).toContain('classbox{}');
  });
});
