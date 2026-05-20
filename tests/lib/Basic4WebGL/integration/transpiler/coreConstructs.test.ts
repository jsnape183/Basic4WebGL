import { test, expect, beforeEach } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace, loadSampleFile } from '../../helpers';

const folder = 'coreConstructs';

const project: CompilerProject = {
  lib: [],
  files: [],
};

beforeEach(() => {
  project.files = [];
});

test('prints hello world', () => {
  project.files.push({ name: 'Main.bas', source: loadSampleFile('helloworld') });
  expect(cleanWhitespace(compiler.transpile(project))).toMatchSnapshot();
});

test('method onentry is added to class', () => {
  project.files.push({ name: 'Main.bas', source: loadSampleFile('methodTest', folder) });
  expect(cleanWhitespace(compiler.transpile(project))).toMatchSnapshot();
});

test('method call in onentry works', () => {
  project.files.push({ name: 'Main.bas', source: loadSampleFile('methodCallTest', folder) });
  expect(cleanWhitespace(compiler.transpile(project))).toMatchSnapshot();
});

test('module call in onentry works', () => {
  project.files = [
    { name: 'Talk', source: loadSampleFile('Talk', 'modules') },
    { name: 'Main', source: loadSampleFile('moduleCallTest', folder) },
  ];
  expect(cleanWhitespace(compiler.transpile(project))).toMatchSnapshot();
});
