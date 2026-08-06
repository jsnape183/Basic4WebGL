import Symbols, { Symbol, SymbolScope } from "../../symbols";
import { scopeTypes, symbolTypes } from "../symbolTypes";
import { formatSymbol } from "./jsRules/helpers/transpilerHelpers";

export const isMatchingType = (expected: string, actual: string): boolean =>
  expected === actual || (expected === "Variable" && actual === "Parameter");

/**
 * Roadmap issue #15: a class could declare an array field and a method of
 * the same name with no diagnostic at either declaration site — every
 * existing duplicate check is scoped per symbol *kind*, so 'Array' and
 * 'Function' never collide. At runtime the class body's inline method
 * assignment and the field's deferred initializer both write to the same
 * prototype property; the deferred one (always the field, per RootRule's
 * two-phase init split) always runs last and silently clobbers the method,
 * so the method is gone by the time anything calls it — "X is not a
 * function" with no compile-time warning.
 *
 * Injected into Symbols (see its constructor) so this Basic4WebGL-specific
 * "class inheritance" concept doesn't leak into the generic compiler layer.
 * Only fires for scope.type === Class — a `dim` inside a function body, or a
 * module-level declaration, isn't part of this two-phase split and isn't at
 * risk of this bug.
 *
 * Walks from the class currently being declared into, up through
 * parentClassName, checking each level (starting with the class itself, so
 * same-class collisions are caught too) for an existing symbol of the same
 * name but a *different* kind. A same-kind match (a child class overriding a
 * parent's method, or shadowing a parent's field) is not a collision and is
 * deliberately allowed through unchanged.
 */
export const findCrossKindCollision = (
  symbols: Symbols,
  name: string,
  type: string,
  scope: SymbolScope
): Symbol | undefined => {
  if (scope.type !== scopeTypes.Class) return undefined;

  let className: string | undefined = scope.name;
  const visited = new Set<string>();
  while (className && !visited.has(className)) {
    visited.add(className);

    const existing = symbols.findAnyInScope(name, className);
    if (existing && existing.type !== type) {
      return existing;
    }

    let classSymbol: Symbol | undefined;
    try {
      classSymbol = symbols.get(className, symbolTypes.Class);
    } catch {
      classSymbol = undefined;
    }
    className = classSymbol?.parentClassName;
  }
  return undefined;
};

export const symbolRules = (table: Symbols, scope: SymbolScope): string => {
  if (scope.name !== "" || scope.type !== "") {
    return "";
  }

  const declarations = table
    .getAll("Variable", scope)
    .filter((s) => s.type !== symbolTypes.Parameter)
    .map((s) => `let ${formatSymbol(s)} = null`)
    .join(";\n");

  return declarations ? `${declarations};\n` : "";
};

export default symbolRules;
