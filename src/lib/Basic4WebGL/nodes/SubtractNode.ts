import { getBuiltInType } from '../../builtInTypes/builtInTypeFactory';
import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseArithmaticValidatorNode from '../validators/BaseArithmaticValidatorNode';

class SubtractNode extends BaseArithmaticValidatorNode {
  constructor(data: any | undefined, children: Tree[]) {
    super(nodeTypes.Subtract, data, children);
    this.dataType = getBuiltInType(builtInTypes.Number);
  }
}

export default SubtractNode;
