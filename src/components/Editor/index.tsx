import React, { useState, useEffect } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";

import getMonacoConfig from "../../monacoHelpers";

type SBFileProps = {
  id: string;
  name: string;
  source: string;
  projectId: string;
};

type SBEditorProps = {
  file: SBFileProps | undefined;
  height: string;
  onChange: (source: string | undefined) => void;
};

const SBEditor: React.FC<SBEditorProps> = ({ file, height, onChange }) => {
  const monaco = useMonaco();
  const [languageLoaded, setLanguageLoaded] = useState(false);

  if (!file) {
    return <p>File not found.</p>;
  }

  useEffect(() => {
    if (!monaco) return;

    monaco.languages.register({ id: "softBasic" });
    // Register a tokens provider for the language
    monaco.languages.setMonarchTokensProvider("softBasic", {
      tokenizer: {
        root: [...getMonacoConfig().tokens],
      },
    });

    // Define a new theme that contains only rules that match this language
    monaco.editor.defineTheme("softBasicTheme", getMonacoConfig().theme);

    setLanguageLoaded(true);
  }, [monaco, setLanguageLoaded]);

  return (
    languageLoaded && (
      <Editor
        height={height}
        defaultValue=""
        language="softBasic"
        defaultLanguage="softBasic"
        theme="softBasicTheme"
        value={file.source}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          automaticLayout: true,
        }}
        onChange={onChange}
      />
    )
  );
};

export default SBEditor;
