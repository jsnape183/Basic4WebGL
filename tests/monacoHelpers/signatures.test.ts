// tests/monacoHelpers/signatures.test.ts
import { describe, it, test, expect, vi } from 'vitest';
import { parseCallContext, registerSignatureHelpProvider } from '../../src/monacoHelpers/signatures';
import type { SymbolSnapshotEntry } from '../../src/lib/CompilerLib/symbols';
import type { SymbolContext } from '../../src/monacoHelpers/symbolCatalogue';

describe('parseCallContext', () => {
  it('identifies a module.method call with no args yet', () => {
    // "stage.add(" — cursor just after the opening paren
    const result = parseCallContext('stage.add(');
    expect(result).toEqual({ moduleName: 'stage', methodName: 'add', activeParameter: 0 });
  });

  it('identifies a module.method call with one arg', () => {
    // "math.atan2(dy, " — cursor after the comma, second param active
    const result = parseCallContext('math.atan2(dy, ');
    expect(result).toEqual({ moduleName: 'math', methodName: 'atan2', activeParameter: 1 });
  });

  it('identifies a module.method call with three args', () => {
    // "pen.setFillColor(255, 128, " — third param active
    const result = parseCallContext('pen.setFillColor(255, 128, ');
    expect(result).toEqual({ moduleName: 'pen', methodName: 'setfillcolor', activeParameter: 2 });
  });

  it('identifies a bare class constructor', () => {
    // "dim x as Sprite(" — no module, methodName = "sprite" (lowercased)
    const result = parseCallContext('dim x as Sprite(');
    expect(result).toEqual({ moduleName: undefined, methodName: 'sprite', activeParameter: 0 });
  });

  it('handles nested parens by tracking only the innermost call', () => {
    // "stage.add(bunny.getX(" — cursor is INSIDE bunny.getX(, so result should be bunny.getX
    const result = parseCallContext('stage.add(bunny.getX(');
    expect(result).toEqual({ moduleName: 'bunny', methodName: 'getx', activeParameter: 0 });
  });

  it('returns null when there is no open paren', () => {
    expect(parseCallContext('stage.add')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseCallContext('')).toBeNull();
  });

  it('returns null when paren is closed before cursor', () => {
    // "stage.add(bunny)" — all parens balanced; no active call
    expect(parseCallContext('stage.add(bunny)')).toBeNull();
  });

  it('lowercases module and method names', () => {
    const result = parseCallContext('Math.Sin(');
    expect(result).toEqual({ moduleName: 'math', methodName: 'sin', activeParameter: 0 });
  });
});

// ─── registerSignatureHelpProvider: dynamic symbol resolution ─────────────────

function makeFakeMonaco() {
  let captured: any;
  const monaco = {
    languages: {
      registerSignatureHelpProvider: (_id: string, provider: any) => {
        captured = provider;
        return { dispose: vi.fn() };
      },
    },
  };
  return { monaco, getProvider: () => captured };
}

function makeModel(lines: string[]) {
  return {
    getLineContent: (n: number) => lines[n - 1] ?? '',
    getValue: () => lines.join('\n'),
  };
}

const snapshot: SymbolSnapshotEntry[] = [
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
];

function makeSymbolContext(activeFilename: string): SymbolContext {
  return { getSymbols: () => snapshot, getActiveFilename: () => activeFilename };
}

describe('registerSignatureHelpProvider dynamic resolution', () => {
  test('typing takedamage( shows amount as the active parameter', () => {
    const { monaco, getProvider } = makeFakeMonaco();
    registerSignatureHelpProvider(monaco as any, makeSymbolContext('enemy'));
    const provider = getProvider();

    const model = makeModel(['takedamage(']);
    const result = provider.provideSignatureHelp(model, { lineNumber: 1, column: 12 });

    expect(result).not.toBeNull();
    const sig = result.value.signatures[0];
    expect(sig.label).toContain('takedamage');
    expect(sig.parameters.map((p: any) => p.label)).toEqual(['amount']);
  });

  test('typing new Enemy( shows the real constructor param (hp), not an empty signature', () => {
    const { monaco, getProvider } = makeFakeMonaco();
    registerSignatureHelpProvider(monaco as any, makeSymbolContext('main'));
    const provider = getProvider();

    const model = makeModel(['dim e = new Enemy(']);
    const result = provider.provideSignatureHelp(model, { lineNumber: 1, column: 19 });

    expect(result).not.toBeNull();
    const sig = result.value.signatures[0];
    expect(sig.label).toContain('Enemy');
    expect(sig.parameters.map((p: any) => p.label)).toEqual(['hp']);
  });

  test('returns null for an unknown bare callable', () => {
    const { monaco, getProvider } = makeFakeMonaco();
    registerSignatureHelpProvider(monaco as any, makeSymbolContext('main'));
    const provider = getProvider();

    const model = makeModel(['nope(']);
    expect(provider.provideSignatureHelp(model, { lineNumber: 1, column: 6 })).toBeNull();
  });
});
