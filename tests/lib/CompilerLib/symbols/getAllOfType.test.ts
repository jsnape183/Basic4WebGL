import { describe, test, expect } from 'vitest';
import Symbols, { SymbolScope } from '@CompilerLib/symbols';
import { ConstantSymbol, symbolTypes } from '@Basic4WebGL/symbolTypes';
import BuiltInType from '@CompilerLib/builtInTypes';

describe('Symbols.getAllOfType', () => {
  test('returns all symbols of a kind regardless of scope', () => {
    const table = new Symbols(new BuiltInType('Variant'));
    table.addTyped(
      new ConstantSymbol('a', symbolTypes.Constant, new SymbolScope('keyboard', ''), 'keyboard', 1, 'number')
    );
    table.addTyped(
      new ConstantSymbol('b', symbolTypes.Constant, new SymbolScope('main', ''), 'main', 2, 'number')
    );
    const all = table.getAllOfType(symbolTypes.Constant);
    expect(all.map((s) => s.name).sort()).toEqual(['a', 'b']);
  });
});
