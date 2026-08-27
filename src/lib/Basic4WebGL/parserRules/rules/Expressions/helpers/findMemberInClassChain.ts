import Symbols, { Symbol } from '@CompilerLib/symbols';
import { symbolTypes } from '../../../../symbolTypes';

/**
 * Kind-agnostic member lookup scoped to a specific class, walking that
 * class's own inheritance chain — matches any symbol kind (Variable, Object,
 * Array, Dictionary) since callers generally don't know in advance what kind
 * a given member name will turn out to be.
 *
 * Shared by resolveMemberChainType (self-rooted chains) and
 * resolveClassMemberChainType (chains rooted at a value of statically-known
 * class, e.g. a typed local variable, typed parameter, or the element type
 * of a `dim x(n) as ClassName` array) — both ultimately need the same
 * "resolve the next segment against this class, walking ancestors" step.
 */
export default function findMemberInClassChain(
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
