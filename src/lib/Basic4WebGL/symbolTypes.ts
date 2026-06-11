import { Symbol, SymbolScope } from '@CompilerLib/symbols';
import builtInTypes from './builtInTypes';
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';

export const scopeTypes = {
  Globals: '',
  Function: 'Function',
  Module: 'Module',
  Class: 'Class',
  Constructor: 'Constructor',
};

export const symbolTypes = {
  Variable: 'Variable',
  Function: 'Function',
  Array: 'Array',
  Parameter: 'Parameter',
  Module: 'Module',
  Object: 'Object',
  Class: 'Class',
  Dictionary: 'Dictionary',
};

export class FunctionSymbol extends Symbol {
  parameters: Array<Symbol>;
  constructor(
    name: string,
    type: string,
    scope: SymbolScope,
    fullScope: string,
    parameters: Array<Symbol> = new Array<Symbol>()
  ) {
    super(name, type, scope, fullScope, getBuiltInType(builtInTypes.Variant));
    this.parameters = parameters;
  }
}

export class ArraySymbol extends Symbol {
  dimensions: number;
  constructor(
    name: string,
    type: string,
    scope: SymbolScope,
    fullScope: string,
    dimensions: number
  ) {
    super(name, type, scope, fullScope, getBuiltInType(builtInTypes.Variant));
    this.dimensions = dimensions;
  }
}

export class DictionarySymbol extends Symbol {
  constructor(
    name: string,
    type: string,
    scope: SymbolScope,
    fullScope: string
  ) {
    super(name, type, scope, fullScope, getBuiltInType(builtInTypes.Variant));
  }
}
