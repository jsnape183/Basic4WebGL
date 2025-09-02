import { test, expect } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import mockHelloWorld from './mocks/mockHelloWorld';

const project: CompilerProject = {
  lib: [],
  files: [],
};

const rawObject = (object: any) => JSON.parse(JSON.stringify(object));

test('prints hello world', () => {
  project.files.push({ name: 'Main.bas', source: 'Print "Hello, World!"' });
  const result = compiler.parse(project);
  expect(result).toBeDefined();
  expect(result.symbolTable).toBeDefined();
  expect(result.symbolTable.getAll().length).toBe(0);
  expect(result.results).toBeDefined();
  expect(result.results.length).toBe(1);
  expect(rawObject(result.results[0].tree)).toStrictEqual(mockHelloWorld);
});
