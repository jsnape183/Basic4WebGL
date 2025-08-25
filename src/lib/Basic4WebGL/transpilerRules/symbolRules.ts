import Symbols, { SymbolScope } from "../../symbols";
import { symbolTypes } from "../symbolTypes";

export const isMatchingType = (expected: string, actual: string): boolean =>
  expected === actual || (expected === "Variable" && actual === "Parameter");

export const symbolRules = (table: Symbols, scope: SymbolScope): string => {
  let variables = "";
  if (scope.name === "") {
    table
      .getAll("Variable", scope)
      .filter((s) => s.type !== symbolTypes.Parameter)
      .map((s) => `let ${s.scope.name}_${s.name} = null`).join(`;
        `) +
      `;
     `;
  }

  const globals = variables;
  let onTick = "";
  let onKeyDown = "";
  let onPointerDown = "";
  let onPointerMove = "";

  return `${globals}${onTick}${onKeyDown}${onPointerDown}${onPointerMove}`;
};

export default symbolRules;
