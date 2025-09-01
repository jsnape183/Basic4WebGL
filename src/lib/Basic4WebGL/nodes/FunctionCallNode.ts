import { Tree } from '../../tree';
import nodeTypes from '../nodeTypes';
import BaseParameterValidatorNode from '../validators/BaseParameterValidatorNode';
import { Symbol } from '../../symbols';

class FunctionCallNode extends BaseParameterValidatorNode {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.FunctionCall, data, children);
    this.dataType = (data as Symbol).dataType;
  }
}

export default FunctionCallNode;
