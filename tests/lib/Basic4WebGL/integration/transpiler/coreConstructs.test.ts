import { test, expect, beforeEach } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace, loadSampleFile } from '../../helpers';
import helloWorldResult from './mocks/coreConstructs/helloworldResult';
import methodResult from './mocks/coreConstructs/methodResult';
import methodCallResult from './mocks/coreConstructs/methodCallResult';
import moduleCallResult from './mocks/coreConstructs/moduleCallResult';

const folder = 'coreConstructs';

const project: CompilerProject = {
  lib: [],
  files: [],
};

beforeEach(() => {
  // runs before *each* test in this file
  project.files = [];
});

test('prints hello world', () => {
  project.files.push({
    name: 'Main.bas',
    source: loadSampleFile('helloworld'),
  });
  const result = cleanWhitespace(compiler.transpile(project));
  expect(result).toBeDefined();
  expect(result).toBe(helloWorldResult);
});

test('method onentry is added to class', () => {
  project.files.push({
    name: 'Main.bas',
    source: loadSampleFile('methodTest', folder),
  });
  const result = cleanWhitespace(compiler.transpile(project));
  expect(result).toBeDefined();
  expect(result).toBe(methodResult);
});

test('method call in onentry works', () => {
  project.files.push({
    name: 'Main.bas',
    source: loadSampleFile('methodCallTest', folder),
  });
  const result = cleanWhitespace(compiler.transpile(project));
  expect(result).toBeDefined();
  expect(result).toBe(methodCallResult);
});

test('module call in onentry works', () => {
  project.files = [
    {
      name: 'Talk',
      source: loadSampleFile('Talk', 'modules'),
    },
    {
      name: 'Main',
      source: loadSampleFile('moduleCallTest', folder),
    },
  ];
  const result = cleanWhitespace(compiler.transpile(project));
  expect(result).toBeDefined();
  expect(result).toBe(moduleCallResult);
});
