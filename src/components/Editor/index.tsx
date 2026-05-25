// src/components/Editor/index.tsx
import React, { useState, useEffect } from 'react';
import Editor, { useMonaco, OnMount } from '@monaco-editor/react';
import { IFile } from '../../features/files/filesSlice';
import { buildMonarchRules, buildLanguageConfig, getMonacoTheme } from '../../monacoHelpers';
import { registerCompletionProvider } from '../../monacoHelpers/completions';
import { registerHoverProvider } from '../../monacoHelpers/hover';
import { registerSignatureHelpProvider } from '../../monacoHelpers/signatures';

type SBEditorProps = {
  file: IFile | undefined;
  height: string;
  onChange: (source: string | undefined) => void;
  onCursorChange?: (line: number, col: number) => void;
};

const SBEditor: React.FC<SBEditorProps> = ({ file, height, onChange, onCursorChange }) => {
  const monaco = useMonaco();
  const [languageLoaded, setLanguageLoaded] = useState(false);

  useEffect(() => {
    if (!monaco) return;

    monaco.languages.register({ id: 'softBasic' });
    monaco.languages.setMonarchTokensProvider('softBasic', buildMonarchRules());
    monaco.languages.setLanguageConfiguration('softBasic', buildLanguageConfig());
    monaco.editor.defineTheme('softBasicTheme', getMonacoTheme());

    const completionDisposable = registerCompletionProvider(monaco);
    const hoverDisposable = registerHoverProvider(monaco);
    const signatureDisposable = registerSignatureHelpProvider(monaco);

    setLanguageLoaded(true);

    return () => {
      completionDisposable.dispose();
      hoverDisposable.dispose();
      signatureDisposable.dispose();
    };
  }, [monaco]);

  const handleMount: OnMount = (editor) => {
    editor.onDidChangeCursorPosition((e) => {
      onCursorChange?.(e.position.lineNumber, e.position.column);
    });
  };

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
