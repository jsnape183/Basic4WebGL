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

  test('two constructors in one class produces a compile error', () => {
    const src = [
      'Class',
      'dim x',
      'Constructor(a)',
      '    x = a',
      'EndConstructor',
      'Constructor(b)',
      '    x = b',
      'EndConstructor',
    ].join('\n');
    const err = compileErr({ lib: [], files: [{ name: 'Dup', source: src }] });
    expect(err).toMatch(/a class may only have one constructor/i);
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

describe('end-to-end: constructor + instance method', () => {
  test('full class with constructor and method produces correct output', () => {
    const classSrc = [
      'Class',
      'dim health',
      'dim x',
      '',
      'Constructor(startHealth, startX)',
      '    health = startHealth',
      '    x = startX',
      'EndConstructor',
      '',
      'function move(dx)',
      '    x = x + dx',
      'endfunction',
    ].join('\n');

    const mainSrc = [
      'function onenter()',
      '    dim player as Player(100, 0)',
      'endfunction',
    ].join('\n');

    const result = compileOk({
      lib: [],
      files: [
        { name: 'Player', source: classSrc },
        { name: 'Main', source: mainSrc },
      ],
    });

    // Class declaration with inline constructor
    expect(result).toContain('constructor(constructor_startHealth,constructor_startX)');
    expect(result).toContain('this.health=constructor_startHealth');
    expect(result).toContain('this.x=constructor_startX');

    // Instance method uses function() and this.
    expect(result).toContain('player.prototype.move=function(move_dx)');
    expect(result).toContain('this.x=this.x+move_dx');

    // Call site passes args
    expect(result).toContain('onenter_player=newplayer(100,0)');
  });
});
