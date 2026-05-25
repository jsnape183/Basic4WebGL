import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';
import { getBuiltInType } from '@CompilerLib/builtInTypes/builtInTypeFactory';
import builtInTypes from '../builtInTypes';

/**
 * Represents a chained method call in expression context: obj.prop.method(args)
 * data is the fully-formatted chain string (e.g. "onenter_bunny.transform.getvalue")
 * children[0] is the ExpressionList of arguments
 * No semicolon — used as sub-expression (e.g. RHS of assignment, function arg).
 *
 * dataType is Variant: the return type is not statically known (the chain bypasses
 * symbol resolution), so we treat it as dynamically typed — consistent with CallTermNode.
 */
class PropertyMethodTermNode extends Tree {
  constructor(chain: string, args: Tree, loc?: SourceLocation) {
    super(nodeTypes.PropertyMethodTerm, chain, [args]);
    this.dataType = getBuiltInType(builtInTypes.Variant);
    this.loc = loc;
  }
}

export default PropertyMethodTermNode;
