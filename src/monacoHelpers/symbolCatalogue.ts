// src/monacoHelpers/symbolCatalogue.ts
//
// Dynamic mirror of the static `catalogue.ts`: operates on a
// `SymbolSnapshotEntry[]` (from `Symbols.getSnapshot()`) plus the active
// filename and the live scope stack from `scopeScanner.ts`.
//
// All matching is case-insensitive on both sides. This matters for two
// reasons confirmed against the real compiler (not just the design doc):
//   - VariableListRule's param-name capture does not lowercase (unlike
//     DimRule/FunctionRule), so stored casing for parameters isn't reliable.
//   - File/class scope names ARE always lowercase in the symbol table
//     (`lexer/index.ts` lowercases the filename before it ever reaches
//     RootRule), even though `activeFilename` here comes from `IFile.name`,
//     which preserves whatever case the user gave the file. Every scope-name
//     comparison below lowercases both sides to stay correct regardless.

import type { SymbolSnapshotEntry } from '../lib/CompilerLib/symbols';
import { symbolTypes } from '../lib/Basic4WebGL/symbolTypes';

/**
 * Accessor pair threaded into the completion/hover/signature providers so they
 * stay pure/testable while still reading the latest debounced symbol snapshot.
 * Providers register once per `monaco` instance mount, so they can't close
 * over a `symbols` value that changes every debounce cycle — the caller
 * (`Editor/index.tsx`) keeps the latest snapshot in a ref and passes these
 * accessor functions in instead.
 */
export type SymbolContext = {
  getSymbols: () => SymbolSnapshotEntry[];
  getActiveFilename: () => string | undefined;
};

/**
 * Bare-word completion candidates: globals (scope name ''), the file's own
 * module scope, and each frame of the live scope stack.
 */
export function getVisibleSymbols(
  snapshot: SymbolSnapshotEntry[],
  activeFilename: string,
  scopeStack: string[]
): SymbolSnapshotEntry[] {
  const visibleScopeNames = new Set<string>([
    '',
    activeFilename.toLowerCase(),
    ...scopeStack.map((s) => s.toLowerCase()),
  ]);
  return snapshot.filter((s) => visibleScopeNames.has(s.scopeName.toLowerCase()));
}

/**
 * Dot-completion candidates for a resolved owner scope name (see
 * `resolveOwnerScopeName` for how the caller decides which scope name
 * "instance.member" or "arr(i).member" maps to).
 */
export function getMembers(snapshot: SymbolSnapshotEntry[], ownerScopeName: string): SymbolSnapshotEntry[] {
  const target = ownerScopeName.toLowerCase();
  return snapshot.filter((s) => s.scopeName.toLowerCase() === target);
}

/**
 * Given bare identifier text before a '.', finds its declaration using the
 * same scope-priority order as `Symbols.retrieveSymbol` (innermost scope-stack
 * frame first, then the file's own module scope, then globals) and returns
 * which scope name owns its members:
 *   Object                            -> the identifier's own name
 *   Array | Dictionary with className -> the className itself
 *   Module (another file)             -> the identifier itself
 *   otherwise                         -> null (no member completions)
 */
export function resolveOwnerScopeName(
  snapshot: SymbolSnapshotEntry[],
  identifierName: string,
  scopeStack: string[],
  activeFilename: string
): string | null {
  const name = identifierName.toLowerCase();
  // Lowest to highest priority, mirroring Symbols' scope stack (outermost pushed
  // first): globals, then the file's own module scope, then each scope-stack
  // frame from outermost to innermost.
  const priorityScopes = ['', activeFilename.toLowerCase(), ...scopeStack.map((s) => s.toLowerCase())];

  let best: SymbolSnapshotEntry | undefined;
  let bestPriority = -1;
  for (const entry of snapshot) {
    if (entry.name.toLowerCase() !== name) continue;
    const priority = priorityScopes.lastIndexOf(entry.scopeName.toLowerCase());
    if (priority === -1) continue;
    if (priority > bestPriority) {
      bestPriority = priority;
      best = entry;
    }
  }
  if (!best) return null;

  switch (best.kind) {
    case symbolTypes.Object:
      return best.name.toLowerCase();
    case symbolTypes.Array:
    case symbolTypes.Dictionary:
      return best.className ? best.className.toLowerCase() : null;
    case symbolTypes.Module:
      return best.name.toLowerCase();
    default:
      return null;
  }
}

/**
 * Function/constructor signature lookup. For a regular Function, uses
 * `.parameters` directly. For a constructor (functionName === 'constructor'),
 * `.parameters` is unreliable — ConstructorRule registers its "at most one
 * constructor" guard symbol with a hardcoded `parameters: []` — so this falls
 * back to filtering the snapshot for `fullScope === '${scopeName}.constructor'
 * && isParam`, in table order (declaration order).
 */
export function getCallableSignature(
  snapshot: SymbolSnapshotEntry[],
  scopeName: string,
  functionName: string
): { name: string; params: { name: string; className?: string }[] } | undefined {
  const scopeLower = scopeName.toLowerCase();
  const fnNameLower = functionName.toLowerCase();

  const fn = snapshot.find(
    (s) =>
      s.kind === symbolTypes.Function &&
      s.name.toLowerCase() === fnNameLower &&
      s.scopeName.toLowerCase() === scopeLower
  );
  if (!fn) return undefined;

  if (fnNameLower === 'constructor') {
    const ctorFullScope = `${scopeLower}.constructor`;
    const params = snapshot
      .filter((s) => s.isParam && s.fullScope.toLowerCase() === ctorFullScope)
      .map((p) => ({ name: p.name, className: p.className }));
    return { name: fn.name, params };
  }

  return {
    name: fn.name,
    params: (fn.parameters ?? []).map((p) => ({ name: p.name, className: p.className })),
  };
}
