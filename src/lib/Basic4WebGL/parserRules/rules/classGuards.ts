import Symbols from '@CompilerLib/symbols';
import { scopeTypes, symbolTypes } from '../../symbolTypes';
import { CompilationError } from '@CompilerLib/errors';

export function assertInsideClass(symbolTable: Symbols): void {
  const scopeType = symbolTable.getScopeType();
  if (scopeType !== scopeTypes.Function && scopeType !== scopeTypes.Constructor) {
    throw new CompilationError("'self' can only be used inside a class method or constructor");
  }
  const fullScope = symbolTable.getFullScopeName();
  const topName = fullScope.split('.')[0];
  if (!topName || !symbolTable.check(topName, symbolTypes.Class)) {
    throw new CompilationError("'self' can only be used inside a class");
  }
}
