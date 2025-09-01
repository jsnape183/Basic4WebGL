import { Tree } from '@CompilerLib/tree';
import nodeTypes from '../nodeTypes';
import BaseParameterValidatorNode from '../validators/BaseParameterValidatorNode';
import { Symbol } from '@CompilerLib/symbols';

class FunctionCallNode extends BaseParameterValidatorNode {
  constructor(data: any | undefined, children: Tree) {
    super(nodeTypes.FunctionCall, data, children);
    this.dataType = (data as Symbol).dataType;
  }
}

export default FunctionCallNode;
