import { test, expect } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import tokens from '@Basic4WebGL/tokens';
import { loadSampleFile } from '../../helpers';

const project: CompilerProject = {
  lib: [],
  files: [],
};

test('prints hello world', () => {
  project.files.push({
    name: 'Main.bas',
    source: loadSampleFile('helloworld'),
  });
  const result = compiler.lexOnly(project);
  expect(result).toBeDefined();
  expect(result.length).toBe(1);
  expect(result[0].tokens.length).toBe(2);
  expect(result[0].tokens[0].token.name).toBe(tokens.Print.name);
  expect(result[0].tokens[1].token.name).toBe(tokens.String.name);
});
