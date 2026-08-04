import { Symbol } from '@CompilerLib/symbols';
import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Indexed READ of a class-scope array field through `self`, in expression
 * context: `self.coins(i)` → `this.coins[i]`.
 *
 * The read-side counterpart of SelfArrayAssignNode (`self.coins(i) = v`).
 * `data.chain` is the formatted receiver chain (e.g. "this.coins");
 * `data.symbol` is the resolved class-scope ArraySymbol, carried so the node
 * can report the field's declared dataType to the type checker — the same
 * thing ArrayLookupNode does for non-self arrays.
 *
 * children[0] is the ExpressionList of index expressions; a multi-dimensional
 * field has one child per dimension.
 */
class SelfArrayLookupNode extends Tree {
  constructor(
    data: { chain: string; symbol: Symbol },
    children: Tree[],
    loc?: SourceLocation
  ) {
    super(nodeTypes.SelfArrayLookup, data, children);
    this.dataType = data.symbol.dataType;
    this.loc = loc;
  }
}

export default SelfArrayLookupNode;
