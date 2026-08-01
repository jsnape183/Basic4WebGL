// src/components/Editor/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import Editor, { useMonaco, OnMount } from '@monaco-editor/react';
import type * as monacoT from 'monaco-editor';
import { IFile } from '../../features/files/filesSlice';
import { buildMonarchRules, buildLanguageConfig, getMonacoTheme } from '../../monacoHelpers';
import { registerCompletionProvider } from '../../monacoHelpers/completions';
import { registerHoverProvider } from '../../monacoHelpers/hover';
import { registerSignatureHelpProvider } from '../../monacoHelpers/signatures';
import { toMarkers } from '../../monacoHelpers/diagnostics';
import { Diagnostic } from '../../lib/CompilerLib/compiler/types';

type SBEditorProps = {
  file: IFile | undefined;
  height: string;
  onChange: (source: string | undefined) => void;
  onCursorChange?: (line: number, col: number) => void;
  diagnostics?: Diagnostic[];
  jumpTo?: { line: number; col: number } | null;
};

const SBEditor: React.FC<SBEditorProps> = ({ file, height, onChange, onCursorChange, diagnostics, jumpTo }) => {
  const monaco = useMonaco();
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const editorRef = useRef<monacoT.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!monaco) return;

    monaco.languages.register({ id: 'softBasic' });
    const monarchDisposable = monaco.languages.setMonarchTokensProvider('softBasic', buildMonarchRules());
    const languageConfigDisposable = monaco.languages.setLanguageConfiguration('softBasic', buildLanguageConfig());
    monaco.editor.defineTheme('softBasicTheme', getMonacoTheme());

    const completionDisposable = registerCompletionProvider(monaco);
    const hoverDisposable = registerHoverProvider(monaco);
    const signatureDisposable = registerSignatureHelpProvider(monaco);

    setLanguageLoaded(true);

    return () => {
      monarchDisposable.dispose();
      languageConfigDisposable.dispose();
      completionDisposable.dispose();
      hoverDisposable.dispose();
      signatureDisposable.dispose();
    };
  }, [monaco]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      onCursorChange?.(e.position.lineNumber, e.position.column);
    });
    setEditorReady(true);
  };

  useEffect(() => {
    const ed = editorRef.current;
    const model = ed?.getModel();
    if (!monaco || !ed || !model || !file) return;
    const markers = toMarkers(diagnostics ?? [], model, file.name, monaco);
    monaco.editor.setModelMarkers(model, 'softbasic', markers);
  }, [monaco, diagnostics, file?.id, editorReady]);

  useEffect(() => {
    if (!jumpTo || !editorRef.current) return;
    editorRef.current.setPosition({ lineNumber: jumpTo.line, column: jumpTo.col });
    editorRef.current.revealPositionInCenter({ lineNumber: jumpTo.line, column: jumpTo.col });
    editorRef.current.focus();
  }, [jumpTo, editorReady]);

  if (!file) {
    return <p>File not found.</p>;
  }

  if (!languageLoaded) return null;

  return (
    <Editor
      height={height}
      defaultValue=""
      language="softBasic"
      defaultLanguage="softBasic"
      theme="softBasicTheme"
      value={file.source}
      options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
      onChange={onChange}
      onMount={handleMount}
    />
  );
};

export default SBEditor;
