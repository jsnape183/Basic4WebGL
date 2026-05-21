import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import BaseAssignableValidatorNode from '../validators/BaseAssignableValidatorNode';
import type { SourceLocation } from '@CompilerLib/compiler/types';

class AssignNode extends BaseAssignableValidatorNode {
  constructor(data: any | undefined, children: Tree, loc?: SourceLocation) {
    super(nodeTypes.Assign, data, children);
    this.loc = loc;
  }
}

export default AssignNode;
