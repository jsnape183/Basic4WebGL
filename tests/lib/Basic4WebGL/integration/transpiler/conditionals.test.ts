import { test, expect, beforeEach } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace, loadSampleFile } from '../../helpers';
import ifResult from './mocks/conditionals/ifResult';
import whileResult from './mocks/conditionals/whileResult';
import forResult from './mocks/conditionals/forResult';

const folder = 'conditionals';

const project: CompilerProject = {
  lib: [],
  files: [],
};

beforeEach(() => {
  // runs before *each* test in this file
  project.files = [];
});

test('if statement generates correct code', () => {
  project.files = [
    {
      name: 'Main',
      source: loadSampleFile('ifTest', folder),
    },
  ];
  const result = cleanWhitespace(compiler.transpile(project));
  expect(result).toBeDefined();
  expect(result).toBe(ifResult);
});

test('while statement generates correct code', () => {
  project.files = [
    {
      name: 'Main',
      source: loadSampleFile('whileTest', folder),
    },
  ];
  const result = cleanWhitespace(compiler.transpile(project));
  expect(result).toBeDefined();
  expect(result).toBe(whileResult);
});

test('for statement generates correct code', () => {
  project.files = [
    {
      name: 'Main',
      source: loadSampleFile('forTest', folder),
    },
  ];

  const result = cleanWhitespace(compiler.transpile(project));
  expect(result).toBeDefined();
  expect(result).toBe(forResult);
});
