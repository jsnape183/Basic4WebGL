import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import compiler from '@Basic4WebGL/index';

const mathLib = { name: 'math', source: readFileSync('src/lib/Basic4WebGL/defs/math.bas', 'utf-8') };

const compileErrorLoc = (source: string, lib: { name: string; source: string }[] = []) => {
  const result = compiler.transpile({ lib, files: [{ name: 'Main', source }] });
  expect(result.diagnostics.length, 'expected a compile error but got none').toBeGreaterThan(0);
  return result.diagnostics[0].loc;
};

describe('loc propagation through delegation-only parser rules', () => {
  test('error inside a boolean expression reports the correct line', () => {
    const src = [
      'function onenter()',
      '    if true and undefinedVar then',
      '        print "hi"',
      '    endif',
      'endfunction',
    ].join('\n');
    expect(compileErrorLoc(src)?.line).toBe(2);
  });

  test('error inside a bare arithmetic expression reports the correct line', () => {
    const src = [
      'function onenter()',
      '    dim x = 1',
      '    dim y = x + undefinedVar',
      'endfunction',
    ].join('\n');
    expect(compileErrorLoc(src)?.line).toBe(3);
  });

  test('error inside a module-call argument reports a line at or after the call', () => {
    const src = [
      'function onenter()',
      '    dim x = math.floor(undefinedVar)',
      'endfunction',
    ].join('\n');
    expect(compileErrorLoc(src, [mathLib])?.line).toBe(2);
  });
});
