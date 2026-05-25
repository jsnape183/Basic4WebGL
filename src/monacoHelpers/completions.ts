// src/monacoHelpers/completions.ts
import type { Monaco } from '@monaco-editor/react';
import { getModuleMethods, isKnownModule } from './catalogue';
import type { CatalogueMethod } from './catalogue';

/**
 * Extracts the module name from text ending in "identifier.".
 * Returns the lowercased module name, or null if the pattern does not match.
 */
export function parseCompletionModule(textBeforeCursor: string): string | null {
  const match = textBeforeCursor.match(/(\w+)\.$/);
  if (!match) return null;
  return match[1].toLowerCase();
}

function buildSnippet(m: CatalogueMethod): string {
  if (m.params.length === 0) return `${m.name}()`;
  const paramSnippets = m.params.map((p, i) => `\${${i + 1}:${p}}`).join(', ');
  return `${m.name}(${paramSnippets})`;
}

export function registerCompletionProvider(monaco: Monaco): { dispose(): void } {
  return monaco.languages.registerCompletionItemProvider('softBasic', {
    triggerCharacters: ['.'],
    provideCompletionItems(model, position) {
      const lineContent = model.getLineContent(position.lineNumber);
      // position.column is 1-based and is AFTER the '.' trigger character
      const textBeforeCursor = lineContent.substring(0, position.column - 1);
      const moduleName = parseCompletionModule(textBeforeCursor);
      if (!moduleName || !isKnownModule(moduleName)) return { suggestions: [] };

      const methods = getModuleMethods(moduleName);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column,
        endColumn: position.column,
      };

      return {
        suggestions: methods.map(m => ({
          label: m.name,
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: buildSnippet(m),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: m.description,
          range,
        })),
      };
    },
  });
}
