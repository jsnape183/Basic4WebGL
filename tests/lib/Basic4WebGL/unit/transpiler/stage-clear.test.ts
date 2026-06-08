import { readFileSync } from 'node:fs';
import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const stageSource = readFileSync('src/lib/Basic4WebGL/defs/stage.bas', 'utf-8');

// Exact setup the real app uses: stage in lib:, user code in files:
const transpileWithStage = (source: string) =>
  compiler.transpile({
    lib: [{ name: 'stage', source: stageSource }],
    files: [{ name: 'Main.bas', source }],
  });

describe('stage.clear() with real lib: setup', () => {
  test('stage.clear() with no user clear function', () => {
    const result = transpileWithStage([
      'function game()',
      '  stage.clear()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });

  test('stage.clear() coexists with user-defined clear(arr)', () => {
    const result = transpileWithStage([
      'function clear(arr)',
      '  print arr',
      'endfunction',
      'function game()',
      '  stage.clear()',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
  });
});
