import { test, expect, beforeEach } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace } from '../../helpers';

const project: CompilerProject = {
  lib: [],
  files: [],
};

beforeEach(() => {
  project.files = [];
});

test.each([
  ['addition',            'print 2+2',             '_print(2+2)'],
  ['subtraction',         'print 2-2',             '_print(2-2)'],
  ['multiplication',      'print 2*2',             '_print(2*2)'],
  ['division',            'print 2/2',             '_print(2/2)'],
  ['complex expression',  'print (2/2)+2-(2*1)',   '_print((2/2)+2-(2*1))'],
])('%s generates correct code', (_, source, expected) => {
  project.files.push({ name: 'Main.bas', source });
  expect(cleanWhitespace(compiler.transpile(project))).toContain(expected);
});
