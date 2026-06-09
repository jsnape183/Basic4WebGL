import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class VariableDimAssignNode extends Tree {
  constructor(data: any | undefined, exprChild: Tree, loc?: SourceLocation) {
    super(nodeTypes.VariableDimAssign, data, [exprChild]);
    this.loc = loc;
  }
}

export default VariableDimAssignNode;
