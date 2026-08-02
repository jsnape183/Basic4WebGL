import Symbols, { Symbol } from '@CompilerLib/symbols';
import { symbolTypes } from '../../../../symbolTypes';

// Resolves a symbol for indexed access (dict["key"] / arr(i)). Prefers the
// strictly-declared kind (Dictionary/Array), which guarantees the runtime
// value really is a Map/array. Falls back to a plain Variable-kind symbol
// so a `dim x` that was assigned a dict/array return value from a function
// call can still be indexed — callers must gate this with a token
// lookahead ([ or ( already seen) before calling, so ordinary variable
// assignment (`x = 5`) is never affected.
export default function resolveIndexableSymbol(
  symbolTable: Symbols,
  name: string,
  preferredKind: string
): Symbol {
  if (symbolTable.check(name, preferredKind)) {
    return symbolTable.get(name, preferredKind);
  }
  return symbolTable.get(name, symbolTypes.Variable);
}
