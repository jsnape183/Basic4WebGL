// src/monacoHelpers/signatures.ts
import type { Monaco } from '@monaco-editor/react';
import { getModuleMethod, getConstructor } from './catalogue';

export interface CallContext {
  moduleName?: string;
  methodName: string;
  activeParameter: number;
}

/**
 * Scans backward through `textBeforeCursor` to find the opening paren of the
 * innermost active function call, counting commas at that depth to determine
 * which parameter is active.
 *
 * Returns a CallContext or null if no open call site is found.
 */
export function parseCallContext(textBeforeCursor: string): CallContext | null {
  let depth = 0;
  let parenIndex = -1;
  let activeParameter = 0;

  for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
    const ch = textBeforeCursor[i];
    if (ch === ')') {
      depth++;
    } else if (ch === '(') {
      if (depth === 0) {
        parenIndex = i;
        break;
      }
      depth--;
    } else if (ch === ',' && depth === 0) {
      activeParameter++;
    }
  }

  if (parenIndex < 0) return null;

  const beforeParen = textBeforeCursor.substring(0, parenIndex).trimEnd();

  // "module.method" pattern
  const dotMatch = beforeParen.match(/(\w+)\.(\w+)$/);
  if (dotMatch) {
    return {
      moduleName: dotMatch[1].toLowerCase(),
      methodName: dotMatch[2].toLowerCase(),
      activeParameter,
    };
  }

  // Bare word — class constructor or unqualified function
  const wordMatch = beforeParen.match(/(\w+)$/);
  if (wordMatch) {
    return {
      methodName: wordMatch[1].toLowerCase(),
      activeParameter,
    };
  }

  return null;
}

export function registerSignatureHelpProvider(monaco: Monaco): { dispose(): void } {
  return monaco.languages.registerSignatureHelpProvider('softBasic', {
    signatureHelpTriggerCharacters: ['(', ','],
    provideSignatureHelp(model, position) {
      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeCursor = lineContent.substring(0, position.column - 1);
      const ctx = parseCallContext(textBeforeCursor);
      if (!ctx) return null;

      let method;
      let signatureLabel: string;

      if (ctx.moduleName) {
        method = getModuleMethod(ctx.moduleName, ctx.methodName);
        if (!method) return null;
        signatureLabel = `${ctx.moduleName}.${method.name}(${method.params.join(', ')})`;
      } else {
        // Try as a class constructor (e.g., Sprite, Text)
        method = getConstructor(ctx.methodName);
        if (!method) return null;
        const className =
          ctx.methodName.charAt(0).toUpperCase() + ctx.methodName.slice(1);
        signatureLabel = `${className}(${method.params.join(', ')})`;
      }

      const activeParameter = method.params.length > 0
        ? Math.min(ctx.activeParameter, method.params.length - 1)
        : 0;

      return {
        value: {
          signatures: [
            {
              label: signatureLabel,
              documentation: method.description,
              parameters: method.params.map(p => ({ label: p })),
            },
          ],
          activeSignature: 0,
          activeParameter,
        },
        dispose: () => {},
      };
    },
  });
}
