// tests/monacoHelpers/constantsEditorSupport.test.ts
import { describe, test, expect, vi } from 'vitest';
import type { SymbolSnapshotEntry } from '../../src/lib/CompilerLib/symbols';
import { getVisibleSymbols, getMembers, type SymbolContext } from '../../src/monacoHelpers/symbolCatalogue';
import { registerCompletionProvider } from '../../src/monacoHelpers/completions';
import { registerHoverProvider } from '../../src/monacoHelpers/hover';

const snapshot: SymbolSnapshotEntry[] = [
  { name: 'keyboard', kind: 'Module', scopeName: '', scopeType: '', fullScope: '' },
  {
    name: 'space',
    kind: 'Constant',
    scopeName: 'keyboard',
    scopeType: '',
    fullScope: 'keyboard',
    value: 32,
    valueKind: 'number',
  },
  {
    name: 'max_health',
    kind: 'Constant',
    scopeName: 'main',
    scopeType: '',
    fullScope: 'main',
    value: 100,
    valueKind: 'number',
  },
  {
    name: 'game_title',
    kind: 'Constant',
    scopeName: 'main',
    scopeType: '',
    fullScope: 'main',
    value: 'Dungeon',
    valueKind: 'string',
  },
];

// ─── data plumbing ───────────────────────────────────────────────────────────

describe('constants — editor data plumbing', () => {
  test('getMembers returns a module’s constants for dot-completion', () => {
    const members = getMembers(snapshot, 'keyboard');
    expect(members.map((m) => m.name)).toContain('space');
  });

  test('getVisibleSymbols surfaces a constant declared in the active file', () => {
    const visible = getVisibleSymbols(snapshot, 'main', []);
    expect(visible.map((s) => s.name)).toContain('max_health');
  });
});

// ─── provider-level: mocked monaco ───────────────────────────────────────────

function makeCompletionMonaco() {
  let captured: any;
  const monaco = {
    languages: {
      registerCompletionItemProvider: (_id: string, provider: any) => {
        captured = provider;
        return { dispose: vi.fn() };
      },
      CompletionItemKind: { Method: 0, Function: 1, Variable: 2, Class: 3, Module: 4, Constant: 5 },
      CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
    },
  };
  return { monaco, getProvider: () => captured };
}

function makeHoverMonaco() {
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

function makeModel(lines: string[], word?: { word: string; startColumn: number }) {
  return {
    getWordAtPosition: () => word ?? null,
    getLineContent: (n: number) => lines[n - 1] ?? '',
    getValue: () => lines.join('\n'),
  };
}

const symbolContext: SymbolContext = {
  getSymbols: () => snapshot,
  getActiveFilename: () => 'main',
};

describe('constants — completion provider', () => {
  test('a visible Constant produces a suggestion with CompletionItemKind.Constant', () => {
    const { monaco, getProvider } = makeCompletionMonaco();
    registerCompletionProvider(monaco as any, symbolContext);
    const provider = getProvider();

    const model = makeModel(['max']);
    const result = provider.provideCompletionItems(model, { lineNumber: 1, column: 4 });
    const item = result.suggestions.find((s: any) => s.label === 'max_health');
    expect(item).toBeDefined();
    expect(item.kind).toBe(monaco.languages.CompletionItemKind.Constant);
    expect(item.documentation).toContain('100');
  });

  test('a string constant shows its quoted value in documentation', () => {
    const { monaco, getProvider } = makeCompletionMonaco();
    registerCompletionProvider(monaco as any, symbolContext);
    const provider = getProvider();

    const model = makeModel(['game']);
    const result = provider.provideCompletionItems(model, { lineNumber: 1, column: 5 });
    const item = result.suggestions.find((s: any) => s.label === 'game_title');
    expect(item.documentation).toContain('"Dungeon"');
  });
});

describe('constants — hover provider', () => {
  test('bare word max_health shows its value', () => {
    const { monaco, getProvider } = makeHoverMonaco();
    registerHoverProvider(monaco as any, symbolContext);
    const provider = getProvider();

    const model = makeModel(['max_health'], { word: 'max_health', startColumn: 1 });
    const hover = provider.provideHover(model, { lineNumber: 1, column: 1 });
    expect(hover).not.toBeNull();
    expect(hover.contents[0].value).toContain('max_health');
    expect(hover.contents[0].value).toContain('100');
  });

  test('namespaced keyboard.space shows its value', () => {
    const { monaco, getProvider } = makeHoverMonaco();
    registerHoverProvider(monaco as any, symbolContext);
    const provider = getProvider();

    // "keyboard.space" — "space" starts at column 10 (1-based)
    const model = makeModel(['keyboard.space'], { word: 'space', startColumn: 10 });
    const hover = provider.provideHover(model, { lineNumber: 1, column: 10 });
    expect(hover).not.toBeNull();
    expect(hover.contents[0].value).toContain('keyboard.space');
    expect(hover.contents[0].value).toContain('32');
  });
});
