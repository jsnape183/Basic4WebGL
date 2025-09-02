import { CompilerProject } from '@CompilerLib/compiler/types';
import { expect, test } from 'vitest';
import compiler from '../index';

const project: CompilerProject = {
  lib: [],
  files: [],
};

test('prints hello world', () => {
  project.files.push({ name: 'Main.bas', source: 'Print "Hello, World!"' });
  const result = compiler.lexOnly(project);
  expect(result).toBeDefined();
  expect(result.length).toBe(1);
  expect(result[0].tokens.length).toBe(5);
  expect(result[0].tokens[0].token.name).toBe('Print');
  expect(result[0].tokens[1].token.name).toBe('String');
  expect(result[0].tokens[2].token.value).toBe('"Hello, World!"');
  expect(result[0].tokens[3].token.name).toBe('NewLine');
  expect(result[0].tokens[4].token.name).toBe('EndOfFile');
});
