// src/monacoHelpers/hover.ts
import type { Monaco } from '@monaco-editor/react';
import { getModuleMethod, getConstructor } from './catalogue';
import { scanEnclosingScope } from './scopeScanner';
import { getVisibleSymbols, type SymbolContext } from './symbolCatalogue';
import { symbolTypes } from '../lib/Basic4WebGL/symbolTypes';

/**
 * Given a line of source and a word range (Monaco 1-based columns),
 * checks whether the word is immediately preceded by '.' and extracts
 * the module name from the text before the dot.
 *
 * Returns { moduleName, methodName } or null if the pattern does not match.
 */
export function parseHoverContext(
  lineContent: string,
  word: { word: string; startColumn: number }
): { moduleName: string; methodName: string } | null {
  // startColumn is 1-based: the char immediately before the word is at index (startColumn - 2)
  const charBefore = lineContent[word.startColumn - 2];
  if (charBefore !== '.') return null;

  // Extract the module name — the word immediately before the dot
  const textBeforeDot = lineContent.substring(0, word.startColumn - 2);
  const moduleMatch = textBeforeDot.match(/(\w+)$/);
  if (!moduleMatch) return null;

  return {
    moduleName: moduleMatch[1].toLowerCase(),
    methodName: word.word.toLowerCase(),
  };
}

export function registerHoverProvider(monaco: Monaco, symbolContext?: SymbolContext): { dispose(): void } {
  return monaco.languages.registerHoverProvider('softBasic', {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const lineContent = model.getLineContent(position.lineNumber);

      // Case 1: hovering over the method in a "module.method" expression
      const ctx = parseHoverContext(lineContent, word);
      if (ctx) {
        const method = getModuleMethod(ctx.moduleName, ctx.methodName);
        if (!method) return null;
        return {
          contents: [
            { value: `**${ctx.moduleName}.${method.name}(${method.params.join(', ')})**` },
            { value: method.description },
          ],
        };
      }

      // Case 2: hovering over a bare class name — show the constructor signature
      const ctor = getConstructor(word.word.toLowerCase());
      if (ctor) {
        const className = word.word.charAt(0).toUpperCase() + word.word.slice(1).toLowerCase();
        return {
          contents: [
            { value: `**${className}(${ctor.params.join(', ')})**` },
            { value: ctor.description },
          ],
        };
      }

      // Case 3: dynamic fallback — a user-defined function/variable/class visible
      // at the cursor. Static library results above always take priority.
      if (symbolContext) {
        const scopeStack = scanEnclosingScope(model.getValue(), position.lineNumber, position.column);
        const symbols = getVisibleSymbols(
          symbolContext.getSymbols(),
          symbolContext.getActiveFilename() ?? '',
          scopeStack
        );
        const match = symbols.find((s) => s.name.toLowerCase() === word.word.toLowerCase());
        if (match) {
          if (match.kind === symbolTypes.Function) {
            const params = (match.parameters ?? []).map((p) => p.name).join(', ');
            return { contents: [{ value: `**${match.name}(${params})**` }] };
          }
          const typeLabel = match.className ?? match.kind;
          return { contents: [{ value: `**${match.name}** : ${typeLabel}` }] };
        }
      }

      return null;
    },
  });
}
