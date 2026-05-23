import { readFileSync } from 'node:fs';
import { expect } from 'vitest';
import { CompilerProject } from '@CompilerLib/compiler/types';
import compiler from '@Basic4WebGL/index';

export const rawObject = (object: any) => JSON.parse(JSON.stringify(object));

export const loadSampleFile = (
  fileName: string,
  folder: string = undefined
) => {
  if (folder) {
    return readFileSync(`tests/sampleFiles/${folder}/${fileName}.bas`, 'utf-8');
  }
  return readFileSync(`tests/sampleFiles/${fileName}.bas`, 'utf-8');
};

export const cleanWhitespace = (input: string): string => {
  return input.replace(/\s+/g, '');
};

export const compileOk = (project: CompilerProject): string => {
  const result = compiler.transpile(project);
  const errorMessages = result.diagnostics.map((d) => d.message).join('; ');
  expect(errorMessages, `compile errors: ${errorMessages}`).toBe('');
  expect(result.code).toBeDefined();
  return cleanWhitespace(result.code!);
};
