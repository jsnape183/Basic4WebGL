// @vitest-environment jsdom
import React from 'react';
import { render } from '@testing-library/react';
import { vi, afterEach, describe, test, expect } from 'vitest';
import SBEditor from '../../../../src/components/Editor';
import { IFile } from '../../../../src/features/files/filesSlice';
import { Diagnostic } from '../../../../src/lib/CompilerLib/compiler/types';
import { SymbolSnapshotEntry } from '../../../../src/lib/CompilerLib/symbols';

const fakeModel = { getLineMaxColumn: () => 40 };
const fakeEditor = {
  setPosition: vi.fn(),
  revealPositionInCenter: vi.fn(),
  focus: vi.fn(),
  getModel: () => fakeModel,
  onDidChangeCursorPosition: vi.fn(),
};
const setModelMarkers = vi.fn();

vi.mock('@monaco-editor/react', () => ({
  default: ({ onMount }: any) => {
    onMount?.(fakeEditor, {});
    return null;
  },
  useMonaco: () => ({
    languages: {
      register: vi.fn(),
      setMonarchTokensProvider: vi.fn(() => ({ dispose: vi.fn() })),
      setLanguageConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
    },
    editor: {
      defineTheme: vi.fn(),
      setModelMarkers,
    },
    MarkerSeverity: { Error: 8 },
  }),
}));

const registerCompletionProvider = vi.fn(() => ({ dispose: vi.fn() }));
const registerHoverProvider = vi.fn(() => ({ dispose: vi.fn() }));
const registerSignatureHelpProvider = vi.fn(() => ({ dispose: vi.fn() }));

vi.mock('../../../../src/monacoHelpers/completions', () => ({
  registerCompletionProvider: (...args: unknown[]) => registerCompletionProvider(...args),
}));
vi.mock('../../../../src/monacoHelpers/hover', () => ({
  registerHoverProvider: (...args: unknown[]) => registerHoverProvider(...args),
}));
vi.mock('../../../../src/monacoHelpers/signatures', () => ({
  registerSignatureHelpProvider: (...args: unknown[]) => registerSignatureHelpProvider(...args),
}));

// Real IFile.name values include the '.bas' extension and original casing
// (see createProjectWithMainFile.ts: `name: 'Main.bas'`) — the fixture must
// match that shape, since the whole point of the tests below is to verify
// the extension gets stripped before reaching the symbol table lookups.
const file: IFile = {
  id: 'f1',
  name: 'Main.bas',
  source: 'print "hi"',
  projectId: 'p1',
  folderId: null,
  fullName: 'Main.bas',
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('SBEditor diagnostics + jumpTo', () => {
  test('a diagnostic in the active file results in one marker', () => {
    const diagnostics: Diagnostic[] = [
      { message: 'Undefined variable', severity: 'error', loc: { line: 1, col: 1, filename: 'Main.bas' } },
    ];
    render(<SBEditor file={file} height="100%" onChange={() => {}} diagnostics={diagnostics} />);
    expect(setModelMarkers).toHaveBeenCalled();
    const markers = setModelMarkers.mock.calls[setModelMarkers.mock.calls.length - 1][2];
    expect(markers).toHaveLength(1);
  });

  test('a diagnostic for a different file results in no markers', () => {
    const diagnostics: Diagnostic[] = [
      { message: 'Undefined variable', severity: 'error', loc: { line: 1, col: 1, filename: 'Other' } },
    ];
    render(<SBEditor file={file} height="100%" onChange={() => {}} diagnostics={diagnostics} />);
    expect(setModelMarkers).toHaveBeenCalled();
    const markers = setModelMarkers.mock.calls[setModelMarkers.mock.calls.length - 1][2];
    expect(markers).toHaveLength(0);
  });

  test('jumpTo moves the cursor, reveals it, and focuses the editor', () => {
    render(
      <SBEditor
        file={file}
        height="100%"
        onChange={() => {}}
        jumpTo={{ line: 7, col: 3 }}
      />
    );
    expect(fakeEditor.setPosition).toHaveBeenCalledWith({ lineNumber: 7, column: 3 });
    expect(fakeEditor.revealPositionInCenter).toHaveBeenCalledWith({ lineNumber: 7, column: 3 });
    expect(fakeEditor.focus).toHaveBeenCalled();
  });

  test('no jumpTo does not move the cursor', () => {
    render(<SBEditor file={file} height="100%" onChange={() => {}} />);
    expect(fakeEditor.setPosition).not.toHaveBeenCalled();
    expect(fakeEditor.revealPositionInCenter).not.toHaveBeenCalled();
  });
});

describe('SBEditor symbols prop', () => {
  test('a symbols prop flows into the SymbolContext passed to every register*Provider call', () => {
    const symbols: SymbolSnapshotEntry[] = [
      { name: 'score', kind: 'Variable', scopeName: '', scopeType: '', fullScope: '' },
    ];
    render(<SBEditor file={file} height="100%" onChange={() => {}} symbols={symbols} />);

    expect(registerCompletionProvider).toHaveBeenCalled();
    expect(registerHoverProvider).toHaveBeenCalled();
    expect(registerSignatureHelpProvider).toHaveBeenCalled();

    for (const spy of [registerCompletionProvider, registerHoverProvider, registerSignatureHelpProvider]) {
      const symbolContext = spy.mock.calls[spy.mock.calls.length - 1][1] as {
        getSymbols(): SymbolSnapshotEntry[];
        getActiveFilename(): string | undefined;
      };
      expect(symbolContext.getSymbols()).toEqual(symbols);
      // Symbol table scope names are always the extension-stripped, lowercased
      // filename (lexer/index.ts: `f.name.replace('.bas', '').toLowerCase()`),
      // so getActiveFilename() must match that shape, not the raw IFile.name.
      expect(symbolContext.getActiveFilename()).toBe('main');
    }
  });

  test('getActiveFilename strips the .bas extension and lowercases, matching the symbol table\'s scope-name convention', () => {
    render(<SBEditor file={file} height="100%" onChange={() => {}} symbols={[]} />);
    const symbolContext = registerCompletionProvider.mock.calls[
      registerCompletionProvider.mock.calls.length - 1
    ][1] as { getActiveFilename(): string | undefined };
    expect(symbolContext.getActiveFilename()).toBe('main');
  });

  test('the SymbolContext reflects the latest symbols prop without re-registering providers', () => {
    const initial: SymbolSnapshotEntry[] = [];
    const { rerender } = render(<SBEditor file={file} height="100%" onChange={() => {}} symbols={initial} />);

    const symbolContext = registerCompletionProvider.mock.calls[
      registerCompletionProvider.mock.calls.length - 1
    ][1] as { getSymbols(): SymbolSnapshotEntry[] };
    expect(symbolContext.getSymbols()).toEqual([]);

    const updated: SymbolSnapshotEntry[] = [
      { name: 'score', kind: 'Variable', scopeName: '', scopeType: '', fullScope: '' },
    ];
    rerender(<SBEditor file={file} height="100%" onChange={() => {}} symbols={updated} />);

    // Same accessor object (captured once at registration time) now reads the new value.
    expect(symbolContext.getSymbols()).toEqual(updated);
  });

  test('no symbols prop still passes a SymbolContext that returns an empty array', () => {
    render(<SBEditor file={file} height="100%" onChange={() => {}} />);
    const symbolContext = registerCompletionProvider.mock.calls[
      registerCompletionProvider.mock.calls.length - 1
    ][1] as { getSymbols(): SymbolSnapshotEntry[] };
    expect(symbolContext.getSymbols()).toEqual([]);
  });
});
