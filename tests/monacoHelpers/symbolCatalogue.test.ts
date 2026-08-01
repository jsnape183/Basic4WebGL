import { describe, test, expect } from 'vitest';
import {
  getVisibleSymbols,
  getMembers,
  resolveOwnerScopeName,
  getCallableSignature,
} from '../../src/monacoHelpers/symbolCatalogue';
import type { SymbolSnapshotEntry } from '../../src/lib/CompilerLib/symbols';

// Hand-built fixture modelling a small project (matches real getSnapshot() shape,
// confirmed against tests/lib/Basic4WebGL/integration/compiler/symbolSnapshot.test.ts):
//   - a global `score` variable (scopeName '')
//   - a `talk` file with a top-level `sayhello` function
//   - an `enemy` class file: a `hp` field, a constructor(hp), a takedamage(amount) method
//   - a `main` file: `dim e as enemy` (Object) and `dim enemies(10) as enemy` (typed Array)
const snapshot: SymbolSnapshotEntry[] = [
  { name: 'score', kind: 'Variable', scopeName: '', scopeType: '', fullScope: '' },

  { name: 'talk', kind: 'Module', scopeName: '', scopeType: '', fullScope: '' },
  { name: 'sayhello', kind: 'Function', scopeName: 'talk', scopeType: 'Module', fullScope: 'talk', parameters: [] },

  { name: 'enemy', kind: 'Class', scopeName: '', scopeType: '', fullScope: '' },
  { name: 'hp', kind: 'Variable', scopeName: 'enemy', scopeType: 'Class', fullScope: 'enemy' },
  { name: 'constructor', kind: 'Function', scopeName: 'enemy', scopeType: 'Class', fullScope: 'enemy', parameters: [] },
  { name: 'hp', kind: 'Parameter', scopeName: 'constructor', scopeType: 'Constructor', fullScope: 'enemy.constructor', isParam: true },
  {
    name: 'takedamage',
    kind: 'Function',
    scopeName: 'enemy',
    scopeType: 'Class',
    fullScope: 'enemy',
    parameters: [{ name: 'amount' }],
  },
  { name: 'amount', kind: 'Parameter', scopeName: 'takedamage', scopeType: 'Function', fullScope: 'enemy.takedamage', isParam: true },

  { name: 'main', kind: 'Module', scopeName: '', scopeType: '', fullScope: '' },
  { name: 'e', kind: 'Object', scopeName: 'main', scopeType: 'Module', fullScope: 'main', className: 'enemy' },
  { name: 'hp', kind: 'Variable', scopeName: 'e', scopeType: 'Object', fullScope: 'main.e' },
  { name: 'constructor', kind: 'Function', scopeName: 'e', scopeType: 'Object', fullScope: 'main.e', parameters: [] },
  {
    name: 'takedamage',
    kind: 'Function',
    scopeName: 'e',
    scopeType: 'Object',
    fullScope: 'main.e',
    parameters: [{ name: 'amount' }],
  },
  {
    name: 'enemies',
    kind: 'Array',
    scopeName: 'main',
    scopeType: 'Module',
    fullScope: 'main',
    className: 'enemy',
    dimensions: 1,
  },

  // A local 'e' inside function 'update' (in 'main') shadows the file-scope Object 'e'
  // above with a differently-typed array — used to prove resolveOwnerScopeName picks
  // the innermost scope-stack frame over the file module scope, not just any match.
  {
    name: 'e',
    kind: 'Array',
    scopeName: 'update',
    scopeType: 'Function',
    fullScope: 'main.update',
    className: 'widget',
    dimensions: 1,
  },
];

describe('getVisibleSymbols', () => {
  test('includes globals, the file module scope, and each scope-stack frame', () => {
    const visible = getVisibleSymbols(snapshot, 'enemy', ['takedamage']);
    const names = visible.map((s) => `${s.scopeName}.${s.name}`);
    expect(names).toContain('.score'); // global
    expect(names).toContain('.talk'); // global module symbol
    expect(names).toContain('enemy.hp'); // file module scope
    expect(names).toContain('enemy.takedamage'); // file module scope
    expect(names).toContain('takedamage.amount'); // innermost scope-stack frame
    // Not visible: another file's members, or a different function's locals
    expect(names).not.toContain('main.e');
    expect(names).not.toContain('constructor.hp');
  });

  test('returns just globals and the file module scope at file top level', () => {
    const visible = getVisibleSymbols(snapshot, 'main', []);
    const names = visible.map((s) => s.name);
    expect(names).toContain('e');
    expect(names).toContain('enemies');
    expect(names).toContain('score');
    expect(names).not.toContain('amount');
  });
});

describe('getMembers', () => {
  test("returns a class scope's members for a typed-array owner", () => {
    const members = getMembers(snapshot, 'enemy').map((m) => m.name);
    expect(members).toEqual(expect.arrayContaining(['hp', 'constructor', 'takedamage']));
  });

  test("returns an object variable's own cloned-scope members", () => {
    const members = getMembers(snapshot, 'e').map((m) => m.name);
    expect(members).toEqual(expect.arrayContaining(['hp', 'constructor', 'takedamage']));
  });
});

describe('resolveOwnerScopeName', () => {
  test('Object variable resolves to its own name', () => {
    // dim e as Enemy -> 'e', not 'enemy'
    expect(resolveOwnerScopeName(snapshot, 'e', [], 'main')).toBe('e');
  });

  test('typed array resolves to the class name, not the variable name', () => {
    // dim enemies(10) as Enemy -> 'enemy'
    expect(resolveOwnerScopeName(snapshot, 'enemies', [], 'main')).toBe('enemy');
  });

  test('another file/module resolves to itself', () => {
    expect(resolveOwnerScopeName(snapshot, 'talk', [], 'main')).toBe('talk');
  });

  test('a plain Variable owner returns null', () => {
    expect(resolveOwnerScopeName(snapshot, 'score', [], 'main')).toBeNull();
  });

  test('unknown identifier returns null', () => {
    expect(resolveOwnerScopeName(snapshot, 'nope', [], 'main')).toBeNull();
  });

  test('prefers the innermost scope-stack frame over the file module scope', () => {
    // 'e' exists both as an Object at file scope ('main') and, shadowed, as a typed
    // Array inside function 'update' ('main.update'). Resolving with 'update' on the
    // scope stack must pick the inner Array (-> its className 'widget'), not the
    // outer Object (-> its own name 'e') — proving real scope priority, not just
    // "first match anywhere in the snapshot".
    expect(resolveOwnerScopeName(snapshot, 'e', ['update'], 'main')).toBe('widget');
    expect(resolveOwnerScopeName(snapshot, 'e', [], 'main')).toBe('e');
  });
});

describe('getCallableSignature', () => {
  test('returns .parameters for a regular function', () => {
    const sig = getCallableSignature(snapshot, 'enemy', 'takedamage');
    expect(sig?.params.map((p) => p.name)).toEqual(['amount']);
  });

  test('falls back to a fullScope filter for a constructor', () => {
    // must return the real 'hp' param, not the empty [] on the guard FunctionSymbol
    const sig = getCallableSignature(snapshot, 'enemy', 'constructor');
    expect(sig?.params.map((p) => p.name)).toEqual(['hp']);
  });

  test('returns undefined for an unknown callable', () => {
    expect(getCallableSignature(snapshot, 'enemy', 'nope')).toBeUndefined();
  });
});

describe('case-insensitivity', () => {
  test('all lookups are case-insensitive', () => {
    expect(resolveOwnerScopeName(snapshot, 'ENEMIES', [], 'MAIN')).toBe('enemy');
    expect(resolveOwnerScopeName(snapshot, 'Enemies', [], 'Main')).toBe('enemy');
    expect(getMembers(snapshot, 'ENEMY').map((m) => m.name)).toEqual(
      expect.arrayContaining(['hp', 'takedamage'])
    );
    expect(getCallableSignature(snapshot, 'ENEMY', 'TAKEDAMAGE')?.params.map((p) => p.name)).toEqual(['amount']);
  });
});
