// src/monacoHelpers/completions.ts
import type { Monaco } from '@monaco-editor/react';
import { getModuleMethods, isKnownModule } from './catalogue';
import type { CatalogueMethod } from './catalogue';
import { scanEnclosingScope } from './scopeScanner';
import { getVisibleSymbols, getMembers, resolveOwnerScopeName } from './symbolCatalogue';
import type { SymbolContext } from './symbolCatalogue';
import type { SymbolSnapshotEntry } from '../lib/CompilerLib/symbols';
import { symbolTypes } from '../lib/Basic4WebGL/symbolTypes';

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

// The constructor guard symbol (ConstructorRule's "at most one constructor"
// marker) isn't something a user ever types by name — it's invoked via
// `new ClassName(...)`, not a bare `constructor(...)` call — so it's excluded
// from dynamic completion candidates.
function isCompletableSymbol(s: SymbolSnapshotEntry): boolean {
  return !(s.kind === symbolTypes.Function && s.name.toLowerCase() === 'constructor');
}

function buildDynamicSnippet(s: SymbolSnapshotEntry): string {
  const params = s.parameters ?? [];
  if (params.length === 0) return s.kind === symbolTypes.Function ? `${s.name}()` : s.name;
  const paramSnippets = params.map((p, i) => `\${${i + 1}:${p.name}}`).join(', ');
  return `${s.name}(${paramSnippets})`;
}

function dynamicSymbolKind(monaco: Monaco, s: SymbolSnapshotEntry): number {
  switch (s.kind) {
    case symbolTypes.Function:
      return monaco.languages.CompletionItemKind.Function ?? monaco.languages.CompletionItemKind.Method;
    case symbolTypes.Class:
      return monaco.languages.CompletionItemKind.Class;
    case symbolTypes.Module:
      return monaco.languages.CompletionItemKind.Module;
    default:
      return monaco.languages.CompletionItemKind.Variable;
  }
}

function symbolToCompletionItem(
  monaco: Monaco,
  s: SymbolSnapshotEntry,
  range: { startLineNumber: number; endLineNumber: number; startColumn: number; endColumn: number }
) {
  return {
    label: s.name,
    kind: dynamicSymbolKind(monaco, s),
    insertText: buildDynamicSnippet(s),
    insertTextRules:
      s.kind === symbolTypes.Function ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
    documentation: s.className ? `${s.kind} (${s.className})` : s.kind,
    range,
  };
}

export function registerCompletionProvider(monaco: Monaco, symbolContext?: SymbolContext): { dispose(): void } {
  return monaco.languages.registerCompletionItemProvider('softBasic', {
    triggerCharacters: ['.'],
    provideCompletionItems(model, position) {
      const lineContent = model.getLineContent(position.lineNumber);
      // position.column is 1-based and is AFTER the '.' trigger character
      const textBeforeCursor = lineContent.substring(0, position.column - 1);
      const moduleName = parseCompletionModule(textBeforeCursor);

      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column,
        endColumn: position.column,
      };

      if (!moduleName) {
        // Bare-word branch: no dot-context — offer dynamic symbols visible at the cursor.
        if (!symbolContext) return { suggestions: [] };
        const scopeStack = scanEnclosingScope(model.getValue(), position.lineNumber, position.column);
        const symbols = getVisibleSymbols(
          symbolContext.getSymbols(),
          symbolContext.getActiveFilename() ?? '',
          scopeStack
        ).filter(isCompletableSymbol);
        return { suggestions: symbols.map((s) => symbolToCompletionItem(monaco, s, range)) };
      }

      if (isKnownModule(moduleName)) {
        const methods = getModuleMethods(moduleName);
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
      }

      // Dynamic fallback: the dot-context module isn't in the static catalogue —
      // try resolving it as a user-defined object/class/module instead.
      if (!symbolContext) return { suggestions: [] };
      const scopeStack = scanEnclosingScope(model.getValue(), position.lineNumber, position.column);
      const ownerScope = resolveOwnerScopeName(
        symbolContext.getSymbols(),
        moduleName,
        scopeStack,
        symbolContext.getActiveFilename() ?? ''
      );
      if (!ownerScope) return { suggestions: [] };
      const members = getMembers(symbolContext.getSymbols(), ownerScope).filter(isCompletableSymbol);
      return { suggestions: members.map((s) => symbolToCompletionItem(monaco, s, range)) };
    },
  });
}
