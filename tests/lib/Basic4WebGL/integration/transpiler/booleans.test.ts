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
  ['equality',             'print 2=2',           '_print(2==2)'],
  ['not',                  'print not 2=2',        '_print(!(2==2))'],
  ['less than',            'print 2<2',            '_print(2<2)'],
  ['greater than',         'print 2>2',            '_print(2>2)'],
  ['less than or equal',   'print 2<=2',           '_print(2<=2)'],
  ['greater or equal',     'print 2>=2',           '_print(2>=2)'],
  ['and',                  'print 2=2 and 1=1',    '_print(2==2&&1==1)'],
  ['or',                   'print 2=2 or 1=1',     '_print(2==2||1==1)'],
])('%s comparison generates correct code', (_, source, expected) => {
  project.files.push({ name: 'Main.bas', source });
  expect(cleanWhitespace(compiler.transpile(project).code!)).toContain(expected);
});
