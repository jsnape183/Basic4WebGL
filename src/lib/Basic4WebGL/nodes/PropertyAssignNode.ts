import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

/**
 * Represents a property chain assignment: obj.prop.subprop = expr
 * data.chain is the fully-formatted LHS string (e.g. "onenter_mycar.carkey.keyless")
 * children[0] is the RHS expression
 */
class PropertyAssignNode extends Tree {
  constructor(data: { chain: string }, expr: Tree, loc?: SourceLocation) {
    super(nodeTypes.PropertyAssign, data, [expr]);
    this.loc = loc;
  }
}

export default PropertyAssignNode;
