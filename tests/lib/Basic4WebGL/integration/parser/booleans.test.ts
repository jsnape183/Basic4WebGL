import { test, expect, beforeEach } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { rawObject } from '../../helpers';

const project: CompilerProject = {
  lib: [],
  files: [],
};

beforeEach(() => {
  project.files = [];
});

test('test not comparison generates the correct tree', () => {
  project.files.push({ name: 'Main.bas', source: 'print not 2=2' });
  expect(rawObject(compiler.parse(project).results[0].tree)).toMatchSnapshot();
});

test('test comparison with invalid type generates an error', () => {
  project.files.push({ name: 'Main.bas', source: 'print not "Hello world"<=2' });
  expect(() => compiler.parse(project)).toThrow(
    'Semantic Error: Expected type(s) Number but got String'
  );
});
