import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseAssignableValidatorNode from '../validators/BaseAssignableValidatorNode';

class ArrayAssignNode extends BaseAssignableValidatorNode {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.ArrayAssign, data, children);
    this.dataType = builtInTypes.Variant;
  }
}

export default ArrayAssignNode;
