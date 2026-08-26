import Symbols, { Symbol } from '@CompilerLib/symbols';
import BuiltInType from '@CompilerLib/builtInTypes';
import { symbolTypes } from '../../../../symbolTypes';
import resolveSelfMember from './resolveSelfMember';

/**
 * Resolve the dataType of a dotted member chain rooted at `self`
 * (`self.a.b.c...`), walking INTO each intermediate class-typed field's own
 * class to resolve the next segment — rather than only ever resolving names
 * against the enclosing class's scope.
 *
 * Why this exists: SelfFactorRule's chain-walking loop builds up the full
 * `chain` string (`this.boss.dead`) as it consumes each `.segment`, but for
 * a *plain* multi-level field read (no trailing method call) it used to
 * fall through to a single lookup keyed on the FIRST segment's name
 * (`boss`) against the OUTER class's scope. Two problems with that: (1) the
 * final segment's name (`dead`) was never looked up at all, and (2) `boss`
 * is an Object-kind symbol (`dim boss as Boss`), which a Variable-kind
 * lookup never matches, so resolution silently failed and the caller fell
 * back to a generic Object type — which then fails strict boolean/numeric/
 * string type checks (`if self.boss.dead then`, `self.boss.dead and true`).
 *
 * This walks the chain one segment at a time: the first segment is resolved
 * against the enclosing class (mirroring the existing single-level
 * behaviour, inheritance and local-variable shadowing included); each
 * subsequent segment is resolved against the *previous segment's own
 * class*, found via its `classSymbol`, itself walking that class's own
 * inheritance chain. The final segment's resolved symbol's dataType is the
 * chain's type.
 *
 * Returns undefined if any segment can't be resolved (e.g. the chain ends
 * on something that isn't a class instance, or a genuinely undeclared
 * name) — callers fall back to a generic Object type in that case, exactly
 * as the pre-existing single-level path already does.
 */
export default function resolveMemberChainType(
  symbolTable: Symbols,
  segments: string[]
): BuiltInType | undefined {
  if (segments.length === 0) return undefined;

  // First segment: same lookup a single-level `self.x` read already uses —
  // scoped to the enclosing class (and its ancestors), kind-agnostic here
  // only in the sense that it accepts any symbol carrying a dataType, since
  // this first segment may itself be Variable- or Object-kind depending on
  // whether it's a primitive field or another class-typed field.
  let symbol: Symbol | undefined =
    resolveSelfMember(
      symbolTable,
      segments[0],
      symbolTypes.Variable,
      (s) => s.dataType !== undefined
    ) ?? resolveSelfMember(symbolTable, segments[0], symbolTypes.Object);

  if (!symbol) return undefined;

  for (let i = 1; i < segments.length; i++) {
    const classSymbol = (symbol as any).classSymbol as Symbol | undefined;
    if (!classSymbol) return undefined;

    symbol = findMemberInClassChain(symbolTable, classSymbol.name, segments[i]);
    if (!symbol) return undefined;
  }

  return symbol.dataType;
}

/** Kind-agnostic member lookup scoped to a specific class, walking that
 * class's own inheritance chain — mirrors resolveSelfMember's ancestor walk,
 * but starting from an arbitrary class name rather than the current scope,
 * and matching any symbol kind (Variable, Object, Array, Dictionary) since
 * the caller doesn't know in advance what kind the next segment will be. */
function findMemberInClassChain(
  symbolTable: Symbols,
  className: string,
  memberName: string
): Symbol | undefined {
  let searchClass: string | undefined = className;
  while (searchClass !== undefined) {
    const found = symbolTable.findAnyInScope(memberName, searchClass);
    if (found) return found;
    try {
      searchClass = symbolTable.get(searchClass, symbolTypes.Class).parentClassName;
    } catch {
      return undefined;
    }
  }
  return undefined;
}
