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
      '    self.x = startX',
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
      '    self.x = a',
      'EndConstructor',
      'Constructor(b)',
      '    self.x = b',
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
    expect(result).toContain('onenter_p=new_sb_point(10,20)');
  });

  test('dim without args emits null (no-arg form is null-initialised)', () => {
    const src = ['Class', 'dim x'].join('\n');
    const main = 'function onenter()\n    dim b as Box\nendfunction';
    const result = compileOk({
      lib: [],
      files: [{ name: 'Box', source: src }, { name: 'Main', source: main }],
    });
    expect(result).toContain('onenter_b=null');
  });
});

describe('Constructor transpiled output', () => {
  test('class with constructor emits inline constructor in class declaration', () => {
    const src = [
      'Class',
      'dim x',
      'dim y',
      'Constructor(startX, startY)',
      '    self.x = startX',
      '    self.y = startY',
      'EndConstructor',
    ].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Point', source: src }] });
    expect(result).toContain('class_sb_point{');
    expect(result).toContain('constructor(constructor_startX,constructor_startY)');
    expect(result).toContain('this.x=constructor_startX');
    expect(result).toContain('this.y=constructor_startY');
  });

  test('class without constructor still emits bare class declaration', () => {
    const src = ['Class', 'dim x'].join('\n');
    const result = compileOk({ lib: [], files: [{ name: 'Box', source: src }] });
    expect(result).toContain('class_sb_box{}');
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
      '    self.health = startHealth',
      '    self.x = startX',
      'EndConstructor',
      '',
      'function move(dx)',
      '    self.x = self.x + dx',
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
    expect(result).toContain('_sb_player.prototype.move=function(move_dx)');
    expect(result).toContain('this.x=this.x+move_dx');

    // Call site passes args
    expect(result).toContain('onenter_player=new_sb_player(100,0)');
  });
});

describe('self array element assignment — self.arr(i) = value', () => {
  test('compiles without error', () => {
    const src = [
      'Class',
      'dim cells(64)',
      'function fill()',
      '    dim i',
      '    for i = 0 to 7',
      '        self.cells(i) = 1',
      '    next i',
      'endfunction',
    ].join('\n');
    const result = compiler.transpile({ lib: [], files: [{ name: 'Grid', source: src }] });
    const errs = result.diagnostics.filter((d) => !/cannot find transpiler rule/i.test(d.message));
    expect(errs.map((d) => d.message).join('; ')).toBe('');
  });

  test('emits this.cells[i] = 1 in output', () => {
    const src = [
      'Class',
      'dim cells(64)',
      'function fill()',
      '    dim i',
      '    i = 3',
      '    self.cells(i) = 1',
      'endfunction',
    ].join('\n');
    const result = compiler.transpile({ lib: [], files: [{ name: 'Grid', source: src }] });
    expect(result.code).toContain('this.cells[');
    expect(result.code).toContain(']=1');
  });

  test('multi-dimensional: self.grid(r, c) = v emits this.grid[r][c] = v', () => {
    const src = [
      'Class',
      'dim grid(16)',
      'function set(r, c, v)',
      '    self.grid(r, c) = v',
      'endfunction',
    ].join('\n');
    const result = compiler.transpile({ lib: [], files: [{ name: 'Board', source: src }] });
    expect(result.code).toContain('this.grid[');
    expect(result.code).toContain('][');
  });
});
