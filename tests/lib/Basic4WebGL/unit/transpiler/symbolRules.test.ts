import { describe, test, expect } from 'vitest';
import Symbols, { SymbolScope } from '@CompilerLib/symbols';
import BuiltInType from '@CompilerLib/builtInTypes';
import { symbolRules } from '@Basic4WebGL/transpilerRules/symbolRules';

const variant = new BuiltInType('Variant');
const globalScope = () => new SymbolScope('', '');

const tableWith = (...names: string[]) => {
  const table = new Symbols(variant);
  const scope = globalScope();
  names.forEach((n) => table.add(n, 'Variable', scope));
  return { table, scope };
};

describe('symbolRules', () => {
  test('returns empty string when no variables exist', () => {
    const { table, scope } = tableWith();
    expect(symbolRules(table, scope)).toBe('');
  });

  test('declares a single global variable as a let statement', () => {
    const { table, scope } = tableWith('counter');
    const result = symbolRules(table, scope);
    expect(result).toContain('let _counter = null');
  });

  test('declares multiple global variables', () => {
    const { table, scope } = tableWith('x', 'y', 'z');
    const result = symbolRules(table, scope);
    expect(result).toContain('let _x = null');
    expect(result).toContain('let _y = null');
    expect(result).toContain('let _z = null');
  });

  test('does not generate declarations for non-global scopes', () => {
    const table = new Symbols(variant);
    const moduleScope = new SymbolScope('Main', 'Module');
    table.add('x', 'Variable', moduleScope);
    // module-scoped vars handled by VariableDimRule, not symbolRules
    const result = symbolRules(table, globalScope());
    expect(result).not.toContain('let');
  });
});
