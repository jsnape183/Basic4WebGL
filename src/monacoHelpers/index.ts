// src/monacoHelpers/index.ts
import { SOFTBASIC_KEYWORDS, SOFTBASIC_LIFECYCLE_EVENTS } from '../lib/Basic4WebGL/keywords';

export function buildMonarchRules() {
  return {
    keywords: SOFTBASIC_KEYWORDS,
    lifecycleEvents: SOFTBASIC_LIFECYCLE_EVENTS,
    tokenizer: {
      root: [
        // Comments — apostrophe to end of line
        [/'.*/, 'comment'],
        // String literals
        [/"[^"]*"/, 'string'],
        // Numeric literals (integer and decimal)
        [/[+-]?([0-9]*[.])?[0-9]+/, 'number'],
        // Identifiers — keywords, lifecycle events, plain identifiers
        [/[A-Za-z_][A-Za-z_$0-9]*/, {
          cases: {
            '@keywords': 'keyword',
            '@lifecycleEvents': 'type.identifier',
            '@default': 'identifier',
          },
        }],
        // Arithmetic and comparison operators
        [/<>|>=|<=|[+\-*/=<>]/, 'operator'],
        // Delimiters
        [/[(),.]/, 'delimiter'],
      ],
    },
  };
}

export function buildLanguageConfig() {
  return {
    comments: {
      lineComment: "'",
    },
    brackets: [
      ['(', ')'],
    ] as [string, string][],
    autoClosingPairs: [
      { open: '(', close: ')' },
      { open: '"', close: '"' },
    ],
    surroundingPairs: [
      { open: '(', close: ')' },
      { open: '"', close: '"' },
    ],
    indentationRules: {
      // Indent the next line when the current line starts with these keywords
      increaseIndentPattern: /^\s*(function|if|while|for|constructor)\b.*/i,
      // Outdent when the current line starts with an end-keyword
      decreaseIndentPattern: /^\s*(endfunction|endif|endwhile|endclass|next|endconstructor|until)\b/i,
    },
  };
}

export function getMonacoTheme() {
  return {
    base: 'vs-dark' as const,
    inherit: true,
    colors: {
      'editor.background': '#0b0b18',
      'editor.foreground': '#e0e0f0',
      'editor.lineHighlightBackground': '#12122a',
      'editor.selectionBackground': '#3030aa55',
      'editorCursor.foreground': '#6060dd',
      'editorLineNumber.foreground': '#4a4a88',
      'editorLineNumber.activeForeground': '#8888bb',
      'editor.inactiveSelectionBackground': '#1e1e4440',
      'editorIndentGuide.background': '#2a2a55',
      'editorIndentGuide.activeBackground': '#6060dd',
      'scrollbar.shadow': '#0b0b18',
      'scrollbarSlider.background': '#2a2a5566',
      'scrollbarSlider.hoverBackground': '#3030aa88',
    },
    rules: [
      { token: 'keyword', foreground: '8080ff', fontStyle: 'bold' },
      { token: 'type.identifier', foreground: 'cc9933' },  // lifecycle events — amber
      { token: 'comment', foreground: '4a4a88', fontStyle: 'italic' },
      { token: 'string', foreground: 'cc8866', fontStyle: 'italic' },
      { token: 'number', foreground: 'b5cea8' },
      { token: 'operator', foreground: '608b4e' },
      { token: 'delimiter', foreground: 'e0e0f0' },
    ],
  };
}

// Legacy default export removed — Editor/index.tsx imports named functions directly (wired in Task 8).
