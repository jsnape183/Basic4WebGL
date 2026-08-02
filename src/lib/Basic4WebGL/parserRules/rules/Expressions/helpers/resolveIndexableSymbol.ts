import Symbols, { Symbol } from '@CompilerLib/symbols';
import { symbolTypes } from '../../../../symbolTypes';

// Resolves a symbol for indexed access (dict["key"] / arr(i)). Prefers the
// strictly-declared kind (Dictionary/Array), which guarantees the runtime
// value really is a Map/array. Falls back to a plain Variable-kind symbol
// so a `dim x` that was assigned a dict/array return value from a function
// call can still be indexed — callers must gate this with a token
// lookahead ([ or ( already seen) before calling, so ordinary variable
// assignment (`x = 5`) is never affected.
//
// `isMatchingType` (transpilerRules/symbolRules.ts) makes a "Variable" kind
// request also match a "Parameter"-kind symbol — useful for the one call
// site that pre-dates this fallback and intentionally supports by-ref array
// parameters (VariableRule.ts's array-write path), but NOT desired for any
// other call site: dict reads/writes and array reads never supported
// indexing a bare parameter before this feature existed, and silently
// granting that now would skip the runtime safety guard those call sites
// rely on `type === symbolTypes.Variable` to trigger. Default is to exclude
// Parameter-kind symbols from the fallback (throwing the same "has not been
// declared" error a strict lookup would); pass `includeParameterFallback:
// true` only for the one call site that needs the pre-existing behavior.
export default function resolveIndexableSymbol(
  symbolTable: Symbols,
  name: string,
  preferredKind: string,
  includeParameterFallback = false
): Symbol {
  if (symbolTable.check(name, preferredKind)) {
    return symbolTable.get(name, preferredKind);
  }
  if (!includeParameterFallback && symbolTable.check(name, symbolTypes.Parameter)) {
    return symbolTable.get(name, preferredKind); // re-throws the natural "has not been declared" error
  }
  return symbolTable.get(name, symbolTypes.Variable);
}
