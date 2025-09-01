import { Symbol, SymbolScope } from '@CompilerLib/symbols';
import builtInTypes from './builtInTypes';
import ObjectType from './builtInTypes/definitions/ObjectType';

export const scopeTypes = {
  Globals: '',
  Function: 'Function',
  Module: 'Module',
  Class: 'Class',
};

export const symbolTypes = {
  Variable: 'Variable',
  Function: 'Function',
  Array: 'Array',
  Parameter: 'Parameter',
  Module: 'Module',
  Object: 'Object',
  Class: 'Class',
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
    super(name, type, scope, fullScope, new ObjectType(`${fullScope}.${name}`));
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
    super(name, type, scope, fullScope, builtInTypes.Variant);
    this.dimensions = dimensions;
  }
}
