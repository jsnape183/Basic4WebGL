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
  Constant: 'Constant',
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

export class ConstantSymbol extends Symbol {
  value: number | string | boolean;
  valueKind: 'number' | 'string' | 'boolean';
  constructor(
    name: string,
    type: string,
    scope: SymbolScope,
    fullScope: string,
    value: number | string | boolean,
    valueKind: 'number' | 'string' | 'boolean'
  ) {
    super(name, type, scope, fullScope, getBuiltInType(builtInTypes.Variant));
    this.value = value;
    this.valueKind = valueKind;
  }
}

export class ArraySymbol extends Symbol {
  dimensions: number;
  classSymbol: any | null;
  constructor(
    name: string,
    type: string,
    scope: SymbolScope,
    fullScope: string,
    dimensions: number,
    classSymbol: any = null
  ) {
    super(name, type, scope, fullScope, getBuiltInType(builtInTypes.Variant));
    this.dimensions = dimensions;
    this.classSymbol = classSymbol;
  }
}

export class DictionarySymbol extends Symbol {
  classSymbol: any | null;
  constructor(
    name: string,
    type: string,
    scope: SymbolScope,
    fullScope: string,
    classSymbol: any = null
  ) {
    super(name, type, scope, fullScope, getBuiltInType(builtInTypes.Variant));
    this.classSymbol = classSymbol;
  }
}
