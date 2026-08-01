// tests/monacoHelpers/completions.test.ts
import { describe, it, test, expect, vi } from 'vitest';
import { parseCompletionModule, registerCompletionProvider } from '../../src/monacoHelpers/completions';
import type { SymbolSnapshotEntry } from '../../src/lib/CompilerLib/symbols';
import type { SymbolContext } from '../../src/monacoHelpers/symbolCatalogue';

describe('parseCompletionModule', () => {
  it('extracts module name from "math."', () => {
    expect(parseCompletionModule('math.')).toBe('math');
  });

  it('extracts module name from mid-line text', () => {
    expect(parseCompletionModule('dim x = math.')).toBe('math');
  });

  it('extracts module name from "stage."', () => {
    expect(parseCompletionModule('stage.')).toBe('stage');
  });

  it('lowercases the module name', () => {
    expect(parseCompletionModule('Math.')).toBe('math');
    expect(parseCompletionModule('STAGE.')).toBe('stage');
  });

  it('returns null when there is no dot', () => {
    expect(parseCompletionModule('math')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseCompletionModule('')).toBeNull();
  });

  it('returns null when dot is not at the end', () => {
    // "math.sin" — dot is in the middle, cursor is after "sin" not after "."
    expect(parseCompletionModule('math.sin')).toBeNull();
  });
});

// ─── registerCompletionProvider: dynamic symbol resolution ───────────────────

type FakeMonaco = {
  languages: {
    registerCompletionItemProvider: (id: string, provider: any) => { dispose(): void };
    CompletionItemKind: Record<string, number>;
    CompletionItemInsertTextRule: Record<string, number>;
  };
};

function makeFakeMonaco(): { monaco: FakeMonaco; getProvider: () => any } {
  let captured: any;
  const monaco: FakeMonaco = {
    languages: {
      registerCompletionItemProvider: (_id, provider) => {
        captured = provider;
        return { dispose: vi.fn() };
      },
      CompletionItemKind: { Method: 0, Function: 1, Variable: 2, Class: 3, Module: 4 },
      CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
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

// A small fixture: an 'enemy' class (hp field, takedamage(amount) method) and a
// 'main' file with `dim e as enemy` (Object cloned into scope 'e').
const snapshot: SymbolSnapshotEntry[] = [
  { name: 'enemy', kind: 'Class', scopeName: '', scopeType: '', fullScope: '' },
  { name: 'hp', kind: 'Variable', scopeName: 'enemy', scopeType: 'Class', fullScope: 'enemy' },
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
  {
    name: 'takedamage',
    kind: 'Function',
    scopeName: 'e',
    scopeType: 'Object',
    fullScope: 'main.e',
    parameters: [{ name: 'amount' }],
  },
  // Dynamic module conflicting in name with the static 'math' catalogue entry —
  // the static entry must still win.
  { name: 'math', kind: 'Module', scopeName: '', scopeType: '', fullScope: '' },
  { name: 'bogus', kind: 'Function', scopeName: 'math', scopeType: 'Module', fullScope: 'math', parameters: [] },
];

function makeSymbolContext(activeFilename: string): SymbolContext {
  return { getSymbols: () => snapshot, getActiveFilename: () => activeFilename };
}

describe('registerCompletionProvider dynamic resolution', () => {
  test('bare-word branch returns dynamic symbols visible at the cursor', () => {
    const { monaco, getProvider } = makeFakeMonaco();
    registerCompletionProvider(monaco as any, makeSymbolContext('enemy'));
    const provider = getProvider();

    const model = makeModel(['function takedamage(amount)', '  self.hp = self.hp - amo']);
    const position = { lineNumber: 2, column: 27 };
    const result = provider.provideCompletionItems(model, position);

    const labels = result.suggestions.map((s: any) => s.label);
    expect(labels).toContain('hp');
    expect(labels).toContain('amount'); // scope-stack frame: inside takedamage
    expect(labels).not.toContain('e'); // different file's module scope
  });

  test('dot-context falls back to dynamic resolution when the module is not in the static catalogue', () => {
    const { monaco, getProvider } = makeFakeMonaco();
    registerCompletionProvider(monaco as any, makeSymbolContext('main'));
    const provider = getProvider();

    const model = makeModel(['e.']);
    const position = { lineNumber: 1, column: 3 };
    const result = provider.provideCompletionItems(model, position);

    const labels = result.suggestions.map((s: any) => s.label);
    expect(labels).toContain('hp');
    expect(labels).toContain('takedamage');
  });

  test('static catalogue wins over a same-named dynamic module', () => {
    const { monaco, getProvider } = makeFakeMonaco();
    registerCompletionProvider(monaco as any, makeSymbolContext('main'));
    const provider = getProvider();

    const model = makeModel(['math.']);
    const position = { lineNumber: 1, column: 6 };
    const result = provider.provideCompletionItems(model, position);

    const labels = result.suggestions.map((s: any) => s.label);
    expect(labels).toContain('floor'); // static math module
    expect(labels).not.toContain('bogus'); // dynamic 'math' module member, shadowed
  });
});
