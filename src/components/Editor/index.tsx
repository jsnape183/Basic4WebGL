import React, { useState, useEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { IFile } from '../../features/files/filesSlice';
import getMonacoConfig from '../../monacoHelpers';

type SBEditorProps = {
  file: IFile | undefined;
  height: string;
  onChange: (source: string | undefined) => void;
};

const SBEditor: React.FC<SBEditorProps> = ({ file, height, onChange }) => {
  const monaco = useMonaco();
  const [languageLoaded, setLanguageLoaded] = useState(false);

  // Hooks must be called unconditionally — above early returns
  useEffect(() => {
    if (!monaco) return;
    monaco.languages.register({ id: 'softBasic' });
    monaco.languages.setMonarchTokensProvider('softBasic', {
      tokenizer: { root: [...getMonacoConfig().tokens] },
    });
    monaco.editor.defineTheme('softBasicTheme', getMonacoConfig().theme);
    setLanguageLoaded(true);
  }, [monaco]);

  if (!file) {
    return <p>File not found.</p>;
  }

  return (
    languageLoaded && (
      <Editor
        height={height}
        defaultValue=""
        language="softBasic"
        defaultLanguage="softBasic"
        theme="softBasicTheme"
        value={file.source}
        options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
        onChange={onChange}
      />
    )
  );
};

export default SBEditor;
