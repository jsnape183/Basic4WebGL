import { describe, test, expect } from 'vitest';
import { symbolTypes, ConstantSymbol } from '@Basic4WebGL/symbolTypes';
import { SymbolScope } from '@CompilerLib/symbols';

describe('ConstantSymbol', () => {
  test('symbolTypes.Constant exists', () => {
    expect(symbolTypes.Constant).toBe('Constant');
  });

  test('stores value and valueKind', () => {
    const s = new ConstantSymbol(
      'space',
      symbolTypes.Constant,
      new SymbolScope('keyboard', ''),
      'keyboard',
      32,
      'number'
    );
    expect(s.name).toBe('space');
    expect(s.type).toBe('Constant');
    expect(s.value).toBe(32);
    expect(s.valueKind).toBe('number');
  });
});
