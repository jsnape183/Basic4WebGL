import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Represents a chained method call in expression context: obj.prop.method(args)
 * data is the fully-formatted chain string (e.g. "onenter_bunny.transform.x")
 * children[0] is the ExpressionList of arguments
 * No semicolon — used as sub-expression (e.g. RHS of assignment, function arg).
 */
class PropertyMethodTermNode extends Tree {
  constructor(chain: string, args: Tree, loc?: SourceLocation) {
    super(nodeTypes.PropertyMethodTerm, chain, [args]);
    this.loc = loc;
  }
}

export default PropertyMethodTermNode;
