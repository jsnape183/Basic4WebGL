// @vitest-environment jsdom
import React from 'react';
import { render } from '@testing-library/react';
import { vi, afterEach, describe, test, expect } from 'vitest';
import SBEditor from '../../../../src/components/Editor';
import { IFile } from '../../../../src/features/files/filesSlice';
import { Diagnostic } from '../../../../src/lib/CompilerLib/compiler/types';

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

vi.mock('../../../../src/monacoHelpers/completions', () => ({
  registerCompletionProvider: () => ({ dispose: vi.fn() }),
}));
vi.mock('../../../../src/monacoHelpers/hover', () => ({
  registerHoverProvider: () => ({ dispose: vi.fn() }),
}));
vi.mock('../../../../src/monacoHelpers/signatures', () => ({
  registerSignatureHelpProvider: () => ({ dispose: vi.fn() }),
}));

const file: IFile = {
  id: 'f1',
  name: 'Main',
  source: 'print "hi"',
  projectId: 'p1',
  folderId: null,
  fullName: 'Main',
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('SBEditor diagnostics + jumpTo', () => {
  test('a diagnostic in the active file results in one marker', () => {
    const diagnostics: Diagnostic[] = [
      { message: 'Undefined variable', severity: 'error', loc: { line: 1, col: 1, filename: 'Main' } },
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
