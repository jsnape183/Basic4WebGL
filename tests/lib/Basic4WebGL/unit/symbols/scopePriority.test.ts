import { describe, it, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import { cleanWhitespace } from '../../helpers';

describe('scope priority: inner scope wins over outer', () => {
  it('local dim in a module function shadows a module-level dim', () => {
    const src = [
      'dim x',
      'function test()',
      '  dim x',
      '  x = 5',
      'endfunction',
    ].join('\n');
    const result = compiler.transpile({ lib: [], files: [{ name: 'Main', source: src }] });
    // Before fix: x = 5 would emit _x = 5 (resolves to module-level x)
    // After fix: x = 5 should emit test_x = 5 (resolves to local x)
    expect(cleanWhitespace(result.code!)).toContain('test_x=5');
    expect(result.diagnostics).toHaveLength(0);
  });
});
