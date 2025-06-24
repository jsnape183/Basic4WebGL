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

  if (
    scope.name === "" &&
    !table.check("onupdate", "Function", { name: "main", type: "" })
  )
    onTick = `const main_onupdate = () => {};
      `;
  if (
    scope.name === "" &&
    !table.check("onkeydown", "Function", { name: "main", type: "" })
  )
    onKeyDown = `const main_onkeydown = () => {};
      `;

  if (
    scope.name === "" &&
    !table.check("onpointerdown", "Function", { name: "main", type: "" })
  )
    onPointerDown = `const main_onpointerdown = () => {};
      `;

  if (
    scope.name === "" &&
    !table.check("onpointermove", "Function", { name: "main", type: "" })
  )
    onPointerMove = `const main_onpointermove = () => {};
      `;

  return `${globals}${onTick}${onKeyDown}${onPointerDown}${onPointerMove}`;
};

export default symbolRules;
