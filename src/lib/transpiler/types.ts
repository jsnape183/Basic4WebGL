import Symbols, { SymbolScope } from "../symbols";

export type TranspilerConfig = {
  transpilerRules: Record<number, Function>;
  symbolRules: (symbolTable: Symbols, scope: SymbolScope) => string;
  terminationRules: (symbolTable: Symbols) => string;
};
