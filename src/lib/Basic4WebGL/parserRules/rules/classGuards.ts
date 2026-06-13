import Symbols from '@CompilerLib/symbols';
import { scopeTypes, symbolTypes } from '../../symbolTypes';
import { CompilationError } from '@CompilerLib/errors';

export function assertInsideClass(symbolTable: Symbols): void {
  // Use hasScopeOfType so that module-dispatch scopes pushed by ModuleRule
  // (e.g. when `self` appears as an argument: stage.add(self)) don't mask an
  // enclosing Constructor or Function scope.
  if (
    !symbolTable.hasScopeOfType(scopeTypes.Function) &&
    !symbolTable.hasScopeOfType(scopeTypes.Constructor)
  ) {
    throw new CompilationError("'self' can only be used inside a class method or constructor");
  }
  const fullScope = symbolTable.getFullScopeName();
  const topName = fullScope.split('.')[0];
  if (!topName || !symbolTable.check(topName, symbolTypes.Class)) {
    throw new CompilationError("'self' can only be used inside a class");
  }
}
