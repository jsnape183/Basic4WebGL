import { Tree } from '../../tree';
import builtInTypes from '../builtInTypes';
import nodeTypes from '../nodeTypes';
import BaseParameterValidatorNode from '../validators/BaseParameterValidatorNode';

class FunctionCallNode extends BaseParameterValidatorNode {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.FunctionCall, data, children);
    this.dataType = builtInTypes.Variant;
  }
}

export default FunctionCallNode;
