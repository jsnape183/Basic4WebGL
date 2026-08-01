import { describe, test, expect } from 'vitest';
import compiler from '@Basic4WebGL/index';

describe('transpile() symbol snapshot', () => {
  test('includes a constructor parameter, derived via fullScope not .parameters', () => {
    const src = [
      'Class',
      'dim hp',
      'constructor(hp)',
      '  self.hp = hp',
      'endconstructor',
      'function takedamage(amount)',
      '  self.hp = self.hp - amount',
      'endfunction',
    ].join('\n');
    const result = compiler.transpile({ lib: [], files: [{ name: 'Enemy', source: src }] });

    expect(result.diagnostics).toHaveLength(0);
    const symbols = result.symbols!;

    // Regular function: .parameters is populated directly.
    const takedamage = symbols.find((s) => s.kind === 'Function' && s.name === 'takedamage');
    expect(takedamage?.parameters?.map((p) => p.name)).toEqual(['amount']);

    // Constructor: .parameters is NOT populated (ConstructorRule hardcodes []) — the
    // real param must be found by filtering on fullScope instead.
    const ctorGuard = symbols.find((s) => s.kind === 'Function' && s.name === 'constructor');
    expect(ctorGuard?.parameters).toEqual([]);

    // Confirmed by running this test: file/class scope names are lowercased by the
    // lexer (`lexer/index.ts` strips '.bas' and lowercases the filename before it
    // ever reaches RootRule), so fullScope is 'enemy.constructor', not 'Enemy.constructor'
    // as a naive reading of the source ('Enemy') might suggest.
    const ctorParam = symbols.find((s) => s.isParam && s.fullScope === 'enemy.constructor');
    expect(ctorParam?.name.toLowerCase()).toBe('hp');
  });
});
