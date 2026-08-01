import { describe, test, expect } from 'vitest';
import Symbols, { SymbolScope } from '@CompilerLib/symbols';
import BuiltInType from '@CompilerLib/builtInTypes';
import { ArraySymbol, FunctionSymbol, symbolTypes } from '@Basic4WebGL/symbolTypes';

const variant = new BuiltInType('Variant');

// ─── Indexed lookup ───────────────────────────────────────────────────────────

describe('symbol retrieval', () => {
  test('finds a symbol immediately after adding it', () => {
    const table = new Symbols(variant);
    table.setScope('main');
    table.add('x');
    expect(table.check('x', 'Variable')).toBe(true);
  });

  test('returns the correct symbol when many are present', () => {
    const table = new Symbols(variant);
    table.setScope('main');
    for (let i = 0; i < 100; i++) {
      table.add(`var${i}`);
    }
    const result = table.get('var99', 'Variable');
    expect(result.name).toBe('var99');
  });

  test('does not confuse symbols with the same name in different scopes', () => {
    const table = new Symbols(variant);
    table.setScope('moduleA');
    table.add('x');
    table.clearScope();
    table.setScope('moduleB');
    table.add('x');
    // Only 'moduleB.x' should be visible (current scope)
    const sym = table.get('x', 'Variable');
    expect(sym.scope.name).toBe('moduleB');
  });

  test('throws when symbol is not found', () => {
    const table = new Symbols(variant);
    expect(() => table.get('missing', 'Variable')).toThrow();
  });

  test('check returns false for unknown symbols', () => {
    const table = new Symbols(variant);
    expect(table.check('ghost', 'Variable')).toBe(false);
  });

  test('clone produces a retrievable symbol under the new name', () => {
    const table = new Symbols(variant);
    table.setScope('main');
    const original = table.add('template', 'Object');
    table.clone('instance', original, 'Object');
    expect(table.check('instance', 'Object')).toBe(true);
  });
});

// ─── Scope depth ─────────────────────────────────────────────────────────────

describe('scope depth', () => {
  test('starts at depth 1 (global scope)', () => {
    const table = new Symbols(variant);
    expect(table.getScopeDepth()).toBe(1);
  });

  test('increases by 1 on setScope', () => {
    const table = new Symbols(variant);
    table.setScope('main');
    expect(table.getScopeDepth()).toBe(2);
  });

  test('decreases by 1 on clearScope', () => {
    const table = new Symbols(variant);
    table.setScope('main');
    table.clearScope();
    expect(table.getScopeDepth()).toBe(1);
  });

  test('never goes below 1 — clearScope on global scope is a no-op', () => {
    const table = new Symbols(variant);
    table.clearScope();
    expect(table.getScopeDepth()).toBe(1);
  });

  test('scope depth is correct after nested scopes', () => {
    const table = new Symbols(variant);
    table.setScope('module');
    table.setScope('function');
    expect(table.getScopeDepth()).toBe(3);
    table.clearScope();
    expect(table.getScopeDepth()).toBe(2);
    table.clearScope();
    expect(table.getScopeDepth()).toBe(1);
  });

  test('scope is always cleaned up when clearScope is in a finally block', () => {
    const table = new Symbols(variant);
    try {
      table.setScope('fnScope');
      throw new Error('simulated parse error');
    } catch {
      // swallowed
    } finally {
      table.clearScope();
    }
    expect(table.getScopeDepth()).toBe(1);
  });
});

// ─── getSnapshot() ───────────────────────────────────────────────────────────

describe('getSnapshot', () => {
  test('maps a plain variable', () => {
    const table = new Symbols(variant);
    table.add('score', symbolTypes.Variable);
    const snap = table.getSnapshot().find((s) => s.name === 'score');
    expect(snap).toMatchObject({ name: 'score', kind: 'Variable', scopeName: '', fullScope: '' });
  });

  test('carries classSymbol name and dimensions for a typed array', () => {
    const table = new Symbols(variant);
    const classSym = table.add('enemy', symbolTypes.Class);
    const arr = new ArraySymbol(
      'enemies',
      symbolTypes.Array,
      table.getScope(),
      table.getFullScopeName(),
      1,
      classSym
    );
    table.addTyped(arr);
    const snap = table.getSnapshot().find((s) => s.name === 'enemies');
    expect(snap).toMatchObject({ kind: 'Array', dimensions: 1, className: 'enemy' });
  });

  test("maps a function's parameters", () => {
    const table = new Symbols(variant);
    const param = table.add('amount', symbolTypes.Parameter);
    const fn = new FunctionSymbol(
      'takedamage',
      symbolTypes.Function,
      table.getScope(),
      table.getFullScopeName(),
      [param]
    );
    table.addTyped(fn);
    const snap = table.getSnapshot().find((s) => s.name === 'takedamage');
    expect(snap?.parameters).toEqual([{ name: 'amount', className: undefined }]);
  });

  test('marks isParam and carries parentClassName for a class symbol', () => {
    const table = new Symbols(variant);
    const param = table.add('hp', symbolTypes.Parameter);
    (param as any).isParam = true;
    const classSym = table.add('enemy', symbolTypes.Class);
    classSym.parentClassName = 'basemonster';

    const snap = table.getSnapshot();
    expect(snap.find((s) => s.name === 'hp')?.isParam).toBe(true);
    expect(snap.find((s) => s.name === 'enemy')?.parentClassName).toBe('basemonster');
  });
});
