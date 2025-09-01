import Symbols, { SymbolScope } from '../symbols';

export type TranspilerConfig = {
  symbolRules: (symbolTable: Symbols, scope: SymbolScope) => string;
  terminationRules: (symbolTable: Symbols) => string;
};
