import Symbols, { SymbolScope } from "../../symbols";
import { symbolTypes } from "../symbolTypes";

export const isMatchingType = (expected: string, actual: string): boolean =>
  expected === actual || (expected === "Variable" && actual === "Parameter");

export const symbolRules = (table: Symbols, scope: SymbolScope): string => {
  if (scope.name !== "") {
    return "";
  }

  const declarations = table
    .getAll("Variable", scope)
    .filter((s) => s.type !== symbolTypes.Parameter)
    .map((s) => `let ${s.scope.name}_${s.name} = null`)
    .join(";\n");

  return declarations ? `${declarations};\n` : "";
};

export default symbolRules;
