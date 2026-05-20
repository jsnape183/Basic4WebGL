import { describe, test, expect } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { rawObject } from '../../helpers';

const project: CompilerProject = { lib: [], files: [] };

const parse = (source: string) => {
  project.files = [{ name: 'Main.bas', source }];
  return compiler.parse(project);
};

// ─── Variables ────────────────────────────────────────────────────────────────

describe('dim statement', () => {
  test('produces correct tree', () => {
    const result = parse('dim x');
    expect(rawObject(result.results[0].tree)).toMatchSnapshot();
  });

  test('dim x as Type requires built-in type classes from lib files', () => {
    expect(() => parse('dim x as number')).toThrow('Class number');
  });
});

describe('assignment', () => {
  test('assigning a literal value produces correct tree', () => {
    const result = parse('dim x\nx = 5');
    expect(rawObject(result.results[0].tree)).toMatchSnapshot();
  });

  test('assigning an expression produces correct tree', () => {
    const result = parse('dim x\nx = 2+3');
    expect(rawObject(result.results[0].tree)).toMatchSnapshot();
  });
});

// ─── Control flow ─────────────────────────────────────────────────────────────

describe('if statement', () => {
  test('produces correct tree', () => {
    const result = parse('if 1=1\n  print "yes"\nendif');
    expect(rawObject(result.results[0].tree)).toMatchSnapshot();
  });

  test('registers no extra symbols', () => {
    const result = parse('if 1=1\n  print "yes"\nendif');
    expect(result.symbolTable.getAll().length).toBe(0);
  });
});

describe('while loop', () => {
  test('produces correct tree', () => {
    const result = parse('while 1=1\n  print "yes"\nendwhile');
    expect(rawObject(result.results[0].tree)).toMatchSnapshot();
  });
});

describe('for loop', () => {
  test('produces correct tree', () => {
    const result = parse('for x = 0 to 9\n  print x\nnext');
    expect(rawObject(result.results[0].tree)).toMatchSnapshot();
  });
});

// ─── Functions ────────────────────────────────────────────────────────────────

describe('function declaration', () => {
  test('produces correct tree', () => {
    const result = parse('function greet()\n  print "hi"\nendfunction');
    expect(rawObject(result.results[0].tree)).toMatchSnapshot();
  });

});

describe('return statement', () => {
  test('produces correct tree', () => {
    const result = parse('function getValue()\n  return 42\nendfunction');
    expect(rawObject(result.results[0].tree)).toMatchSnapshot();
  });
});
