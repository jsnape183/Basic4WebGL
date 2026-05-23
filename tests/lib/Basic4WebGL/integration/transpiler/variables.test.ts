import { test, expect, beforeEach } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace, loadSampleFile } from '../../helpers';

const folder = 'variables';

const project: CompilerProject = {
  lib: [],
  files: [],
};

beforeEach(() => {
  project.files = [];
});

test('module-level dim uses dot format', () => {
  project.files = [{ name: 'Main', source: loadSampleFile('moduleLevelDim', folder) }];
  const result = cleanWhitespace(compiler.transpile(project).code!);
  expect(result).toContain('main.bunnysprite=undefined');
});

test('function-local dim uses underscore format', () => {
  project.files = [{ name: 'Main', source: loadSampleFile('functionLocalDim', folder) }];
  const result = cleanWhitespace(compiler.transpile(project).code!);
  expect(result).toContain('onenter_bunnyimage=undefined');
  expect(result).not.toContain('onenter.bunnyimage');
});

test('function-local dim variable reference uses underscore format', () => {
  project.files = [{ name: 'Main', source: loadSampleFile('functionLocalDimWithAssign', folder) }];
  const result = cleanWhitespace(compiler.transpile(project).code!);
  expect(result).toContain('onenter_bunnyimage=undefined');
  expect(result).toContain('onenter_bunnyimage="bunny.png"');
  expect(result).not.toContain('onenter.bunnyimage');
});
