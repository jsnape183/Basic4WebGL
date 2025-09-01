import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import BaseAssignableValidatorNode from '../validators/BaseAssignableValidatorNode';

class AssignNode extends BaseAssignableValidatorNode {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.Assign, data, children);
  }
}

export default AssignNode;
