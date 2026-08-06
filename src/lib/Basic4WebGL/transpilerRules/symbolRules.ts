import Symbols, { Symbol, SymbolScope } from "../../symbols";
import { scopeTypes, symbolTypes } from "../symbolTypes";
import { formatSymbol } from "./jsRules/helpers/transpilerHelpers";

export const isMatchingType = (expected: string, actual: string): boolean =>
  expected === actual || (expected === "Variable" && actual === "Parameter");

/**
 * Roadmap issues #15/#22: a class (or a module — a plain .bas file's own
 * top-level scope) could declare an array field and a function of the same
 * name with no diagnostic at either declaration site — every existing
 * duplicate check is scoped per symbol *kind*, so 'Array' and 'Function'
 * never collide. At runtime the root's inline function assignment and the
 * field's deferred initializer both write to the same property (a class
 * prototype, or the module's own object); the deferred one (always the
 * field, per RootRule's two-phase init split) always runs last and silently
 * clobbers the function, so it's gone by the time anything calls it — "X is
 * not a function" with no compile-time warning.
 *
 * Injected into Symbols (see its constructor) so this Basic4WebGL-specific
 * "class inheritance" concept doesn't leak into the generic compiler layer.
 * Only fires for a Class or module/global root scope — a `dim` inside a
 * function body isn't part of this two-phase split and isn't at risk of
 * this bug.
 *
 * Walks from the class (or module) currently being declared into, up
 * through parentClassName, checking each level (starting with the
 * class/module itself, so same-scope collisions are caught too) for an
 * existing symbol of the same name but a *different* kind. A module has no
 * parentClassName, so for module scope this is just the local check — the
 * loop's first iteration. A same-kind match (a child class overriding a
 * parent's method, or shadowing a parent's field) is not a collision and is
 * deliberately allowed through unchanged.
 */
export const findCrossKindCollision = (
  symbols: Symbols,
  name: string,
  type: string,
  scope: SymbolScope
): Symbol | undefined => {
  if (scope.type !== scopeTypes.Class && scope.type !== scopeTypes.Globals) return undefined;

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
