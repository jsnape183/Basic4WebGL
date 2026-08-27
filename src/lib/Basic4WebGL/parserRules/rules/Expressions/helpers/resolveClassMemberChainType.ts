import Symbols, { Symbol } from '@CompilerLib/symbols';
import BuiltInType from '@CompilerLib/builtInTypes';
import findMemberInClassChain from './findMemberInClassChain';

/**
 * Resolve the dataType of a dotted member chain (`segments`) read off a value
 * whose class is already statically known — a typed local variable
 * (`dim e as Enemy`), a typed function parameter (`p as Enemy`), or a single
 * element read out of a typed array field (`dim enemies(4) as Enemy`,
 * `self.enemies(i)`).
 *
 * This is the non-`self`-rooted counterpart of resolveMemberChainType: that
 * helper starts by looking the FIRST segment up against the enclosing class's
 * own scope (because a bare `self.x` chain's root name isn't known to be
 * class-typed until it's looked up). Here the root's class is already known
 * up front — the caller found it some other way (a symbol's `classSymbol`,
 * or an array field's own `classSymbol`) — so every segment, including the
 * first, is resolved the same way: against that known class, walking its own
 * inheritance chain.
 *
 * Without this, expressions like `self.enemies(i).transformY`,
 * `e.transformY` (where `e = self.enemies(i)` was assigned from a typed
 * array element), or `p.transformY` (a typed parameter) never had their real
 * field type resolved at all — the nodes that represent them
 * (TypedElementAccessNode, PropertyTermNode for a non-self property chain)
 * were built with no dataType, which defaults to a generic Object/Unknown
 * type and then fails strict boolean/numeric/string type checks even though
 * the field's real type is perfectly well known at compile time.
 *
 * Returns undefined if any segment can't be resolved — callers fall back to
 * a generic Object type in that case, exactly as the self-rooted path does.
 */
export default function resolveClassMemberChainType(
  symbolTable: Symbols,
  rootClassName: string,
  segments: string[]
): BuiltInType | undefined {
  if (segments.length === 0) return undefined;

  let symbol: Symbol | undefined = findMemberInClassChain(
    symbolTable,
    rootClassName,
    segments[0]
  );
  if (!symbol) return undefined;

  for (let i = 1; i < segments.length; i++) {
    const classSymbol = (symbol as any).classSymbol as Symbol | undefined;
    if (!classSymbol) return undefined;

    symbol = findMemberInClassChain(symbolTable, classSymbol.name, segments[i]);
    if (!symbol) return undefined;
  }

  return symbol.dataType;
}
