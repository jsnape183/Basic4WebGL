// tests/monacoHelpers/hover.test.ts
import { describe, it, test, expect, vi } from 'vitest';
import { parseHoverContext, registerHoverProvider } from '../../src/monacoHelpers/hover';
import type { SymbolSnapshotEntry } from '../../src/lib/CompilerLib/symbols';
import type { SymbolContext } from '../../src/monacoHelpers/symbolCatalogue';

// Monaco word ranges use 1-based columns.
// startColumn is the column of the first character of the word.

describe('parseHoverContext', () => {
  it('identifies module.method when cursor is over the method', () => {
    // "stage.add(bunny)" — "add" starts at column 7 (1-based)
    const word = { word: 'add', startColumn: 7 };
    const result = parseHoverContext('stage.add(bunny)', word);
    expect(result).toEqual({ moduleName: 'stage', methodName: 'add' });
  });

  it('identifies module.method mid-line', () => {
    // "    result = math.sin(x)" — "sin" starts at column 19
    const line = '    result = math.sin(x)';
    const word = { word: 'sin', startColumn: 19 };
    const result = parseHoverContext(line, word);
    expect(result).toEqual({ moduleName: 'math', methodName: 'sin' });
  });

  it('lowercases both module and method names', () => {
    const word = { word: 'Sin', startColumn: 6 };
    const result = parseHoverContext('math.Sin(x)', word);
    expect(result).toEqual({ moduleName: 'math', methodName: 'sin' });
  });

  it('returns null when char before word is not a dot', () => {
    // Hovering over a plain variable name
    const word = { word: 'bunny', startColumn: 5 };
    expect(parseHoverContext('dim bunny', word)).toBeNull();
  });

  it('returns null when word is at column 1 (nothing before it)', () => {
    const word = { word: 'stage', startColumn: 1 };
    expect(parseHoverContext('stage', word)).toBeNull();
  });

  it('returns null when dot is at the very start (no module before it)', () => {
    // ".add(x)" — dot is at column 1, word "add" starts at column 2
    const word = { word: 'add', startColumn: 2 };
    expect(parseHoverContext('.add(x)', word)).toBeNull();
  });
});

// ─── registerHoverProvider: dynamic symbol resolution ─────────────────────────

function makeFakeMonaco() {
  let captured: any;
  const monaco = {
    languages: {
      registerHoverProvider: (_id: string, provider: any) => {
        captured = provider;
        return { dispose: vi.fn() };
      },
    },
  };
  return { monaco, getProvider: () => captured };
}

function makeModel(lines: string[], word: { word: string; startColumn: number }) {
  return {
    getWordAtPosition: () => word,
    getLineContent: (n: number) => lines[n - 1] ?? '',
    getValue: () => lines.join('\n'),
  };
}

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
  { name: 'main', kind: 'Module', scopeName: '', scopeType: '', fullScope: '' },
  { name: 'e', kind: 'Object', scopeName: 'main', scopeType: 'Module', fullScope: 'main', className: 'enemy' },
];

function makeSymbolContext(activeFilename: string): SymbolContext {
  return { getSymbols: () => snapshot, getActiveFilename: () => activeFilename };
}

describe('registerHoverProvider dynamic resolution', () => {
  test('hovering a user function name shows its signature', () => {
    const { monaco, getProvider } = makeFakeMonaco();
    registerHoverProvider(monaco as any, makeSymbolContext('enemy'));
    const provider = getProvider();

    const word = { word: 'takedamage', startColumn: 1 };
    const model = makeModel(['takedamage(5)'], word);
    const hover = provider.provideHover(model, { lineNumber: 1, column: 1 });

    expect(hover).not.toBeNull();
    expect(hover.contents[0].value).toContain('takedamage');
    expect(hover.contents[0].value).toContain('amount');
  });

  test("hovering a variable shows its kind/class", () => {
    const { monaco, getProvider } = makeFakeMonaco();
    registerHoverProvider(monaco as any, makeSymbolContext('main'));
    const provider = getProvider();

    const word = { word: 'e', startColumn: 1 };
    const model = makeModel(['e.takedamage(5)'], word);
    const hover = provider.provideHover(model, { lineNumber: 1, column: 1 });

    expect(hover).not.toBeNull();
    expect(hover.contents[0].value).toContain('e');
    expect(hover.contents[0].value).toContain('enemy');
  });

  test('returns null for an unknown bare word', () => {
    const { monaco, getProvider } = makeFakeMonaco();
    registerHoverProvider(monaco as any, makeSymbolContext('main'));
    const provider = getProvider();

    const word = { word: 'nope', startColumn: 1 };
    const model = makeModel(['nope'], word);
    expect(provider.provideHover(model, { lineNumber: 1, column: 1 })).toBeNull();
  });

  test('static getConstructor result still wins over a same-named dynamic symbol', () => {
    const { monaco, getProvider } = makeFakeMonaco();
    // 'sprite' is a real static catalogue class; shadow it dynamically too.
    const shadowingSnapshot: SymbolSnapshotEntry[] = [
      ...snapshot,
      { name: 'sprite', kind: 'Class', scopeName: '', scopeType: '', fullScope: '' },
    ];
    const symbolContext: SymbolContext = { getSymbols: () => shadowingSnapshot, getActiveFilename: () => 'main' };
    registerHoverProvider(monaco as any, symbolContext);
    const provider = getProvider();

    const word = { word: 'sprite', startColumn: 1 };
    const model = makeModel(['sprite'], word);
    const hover = provider.provideHover(model, { lineNumber: 1, column: 1 });

    expect(hover).not.toBeNull();
    // Static constructor entry formats the class name capitalized ("Sprite"), which
    // the dynamic bare-word branch (kind/class label) would not produce.
    expect(hover.contents[0].value).toContain('Sprite(');
  });
});
