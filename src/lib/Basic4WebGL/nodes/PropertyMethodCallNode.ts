import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Represents a chained method call in statement context: obj.prop.method(args)
 * data is the fully-formatted chain string (e.g. "onenter_bunny.transform.setposition")
 * children[0] is the ExpressionList of arguments
 */
class PropertyMethodCallNode extends Tree {
  constructor(chain: string, args: Tree, loc?: SourceLocation) {
    super(nodeTypes.PropertyMethodCall, chain, [args]);
    this.loc = loc;
  }
}

export default PropertyMethodCallNode;
