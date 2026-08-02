import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';
import '@Basic4WebGL/transpilerRules';

const transpile = (source: string) =>
  compiler.transpile({ lib: [], files: [{ name: 'Main.bas', source }] });

describe('Dictionary read fallback — plain dim variable holding a dict', () => {
  test('indexing a plain dim variable with [] compiles and emits the checked accessor', () => {
    const result = transpile([
      'function getstate()',
      '  dim d[]',
      '  d["level"] = 3',
      '  return d',
      'endfunction',
      'function test()',
      '  dim state',
      '  state = getstate()',
      '  print state["level"]',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbCheckedDictGet(test_state,"level","state")');
  });

  test('a real dim x[] dictionary keeps using the unguarded fast path', () => {
    const result = transpile('dim scores[]\nprint scores["Alice"]');
    expect(result.diagnostics).toHaveLength(0);
    expect(result.code).toContain('_sbDictGet(main.scores,"Alice")');
    expect(result.code).not.toContain('_sbCheckedDictGet');
  });

  test('indexing a bare function parameter with [] is still a compile error (no new scope for parameters)', () => {
    const result = transpile([
      'function readit(p)',
      '  print p["level"]',
      'endfunction',
    ].join('\n'));
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].message).toMatch(/Dictionary p .*has not been declared/);
  });
});
