// src/monacoHelpers/signatures.ts
import type { Monaco } from '@monaco-editor/react';
import { getModuleMethod, getConstructor } from './catalogue';
import { scanEnclosingScope } from './scopeScanner';
import { getVisibleSymbols, getCallableSignature, type SymbolContext } from './symbolCatalogue';
import { symbolTypes } from '../lib/Basic4WebGL/symbolTypes';

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

/** Dynamic (user-defined) equivalent of a `CatalogueMethod`, for the bare-word branch. */
type DynamicCallable = { label: string; params: string[]; description: string };

/**
 * Resolves a bare-word call context (`ctx.moduleName` undefined) against the
 * dynamic symbol snapshot. Two shapes are tried:
 *   - a plain function call visible at the cursor scope (`takedamage(`)
 *   - a class constructor call (`new Enemy(` — `ctx.methodName` is the lowercased
 *     class name; `getCallableSignature` handles the `.parameters`-is-unreliable
 *     constructor caveat internally)
 */
function resolveDynamicCallable(
  symbolContext: SymbolContext,
  model: { getValue(): string },
  position: { lineNumber: number; column: number },
  methodName: string
): DynamicCallable | undefined {
  const symbols = symbolContext.getSymbols();
  const activeFilename = symbolContext.getActiveFilename() ?? '';
  const scopeStack = scanEnclosingScope(model.getValue(), position.lineNumber, position.column);
  const visible = getVisibleSymbols(symbols, activeFilename, scopeStack);

  const fnSymbol = visible.find(
    (s) => s.kind === symbolTypes.Function && s.name.toLowerCase() === methodName
  );
  if (fnSymbol) {
    const sig = getCallableSignature(symbols, fnSymbol.scopeName, fnSymbol.name);
    if (sig) {
      return { label: `${sig.name}(${sig.params.map((p) => p.name).join(', ')})`, params: sig.params.map((p) => p.name), description: '' };
    }
  }

  const classSymbol = symbols.find((s) => s.kind === symbolTypes.Class && s.name.toLowerCase() === methodName);
  if (classSymbol) {
    const sig = getCallableSignature(symbols, classSymbol.name, 'constructor');
    if (sig) {
      const className = classSymbol.name.charAt(0).toUpperCase() + classSymbol.name.slice(1);
      return { label: `${className}(${sig.params.map((p) => p.name).join(', ')})`, params: sig.params.map((p) => p.name), description: '' };
    }
  }

  return undefined;
}

export function registerSignatureHelpProvider(monaco: Monaco, symbolContext?: SymbolContext): { dispose(): void } {
  return monaco.languages.registerSignatureHelpProvider('softBasic', {
    signatureHelpTriggerCharacters: ['(', ','],
    provideSignatureHelp(model, position) {
      const lineContent = model.getLineContent(position.lineNumber);
      const textBeforeCursor = lineContent.substring(0, position.column - 1);
      const ctx = parseCallContext(textBeforeCursor);
      if (!ctx) return null;

      let signatureLabel: string;
      let params: string[];
      let description: string;

      if (ctx.moduleName) {
        const method = getModuleMethod(ctx.moduleName, ctx.methodName);
        if (!method) return null;
        signatureLabel = `${ctx.moduleName}.${method.name}(${method.params.join(', ')})`;
        params = method.params;
        description = method.description;
      } else {
        // Try as a class constructor (e.g., Sprite, Text)
        const ctor = getConstructor(ctx.methodName);
        if (ctor) {
          const className =
            ctx.methodName.charAt(0).toUpperCase() + ctx.methodName.slice(1);
          signatureLabel = `${className}(${ctor.params.join(', ')})`;
          params = ctor.params;
          description = ctor.description;
        } else {
          // Dynamic fallback: a user-defined function or class constructor.
          const dynamic = symbolContext && resolveDynamicCallable(symbolContext, model, position, ctx.methodName);
          if (!dynamic) return null;
          signatureLabel = dynamic.label;
          params = dynamic.params;
          description = dynamic.description;
        }
      }

      const activeParameter = params.length > 0
        ? Math.min(ctx.activeParameter, params.length - 1)
        : 0;

      return {
        value: {
          signatures: [
            {
              label: signatureLabel,
              documentation: description,
              parameters: params.map(p => ({ label: p })),
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
