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

// ─── findAnyInScope — kind-agnostic lookup ─────────────────────────────────
//
// Roadmap issue #15: a class declaring an array field and a method of the
// same name got no diagnostic at either declaration site, because every
// existing duplicate-declaration check (add/addTyped's own check, and
// getInScope) filters by kind — 'Array' and 'Function' are never considered
// the same kind, so they never collide. findAnyInScope is the new
// kind-agnostic primitive the cross-kind collision hook (see below) needs:
// it answers "does *anything* exist under this name in this scope",
// regardless of what kind it is.

describe('findAnyInScope', () => {
  test('finds a symbol regardless of the kind it was declared as', () => {
    const table = new Symbols(variant);
    table.setScope('enemy', 'Class');
    table.add('items', symbolTypes.Function);
    const found = table.findAnyInScope('items', 'enemy');
    expect(found?.type).toBe('Function');
  });

  test('is case-insensitive, matching every other lookup in this table', () => {
    const table = new Symbols(variant);
    table.setScope('enemy', 'Class');
    table.add('Items', symbolTypes.Function);
    expect(table.findAnyInScope('items', 'enemy')?.name).toBe('Items');
  });

  test('returns undefined when nothing exists under that name in that scope', () => {
    const table = new Symbols(variant);
    table.setScope('enemy', 'Class');
    table.add('items', symbolTypes.Function);
    expect(table.findAnyInScope('items', 'otherclass')).toBeUndefined();
    expect(table.findAnyInScope('nope', 'enemy')).toBeUndefined();
  });
});

// ─── Injected cross-kind collision hook ────────────────────────────────────
//
// Symbols itself stays generic — it has no notion of "class inheritance".
// The hook is optional, constructor-injected (mirroring how isMatchingType
// already is), and consulted by add()/addTyped() after the existing
// same-kind check passes. This block tests the generic injection mechanism
// only; the real walk-the-inheritance-chain policy is Basic4WebGL-specific
// and tested separately against the full compiler.

describe('constructor-injected findCrossKindCollision hook', () => {
  test('add() throws when the hook reports a collision', () => {
    const table = new Symbols(variant, undefined, (_symbols, name) => {
      if (name === 'items') {
        // Simulate an existing Function symbol with this name.
        return { name: 'items', type: 'Function', scope: { name: 'enemy' } } as any;
      }
      return undefined;
    });
    table.setScope('enemy', 'Class');
    expect(() => table.add('items', symbolTypes.Array)).toThrow(/items/);
  });

  test('addTyped() also consults the hook', () => {
    const table = new Symbols(variant, undefined, () => ({ name: 'items', type: 'Function', scope: { name: 'enemy' } } as any));
    table.setScope('enemy', 'Class');
    const arr = new ArraySymbol('items', symbolTypes.Array, table.getScope(), table.getFullScopeName(), 1);
    expect(() => table.addTyped(arr)).toThrow(/items/);
  });

  test('does not throw when the hook finds no collision', () => {
    const table = new Symbols(variant, undefined, () => undefined);
    table.setScope('enemy', 'Class');
    expect(() => table.add('items', symbolTypes.Array)).not.toThrow();
  });

  test('is not consulted at all when no hook is provided — existing behavior unchanged', () => {
    const table = new Symbols(variant);
    table.setScope('enemy', 'Class');
    expect(() => table.add('items', symbolTypes.Array)).not.toThrow();
  });

  test('the existing same-kind duplicate check still fires independently of the hook', () => {
    const table = new Symbols(variant, undefined, () => undefined);
    table.setScope('enemy', 'Class');
    table.add('items', symbolTypes.Variable);
    expect(() => table.add('items', symbolTypes.Variable)).toThrow();
  });
});
