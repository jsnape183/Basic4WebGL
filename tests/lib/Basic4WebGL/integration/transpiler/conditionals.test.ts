import { test, expect, beforeEach } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace, loadSampleFile } from '../../helpers';

const folder = 'conditionals';

const project: CompilerProject = {
  lib: [],
  files: [],
};

beforeEach(() => {
  project.files = [];
});

test('if statement generates correct code', () => {
  project.files = [{ name: 'Main', source: loadSampleFile('ifTest', folder) }];
  expect(cleanWhitespace(compiler.transpile(project))).toMatchSnapshot();
});

test('while statement generates correct code', () => {
  project.files = [{ name: 'Main', source: loadSampleFile('whileTest', folder) }];
  expect(cleanWhitespace(compiler.transpile(project))).toMatchSnapshot();
});

test('for statement generates correct code', () => {
  project.files = [{ name: 'Main', source: loadSampleFile('forTest', folder) }];
  expect(cleanWhitespace(compiler.transpile(project))).toMatchSnapshot();
});
