import { test, expect, beforeEach } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { loadSampleFile, rawObject } from '../../helpers';

const project: CompilerProject = {
  lib: [],
  files: [],
};

beforeEach(() => {
  project.files = [];
});

test('prints hello world', () => {
  project.files.push({ name: 'Main.bas', source: loadSampleFile('helloworld') });
  const result = compiler.parse(project);
  expect(result).toBeDefined();
  expect(result.symbolTable).toBeDefined();
  expect(result.symbolTable.getAll().length).toBe(0);
  expect(result.results).toBeDefined();
  expect(result.results.length).toBe(1);
  expect(rawObject(result.results[0].tree)).toMatchSnapshot();
});
