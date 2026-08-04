import Symbols, { Symbol } from '@CompilerLib/symbols';
import { symbolTypes } from '../../../../symbolTypes';

/**
 * Resolve a `self.<member>` reference against the enclosing class's own scope,
 * walking up the inheritance chain so members declared on an ancestor resolve
 * too.
 *
 * Deliberately scoped to the class rather than the ordinary symbol lookup: a
 * local variable inside the method may share the member's name, and `self.x`
 * must always mean the class's `x`, never the local one.
 *
 * `accept` lets a caller keep walking past a symbol that matched by name and
 * kind but is not usable for its purpose (the dataType lookup uses it to skip
 * an ancestor whose declaration carried no type and keep searching upwards).
 *
 * Returns undefined when no matching member exists anywhere in the chain.
 */
export default function resolveSelfMember(
  symbolTable: Symbols,
  memberName: string,
  kind: string,
  accept: (symbol: Symbol) => boolean = () => true
): Symbol | undefined {
  // Inside a class the full scope name is `<class>.<method>`; the class is the
  // first segment.
  let searchClass: string | undefined = symbolTable.getFullScopeName().split('.')[0];

  while (searchClass !== undefined) {
    let found: Symbol | undefined;
    try {
      found = symbolTable.getInScope(memberName, kind, searchClass);
    } catch {
      found = undefined;
    }
    if (found && accept(found)) {
      return found;
    }
    try {
      searchClass = symbolTable.get(searchClass, symbolTypes.Class).parentClassName;
    } catch {
      return undefined;
    }
  }
  return undefined;
}
